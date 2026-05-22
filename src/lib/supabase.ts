import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseClient: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: false },
      })
    : null;

export async function saveProductToSupabase(product: any) {
  if (!supabaseClient) return null;
  const { data, error } = await supabaseClient.from('products').upsert(product);
  if (error) {
    console.error('Supabase save error', error);
  }
  return data;
}

export async function fetchProductsFromSupabase() {
  if (!supabaseClient) return null;
  const { data, error } = await supabaseClient.from('products').select('*');
  if (error) {
    console.error('Supabase fetch error', error);
    return null;
  }
  return data;
}

export async function saveOrderToSupabase(order: any) {
  if (!supabaseClient) return null;
  const { data, error } = await supabaseClient.from('orders').insert(order);
  if (error) {
    console.error('Supabase order error', error);
  }
  return data;
}
