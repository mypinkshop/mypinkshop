const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// Auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ========== GET USER WISHLIST ==========
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    let wishlist = await Wishlist.findOne({ userId }).populate('items.productId');
    
    if (!wishlist) {
      return res.json([]);
    }
    
    // Format wishlist items for frontend
    const formattedWishlist = wishlist.items.map(item => ({
      _id: item.productId._id,
      id: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      originalPrice: item.productId.originalPrice,
      image: item.productId.images?.[0] || null,
      brand: item.productId.brand,
      category: item.productId.category,
      addedAt: item.addedAt
    }));
    
    res.json(formattedWishlist);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ADD TO WISHLIST ==========
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID required' });
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    let wishlist = await Wishlist.findOne({ userId });
    
    if (!wishlist) {
      // Create new wishlist
      wishlist = new Wishlist({
        userId,
        items: [{ productId }]
      });
    } else {
      // Check if product already in wishlist
      const existingItem = wishlist.items.find(item => item.productId.toString() === productId);
      if (existingItem) {
        return res.status(400).json({ error: 'Product already in wishlist' });
      }
      wishlist.items.push({ productId });
    }
    
    await wishlist.save();
    
    res.json({ 
      success: true, 
      message: 'Added to wishlist',
      count: wishlist.items.length
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== REMOVE FROM WISHLIST ==========
router.delete('/:productId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    
    const wishlist = await Wishlist.findOne({ userId });
    
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }
    
    wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);
    await wishlist.save();
    
    res.json({ 
      success: true, 
      message: 'Removed from wishlist',
      count: wishlist.items.length
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CLEAR WISHLIST ==========
router.delete('/clear/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Wishlist.findOneAndDelete({ userId });
    
    res.json({ 
      success: true, 
      message: 'Wishlist cleared successfully'
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CHECK IF PRODUCT IN WISHLIST ==========
router.get('/check/:productId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    
    const wishlist = await Wishlist.findOne({ userId });
    
    const isInWishlist = wishlist ? 
      wishlist.items.some(item => item.productId.toString() === productId) : false;
    
    res.json({ isInWishlist });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
