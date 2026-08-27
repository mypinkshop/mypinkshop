const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
  variationName: { type: String },
  variationSecondary: { type: String },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  
  // ✅ buyerId ABHI BHI REQUIRED HAI!
  buyerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // ✅ Lekin userId bhi add kar diya hai (optional)
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },

  buyerName: { type: String, default: 'Customer' },
  buyerEmail: { type: String },
  buyerPhone: { type: String },
  buyerAddress: { type: mongoose.Schema.Types.Mixed, default: {} },
  
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
  vendorName: { type: String, default: 'Vendor' },
  
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String },
  
  quantity: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  total: { type: Number, required: true },
  
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  
  paymentMethod: { type: String, default: 'cod' },
  paymentStatus: { type: String, default: 'pending' },
  
  orderDate: { type: Date, default: Date.now },
  
  items: [orderItemSchema],
  
  cancelledAt: { type: Date },
  deliveredAt: { type: Date },
  
  shipping: {
    awb: { type: String },
    carrier: { type: String }
  }
}, { 
  timestamps: true,
  suppressReservedKeysWarning: true 
});

// Sirf ek hi baar index banane ke liye:
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
