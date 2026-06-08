const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    default: '',
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  images: {
    type: [String],
    default: []
  },
  videos: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'spam'],
    default: 'pending'
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  helpful: {
    type: Number,
    default: 0
  },
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  adminNote: {
    type: String,
    default: ''
  },
  reviewedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
reviewSchema.index({ productId: 1, status: 1 });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Calculate average rating for a product
reviewSchema.statics.getAverageRating = async function(productId) {
  const result = await this.aggregate([
    { $match: { productId: mongoose.Types.ObjectId(productId), status: 'approved' } },
    { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  
  return {
    rating: result[0]?.avgRating || 0,
    count: result[0]?.count || 0
  };
};

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

module.exports = Review;
