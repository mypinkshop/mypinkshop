// src/models/Coupon.js

// 📌 CREATE COUPON
export const createCoupon = async (db, data) => {
  const result = await db.prepare(
    `INSERT INTO coupons (code, description, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, startDate, endDate, isActive)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
  ).bind(
    data.code.toUpperCase(),
    data.description || '',
    data.discountType || 'percentage',
    data.discountValue,
    data.minOrderValue || 0,
    data.maxDiscount || 0,
    data.usageLimit || 1,
    data.startDate || new Date().toISOString(),
    data.endDate || null
  ).run();

  return result.meta.last_row_id;
};

// 📌 GET COUPON BY CODE
export const getCouponByCode = async (db, code) => {
  return await db.prepare(
    `SELECT * FROM coupons WHERE code = ?`
  ).bind(code.toUpperCase()).first();
};

// 📌 GET COUPON BY ID
export const getCouponById = async (db, id) => {
  return await db.prepare(
    `SELECT * FROM coupons WHERE id = ?`
  ).bind(id).first();
};

// 📌 GET ALL COUPONS
export const getAllCoupons = async (db, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM coupons ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(limit, skip).all();

  const totalResult = await db.prepare(`SELECT COUNT(*) as count FROM coupons`).first();

  return {
    coupons: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 GET ACTIVE COUPONS (Public)
export const getActiveCoupons = async (db, limit = 10) => {
  const now = new Date().toISOString();
  const { results } = await db.prepare(
    `SELECT * FROM coupons 
     WHERE isActive = 1 AND startDate <= ? AND (endDate IS NULL OR endDate >= ?) 
     AND usedCount < usageLimit 
     ORDER BY createdAt DESC LIMIT ?`
  ).bind(now, now, limit).all();

  return results;
};

// 📌 UPDATE COUPON
export const updateCoupon = async (db, id, data) => {
  let query = `UPDATE coupons SET `;
  let params = [];
  let fields = Object.keys(data);

  fields.forEach((field, index) => {
    query += `${field} = ?, `;
    params.push(data[field]);
  });

  query += `updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  params.push(id);

  await db.prepare(query).bind(...params).run();

  return await getCouponById(db, id);
};

// 📌 TOGGLE COUPON ACTIVE
export const toggleCouponActive = async (db, id) => {
  const coupon = await getCouponById(db, id);
  if (!coupon) return null;

  const newActive = coupon.isActive ? 0 : 1;
  await db.prepare(
    `UPDATE coupons SET isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(newActive, id).run();

  return await getCouponById(db, id);
};

// 📌 DELETE COUPON
export const deleteCoupon = async (db, id) => {
  const result = await db.prepare(`DELETE FROM coupons WHERE id = ?`).bind(id).run();
  return result.meta.changes > 0;
};

// 📌 VALIDATE COUPON
export const validateCoupon = async (db, code, cartTotal, vendorId = null) => {
  const coupon = await getCouponByCode(db, code);
  if (!coupon) return { valid: false, message: 'Invalid coupon code' };

  if (!coupon.isActive) return { valid: false, message: 'Coupon is not active' };

  if (coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: 'Coupon usage limit exceeded' };
  }

  if (coupon.startDate > new Date().toISOString()) {
    return { valid: false, message: 'Coupon not yet valid' };
  }

  if (coupon.endDate && coupon.endDate < new Date().toISOString()) {
    return { valid: false, message: 'Coupon expired' };
  }

  if (cartTotal < coupon.minOrderValue) {
    return { valid: false, message: `Minimum order value of ₹${coupon.minOrderValue} required` };
  }

  // Calculate discount
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

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.round(discountAmount),
      minOrderValue: coupon.minOrderValue,
      maxDiscount: coupon.maxDiscount
    }
  };
};
