import { mailConfigured, sendMail } from './_mail.js';

/**
 * ph-contact — public contact form intake.
 * Routes the message to the right inbox by topic and sends from the matching
 * alias. Honeypot field + size limits keep casual bots out.
 */
const TOPICS = {
  support: { to: 'support@pinkhalo.co', from: 'support', label: 'Support' },
  order:   { to: 'sales@pinkhalo.co',   from: 'sales',   label: 'Order help' },
  sales:   { to: 'sales@pinkhalo.co',   from: 'sales',   label: 'Sales' },
  careers: { to: 'careers@pinkhalo.co', from: 'careers', label: 'Careers' },
  other:   { to: 'hello@pinkhalo.co',   from: 'hello',   label: 'General' },
};

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Only POST requests are supported.' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON payload.' }); }

  // Honeypot: real users never fill this hidden field
  if (body.website) return json(200, { success: true });

  const name = String(body.name || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().slice(0, 200);
  const message = String(body.message || '').trim().slice(0, 5000);
  const orderRef = String(body.orderRef || '').trim().slice(0, 40);
  const topic = TOPICS[String(body.topic || '').toLowerCase()] || TOPICS.support;

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: 'Name, a valid email, and a message are required.' });
  }
  if (!mailConfigured()) return json(500, { error: 'Email service is not configured.' });

  try {
    await sendMail({
      from: topic.from,
      to: topic.to,
      replyTo: `${name} <${email}>`,
      subject: `[${topic.label}] ${name}${orderRef ? ` — order ${orderRef}` : ''}`,
      text: `From: ${name} <${email}>${orderRef ? `\nOrder: ${orderRef}` : ''}\nTopic: ${topic.label}\n\n${message}`,
    });
    return json(200, { success: true });
  } catch (error) {
    console.error('ph-contact send failed:', error.message);
    return json(500, { error: 'Could not send your message right now. Please email us directly.' });
  }
}
