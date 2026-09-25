export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  
  // HTML — no cache
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  
  // Assets — long cache
  if (url.pathname.startsWith('/assets/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  return response;
}
