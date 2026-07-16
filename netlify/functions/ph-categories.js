/**
 * ph-categories — category management
 * GET    /api/ph-categories        → list (public)
 * POST   /api/ph-categories        → create (staff)
 * PUT    /api/ph-categories        → update name/slug/description/image/sort (staff)
 * DELETE /api/ph-categories?id=    → delete (staff; products keep null category)
 */
import { getAuthContext, getSupabaseUserClient, hasRole, json } from './_auth.js';

const slugify = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });

  const auth = await getAuthContext(event);
  const db = getSupabaseUserClient(auth.token);

  if (event.httpMethod === 'GET') {
    const { data, error } = await db
      .from('categories')
      .select('id,name,slug,description,image_url,sort_order,created_at')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) return json(500, { error: error.message });
    return json(200, { categories: data || [] });
  }

  if (!hasRole(auth.role, 'staff')) return json(403, { error: 'Staff access required' });

  if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }
    const { id, ...fields } = body;
    if (fields.name && !fields.slug) fields.slug = slugify(fields.name);
    if (event.httpMethod === 'PUT' && !id) return json(400, { error: 'id required' });
    if (event.httpMethod === 'POST' && !fields.name) return json(400, { error: 'name required' });

    const op = event.httpMethod === 'POST'
      ? db.from('categories').insert(fields).select('*').single()
      : db.from('categories').update(fields).eq('id', id).select('*').single();
    const { data, error } = await op;
    if (error) return json(500, { error: error.message });
    return json(event.httpMethod === 'POST' ? 201 : 200, data);
  }

  if (event.httpMethod === 'DELETE') {
    const id = (event.queryStringParameters || {}).id;
    if (!id) return json(400, { error: 'id query param required' });
    const { error } = await db.from('categories').delete().eq('id', id);
    if (error) return json(500, { error: error.message });
    return json(200, { success: true });
  }

  return json(405, { error: 'Method not allowed' });
}
