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
  
  // ⚠️ Yahan 'index: true' hata diya hai duplicate warning ke liye
  buyerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
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
  
  // ⚠️ 'isNew' naam ki property hata di hai kyunki yeh Mongoose reserved word hai
  cancelledAt: { type: Date },
  deliveredAt: { type: Date },
  
  shipping: {
    awb: { type: String },
    carrier: { type: String }
  }
}, { 
  timestamps: true,
  // Agar isko disable karna hai warning ke liye:
  suppressReservedKeysWarning: true 
});

// Sirf ek hi baar index banane ke liye:
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
