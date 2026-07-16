import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const getEnv = (name) => globalThis.Netlify?.env?.get(name) || process.env[name];

const json = (status, payload) => new Response(JSON.stringify(payload), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

export default async function createCheckoutSession(request) {
  if (request.method !== 'POST') return json(405, { error: 'Only POST requests are supported.' });

  const stripeSecret = getEnv('STRIPE_SECRET_KEY');
  const siteUrl = getEnv('SITE_URL') || new URL(request.url).origin || 'http://localhost:4173';
  if (!stripeSecret) return json(500, { error: 'Stripe secret key not configured.' });

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Invalid JSON payload.' });
  }

  const checkoutType = body.checkoutType === 'donation' ? 'donation' : 'merchandise';
  const donationAmount = Math.round(Number(body.donationAmount));
  let items = checkoutType === 'donation'
    ? [{ name: 'Pink Halo Community Donation', amount: donationAmount, quantity: 1, productId: 'donation' }]
    : (Array.isArray(body.items) ? body.items : []);
  const guestSessionId = typeof body.guestSessionId === 'string' ? body.guestSessionId : '';
  const customerMode = body.customerMode === 'authenticated' ? 'authenticated' : 'guest';

  if (!items.length) return json(400, { error: 'Checkout payload is missing items.' });
  if (checkoutType === 'donation' && (!Number.isInteger(donationAmount) || donationAmount < 100 || donationAmount > 100000)) {
    return json(400, { error: 'Donation amount must be between $1 and $1,000.' });
  }

  if (checkoutType === 'merchandise') {
    const supabaseUrl = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
    const supabaseKey = getEnv('SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseKey) return json(500, { error: 'Product catalog is not configured.' });
    const ids = [...new Set(items.map(item => String(item.productId || '')).filter(Boolean))];
    if (!ids.length || ids.length !== items.length) return json(400, { error: 'Every checkout item requires a valid product ID.' });
    const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const { data: products, error } = await db
      .from('pinkhalo_storefront_products')
      .select('id,name,price,stock,stripe_price_id,preorder')
      .in('id', ids);
    if (error) return json(503, { error: 'Unable to verify the product catalog.' });
    const productsById = new Map((products || []).map(product => [String(product.id), product]));
    const verifiedItems = [];
    for (const requested of items) {
      const product = productsById.get(String(requested.productId));
      const quantity = Math.round(Number(requested.quantity) || 1);
      if (!product) return json(400, { error: 'A product is unavailable or no longer published.' });
      if (quantity < 1 || quantity > 20) return json(400, { error: `${product.name} has an invalid quantity.` });
      // Preorder items are sellable regardless of stock on hand
      if (!product.preorder && quantity > Number(product.stock)) return json(400, { error: `${product.name} does not have enough stock.` });
      verifiedItems.push({ name: product.name, amount: Math.round(Number(product.price) * 100), quantity, productId: product.id, url: '' });
    }
    items = verifiedItems;
  }

  const normalizedItems = items.map(item => ({
    name: String(item.name || '').trim().slice(0, 120),
    amount: Math.round(Number(item.amount)),
    quantity: Math.round(Number(item.quantity) || 1),
    productId: String(item.productId || '').slice(0, 120),
    url: String(item.url || '').slice(0, 500),
  }));
  if (normalizedItems.some(item => !item.name || !Number.isInteger(item.amount) || item.amount < 50 || item.amount > 10000000 || item.quantity < 1 || item.quantity > 20)) {
    return json(400, { error: 'Checkout contains an invalid item, price, or quantity.' });
  }

  try {
    const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: normalizedItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name, description: item.url || 'Pink Halo Co.', metadata: { product_id: item.productId } },
          unit_amount: item.amount,
        },
        quantity: item.quantity,
      })),
      metadata: { guest_session_id: guestSessionId, customer_mode: customerMode, checkout_type: checkoutType },
      success_url: `${siteUrl}/?checkout=${checkoutType === 'donation' ? 'donation-success' : 'success'}`,
      cancel_url: `${siteUrl}/?checkout=cancel`,
    });
    return json(200, { url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout session error', error);
    return json(500, { error: 'Unable to create Stripe checkout session.' });
  }
}
