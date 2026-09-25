// src/routes/bulk-upload.js
import { Hono } from 'hono';
import { authMiddleware, requireAdmin } from './auth.js';
import { ok, fail, genId } from '../lib/utils.js';

const bulkUpload = new Hono();

// ============================================================
// HELPERS
// ============================================================
const makeSlug = (s) => String(s || '')
  .toLowerCase()
  .trim()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

// ✅ Category auto-create (same as products.js)
async function ensureCategory(db, name, type = 'main', parentId = null, icon = '📁') {
  if (!name || !String(name).trim()) return null;
  const cleanName = String(name).trim();

  try {
    if (type === 'main') {
      const existing = await db.prepare(
        'SELECT id FROM categories WHERE LOWER(name) = LOWER(?)'
      ).bind(cleanName).first();
      if (existing) return existing.id;

      const id = 'cat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      await db.prepare(
        `INSERT INTO categories (id, name, slug, icon, status, "order", type)
         VALUES (?, ?, ?, ?, 'active', 999, 'main')`
      ).bind(id, cleanName, makeSlug(cleanName), icon).run();
      return id;
    }

    if (type === 'sub' && parentId) {
      const existing = await db.prepare(
        'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND parent_id = ?'
      ).bind(cleanName, parentId).first();
      if (existing) return existing.id;

      const id = 'cat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      await db.prepare(
        `INSERT INTO categories (id, name, slug, icon, status, "order", type, parent_id)
         VALUES (?, ?, ?, ?, 'active', 999, 'sub', ?)`
      ).bind(id, cleanName, makeSlug(cleanName), icon, parentId).run();
      return id;
    }

    return null;
  } catch (err) {
    console.warn('ensureCategory failed:', err.message);
    return null;
  }
}

// ============================================================
// ✅ PROPER CSV PARSER (quotes handle karta hai)
// ============================================================
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote ("")
        currentCell += '"';
        i++;
      } else {
        // Toggle quote mode
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      }
    } else {
      currentCell += char;
    }
  }

  // Last row
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));
  const data = [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i].every(cell => !cell)) continue; // Skip empty rows
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = rows[i][idx] || '';
    });
    data.push(obj);
  }

  return data;
}

// ============================================================
// ✅ ROW → PRODUCT OBJECT
// ============================================================
function rowToProduct(row, vendorId = 'admin', vendorName = 'MyPinkShop') {
  const name = row.name || row.product_name || row.productname || '';
  if (!name) return null;

  const price = parseFloat(row.price || row.selling_price || 0);
  if (!price || price <= 0) return null;

  const originalPrice = parseFloat(row.original_price || row.mrp || 0) || price * 1.2;
  const stock = parseInt(row.stock || row.quantity || 10) || 10;
  const tax = parseFloat(row.tax || row.gst || 18) || 18;

  // ✅ Images — "|" ya "," separated URLs
  let images = [];
  if (row.images) {
    images = row.images.split('|').map(s => s.trim()).filter(Boolean);
  } else if (row.image) {
    images = [row.image.trim()];
  } else if (row.image_urls) {
    images = row.image_urls.split('|').map(s => s.trim()).filter(Boolean);
  }

  // ✅ Description — bullets
  let description = [];
  if (row.description) {
    description = row.description.split('|').map(s => s.trim()).filter(Boolean);
  } else if (row.about_this_item) {
    description = row.about_this_item.split('|').map(s => s.trim()).filter(Boolean);
  }

  // ✅ Key features
  let keyFeatures = [];
  if (row.key_features) {
    keyFeatures = row.key_features.split('|').map(s => s.trim()).filter(Boolean);
  } else if (row.features) {
    keyFeatures = row.features.split('|').map(s => s.trim()).filter(Boolean);
  }

  return {
    id: row.id || genId('prod'),
    name: name.trim(),
    brand: (row.brand || 'MyPinkShop').trim(),
    main_category: (row.main_category || row.category || 'Other').trim(),
    sub_category: (row.sub_category || row.subcategory || '').trim(),
    price,
    original_price: originalPrice,
    stock,
    tax,
    sku: row.sku || `BULK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description: description,
    key_features: keyFeatures,
    images: images,
    short_description: row.short_description || '',
    meta_title: row.meta_title || `${name} - Buy Online | MyPinkShop`,
    meta_description: row.meta_description || `Buy ${name} online at best price.`,
    meta_keywords: row.meta_keywords || '',
    weight: row.weight || '',
    dimensions: row.dimensions || '',
    is_active: 1,
    is_featured: row.is_featured === 'true' || row.is_featured === '1' ? 1 : 0,
    vendor_id: vendorId,
    vendor_name: vendorName,
  };
}

// ============================================================
// ✅ POST /api/bulk-upload
// ============================================================
bulkUpload.post('/bulk-upload', authMiddleware, requireAdmin, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return fail(c, 'No file uploaded. Please attach a CSV file.', 400);
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv')) {
      return fail(c, 'Only .csv files are supported', 400);
    }

    const fileText = await file.text();

    if (!fileText || fileText.trim().length === 0) {
      return fail(c, 'CSV file is empty', 400);
    }

    // ✅ Parse CSV
    const rows = parseCSV(fileText);

    if (rows.length === 0) {
      return fail(c, 'CSV file has no data rows', 400);
    }

    if (rows.length > 500) {
      return fail(c, `Too many rows: ${rows.length}. Max 500 products per batch.`, 400);
    }

    // ✅ Get current user info
    const user = c.get('user') || {};
    const vendorId = user.id || 'admin';
    const vendorName = user.name || 'MyPinkShop';

    const results = {
      success: 0,
      failed: 0,
      errors: [],
      created_products: [],
      created_categories: [],
    };

    // ✅ Insert each product
    for (let i = 0; i < rows.length; i++) {
      try {
        const product = rowToProduct(rows[i], vendorId, vendorName);
        if (!product) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Missing name or price`);
          continue;
        }

        // ✅ AUTO-CREATE CATEGORIES
        let mainCatId = null;
        if (product.main_category && product.main_category !== 'Other') {
          mainCatId = await ensureCategory(c.env.DB, product.main_category, 'main');
          if (mainCatId && product.sub_category) {
            const subCatId = await ensureCategory(c.env.DB, product.sub_category, 'sub', mainCatId);
            if (subCatId) {
              results.created_categories.push({
                main: product.main_category,
                sub: product.sub_category
              });
            }
          }
        }

        // ✅ Insert product with all fields
        const bindValues = [
          product.id, vendorId, vendorName,
          product.name, product.brand,
          product.main_category, product.sub_category,
          makeSlug(product.name),
          Array.isArray(product.description) ? product.description.join('\n') : product.description,
          JSON.stringify(product.description),
          JSON.stringify(product.key_features),
          JSON.stringify({}), // specifications
          product.short_description,
          product.price, product.original_price,
          Math.round(((product.original_price - product.price) / product.original_price) * 100) || 0,
          product.tax, product.stock, product.sku,
          product.weight, product.dimensions,
          JSON.stringify(product.images),
          'all', JSON.stringify([]), '', // skin_type, concerns, ingredients
          '', '', '', // finish, coverage, shade
          'all', JSON.stringify([]), // hair_type, hair_concerns
          '', '', 'unisex', // fabric, material, gender
          JSON.stringify([]), 0, // variations, has_variations
          'Size', 'Color', // option1_name, option2_name
          product.meta_title, product.meta_description, product.meta_keywords,
          makeSlug(product.name),
          product.is_active, product.is_featured, 1 // admin_approved = 1
        ];

        await c.env.DB.prepare(
          `INSERT INTO products
            (id, vendor_id, vendor_name, name, brand, main_category, sub_category, category_slug,
             description, about_this_item, key_features, specifications, short_description,
             price, original_price, discount_percent, tax, stock, sku,
             weight, dimensions, images, skin_type, concerns, ingredients, finish, coverage, shade,
             hair_type, hair_concerns, fabric, material, gender, variations, has_variations,
             option1_name, option2_name,
             meta_title, meta_description, meta_keywords, slug,
             is_active, is_featured, admin_approved, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
        ).bind(...bindValues).run();

        results.success++;
        results.created_products.push({
          id: product.id,
          name: product.name,
          main_category: product.main_category,
          sub_category: product.sub_category
        });

      } catch (rowErr) {
        console.error(`Row ${i + 2} error:`, rowErr);
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${rowErr.message}`);
      }
    }

    return ok(c, {
      message: `${results.success} products uploaded successfully, ${results.failed} failed`,
      ...results
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return fail(c, `Bulk upload failed: ${error.message}`, 500);
  }
});

// ============================================================
// ✅ GET /api/bulk-upload/template
// CSV template download karne ke liye
// ============================================================
bulkUpload.get('/bulk-upload/template', async (c) => {
  const headers = [
    'name', 'brand', 'main_category', 'sub_category',
    'price', 'original_price', 'stock', 'tax', 'sku',
    'description', 'key_features', 'images',
    'short_description', 'weight', 'dimensions',
    'meta_title', 'meta_description', 'meta_keywords', 'is_featured'
  ];

  const sampleRows = [
    [
      'iPhone 15',
      'Apple',
      'Electronics',
      'Mobile Phones',
      '79999',
      '89999',
      '50',
      '18',
      'IPH15-001',
      'Latest iPhone with A16 chip|6.1 inch display|48MP camera',
      '5G Ready|Face ID|iOS 17',
      'https://example.com/img1.jpg|https://example.com/img2.jpg',
      'Apple iPhone 15 with A16 Bionic chip',
      '171g',
      '15x7x0.8 cm',
      'iPhone 15 - Buy Online | MyPinkShop',
      'Buy iPhone 15 at best price',
      'iphone 15, apple, mobile',
      'true'
    ],
    [
      'Vitamin C Serum',
      'Nykaa',
      'Skincare',
      'Serums & Essence',
      '499',
      '699',
      '100',
      '18',
      'VCS-001',
      'Brightening serum with Vitamin C|Reduces dark spots|For all skin types',
      'Dermatologically tested|Paraben free',
      'https://example.com/serum.jpg',
      'Vitamin C face serum for glowing skin',
      '50ml',
      '',
      'Vitamin C Serum - Buy Online | MyPinkShop',
      'Buy Vitamin C Serum at best price',
      'vitamin c serum, skincare',
      'false'
    ]
  ];

  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  c.header('Content-Type', 'text/csv');
  c.header('Content-Disposition', `attachment; filename="bulk-upload-template.csv"`);
  return c.body(csvContent);
});

export default bulkUpload;
