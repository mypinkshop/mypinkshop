import { Hono } from 'hono';

const products = new Hono();

// Helper to check if user is vendor
const isVendor = (c) => {
  const user = c.get('user');
  return user && user.role === 'vendor';
};

// Helper to check if user is admin
const isAdmin = (c) => {
  const user = c.get('user');
  return user && user.role === 'admin';
};

// Helper to parse JSON safely
const safeParse = (str) => {
  try { return JSON.parse(str); } catch { return []; }
};

// ============ PUBLIC ROUTES ============

// @route GET /api/products
// @desc Get all products with filters
products.get('/', async (c) => {
  try {
    const { 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      sort, 
      page = 1, 
      limit = 20,
      rating,
      brand,
      inStock 
    } = c.req.query();
    
    let query = `SELECT * FROM products WHERE status = 'active'`;
    let params = [];

    if (category && category !== 'all') {
      query += ` AND mainCategory = ?`;
      params.push(category);
    }
    
    if (search) {
      query += ` AND (name LIKE ? OR brand LIKE ? OR aboutThisItem LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (minPrice || maxPrice) {
      query += ` AND price >= ? AND price <= ?`;
      params.push(parseFloat(minPrice || 0), parseFloat(maxPrice || 1000000));
    }
    
    if (rating) {
      query += ` AND rating >= ?`;
      params.push(parseFloat(rating));
    }
    
    if (brand) {
      query += ` AND brand = ?`;
      params.push(brand);
    }
    
    if (inStock === 'true') {
      query += ` AND stock > 0`;
    }
    
    let sortOption = `ORDER BY createdAt DESC`;
    switch (sort) {
      case 'price_asc': sortOption = `ORDER BY price ASC`; break;
      case 'price_desc': sortOption = `ORDER BY price DESC`; break;
      case 'rating': sortOption = `ORDER BY rating DESC`; break;
      case 'newest': sortOption = `ORDER BY createdAt DESC`; break;
      case 'bestselling': sortOption = `ORDER BY sales DESC`; break;
      case 'discount': sortOption = `ORDER BY (price - originalPrice) DESC`; break;
      default: sortOption = `ORDER BY createdAt DESC`;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    query += ` ${sortOption} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), skip);
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    const totalResult = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM products WHERE status = 'active'`).first();
    
    return c.json({
      success: true,
      products: results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalResult.count / parseInt(limit)),
        totalProducts: totalResult.count,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('GET products error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// @route GET /api/products/:identifier
products.get('/:identifier', async (c) => {
  try {
    const { identifier } = c.req.param();
    let product;
    
    if (identifier.match(/^[0-9a-fA-F]{24}$/) || /^\d+$/.test(identifier)) {
      product = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(parseInt(identifier)).first();
    } else {
      product = await c.env.DB.prepare(`SELECT * FROM products WHERE slug = ?`).bind(identifier).first();
    }
    
    if (!product) {
      return c.json({ success: false, message: 'Product not found' }, 404);
    }
    
    await c.env.DB.prepare(`UPDATE products SET views = views + 1 WHERE id = ?`).bind(product.id).run();
    return c.json({ success: true, product });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// @route GET /api/products/featured/mypinkshop-choice
products.get('/featured/mypinkshop-choice', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM products WHERE isMyPinkShopChoice = 1 AND status = 'active' ORDER BY rating DESC LIMIT 10`
    ).all();
    return c.json({ success: true, products: results });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// @route GET /api/products/featured/bestsellers
products.get('/featured/bestsellers', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM products WHERE isBestSeller = 1 AND status = 'active' ORDER BY sales DESC LIMIT 10`
    ).all();
    return c.json({ success: true, products: results });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// @route GET /api/products/featured/new-arrivals
products.get('/featured/new-arrivals', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM products WHERE isNew = 1 AND status = 'active' ORDER BY createdAt DESC LIMIT 10`
    ).all();
    return c.json({ success: true, products: results });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// @route GET /api/products/category/:category
products.get('/category/:category', async (c) => {
  try {
    const { category } = c.req.param();
    const { limit = 20, page = 1 } = c.req.query();
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM products WHERE mainCategory = ? AND status = 'active' ORDER BY createdAt DESC LIMIT ? OFFSET ?`
    ).bind(category, parseInt(limit), skip).all();
    
    const totalResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM products WHERE mainCategory = ? AND status = 'active'`
    ).bind(category).first();
    
    return c.json({
      success: true,
      products: results,
      category,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalResult.count / parseInt(limit)),
        totalProducts: totalResult.count
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// @route GET /api/products/brand/:brand
products.get('/brand/:brand', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM products WHERE brand LIKE ? AND status = 'active' ORDER BY rating DESC`
    ).bind(`%${c.req.param('brand')}%`).all();
    return c.json({ success: true, products: results });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// @route GET /api/products/search/suggest
products.get('/search/suggest', async (c) => {
  try {
    const { q } = c.req.query();
    if (!q || q.length < 2) {
      return c.json({ suggestions: [] });
    }
    
    const { results } = await c.env.DB.prepare(
      `SELECT id, name, brand, images, price FROM products WHERE name LIKE ? AND status = 'active' LIMIT 5`
    ).bind(`%${q}%`).all();
    return c.json({ suggestions: results });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ============ PROTECTED ROUTES (CREATE/UPDATE/DELETE) ============

// @route POST /api/products
products.post('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    const productData = await c.req.json();
    
    // Required fields validation
    if (!productData.name || !productData.price) {
      return c.json({ 
        success: false, 
        message: 'Product name and price are required' 
      }, 400);
    }

    // Handle price as number
    const price = parseFloat(productData.price);
    if (isNaN(price) || price <= 0) {
      return c.json({ 
        success: false, 
        message: 'Valid price is required' 
      }, 400);
    }

    // Prepare product data with fallbacks for Amazon import
    const result = await c.env.DB.prepare(
      `INSERT INTO products (vendorId, vendorName, name, brand, mainCategory, subCategory, price, originalPrice, stock, sku, weight, dimensions, aboutThisItem, productHighlights, productDetails, images, variations, emoji, badge, isBestSeller, isMyPinkShopChoice, isNew, skinType, concerns, ingredients, finish, coverage, shade, hairType, hairConcerns, fabric, material, gender, metaTitle, metaDescription, metaKeywords, status, adminApproved, rating, reviewCount, views, sales) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user.id || 'admin',
      user.brandName || user.name || 'MyPinkShop',
      productData.name,
      productData.brand || '',
      productData.mainCategory || productData.detectedCategory || 'Other',
      productData.subCategory || productData.detectedSubCategory || '',
      price,
      parseFloat(productData.originalPrice) || price * 1.2,
      parseInt(productData.stock) || 10,
      productData.sku || `AMZ-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      productData.weight || '',
      productData.dimensions || '',
      JSON.stringify(Array.isArray(productData.description) ? productData.description : (productData.description ? [productData.description] : [])),
      JSON.stringify(Array.isArray(productData.keyFeatures) ? productData.keyFeatures : (productData.keyFeatures ? [productData.keyFeatures] : [])),
      JSON.stringify(productData.productDetails || {}),
      JSON.stringify(Array.isArray(productData.images) ? productData.images : (productData.images ? [productData.images] : [])),
      JSON.stringify(Array.isArray(productData.variations) ? productData.variations : []),
      productData.emoji || '🛍️',
      productData.badge || '',
      productData.isBestSeller ? 1 : 0,
      productData.isMyPinkShopChoice ? 1 : 0,
      productData.isNew ? 1 : 0,
      productData.skinType || 'all',
      JSON.stringify(Array.isArray(productData.concerns) ? productData.concerns : []),
      productData.ingredients || '',
      productData.finish || '',
      productData.coverage || '',
      productData.shade || '',
      productData.hairType || 'all',
      JSON.stringify(Array.isArray(productData.hairConcerns) ? productData.hairConcerns : []),
      productData.fabric || '',
      productData.material || '',
      productData.gender || 'unisex',
      productData.metaTitle || `${productData.name} - ${productData.brand || 'MyPinkShop'}`,
      productData.metaDescription || (productData.description ? String(productData.description).substring(0, 155) : `Buy ${productData.name} online at best price`),
      JSON.stringify(Array.isArray(productData.metaKeywords) ? productData.metaKeywords : (productData.metaKeywords ? [productData.metaKeywords] : [productData.brand, productData.mainCategory])),
      'active',
      user.role === 'admin' ? 1 : 0,
      productData.rating || 4.0,
      0,
      0,
      0
    ).run();

    const productId = result.meta.last_row_id;

    // Update vendor stats if vendor is creating
    if (user && user.id && user.role === 'vendor') {
      await c.env.DB.prepare(`UPDATE users SET totalProducts = totalProducts + 1 WHERE id = ?`).bind(user.id).run();
    }

    return c.json({ success: true, product: { id: productId, ...productData } }, 201);
  } catch (error) {
    console.error('POST product error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// @route PUT /api/products/:id
products.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    const product = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(parseInt(c.req.param('id'))).first();
    
    if (!product) {
      return c.json({ success: false, message: 'Product not found' }, 404);
    }
    
    if (product.vendorId !== user.id && user.role !== 'admin') {
      return c.json({ success: false, message: 'Not authorized' }, 403);
    }

    const productData = await c.req.json();
    
    let updateQuery = `UPDATE products SET `;
    let updateParams = [];
    
    // Add all fields from body
    Object.keys(productData).forEach((field, index) => {
      updateQuery += `${field} = ?, `;
      updateParams.push(typeof productData[field] === 'object' ? JSON.stringify(productData[field]) : productData[field]);
    });
    
    updateQuery += `updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
    updateParams.push(parseInt(c.req.param('id')));
    
    await c.env.DB.prepare(updateQuery).bind(...updateParams).run();
    
    return c.json({ success: true, product: { ...product, ...productData } });
  } catch (error) {
    console.error('PUT product error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// @route DELETE /api/products/:id
products.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    const product = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(parseInt(c.req.param('id'))).first();
    
    if (!product) {
      return c.json({ success: false, message: 'Product not found' }, 404);
    }
    
    if (product.vendorId !== user.id && user.role !== 'admin') {
      return c.json({ success: false, message: 'Not authorized' }, 403);
    }

    await c.env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(parseInt(c.req.param('id'))).run();
    if (product.vendorId) {
      await c.env.DB.prepare(`UPDATE users SET totalProducts = totalProducts - 1 WHERE id = ?`).bind(product.vendorId).run();
    }
    
    return c.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('DELETE product error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// @route PATCH /api/products/:id/stock
products.patch('/:id/stock', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    const { stock } = await c.req.json();
    const product = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(parseInt(c.req.param('id'))).first();
    
    if (!product) {
      return c.json({ success: false, message: 'Product not found' }, 404);
    }
    
    if (product.vendorId !== user.id && user.role !== 'admin') {
      return c.json({ success: false, message: 'Not authorized' }, 403);
    }
    
    await c.env.DB.prepare(`UPDATE products SET stock = ? WHERE id = ?`).bind(stock, parseInt(c.req.param('id'))).run();
    
    return c.json({ success: true, product: { ...product, stock } });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// @route GET /api/products/vendor/my
products.get('/vendor/my', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM products WHERE vendorId = ? ORDER BY createdAt DESC`
    ).bind(user.id).all();
    return c.json({ success: true, products: results, count: results.length });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// @route GET /api/products/vendor/stats
products.get('/vendor/stats', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM products WHERE vendorId = ?`
    ).bind(user.id).all();
    
    const stats = {
      total: results.length,
      active: results.filter(p => p.status === 'active').length,
      inactive: results.filter(p => p.status === 'inactive').length,
      outOfStock: results.filter(p => p.stock === 0).length,
      lowStock: results.filter(p => p.stock > 0 && p.stock < 10).length,
      totalViews: results.reduce((sum, p) => sum + (p.views || 0), 0),
      totalSales: results.reduce((sum, p) => sum + (p.sales || 0), 0),
      myPinkShopChoice: results.filter(p => p.isMyPinkShopChoice).length,
      bestSellers: results.filter(p => p.isBestSeller).length
    };
    
    return c.json({ success: true, stats });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ============ ADMIN ROUTES ============

// @route GET /api/products/admin/all
products.get('/admin/all', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const { page = 1, limit = 50, status } = c.req.query();
    let query = `SELECT * FROM products`;
    let params = [];
    
    if (status && status !== 'all') {
      query += ` WHERE status = ?`;
      params.push(status);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), skip);
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    const totalResult = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM products`).first();
    
    return c.json({
      success: true,
      products: results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalResult.count / parseInt(limit)),
        totalProducts: totalResult.count
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// @route PATCH /api/products/admin/featured/:id
products.patch('/admin/featured/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const { type, value } = await c.req.json();
    let updateField = {};
    if (type === 'bestSeller') updateField.isBestSeller = value ? 1 : 0;
    if (type === 'myPinkShopChoice') updateField.isMyPinkShopChoice = value ? 1 : 0;
    if (type === 'new') updateField.isNew = value ? 1 : 0;
    
    await c.env.DB.prepare(
      `UPDATE products SET isBestSeller = ?, isMyPinkShopChoice = ?, isNew = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(updateField.isBestSeller || 0, updateField.isMyPinkShopChoice || 0, updateField.isNew || 0, parseInt(c.req.param('id'))).run();
    
    return c.json({ success: true, product: { id: parseInt(c.req.param('id')) } });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// @route POST /api/products/bulk
products.post('/bulk', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const { products: productList } = await c.req.json();
    if (!productList || !Array.isArray(productList)) {
      return c.json({ success: false, message: 'Products array required' }, 400);
    }
    
    let inserted = [];
    for (const product of productList) {
      const result = await c.env.DB.prepare(
        `INSERT INTO products (vendorId, vendorName, name, brand, mainCategory, price, stock, images, status, adminApproved) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 1)`
      ).bind(product.vendorId || 0, product.vendorName || '', product.name, product.brand || '', product.mainCategory || '', product.price, product.stock || 10, JSON.stringify(product.images || [])).run();
      
      inserted.push({ id: result.meta.last_row_id });
    }
    
    return c.json({ success: true, message: `${inserted.length} products created successfully`, products: inserted });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default products;
