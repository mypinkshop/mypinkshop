const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const { protect, admin } = require('../middleware/auth');

// ✅ Get active offer for top banner (Public)
router.get('/active-offer', async (req, res) => {
  try {
    const currentDate = new Date();
    const offer = await Offer.findOne({
      isActive: true,
      type: 'top_banner',
      startDate: { $lte: currentDate },
      $or: [
        { endDate: { $gte: currentDate } },
        { endDate: null }
      ]
    }).sort({ createdAt: -1 });
    
    res.json(offer || {
      title: 'Free Shipping',
      description: 'FREE SHIPPING ON ORDERS ABOVE ₹999 • EXTRA 10% OFF ON FIRST ORDER',
      discountValue: 10,
      minOrderValue: 999
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get all offers (Admin only)
router.get('/all', protect, admin, async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Create new offer (Admin only)
router.post('/create', protect, admin, async (req, res) => {
  try {
    const { title, description, discountType, discountValue, minOrderValue, startDate, endDate, type } = req.body;
    
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
    res.status(201).json({ success: true, offer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update offer (Admin only)
router.put('/update/:id', protect, admin, async (req, res) => {
  try {
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
      { new: true }
    );
    
    res.json({ success: true, offer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Toggle offer status (Admin only)
router.patch('/toggle/:id', protect, admin, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    offer.isActive = !offer.isActive;
    offer.updatedAt = new Date();
    await offer.save();
    res.json({ success: true, isActive: offer.isActive });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete offer (Admin only)
router.delete('/delete/:id', protect, admin, async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
