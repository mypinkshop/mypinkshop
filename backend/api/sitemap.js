const Product = require('../models/Product');

async function generateSitemap() {
  try {
    const baseUrl = 'https://www.mypinkshop.com';
    
    // Fetch all active products
    const products = await Product.find({ status: 'active', adminApproved: true });
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Static pages
    const staticPages = [
      { url: '', priority: 1.0, changefreq: 'daily' },
      { url: '/shop', priority: 0.9, changefreq: 'daily' },
      { url: '/skincare', priority: 0.8, changefreq: 'weekly' },
      { url: '/makeup', priority: 0.8, changefreq: 'weekly' },
      { url: '/hair', priority: 0.8, changefreq: 'weekly' },
      { url: '/clothing', priority: 0.8, changefreq: 'weekly' },
      { url: '/accessories', priority: 0.8, changefreq: 'weekly' },
      { url: '/contact', priority: 0.5, changefreq: 'monthly' },
      { url: '/faqs', priority: 0.5, changefreq: 'monthly' },
      { url: '/shipping-info', priority: 0.4, changefreq: 'monthly' },
      { url: '/returns-policy', priority: 0.4, changefreq: 'monthly' },
      { url: '/privacy', priority: 0.4, changefreq: 'monthly' },
      { url: '/terms', priority: 0.4, changefreq: 'monthly' }
    ];
    
    staticPages.forEach(page => {
      xml += `<url>`;
      xml += `<loc>${baseUrl}${page.url}</loc>`;
      xml += `<changefreq>${page.changefreq}</changefreq>`;
      xml += `<priority>${page.priority}</priority>`;
      xml += `</url>\n`;
    });
    
    // Product pages
    products.forEach(product => {
      xml += `<url>`;
      xml += `<loc>${baseUrl}/product/${product._id}</loc>`;
      xml += `<lastmod>${new Date(product.updatedAt || product.createdAt).toISOString().split('T')[0]}</lastmod>`;
      xml += `<changefreq>weekly</changefreq>`;
      xml += `<priority>0.7</priority>`;
      xml += `</url>\n`;
    });
    
    xml += '</urlset>';
    
    return xml;
  } catch (error) {
    console.error('Sitemap generation error:', error);
    throw error;
  }
}

module.exports = { generateSitemap };
