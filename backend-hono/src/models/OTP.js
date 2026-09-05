// src/models/OTP.js

// 📌 CREATE OTP
export const createOTP = async (db, data) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
  const result = await db.prepare(
    `INSERT INTO otps (email, phone, otp, type, expiresAt, verified)
     VALUES (?, ?, ?, ?, ?, 0)`
  ).bind(
    data.email,
    data.phone || '',
    data.otp,
    data.type || 'email',
    expiresAt
  ).run();

  return result.meta.last_row_id;
};

// 📌 GET OTP
export const getOTP = async (db, email, otp, type = 'email') => {
  return await db.prepare(
    `SELECT * FROM otps WHERE email = ? AND otp = ? AND type = ? ORDER BY createdAt DESC LIMIT 1`
  ).bind(email, otp, type).first();
};

// 📌 GET OTP BY EMAIL
export const getOTPByEmail = async (db, email) => {
  return await db.prepare(
    `SELECT * FROM otps WHERE email = ? ORDER BY createdAt DESC LIMIT 1`
  ).bind(email).first();
};

// 📌 CHECK IF OTP VALID
export const isValidOTP = async (db, email, otp, type = 'email') => {
  const otpData = await getOTP(db, email, otp, type);
  
  if (!otpData) return { valid: false, message: 'OTP not found' };
  if (otpData.verified) return { valid: false, message: 'OTP already verified' };
  if (new Date(otpData.expiresAt) < new Date()) return { valid: false, message: 'OTP expired' };
  
  return { valid: true, otpData };
};

// 📌 VERIFY OTP
export const verifyOTP = async (db, email, otp, type = 'email') => {
  const otpData = await getOTP(db, email, otp, type);
  
  if (!otpData) return { success: false, message: 'OTP not found' };
  if (otpData.verified) return { success: false, message: 'OTP already verified' };
  if (new Date(otpData.expiresAt) < new Date()) return { success: false, message: 'OTP expired' };
  
  await db.prepare(
    `UPDATE otps SET verified = 1 WHERE id = ?`
  ).bind(otpData.id).run();
  
  return { success: true };
};

// 📌 DELETE OTP
export const deleteOTP = async (db, email) => {
  const result = await db.prepare(
    `DELETE FROM otps WHERE email = ?`
  ).bind(email).run();
  
  return result.meta.changes > 0;
};
