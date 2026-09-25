export async function onRequest() {
  try {
    const response = await fetch('https://api.mypinkshop.com/sitemap.xml');
    
    if (!response.ok) {
      return new Response('Sitemap not available', { status: 500 });
    }
    
    const xml = await response.text();

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (err) {
    return new Response('Error loading sitemap', { status: 500 });
  }
}
