import { Hono } from 'hono';

const coupons = new Hono();

// Helper to check if user is admin
const isAdmin = (c) => {
  const user = c.get('user');
  return user && user.role === 'admin';
};

// Helper: Get vendor name from users table
const getVendorName = async (c, vendorId) => {
  if (!vendorId) return null;
  const vendor = await c.env.DB.prepare(
    `SELECT name, brandName, storeName FROM users WHERE id = ?`
  ).bind(vendorId).first();
  return vendor?.brandName || vendor?.name || vendor?.storeName || 'Vendor';
};

// ========== PUBLIC ROUTES ==========

// ✅ GET active coupons - WITH VENDOR FILTER
coupons.get('/active', async (c) => {
  try {
    const now = new Date().toISOString();
    
    const { cartItems } = c.req.query();
    let vendorIdsInCart = [];
    
    if (cartItems) {
      try {
        const parsed = JSON.parse(cartItems);
        vendorIdsInCart = [...new Set(parsed.map(item => item.vendorId).filter(id => id))];
      } catch (e) {}
    }
    
    let query = `SELECT * FROM coupons WHERE isActive = 1 AND startDate <= ? AND (endDate IS NULL OR endDate >= ?) AND usedCount < usageLimit`;
    let params = [now, now];
    
    if (vendorIdsInCart.length > 0) {
      const placeholders = vendorIdsInCart.map(() => '?').join(',');
      query += ` AND (vendorId IS NULL OR vendorId IN (${placeholders}))`;
      params.push(...vendorIdsInCart);
    } else {
      query += ` AND vendorId IS NULL`;
    }
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    
    const couponsWithVendor = await Promise.all(results.map(async (coupon) => {
      if (coupon.vendorId) {
        const vendorName = await getVendorName(c, coupon.vendorId);
        return {
          ...coupon,
          vendorName: vendorName || 'Vendor',
          vendorStoreName: vendorName || 'Vendor Store',
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
    
    return c.json({ success: true, coupons: couponsWithVendor });
  } catch (error) {
    console.error('Error fetching active coupons:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ✅ Validate coupon
coupons.post('/validate', async (c) => {
  try {
    const { code, cartTotal, userId, cartItems } = await c.req.json();
    const couponCode = code.toUpperCase();
    
    const coupon = await c.env.DB.prepare(
      `SELECT * FROM coupons WHERE code = ? AND isActive = 1 AND startDate <= ? AND (endDate IS NULL OR endDate >= ?)`
    ).bind(couponCode, new Date().toISOString(), new Date().toISOString()).first();
    
    if (!coupon) {
      return c.json({ 
        valid: false, 
        message: 'Invalid coupon code' 
      });
    }
    
    if (coupon.usedCount >= coupon.usageLimit) {
      return c.json({ 
        valid: false, 
        message: 'Coupon usage limit exceeded' 
      });
    }
    
    let applicableCartTotal = cartTotal;
    let isVendorCoupon = false;
    let vendorName = null;
    let vendorId = null;
    
    if (coupon.vendorId) {
      isVendorCoupon = true;
      vendorId = coupon.vendorId;
      
      if (!cartItems || cartItems.length === 0) {
        return c.json({
          valid: false,
          message: 'Please provide cart items to validate this coupon'
        });
      }
      
      const vendorItems = cartItems.filter(item => item.vendorId === coupon.vendorId.toString());
      
      if (vendorItems.length === 0) {
        return c.json({
          valid: false,
          message: 'This coupon is only applicable on products from this vendor'
        });
      }
      
      applicableCartTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const vendor = await c.env.DB.prepare(
        `SELECT name, brandName, storeName FROM users WHERE id = ?`
      ).bind(coupon.vendorId).first();
      vendorName = vendor?.brandName || vendor?.name || vendor?.storeName || 'Vendor';
      
      if (applicableCartTotal < coupon.minOrderValue) {
        return c.json({
          valid: false,
          message: `Minimum order of ₹${coupon.minOrderValue} required on ${vendorName} products`
        });
      }
    } else {
      if (cartTotal < coupon.minOrderValue) {
        return c.json({ 
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
    
    return c.json({
      valid: true,
      coupon: {
        id: coupon.id,
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
    return c.json({ valid: false, message: 'Server error' }, 500);
  }
});

// ========== ADMIN ROUTES ==========

// ✅ GET ALL COUPONS (Admin)
coupons.get('/all', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM coupons ORDER BY createdAt DESC`
    ).all();
    
    const couponsWithVendor = await Promise.all(results.map(async (coupon) => {
      if (coupon.vendorId) {
        const vendor = await c.env.DB.prepare(
          `SELECT name, brandName, storeName, email FROM users WHERE id = ?`
        ).bind(coupon.vendorId).first();
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
    
    return c.json(couponsWithVendor);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// ✅ CREATE COUPON (Admin)
coupons.post('/create', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Admin access required' }, 403);
    }

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
    } = await c.req.json();
    
    const existingCoupon = await c.env.DB.prepare(
      `SELECT * FROM coupons WHERE code = ?`
    ).bind(code.toUpperCase()).first();
    if (existingCoupon) {
      return c.json({ error: 'Coupon code already exists' }, 400);
    }
    
    if (vendorId) {
      const vendor = await c.env.DB.prepare(
        `SELECT * FROM users WHERE id = ?`
      ).bind(vendorId).first();
      if (!vendor) {
        return c.json({ error: 'Vendor not found' }, 404);
      }
    }
    
    const result = await c.env.DB.prepare(
      `INSERT INTO coupons (code, description, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, startDate, endDate, isActive, vendorId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
    ).bind(
      code.toUpperCase(),
      description || '',
      discountType || 'percentage',
      parseFloat(discountValue),
      minOrderValue || 0,
      maxDiscount || 0,
      usageLimit || 100,
      startDate || new Date().toISOString(),
      endDate || null,
      vendorId || null
    ).run();

    const couponId = result.meta.last_row_id;
    
    let vendorName = null;
    if (vendorId) {
      const vendor = await c.env.DB.prepare(
        `SELECT name, brandName FROM users WHERE id = ?`
      ).bind(vendorId).first();
      vendorName = vendor?.brandName || vendor?.name || 'Vendor';
    }
    
    return c.json({ 
      success: true, 
      coupon: {
        id: couponId,
        code: code.toUpperCase(),
        vendorName: vendorName
      } 
    }, 201);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// ✅ UPDATE COUPON (Admin)
coupons.put('/update/:id', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { vendorId, ...updateData } = await c.req.json();
    
    if (vendorId) {
      const vendor = await c.env.DB.prepare(
        `SELECT * FROM users WHERE id = ?`
      ).bind(vendorId).first();
      if (!vendor) {
        return c.json({ error: 'Vendor not found' }, 404);
      }
    }
    
    let updateQuery = `UPDATE coupons SET `;
    let updateParams = [];
    let fields = Object.keys(updateData);
    
    fields.forEach((field, index) => {
      updateQuery += `${field} = ?, `;
      updateParams.push(updateData[field]);
    });
    
    if (vendorId !== undefined) {
      updateQuery += `vendorId = ?, `;
      updateParams.push(vendorId || null);
    }
    
    updateQuery += `updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
    updateParams.push(parseInt(c.req.param('id')));
    
    await c.env.DB.prepare(updateQuery).bind(...updateParams).run();
    
    return c.json({ success: true, coupon: { id: parseInt(c.req.param('id')) } });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// ✅ TOGGLE COUPON (Admin)
coupons.patch('/toggle/:id', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const coupon = await c.env.DB.prepare(
      `SELECT * FROM coupons WHERE id = ?`
    ).bind(parseInt(c.req.param('id'))).first();
    if (!coupon) {
      return c.json({ error: 'Coupon not found' }, 404);
    }
    
    const newStatus = coupon.isActive ? 0 : 1;
    await c.env.DB.prepare(
      `UPDATE coupons SET isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(newStatus, parseInt(c.req.param('id'))).run();
    
    return c.json({ success: true, isActive: newStatus });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// ✅ DELETE COUPON (Admin)
coupons.delete('/delete/:id', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    await c.env.DB.prepare(
      `DELETE FROM coupons WHERE id = ?`
    ).bind(parseInt(c.req.param('id'))).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

export default coupons;
