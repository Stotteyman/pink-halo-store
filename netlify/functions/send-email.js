import nodemailer from 'nodemailer';
import { getAuthContext, hasRole } from './_auth.js';

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

  const { to, subject, html, text } = body;
  const host = process.env.EMAIL_SMTP_HOST;
  const port = Number(process.env.EMAIL_SMTP_PORT || 465);
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM || process.env.EMAIL_SMTP_USER;

  if (!host || !port || !user || !pass || !from) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Email service is not configured. Set SMTP environment variables.' })
    };
  }

  if (!to || !subject || !(html || text)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Email recipient, subject, and body are required.' })
    };
  }

  const recipients = Array.isArray(to) ? to.join(', ') : to;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });

    await transporter.sendMail({
      from,
      to: recipients,
      subject,
      text,
      html
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send email. Verify SMTP credentials and recipient list.' })
    };
  }
}
