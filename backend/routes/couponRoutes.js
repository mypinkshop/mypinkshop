const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect, admin } = require('../middleware/auth');

// ========== PUBLIC ROUTES ==========

// ✅ GET active coupons (For Cart page)
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: { $gte: now } },
        { endDate: null }
      ],
      $expr: { $lt: ['$usedCount', '$usageLimit'] }
    }).select('code description discountType discountValue minOrderValue maxDiscount');
    
    res.json({ success: true, coupons });
  } catch (error) {
    console.error('Error fetching active coupons:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Validate coupon
router.post('/validate', async (req, res) => {
  try {
    const { code, cartTotal, userId } = req.body;
    const couponCode = code.toUpperCase();
    
    const coupon = await Coupon.findOne({ 
      code: couponCode, 
      isActive: true,
      startDate: { $lte: new Date() },
      $or: [
        { endDate: { $gte: new Date() } },
        { endDate: null }
      ]
    });
    
    if (!coupon) {
      return res.json({ 
        valid: false, 
        message: 'Invalid coupon code' 
      });
    }
    
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.json({ 
        valid: false, 
        message: 'Coupon usage limit exceeded' 
      });
    }
    
    if (cartTotal < coupon.minOrderValue) {
      return res.json({ 
        valid: false, 
        message: `Minimum order value of ₹${coupon.minOrderValue} required` 
      });
    }
    
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
      if (discountAmount > cartTotal) {
        discountAmount = cartTotal;
      }
    }
    
    res.json({
      valid: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount),
        minOrderValue: coupon.minOrderValue
      }
    });
    
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// ========== ADMIN ROUTES ==========

// ✅ Get all coupons
router.get('/all', protect, admin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Create coupon
router.post('/create', protect, admin, async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, startDate, endDate } = req.body;
    
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    
    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderValue: minOrderValue || 0,
      maxDiscount: maxDiscount || 0,
      usageLimit: usageLimit || 1,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      isActive: true
    });
    
    await coupon.save();
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update coupon
router.put('/update/:id', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Toggle coupon status
router.patch('/toggle/:id', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({ success: true, isActive: coupon.isActive });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete coupon
router.delete('/delete/:id', protect, admin, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
