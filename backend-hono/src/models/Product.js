// src/models/Product.js

// 📌 HELPER: Parse JSON safely
const safeParse = (str) => {
  try { return JSON.parse(str); } catch { return []; }
};

// 📌 HELPER: Generate slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
};

// 📌 HELPER: Generate category slug
const generateCategorySlug = (mainCategory) => {
  return mainCategory.toLowerCase().replace(/\s+/g, '-');
};

// 📌 HELPER: Calculate discount percent
const calculateDiscountPercent = (originalPrice, price) => {
  if (originalPrice && originalPrice > price) {
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }
  return 0;
};

// 📌 HELPER: Generate schema markup
const generateSchemaMarkup = (product) => {
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images && product.images.length > 0 ? product.images[0] : "",
    "description": product.aboutThisItem && product.aboutThisItem.length > 0 ? product.aboutThisItem[0] : "",
    "brand": {
      "@type": "Brand",
      "name": product.brand || "MyPinkShop"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": product.price,
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewCount
    }
  };
};

// 📌 CREATE PRODUCT
export const createProduct = async (db, data) => {
  const slug = data.slug || generateSlug(data.name);
  const categorySlug = data.categorySlug || generateCategorySlug(data.mainCategory || 'Other');
  const discountPercent = calculateDiscountPercent(data.originalPrice, data.price);
  const hasVariations = data.variations && data.variations.length > 0 ? 1 : 0;
  const schemaMarkup = generateSchemaMarkup({
    ...data,
    slug,
    categorySlug,
    discountPercent,
    hasVariations
  });

  const result = await db.prepare(
    `INSERT INTO products (vendorId, vendorName, name, brand, mainCategory, subCategory, categorySlug, price, originalPrice, discountPercent, tax, stock, sku, weight, dimensions, aboutThisItem, productHighlights, productDetails, images, mainImage, imageAltText, variations, hasVariations, skinType, concerns, ingredients, finish, coverage, shade, hairType, hairConcerns, fabric, material, gender, emoji, badge, isBestSeller, isAmazonChoice, isNew, rating, reviewCount, answeredQuestions, slug, metaTitle, metaDescription, metaKeywords, schemaMarkup, status, featured, adminApproved, views, sales)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.vendorId || 'admin',
    data.vendorName || 'MyPinkShop',
    data.name,
    data.brand || '',
    data.mainCategory || 'Other',
    data.subCategory || '',
    categorySlug,
    data.price,
    data.originalPrice || 0,
    discountPercent,
    data.tax || 5,
    data.stock || 0,
    data.sku || '',
    data.weight || '',
    data.dimensions || '',
    JSON.stringify(data.aboutThisItem || []),
    JSON.stringify(data.productHighlights || []),
    JSON.stringify(data.productDetails || {}),
    JSON.stringify(data.images || []),
    data.mainImage || '',
    JSON.stringify(data.imageAltText || []),
    JSON.stringify(data.variations || []),
    hasVariations,
    data.skinType || 'all',
    JSON.stringify(data.concerns || []),
    data.ingredients || '',
    data.finish || '',
    data.coverage || '',
    data.shade || '',
    data.hairType || 'all',
    JSON.stringify(data.hairConcerns || []),
    data.fabric || '',
    data.material || '',
    data.gender || 'unisex',
    data.emoji || '🛍️',
    data.badge || '',
    data.isBestSeller ? 1 : 0,
    data.isAmazonChoice ? 1 : 0,
    data.isNew ? 1 : 0,
    data.rating || 4.0,
    data.reviewCount || 0,
    data.answeredQuestions || 0,
    slug,
    data.metaTitle || `${data.name}${data.brand ? ` - ${data.brand}` : ''} | MyPinkShop`,
    data.metaDescription || (data.aboutThisItem && data.aboutThisItem.length > 0 ? data.aboutThisItem[0].substring(0, 155) : `Buy ${data.name} online at best price`),
    JSON.stringify(data.metaKeywords || []),
    JSON.stringify(schemaMarkup),
    data.status || 'active',
    data.featured ? 1 : 0,
    data.adminApproved ? 1 : 0,
    data.views || 0,
    data.sales || 0
  ).run();

  return result.meta.last_row_id;
};

// 📌 GET PRODUCT BY ID
export const getProduct = async (db, id) => {
  return await db.prepare(
    `SELECT * FROM products WHERE id = ?`
  ).bind(id).first();
};

// 📌 GET PRODUCT BY SLUG
export const getProductBySlug = async (db, slug) => {
  return await db.prepare(
    `SELECT * FROM products WHERE slug = ?`
  ).bind(slug).first();
};

// 📌 GET ALL PRODUCTS (Public)
export const getAllProducts = async (db, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM products WHERE status = 'active' ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM products WHERE status = 'active'`
  ).first();

  return {
    products: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 GET ALL PRODUCTS (Admin)
export const getAllProductsAdmin = async (db, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM products ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM products`
  ).first();

  return {
    products: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 GET PRODUCTS BY CATEGORY
export const getProductsByCategory = async (db, category, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM products WHERE mainCategory = ? AND status = 'active' ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(category, limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM products WHERE mainCategory = ? AND status = 'active'`
  ).bind(category).first();

  return {
    products: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 GET PRODUCTS BY BRAND
export const getProductsByBrand = async (db, brand, limit = 20) => {
  const { results } = await db.prepare(
    `SELECT * FROM products WHERE brand LIKE ? AND status = 'active' ORDER BY rating DESC LIMIT ?`
  ).bind(`%${brand}%`, limit).all();

  return results;
};

// 📌 GET BEST SELLERS
export const getBestSellers = async (db, limit = 10) => {
  const { results } = await db.prepare(
    `SELECT * FROM products WHERE isBestSeller = 1 AND status = 'active' ORDER BY sales DESC LIMIT ?`
  ).bind(limit).all();

  return results;
};

// 📌 GET MY PINK SHOP CHOICE
export const getMyPinkShopChoice = async (db, limit = 10) => {
  const { results } = await db.prepare(
    `SELECT * FROM products WHERE isMyPinkShopChoice = 1 AND status = 'active' ORDER BY rating DESC LIMIT ?`
  ).bind(limit).all();

  return results;
};

// 📌 GET NEW ARRIVALS
export const getNewArrivals = async (db, limit = 10) => {
  const { results } = await db.prepare(
    `SELECT * FROM products WHERE isNew = 1 AND status = 'active' ORDER BY createdAt DESC LIMIT ?`
  ).bind(limit).all();

  return results;
};

// 📌 SEARCH PRODUCTS
export const searchProducts = async (db, searchQuery, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM products WHERE status = 'active' AND (name LIKE ? OR brand LIKE ? OR aboutThisItem LIKE ?) ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM products WHERE status = 'active' AND (name LIKE ? OR brand LIKE ? OR aboutThisItem LIKE ?)`
  ).bind(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`).first();

  return {
    products: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 GET PRODUCTS BY VENDOR
export const getVendorProducts = async (db, vendorId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM products WHERE vendorId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(vendorId, limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM products WHERE vendorId = ?`
  ).bind(vendorId).first();

  return {
    products: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 UPDATE PRODUCT
export const updateProduct = async (db, id, data) => {
  let query = `UPDATE products SET `;
  let params = [];
  let fields = Object.keys(data);

  fields.forEach((field, index) => {
    query += `${field} = ?, `;
    params.push(data[field]);
  });

  query += `updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  params.push(id);

  await db.prepare(query).bind(...params).run();

  return await getProduct(db, id);
};

// 📌 DELETE PRODUCT
export const deleteProduct = async (db, id) => {
  const result = await db.prepare(`DELETE FROM products WHERE id = ?`).bind(id).run();
  return result.meta.changes > 0;
};

// 📌 TOGGLE PRODUCT STATUS
export const toggleProductStatus = async (db, id) => {
  const product = await getProduct(db, id);
  if (!product) return null;

  const newStatus = product.status === 'active' ? 'inactive' : 'active';
  await db.prepare(
    `UPDATE products SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(newStatus, id).run();

  return await getProduct(db, id);
};

// 📌 GET PRODUCT STATS (Vendor)
export const getProductStats = async (db, vendorId) => {
  const { results } = await db.prepare(
    `SELECT * FROM products WHERE vendorId = ?`
  ).bind(vendorId).all();

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

  return stats;
};
