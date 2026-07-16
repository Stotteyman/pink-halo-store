/**
 * ph-manufacturers — Manufacturer database + search tool
 * Routes:
 *   GET  /api/ph-manufacturers                  → list all (admin)
 *   GET  /api/ph-manufacturers?id=UUID          → single record
 *   GET  /api/ph-manufacturers?search=term      → search by name/category/country
 *   GET  /api/ph-manufacturers?discover=apparel → discover manufacturers from curated list
 *   POST /api/ph-manufacturers                  → create record (admin)
 *   PUT  /api/ph-manufacturers                  → update record (admin)
 *   DELETE /api/ph-manufacturers?id=UUID        → delete (admin)
 */

import { createClient } from '@supabase/supabase-js';
import { getAuthContext, hasRole, json } from './_auth.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SCHEMA       = process.env.SUPABASE_SCHEMA || process.env.PH_SCHEMA || process.env.VITE_SUPABASE_SCHEMA || 'public';

// Acts as the signed-in user (RLS via pinkhalo.jwt_role_level) unless a
// service key is configured, which bypasses RLS on its own.
function supabase(token) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: SCHEMA },
    auth: { persistSession: false },
    ...(token && !process.env.SUPABASE_SERVICE_KEY ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {})
  });
}


// ── Curated manufacturer discovery list ──────────────────────────────────────
const DISCOVERY_LIST = [
  // Apparel - US & domestic
  { name: 'Los Angeles Apparel', website: 'https://losangelesapparel.net', country: 'USA', category: 'Apparel', moq: 1, lead_time_days: 7, tags: ['blanks','basics','sustainable'], notes: 'US-made basics, no minimums on blanks. Good for POD.' },
  { name: 'Bella+Canvas', website: 'https://www.bellacanvas.com', country: 'USA', category: 'Apparel', moq: 1, lead_time_days: 5, tags: ['blanks','t-shirts','wholesale'], notes: 'Popular for custom printing, wide size range.' },
  { name: 'Next Level Apparel', website: 'https://www.nextlevelapparel.com', country: 'USA', category: 'Apparel', moq: 1, lead_time_days: 5, tags: ['blanks','activewear'], notes: 'Soft-feel blanks ideal for sublimation or screen print.' },
  // Loungewear / Intimates
  { name: 'Printify', website: 'https://printify.com', country: 'USA', category: 'Print on Demand', moq: 1, lead_time_days: 5, tags: ['pod','loungewear','custom'], notes: 'POD network — wide product catalog, no inventory needed.' },
  { name: 'Printful', website: 'https://www.printful.com', country: 'USA', category: 'Print on Demand', moq: 1, lead_time_days: 4, tags: ['pod','all-over-print','embroidery'], notes: 'Higher quality POD, embroidery available, integrates with Shopify.' },
  // Wholesale / Fast fashion
  { name: 'FashionGo', website: 'https://www.fashiongo.net', country: 'USA', category: 'Wholesale', moq: 6, lead_time_days: 3, tags: ['wholesale','trendy','dresses'], notes: 'B2B fashion marketplace, need business license. Ships from LA.' },
  { name: 'Faire', website: 'https://www.faire.com', country: 'USA', category: 'Wholesale', moq: 100, lead_time_days: 14, tags: ['wholesale','boutique','accessories'], notes: 'Curated independent brands. Good for accessories.' },
  { name: 'Tasha Apparel', website: 'https://www.tashaapparel.com', country: 'USA', category: 'Wholesale', moq: 6, lead_time_days: 3, tags: ['wholesale','women','trendy'], notes: 'LA-based trendy women\'s wholesale, low MOQ.' },
  // International
  { name: 'Alibaba (Verified Suppliers)', website: 'https://www.alibaba.com', country: 'China', category: 'Overseas Manufacturing', moq: 100, lead_time_days: 30, tags: ['custom','bulk','overseas'], notes: 'Largest overseas sourcing. Look for Gold Supplier + Trade Assurance verified vendors.' },
  { name: 'Made-in-China.com', website: 'https://www.made-in-china.com', country: 'China', category: 'Overseas Manufacturing', moq: 50, lead_time_days: 25, tags: ['custom','bulk','apparel'], notes: 'Alternative to Alibaba. Good for factory-direct pricing.' },
  { name: 'Global Sources', website: 'https://www.globalsources.com', country: 'Hong Kong', category: 'Overseas Manufacturing', moq: 50, lead_time_days: 28, tags: ['verified','apparel','accessories'], notes: 'Verified suppliers, strong in accessories and electronics.' },
  // Accessories
  { name: 'DHGate', website: 'https://www.dhgate.com', country: 'China', category: 'Accessories', moq: 1, lead_time_days: 14, tags: ['accessories','jewelry','low-moq'], notes: 'Low MOQ overseas. Use for accessories and hair products.' },
  { name: 'AliExpress Dropshipping', website: 'https://www.aliexpress.com', country: 'China', category: 'Dropshipping', moq: 1, lead_time_days: 14, tags: ['dropshipping','accessories','no-inventory'], notes: 'No inventory needed. Longer shipping times.' },
  { name: 'Tundra', website: 'https://www.tundra.com', country: 'USA', category: 'Wholesale', moq: 100, lead_time_days: 10, tags: ['wholesale','accessories','domestic'], notes: 'Zero fees for buyers. Good for beauty and accessories.' },
  // Sustainable / Ethical
  { name: 'ThreadBird', website: 'https://threadbird.com', country: 'USA', category: 'Custom Print', moq: 12, lead_time_days: 10, tags: ['custom','screen-print','dtg'], notes: 'Custom apparel printer. DTG, screen print, embroidery.' },
  { name: 'Apliiq', website: 'https://www.apliiq.com', country: 'USA', category: 'Custom Print', moq: 1, lead_time_days: 7, tags: ['pod','custom-labels','streetwear'], notes: 'Private-label POD. Adds custom labels, patches, and liners.' },
];

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } };
  }

  const auth = await getAuthContext(event);
  if (!hasRole(auth.role, 'staff')) return json(403, { error: 'Staff access required' });
  if (!SUPABASE_URL || !SUPABASE_KEY) return json(500, { error: 'Supabase not configured' });

  const db = supabase(auth.token);
  const params = event.queryStringParameters || {};

  // ─── GET ────────────────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    const { id, search, discover, category, status, country } = params;

    // Discover mode — return curated list filtered by keyword
    if (discover !== undefined) {
      const term = (discover || search || '').toLowerCase();
      const results = term
        ? DISCOVERY_LIST.filter(m =>
            m.category.toLowerCase().includes(term) ||
            m.tags.some(t => t.includes(term)) ||
            m.name.toLowerCase().includes(term) ||
            m.country.toLowerCase().includes(term) ||
            (m.notes || '').toLowerCase().includes(term)
          )
        : DISCOVERY_LIST;
      return json(200, { manufacturers: results, source: 'curated', total: results.length });
    }

    // Single record
    if (id) {
      const { data, error } = await db.from('manufacturers').select('*').eq('id', id).maybeSingle();
      if (error) return json(500, { error: error.message });
      if (!data) return json(404, { error: 'Not found' });
      return json(200, data);
    }

    // List with filters
    let query = db.from('manufacturers').select('*', { count: 'exact' }).order('name');
    if (search) query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%,country.ilike.%${search}%`);
    if (category) query = query.ilike('category', `%${category}%`);
    if (status) query = query.eq('status', status);
    if (country) query = query.ilike('country', `%${country}%`);

    const { data, error, count } = await query;
    if (error) return json(500, { error: error.message });
    return json(200, { manufacturers: data, total: count });
  }

  // ─── POST (create) ───────────────────────────────────────────
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }
    const { data, error } = await db.from('manufacturers').insert(body).select().single();
    if (error) return json(500, { error: error.message });
    return json(201, data);
  }

  // ─── PUT (update) ────────────────────────────────────────────
  if (event.httpMethod === 'PUT') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }
    const { id, ...updates } = body;
    if (!id) return json(400, { error: 'id required' });
    const { data, error } = await db.from('manufacturers').update(updates).eq('id', id).select().single();
    if (error) return json(500, { error: error.message });
    return json(200, data);
  }

  // ─── DELETE ─────────────────────────────────────────────────
  if (event.httpMethod === 'DELETE') {
    const { id } = params;
    if (!id) return json(400, { error: 'id required' });
    const { error } = await db.from('manufacturers').delete().eq('id', id);
    if (error) return json(500, { error: error.message });
    return json(200, { success: true });
  }

  return json(405, { error: 'Method not allowed' });
}
