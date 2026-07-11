// backend/routes/shippingRoutes.js

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  checkServiceability,
  getShippingRates,
  createShiprocketOrder,
  generateAWB,
  getTrackingDetails,
  cancelShiprocketOrder
} = require('../services/shiprocketService');

// ============================================
// 📦 LOCAL SHIPPING SETTINGS (Fallback)
// ============================================
let shippingSettings = {
  defaultDays: [3, 7],
  expressDays: [1, 3],
  freeShippingThreshold: 499,
  shippingCharges: 50,
  expressCharges: 99,
  codCharges: 30,
  deliverablePincodes: [], // Empty = all pincodes
  cutOffTime: '16:00',
  sundayDelivery: false,
  warehouseAddress: {
    pincode: '110001',
    city: 'New Delhi',
    state: 'Delhi'
  },
  // ✅ Shiprocket enabled flag
  shiprocketEnabled: true,
  useShiprocketForTracking: true
};

// ============================================
// 🚚 SHIPROCKET SHIPPING ROUTES
// ============================================

// 📍 Check delivery availability - Shiprocket + Local Fallback
router.post('/check-delivery', async (req, res) => {
  try {
    const { 
      pincode, 
      cartTotal, 
      isExpress, 
      weight = 0.5,
      vendorPincode = shippingSettings.warehouseAddress.pincode,
      useShiprocket = shippingSettings.shiprocketEnabled
    } = req.body;
    
    // ✅ Try Shiprocket first
    if (useShiprocket) {
      try {
        const serviceResult = await checkServiceability(vendorPincode, pincode, weight);
        
        if (serviceResult.deliverable) {
          // Get shipping rates
          const rates = await getShippingRates(vendorPincode, pincode, weight);
          
          // Calculate estimated delivery
          const today = new Date();
          const deliveryDate = new Date(today);
          deliveryDate.setDate(today.getDate() + (rates.estimated_days || 3));
          
          // Determine shipping charges
          let shippingCharge = rates.rates || 0;
          let shippingType = 'standard';
          
          // Free shipping threshold
          if (cartTotal >= shippingSettings.freeShippingThreshold) {
            shippingCharge = 0;
          } else if (isExpress) {
            shippingCharge = shippingSettings.expressCharges || shippingCharge;
            shippingType = 'express';
          }
          
          return res.json({
            success: true,
            deliverable: true,
            source: 'shiprocket',
            shippingCharge,
            shippingType,
            courier: rates.courier_name || 'Standard',
            estimatedDelivery: {
              minDate: today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              maxDate: deliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              minDays: Math.max(1, rates.estimated_days - 2),
              maxDays: rates.estimated_days || 3
            },
            freeShippingThreshold: shippingSettings.freeShippingThreshold,
            cutOffTime: shippingSettings.cutOffTime
          });
        } else {
          // Shiprocket says not deliverable, fallback to local
          console.log('Shiprocket: Not deliverable, using local fallback');
        }
      } catch (shiprocketError) {
        console.log('Shiprocket error, falling back to local:', shiprocketError.message);
      }
    }
    
    // ✅ LOCAL FALLBACK - Check local pincode
    const isServiceable = shippingSettings.deliverablePincodes.length === 0 || 
                          shippingSettings.deliverablePincodes.includes(pincode);
    
    if (!isServiceable) {
      return res.json({
        success: false,
        deliverable: false,
        source: 'local',
        message: 'Sorry, delivery is not available at this pincode yet.'
      });
    }
    
    // Calculate shipping charges (local)
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
    
    // Calculate estimated delivery (local)
    const daysToAdd = isExpress ? shippingSettings.expressDays[1] : shippingSettings.defaultDays[1];
    const minDays = isExpress ? shippingSettings.expressDays[0] : shippingSettings.defaultDays[0];
    
    let estimatedDate = new Date();
    let daysAdded = 0;
    let actualDays = 0;
    
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
      source: 'local',
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
    console.error('Delivery check error:', error);
    res.status(500).json({ 
      success: false, 
      deliverable: false,
      error: error.message 
    });
  }
});

// 📦 Create Shiprocket order (Admin/Protected)
router.post('/create-shiprocket-order', protect, async (req, res) => {
  try {
    const orderData = req.body;
    const result = await createShiprocketOrder(orderData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create Shiprocket order' 
    });
  }
});

// 📍 Get shipping rates (Public)
router.post('/shipping-rates', async (req, res) => {
  try {
    const { pickupPincode, deliveryPincode, weight = 0.5 } = req.body;
    
    const result = await getShippingRates(pickupPincode, deliveryPincode, weight);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get shipping rates' 
    });
  }
});

// 🔍 Get tracking details (Authenticated)
router.get('/tracking/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Try Shiprocket first
    if (shippingSettings.useShiprocketForTracking) {
      try {
        const result = await getTrackingDetails(orderId);
        if (result.success) {
          return res.json({
            success: true,
            source: 'shiprocket',
            tracking: result
          });
        }
      } catch (error) {
        console.log('Shiprocket tracking failed, trying local:', error.message);
      }
    }
    
    // Local tracking fallback
    res.json({
      success: true,
      source: 'local',
      tracking: {
        status: 'pending',
        message: 'Tracking information will be available soon'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get tracking details' 
    });
  }
});

// 📦 Generate AWB (Admin only)
router.post('/generate-awb', protect, admin, async (req, res) => {
  try {
    const { orderId } = req.body;
    const result = await generateAWB(orderId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate AWB' 
    });
  }
});

// ❌ Cancel Shiprocket order (Admin only)
router.post('/cancel-shiprocket-order', protect, admin, async (req, res) => {
  try {
    const { orderId } = req.body;
    const result = await cancelShiprocketOrder(orderId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel order' 
    });
  }
});

// ============================================
// 📦 LOCAL SHIPPING SETTINGS (Admin)
// ============================================

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

// 📍 Add/Remove deliverable pincodes (Admin)
router.post('/pincodes', protect, admin, (req, res) => {
  try {
    const { action, pincodes } = req.body;
    
    if (action === 'add') {
      shippingSettings.deliverablePincodes = [
        ...new Set([...shippingSettings.deliverablePincodes, ...pincodes])
      ];
    } else if (action === 'remove') {
      shippingSettings.deliverablePincodes = shippingSettings.deliverablePincodes
        .filter(p => !pincodes.includes(p));
    } else if (action === 'set') {
      shippingSettings.deliverablePincodes = pincodes;
    }
    
    res.json({ 
      success: true, 
      pincodes: shippingSettings.deliverablePincodes 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
