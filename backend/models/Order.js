// backend/models/Order.js

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // ========== ORDER IDENTIFICATION ==========
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  
  // ========== BUYER DETAILS ==========
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  buyerName: {
    type: String,
    required: true,
  },
  buyerEmail: {
    type: String,
    required: true,
  },
  buyerPhone: {
    type: String,
    required: true,
  },
  
  // ========== BUYER ADDRESS ==========
  buyerAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, index: true },
    country: { type: String, default: 'India' },
    landmark: { type: String, default: '' }
  },
  
  // ========== VENDOR DETAILS ==========
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  vendorName: {
    type: String,
    required: true,
  },
  vendorPincode: {
    type: String,
    required: true,
    index: true,
  },
  
  // ========== PRODUCT DETAILS ==========
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  productImage: {
    type: String,
    default: '',
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  
  // ========== PRICING BREAKDOWN ==========
  subtotal: {
    type: Number,
    required: true,
  },
  shippingCharge: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  commission: {
    type: Number,
    default: 0,
  },
  vendorEarning: {
    type: Number,
    default: 0,
  },
  
  // ========== ORDER STATUS ==========
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
    index: true,
  },
  statusHistory: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // ========== PAYMENT ==========
  paymentMethod: {
    type: String,
    enum: ['cod', 'card', 'upi', 'wallet', 'bank_transfer'],
    default: 'cod',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentId: {
    type: String,
    default: '',
  },
  razorpayOrderId: {
    type: String,
    default: '',
  },
  
  // ========== SHIPPING (Shiprocket Integration) ==========
  shipping: {
    // Shiprocket fields
    shiprocketOrderId: { type: String, default: '' },
    awb: { type: String, default: '', index: true },
    courier: { type: String, default: '' },
    courierName: { type: String, default: '' },
    labelUrl: { type: String, default: '' },
    
    // Tracking
    trackingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    trackingHistory: [{
      status: { type: String },
      location: { type: String, default: '' },
      date: { type: Date, default: Date.now },
      description: { type: String, default: '' }
    }],
    
    // Shipping details
    shippingCharges: { type: Number, default: 0 },
    shippingType: { type: String, enum: ['standard', 'express'], default: 'standard' },
    estimatedDelivery: {
      minDate: { type: Date },
      maxDate: { type: Date },
      minDays: { type: Number, default: 3 },
      maxDays: { type: Number, default: 7 }
    },
    
    // Pickup/Delivery pincodes
    pickupPincode: { type: String, default: '' },
    deliveryPincode: { type: String, default: '' },
    
    // Weight & Dimensions
    weight: { type: Number, default: 0.5 },
    dimensions: {
      length: { type: Number, default: 20 },
      breadth: { type: Number, default: 15 },
      height: { type: Number, default: 10 }
    }
  },
  
  // ========== TIMESTAMPS ==========
  orderDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
  confirmedAt: {
    type: Date,
  },
  shippedAt: {
    type: Date,
  },
  deliveredAt: {
    type: Date,
  },
  cancelledAt: {
    type: Date,
  },
  
  // ========== NOTES ==========
  buyerNote: {
    type: String,
    default: '',
  },
  adminNote: {
    type: String,
    default: '',
  },
  
  // ========== REVIEW ==========
  reviewed: {
    type: Boolean,
    default: false,
  },
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
  },
  
  // ========== REMINDERS ==========
  reviewReminderSent: {
    type: Boolean,
    default: false,
  },
  reviewReminderSentAt: {
    type: Date,
  },
  
}, {
  timestamps: true,
});

// ========== INDEXES FOR PERFORMANCE ==========
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ vendorId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'shipping.awb': 1 });
orderSchema.index({ 'shipping.shiprocketOrderId': 1 });
orderSchema.index({ buyerAddress: '2dsphere' });

// ========== VIRTUAL FIELDS ==========
orderSchema.virtual('isDelivered').get(function() {
  return this.status === 'delivered';
});

orderSchema.virtual('isCancelled').get(function() {
  return this.status === 'cancelled';
});

orderSchema.virtual('canReview').get(function() {
  return this.status === 'delivered' && !this.reviewed;
});

// ========== INSTANCE METHODS ==========

// Update order status with history
orderSchema.methods.updateStatus = function(newStatus, userId, note = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note: note,
    updatedBy: userId
  });
  
  // Set specific timestamps
  if (newStatus === 'confirmed') this.confirmedAt = new Date();
  if (newStatus === 'shipped') this.shippedAt = new Date();
  if (newStatus === 'delivered') this.deliveredAt = new Date();
  if (newStatus === 'cancelled') this.cancelledAt = new Date();
  
  return this.save();
};

// Update shipping tracking
orderSchema.methods.updateTracking = function(trackingData) {
  this.shipping.trackingStatus = trackingData.status || this.shipping.trackingStatus;
  
  if (trackingData.history && trackingData.history.length > 0) {
    this.shipping.trackingHistory = [
      ...this.shipping.trackingHistory,
      ...trackingData.history.map(h => ({
        status: h.status,
        location: h.location || '',
        date: h.date || new Date(),
        description: h.description || ''
      }))
    ];
  }
  
  if (trackingData.awb) this.shipping.awb = trackingData.awb;
  if (trackingData.courier) this.shipping.courier = trackingData.courier;
  
  return this.save();
};

// ========== STATIC METHODS ==========

// Get order statistics for vendor
orderSchema.statics.getVendorStats = async function(vendorId) {
  return this.aggregate([
    { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        totalCommission: { $sum: '$commission' }
      }
    }
  ]);
};

// Get monthly sales
orderSchema.statics.getMonthlySales = async function(vendorId, year) {
  return this.aggregate([
    { 
      $match: { 
        vendorId: new mongoose.Types.ObjectId(vendorId),
        year: { $year: '$orderDate' },
        status: { $in: ['delivered', 'shipped'] }
      } 
    },
    {
      $group: {
        _id: { month: { $month: '$orderDate' } },
        total: { $sum: '$total' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.month': 1 } }
  ]);
};

// ========== MIDDLEWARE ==========

// Auto-generate order number before save
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const prefix = 'MPS';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `${prefix}${timestamp}${random}`;
  }
  next();
});

// Calculate totals before save
orderSchema.pre('save', function(next) {
  this.total = (this.subtotal || 0) + (this.shippingCharge || 0) + (this.tax || 0) - (this.discount || 0);
  this.vendorEarning = (this.subtotal || 0) - (this.commission || 0);
  next();
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

module.exports = Order;
