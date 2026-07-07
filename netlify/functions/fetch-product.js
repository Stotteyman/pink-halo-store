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
  if (!/^https?:\/\//i.test(url)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Please enter a valid URL starting with http:// or https://.' }) };
  }

  try {
    function parseAliExpressProductId(inputUrl) {
      try {
        const parsed = new URL(inputUrl);
        const fromQuery = parsed.searchParams.get('productIds');
        if (fromQuery) {
          const first = fromQuery.split(',')[0]?.split(':')[0]?.trim();
          if (first && /^\d{10,}$/.test(first)) return first;
        }
        const itemMatch = parsed.pathname.match(/\/item\/(\d+)\.html/i);
        if (itemMatch?.[1]) return itemMatch[1];
      } catch {
        return null;
      }
      return null;
    }

    async function fetchHtml(candidateUrl) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(candidateUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            Referer: 'https://www.google.com/',
          },
          signal: controller.signal,
        });
        if (!response.ok) return null;
        return await response.text();
      } finally {
        clearTimeout(timeout);
      }
    }

    async function fetchViaTextProxy(candidateUrl) {
      const proxyUrl = `https://r.jina.ai/http://${candidateUrl.replace(/^https?:\/\//i, '')}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(proxyUrl, {
          headers: { 'User-Agent': 'PinkHaloScraper/1.0' },
          signal: controller.signal,
        });
        if (!response.ok) return null;
        return await response.text();
      } finally {
        clearTimeout(timeout);
      }
    }

    const aliExpressId = parseAliExpressProductId(url);
    const candidates = [url];
    if (aliExpressId) {
      candidates.push(`https://www.aliexpress.com/item/${aliExpressId}.html`);
    }

    let html = null;
    for (const candidate of candidates) {
      html = await fetchHtml(candidate);
      if (html) break;
    }

    if (!html) {
      for (const candidate of candidates) {
        html = await fetchViaTextProxy(candidate);
        if (html) break;
      }
    }

    if (!html) {
      if (aliExpressId) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            id: aliExpressId,
            name: `AliExpress Item ${aliExpressId}`,
            description: `Imported from AliExpress bundle URL. Verify title, price, and images before publishing. Source: ${url}`,
            imageUrl: '',
            images: [],
            tags: ['aliexpress', 'imported'],
            price: 0,
            warning: 'AliExpress blocked metadata fetch. Basic item draft was created from URL ID; please fill price and details manually.',
          }),
        };
      }
      return {
        statusCode: 422,
        body: JSON.stringify({ error: 'Unable to access that page from importer. Try another product URL or enter details manually.' }),
      };
    }

    const lowerHtml = html.toLowerCase();

    if (
      lowerHtml.includes('captcha') ||
      lowerHtml.includes('attention required') ||
      lowerHtml.includes('access denied') ||
      lowerHtml.includes('verify you are human')
    ) {
      return {
        statusCode: 422,
        body: JSON.stringify({
          error: 'That supplier page blocks automated reads (captcha/challenge). Use another product URL or enter details manually.',
        }),
      };
    }

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

    const rawName =
      findMeta('title') ||
      findMeta('name') ||
      html.match(/<title>(.*?)<\/title>/i)?.[1]?.trim() ||
      (aliExpressId ? `AliExpress Item ${aliExpressId}` : '');
    const description = findMeta('description') || findMeta('og:description') || findMeta('twitter:description') || '';
    const imageCandidates = [
      findMeta('image'),
      findMeta('og:image'),
      findMeta('twitter:image'),
    ].filter(Boolean);
    const images = [...new Set(imageCandidates)];
    const imageUrl = images[0] || '';
    const keywords = findMeta('keywords');
    const tags = keywords
      ? keywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean).slice(0, 10)
      : [];
    const price = findPrice();

    const looksLikeErrorPage = /404|error page|not found|access denied|captcha/i.test(rawName);
    const name = looksLikeErrorPage && aliExpressId ? `AliExpress Item ${aliExpressId}` : rawName;
    const cleanedTags = tags.filter((t) => !/404|error|not found|captcha|denied/.test(t));

    if (!name) {
      return { statusCode: 422, body: JSON.stringify({ error: 'Could not extract product name from that page.' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        description,
        imageUrl,
        images,
        tags: cleanedTags,
        price,
        stock: 12,
        profitMargin: Math.round(price * 0.24),
        warning: price ? null : 'Price could not be detected automatically. Please enter it manually.',
      })
    };
  } catch (error) {
    const message = String(error?.message || '');
    const causeCode = error?.cause?.code;

    if (error?.name === 'AbortError') {
      return {
        statusCode: 504,
        body: JSON.stringify({ error: 'Import timed out while reading that page. Try a lighter product URL or enter details manually.' }),
      };
    }

    if (causeCode === 'UND_ERR_CONNECT_TIMEOUT' || message.toLowerCase().includes('fetch failed')) {
      const aliExpressIdFromErrorPath = (() => {
        try {
          const parsed = new URL(url);
          const fromQuery = parsed.searchParams.get('productIds');
          if (!fromQuery) return null;
          const first = fromQuery.split(',')[0]?.split(':')[0]?.trim();
          return first && /^\d{10,}$/.test(first) ? first : null;
        } catch {
          return null;
        }
      })();

      if (aliExpressIdFromErrorPath) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            id: aliExpressIdFromErrorPath,
            name: `AliExpress Item ${aliExpressIdFromErrorPath}`,
            description: `Imported from AliExpress bundle URL. Verify title, price, and images before publishing. Source: ${url}`,
            imageUrl: '',
            images: [],
            tags: ['aliexpress', 'imported'],
            price: 0,
            warning: 'AliExpress blocked metadata fetch. Basic item draft was created from URL ID; please fill price and details manually.',
          }),
        };
      }

      return {
        statusCode: 422,
        body: JSON.stringify({
          error: 'That supplier page could not be reached from the importer (timeout or blocked request). Try another URL or enter details manually.',
        }),
      };
    }

    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch product metadata. Verify the URL and try again.' }) };
  }
}
