/**
 * ph-discounts — Sitewide/category/product discount management
 * Routes:
 *   GET    /api/ph-discounts               → list (admin: all; public: active only)
 *   POST   /api/ph-discounts               → create record (admin)
 *   PUT    /api/ph-discounts               → update record (admin)
 *   DELETE /api/ph-discounts?id=UUID       → delete (admin)
 */

import { createClient } from '@supabase/supabase-js';
import { getAuthContext, hasRole, json } from './_auth.js';

const SUPABASE_URL   = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SCHEMA         = process.env.SUPABASE_SCHEMA || process.env.PH_SCHEMA || process.env.VITE_SUPABASE_SCHEMA || 'public';
const DISCOUNTS_TABLE = process.env.PH_DISCOUNTS_TABLE || 'discounts';

const ALLOWED_KINDS = ['sitewide', 'category', 'product'];

// Acts as the signed-in user (RLS via pinkhalo.jwt_role_level) unless a
// service key is configured, which bypasses RLS on its own.
function supabase(token) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: SCHEMA },
    auth: { persistSession: false },
    ...(token && !process.env.SUPABASE_SERVICE_KEY ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {})
  });
}

function isMissingTable(error) {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === 'PGRST205' || (message.includes('could not find the table') && message.includes(DISCOUNTS_TABLE.toLowerCase()));
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' } };
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return json(500, { error: 'Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.' });
  }

  const auth = await getAuthContext(event);
  const db = supabase(auth.token);
  const canManage = hasRole(auth.role, 'staff');

  // ─── GET ────────────────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    let query = db.from(DISCOUNTS_TABLE).select('*').order('created_at', { ascending: false });
    if (!canManage) query = query.eq('active', true);

    const { data, error } = await query;
    if (error) {
      if (isMissingTable(error)) return json(200, { discounts: [] });
      return json(500, { error: error.message });
    }
    return json(200, { discounts: data });
  }

  // ─── Admin-only below ────────────────────────────────────────
  if (!canManage) return json(403, { error: 'Staff access required' });

  // ─── POST (create) ───────────────────────────────────────────
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }

    const { name, kind, scope_id, percent_off, active } = body;
    if (!name || !ALLOWED_KINDS.includes(kind)) return json(400, { error: 'name and a valid kind are required' });
    if (kind !== 'sitewide' && !scope_id) return json(400, { error: 'scope_id is required for category/product discounts' });
    const percent = Number(percent_off);
    if (!(percent > 0 && percent <= 100)) return json(400, { error: 'percent_off must be between 0 and 100' });

    const { data, error } = await db
      .from(DISCOUNTS_TABLE)
      .insert({ name, kind, scope_id: kind === 'sitewide' ? null : scope_id, percent_off: percent, active: active !== false })
      .select()
      .single();
    if (error) {
      if (isMissingTable(error)) return json(503, { error: 'Discounts table is not configured yet' });
      return json(500, { error: error.message });
    }
    return json(201, data);
  }

  // ─── PUT (update) ────────────────────────────────────────────
  if (event.httpMethod === 'PUT') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }

    const { id, ...updates } = body;
    if (!id) return json(400, { error: 'id is required' });
    if (updates.kind && !ALLOWED_KINDS.includes(updates.kind)) return json(400, { error: 'Invalid kind' });
    if (updates.percent_off != null) {
      const percent = Number(updates.percent_off);
      if (!(percent > 0 && percent <= 100)) return json(400, { error: 'percent_off must be between 0 and 100' });
      updates.percent_off = percent;
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await db.from(DISCOUNTS_TABLE).update(updates).eq('id', id).select().single();
    if (error) {
      if (isMissingTable(error)) return json(503, { error: 'Discounts table is not configured yet' });
      return json(500, { error: error.message });
    }
    return json(200, data);
  }

  // ─── DELETE ─────────────────────────────────────────────────
  if (event.httpMethod === 'DELETE') {
    const id = event.queryStringParameters?.id;
    if (!id) return json(400, { error: 'id query param required' });
    const { error } = await db.from(DISCOUNTS_TABLE).delete().eq('id', id);
    if (error) {
      if (isMissingTable(error)) return json(503, { error: 'Discounts table is not configured yet' });
      return json(500, { error: error.message });
    }
    return json(200, { success: true });
  }

  return json(405, { error: 'Method not allowed' });
}
