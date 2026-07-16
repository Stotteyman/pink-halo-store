import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Category, PHProduct, PHOrder, PHManufacturer, PHDiscount, PHUserRole, Product } from './types';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Public client (anon key, respects RLS)
export const supabaseClient: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;

async function authHeaders(): Promise<Record<string, string>> {
  if (!supabaseClient) return {};
  const { data } = await supabaseClient.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = await authHeaders();
  const res = await fetch('/api/' + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error('API route unavailable. Run with Netlify dev or deploy functions so /api endpoints return JSON.');
  }

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const err = payload && typeof payload === 'object' ? payload as { error?: string } : { error: res.statusText };
    throw new Error(err.error || 'API error');
  }
  return payload;
}

// ── Auth & roles ─────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  if (!supabaseClient) throw new Error('Supabase is not configured');
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    // Pink Halo shares its Supabase project with other apps, so this must resolve
    // to Pink Halo's own origin+path (never a hardcoded domain) and stay on the
    // page the user started from. Supabase only honors it if that exact origin is
    // in the project's Auth > URL Configuration > Redirect URLs allow list.
    options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
  });
  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string) {
  if (!supabaseClient) throw new Error('Supabase is not configured');
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabaseClient) throw new Error('Supabase is not configured');
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOutSupabase() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
}

export async function updateProfile(updates: { fullName?: string; phone?: string; password?: string }) {
  if (!supabaseClient) throw new Error('Supabase is not configured');
  const payload: { data?: Record<string, unknown>; password?: string } = {};
  const metadata: Record<string, unknown> = {};
  if (updates.fullName !== undefined) metadata.full_name = updates.fullName;
  // Stored in user metadata (not auth.phone) so no SMS verification is needed
  if (updates.phone !== undefined) metadata.phone = updates.phone;
  if (Object.keys(metadata).length > 0) payload.data = metadata;
  if (updates.password) payload.password = updates.password;
  const { data, error } = await supabaseClient.auth.updateUser(payload);
  if (error) throw error;
  return data;
}

export async function fetchCurrentUserRole() {
  return apiFetch('ph-user-roles', { method: 'GET' });
}

export async function fetchUserRoles() {
  return apiFetch('ph-user-roles', { method: 'GET' }) as Promise<{ roles: PHUserRole[]; current_role?: string }>;
}

export async function updateUserRole(userId: string, role: PHUserRole['role']) {
  return apiFetch('ph-user-roles', {
    method: 'PUT',
    body: JSON.stringify({ user_id: userId, role }),
  });
}

// ── Products ─────────────────────────────────────────────────────────────────

export async function fetchProducts(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch('ph-products' + qs, { method: 'GET' });
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function fetchPublishedStorefrontProducts(): Promise<Product[]> {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient
    .from('pinkhalo_storefront_products')
    .select('id,name,slug,description,price,compare_at_price,preorder,stock,images,category_name,tags');
  if (error) throw error;
  const categories: Category[] = ['Dresses', 'Tops', 'Bottoms', 'Sets', 'Lounge', 'Accessories', 'Sale'];
  return (data || []).flatMap(row => {
    const category = categories.find(item => item.toLowerCase() === String(row.category_name || '').toLowerCase());
    if (!category) return [];
    const name = String(row.name);
    const slug = row.slug ? String(row.slug) : slugify(name);
    return [{
      id: String(row.id),
      name,
      slug,
      description: String(row.description || ''),
      price: Number(row.price),
      compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : undefined,
      preorder: Boolean(row.preorder),
      stock: Number(row.stock),
      imageUrl: Array.isArray(row.images) && row.images[0] ? String(row.images[0]) : '',
      category,
      link: `/${category.toLowerCase()}/${slug}`,
      tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
      profitMargin: 0,
    }];
  });
}

export async function fetchProduct(id: string) {
  return apiFetch('ph-products?id=' + id, { method: 'GET' });
}

// Upload a product image file to Supabase Storage and return its public URL.
const PRODUCT_IMAGE_BUCKET = 'product-images';
export async function uploadProductImage(file: File): Promise<string> {
  if (!supabaseClient) throw new Error('Supabase is not configured');
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabaseClient.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type || undefined });
  if (error) throw new Error(error.message || 'Image upload failed. Make sure you are signed in.');
  const { data } = supabaseClient.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function createProduct(product: Partial<PHProduct> & { variants?: unknown[] }) {
  return apiFetch('ph-products', { method: 'POST', body: JSON.stringify(product) });
}

export async function updateProduct(id: string, updates: Partial<PHProduct> & { variants?: unknown[] }) {
  return apiFetch('ph-products', { method: 'PUT', body: JSON.stringify({ id, ...updates }) });
}

export async function deleteProduct(id: string) {
  return apiFetch('ph-products?id=' + id, { method: 'DELETE' });
}

// ── Orders ───────────────────────────────────────────────────────────────────

export async function fetchOrders(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch('ph-orders' + qs, { method: 'GET' });
}

export async function fetchOrder(id: string) {
  return apiFetch('ph-orders?id=' + id, { method: 'GET' });
}

export async function updateOrder(id: string, updates: Partial<PHOrder>) {
  return apiFetch('ph-orders', { method: 'PUT', body: JSON.stringify({ id, ...updates }) });
}

export async function refundOrder(order_id: string, amount_cents?: number) {
  return apiFetch('ph-orders/refund', {
    method: 'POST',
    body: JSON.stringify({ order_id, amount_cents }),
  });
}

// ── Manufacturers ─────────────────────────────────────────────────────────────

export async function fetchManufacturers(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch('ph-manufacturers' + qs, { method: 'GET' });
}

export async function discoverManufacturers(query: string) {
  return apiFetch('ph-manufacturers?discover=' + encodeURIComponent(query), { method: 'GET' });
}

export async function createManufacturer(mfr: Partial<PHManufacturer>) {
  return apiFetch('ph-manufacturers', { method: 'POST', body: JSON.stringify(mfr) });
}

export async function updateManufacturer(id: string, updates: Partial<PHManufacturer>) {
  return apiFetch('ph-manufacturers', { method: 'PUT', body: JSON.stringify({ id, ...updates }) });
}

export async function deleteManufacturer(id: string) {
  return apiFetch('ph-manufacturers?id=' + id, { method: 'DELETE' });
}

// ── Discounts ────────────────────────────────────────────────────────────────

export async function fetchDiscounts() {
  return apiFetch('ph-discounts', { method: 'GET' });
}

export async function createDiscount(discount: Partial<PHDiscount>) {
  return apiFetch('ph-discounts', { method: 'POST', body: JSON.stringify(discount) });
}

export async function updateDiscount(id: string, updates: Partial<PHDiscount>) {
  return apiFetch('ph-discounts', { method: 'PUT', body: JSON.stringify({ id, ...updates }) });
}

export async function deleteDiscount(id: string) {
  return apiFetch('ph-discounts?id=' + id, { method: 'DELETE' });
}
