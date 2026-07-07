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
import { createClient } from '@supabase/supabase-js';

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

    const { data: newOrder, error: orderError } = await db
      .from('orders')
      .insert(order)
      .select()
      .single();

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
        product_name: item.description || item.price?.product?.name || 'Product',
        price:        (item.amount_total || 0) / 100 / (item.quantity || 1),
        quantity:     item.quantity || 1,
        image_url:    item.price?.product?.images?.[0] || null,
      }));
      const { error: itemsError } = await db.from('order_items').insert(items);
      if (itemsError) console.error('Failed to insert order items:', itemsError.message);
    }

    console.log('Order saved:', newOrder.id, 'for', order.customer_email);
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
