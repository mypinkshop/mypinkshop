export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/static/') ||
    /\.(js|mjs|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|json|txt|xml|map|webmanifest)$/i.test(url.pathname)
  ) {
    return next();
  }

  return next('/index.html');
}
