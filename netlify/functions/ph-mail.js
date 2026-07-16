/**
 * ph-mail — staff webmail over the Zoho mailbox
 * GET  /api/ph-mail             → recent INBOX messages (envelope + flags)
 * GET  /api/ph-mail?uid=NNN     → one message, parsed (html/text, attachments meta)
 * POST /api/ph-mail             → send/reply:
 *   { to, subject, html|text, from: 'hello|sales|support|help|careers',
 *     inReplyTo?, references?, includeSignature?: true,
 *     attachments?: [{ filename, contentType, contentBase64 }] }
 */
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { getAuthContext, getSupabaseUserClient, hasRole, json } from './_auth.js';
import { defaultSignature, mailConfigured, sendMail } from './_mail.js';

function imapClient() {
  return new ImapFlow({
    host: process.env.EMAIL_IMAP_HOST || 'imap.zoho.com',
    port: Number(process.env.EMAIL_IMAP_PORT || 993),
    secure: true,
    auth: { user: process.env.EMAIL_SMTP_USER, pass: process.env.EMAIL_SMTP_PASSWORD },
    logger: false,
  });
}

const addr = (a) => (a?.value || []).map(v => (v.name ? `${v.name} <${v.address}>` : v.address)).join(', ');

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });

  const auth = await getAuthContext(event);
  if (!hasRole(auth.role, 'staff')) return json(403, { error: 'Staff access required' });
  if (!mailConfigured()) return json(500, { error: 'Email service is not configured.' });

  const params = event.queryStringParameters || {};

  if (event.httpMethod === 'GET') {
    const client = imapClient();
    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');
      try {
        // Single message, fully parsed
        if (params.uid) {
          const { content } = await client.download(String(params.uid), undefined, { uid: true });
          const parsed = await simpleParser(content);
          return json(200, {
            message: {
              uid: Number(params.uid),
              from: addr(parsed.from),
              to: addr(parsed.to),
              subject: parsed.subject || '(no subject)',
              date: parsed.date || null,
              messageId: parsed.messageId || null,
              references: parsed.references || [],
              html: parsed.html || null,
              text: parsed.text || '',
              attachments: (parsed.attachments || []).map(a => ({ filename: a.filename, contentType: a.contentType, size: a.size })),
            },
          });
        }

        // Recent list
        const total = client.mailbox.exists;
        if (!total) return json(200, { messages: [], total: 0 });
        const start = Math.max(1, total - 29);
        const messages = [];
        for await (const msg of client.fetch(`${start}:*`, { uid: true, envelope: true, flags: true, internalDate: true })) {
          const env = msg.envelope || {};
          messages.push({
            uid: msg.uid,
            subject: env.subject || '(no subject)',
            from: (env.from || []).map(f => (f.name ? `${f.name} <${f.address}>` : f.address)).join(', '),
            to: (env.to || []).map(f => f.address).join(', '),
            date: msg.internalDate || env.date || null,
            seen: msg.flags?.has('\\Seen') ?? false,
            messageId: env.messageId || null,
          });
        }
        messages.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        return json(200, { messages, total });
      } finally {
        lock.release();
      }
    } catch (error) {
      console.error('IMAP error:', error.message);
      return json(502, { error: `Could not reach the mailbox: ${error.message}` });
    } finally {
      await client.logout().catch(() => undefined);
    }
  }

  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }
    const { to, subject, html, text, from, inReplyTo, references, attachments, includeSignature = true } = body;
    if (!to || !subject || !(html || text)) return json(400, { error: 'Recipient, subject, and body are required.' });

    let signature = '';
    if (includeSignature) {
      try {
        const db = getSupabaseUserClient(auth.token);
        const { data } = await db.from('settings').select('value').eq('key', 'email_signature_html').maybeSingle();
        signature = typeof data?.value === 'string' && data.value.trim() ? data.value : defaultSignature(from);
      } catch {
        signature = defaultSignature(from);
      }
    }

    const bodyHtml = html || `<p>${String(text).replace(/\n/g, '<br>')}</p>`;
    try {
      await sendMail({
        from,
        to,
        subject,
        text: text || undefined,
        html: `<div style="font-family:Georgia,serif;color:#40282E;font-size:15px;line-height:1.55">${bodyHtml}${signature}</div>`,
        inReplyTo,
        references,
        attachments,
      });
      return json(200, { success: true });
    } catch (error) {
      console.error('ph-mail send failed:', error.message);
      return json(500, { error: 'Failed to send. Check SMTP credentials and try again.' });
    }
  }

  return json(405, { error: 'Method not allowed' });
}
