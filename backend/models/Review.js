const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    default: '',
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  // ✅ COMMENT - OPTIONAL now (Rating only reviews ke liye)
  comment: {
    type: String,
    default: '',
    trim: true,
    maxlength: [2000, 'Comment cannot exceed 2000 characters']
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 10;
      },
      message: 'Maximum 10 images allowed'
    }
  },
  videos: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 5;
      },
      message: 'Maximum 5 videos allowed'
    }
  },
  // ✅ STATUS - Rating only auto-approved
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected', 'spam'],
      message: 'Invalid status'
    },
    default: 'pending',
    index: true
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  // ✅ NEW: Rating only flag
  isRatingOnly: {
    type: Boolean,
    default: false,
    index: true
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
  },
  rejectedAt: {
    type: Date
  },
  // Extra fields for e-commerce
  isRecommended: {
    type: Boolean,
    default: null
  },
  reviewSummary: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// ✅ Indexes for performance
reviewSchema.index({ productId: 1, status: 1, helpful: -1 });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ productId: 1, isRatingOnly: 1, status: 1 });

// ✅ Calculate average rating for a product
reviewSchema.statics.getAverageRating = async function(productId) {
  const result = await this.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  
  return {
    rating: result[0]?.avgRating || 0,
    count: result[0]?.count || 0
  };
};

// ✅ Get rating distribution for a product
reviewSchema.statics.getRatingDistribution = async function(productId) {
  const result = await this.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } }
  ]);
  
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  result.forEach(item => {
    distribution[item._id] = item.count;
  });
  return distribution;
};

// ✅ Get rating counts for a product
reviewSchema.statics.getRatingCounts = async function(productId) {
  const result = await this.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    { $group: { _id: '$rating', count: { $sum: 1 } } }
  ]);
  
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  result.forEach(item => {
    counts[item._id] = item.count;
  });
  return counts;
};

// ✅ Get review stats (with rating only count)
reviewSchema.statics.getReviewStats = async function(productId) {
  const [avgResult, counts, ratingOnlyCount, commentCount] = await Promise.all([
    this.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]),
    this.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } }
    ]),
    this.countDocuments({ productId, status: 'approved', isRatingOnly: true }),
    this.countDocuments({ 
      productId, 
      status: 'approved', 
      isRatingOnly: false,
      comment: { $ne: '' } 
    })
  ]);
  
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  counts.forEach(item => {
    distribution[item._id] = item.count;
  });
  
  return {
    averageRating: avgResult[0]?.avgRating || 0,
    totalReviews: avgResult[0]?.count || 0,
    ratingDistribution: distribution,
    ratingOnlyCount,
    reviewWithCommentCount: commentCount
  };
};

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
module.exports = Review;
