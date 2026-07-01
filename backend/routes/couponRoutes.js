const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const { protect, admin } = require('../middleware/auth');

// ========== PUBLIC ROUTES ==========

// ✅ GET active coupons - WITH VENDOR FILTER
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    
    // ✅ Cart items lo query se
    const { cartItems } = req.query;
    let vendorIdsInCart = [];
    
    if (cartItems) {
      try {
        const parsed = JSON.parse(cartItems);
        vendorIdsInCart = [...new Set(parsed.map(item => item.vendorId).filter(id => id))];
      } catch (e) {}
    }
    
    // ✅ Query build karo
    const query = {
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: { $gte: now } },
        { endDate: null }
      ],
      $expr: { $lt: ['$usedCount', '$usageLimit'] }
    };
    
    // ✅ Vendor filter - Sirf admin coupons + matching vendor coupons
    if (vendorIdsInCart.length > 0) {
      query.$or = [
        { vendorId: null },                     // Admin coupon (sabko dikhega)
        { vendorId: { $in: vendorIdsInCart } }  // Vendor coupon (sirf us vendor ke products wali cart mein)
      ];
    } else {
      // ✅ Empty cart → Sirf admin coupons
      query.vendorId = null;
    }
    
    const coupons = await Coupon.find(query).lean();
    
    // ✅ Vendor info populate karo
    const couponsWithVendor = await Promise.all(coupons.map(async (coupon) => {
      if (coupon.vendorId) {
        const vendor = await Vendor.findById(coupon.vendorId).select('name brandName storeName');
        return {
          ...coupon,
          vendorName: vendor?.brandName || vendor?.name || vendor?.storeName || 'Vendor',
          vendorStoreName: vendor?.storeName || vendor?.brandName || 'Vendor Store',
          isVendorCoupon: true
        };
      }
      return {
        ...coupon,
        vendorName: null,
        vendorStoreName: null,
        isVendorCoupon: false
      };
    }));
    
    res.json({ success: true, coupons: couponsWithVendor });
  } catch (error) {
    console.error('Error fetching active coupons:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Validate coupon - WITH VENDOR PRODUCT CHECK
router.post('/validate', async (req, res) => {
  try {
    const { code, cartTotal, userId, cartItems } = req.body;
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
    
    // ✅ VENDOR COUPON LOGIC
    let applicableCartTotal = cartTotal;
    let isVendorCoupon = false;
    let vendorName = null;
    let vendorId = null;
    
    if (coupon.vendorId) {
      isVendorCoupon = true;
      vendorId = coupon.vendorId;
      
      if (!cartItems || cartItems.length === 0) {
        return res.json({
          valid: false,
          message: 'Please provide cart items to validate this coupon'
        });
      }
      
      const vendorItems = cartItems.filter(item => item.vendorId === coupon.vendorId.toString());
      
      if (vendorItems.length === 0) {
        return res.json({
          valid: false,
          message: 'This coupon is only applicable on products from this vendor'
        });
      }
      
      applicableCartTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const vendor = await Vendor.findById(coupon.vendorId).select('name brandName storeName');
      vendorName = vendor?.brandName || vendor?.name || vendor?.storeName || 'Vendor';
      
      if (applicableCartTotal < coupon.minOrderValue) {
        return res.json({
          valid: false,
          message: `Minimum order of ₹${coupon.minOrderValue} required on ${vendorName} products`
        });
      }
    } else {
      if (cartTotal < coupon.minOrderValue) {
        return res.json({ 
          valid: false, 
          message: `Minimum order value of ₹${coupon.minOrderValue} required` 
        });
      }
    }
    
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (applicableCartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
      if (discountAmount > applicableCartTotal) {
        discountAmount = applicableCartTotal;
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
        minOrderValue: coupon.minOrderValue,
        vendorId: coupon.vendorId,
        vendorName: vendorName,
        isVendorCoupon: isVendorCoupon
      }
    });
    
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// ========== ADMIN ROUTES ==========

// ✅ Get all coupons - WITH VENDOR INFO
router.get('/all', protect, admin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    
    const couponsWithVendor = await Promise.all(coupons.map(async (coupon) => {
      if (coupon.vendorId) {
        const vendor = await Vendor.findById(coupon.vendorId).select('name brandName storeName email');
        return {
          ...coupon,
          vendorName: vendor?.brandName || vendor?.name || vendor?.storeName || 'Unknown Vendor',
          vendorEmail: vendor?.email || ''
        };
      }
      return {
        ...coupon,
        vendorName: null,
        vendorEmail: null
      };
    }));
    
    res.json(couponsWithVendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Create coupon - WITH VENDOR SUPPORT
router.post('/create', protect, admin, async (req, res) => {
  try {
    const { 
      code, 
      description, 
      discountType, 
      discountValue, 
      minOrderValue, 
      maxDiscount, 
      usageLimit, 
      startDate, 
      endDate,
      vendorId
    } = req.body;
    
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    
    if (vendorId) {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
    }
    
    const coupon = new Coupon({
      code: code.toUpperCase(),
      description: description || '',
      discountType: discountType || 'percentage',
      discountValue: parseFloat(discountValue),
      minOrderValue: minOrderValue || 0,
      maxDiscount: maxDiscount || 0,
      usageLimit: usageLimit || 100,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      isActive: true,
      vendorId: vendorId || null
    });
    
    await coupon.save();
    
    let vendorName = null;
    if (vendorId) {
      const vendor = await Vendor.findById(vendorId).select('name brandName');
      vendorName = vendor?.brandName || vendor?.name || 'Vendor';
    }
    
    res.status(201).json({ 
      success: true, 
      coupon: {
        ...coupon.toObject(),
        vendorName: vendorName
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update coupon
router.put('/update/:id', protect, admin, async (req, res) => {
  try {
    const { vendorId, ...updateData } = req.body;
    
    if (vendorId) {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
    }
    
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { 
        ...updateData, 
        vendorId: vendorId || null,
        updatedAt: new Date() 
      },
      { new: true }
    );
    
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Toggle coupon status
router.patch('/toggle/:id', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    coupon.isActive = !coupon.isActive;
    coupon.updatedAt = new Date();
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
