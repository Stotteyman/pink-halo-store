/**
 * ph-products — PinkHalo product CRUD
 * Routes:
 *   GET  /api/ph-products          → list all products (admin: all statuses; public: active only)
 *   GET  /api/ph-products?id=UUID  → single product with variants
 *   POST /api/ph-products          → create product (admin)
 *   PUT  /api/ph-products          → update product (admin)
 *   DELETE /api/ph-products?id=UUID → delete product (admin)
 */

import { createClient } from '@supabase/supabase-js';
import { getAuthContext, hasRole, json } from './_auth.js';

const SUPABASE_URL  = process.env.SUPABASE_URL  || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SCHEMA        = process.env.SUPABASE_SCHEMA || process.env.PH_SCHEMA || process.env.VITE_SUPABASE_SCHEMA || 'public';
const PRODUCTS_TABLE = process.env.PH_PRODUCTS_TABLE || process.env.SUPABASE_PRODUCTS_TABLE || 'products';
const VARIANTS_TABLE = process.env.PH_PRODUCT_VARIANTS_TABLE || process.env.SUPABASE_PRODUCT_VARIANTS_TABLE || 'product_variants';

// Acts as the signed-in user (RLS via pinkhalo.jwt_role_level) unless a
// service key is configured, which bypasses RLS on its own.
function supabase(token) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: SCHEMA },
    auth: { persistSession: false },
    ...(token && !process.env.SUPABASE_SERVICE_KEY ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {})
  });
}

// Accepts a `category` field holding a category name or slug and turns it into
// the matching category_id. Without this, admin-created products have no category
// and never render into a storefront room. Mutates `record` in place.
async function resolveCategory(db, record) {
  if (!record || record.category == null) return;
  const wanted = String(record.category).trim().toLowerCase();
  delete record.category;
  if (!wanted || record.category_id) return;
  try {
    const { data: cats } = await db.from('categories').select('id,name,slug');
    const match = (cats || []).find(c =>
      String(c.name || '').toLowerCase() === wanted || String(c.slug || '').toLowerCase() === wanted);
    if (match) record.category_id = match.id;
  } catch { /* leave category_id unset if lookup fails */ }
}

function isMissingProductsTable(error) {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === 'PGRST205' || (message.includes('could not find the table') && message.includes(PRODUCTS_TABLE.toLowerCase()));
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
  const params = event.queryStringParameters || {};

  // ─── GET ────────────────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    const { id, category, status, search, limit = '50', offset = '0' } = params;

    // Single product
    if (id) {
      const { data, error } = await db
        .from(PRODUCTS_TABLE)
        .select(`*, ${VARIANTS_TABLE}(*), categories(name, slug)`)
        .eq('id', id)
        .maybeSingle();
      if (error) {
        if (isMissingProductsTable(error)) return json(404, { error: 'Product catalog is not configured yet' });
        return json(500, { error: error.message });
      }
      if (!data) return json(404, { error: 'Product not found' });
      if (!canManage && data.status !== 'active') return json(404, { error: 'Product not found' });
      return json(200, data);
    }

    // List
    let query = db
      .from(PRODUCTS_TABLE)
      .select('*, categories(name, slug)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (!canManage) query = query.eq('status', 'active');
    if (status && canManage) query = query.eq('status', status);
    if (category) query = query.eq('categories.slug', category);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query;
    if (error) {
      if (isMissingProductsTable(error)) return json(200, { products: [], total: 0, catalog_unconfigured: true });
      return json(500, { error: error.message });
    }
    return json(200, { products: data, total: count });
  }

  // ─── Admin-only below ────────────────────────────────────────
  if (!canManage) return json(403, { error: 'Staff access required' });

  // ─── POST (create) ───────────────────────────────────────────
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }

    const { variants, ...product } = body;

    // Auto-slug
    if (!product.slug && product.name) {
      product.slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    // Resolve a category name/slug into its category_id so the product lands in a room
    await resolveCategory(db, product);

    const { data, error } = await db.from(PRODUCTS_TABLE).insert(product).select().single();
    if (error) {
      if (isMissingProductsTable(error)) return json(503, { error: 'Product catalog is not configured yet' });
      return json(500, { error: error.message });
    }

    // Insert variants if provided
    if (Array.isArray(variants) && variants.length > 0 && data?.id) {
      const variantRows = variants.map(v => ({ ...v, product_id: data.id }));
      await db.from(VARIANTS_TABLE).insert(variantRows);
    }

    return json(201, data);
  }

  // ─── PUT (update) ────────────────────────────────────────────
  if (event.httpMethod === 'PUT') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }

    const { id, variants, ...updates } = body;
    if (!id) return json(400, { error: 'id is required' });

    // Resolve a category name/slug into its category_id on edit as well
    await resolveCategory(db, updates);

    const { data, error } = await db.from(PRODUCTS_TABLE).update(updates).eq('id', id).select().single();
    if (error) {
      if (isMissingProductsTable(error)) return json(503, { error: 'Product catalog is not configured yet' });
      return json(500, { error: error.message });
    }

    // Replace variants if provided
    if (Array.isArray(variants)) {
      await db.from(VARIANTS_TABLE).delete().eq('product_id', id);
      if (variants.length > 0) {
        await db.from(VARIANTS_TABLE).insert(variants.map(v => ({ ...v, product_id: id })));
      }
    }

    return json(200, data);
  }

  // ─── DELETE ─────────────────────────────────────────────────
  if (event.httpMethod === 'DELETE') {
    const id = params.id;
    if (!id) return json(400, { error: 'id query param required' });
    const { error } = await db.from(PRODUCTS_TABLE).delete().eq('id', id);
    if (error) {
      if (isMissingProductsTable(error)) return json(503, { error: 'Product catalog is not configured yet' });
      return json(500, { error: error.message });
    }
    return json(200, { success: true });
  }

  return json(405, { error: 'Method not allowed' });
}
