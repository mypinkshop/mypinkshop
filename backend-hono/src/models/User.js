// src/models/User.js

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

// 📌 CREATE USER
export const createUser = async (db, data) => {
  const hashedPassword = await hashPassword(data.password);
  
  const result = await db.prepare(
    `INSERT INTO users (name, email, password, role, phone, address, gender, dob, profileImage, city, state, pincode, isEmailVerified, emailVerificationToken, emailVerificationExpires, resetPasswordToken, resetPasswordExpires, brandName, gstNumber, vendorStatus, logo, totalSales, earnings)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`
  ).bind(
    data.name,
    data.email,
    hashedPassword,
    data.role || 'buyer',
    data.phone || '',
    data.address || '',
    data.gender || '',
    data.dob || '',
    data.profileImage || '',
    data.city || '',
    data.state || '',
    data.pincode || '',
    data.isEmailVerified ? 1 : 0,
    data.emailVerificationToken || '',
    data.emailVerificationExpires || null,
    data.resetPasswordToken || '',
    data.resetPasswordExpires || null,
    data.brandName || '',
    data.gstNumber || '',
    data.vendorStatus || 'pending',
    data.logo || '🛍️'
  ).run();

  return result.meta.last_row_id;
};

// 📌 GET USER BY ID
export const getUserById = async (db, id) => {
  return await db.prepare(
    `SELECT * FROM users WHERE id = ?`
  ).bind(id).first();
};

// 📌 GET USER BY EMAIL
export const getUserByEmail = async (db, email) => {
  return await db.prepare(
    `SELECT * FROM users WHERE email = ?`
  ).bind(email).first();
};

// 📌 GET ALL USERS
export const getAllUsers = async (db, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM users ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM users`
  ).first();

  return {
    users: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 GET ALL VENDORS
export const getAllVendors = async (db, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM users WHERE role = 'vendor' ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM users WHERE role = 'vendor'`
  ).first();

  return {
    vendors: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 UPDATE USER
export const updateUser = async (db, id, data) => {
  let query = `UPDATE users SET `;
  let params = [];
  let fields = Object.keys(data);

  fields.forEach((field, index) => {
    query += `${field} = ?, `;
    params.push(data[field]);
  });

  query += `updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  params.push(id);

  await db.prepare(query).bind(...params).run();

  return await getUserById(db, id);
};

// 📌 UPDATE PASSWORD
export const updatePassword = async (db, id, password) => {
  const hashedPassword = await hashPassword(password);
  
  await db.prepare(
    `UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(hashedPassword, id).run();

  return await getUserById(db, id);
};

// 📌 SET EMAIL VERIFICATION
export const setEmailVerification = async (db, id, token, expiresAt) => {
  await db.prepare(
    `UPDATE users SET isEmailVerified = 0, emailVerificationToken = ?, emailVerificationExpires = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(token, expiresAt, id).run();

  return await getUserById(db, id);
};

// 📌 VERIFY EMAIL
export const verifyEmail = async (db, token) => {
  const user = await db.prepare(
    `SELECT * FROM users WHERE emailVerificationToken = ?`
  ).bind(token).first();

  if (!user) return null;

  await db.prepare(
    `UPDATE users SET isEmailVerified = 1, emailVerificationToken = '', emailVerificationExpires = null, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(user.id).run();

  return await getUserById(db, user.id);
};

// 📌 SET RESET PASSWORD TOKEN
export const setResetPasswordToken = async (db, id, token, expiresAt) => {
  await db.prepare(
    `UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(token, expiresAt, id).run();

  return await getUserById(db, id);
};

// 📌 VERIFY RESET PASSWORD TOKEN
export const verifyResetPasswordToken = async (db, token) => {
  const user = await db.prepare(
    `SELECT * FROM users WHERE resetPasswordToken = ?`
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
    `UPDATE users SET password = ?, resetPasswordToken = '', resetPasswordExpires = null, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(hashedPassword, user.id).run();

  return await getUserById(db, user.id);
};

// 📌 DELETE USER
export const deleteUser = async (db, id) => {
  const result = await db.prepare(`DELETE FROM users WHERE id = ?`).bind(id).run();
  return result.meta.changes > 0;
};

// 📌 GET USER STATS (Admin)
export const getUserStats = async (db) => {
  const totalUsers = await db.prepare(`SELECT COUNT(*) as count FROM users`).first();
  const totalVendors = await db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'vendor'`).first();
  const totalBuyers = await db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'buyer'`).first();
  const pendingVendors = await db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'vendor' AND vendorStatus = 'pending'`).first();

  return {
    totalUsers: totalUsers.count,
    totalVendors: totalVendors.count,
    totalBuyers: totalBuyers.count,
    pendingVendors: pendingVendors.count
  };
};
