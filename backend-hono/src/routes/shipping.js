import { Hono } from 'hono';

const shipping = new Hono();

// Helper to check if user is admin
const isAdmin = (c) => {
  const user = c.get('user');
  return user && user.role === 'admin';
};

// Helper: Get shipping settings from D1
const getShippingSettings = async (c) => {
  const settings = await c.env.DB.prepare(
    `SELECT * FROM shipping_settings ORDER BY createdAt DESC LIMIT 1`
  ).first();
  
  // Default settings if no data in DB
  if (!settings) {
    return {
      id: 0,
      defaultDays: [3, 7],
      expressDays: [1, 3],
      freeShippingThreshold: 499,
      shippingCharges: 50,
      expressCharges: 99,
      codCharges: 30,
      deliverablePincodes: [],
      cutOffTime: '16:00',
      sundayDelivery: false,
      warehouseAddress: { pincode: '110001', city: 'New Delhi', state: 'Delhi' },
      shiprocketEnabled: true,
      useShiprocketForTracking: true,
      shiprocketToken: ''
    };
  }
  
  // Parse JSON fields
  const parsed = {
    ...settings,
    defaultDays: JSON.parse(settings.defaultDays || '[3, 7]'),
    expressDays: JSON.parse(settings.expressDays || '[1, 3]'),
    deliverablePincodes: JSON.parse(settings.deliverablePincodes || '[]'),
    warehouseAddress: JSON.parse(settings.warehouseAddress || '{"pincode":"110001","city":"New Delhi","state":"Delhi"}'),
    sundayDelivery: settings.sundayDelivery === 1,
    shiprocketEnabled: settings.shiprocketEnabled === 1,
    useShiprocketForTracking: settings.useShiprocketForTracking === 1
  };
  
  return parsed;
};

// ============================================
// 📦 SHIPROCKET SERVICE (Cloudflare Worker Compatible)
// ============================================

// Helper: Shiprocket API Call
const shiprocketCall = async (endpoint, method, body, token) => {
  const response = await fetch(`https://apiv2.shiprocket.in/v1/external/${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json();
  return data;
};

// ============================================
// 🚚 SHIPROCKET SHIPPING ROUTES
// ============================================

// 📍 Check delivery availability - Shiprocket + Local Fallback
shipping.post('/check-delivery', async (c) => {
  try {
    const { 
      pincode, 
      cartTotal, 
      isExpress, 
      weight = 0.5,
      vendorPincode,
      useShiprocket
    } = await c.req.json();
    
    const settings = await getShippingSettings(c);
    const warehousePincode = vendorPincode || settings.warehouseAddress.pincode;
    const shouldUseShiprocket = useShiprocket !== undefined ? useShiprocket : settings.shiprocketEnabled;
    
    // ✅ Try Shiprocket first
    if (shouldUseShiprocket && settings.shiprocketToken) {
      try {
        const serviceResult = await shiprocketCall('courier/serviceability', 'POST', {
          pickup_postcode: warehousePincode,
          delivery_postcode: pincode,
          weight: weight
        }, settings.shiprocketToken);
        
        if (serviceResult && serviceResult.status === 1) {
          const rates = await shiprocketCall('courier/rates', 'POST', {
            pickup_postcode: warehousePincode,
            delivery_postcode: pincode,
            weight: weight
          }, settings.shiprocketToken);
          
          // Calculate estimated delivery
          const today = new Date();
          const deliveryDate = new Date(today);
          deliveryDate.setDate(today.getDate() + (rates.estimated_days || 3));
          
          // Determine shipping charges
          let shippingCharge = rates.rates || 0;
          let shippingType = 'standard';
          
          // Free shipping threshold
          if (cartTotal >= settings.freeShippingThreshold) {
            shippingCharge = 0;
          } else if (isExpress) {
            shippingCharge = settings.expressCharges || shippingCharge;
            shippingType = 'express';
          }
          
          return c.json({
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
            freeShippingThreshold: settings.freeShippingThreshold,
            cutOffTime: settings.cutOffTime
          });
        }
      } catch (shiprocketError) {
        console.log('Shiprocket error, falling back to local:', shiprocketError.message);
      }
    }
    
    // ✅ LOCAL FALLBACK - Check local pincode
    const isServiceable = settings.deliverablePincodes.length === 0 || 
                          settings.deliverablePincodes.includes(pincode);
    
    if (!isServiceable) {
      return c.json({
        success: false,
        deliverable: false,
        source: 'local',
        message: 'Sorry, delivery is not available at this pincode yet.'
      });
    }
    
    // Calculate shipping charges (local)
    let shippingCharge = 0;
    let shippingType = 'standard';
    
    if (cartTotal >= settings.freeShippingThreshold) {
      shippingCharge = 0;
    } else if (isExpress) {
      shippingCharge = settings.expressCharges;
      shippingType = 'express';
    } else {
      shippingCharge = settings.shippingCharges;
    }
    
    // Calculate estimated delivery (local)
    const daysToAdd = isExpress ? settings.expressDays[1] : settings.defaultDays[1];
    const minDays = isExpress ? settings.expressDays[0] : settings.defaultDays[0];
    
    let estimatedDate = new Date();
    let daysAdded = 0;
    let actualDays = 0;
    
    while (daysAdded < daysToAdd) {
      estimatedDate.setDate(estimatedDate.getDate() + 1);
      if (estimatedDate.getDay() !== 0 || settings.sundayDelivery) {
        daysAdded++;
        actualDays++;
      }
    }
    
    const minEstimatedDate = new Date();
    let minDaysAdded = 0;
    while (minDaysAdded < minDays) {
      minEstimatedDate.setDate(minEstimatedDate.getDate() + 1);
      if (minEstimatedDate.getDay() !== 0 || settings.sundayDelivery) {
        minDaysAdded++;
      }
    }
    
    return c.json({
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
      freeShippingThreshold: settings.freeShippingThreshold,
      cutOffTime: settings.cutOffTime
    });
    
  } catch (error) {
    console.error('Delivery check error:', error);
    return c.json({ 
      success: false, 
      deliverable: false,
      error: error.message 
    }, 500);
  }
});

// 📦 Create Shiprocket order (Admin/Protected)
shipping.post('/create-shiprocket-order', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    const orderData = await c.req.json();
    const settings = await getShippingSettings(c);
    
    if (!settings.shiprocketToken) {
      return c.json({ success: false, message: 'Shiprocket token not set' });
    }
    
    const result = await shiprocketCall('orders/create/advance', 'POST', orderData, settings.shiprocketToken);
    
    if (result && result.order_id) {
      return c.json({ success: true, order_id: result.order_id });
    } else {
      return c.json({ success: false, message: result.message || 'Failed to create order' }, 400);
    }
  } catch (error) {
    return c.json({ 
      success: false, 
      message: 'Failed to create Shiprocket order' 
    }, 500);
  }
});

// 📍 Get shipping rates (Public)
shipping.post('/shipping-rates', async (c) => {
  try {
    const { pickupPincode, deliveryPincode, weight = 0.5 } = await c.req.json();
    const settings = await getShippingSettings(c);
    
    if (!settings.shiprocketToken) {
      return c.json({ success: false, message: 'Shiprocket token not set' });
    }
    
    const result = await shiprocketCall('courier/rates', 'POST', {
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: weight
    }, settings.shiprocketToken);
    
    return c.json(result);
  } catch (error) {
    return c.json({ 
      success: false, 
      message: 'Failed to get shipping rates' 
    }, 500);
  }
});

// 🔍 Get tracking details (Authenticated)
shipping.get('/tracking/:orderId', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    const { orderId } = c.req.param();
    const settings = await getShippingSettings(c);
    
    // Try Shiprocket first
    if (settings.useShiprocketForTracking && settings.shiprocketToken) {
      try {
        const result = await shiprocketCall(`orders/print/invoice/${orderId}`, 'GET', null, settings.shiprocketToken);
        if (result) {
          return c.json({
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
    return c.json({
      success: true,
      source: 'local',
      tracking: {
        status: 'pending',
        message: 'Tracking information will be available soon'
      }
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      message: 'Failed to get tracking details' 
    }, 500);
  }
});

// 📦 Generate AWB (Admin only)
shipping.post('/generate-awb', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const { orderId } = await c.req.json();
    const settings = await getShippingSettings(c);
    
    if (!settings.shiprocketToken) {
      return c.json({ success: false, message: 'Shiprocket token not set' });
    }
    
    const result = await shiprocketCall('orders/print/invoice', 'POST', {
      order_id: orderId
    }, settings.shiprocketToken);
    
    return c.json(result);
  } catch (error) {
    return c.json({ 
      success: false, 
      message: 'Failed to generate AWB' 
    }, 500);
  }
});

// ❌ Cancel Shiprocket order (Admin only)
shipping.post('/cancel-shiprocket-order', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const { orderId } = await c.req.json();
    const settings = await getShippingSettings(c);
    
    if (!settings.shiprocketToken) {
      return c.json({ success: false, message: 'Shiprocket token not set' });
    }
    
    const result = await shiprocketCall('orders/cancel', 'POST', {
      order_id: orderId
    }, settings.shiprocketToken);
    
    return c.json(result);
  } catch (error) {
    return c.json({ 
      success: false, 
      message: 'Failed to cancel order' 
    }, 500);
  }
});

// ============================================
// 📦 LOCAL SHIPPING SETTINGS (Admin)
// ============================================

// 📦 Get shipping settings (Admin)
shipping.get('/settings', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const settings = await getShippingSettings(c);
    return c.json({ success: true, settings: settings });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 📦 Update shipping settings (Admin)
shipping.post('/settings', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    
    // Update or insert into D1
    const existing = await c.env.DB.prepare(
      `SELECT * FROM shipping_settings ORDER BY createdAt DESC LIMIT 1`
    ).first();
    
    if (existing) {
      await c.env.DB.prepare(
        `UPDATE shipping_settings SET defaultDays = ?, expressDays = ?, freeShippingThreshold = ?, shippingCharges = ?, expressCharges = ?, codCharges = ?, deliverablePincodes = ?, cutOffTime = ?, sundayDelivery = ?, warehouseAddress = ?, shiprocketEnabled = ?, useShiprocketForTracking = ?, shiprocketToken = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(
        JSON.stringify(body.defaultDays || [3, 7]),
        JSON.stringify(body.expressDays || [1, 3]),
        body.freeShippingThreshold || 499,
        body.shippingCharges || 50,
        body.expressCharges || 99,
        body.codCharges || 30,
        JSON.stringify(body.deliverablePincodes || []),
        body.cutOffTime || '16:00',
        body.sundayDelivery ? 1 : 0,
        JSON.stringify(body.warehouseAddress || { pincode: '110001', city: 'New Delhi', state: 'Delhi' }),
        body.shiprocketEnabled ? 1 : 0,
        body.useShiprocketForTracking ? 1 : 0,
        body.shiprocketToken || '',
        existing.id
      ).run();
    } else {
      await c.env.DB.prepare(
        `INSERT INTO shipping_settings (defaultDays, expressDays, freeShippingThreshold, shippingCharges, expressCharges, codCharges, deliverablePincodes, cutOffTime, sundayDelivery, warehouseAddress, shiprocketEnabled, useShiprocketForTracking, shiprocketToken) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        JSON.stringify(body.defaultDays || [3, 7]),
        JSON.stringify(body.expressDays || [1, 3]),
        body.freeShippingThreshold || 499,
        body.shippingCharges || 50,
        body.expressCharges || 99,
        body.codCharges || 30,
        JSON.stringify(body.deliverablePincodes || []),
        body.cutOffTime || '16:00',
        body.sundayDelivery ? 1 : 0,
        JSON.stringify(body.warehouseAddress || { pincode: '110001', city: 'New Delhi', state: 'Delhi' }),
        body.shiprocketEnabled ? 1 : 0,
        body.useShiprocketForTracking ? 1 : 0,
        body.shiprocketToken || ''
      ).run();
    }
    
    return c.json({ success: true, settings: body });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 📍 Add/Remove deliverable pincodes (Admin)
shipping.post('/pincodes', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const { action, pincodes } = await c.req.json();
    const settings = await getShippingSettings(c);
    
    let updatedPincodes = settings.deliverablePincodes;
    
    if (action === 'add') {
      updatedPincodes = [...new Set([...updatedPincodes, ...pincodes])];
    } else if (action === 'remove') {
      updatedPincodes = updatedPincodes.filter(p => !pincodes.includes(p));
    } else if (action === 'set') {
      updatedPincodes = pincodes;
    }
    
    await c.env.DB.prepare(
      `UPDATE shipping_settings SET deliverablePincodes = ? WHERE id = ?`
    ).bind(JSON.stringify(updatedPincodes), settings.id).run();
    
    return c.json({ 
      success: true, 
      pincodes: updatedPincodes 
    });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default shipping;
