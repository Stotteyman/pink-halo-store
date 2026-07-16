import { getAuthContext, getSupabaseUserClient, json } from './_auth.js';

/**
 * ph-promo — new-account promo status.
 * The active sitewide discount is a members-only promo: it applies to
 * signed-in customers with no prior (non-cancelled) orders. Returns the
 * percent for display plus whether the caller currently qualifies.
 */
export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  const auth = await getAuthContext(event);
  const db = getSupabaseUserClient(auth.token);

  let percent = 0;
  try {
    const { data } = await db
      .from('discounts')
      .select('percent_off')
      .eq('kind', 'sitewide')
      .eq('active', true)
      .order('percent_off', { ascending: false })
      .limit(1);
    percent = Number(data?.[0]?.percent_off || 0);
  } catch { /* no promo */ }

  let eligible = false;
  if (percent > 0 && auth.authenticated) {
    try {
      const { data } = await db.rpc('new_account_promo_eligible');
      eligible = Boolean(data);
    } catch { /* treat as ineligible */ }
  }

  return json(200, { percent, eligible, signed_in: auth.authenticated });
}
