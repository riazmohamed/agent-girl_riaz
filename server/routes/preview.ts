/**
 * Preview proxy route - serves localhost dev server content in an iframe
 * Security: Only allows localhost/127.0.0.1/[::1] targets, ports 1024-65535
 */

export async function handlePreviewRoutes(req: Request, url: URL): Promise<Response | undefined> {
  // Only handle /api/preview/* routes
  if (!url.pathname.startsWith('/api/preview/')) {
    return undefined;
  }

  if (url.pathname === '/api/preview/proxy' && req.method === 'GET') {
    return handleProxyRequest(url);
  }

  return undefined;
}

async function handleProxyRequest(url: URL): Promise<Response> {
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate the target URL
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Security: Only allow localhost targets
  const allowedHosts = ['localhost', '127.0.0.1', '[::1]', '::1'];
  if (!allowedHosts.includes(parsed.hostname)) {
    return new Response(JSON.stringify({ error: 'Only localhost URLs are allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Security: Restrict port range
  const port = parseInt(parsed.port || '80');
  if (port < 1024 || port > 65535) {
    return new Response(JSON.stringify({ error: 'Port must be between 1024 and 65535' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Fetch with 10s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'AgentGirl-Preview/1.0',
      },
    });

    clearTimeout(timeoutId);

    // Get content type
    const contentType = response.headers.get('Content-Type') || 'text/html';

    // For HTML responses, inject <base> tag and strip blocking headers
    if (contentType.includes('text/html')) {
      let html = await response.text();

      // Inject <base> tag so relative URLs resolve to the dev server
      const baseUrl = `${parsed.protocol}//${parsed.host}`;
      const baseTag = `<base href="${baseUrl}/" />`;

      // Insert base tag after <head> or at the start of the document
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}`);
      } else if (html.includes('<head ')) {
        html = html.replace(/<head\s[^>]*>/, `$&${baseTag}`);
      } else if (html.includes('<html')) {
        html = html.replace(/<html[^>]*>/, `$&<head>${baseTag}</head>`);
      } else {
        html = `${baseTag}${html}`;
      }

      // Build response headers, stripping iframe-blocking headers
      const responseHeaders = new Headers();
      responseHeaders.set('Content-Type', contentType);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      // Deliberately NOT forwarding X-Frame-Options, Content-Security-Policy,
      // or any cookies from the target

      return new Response(html, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    // For non-HTML content (CSS, JS, images, etc.), proxy as-is
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    // Forward cache headers if present
    const cacheControl = response.headers.get('Cache-Control');
    if (cacheControl) {
      responseHeaders.set('Cache-Control', cacheControl);
    }

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy request failed';

    if (message.includes('abort')) {
      return new Response(JSON.stringify({ error: 'Request timed out (10s)' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
