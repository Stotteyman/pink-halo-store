/**
 * ph-marketing — advertisement campaigns to the customer email list (staff)
 * GET  /api/ph-marketing            → { campaigns, audience: { customers, subscribers, unsubscribed, total } }
 * POST /api/ph-marketing            → create/update a draft ({ id? , subject, from_alias, ... })
 * POST /api/ph-marketing/send       → { id, test?: true } — test sends to the caller only;
 *                                     real sends process up to 25 recipients per call and
 *                                     report { sent, remaining } so the UI loops until done.
 * DELETE /api/ph-marketing?id=      → delete a draft
 */
import { createHmac } from 'node:crypto';
import { getAuthContext, getSupabaseUserClient, hasRole, json } from './_auth.js';
import { createTransport, defaultSignature, mailConfigured, sendMail } from './_mail.js';

const BATCH = 25;

function unsubscribeLink(email) {
  const secret = process.env.EMAIL_SMTP_PASSWORD || 'pinkhalo';
  const token = createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 32);
  const e = Buffer.from(email.toLowerCase()).toString('base64url');
  return `https://pinkhalo.co/api/ph-unsubscribe?e=${e}&t=${token}`;
}

function renderCampaign(campaign, email) {
  const hero = campaign.hero_image_url
    ? `<img src="${campaign.hero_image_url}" alt="" style="width:100%;max-width:560px;display:block;margin:0 auto 20px">`
    : '';
  const cta = campaign.cta_label && campaign.cta_url
    ? `<p style="text-align:center;margin:26px 0"><a href="${campaign.cta_url}" style="background:#B4707E;color:#fff;text-decoration:none;padding:13px 34px;font-size:13px;letter-spacing:.14em;text-transform:uppercase">${campaign.cta_label}</a></p>`
    : '';
  const bodyHtml = campaign.body_html || `<p>${String(campaign.body_text || '').replace(/\n/g, '<br>')}</p>`;
  return `
    <div style="background:#F7F0EA;padding:24px 12px">
      <div style="max-width:560px;margin:0 auto;background:#fff;padding:28px;font-family:Georgia,serif;color:#40282E;font-size:15px;line-height:1.6">
        <p style="text-align:center;letter-spacing:.24em;font-size:13px;margin:0 0 20px">PINK HALO CO.</p>
        ${hero}
        ${bodyHtml}
        ${cta}
        ${defaultSignature(campaign.from_alias)}
        <p style="margin-top:22px;font-size:11px;color:#9A8288;text-align:center">
          You're receiving this because you shopped with or subscribed to Pink Halo Co.<br>
          <a href="${unsubscribeLink(email)}" style="color:#9A8288">Unsubscribe</a>
        </p>
      </div>
    </div>`;
}

async function buildAudience(db) {
  const [orders, subs, unsubs] = await Promise.all([
    db.from('orders').select('customer_email').not('customer_email', 'is', null).limit(5000),
    db.schema('public').from('subscribers').select('email').limit(5000),
    db.from('email_unsubscribes').select('email').limit(5000),
  ]);
  const blocked = new Set((unsubs.data || []).map(r => r.email.toLowerCase()));
  const all = new Set();
  for (const row of orders.data || []) {
    const e = String(row.customer_email || '').toLowerCase().trim();
    if (e && !blocked.has(e)) all.add(e);
  }
  let customerCount = all.size;
  for (const row of subs.data || []) {
    const e = String(row.email || '').toLowerCase().trim();
    if (e && !blocked.has(e)) all.add(e);
  }
  return {
    list: [...all],
    stats: {
      customers: customerCount,
      subscribers: (subs.data || []).length,
      unsubscribed: blocked.size,
      total: all.size,
    },
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });

  const auth = await getAuthContext(event);
  if (!hasRole(auth.role, 'staff')) return json(403, { error: 'Staff access required' });
  const db = getSupabaseUserClient(auth.token);
  const path = event.path || '';

  if (event.httpMethod === 'GET') {
    const [{ data: campaigns, error }, audience] = await Promise.all([
      db.from('marketing_campaigns').select('*').order('created_at', { ascending: false }).limit(100),
      buildAudience(db),
    ]);
    if (error) return json(500, { error: error.message });
    return json(200, { campaigns: campaigns || [], audience: audience.stats });
  }

  if (event.httpMethod === 'POST' && path.endsWith('/send')) {
    if (!mailConfigured()) return json(500, { error: 'Email service is not configured.' });
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }
    const { id, test } = body;
    if (!id) return json(400, { error: 'id required' });

    const { data: campaign, error } = await db.from('marketing_campaigns').select('*').eq('id', id).single();
    if (error || !campaign) return json(404, { error: 'Campaign not found' });
    if (!campaign.subject || !(campaign.body_html || campaign.body_text)) {
      return json(400, { error: 'Campaign needs a subject and body before sending.' });
    }

    if (test) {
      const me = auth.user.email;
      if (!me) return json(400, { error: 'Your account has no email for a test send.' });
      await sendMail({ from: campaign.from_alias, to: me, subject: `[TEST] ${campaign.subject}`, html: renderCampaign(campaign, me) });
      return json(200, { test_sent_to: me });
    }

    if (campaign.status === 'sent') return json(400, { error: 'Campaign was already sent.' });

    const { list } = await buildAudience(db);
    const already = new Set((campaign.sent_emails || []).map(e => String(e).toLowerCase()));
    const pending = list.filter(e => !already.has(e));
    const batch = pending.slice(0, BATCH);

    const transporter = createTransport();
    const delivered = [];
    try {
      for (const email of batch) {
        try {
          await sendMail({ transporter, from: campaign.from_alias, to: email, subject: campaign.subject, html: renderCampaign(campaign, email) });
          delivered.push(email);
        } catch (err) {
          console.error('Campaign send failed for', email, err.message);
        }
      }
    } finally {
      transporter.close();
    }

    const sentEmails = [...already, ...delivered];
    const remaining = pending.length - batch.length;
    const done = remaining === 0;
    await db.from('marketing_campaigns').update({
      sent_emails: sentEmails,
      sent_count: sentEmails.length,
      status: done ? 'sent' : 'sending',
      ...(done ? { sent_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    return json(200, { sent: delivered.length, total_sent: sentEmails.length, remaining, done });
  }

  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }
    const { id, sent_emails, sent_count, status, sent_at, created_at, ...fields } = body;
    const allowedAliases = ['hello', 'sales', 'support', 'careers'];
    if (fields.from_alias && !allowedAliases.includes(fields.from_alias)) fields.from_alias = 'sales';
    fields.updated_at = new Date().toISOString();

    const op = id
      ? db.from('marketing_campaigns').update(fields).eq('id', id).select('*').single()
      : db.from('marketing_campaigns').insert(fields).select('*').single();
    const { data, error } = await op;
    if (error) return json(500, { error: error.message });
    return json(id ? 200 : 201, data);
  }

  if (event.httpMethod === 'DELETE') {
    const id = (event.queryStringParameters || {}).id;
    if (!id) return json(400, { error: 'id query param required' });
    const { error } = await db.from('marketing_campaigns').delete().eq('id', id);
    if (error) return json(500, { error: error.message });
    return json(200, { success: true });
  }

  return json(405, { error: 'Method not allowed' });
}
