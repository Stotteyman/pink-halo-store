/**
 * ph-dropship-cron — scheduled auto-sync of every dropship product.
 * Runs daily (see `schedule` below) and re-polls AliExpress for price + stock on
 * all products where auto_sync = true, mirroring live availability to the store
 * and flagging supplier price changes. Same core as the manual "Re-sync" button.
 *
 * Netlify runs this on its cron; it is not a public HTTP endpoint.
 */

import { getSupabaseServiceClient } from './_auth.js';
import { syncProducts } from './_dropship.js';

export const config = {
  schedule: '@daily', // change to e.g. '0 */6 * * *' for every 6 hours
};

export async function handler() {
  try {
    const db = getSupabaseServiceClient();
    const results = await syncProducts(db, {});
    const flagged = results.filter((r) => r.sync_status && r.sync_status !== 'ok');
    console.log(`[ph-dropship-cron] synced ${results.length} products; ${flagged.length} need attention`,
      flagged.map((f) => `${f.name}:${f.sync_status}`));
    return { statusCode: 200, body: JSON.stringify({ synced: results.length, flagged: flagged.length }) };
  } catch (e) {
    console.error('[ph-dropship-cron] failed', e);
    return { statusCode: 500, body: JSON.stringify({ error: String(e.message || e) }) };
  }
}
