export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // ✅ Google Merchant Feed — API se fetch (SABSE UPAR — order important hai)
  if (url.pathname === '/feed/google.xml') {
    try {
      const apiRes = await fetch('https://api.mypinkshop.com/api/feed/google.xml', {
        method: 'GET',
        headers: {
          'Accept': 'application/xml',
          'User-Agent': 'MyPinkShop-Pages-Function',
        },
      });

      if (!apiRes.ok) {
        return new Response(`Feed API error: ${apiRes.status}`, {
          status: 502,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      const xml = await apiRes.text();

      return new Response(xml, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (err) {
      console.error('Feed proxy error:', err);
      return new Response('Feed proxy failed', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }

  // ✅ Assets — static files
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/static/') ||
    /\.(js|mjs|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|json|txt|xml|map|webmanifest)$/i.test(url.pathname)
  ) {
    return next();
  }

  // ✅ SPA fallback — baaki sab React app ko
  return next('/index.html');
}
