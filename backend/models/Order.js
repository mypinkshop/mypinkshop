const mongoose = require('mongoose');

// ✅ Nykaa Style Order ID Generator
const generateOrderId = () => {
  const prefix = 'MPS';
  const part1 = Math.floor(Math.random() * 900000000 + 100000000).toString();
  const part2 = Math.floor(Math.random() * 9000000 + 1000000).toString();
  const part3 = Math.floor(Math.random() * 9 + 1).toString();
  return `${prefix}-${part1}-${part2}-${part3}`;
};

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
  // ✅ Nykaa Style Order ID
  orderId: { 
    type: String, 
    required: true, 
    unique: true,
    default: generateOrderId
  },
  
  // ✅ Backward compatibility ke liye
  orderNumber: { 
    type: String, 
    unique: true,
    sparse: true
  },
  
  buyerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
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

// ✅ Indexes
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ orderNumber: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
