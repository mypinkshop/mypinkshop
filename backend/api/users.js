const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Import existing models
const User = require('../models/User');

// Address Schema - Create if not exists
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
  createdAt: { type: Date, default: Date.now }
});

const Address = mongoose.models.Address || mongoose.model('Address', addressSchema);

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
    const { name, email, phone } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    
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
    const { fullName, phone, pincode, addressLine1, addressLine2, city, state, isDefault } = req.body;
    
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
      isDefault: isDefault || false
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
    
    const { fullName, phone, pincode, addressLine1, addressLine2, city, state, isDefault } = req.body;
    
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

// Send verification email (placeholder)
router.post('/send-verification-email', authMiddleware, async (req, res) => {
  res.json({ success: true, message: 'Verification email sent' });
});

// Send phone OTP (placeholder)
router.post('/send-phone-otp', authMiddleware, async (req, res) => {
  res.json({ success: true, message: 'OTP sent' });
});

module.exports = router;
