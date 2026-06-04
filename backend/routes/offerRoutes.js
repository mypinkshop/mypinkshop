const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const { protect, admin } = require('../middleware/auth');

// ✅ Get active offer for top banner (Public)
router.get('/active-offer', async (req, res) => {
  try {
    console.log('🔥 GET /active-offer called');
    const currentDate = new Date();
    console.log('Current date:', currentDate);
    
    const offer = await Offer.findOne({
      isActive: true,
      type: 'top_banner',
      startDate: { $lte: currentDate },
      $or: [
        { endDate: { $gte: currentDate } },
        { endDate: null }
      ]
    }).sort({ createdAt: -1 });
    
    console.log('Found offer:', offer);
    
    res.json(offer || {
      title: 'Free Shipping',
      description: 'FREE SHIPPING ON ORDERS ABOVE ₹999 • EXTRA 10% OFF ON FIRST ORDER',
      discountValue: 10,
      minOrderValue: 999
    });
  } catch (error) {
    console.error('Error in /active-offer:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get all offers (Admin only)
router.get('/all', protect, admin, async (req, res) => {
  try {
    console.log('🔥 GET /all called, user:', req.user?.email);
    const offers = await Offer.find().sort({ createdAt: -1 });
    console.log(`Found ${offers.length} offers`);
    res.json(offers);
  } catch (error) {
    console.error('Error in /all:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Create new offer (Admin only)
router.post('/create', protect, admin, async (req, res) => {
  try {
    console.log('🔥 POST /create called');
    console.log('Request body:', req.body);
    console.log('User:', req.user?.email);
    
    const { title, description, discountType, discountValue, minOrderValue, startDate, endDate, type } = req.body;
    
    // Validation
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    const offer = new Offer({
      title,
      description,
      type: type || 'top_banner',
      discountType: discountType || 'percentage',
      discountValue: discountValue || 10,
      minOrderValue: minOrderValue || 999,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      isActive: true
    });
    
    await offer.save();
    console.log('Offer saved:', offer._id);
    res.status(201).json({ success: true, offer });
  } catch (error) {
    console.error('Error in /create:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update offer (Admin only)
router.put('/update/:id', protect, admin, async (req, res) => {
  try {
    console.log('🔥 PUT /update called for id:', req.params.id);
    const { title, description, discountType, discountValue, minOrderValue, startDate, endDate, isActive } = req.body;
    
    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        discountType,
        discountValue,
        minOrderValue,
        startDate,
        endDate,
        isActive,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    console.log('Offer updated:', offer._id);
    res.json({ success: true, offer });
  } catch (error) {
    console.error('Error in /update:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Toggle offer status (Admin only)
router.patch('/toggle/:id', protect, admin, async (req, res) => {
  try {
    console.log('🔥 PATCH /toggle called for id:', req.params.id);
    const offer = await Offer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    offer.isActive = !offer.isActive;
    offer.updatedAt = new Date();
    await offer.save();
    
    console.log('Offer toggled, isActive:', offer.isActive);
    res.json({ success: true, isActive: offer.isActive });
  } catch (error) {
    console.error('Error in /toggle:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete offer (Admin only)
router.delete('/delete/:id', protect, admin, async (req, res) => {
  try {
    console.log('🔥 DELETE /delete called for id:', req.params.id);
    const offer = await Offer.findByIdAndDelete(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    console.log('Offer deleted:', offer._id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in /delete:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
