export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // ✅ Google Merchant Feed — API pe redirect
  if (url.pathname === '/feed/google.xml') {
    return fetch('https://api.mypinkshop.com/api/feed/google.xml', {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
      },
    });
  }

  // ✅ Assets — static files
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/static/') ||
    /\.(js|mjs|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|json|txt|xml|map|webmanifest)$/i.test(url.pathname)
  ) {
    return next();
  }

  // ✅ SPA fallback
  return next('/index.html');
}
