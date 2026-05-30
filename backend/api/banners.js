const express = require('express');
const router = express.Router();
const { upload, uploadToR2, deleteFromR2 } = require('../services/r2Upload');

// ✅ Get all banners (active wale homepage ke liye)
router.get('/banners', async (req, res) => {
  try {
    const Banner = require('../models/Banner');
    const banners = await Banner.find().sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get active banners (sirf homepage ke liye)
router.get('/banners/active', async (req, res) => {
  try {
    const Banner = require('../models/Banner');
    const banners = await Banner.find({ active: true }).sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Add new banner with image
router.post('/banners', upload.single('image'), async (req, res) => {
  try {
    const Banner = require('../models/Banner');
    
    let imageUrl = '';
    let imageKey = '';
    
    // Upload image to R2 if file exists
    if (req.file) {
      const result = await uploadToR2(req.file, 'banners');
      if (result.success) {
        imageUrl = result.url;
        imageKey = result.key;
      } else {
        return res.status(500).json({ success: false, error: result.error });
      }
    }
    
    const banner = new Banner({
      title: req.body.title,
      subtitle: req.body.subtitle || '',
      buttonText: req.body.buttonText || 'Shop Now',
      link: req.body.link || '/shop',
      image: imageUrl,
      imageKey: imageKey,
      order: parseInt(req.body.order) || 0,
      active: req.body.active === 'true' || req.body.active === true
    });
    
    await banner.save();
    res.json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Update banner
router.put('/banners/:id', upload.single('image'), async (req, res) => {
  try {
    const Banner = require('../models/Banner');
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }
    
    // Update text fields
    banner.title = req.body.title || banner.title;
    banner.subtitle = req.body.subtitle || banner.subtitle;
    banner.buttonText = req.body.buttonText || banner.buttonText;
    banner.link = req.body.link || banner.link;
    banner.order = parseInt(req.body.order) || banner.order;
    banner.active = req.body.active === 'true' || req.body.active === true;
    
    // Upload new image if provided
    if (req.file) {
      // Delete old image from R2
      if (banner.imageKey) {
        await deleteFromR2(banner.imageKey);
      }
      
      const result = await uploadToR2(req.file, 'banners');
      if (result.success) {
        banner.image = result.url;
        banner.imageKey = result.key;
      }
    }
    
    await banner.save();
    res.json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Delete banner
router.delete('/banners/:id', async (req, res) => {
  try {
    const Banner = require('../models/Banner');
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }
    
    // Delete image from R2
    if (banner.imageKey) {
      await deleteFromR2(banner.imageKey);
    }
    
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
