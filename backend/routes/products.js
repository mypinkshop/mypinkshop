const express = require('express');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, vendorOnly, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ============ PUBLIC ROUTES ============

// @route GET /api/products
// @desc Get all products with filters
router.get('/', async (req, res) => {
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
    } = req.query;
    
    let filter = { status: 'active' };

    if (category && category !== 'all') {
      filter.mainCategory = category;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { aboutThisItem: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    if (rating) {
      filter.rating = { $gte: parseFloat(rating) };
    }
    
    if (brand) {
      filter.brand = brand;
    }
    
    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }
    
    let sortOption = {};
    switch (sort) {
      case 'price_asc': sortOption.price = 1; break;
      case 'price_desc': sortOption.price = -1; break;
      case 'rating': sortOption.rating = -1; break;
      case 'newest': sortOption.createdAt = -1; break;
      case 'bestselling': sortOption.sales = -1; break;
      case 'discount': sortOption.discountPercent = -1; break;
      default: sortOption.createdAt = -1;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('GET products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/products/:identifier
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let product;
    
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(identifier);
    } else {
      product = await Product.findOne({ slug: identifier });
    }
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    await product.updateOne({ $inc: { views: 1 } });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/products/featured/mypinkshop-choice
router.get('/featured/mypinkshop-choice', async (req, res) => {
  try {
    const products = await Product.find({ isMyPinkShopChoice: true, status: 'active' }).sort({ rating: -1 }).limit(10);
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/products/featured/bestsellers
router.get('/featured/bestsellers', async (req, res) => {
  try {
    const products = await Product.find({ isBestSeller: true, status: 'active' }).sort({ sales: -1 }).limit(10);
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/products/featured/new-arrivals
router.get('/featured/new-arrivals', async (req, res) => {
  try {
    const products = await Product.find({ isNew: true, status: 'active' }).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/products/category/:category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find({ 
      mainCategory: category.charAt(0).toUpperCase() + category.slice(1),
      status: 'active' 
    }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    
    const total = await Product.countDocuments({ 
      mainCategory: category.charAt(0).toUpperCase() + category.slice(1),
      status: 'active' 
    });
    
    res.json({
      success: true,
      products,
      category,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/products/brand/:brand
router.get('/brand/:brand', async (req, res) => {
  try {
    const products = await Product.find({ brand: { $regex: req.params.brand, $options: 'i' }, status: 'active' }).sort({ rating: -1 });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/products/search/suggest
router.get('/search/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }
    
    const suggestions = await Product.find({ name: { $regex: q, $options: 'i' }, status: 'active' }, { name: 1, brand: 1, images: 1, price: 1 }).limit(5);
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ FIXED: PRODUCT CREATE ROUTE (Amazon Import Compatible) ============

// @route POST /api/products (PROTECTED - Admin & Vendor both can create)
router.post('/', protect, async (req, res) => {
  try {
    const productData = req.body;
    
    // Required fields validation
    if (!productData.name || !productData.price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product name and price are required' 
      });
    }

    // Handle price as number
    const price = parseFloat(productData.price);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid price is required' 
      });
    }

    // Prepare product data with fallbacks for Amazon import
    const product = await Product.create({
      // Vendor fields (optional for Amazon import)
      vendorId: req.user?.id || 'admin',
      vendorName: req.user?.brandName || req.user?.name || 'MyPinkShop',
      
      // Basic info
      name: productData.name,
      brand: productData.brand || '',
      mainCategory: productData.mainCategory || productData.detectedCategory || 'Other',
      subCategory: productData.subCategory || productData.detectedSubCategory || '',
      
      // Pricing
      price: price,
      originalPrice: parseFloat(productData.originalPrice) || price * 1.2,
      
      // Stock & SKU
      stock: parseInt(productData.stock) || 10,
      sku: productData.sku || `AMZ-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      
      // Dimensions & Weight
      weight: productData.weight || '',
      dimensions: productData.dimensions || '',
      
      // Content arrays
      aboutThisItem: Array.isArray(productData.description) ? productData.description : 
                     (productData.description ? [productData.description] : []),
      productHighlights: Array.isArray(productData.keyFeatures) ? productData.keyFeatures : 
                         (productData.keyFeatures ? [productData.keyFeatures] : []),
      productDetails: productData.productDetails || {},
      
      // Images
      images: Array.isArray(productData.images) ? productData.images : 
              (productData.images ? [productData.images] : []),
      
      // Variations
      variations: Array.isArray(productData.variations) ? productData.variations : [],
      
      // Badges & Emoji
      emoji: productData.emoji || '🛍️',
      badge: productData.badge || '',
      
      // Feature flags
      isBestSeller: productData.isBestSeller || false,
      isMyPinkShopChoice: productData.isMyPinkShopChoice || false,
      isNew: productData.isNew || true,
      
      // Skin/Hair fields (optional)
      skinType: productData.skinType || 'all',
      concerns: Array.isArray(productData.concerns) ? productData.concerns : [],
      ingredients: productData.ingredients || '',
      finish: productData.finish || '',
      coverage: productData.coverage || '',
      shade: productData.shade || '',
      hairType: productData.hairType || 'all',
      hairConcerns: Array.isArray(productData.hairConcerns) ? productData.hairConcerns : [],
      
      // Clothing fields
      fabric: productData.fabric || '',
      material: productData.material || '',
      gender: productData.gender || 'unisex',
      
      // SEO
      metaTitle: productData.metaTitle || `${productData.name} - ${productData.brand || 'MyPinkShop'}`,
      metaDescription: productData.metaDescription || (productData.description ? String(productData.description).substring(0, 155) : `Buy ${productData.name} online at best price`),
      metaKeywords: Array.isArray(productData.metaKeywords) ? productData.metaKeywords : 
                    (productData.metaKeywords ? [productData.metaKeywords] : [productData.brand, productData.mainCategory]),
      
      // Status
      status: 'active',
      adminApproved: req.user?.role === 'admin' ? true : false,
      rating: productData.rating || 4.0,
      reviewCount: 0,
      views: 0,
      sales: 0
    });

    // Update vendor stats if vendor is creating
    if (req.user && req.user.id && req.user.role === 'vendor') {
      await User.findByIdAndUpdate(req.user.id, { $inc: { totalProducts: 1 } });
    }

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('POST product error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'Product with this SKU already exists' 
      });
    }
    
    // Handle validation error
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors 
      });
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route PUT /api/products/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    if (product.vendorId?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updatedAt: Date.now() }, 
      { new: true, runValidators: true }
    );
    
    res.json({ success: true, product: updated });
  } catch (error) {
    console.error('PUT product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route DELETE /api/products/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    if (product.vendorId?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await product.deleteOne();
    if (product.vendorId) {
      await User.findByIdAndUpdate(product.vendorId, { $inc: { totalProducts: -1 } });
    }
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('DELETE product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route PATCH /api/products/:id/stock
router.patch('/:id/stock', protect, async (req, res) => {
  try {
    const { stock } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    if (product.vendorId?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    product.stock = stock;
    await product.save();
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/products/vendor/my
router.get('/vendor/my', protect, async (req, res) => {
  try {
    const products = await Product.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, products, count: products.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/products/vendor/stats
router.get('/vendor/stats', protect, async (req, res) => {
  try {
    const products = await Product.find({ vendorId: req.user.id });
    
    const stats = {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      inactive: products.filter(p => p.status === 'inactive').length,
      outOfStock: products.filter(p => p.stock === 0).length,
      lowStock: products.filter(p => p.stock > 0 && p.stock < 10).length,
      totalViews: products.reduce((sum, p) => sum + (p.views || 0), 0),
      totalSales: products.reduce((sum, p) => sum + (p.sales || 0), 0),
      myPinkShopChoice: products.filter(p => p.isMyPinkShopChoice).length,
      bestSellers: products.filter(p => p.isBestSeller).length
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ ADMIN ROUTES ============

// @route GET /api/products/admin/all
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route PATCH /api/products/admin/featured/:id
router.patch('/admin/featured/:id', protect, adminOnly, async (req, res) => {
  try {
    const { type, value } = req.body;
    let updateField = {};
    if (type === 'bestSeller') updateField.isBestSeller = value;
    if (type === 'myPinkShopChoice') updateField.isMyPinkShopChoice = value;
    if (type === 'new') updateField.isNew = value;
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...updateField, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route POST /api/products/bulk
router.post('/bulk', protect, adminOnly, async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'Products array required' });
    }
    
    const created = await Product.insertMany(products);
    res.json({ success: true, message: `${created.length} products created successfully`, products: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
