import { Hono } from 'hono';

const imports = new Hono();

// Helper to check if user is admin
const isAdmin = (c) => {
  const user = c.get('user');
  return user && user.role === 'admin';
};

// 🔥 Simple Amazon Scraper (Cloudflare Workers compatible)
// NOTE: Ye ek basic scraper hai. Aapko production mein official API ya robust library use karni chahiye.
async function scrapeAmazonProduct(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch Amazon page');
    }
    
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<span id="productTitle"[^>]*>([^<]+)<\/span>/i);
    const name = titleMatch ? titleMatch[1].trim() : 'Unknown Product';
    
    // Extract price
    const priceMatch = html.match(/<span class="a-price-whole">([^<]+)<\/span>/i);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
    
    // Extract image
    const imageMatch = html.match(/<img[^>]+id="landingImage"[^>]+src="([^"]+)"/i);
    const imageUrl = imageMatch ? imageMatch[1] : '';
    
    // Extract rating
    const ratingMatch = html.match(/<span class="a-icon-alt">([^<]+)<\/span>/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1].split(' ')[0]) : 0;
    
    return {
      name,
      price,
      originalPrice: price * 1.2,
      images: [imageUrl],
      description: '',
      keyFeatures: [],
      rating
    };
  } catch (error) {
    console.error('Scrape error:', error);
    throw error;
  }
}

// 🔥 Import product from Amazon URL
imports.post('/amazon', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { url, category, mainCategory } = await c.req.json();
    
    if (!url) {
      return c.json({ error: 'Amazon URL is required' }, 400);
    }
    
    // Scrape product details
    const scrapedData = await scrapeAmazonProduct(url);
    
    // Prepare product data
    const productData = {
      name: scrapedData.name,
      brand: scrapedData.brand || 'Amazon Import',
      category: category || scrapedData.category,
      mainCategory: mainCategory || scrapedData.category,
      price: scrapedData.price,
      originalPrice: scrapedData.originalPrice || scrapedData.price * 1.2,
      stock: 10,
      images: scrapedData.images,
      description: scrapedData.description,
      keyFeatures: scrapedData.keyFeatures,
      rating: scrapedData.rating,
      isNew: true,
      status: 'active',
      adminApproved: true
    };
    
    return c.json({
      success: true,
      scraped: scrapedData,
      productData: productData,
      message: 'Product details fetched successfully! Review and save.'
    });
    
  } catch (error) {
    console.error('Import error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 🔥 Save imported product
imports.post('/save', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    
    // Insert product into D1 database
    const result = await c.env.DB.prepare(
      `INSERT INTO products (name, brand, category, mainCategory, price, originalPrice, stock, images, description, keyFeatures, rating, isNew, status, adminApproved, vendorId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.name,
      body.brand || 'Amazon Import',
      body.category || '',
      body.mainCategory || '',
      body.price,
      body.originalPrice || body.price * 1.2,
      body.stock || 10,
      JSON.stringify(body.images || []),
      body.description || '',
      JSON.stringify(body.keyFeatures || []),
      body.rating || 0,
      body.isNew ? 1 : 0,
      body.status || 'active',
      body.adminApproved ? 1 : 0,
      body.vendorId || 1 // Default vendor ID (ya aapke hisaab se set karo)
    ).run();

    const productId = result.meta.last_row_id;
    
    return c.json({ 
      success: true, 
      product: { id: productId, ...body }, 
      message: 'Product imported successfully!' 
    });
  } catch (error) {
    console.error('Save imported product error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default imports;
