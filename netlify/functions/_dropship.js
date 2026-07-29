/**
 * _dropship — shared core for AliExpress dropship import + sync.
 * Imported by ph-dropship.js (admin endpoint) and ph-dropship-cron.js (schedule).
 * No HTTP handler here (underscore prefix → not exposed as a function).
 *
 * Provider selection (first configured wins; falls through on failure):
 *   1. Official AliExpress Open Platform  — ALIEXPRESS_APP_KEY + ALIEXPRESS_APP_SECRET
 *   2. Third-party data API (e.g. RapidAPI) — RAPIDAPI_ALIEXPRESS_KEY (+ _HOST, _URL)
 *   3. HTML scraper fallback — no keys; best-effort, AliExpress often blocks it
 */

import crypto from 'crypto';

export const DEFAULT_MARGIN = Number(process.env.DROPSHIP_TARGET_MARGIN_PERCENT || 60);
export const DEFAULT_CATEGORY = process.env.DROPSHIP_DEFAULT_CATEGORY || 'Accessories';
const PRICE_CHANGE_THRESHOLD = 0.02;
const SHIP_TO = process.env.DROPSHIP_SHIP_TO_COUNTRY || 'US';
const CURRENCY = process.env.DROPSHIP_CURRENCY || 'USD';

export function activeProvider() {
  return process.env.ALIEXPRESS_APP_KEY ? 'official'
    : process.env.RAPIDAPI_ALIEXPRESS_KEY ? 'third_party'
    : 'scrape';
}

// ── URL / id parsing ──────────────────────────────────────────────────────────
export function parseAliExpressId(inputUrl) {
  try {
    const parsed = new URL(inputUrl);
    const fromQuery = parsed.searchParams.get('productIds') || parsed.searchParams.get('productId');
    if (fromQuery) {
      const first = fromQuery.split(',')[0]?.split(':')[0]?.trim();
      if (first && /^\d{8,}$/.test(first)) return first;
    }
    const itemMatch = parsed.pathname.match(/\/item\/(?:[a-z-]+\/)?(\d{8,})\.html/i);
    if (itemMatch?.[1]) return itemMatch[1];
    const bare = parsed.pathname.match(/(\d{10,})/);
    if (bare?.[1]) return bare[1];
  } catch { /* fall through */ }
  return null;
}

// ── Pricing helpers ───────────────────────────────────────────────────────────
export function charm(raw) {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  let p = Math.floor(raw) + 0.99;
  if (p < raw) p += 1;
  return Math.round(p * 100) / 100;
}
export function retailFromCost(cost, marginPct) {
  const m = Math.min(Math.max(Number(marginPct) || DEFAULT_MARGIN, 0), 95);
  const raw = Number(cost) / (1 - m / 100);
  return charm(raw);
}
function slugify(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
}

// ── Providers ─────────────────────────────────────────────────────────────────
async function providerOfficial(productId) {
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;
  if (!appKey || !appSecret) return null;

  const gateway = process.env.ALIEXPRESS_GATEWAY || 'https://api-sg.aliexpress.com/sync';
  const method = process.env.ALIEXPRESS_PRODUCT_METHOD || 'aliexpress.ds.product.get';
  const signMethod = (process.env.ALIEXPRESS_SIGN_METHOD || 'sha256').toLowerCase();

  const params = {
    app_key: appKey, method, sign_method: signMethod, timestamp: String(Date.now()),
    format: 'json', v: '2.0',
    product_id: productId, ship_to_country: SHIP_TO, target_currency: CURRENCY, target_language: 'EN',
  };
  const base = Object.keys(params).sort().map((k) => `${k}${params[k]}`).join('');
  params.sign = signMethod === 'md5'
    ? crypto.createHash('md5').update(appSecret + base + appSecret).digest('hex').toUpperCase()
    : crypto.createHmac('sha256', appSecret).update(base).digest('hex').toUpperCase();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let payload;
  try {
    const res = await fetch(gateway, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
      signal: controller.signal,
    });
    payload = await res.json();
  } finally { clearTimeout(timer); }

  const root = payload?.aliexpress_ds_product_get_response?.result || payload?.result
    || payload?.aliexpress_ds_product_get_response || payload;
  if (!root || payload?.error_response) {
    throw new Error(`Official API: ${payload?.error_response?.sub_msg || payload?.error_response?.msg || 'error'}`);
  }

  const info = root.ae_item_base_info_dto || root.base_info || root.item || {};
  const skus = root.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o || root.sku_info?.sku || root.skus || [];
  const media = root.ae_multimedia_info_dto || root.media || {};
  const images = String(media.image_urls || info.image_urls || '').split(/[;,]/).map((s) => s.trim()).filter(Boolean);

  let minPrice = Number(info.sale_price || info.target_sale_price || info.price || 0);
  let totalStock = 0;
  const variants = (Array.isArray(skus) ? skus : []).map((s) => {
    const price = Number(s.offer_sale_price || s.sku_price || s.sale_price || 0);
    if (price && (!minPrice || price < minPrice)) minPrice = price;
    const stock = Number(s.sku_available_stock || s.available_stock || s.stock || 0);
    totalStock += stock;
    const opts = {};
    (s.ae_sku_property_dtos?.ae_sku_property_d_t_o || s.sku_properties || []).forEach((p) => {
      if (p.sku_property_name) opts[p.sku_property_name] = p.sku_property_value || p.property_value_definition_name;
    });
    return { name: Object.values(opts).join(' / ') || 'Default', options: opts, price, cost: price, stock, sku: s.sku_id ? String(s.sku_id) : undefined };
  });
  if (!totalStock && info.total_available_stock) totalStock = Number(info.total_available_stock);

  return {
    title: info.subject || info.title || `AliExpress Item ${productId}`,
    description: info.detail || info.mobile_detail || '',
    images, price: minPrice, currency: CURRENCY, stock: totalStock || null,
    variants, specs: root.ae_item_properties || {}, raw: root, provider: 'official',
  };
}

async function providerThirdParty(productId) {
  const key = process.env.RAPIDAPI_ALIEXPRESS_KEY;
  if (!key) return null;
  const host = process.env.RAPIDAPI_ALIEXPRESS_HOST || 'aliexpress-datahub.p.rapidapi.com';
  const tpl = process.env.RAPIDAPI_ALIEXPRESS_URL
    || `https://${host}/item_detail?itemId={itemId}&region=${SHIP_TO}&currency=${CURRENCY}&locale=en_US`;
  const url = tpl.replace('{itemId}', encodeURIComponent(productId));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let payload;
  try {
    const res = await fetch(url, { headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': host }, signal: controller.signal });
    if (!res.ok) throw new Error(`Third-party API HTTP ${res.status}`);
    payload = await res.json();
  } finally { clearTimeout(timer); }

  const r = payload?.result?.item || payload?.result || payload?.item || payload?.data || payload;
  if (!r) throw new Error('Third-party API: empty response');
  const images = (r.images || r.image_urls || r.gallery || []).map(String).filter(Boolean);
  const skus = r.sku?.props || r.skus || r.variations || [];
  let minPrice = Number(r.sku?.def?.promotionPrice || r.salePrice || r.price || r.app_sale_price || 0);
  let totalStock = Number(r.sku?.def?.quantity || r.quantity || r.totalStock || 0);
  const variants = Array.isArray(skus) ? skus.slice(0, 50).map((s) => {
    const price = Number(s.promotionPrice || s.price || s.salePrice || 0);
    if (price && (!minPrice || price < minPrice)) minPrice = price;
    return { name: String(s.name || s.title || 'Default'), options: s.options || {}, price, cost: price, stock: Number(s.quantity || s.stock || 0) };
  }) : [];

  return {
    title: r.title || r.subject || `AliExpress Item ${productId}`,
    description: r.description || r.desc || '',
    images, price: minPrice, currency: r.currency || CURRENCY, stock: totalStock || null,
    variants, specs: r.properties || r.specs || {}, raw: r, provider: 'third_party',
  };
}

async function providerScrape(productId, url) {
  const candidates = [];
  if (url) candidates.push(url);
  if (productId) candidates.push(`https://www.aliexpress.com/item/${productId}.html`);

  async function fetchHtml(u, useProxy) {
    const target = useProxy ? `https://r.jina.ai/${u}` : u;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(target, {
        headers: useProxy ? { 'User-Agent': 'PinkHaloImporter/1.0' } : {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9', Referer: 'https://www.google.com/',
        },
        signal: controller.signal,
      });
      if (!res.ok) return null;
      return await res.text();
    } catch { return null; } finally { clearTimeout(timer); }
  }

  let html = null;
  for (const c of candidates) { html = await fetchHtml(c, false); if (html) break; }
  if (!html) { for (const c of candidates) { html = await fetchHtml(c, true); if (html) break; } }
  if (!html) throw new Error('Supplier page could not be read (blocked or unreachable).');

  const low = html.toLowerCase();
  if (['captcha', 'attention required', 'access denied', 'verify you are human'].some((s) => low.includes(s))) {
    throw new Error('Supplier page returned a bot challenge (captcha).');
  }

  const meta = (name) => {
    const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:|twitter:)?${name}["'][^>]+content=["']([^"']+)["']`, 'i'));
    return m ? m[1].trim() : '';
  };
  const title = meta('title') || html.match(/<title>(.*?)<\/title>/i)?.[1]?.trim() || `AliExpress Item ${productId}`;
  let price = 0;
  const pm = html.match(/["']?(?:sale)?price["']?\s*[:=]\s*["']?\$?([0-9]+(?:\.[0-9]{1,2})?)/i);
  if (pm) price = Number(pm[1]);
  if (!price) { const mp = meta('price:amount') || meta('product:price:amount'); if (mp) price = Number(mp); }

  return {
    title, description: meta('description') || '', images: [...new Set([meta('image')].filter(Boolean))],
    price, currency: CURRENCY, stock: null, variants: [], specs: {}, raw: { scraped: true }, provider: 'scrape',
  };
}

export async function fetchSourceProduct(productId, url) {
  const errors = [];
  for (const provider of [providerOfficial, providerThirdParty, providerScrape]) {
    try { const result = await provider(productId, url); if (result) return result; }
    catch (e) { errors.push(`${provider.name}: ${e.message || e}`); }
  }
  throw new Error(errors.join(' | ') || 'No provider could read that product.');
}

// ── DB helpers ────────────────────────────────────────────────────────────────
async function resolveCategoryId(db, name) {
  if (!name) return null;
  const wanted = String(name).trim().toLowerCase();
  const { data } = await db.from('categories').select('id,name,slug');
  return (data || []).find((c) => String(c.name).toLowerCase() === wanted || String(c.slug).toLowerCase() === wanted)?.id || null;
}
async function logSync(db, row) {
  try { await db.from('dropship_sync_log').insert(row); } catch { /* non-fatal */ }
}

// ── Import ────────────────────────────────────────────────────────────────────
export async function importUrls(db, { urls, status, margin_percent, category }) {
  const marginPct = Number.isFinite(Number(margin_percent)) ? Number(margin_percent) : DEFAULT_MARGIN;
  const wantStatus = status === 'active' ? 'active' : 'draft';
  const categoryId = await resolveCategoryId(db, category || DEFAULT_CATEGORY);
  const results = [];

  for (const rawUrl of urls) {
    const url = String(rawUrl || '').trim();
    if (!url) continue;
    const productId = parseAliExpressId(url);
    if (!productId) { results.push({ url, ok: false, error: 'Could not find an AliExpress product id in that link.' }); continue; }

    const { data: existing } = await db.from('products').select('id,name').eq('source_product_id', productId).maybeSingle();
    if (existing) { results.push({ url, ok: false, skipped: true, error: `Already imported as "${existing.name}".`, id: existing.id }); continue; }

    let src, warning = null, syncStatus = 'ok';
    try { src = await fetchSourceProduct(productId, url); }
    catch (e) {
      warning = String(e.message || e); syncStatus = 'error';
      src = { title: `AliExpress Item ${productId}`, description: `Imported from ${url}. Supplier data could not be read automatically — add price and photos, or set an API key and re-sync.`, images: [], price: 0, currency: CURRENCY, stock: null, variants: [], specs: {}, raw: { failed: true }, provider: 'none' };
    }

    const cost = Number(src.price) || 0;
    const price = cost > 0 ? retailFromCost(cost, marginPct) : 0;
    if (cost <= 0 && syncStatus !== 'error') { syncStatus = 'price_changed'; warning = warning || 'Supplier price unavailable — set a price before publishing.'; }

    const record = {
      name: src.title.slice(0, 200), slug: slugify(src.title) || `ali-${productId}`,
      description: src.description || '', category_id: categoryId,
      price, compare_at_price: price ? charm(price * 1.4) : null, cost,
      sku: `PH-DS-${productId}`,
      stock: src.stock != null ? Math.max(0, Math.round(src.stock)) : 0, low_stock_threshold: 10,
      images: (src.images || []).slice(0, 10), tags: ['dropship', 'aliexpress'],
      status: wantStatus, fulfillment_method: 'dropship',
      source: 'aliexpress', source_url: url, source_product_id: productId,
      source_price: cost, source_currency: src.currency || CURRENCY,
      source_stock: src.stock != null ? Math.round(src.stock) : null,
      source_data: { specs: src.specs || {}, provider: src.provider, variants_count: (src.variants || []).length, imported_at: new Date().toISOString(), warning },
      sync_status: syncStatus, sync_error: warning, auto_sync: true, markup_percent: marginPct,
      shipping_lead_days: 15, last_synced_at: new Date().toISOString(),
    };

    const { data: inserted, error } = await db.from('products').insert(record).select('id,name,price,cost,status,sync_status').single();
    if (error) { results.push({ url, ok: false, error: error.message }); continue; }

    if (Array.isArray(src.variants) && src.variants.length) {
      await db.from('product_variants').insert(src.variants.slice(0, 50).map((v) => ({
        product_id: inserted.id, name: v.name || 'Default', options: v.options || {},
        price: v.price || null, cost: v.cost || null, stock: Math.max(0, Math.round(v.stock || 0)), sku: v.sku || null,
      })));
    }

    await logSync(db, { product_id: inserted.id, event: 'import', new_price: cost, new_stock: record.source_stock, status: syncStatus, message: warning || `Imported via ${src.provider}` });
    results.push({ url, ok: true, id: inserted.id, name: inserted.name, price: Number(inserted.price), cost: Number(inserted.cost), status: inserted.status, sync_status: inserted.sync_status, provider: src.provider, warning });
  }
  return results;
}

// ── Sync ──────────────────────────────────────────────────────────────────────
export async function syncProducts(db, { id } = {}) {
  let query = db.from('products')
    .select('id,name,price,cost,source_price,source_stock,source_product_id,source_url,markup_percent,auto_sync')
    .eq('source', 'aliexpress');
  query = id ? query.eq('id', id) : query.eq('auto_sync', true);
  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);

  const results = [];
  for (const p of rows || []) {
    try {
      const src = await fetchSourceProduct(p.source_product_id, p.source_url);
      const newCost = Number(src.price) || 0;
      const oldCost = Number(p.source_price) || 0;
      const newStock = src.stock != null ? Math.max(0, Math.round(src.stock)) : (p.source_stock ?? 0);
      const oldStock = p.source_stock ?? 0;
      const costMoved = oldCost > 0 && newCost > 0 && Math.abs(newCost - oldCost) / oldCost > PRICE_CHANGE_THRESHOLD;
      let syncStatus = 'ok';
      if (newStock <= 0) syncStatus = 'out_of_stock';
      else if (costMoved) syncStatus = 'price_changed';

      const updates = {
        source_price: newCost || oldCost, source_stock: newStock, stock: newStock,
        cost: newCost || p.cost, sync_status: syncStatus, sync_error: null,
        last_synced_at: new Date().toISOString(),
        source_data: { specs: src.specs || {}, provider: src.provider, synced_at: new Date().toISOString() },
      };
      if (process.env.DROPSHIP_AUTO_REPRICE === 'true' && newCost > 0) {
        updates.price = retailFromCost(newCost, p.markup_percent || DEFAULT_MARGIN);
      }
      await db.from('products').update(updates).eq('id', p.id);
      await logSync(db, { product_id: p.id, event: 'sync', old_price: oldCost, new_price: newCost, old_stock: oldStock, new_stock: newStock, status: syncStatus, message: `Synced via ${src.provider}` });
      results.push({ id: p.id, name: p.name, sync_status: syncStatus, cost: newCost, stock: newStock, provider: src.provider });
    } catch (e) {
      const msg = String(e.message || e);
      await db.from('products').update({ sync_status: 'error', sync_error: msg, last_synced_at: new Date().toISOString() }).eq('id', p.id);
      await logSync(db, { product_id: p.id, event: 'error', status: 'error', message: msg });
      results.push({ id: p.id, name: p.name, sync_status: 'error', error: msg });
    }
  }
  return results;
}
