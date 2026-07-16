import { getAuthContext, getSupabaseUserClient, hasRole, json } from './_auth.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  const auth = await getAuthContext(event);
  if (!auth.authenticated) {
    return json(401, { error: 'Authentication required' });
  }

  const db = getSupabaseUserClient(auth.token);

  if (event.httpMethod === 'GET') {
    // Staff can view role list; customers can only view self role.
    if (hasRole(auth.role, 'staff')) {
      const { data, error } = await db
        .from('user_roles')
        .select('id,user_id,role,created_at,updated_at')
        .order('updated_at', { ascending: false })
        .limit(500);
      if (error) return json(500, { error: error.message });

      // Attach names/emails from the staff-gated auth directory
      let directory = new Map();
      try {
        const { data: users } = await db.rpc('user_directory');
        directory = new Map((users || []).map(u => [u.user_id, u]));
      } catch { /* directory unavailable; show ids only */ }
      const roles = (data || []).map(row => ({
        ...row,
        user_email: directory.get(row.user_id)?.email || null,
        user_name: directory.get(row.user_id)?.display_name || null,
      }));
      return json(200, { roles, current_role: auth.role });
    }

    const { data, error } = await db
      .from('user_roles')
      .select('id,user_id,role,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .limit(1);
    if (error) return json(500, { error: error.message });
    return json(200, { roles: data || [], current_role: auth.role });
  }

  if (event.httpMethod === 'PUT') {
    // Promote/demote users: manager+ only.
    if (!hasRole(auth.role, 'manager')) {
      return json(403, { error: 'Manager access required' });
    }

    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return json(400, { error: 'Invalid JSON' });
    }

    const userId = String(body.user_id || '').trim();
    const role = String(body.role || '').trim().toLowerCase();
    if (!userId || !role) {
      return json(400, { error: 'user_id and role are required' });
    }

    const allowed = ['customer', 'staff', 'manager', 'admin', 'superadmin'];
    if (!allowed.includes(role)) {
      return json(400, { error: 'Invalid role' });
    }

    // Assigning a role requires at least that role's own privilege level,
    // so nobody can grant a role higher than the one they hold.
    if (!hasRole(auth.role, role)) {
      return json(403, { error: `Only ${role} users or higher can assign the ${role} role` });
    }

    const { data, error } = await db
      .from('user_roles')
      .upsert({ user_id: userId, role }, { onConflict: 'user_id' })
      .select('id,user_id,role,created_at,updated_at')
      .single();
    if (error) return json(500, { error: error.message });

    return json(200, data);
  }

  return json(405, { error: 'Method not allowed' });
}
