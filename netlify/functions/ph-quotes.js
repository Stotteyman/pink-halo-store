/**
 * ph-quotes — manufacturer sourcing quotes + pricing settings (staff only)
 * Routes:
 *   GET    /api/ph-quotes                  → { quotes, min_margin_percent }
 *   POST   /api/ph-quotes                  → create quote
 *   PUT    /api/ph-quotes                  → update quote; {id, status:'selected', apply_cost:true}
 *                                            also writes landed unit cost to the product
 *   DELETE /api/ph-quotes?id=UUID          → delete quote
 *   PUT    /api/ph-quotes/settings         → { min_margin_percent }
 */
import { getAuthContext, getSupabaseUserClient, hasRole, json } from './_auth.js';

const landedUnitCost = (q) =>
  Math.round((Number(q.unit_cost) + (Number(q.shipping_cost || 0) + Number(q.extra_cost || 0)) / Math.max(1, Number(q.quantity))) * 100) / 100;

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });

  const auth = await getAuthContext(event);
  if (!hasRole(auth.role, 'staff')) return json(403, { error: 'Staff access required' });
  const db = getSupabaseUserClient(auth.token);
  const params = event.queryStringParameters || {};
  const path = event.path || '';

  if (event.httpMethod === 'PUT' && path.endsWith('/settings')) {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }
    const value = Number(body.min_margin_percent);
    if (!Number.isFinite(value) || value < 0 || value > 95) return json(400, { error: 'min_margin_percent must be 0-95' });
    const { error } = await db.from('settings').upsert({ key: 'min_margin_percent', value, updated_at: new Date().toISOString() });
    if (error) return json(500, { error: error.message });
    return json(200, { min_margin_percent: value });
  }

  if (event.httpMethod === 'GET') {
    let query = db.from('manufacturer_quotes')
      .select('*, manufacturers(name), products(name, price)')
      .order('created_at', { ascending: false })
      .limit(500);
    if (params.product_id) query = query.eq('product_id', params.product_id);
    if (params.manufacturer_id) query = query.eq('manufacturer_id', params.manufacturer_id);
    const { data, error } = await query;
    if (error) return json(500, { error: error.message });

    const { data: settings } = await db.from('settings').select('value').eq('key', 'min_margin_percent').maybeSingle();
    const quotes = (data || []).map(q => ({ ...q, landed_unit_cost: landedUnitCost(q) }));
    return json(200, { quotes, min_margin_percent: Number(settings?.value ?? 50) });
  }

  if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }
    const { id, apply_cost, manufacturers, products, landed_unit_cost, ...fields } = body;

    if (event.httpMethod === 'PUT' && !id) return json(400, { error: 'id required' });
    if (event.httpMethod === 'POST' && !fields.manufacturer_id) return json(400, { error: 'manufacturer_id required' });

    fields.updated_at = new Date().toISOString();
    const op = event.httpMethod === 'POST'
      ? db.from('manufacturer_quotes').insert(fields).select('*').single()
      : db.from('manufacturer_quotes').update(fields).eq('id', id).select('*').single();
    const { data: quote, error } = await op;
    if (error) return json(500, { error: error.message });

    // Selecting a quote can push its landed unit cost onto the product so
    // margin tracking uses real sourcing numbers.
    if (apply_cost && quote.product_id) {
      const cost = landedUnitCost(quote);
      const { error: costError } = await db.from('products')
        .update({ cost, updated_at: new Date().toISOString() })
        .eq('id', quote.product_id);
      if (costError) return json(500, { error: `Quote saved but product cost update failed: ${costError.message}` });
      return json(200, { ...quote, landed_unit_cost: cost, product_cost_updated: true });
    }

    return json(event.httpMethod === 'POST' ? 201 : 200, { ...quote, landed_unit_cost: landedUnitCost(quote) });
  }

  if (event.httpMethod === 'DELETE') {
    if (!params.id) return json(400, { error: 'id query param required' });
    const { error } = await db.from('manufacturer_quotes').delete().eq('id', params.id);
    if (error) return json(500, { error: error.message });
    return json(200, { success: true });
  }

  return json(405, { error: 'Method not allowed' });
}
