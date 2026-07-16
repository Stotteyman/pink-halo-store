import { getAuthContext, hasRole } from './_auth.js';
import { mailConfigured, sendMail } from './_mail.js';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Only POST requests are supported.' }) };
  }

  // Staff only — with live SMTP credentials an open endpoint would let
  // anyone send mail as the store's domain.
  const auth = await getAuthContext(event);
  if (!hasRole(auth.role, 'staff')) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Staff access required' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON payload.' }) };
  }

  const { to, subject, html, text, from } = body;

  if (!mailConfigured()) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Email service is not configured. Set SMTP environment variables.' }) };
  }
  if (!to || !subject || !(html || text)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email recipient, subject, and body are required.' }) };
  }

  try {
    await sendMail({ from, to, subject, html, text });
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('send-email failed:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send email. Verify SMTP credentials and recipient list.' }) };
  }
}
