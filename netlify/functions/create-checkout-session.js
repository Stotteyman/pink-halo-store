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

  let promoApplied = 0;
  let accountEmail = '';

  if (checkoutType === 'merchandise') {
    const supabaseUrl = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
    const supabaseKey = getEnv('SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseKey) return json(500, { error: 'Product catalog is not configured.' });
    const ids = [...new Set(items.map(item => String(item.productId || '')).filter(Boolean))];
    if (!ids.length) return json(400, { error: 'Every checkout item requires a valid product ID.' });
    const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const { data: products, error } = await db
      .from('pinkhalo_storefront_products')
      .select('id,name,price,compare_at_price,stock,stripe_price_id,preorder,variants')
      .in('id', ids);
    if (error) return json(503, { error: 'Unable to verify the product catalog.' });
    const productsById = new Map((products || []).map(product => [String(product.id), product]));

    // New-account promo: the active sitewide discount applies only to
    // signed-in customers with no prior orders. Verified server-side.
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
    if (token) {
      try {
        const schema = getEnv('SUPABASE_SCHEMA') || getEnv('PH_SCHEMA') || 'public';
        const userDb = createClient(supabaseUrl, supabaseKey, {
          db: { schema },
          auth: { persistSession: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: userData } = await userDb.auth.getUser(token);
        accountEmail = String(userData?.user?.email || '').toLowerCase();
        const { data: eligible } = await userDb.rpc('new_account_promo_eligible');
        if (eligible) {
          const { data: promos } = await userDb
            .from('discounts')
            .select('percent_off')
            .eq('kind', 'sitewide')
            .eq('active', true)
            .order('percent_off', { ascending: false })
            .limit(1);
          promoApplied = Number(promos?.[0]?.percent_off || 0);
        }
      } catch { /* no promo */ }
    }

    const verifiedItems = [];
    for (const requested of items) {
      const product = productsById.get(String(requested.productId));
      const quantity = Math.round(Number(requested.quantity) || 1);
      if (!product) return json(400, { error: 'A product is unavailable or no longer published.' });
      if (quantity < 1 || quantity > 20) return json(400, { error: `${product.name} has an invalid quantity.` });

      // Resolve the selected variant (price/stock override) if one was chosen
      const variants = Array.isArray(product.variants) ? product.variants : [];
      let variant = null;
      if (requested.variantId) {
        variant = variants.find(v => String(v.id) === String(requested.variantId)) || null;
        if (!variant) return json(400, { error: `${product.name}: that option is no longer available.` });
      }

      const stock = variant ? Number(variant.stock) : Number(product.stock);
      // Preorder items are sellable regardless of stock on hand
      if (!product.preorder && quantity > stock) return json(400, { error: `${product.name} does not have enough stock.` });

      let unitPrice = variant?.price != null ? Number(variant.price) : Number(product.price);
      if (promoApplied > 0) {
        // Best-of: promo applies to the pre-discount base when it beats the
        // baked category/product discount.
        const base = product.compare_at_price != null ? Number(product.compare_at_price) : (variant?.price != null ? Number(variant.price) : Number(product.price));
        unitPrice = Math.min(unitPrice, Math.round(base * (1 - promoApplied / 100) * 100) / 100);
      }

      const variantLabel = variant
        ? [variant.options?.color, variant.options?.size].filter(Boolean).join(' / ') || variant.name
        : '';
      verifiedItems.push({
        name: variantLabel ? `${product.name} — ${variantLabel}` : product.name,
        amount: Math.round(unitPrice * 100),
        quantity,
        productId: product.id,
        variantId: variant ? String(variant.id) : '',
        variantName: variantLabel,
        url: '',
      });
    }
    items = verifiedItems;
  }

  const normalizedItems = items.map(item => ({
    name: String(item.name || '').trim().slice(0, 120),
    amount: Math.round(Number(item.amount)),
    quantity: Math.round(Number(item.quantity) || 1),
    productId: String(item.productId || '').slice(0, 120),
    variantId: String(item.variantId || '').slice(0, 120),
    variantName: String(item.variantName || '').slice(0, 120),
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
          product_data: {
            name: item.name,
            description: item.url || 'Pink Halo Co.',
            metadata: { product_id: item.productId, variant_id: item.variantId, variant_name: item.variantName },
          },
          unit_amount: item.amount,
        },
        quantity: item.quantity,
      })),
      metadata: {
        guest_session_id: guestSessionId,
        customer_mode: customerMode,
        checkout_type: checkoutType,
        promo_percent: String(promoApplied || 0),
        account_email: accountEmail,
      },
      success_url: `${siteUrl}/?checkout=${checkoutType === 'donation' ? 'donation-success' : 'success'}`,
      cancel_url: `${siteUrl}/?checkout=cancel`,
    });
    return json(200, { url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout session error', error);
    return json(500, { error: 'Unable to create Stripe checkout session.' });
  }
}
