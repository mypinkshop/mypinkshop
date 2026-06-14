const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // ============ VENDOR INFO (FIXED: Optional for Amazon Import) ============
  vendorId: {
    type: String,
    default: 'admin',
  },
  vendorName: {
    type: String,
    default: 'MyPinkShop',
  },

  // ============ BASIC PRODUCT INFO ============
  name: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: String,
    default: '',
    trim: true,
  },
  
  // ============ CATEGORIES (FIXED: Not Required) ============
  mainCategory: {
    type: String,
    default: 'Other',
  },
  subCategory: {
    type: String,
    default: '',
  },
  categorySlug: {
    type: String,
    default: '',
  },

  // ============ PRICING ============
  price: {
    type: Number,
    required: true,
  },
  originalPrice: {
    type: Number,
    default: 0,
  },
  discountPercent: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 5,
  },

  // ============ STOCK & INVENTORY ============
  stock: {
    type: Number,
    default: 0,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  weight: {
    type: String,
    default: '',
  },
  dimensions: {
    type: String,
    default: '',
  },

  // ============ AMAZON STYLE DESCRIPTION ============
  aboutThisItem: [{
    type: String,
    trim: true,
  }],
  productHighlights: [{
    type: String,
    trim: true,
  }],
  
  // ============ SPECIFICATIONS TABLE ============
  productDetails: {
    type: Map,
    of: String,
    default: {},
  },

  // ============ IMAGES ============
  images: [{
    type: String,
  }],
  mainImage: {
    type: String,
    default: '',
  },
  imageAltText: [{
    type: String,
  }],

  // ============ VARIATIONS ============
  variations: [{
    name: {
      type: String,
      default: '',
    },
    secondaryName: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
    sku: {
      type: String,
      default: '',
    },
    images: [{
      type: String,
    }],
  }],
  hasVariations: {
    type: Boolean,
    default: false,
  },

  // ============ SKINCARE (FIXED: No Enum) ============
  skinType: {
    type: String,
    default: 'all',
  },
  concerns: [{
    type: String,
  }],
  ingredients: {
    type: String,
    default: '',
  },
  
  // ============ MAKEUP (FIXED: No Enum) ============
  finish: {
    type: String,
    default: '',
  },
  coverage: {
    type: String,
    default: '',
  },
  shade: {
    type: String,
    default: '',
  },
  
  // ============ HAIR (FIXED: No Enum) ============
  hairType: {
    type: String,
    default: 'all',
  },
  hairConcerns: [{
    type: String,
  }],
  
  // ============ CLOTHING (FIXED: No Enum) ============
  fabric: {
    type: String,
    default: '',
  },
  material: {
    type: String,
    default: '',
  },
  gender: {
    type: String,
    default: 'unisex',
  },

  // ============ BADGES & LABELS ============
  emoji: {
    type: String,
    default: '🛍️',
  },
  badge: {
    type: String,
    default: '',
  },
  isBestSeller: {
    type: Boolean,
    default: false,
  },
  isAmazonChoice: {
    type: Boolean,
    default: false,
  },
  isNew: {
    type: Boolean,
    default: false,
  },

  // ============ RATINGS & REVIEWS ============
  rating: {
    type: Number,
    default: 4.0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  answeredQuestions: {
    type: Number,
    default: 0,
  },

  // ============ SEO OPTIMIZATION ============
  slug: {
    type: String,
    unique: true,
    sparse: true,
  },
  metaTitle: {
    type: String,
    default: '',
  },
  metaDescription: {
    type: String,
    default: '',
  },
  metaKeywords: [{
    type: String,
  }],
  schemaMarkup: {
    type: Object,
    default: {},
  },

  // ============ STATUS & VISIBILITY ============
  status: {
    type: String,
    default: 'active',
  },
  featured: {
    type: Boolean,
    default: false,
  },
  adminApproved: {
    type: Boolean,
    default: true,
  },

  // ============ ANALYTICS ============
  views: {
    type: Number,
    default: 0,
  },
  sales: {
    type: Number,
    default: 0,
  },

  // ============ TIMESTAMPS ============
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ============ PRE-SAVE MIDDLEWARE ============
productSchema.pre('save', function(next) {
  // Generate slug from name
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }
  
  // Calculate discount percentage
  if (this.originalPrice && this.originalPrice > this.price) {
    this.discountPercent = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  } else {
    this.discountPercent = 0;
  }
  
  // Check if product has variations
  this.hasVariations = this.variations && this.variations.length > 0;
  
  // Generate category slug
  if (this.mainCategory) {
    this.categorySlug = this.mainCategory.toLowerCase().replace(/\s+/g, '-');
  }
  
  // Generate meta title if not provided
  if (!this.metaTitle && this.name) {
    this.metaTitle = `${this.name}${this.brand ? ` - ${this.brand}` : ''} | MyPinkShop`;
  }
  
  // Generate meta description if not provided
  if (!this.metaDescription && this.aboutThisItem && this.aboutThisItem.length > 0) {
    this.metaDescription = this.aboutThisItem[0].substring(0, 155);
  }
  
  // Generate schema markup for SEO
  this.schemaMarkup = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": this.name,
    "image": this.images && this.images.length > 0 ? this.images[0] : "",
    "description": this.aboutThisItem && this.aboutThisItem.length > 0 ? this.aboutThisItem[0] : "",
    "brand": {
      "@type": "Brand",
      "name": this.brand || "MyPinkShop"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": this.price,
      "availability": this.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": this.rating,
      "reviewCount": this.reviewCount
    }
  };
  
  this.updatedAt = Date.now();
  next();
});

// ============ UPDATE HOOK ============
productSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// ============ VIRTUAL FIELDS ============
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

productSchema.virtual('discountedPrice').get(function() {
  return this.originalPrice - this.price;
});

productSchema.virtual('formattedPrice').get(function() {
  return `₹${this.price.toLocaleString('en-IN')}`;
});

// ============ INDEXES FOR BETTER PERFORMANCE ============
productSchema.index({ slug: 1 });
productSchema.index({ mainCategory: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ brand: 1 });
productSchema.index({ name: 'text', brand: 'text' });

// ============ STATIC METHODS ============
productSchema.statics.findByCategory = function(category, limit = 20) {
  return this.find({ mainCategory: category, status: 'active' })
    .sort({ createdAt: -1 })
    .limit(limit);
};

productSchema.statics.findBestSellers = function(limit = 10) {
  return this.find({ isBestSeller: true, status: 'active' })
    .sort({ sales: -1 })
    .limit(limit);
};

productSchema.statics.searchProducts = function(query) {
  return this.find(
    { $text: { $search: query }, status: 'active' },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Product', productSchema);
