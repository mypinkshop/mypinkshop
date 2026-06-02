const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  type: { type: String, enum: ['top_banner', 'popup', 'coupon'], default: 'top_banner' },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  discountValue: { type: Number, default: 10 },
  minOrderValue: { type: Number, default: 999 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Offer', offerSchema);
