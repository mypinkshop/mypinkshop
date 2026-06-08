const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  phone: { type: String, default: '' },
  otp: { type: String, required: true },
  type: { type: String, enum: ['email', 'phone', 'both'], default: 'email' },
  expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 10 * 60 * 1000) }, // 10 minutes
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Auto delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.models.OTP || mongoose.model('OTP', otpSchema);

module.exports = OTP;
