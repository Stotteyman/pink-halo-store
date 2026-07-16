/**
 * ph-settings — key/value store for site settings
 * GET /api/ph-settings?keys=a,b   → public callers get only allowlisted keys;
 *                                   staff can read everything
 * PUT /api/ph-settings            → staff; body { key: value, ... }
 */
import { getAuthContext, getSupabaseUserClient, hasRole, json } from './_auth.js';

const PUBLIC_KEYS = ['featured_product_ids', 'home_new_in_image'];

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });

  const auth = await getAuthContext(event);
  const db = getSupabaseUserClient(auth.token);
  const isStaff = hasRole(auth.role, 'staff');

  if (event.httpMethod === 'GET') {
    const requested = String((event.queryStringParameters || {}).keys || '')
      .split(',').map(k => k.trim()).filter(Boolean);
    const keys = isStaff
      ? requested
      : (requested.length ? requested.filter(k => PUBLIC_KEYS.includes(k)) : PUBLIC_KEYS);
    let query = db.from('settings').select('key,value');
    if (keys.length) query = query.in('key', keys);
    const { data, error } = await query;
    if (error) return json(500, { error: error.message });
    const settings = Object.fromEntries((data || []).map(row => [row.key, row.value]));
    return json(200, { settings });
  }

  if (event.httpMethod === 'PUT') {
    if (!isStaff) return json(403, { error: 'Staff access required' });
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }
    const entries = Object.entries(body);
    if (!entries.length) return json(400, { error: 'No settings provided' });
    const rows = entries.map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));
    const { error } = await db.from('settings').upsert(rows);
    if (error) return json(500, { error: error.message });
    return json(200, { success: true });
  }

  return json(405, { error: 'Method not allowed' });
}
