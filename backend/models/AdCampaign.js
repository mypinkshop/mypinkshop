const mongoose = require('mongoose');

const adCampaignSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['product', 'banner'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'paused', 'completed', 'rejected', 'ended'],
    default: 'pending'
  },
  budget: {
    type: Number,
    required: true,
    min: 100
  },
  dailyBudget: {
    type: Number,
    required: true,
    min: 10
  },
  spent: {
    type: Number,
    default: 0
  },
  bidType: {
    type: String,
    enum: ['cpc', 'cpm'],
    default: 'cpc'
  },
  bidAmount: {
    type: Number,
    required: true,
    min: 1
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  targeting: {
    categories: [{
      type: String,
      trim: true
    }],
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    location: {
      type: String,
      default: 'All India'
    },
    device: [{
      type: String,
      enum: ['mobile', 'desktop', 'tablet', 'all'],
      default: 'all'
    }],
    gender: {
      type: String,
      enum: ['all', 'male', 'female', 'other'],
      default: 'all'
    },
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 65 }
    }
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    index: true
  },
  banner: {
    imageUrl: { type: String, default: '' },
    linkUrl: { type: String, default: '' },
    ctaText: { type: String, default: 'Shop Now' },
    position: {
      type: String,
      enum: ['homepage_top', 'homepage_middle', 'category_page', 'product_page', 'sidebar'],
      default: 'homepage_top'
    },
    dimensions: {
      width: { type: Number, default: 1200 },
      height: { type: Number, default: 400 }
    },
    mobileImage: { type: String, default: '' }
  },
  impressions: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  conversions: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  dailyStats: [{
    date: {
      type: Date,
      default: Date.now
    },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  }],
  adminApproved: {
    type: Boolean,
    default: false
  },
  adminRemarks: {
    type: String,
    default: ''
  },
  rejectedReason: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  pausedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

adCampaignSchema.index({ vendorId: 1, status: 1 });
adCampaignSchema.index({ startDate: 1, endDate: 1 });
adCampaignSchema.index({ type: 1, status: 1 });
adCampaignSchema.index({ 'targeting.categories': 1 });

adCampaignSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         this.startDate <= now && 
         this.endDate >= now &&
         this.spent < this.budget;
};

adCampaignSchema.methods.hasBudgetRemaining = function() {
  return this.spent < this.budget;
};

adCampaignSchema.methods.getRemainingBudget = function() {
  return this.budget - this.spent;
};

adCampaignSchema.methods.getDailySpend = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayStat = this.dailyStats.find(
    stat => new Date(stat.date).setHours(0, 0, 0, 0) === today.getTime()
  );
  
  return todayStat ? todayStat.spend : 0;
};

adCampaignSchema.methods.isDailyBudgetExceeded = function() {
  return this.getDailySpend() >= this.dailyBudget;
};

adCampaignSchema.methods.recordImpression = async function() {
  this.impressions += 1;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let todayStat = this.dailyStats.find(
    stat => new Date(stat.date).setHours(0, 0, 0, 0) === today.getTime()
  );
  
  if (!todayStat) {
    this.dailyStats.push({
      date: today,
      impressions: 1,
      clicks: 0,
      spend: 0,
      conversions: 0,
      revenue: 0
    });
  } else {
    todayStat.impressions += 1;
  }
  
  return await this.save();
};

adCampaignSchema.methods.recordClick = async function() {
  this.clicks += 1;
  
  if (this.bidType === 'cpc') {
    this.spent += this.bidAmount;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let todayStat = this.dailyStats.find(
    stat => new Date(stat.date).setHours(0, 0, 0, 0) === today.getTime()
  );
  
  if (!todayStat) {
    this.dailyStats.push({
      date: today,
      impressions: 0,
      clicks: 1,
      spend: this.bidType === 'cpc' ? this.bidAmount : 0,
      conversions: 0,
      revenue: 0
    });
  } else {
    todayStat.clicks += 1;
    if (this.bidType === 'cpc') {
      todayStat.spend += this.bidAmount;
    }
  }
  
  if (this.spent >= this.budget) {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  return await this.save();
};

adCampaignSchema.methods.recordConversion = async function(revenue = 0) {
  this.conversions += 1;
  this.revenue += revenue;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let todayStat = this.dailyStats.find(
    stat => new Date(stat.date).setHours(0, 0, 0, 0) === today.getTime()
  );
  
  if (todayStat) {
    todayStat.conversions += 1;
    todayStat.revenue += revenue;
  }
  
  return await this.save();
};

adCampaignSchema.statics.getActiveForPlacement = async function(type, category = null, limit = 10) {
  const now = new Date();
  const query = {
    type: type,
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
    adminApproved: true,
    $expr: { $lt: ['$spent', '$budget'] }
  };
  
  if (category) {
    query['targeting.categories'] = { $in: [category] };
  }
  
  return await this.find(query)
    .sort({ bidAmount: -1 })
    .limit(limit)
    .populate('productId', 'name price images brand');
};

const AdCampaign = mongoose.models.AdCampaign || mongoose.model('AdCampaign', adCampaignSchema);
module.exports = AdCampaign;
