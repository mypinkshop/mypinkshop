const express = require('express');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, vendorOnly, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @route GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    let filter = { status: 'active' };

    if (category && category !== 'all') {
      filter.category = category;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route POST /api/products (Vendor only)
router.post('/', protect, vendorOnly, async (req, res) => {
  try {
    const { name, category, price, originalPrice, stock, emoji, badge, description } = req.body;

    const product = await Product.create({
      vendorId: req.user.id,
      vendorName: req.user.brandName || req.user.name,
      name,
      category,
      price,
      originalPrice,
      stock,
      emoji: emoji || '🛍️',
      badge: badge || '',
      description: description || '',
    });

    // Update vendor's product count
    await User.findByIdAndUpdate(req.user.id, { $inc: { totalProducts: 1 } });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route PUT /api/products/:id (Vendor only)
router.put('/:id', protect, vendorOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.vendorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route DELETE /api/products/:id (Vendor only)
router.delete('/:id', protect, vendorOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.vendorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route GET /api/products/vendor/my (Vendor only)
router.get('/vendor/my', protect, vendorOnly, async (req, res) => {
  try {
    const products = await Product.find({ vendorId: req.user.id });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
