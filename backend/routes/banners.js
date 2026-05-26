const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');

// GET active hero banner for homepage
router.get('/homepage/hero-banner', async (req, res) => {
  try {
    const banner = await Banner.findOne({
      where: {
        isActive: true,
        position: 'hero'
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (!banner) {
      // Default banner if no active banner found
      return res.json({
        title: 'Shop t-shirts & polos',
        subtitle: 'Under ₹399',
        cashback: '5% cashback with ICICI card*',
        imageUrl: '/default-banner.jpg',
        ctaLink: '/shop'
      });
    }
    
    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add new banner (admin)
router.post('/admin/banners', async (req, res) => {
  try {
    const { title, subtitle, cashback, ctaLink, position } = req.body;
    const imageUrl = req.file?.path || null;
    
    const newBanner = await Banner.create({
      title,
      subtitle,
      cashback,
      ctaLink,
      position,
      imageUrl,
      isActive: true
    });
    
    res.json({ success: true, banner: newBanner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
