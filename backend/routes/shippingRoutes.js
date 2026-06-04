const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');

// Shipping settings schema (in-memory, can be moved to DB)
let shippingSettings = {
  defaultDays: [3, 7],
  expressDays: [1, 3],
  freeShippingThreshold: 999,
  shippingCharges: 50,
  expressCharges: 99,
  codCharges: 30,
  deliverablePincodes: [],
  cutOffTime: '16:00',
  sundayDelivery: false,
  warehouseAddress: {
    pincode: '110001',
    city: 'New Delhi',
    state: 'Delhi'
  }
};

// 📍 Check delivery availability and get estimated date
router.post('/check-delivery', async (req, res) => {
  try {
    const { pincode, cartTotal, isExpress } = req.body;
    
    // Check if pincode is serviceable
    const isServiceable = shippingSettings.deliverablePincodes.length === 0 || 
                          shippingSettings.deliverablePincodes.includes(pincode);
    
    if (!isServiceable) {
      return res.json({
        success: false,
        deliverable: false,
        message: 'Sorry, delivery is not available at this pincode yet.'
      });
    }
    
    // Calculate shipping charges
    let shippingCharge = 0;
    let shippingType = 'standard';
    
    if (cartTotal >= shippingSettings.freeShippingThreshold) {
      shippingCharge = 0;
    } else if (isExpress) {
      shippingCharge = shippingSettings.expressCharges;
      shippingType = 'express';
    } else {
      shippingCharge = shippingSettings.shippingCharges;
    }
    
    // Calculate estimated delivery date
    const daysToAdd = isExpress ? shippingSettings.expressDays[1] : shippingSettings.defaultDays[1];
    const minDays = isExpress ? shippingSettings.expressDays[0] : shippingSettings.defaultDays[0];
    
    let estimatedDate = new Date();
    let daysAdded = 0;
    let actualDays = 0;
    
    // Skip Sundays if not available
    while (daysAdded < daysToAdd) {
      estimatedDate.setDate(estimatedDate.getDate() + 1);
      if (estimatedDate.getDay() !== 0 || shippingSettings.sundayDelivery) {
        daysAdded++;
        actualDays++;
      }
    }
    
    const minEstimatedDate = new Date();
    let minDaysAdded = 0;
    while (minDaysAdded < minDays) {
      minEstimatedDate.setDate(minEstimatedDate.getDate() + 1);
      if (minEstimatedDate.getDay() !== 0 || shippingSettings.sundayDelivery) {
        minDaysAdded++;
      }
    }
    
    res.json({
      success: true,
      deliverable: true,
      shippingCharge,
      shippingType,
      estimatedDelivery: {
        minDate: minEstimatedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        maxDate: estimatedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        minDays: minDays,
        maxDays: actualDays
      },
      freeShippingThreshold: shippingSettings.freeShippingThreshold,
      cutOffTime: shippingSettings.cutOffTime
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📦 Get shipping settings (Admin)
router.get('/settings', protect, admin, (req, res) => {
  res.json({ success: true, settings: shippingSettings });
});

// 📦 Update shipping settings (Admin)
router.post('/settings', protect, admin, (req, res) => {
  try {
    shippingSettings = { ...shippingSettings, ...req.body };
    res.json({ success: true, settings: shippingSettings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
