/**
 * ph-gallery — community "gallery of supporters"
 * GET    /api/ph-gallery            → approved photos (public);
 *                                     ?me=1 adds caller's own submissions + can_submit
 *                                     ?all=1 (staff) returns everything incl. pending
 * POST   /api/ph-gallery            → submit a photo (signed-in verified buyers only)
 * PUT    /api/ph-gallery            → approve/reject { id, status } (staff)
 * DELETE /api/ph-gallery?id=        → delete (staff, or owner of a pending photo)
 */
import { getAuthContext, getSupabaseUserClient, hasRole, json } from './_auth.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });

  const auth = await getAuthContext(event);
  const db = getSupabaseUserClient(auth.token);
  const isStaff = hasRole(auth.role, 'staff');
  const params = event.queryStringParameters || {};

  if (event.httpMethod === 'GET') {
    if (params.all === '1' && isStaff) {
      const { data, error } = await db.from('gallery_photos').select('*').order('created_at', { ascending: false }).limit(500);
      if (error) return json(500, { error: error.message });
      return json(200, { photos: data || [] });
    }

    const { data, error } = await db
      .from('gallery_photos')
      .select('id,customer_name,image_url,caption,status,created_at,user_id')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return json(500, { error: error.message });

    let can_submit = false;
    let mine = [];
    if (params.me === '1' && auth.authenticated) {
      try {
        const { data: verified } = await db.rpc('has_confirmed_purchase');
        can_submit = Boolean(verified);
      } catch { /* not verified */ }
      mine = (data || []).filter(p => p.user_id === auth.user.id);
    }
    const photos = (data || []).filter(p => p.status === 'approved');
    return json(200, { photos, mine, can_submit, signed_in: auth.authenticated });
  }

  if (event.httpMethod === 'POST') {
    if (!auth.authenticated) return json(401, { error: 'Sign in to share a photo.' });
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }

    const image_url = String(body.image_url || '').trim().slice(0, 800);
    const caption = String(body.caption || '').trim().slice(0, 300);
    if (!image_url) return json(400, { error: 'A photo is required.' });

    // Only verified buyers can post to the supporters gallery
    const { data: verified, error: verifyError } = await db.rpc('has_confirmed_purchase');
    if (verifyError || !verified) {
      return json(403, { error: 'The supporters gallery is for confirmed customers — this account has no completed order yet.' });
    }

    const { data, error } = await db.from('gallery_photos').insert({
      user_id: auth.user.id,
      customer_name: auth.user.user_metadata?.full_name || null,
      customer_email: auth.user.email || null,
      image_url,
      caption: caption || null,
      status: 'pending',
    }).select('id,status').single();
    if (error) return json(500, { error: error.message });
    return json(201, { ...data, message: 'Thank you! Your photo is awaiting approval.' });
  }

  if (event.httpMethod === 'PUT') {
    if (!isStaff) return json(403, { error: 'Staff access required' });
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }
    const { id, status } = body;
    if (!id || !['approved', 'rejected', 'pending'].includes(status)) return json(400, { error: 'id and a valid status are required' });
    const { data, error } = await db.from('gallery_photos')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id).select('*').single();
    if (error) return json(500, { error: error.message });
    return json(200, data);
  }

  if (event.httpMethod === 'DELETE') {
    if (!params.id) return json(400, { error: 'id query param required' });
    if (!auth.authenticated) return json(401, { error: 'Authentication required' });
    let query = db.from('gallery_photos').delete().eq('id', params.id);
    // Non-staff may only delete their own pending submission (RLS backs this up)
    if (!isStaff) query = query.eq('user_id', auth.user.id).eq('status', 'pending');
    const { error } = await query;
    if (error) return json(500, { error: error.message });
    return json(200, { success: true });
  }

  return json(405, { error: 'Method not allowed' });
}
