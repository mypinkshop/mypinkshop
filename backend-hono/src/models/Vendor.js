// src/models/Vendor.js

// 📌 HELPER: Password Hashing using Web Crypto API (Cloudflare Workers Compatible)
export const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// 📌 HELPER: Password Verification
export const verifyPassword = async (password, hashedPassword) => {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
};

// 📌 HELPER: Generate store ID
export const generateStoreId = () => {
  return `STORE_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

// 📌 CREATE VENDOR
export const createVendor = async (db, data) => {
  const hashedPassword = await hashPassword(data.password);
  const storeId = generateStoreId();

  const result = await db.prepare(
    `INSERT INTO vendors (name, email, password, brandName, storeName, storeId, phone, address, gstNumber, panNumber, bankDetails, shippingRate, expressRate, freeShippingThreshold, processingTime, status, vendorStatus, permissions, loginAttempts, lockUntil, lastLogin, twoFactorEnabled, twoFactorSecret, resetPasswordToken, resetPasswordExpires)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, 0, null, null, 0, '', '', null)`
  ).bind(
    data.name,
    data.email,
    hashedPassword,
    data.brandName,
    data.storeName || '',
    storeId,
    data.phone || '',
    JSON.stringify(data.address || {}),
    data.gstNumber || '',
    data.panNumber || '',
    JSON.stringify(data.bankDetails || {}),
    data.shippingRate || 49,
    data.expressRate || 99,
    data.freeShippingThreshold || 999,
    data.processingTime || '1-2 days',
    JSON.stringify(data.permissions || ['manage_products', 'view_orders', 'manage_inventory', 'view_analytics'])
  ).run();

  return result.meta.last_row_id;
};

// 📌 GET VENDOR BY ID
export const getVendorById = async (db, id) => {
  return await db.prepare(
    `SELECT * FROM vendors WHERE id = ?`
  ).bind(id).first();
};

// 📌 GET VENDOR BY EMAIL
export const getVendorByEmail = async (db, email) => {
  return await db.prepare(
    `SELECT * FROM vendors WHERE email = ?`
  ).bind(email).first();
};

// 📌 GET VENDOR BY STORE ID
export const getVendorByStoreId = async (db, storeId) => {
  return await db.prepare(
    `SELECT * FROM vendors WHERE storeId = ?`
  ).bind(storeId).first();
};

// 📌 GET ALL VENDORS
export const getAllVendors = async (db, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM vendors ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM vendors`
  ).first();

  return {
    vendors: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 GET ALL VENDORS (Pending Approval)
export const getPendingVendors = async (db, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM vendors WHERE status = 'pending' ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM vendors WHERE status = 'pending'`
  ).first();

  return {
    vendors: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 UPDATE VENDOR
export const updateVendor = async (db, id, data) => {
  let query = `UPDATE vendors SET `;
  let params = [];
  let fields = Object.keys(data);

  fields.forEach((field, index) => {
    query += `${field} = ?, `;
    params.push(data[field]);
  });

  query += `updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  params.push(id);

  await db.prepare(query).bind(...params).run();

  return await getVendorById(db, id);
};

// 📌 APPROVE VENDOR
export const approveVendor = async (db, id) => {
  await db.prepare(
    `UPDATE vendors SET status = 'approved', vendorStatus = 'approved', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(id).run();

  return await getVendorById(db, id);
};

// 📌 REJECT VENDOR
export const rejectVendor = async (db, id) => {
  await db.prepare(
    `UPDATE vendors SET status = 'rejected', vendorStatus = 'rejected', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(id).run();

  return await getVendorById(db, id);
};

// 📌 BLOCK VENDOR
export const blockVendor = async (db, id) => {
  await db.prepare(
    `UPDATE vendors SET status = 'blocked', vendorStatus = 'blocked', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(id).run();

  return await getVendorById(db, id);
};

// 📌 SUSPEND VENDOR
export const suspendVendor = async (db, id) => {
  await db.prepare(
    `UPDATE vendors SET status = 'suspended', vendorStatus = 'suspended', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(id).run();

  return await getVendorById(db, id);
};

// 📌 RESET PASSWORD
export const resetVendorPassword = async (db, id, password) => {
  const hashedPassword = await hashPassword(password);
  
  await db.prepare(
    `UPDATE vendors SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(hashedPassword, id).run();

  return await getVendorById(db, id);
};

// 📌 SET RESET PASSWORD TOKEN
export const setResetPasswordToken = async (db, id, token, expiresAt) => {
  await db.prepare(
    `UPDATE vendors SET resetPasswordToken = ?, resetPasswordExpires = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(token, expiresAt, id).run();

  return await getVendorById(db, id);
};

// 📌 VERIFY RESET PASSWORD TOKEN
export const verifyResetPasswordToken = async (db, token) => {
  const user = await db.prepare(
    `SELECT * FROM vendors WHERE resetPasswordToken = ?`
  ).bind(token).first();

  if (!user) return null;

  if (new Date(user.resetPasswordExpires) < new Date()) {
    return null; // Token expired
  }

  return user;
};

// 📌 RESET PASSWORD
export const resetPassword = async (db, token, password) => {
  const user = await verifyResetPasswordToken(db, token);
  if (!user) return null;

  const hashedPassword = await hashPassword(password);
  
  await db.prepare(
    `UPDATE vendors SET password = ?, resetPasswordToken = '', resetPasswordExpires = null, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(hashedPassword, user.id).run();

  return await getVendorById(db, user.id);
};

// 📌 DELETE VENDOR
export const deleteVendor = async (db, id) => {
  const result = await db.prepare(`DELETE FROM vendors WHERE id = ?`).bind(id).run();
  return result.meta.changes > 0;
};

// 📌 GET VENDOR STATS
export const getVendorStats = async (db) => {
  const totalVendors = await db.prepare(`SELECT COUNT(*) as count FROM vendors`).first();
  const pendingVendors = await db.prepare(`SELECT COUNT(*) as count FROM vendors WHERE status = 'pending'`).first();
  const approvedVendors = await db.prepare(`SELECT COUNT(*) as count FROM vendors WHERE status = 'approved'`).first();
  const suspendedVendors = await db.prepare(`SELECT COUNT(*) as count FROM vendors WHERE status = 'suspended'`).first();

  return {
    totalVendors: totalVendors.count,
    pendingVendors: pendingVendors.count,
    approvedVendors: approvedVendors.count,
    suspendedVendors: suspendedVendors.count
  };
};
