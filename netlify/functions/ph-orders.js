/**
 * ph-orders — PinkHalo order management
 * Routes (all admin):
 *   GET  /api/ph-orders            → list orders (with filters: status, search, date_from, date_to)
 *   GET  /api/ph-orders?id=UUID    → single order with items
 *   PUT  /api/ph-orders            → update order (status, tracking, notes)
 *   POST /api/ph-orders/refund     → initiate Stripe refund + mark refunded
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getAuthContext, hasRole, json } from './_auth.js';

const SUPABASE_URL  = process.env.SUPABASE_URL  || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const SCHEMA        = process.env.SUPABASE_SCHEMA || process.env.PH_SCHEMA || process.env.VITE_SUPABASE_SCHEMA || 'public';

function supabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: SCHEMA },
    auth: { persistSession: false }
  });
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } };
  }

  const auth = await getAuthContext(event);
  if (!hasRole(auth.role, 'staff')) return json(403, { error: 'Staff access required' });
  if (!SUPABASE_URL || !SUPABASE_KEY) return json(500, { error: 'Supabase not configured' });

  const db = supabase();
  const params = event.queryStringParameters || {};
  const path = event.path || '';

  // ─── Refund sub-route ────────────────────────────────────────
  if (event.httpMethod === 'POST' && path.endsWith('/refund')) {
    if (!STRIPE_SECRET) return json(500, { error: 'Stripe not configured' });
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }

    const { order_id, amount_cents } = body;
    if (!order_id) return json(400, { error: 'order_id required' });

    const { data: order } = await db.from('orders').select('stripe_payment_intent_id, total').eq('id', order_id).single();
    if (!order?.stripe_payment_intent_id) return json(400, { error: 'No payment intent on this order' });

    const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2022-11-15' });
    const refundParams = { payment_intent: order.stripe_payment_intent_id };
    if (amount_cents) refundParams.amount = amount_cents;

    const refund = await stripe.refunds.create(refundParams);

    await db.from('orders').update({ status: 'refunded', notes: `Refunded ${refund.id}` }).eq('id', order_id);

    return json(200, { refund_id: refund.id, status: refund.status });
  }

  // ─── GET ────────────────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    const { id, status, search, date_from, date_to, limit = '50', offset = '0' } = params;

    if (id) {
      const { data, error } = await db
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .maybeSingle();
      if (error) return json(500, { error: error.message });
      if (!data) return json(404, { error: 'Order not found' });
      return json(200, data);
    }

    let query = db
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status) query = query.eq('status', status);
    if (search) query = query.or(`customer_email.ilike.%${search}%,customer_name.ilike.%${search}%`);
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);

    const { data, error, count } = await query;
    if (error) return json(500, { error: error.message });

    // Summary stats
    const { data: stats } = await db.from('orders').select('status, total');
    const summary = {
      total_orders: count,
      total_revenue: (stats || []).filter(o => o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0),
      by_status: (stats || []).reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {})
    };

    return json(200, { orders: data, total: count, summary });
  }

  // ─── PUT (update status/tracking) ───────────────────────────
  if (event.httpMethod === 'PUT') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }

    const { id, ...updates } = body;
    if (!id) return json(400, { error: 'id required' });

    // Validate status transition
    const allowed = ['pending','paid','processing','shipped','delivered','refunded','cancelled'];
    if (updates.status && !allowed.includes(updates.status)) {
      return json(400, { error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const { data, error } = await db.from('orders').update(updates).eq('id', id).select().single();
    if (error) return json(500, { error: error.message });
    return json(200, data);
  }

  return json(405, { error: 'Method not allowed' });
}
