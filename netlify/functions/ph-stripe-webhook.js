/**
 * ph-stripe-webhook — Stripe webhook receiver
 * Handles: checkout.session.completed → saves order to pinkhalo.orders + order_items
 * Also handles: payment_intent.payment_failed → marks order as cancelled
 *
 * Setup in Stripe Dashboard:
 *   Endpoint URL: https://YOUR_SITE.netlify.app/.netlify/functions/ph-stripe-webhook
 *   Events: checkout.session.completed, payment_intent.payment_failed
 *   Then copy the webhook signing secret into STRIPE_WEBHOOK_SECRET env var.
 */

import Stripe from 'stripe';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { mailConfigured, sendMail } from './_mail.js';

const STRIPE_SECRET         = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL          = process.env.SUPABASE_URL  || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY          = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SCHEMA                = process.env.SUPABASE_SCHEMA || process.env.PH_SCHEMA || process.env.VITE_SUPABASE_SCHEMA || 'public';

function supabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: SCHEMA },
    auth: { persistSession: false }
  });
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  if (!STRIPE_SECRET) {
    return { statusCode: 500, body: 'Stripe not configured' };
  }

  const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2022-11-15' });
  let stripeEvent;

  // Verify signature if webhook secret is configured
  if (STRIPE_WEBHOOK_SECRET) {
    const sig = event.headers['stripe-signature'];
    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return { statusCode: 400, body: `Webhook error: ${err.message}` };
    }
  } else {
    // Dev mode — no signature verification
    try {
      stripeEvent = JSON.parse(event.body);
    } catch {
      return { statusCode: 400, body: 'Invalid JSON' };
    }
  }

  const db = supabase();

  // ── checkout.session.completed ─────────────────────────────
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    // Expand line items to get product details
    let lineItems = [];
    try {
      const expanded = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items.data.price.product']
      });
      lineItems = expanded.line_items?.data || [];
    } catch (err) {
      console.error('Could not expand line items:', err.message);
    }

    // Build order
    const shipping = session.shipping_details || {};
    const addr = shipping.address || {};

    const order = {
      stripe_session_id:        session.id,
      stripe_payment_intent_id: session.payment_intent,
      status:                   'paid',
      customer_email:           session.customer_details?.email || session.customer_email || null,
      customer_name:            session.customer_details?.name || shipping.name || null,
      guest_session_id:         session.metadata?.guest_session_id || null,
      customer_mode:            session.metadata?.customer_mode || 'guest',
      account_email:            session.metadata?.account_email || null,
      shipping_address: {
        name:    shipping.name,
        line1:   addr.line1,
        line2:   addr.line2,
        city:    addr.city,
        state:   addr.state,
        zip:     addr.postal_code,
        country: addr.country,
      },
      subtotal:      (session.amount_subtotal || 0) / 100,
      shipping_cost: (session.shipping_cost?.amount_total || 0) / 100,
      tax:           (session.total_details?.amount_tax || 0) / 100,
      total:         (session.amount_total || 0) / 100,
    };

    // Check for duplicate
    const { data: existing } = await db
      .from('orders')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle();

    if (existing) {
      console.log('Duplicate webhook for session', session.id, '— skipping');
      return { statusCode: 200, body: 'ok' };
    }

    // Generate the id here: the anon role may insert orders but cannot read
    // them back (column grants protect customer PII), so no .select() allowed.
    const newOrder = { id: randomUUID(), ...order };
    const { error: orderError } = await db
      .from('orders')
      .insert(newOrder);

    if (orderError) {
      console.error('Failed to insert order:', orderError.message);
      return { statusCode: 500, body: orderError.message };
    }

    // Insert order items
    if (lineItems.length > 0 && newOrder?.id) {
      const productIds = lineItems
        .map(item => item.price?.product?.metadata?.product_id)
        .filter(Boolean);
      const { data: fulfillmentProducts } = productIds.length
        ? await db.from('products').select('id, manufacturer_id, fulfillment_method').in('id', productIds)
        : { data: [] };
      const fulfillmentByProduct = new Map((fulfillmentProducts || []).map(product => [product.id, product]));
      const items = lineItems.map(item => ({
        ...(() => {
          const productId = item.price?.product?.metadata?.product_id || null;
          const product = productId ? fulfillmentByProduct.get(productId) : null;
          return {
            manufacturer_id: product?.manufacturer_id || null,
            fulfillment_status: product?.fulfillment_method === 'in_house' ? 'pending' : 'unassigned',
          };
        })(),
        order_id:     newOrder.id,
        product_id:   item.price?.product?.metadata?.product_id || null,
        variant_id:   item.price?.product?.metadata?.variant_id || null,
        variant_name: item.price?.product?.metadata?.variant_name || null,
        product_name: item.description || item.price?.product?.name || 'Product',
        price:        (item.amount_total || 0) / 100 / (item.quantity || 1),
        quantity:     item.quantity || 1,
        image_url:    item.price?.product?.images?.[0] || null,
      }));
      const { error: itemsError } = await db.from('order_items').insert(items);
      if (itemsError) console.error('Failed to insert order items:', itemsError.message);
    }

    console.log('Order saved:', newOrder.id, 'for', order.customer_email);

    // Order confirmation receipt from sales@ — never let email failure
    // break webhook acknowledgment (Stripe would retry and duplicate work).
    if (order.customer_email && mailConfigured()) {
      try {
        const money = (n) => `$${Number(n || 0).toFixed(2)}`;
        const itemLines = lineItems.map(item =>
          `${item.description || item.price?.product?.name || 'Product'} × ${item.quantity || 1} — ${money((item.amount_total || 0) / 100)}`
        );
        const addr = order.shipping_address || {};
        const addressText = [addr.name, addr.line1, addr.line2, [addr.city, addr.state, addr.zip].filter(Boolean).join(', '), addr.country]
          .filter(Boolean).join('\n');
        const orderRef = newOrder.id.slice(0, 8).toUpperCase();
        const text = [
          `Thank you for your Pink Halo Co. order!`,
          ``,
          `Order reference: ${orderRef}`,
          ``,
          `Items:`,
          ...itemLines.map(l => `  ${l}`),
          ``,
          `Subtotal: ${money(order.subtotal)}`,
          order.shipping_cost ? `Shipping: ${money(order.shipping_cost)}` : null,
          order.tax ? `Tax: ${money(order.tax)}` : null,
          `Total: ${money(order.total)}`,
          addressText ? `\nShipping to:\n${addressText}` : null,
          ``,
          `We'll email you tracking details as soon as your order ships. Preorder items ship as soon as they arrive.`,
          ``,
          `Questions? Just reply to this email or write to support@pinkhalo.co.`,
          ``,
          `— Pink Halo Co. · pinkhalo.co`,
        ].filter(l => l !== null).join('\n');
        const html = `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#40282E">
            <h2 style="font-weight:500">Thank you for your order!</h2>
            <p style="color:#7D6167">Order reference: <strong>${orderRef}</strong></p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              ${lineItems.map(item => `<tr>
                <td style="padding:8px 0;border-bottom:1px solid #F0E3DC">${item.description || item.price?.product?.name || 'Product'} × ${item.quantity || 1}</td>
                <td style="padding:8px 0;border-bottom:1px solid #F0E3DC;text-align:right">${money((item.amount_total || 0) / 100)}</td>
              </tr>`).join('')}
              <tr><td style="padding:10px 0;font-weight:bold">Total</td><td style="padding:10px 0;text-align:right;font-weight:bold">${money(order.total)}</td></tr>
            </table>
            ${addressText ? `<p style="color:#7D6167;white-space:pre-line"><strong style="color:#40282E">Shipping to:</strong>\n${addressText}</p>` : ''}
            <p style="color:#7D6167">We'll email you tracking details as soon as your order ships. Preorder items ship as soon as they arrive.</p>
            <p style="color:#7D6167">Questions? Just reply to this email or write to <a href="mailto:support@pinkhalo.co" style="color:#B4707E">support@pinkhalo.co</a>.</p>
            <p style="color:#B4707E">— Pink Halo Co. · <a href="https://pinkhalo.co" style="color:#B4707E">pinkhalo.co</a></p>
          </div>`;
        await sendMail({
          from: 'sales',
          to: order.customer_email,
          replyTo: 'support@pinkhalo.co',
          subject: `Your Pink Halo Co. order confirmation — ${orderRef}`,
          text,
          html,
        });
        console.log('Receipt emailed to', order.customer_email);
      } catch (err) {
        console.error('Receipt email failed (order still recorded):', err.message);
      }
    }

    return { statusCode: 200, body: 'ok' };
  }

  // ── payment_intent.payment_failed ─────────────────────────
  if (stripeEvent.type === 'payment_intent.payment_failed') {
    const pi = stripeEvent.data.object;
    await db
      .from('orders')
      .update({ status: 'cancelled', notes: 'Payment failed' })
      .eq('stripe_payment_intent_id', pi.id);
    return { statusCode: 200, body: 'ok' };
  }

  // All other events — acknowledge
  return { statusCode: 200, body: 'ok' };
}
