import nodemailer from 'nodemailer';

/**
 * Shared Zoho SMTP mailer. All outgoing store email goes through here so
 * senders stay on the allowlisted pinkhalo.co aliases:
 *   sales    → order receipts, shipping updates, order-related messages
 *   support  → customer questions (contact form)
 *   help     → alias of support routing
 *   hello    → general/default
 *   careers  → job inquiries
 */
const DOMAIN = 'pinkhalo.co';
const ALIASES = ['hello', 'sales', 'support', 'help', 'contact', 'careers'];

export function senderAddress(alias) {
  const key = ALIASES.includes(String(alias || '').toLowerCase()) ? String(alias).toLowerCase() : null;
  if (key) return `Pink Halo Co. <${key}@${DOMAIN}>`;
  return process.env.EMAIL_FROM || process.env.EMAIL_SMTP_USER;
}

export function mailConfigured() {
  return Boolean(
    process.env.EMAIL_SMTP_HOST &&
    process.env.EMAIL_SMTP_USER &&
    process.env.EMAIL_SMTP_PASSWORD
  );
}

export function createTransport() {
  if (!mailConfigured()) throw new Error('Email service is not configured. Set SMTP environment variables.');
  const port = Number(process.env.EMAIL_SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port,
    secure: port === 465,
    pool: true,
    maxConnections: 2,
    auth: { user: process.env.EMAIL_SMTP_USER, pass: process.env.EMAIL_SMTP_PASSWORD },
  });
}

export async function sendMail({ from, to, subject, html, text, replyTo, attachments, inReplyTo, references, transporter }) {
  const transport = transporter || createTransport();
  try {
    return await transport.sendMail({
      from: senderAddress(from),
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      html,
      ...(replyTo ? { replyTo } : {}),
      ...(inReplyTo ? { inReplyTo } : {}),
      ...(references ? { references } : {}),
      ...(Array.isArray(attachments) && attachments.length
        ? { attachments: attachments.map(a => ({ filename: a.filename, content: Buffer.from(a.contentBase64, 'base64'), contentType: a.contentType })) }
        : {}),
    });
  } finally {
    if (!transporter) transport.close();
  }
}

// Default branded signature; the admin can override it via the
// email_signature_html setting (Admin → Mail → signature).
export function defaultSignature(alias) {
  const address = senderAddress(alias);
  const email = /<([^>]+)>/.exec(address)?.[1] || address;
  return `
    <table style="margin-top:24px;border-top:1px solid #F0E3DC;padding-top:14px;font-family:Georgia,serif;color:#40282E">
      <tr>
        <td style="padding-right:14px;vertical-align:middle">
          <img src="https://pinkhalo.co/apple-touch-icon.png" alt="Pink Halo Co." width="44" height="44" style="border-radius:50%">
        </td>
        <td style="vertical-align:middle">
          <p style="margin:0;font-size:15px;letter-spacing:.08em">PINK HALO CO.</p>
          <p style="margin:2px 0 0;font-size:12px;color:#B4707E">Wear Your Halo. · <a href="https://pinkhalo.co" style="color:#B4707E">pinkhalo.co</a></p>
          <p style="margin:2px 0 0;font-size:12px;color:#7D6167">${email}</p>
        </td>
      </tr>
    </table>`;
}
