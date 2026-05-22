export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Only POST requests are supported.' }) };
  }
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request payload.' }) };
  }
  const { url } = body;
  if (!url) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Product URL is required.' }) };
  }
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'PinkHaloScraper/1.0' } });
    const html = await response.text();

    const findMeta = (name) => {
      const regex = new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:|twitter:)?${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
      const match = html.match(regex);
      return match ? match[1].trim() : '';
    };

    const findPrice = () => {
      const priceMatch = html.match(/(?:\"|\')?price(?:\"|\')?\s*[:=]\s*(?:\"|\')?\$?([0-9]+(?:\.[0-9]{1,2})?)/i);
      if (priceMatch) return Number(priceMatch[1]);
      const metaPrice = findMeta('price:amount') || findMeta('product:price:amount');
      return metaPrice ? Number(metaPrice) : 0;
    };

    const name = findMeta('title') || findMeta('name') || html.match(/<title>(.*?)<\/title>/i)?.[1]?.trim() || '';
    const description = findMeta('description') || findMeta('og:description') || findMeta('twitter:description') || '';
    const imageUrl = findMeta('image') || findMeta('og:image') || findMeta('twitter:image') || '';
    const price = findPrice();

    if (!name || !price) {
      return { statusCode: 422, body: JSON.stringify({ error: 'Unable to extract enough product details from the provided URL.' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ id: name.toLowerCase().replace(/\s+/g, '-'), name, description, imageUrl, price, stock: 12, profitMargin: Math.round(price * 0.24) })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch product metadata. Verify the URL and try again.' }) };
  }
}
