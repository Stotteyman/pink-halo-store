const subscriberKey = 'pink-halo-subscribers';

export function validateEmail(value: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}

export function loadSubscribers(): string[] {
  try {
    const raw = localStorage.getItem(subscriberKey);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch (error) {
    console.warn('Unable to load subscribers', error);
    return [];
  }
}

export function saveSubscribers(subscribers: string[]) {
  try {
    localStorage.setItem(subscriberKey, JSON.stringify(subscribers));
  } catch (error) {
    console.warn('Unable to save subscribers', error);
  }
}

export async function saveSubscriberToSupabase(email: string) {
  try {
    const { supabaseClient } = await import('./supabase');
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient.from('subscribers').upsert({ email });
    if (error) {
      console.error('Supabase save subscriber error', error);
    }
    return data;
  } catch (error) {
    console.warn('Supabase subscriber save unavailable', error);
    return null;
  }
}

export async function fetchSubscribersFromSupabase() {
  try {
    const { supabaseClient } = await import('./supabase');
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient.from('subscribers').select('email');
    if (error) {
      console.error('Supabase fetch subscribers error', error);
      return null;
    }
    return data as Array<{ email: string }>;
  } catch (error) {
    console.warn('Supabase subscriber fetch unavailable', error);
    return null;
  }
}
