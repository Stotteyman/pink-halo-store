/**
 * ph-unsubscribe — one-click unsubscribe from marketing email (public).
 * Link format: /api/ph-unsubscribe?e=<base64url email>&t=<hmac token>
 */
import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SCHEMA = process.env.SUPABASE_SCHEMA || process.env.PH_SCHEMA || 'public';

const page = (title, message) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
  body: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:Georgia,serif;background:#F7F0EA;color:#40282E;display:grid;place-items:center;min-height:100vh;margin:0">
<div style="text-align:center;padding:40px;max-width:420px">
  <p style="letter-spacing:.24em;font-size:13px;color:#C9A36B">PINK HALO CO.</p>
  <h1 style="font-weight:500">${title}</h1>
  <p style="color:#7D6167">${message}</p>
  <a href="https://pinkhalo.co" style="color:#B4707E">Back to the store</a>
</div></body></html>`,
});

export async function handler(event) {
  const params = event.queryStringParameters || {};
  let email = '';
  try { email = Buffer.from(String(params.e || ''), 'base64url').toString('utf8').toLowerCase().trim(); } catch { /* invalid */ }
  const token = String(params.t || '');

  const secret = process.env.EMAIL_SMTP_PASSWORD || 'pinkhalo';
  const expected = createHmac('sha256', secret).update(email).digest('hex').slice(0, 32);
  if (!email || !email.includes('@') || token !== expected) {
    return page('Link not valid', 'This unsubscribe link is incomplete or expired. Reply to any of our emails and we will remove you manually.');
  }

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: SCHEMA }, auth: { persistSession: false } });
    // anon may only INSERT; an existing row (already unsubscribed) is fine
    const { error } = await db.from('email_unsubscribes').insert({ email });
    if (error && error.code !== '23505') throw new Error(error.message);
  } catch (error) {
    console.error('Unsubscribe failed:', error.message);
    return page('Something went wrong', 'We could not process this right now — reply to any of our emails and we will remove you manually.');
  }

  return page("You're unsubscribed", `${email} will no longer receive marketing email from Pink Halo Co. Order and shipping emails are unaffected.`);
}
