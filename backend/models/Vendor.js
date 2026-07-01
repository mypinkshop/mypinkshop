const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  brandName: { type: String, required: true },
  storeName: { type: String, default: '' },
  storeId: { type: String, unique: true, sparse: true },
  phone: { type: String, default: '' },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },
  gstNumber: { type: String, default: '' },
  panNumber: { type: String, default: '' },
  bankDetails: {
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    accountHolderName: { type: String, default: '' }
  },
  shippingRate: { type: Number, default: 49 },
  expressRate: { type: Number, default: 99 },
  freeShippingThreshold: { type: Number, default: 999 },
  processingTime: { type: String, default: '1-2 days' },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'suspended', 'blocked'], 
    default: 'pending' 
  },
  vendorStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'suspended'], 
    default: 'pending' 
  },
  permissions: { 
    type: [String], 
    default: ['manage_products', 'view_orders', 'manage_inventory', 'view_analytics'] 
  },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  lastLogin: { type: Date },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: '' },
  resetPasswordToken: { type: String, default: '' },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

vendorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

vendorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

vendorSchema.pre('save', function(next) {
  if (!this.storeId) {
    this.storeId = `STORE_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  this.updatedAt = new Date();
  next();
});

const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);
module.exports = Vendor;
