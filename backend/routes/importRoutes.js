const express = require('express');
const router = express.Router();
const amazonScraper = require('../services/amazonScraper');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

// 🔥 Import product from Amazon URL
router.post('/amazon', protect, admin, async (req, res) => {
  try {
    const { url, category, mainCategory } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'Amazon URL is required' });
    }
    
    // Scrape product details
    const scrapedData = await amazonScraper.scrapeProduct(url);
    
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
    
    res.json({
      success: true,
      scraped: scrapedData,
      productData: productData,
      message: 'Product details fetched successfully! Review and save.'
    });
    
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🔥 Save imported product
router.post('/save', protect, admin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json({ success: true, product, message: 'Product imported successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
