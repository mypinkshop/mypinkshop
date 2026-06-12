const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Import existing models
const User = require('../models/User');

// Address Schema
const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  pincode: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: '' },
  city: { type: String, required: true },
  state: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  addressType: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  createdAt: { type: Date, default: Date.now }
});

// ✅ Card Schema - NEW
const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  last4: { type: String, required: true },
  cardType: { type: String, enum: ['visa', 'mastercard', 'rupay', 'amex'], default: 'visa' },
  expiryMonth: { type: String, required: true },
  expiryYear: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// ✅ Login History Schema - NEW
const loginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ip: { type: String, default: '' },
  device: { type: String, default: '' },
  browser: { type: String, default: '' },
  location: { type: String, default: '' },
  time: { type: Date, default: Date.now }
});

const Address = mongoose.models.Address || mongoose.model('Address', addressSchema);
const Card = mongoose.models.Card || mongoose.model('Card', cardSchema);
const LoginHistory = mongoose.models.LoginHistory || mongoose.model('LoginHistory', loginHistorySchema);

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ========== PROFILE ROUTES ==========

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, gender, dob, profileImage } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (gender !== undefined) updates.gender = gender;
    if (dob !== undefined) updates.dob = dob;
    if (profileImage !== undefined) updates.profileImage = profileImage;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ADDRESS ROUTES ==========

// Get all addresses
router.get('/addresses', authMiddleware, async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ addresses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add address
router.post('/addresses', authMiddleware, async (req, res) => {
  try {
    const { fullName, phone, pincode, addressLine1, addressLine2, city, state, isDefault, addressType } = req.body;
    
    if (isDefault) {
      await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    }
    
    const address = new Address({
      userId: req.user.id,
      fullName,
      phone,
      pincode,
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      state,
      isDefault: isDefault || false,
      addressType: addressType || 'home'
    });
    
    await address.save();
    res.status(201).json({ success: true, address });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update address
router.put('/addresses/:id', authMiddleware, async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, userId: req.user.id });
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    const { fullName, phone, pincode, addressLine1, addressLine2, city, state, isDefault, addressType } = req.body;
    
    if (isDefault) {
      await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    }
    
    address.fullName = fullName || address.fullName;
    address.phone = phone || address.phone;
    address.pincode = pincode || address.pincode;
    address.addressLine1 = addressLine1 || address.addressLine1;
    address.addressLine2 = addressLine2 !== undefined ? addressLine2 : address.addressLine2;
    address.city = city || address.city;
    address.state = state || address.state;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;
    address.addressType = addressType || address.addressType;
    
    await address.save();
    res.json({ success: true, address });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete address
router.delete('/addresses/:id', authMiddleware, async (req, res) => {
  try {
    await Address.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set default address
router.patch('/addresses/:id/default', authMiddleware, async (req, res) => {
  try {
    await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    await Address.updateOne({ _id: req.params.id, userId: req.user.id }, { isDefault: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CARDS ROUTES (NEW) ==========

// Get all cards
router.get('/cards', authMiddleware, async (req, res) => {
  try {
    const cards = await Card.find({ userId: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ cards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add card
router.post('/cards', authMiddleware, async (req, res) => {
  try {
    const { last4, cardType, expiryMonth, expiryYear, isDefault } = req.body;
    
    if (isDefault) {
      await Card.updateMany({ userId: req.user.id }, { isDefault: false });
    }
    
    const card = new Card({
      userId: req.user.id,
      last4,
      cardType: cardType || 'visa',
      expiryMonth,
      expiryYear,
      isDefault: isDefault || false
    });
    
    await card.save();
    res.status(201).json({ success: true, card });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete card
router.delete('/cards/:id', authMiddleware, async (req, res) => {
  try {
    await Card.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set default card
router.patch('/cards/:id/default', authMiddleware, async (req, res) => {
  try {
    await Card.updateMany({ userId: req.user.id }, { isDefault: false });
    await Card.updateOne({ _id: req.params.id, userId: req.user.id }, { isDefault: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== LOGIN HISTORY ROUTES (NEW) ==========

// Get login history
router.get('/login-history', authMiddleware, async (req, res) => {
  try {
    const history = await LoginHistory.find({ userId: req.user.id }).sort({ time: -1 }).limit(20);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save login (call this from login endpoint)
const saveLoginHistory = async (userId, ip, userAgent) => {
  try {
    // Parse user agent to get device and browser
    let device = 'Unknown';
    let browser = 'Unknown';
    
    if (userAgent) {
      if (userAgent.includes('Mobile')) device = 'Mobile';
      else if (userAgent.includes('Tablet')) device = 'Tablet';
      else device = 'Desktop';
      
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
    }
    
    const history = new LoginHistory({
      userId,
      ip: ip || '',
      device,
      browser,
      time: new Date()
    });
    
    await history.save();
  } catch (error) {
    console.error('Save login history error:', error);
  }
};

// Send verification email (placeholder)
router.post('/send-verification-email', authMiddleware, async (req, res) => {
  res.json({ success: true, message: 'Verification email sent' });
});

// Send phone OTP (placeholder)
router.post('/send-phone-otp', authMiddleware, async (req, res) => {
  res.json({ success: true, message: 'OTP sent' });
});

// Delete account
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    await Address.deleteMany({ userId: req.user.id });
    await Card.deleteMany({ userId: req.user.id });
    await LoginHistory.deleteMany({ userId: req.user.id });
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
