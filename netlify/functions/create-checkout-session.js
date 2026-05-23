import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const siteUrl = process.env.SITE_URL || 'http://localhost:4173';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Only POST requests are supported.' }) };
  }
  if (!stripeSecret) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Stripe secret key not configured.' }) };
  }
  const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON payload.' }) };
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Checkout payload is missing items.' }) };
  }

  try {
    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.url || 'Pink Halo Co. order'
        },
        unit_amount: Number(item.amount) || 0
      },
      quantity: Number(item.quantity) || 1
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${siteUrl}/?checkout=success`,
      cancel_url: `${siteUrl}/?checkout=cancel`
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url, sessionId: session.id }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Unable to create Stripe checkout session.' }) };
  }
}
