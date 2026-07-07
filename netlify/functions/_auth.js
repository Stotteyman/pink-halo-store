import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SCHEMA = process.env.SUPABASE_SCHEMA || process.env.PH_SCHEMA || process.env.VITE_SUPABASE_SCHEMA || 'public';

const ROLE_ORDER = {
  guest: 0,
  customer: 1,
  staff: 2,
  manager: 3,
  admin: 4,
  superadmin: 5,
};

export function getSupabaseServiceClient() {
  const key = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !key) {
    throw new Error('Supabase is not configured.');
  }
  return createClient(SUPABASE_URL, key, {
    db: { schema: SCHEMA },
    auth: { persistSession: false },
  });
}

function readBearerToken(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || '';
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  return auth.slice(7).trim() || null;
}

function normalizeRole(role) {
  const value = String(role || '').toLowerCase();
  if (value in ROLE_ORDER) return value;
  return 'guest';
}

export async function getAuthContext(event) {
  const token = readBearerToken(event);
  if (!token) {
    return { authenticated: false, role: 'guest', user: null, token: null };
  }

  const db = getSupabaseServiceClient();
  const { data: userData, error } = await db.auth.getUser(token);
  if (error || !userData?.user) {
    return { authenticated: false, role: 'guest', user: null, token: token };
  }

  const user = userData.user;
  let role = normalizeRole(user.app_metadata?.role || user.user_metadata?.role || 'customer');

  // Optional role override from pinkhalo.user_roles table.
  try {
    const { data: roleRows } = await db
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .limit(1);
    if (roleRows?.[0]?.role) {
      role = normalizeRole(roleRows[0].role);
    }
  } catch {
    // Table may not exist yet; keep metadata-derived role.
  }

  return { authenticated: true, role, user, token };
}

export function hasRole(currentRole, requiredRole) {
  const current = ROLE_ORDER[normalizeRole(currentRole)] ?? 0;
  const required = ROLE_ORDER[normalizeRole(requiredRole)] ?? 0;
  return current >= required;
}

export function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(body),
  };
}
