/**
 * ph-dropship — admin endpoint for AliExpress dropship import + sync.
 * Core logic lives in _dropship.js (shared with the scheduled cron).
 *
 * Routes (all require staff+):
 *   GET  /api/ph-dropship                 → list dropship products + sync state + settings
 *   GET  /api/ph-dropship?log=<UUID>      → recent sync-log rows for one product
 *   POST /api/ph-dropship  {action:'import', urls:[...], status?, margin_percent?, category?}
 *   POST /api/ph-dropship  {action:'sync', id?:<UUID>}
 *   POST /api/ph-dropship  {action:'toggle_auto_sync', id, auto_sync}
 */

import { getAuthContext, hasRole, json, getSupabaseServiceClient } from './_auth.js';
import { importUrls, syncProducts, DEFAULT_MARGIN, DEFAULT_CATEGORY, activeProvider } from './_dropship.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, {});

  const auth = await getAuthContext(event);
  if (!hasRole(auth.role, 'staff')) return json(403, { error: 'Staff access required' });

  let db;
  try { db = getSupabaseServiceClient(); }
  catch (e) { return json(500, { error: String(e.message || e) }); }

  const params = event.queryStringParameters || {};

  if (event.httpMethod === 'GET') {
    if (params.log) {
      const { data, error } = await db.from('dropship_sync_log').select('*')
        .eq('product_id', params.log).order('created_at', { ascending: false }).limit(30);
      if (error) return json(500, { error: error.message });
      return json(200, { log: data || [] });
    }
    const { data, error } = await db.from('products')
      .select('id,name,price,cost,stock,source_price,source_stock,source_url,source_product_id,sync_status,sync_error,auto_sync,markup_percent,last_synced_at,status,images')
      .eq('source', 'aliexpress').order('last_synced_at', { ascending: false, nullsFirst: false });
    if (error) return json(500, { error: error.message });
    return json(200, {
      products: data || [],
      settings: {
        default_margin_percent: DEFAULT_MARGIN,
        default_category: DEFAULT_CATEGORY,
        provider: activeProvider(),
        auto_reprice: process.env.DROPSHIP_AUTO_REPRICE === 'true',
      },
    });
  }

  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }

    if (body.action === 'import') {
      const raw = Array.isArray(body.urls) ? body.urls : String(body.urls || '').split(/[\n,]/);
      const clean = raw.map((u) => String(u).trim()).filter(Boolean);
      if (!clean.length) return json(400, { error: 'Paste at least one AliExpress product link.' });
      if (clean.length > 25) return json(400, { error: 'Import up to 25 links at a time.' });
      const results = await importUrls(db, { urls: clean, status: body.status, margin_percent: body.margin_percent, category: body.category });
      return json(200, { imported: results.filter((r) => r.ok).length, results });
    }

    if (body.action === 'sync') {
      const results = await syncProducts(db, { id: body.id });
      return json(200, { synced: results.length, results });
    }

    if (body.action === 'toggle_auto_sync' && body.id) {
      await db.from('products').update({ auto_sync: !!body.auto_sync }).eq('id', body.id);
      return json(200, { ok: true });
    }

    return json(400, { error: 'Unknown action. Use import, sync, or toggle_auto_sync.' });
  }

  return json(405, { error: 'Method not allowed' });
}
