const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const cheerio = require('cheerio');
const multer = require('multer');
const AWS = require('aws-sdk');
const otpRoutes = require('./otp');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const orderRoutes = require('./orders');
const reviewRoutes = require('./reviews');
const notificationRoutes = require('../routes/notificationRoutes');
const app = express();

// ========== CORS FIX ==========
const corsOptions = {
  origin: [
    'https://www.mypinkshop.com',
    'https://mypinkshop.com',
    'http://localhost:3000',
    'http://localhost:8081',
    'https://mypinkshop-backend-62p5dbqg0-mypinkshops-projects.vercel.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Additional CORS headers for preflight
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://www.mypinkshop.com',
    'https://mypinkshop.com',
    'http://localhost:3000',
    'http://localhost:8081'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ========== Cloudflare R2 Configuration ==========
const s3 = new AWS.S3({
  endpoint: `http://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'auto',
  s3ForcePathStyle: true,
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

// ========== Multer ==========
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// ========== MongoDB Connection ==========
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return;
    }
    
    const opts = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true
    };
    
    await mongoose.connect(process.env.MONGO_URI, opts);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
  }
};

connectDB();

mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected, attempting to reconnect...');
  setTimeout(connectDB, 5000);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

const ensureDB = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (error) {
    next();
  }
};

app.use('/api', ensureDB);

// ========== Shiprocket Service ==========
class ShiprocketService {
  constructor() {
    this.baseURL = 'https://apiv2.shiprocket.in/v1/external';
    this.token = null;
    this.tokenExpiry = null;
  }

  async getAuthToken() {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD
      });
      this.token = response.data.token;
      this.tokenExpiry = Date.now() + 3600000;
      console.log('✅ Shiprocket Auth Token Obtained');
      return this.token;
    } catch (error) {
      console.error('❌ Shiprocket Auth Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async checkServiceability(pickupPincode, deliveryPincode, weight = 0.5) {
    try {
      if (!this.token || Date.now() > this.tokenExpiry) {
        await this.getAuthToken();
      }
      const response = await axios.get(`${this.baseURL}/courier/serviceability`, {
        params: { pickup_postcode: pickupPincode, delivery_postcode: deliveryPincode, weight: weight },
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Serviceability Error:', error.response?.data || error.message);
      return { success: false, data: [] };
    }
  }

  async getEstimatedDelivery(pickupPincode, deliveryPincode, weight = 0.5) {
    try {
      const serviceability = await this.checkServiceability(pickupPincode, deliveryPincode, weight);
      if (serviceability && serviceability.data && serviceability.data.length > 0) {
        const sorted = serviceability.data.sort((a, b) => a.estimated_days - b.estimated_days);
        const best = sorted[0];
        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + best.estimated_days);
        return {
          success: true, deliverable: true, shippingCharge: best.rate,
          estimatedDays: best.estimated_days,
          estimatedDate: estimatedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          courierName: best.courier_name
        };
      }
      return { success: false, deliverable: false, message: 'No courier available' };
    } catch (error) {
      return { success: false, deliverable: false, error: error.message };
    }
  }
}

const shiprocket = new ShiprocketService();

// ============================================
// ✅ VENDOR SCHEMA - ADD THIS
// ============================================
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

// Hash password before saving
vendorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password method
vendorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate storeId
vendorSchema.pre('save', function(next) {
  if (!this.storeId) {
    this.storeId = `STORE_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  this.updatedAt = new Date();
  next();
});

const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);

// ========== SCHEMAS ==========

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, default: '' },
  category: { type: String, required: true },
  mainCategory: { type: String, default: '' },
  subCategory: { type: String, default: '' },
  subcategory: { type: String, default: '' },
  price: { type: Number, required: true },
  originalPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  images: { type: [String], default: [] },
  description: { type: mongoose.Schema.Types.Mixed, default: '' },
  shortDescription: { type: String, default: '' },
  keyFeatures: { type: [String], default: [] },
  rating: { type: Number, default: 4.0 },
  badge: { type: String, default: '' },
  isNew: { type: Boolean, default: false },
  status: { type: String, default: 'active' },
  adminApproved: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  sizes: { type: [String], default: [] },
  colors: { type: [String], default: [] },
  variants: { type: Array, default: [] },
  variations: { type: Array, default: [] },
  fabric: { type: String, default: '' },
  material: { type: String, default: '' },
  gender: { type: String, default: 'unisex' },
  weight: { type: String, default: '' },
  dimensions: { type: String, default: '' },
  ingredients: { type: String, default: '' },
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  metaKeywords: { type: String, default: '' },
  slug: { type: String, default: '' },
  reviewCount: { type: Number, default: 0 },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['buyer', 'vendor', 'admin'], default: 'buyer' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: '' },
  emailVerificationExpires: { type: Date },
  resetPasswordToken: { type: String, default: '' },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Address Schema
const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: '' },
  landmark: { type: String, default: '' },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' },
  type: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Address = mongoose.models.Address || mongoose.model('Address', addressSchema);

// Banner Schema
const bannerSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  buttonText: { type: String, default: '' },
  link: { type: String, default: '/shop' },
  images: { type: [String], default: [] },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  showTextOverlay: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);

// Offer Schema
const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  type: { type: String, default: 'top_banner' },
  discountType: { type: String, default: 'percentage' },
  discountValue: { type: Number, default: 10 },
  minOrderValue: { type: Number, default: 499 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Offer = mongoose.models.Offer || mongoose.model('Offer', offerSchema);

// Coupon Schema
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  description: { type: String, default: '' },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  discountValue: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 },
  usageLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

// Review Schema
const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: '', trim: true, maxlength: 100 },
  comment: { type: String, required: true, trim: true, maxlength: 2000 },
  images: { type: [String], default: [] },
  videos: { type: [String], default: [] },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'spam'], default: 'pending' },
  isVerifiedPurchase: { type: Boolean, default: false },
  helpful: { type: Number, default: 0 },
  helpfulUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  adminNote: { type: String, default: '' },
  reviewedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date }
}, { timestamps: true });

reviewSchema.index({ productId: 1, status: 1 });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

reviewSchema.statics.getAverageRating = async function(productId) {
  const result = await this.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  return { rating: result[0]?.avgRating || 0, count: result[0]?.count || 0 };
};

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

// Order Schema
const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  price: Number,
  quantity: Number,
  image: String,
  variationName: String,
  variationSecondary: String
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  total: Number,
  status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  address: Object,
  createdAt: { type: Date, default: Date.now },
  deliveredAt: Date
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// Wishlist Schema
const wishlistItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  addedAt: { type: Date, default: Date.now }
});

const wishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [wishlistItemSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

wishlistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);

// Cart Schema
const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 1, min: 1 }
});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

// ========== AUTH MIDDLEWARE ==========
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const vendorMiddleware = (req, res, next) => {
  if (req.user?.role !== 'vendor' && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Vendor access required' });
  }
  next();
};

// ========== TEST ROUTES ==========
app.get('/', (req, res) => {
  res.json({ message: '🎀 MyPinkShop API is running!', status: 'active' });
});

app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ 
      status: 'ok', 
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({ status: 'ok', database: 'error', timestamp: new Date().toISOString() });
  }
});

app.get('/api/test-db', async (req, res) => {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    readyState: mongoose.connection.readyState,
    status: states[mongoose.connection.readyState] || 'unknown',
    mongodbUriSet: !!process.env.MONGO_URI
  });
});

// ========== UPLOAD ROUTES ==========
app.post('/api/upload', authMiddleware, upload.single('images'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = req.file.originalname.split('.').pop();
    const filename = `products/${timestamp}-${randomString}.${fileExtension}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    await s3.upload(params).promise();
    const imageUrl = `${PUBLIC_URL}/${filename}`;

    res.json({
      success: true,
      url: imageUrl,
      message: 'Image uploaded successfully to R2'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload/multiple', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedUrls = [];
    for (const file of req.files) {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.originalname.split('.').pop();
      const filename = `products/${timestamp}-${randomString}.${fileExtension}`;

      const params = {
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      await s3.upload(params).promise();
      uploadedUrls.push(`${PUBLIC_URL}/${filename}`);
    }

    res.json({
      success: true,
      urls: uploadedUrls,
      message: `${uploadedUrls.length} images uploaded successfully to R2`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/upload', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL required' });
    }

    const filename = imageUrl.split('/').pop();
    const params = {
      Bucket: BUCKET_NAME,
      Key: `products/${filename}`,
    };

    await s3.deleteObject(params).promise();
    res.json({ success: true, message: 'Image deleted successfully from R2' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reviews/upload', authMiddleware, upload.array('media', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedUrls = [];
    for (const file of req.files) {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.originalname.split('.').pop();
      const folder = file.mimetype.startsWith('image/') ? 'review-images' : 'review-videos';
      const filename = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

      const params = {
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      await s3.upload(params).promise();
      uploadedUrls.push(`${PUBLIC_URL}/${filename}`);
    }

    res.json({ success: true, urls: uploadedUrls });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== AUTH ROUTES ==========
app.post('/api/auth/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'No account found with this email.' });
    }
    
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Wrong password. Please try again.' });
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );
    
    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// ============================================
// ✅ VENDOR LOGIN API - ADD THIS
// ============================================
app.post('/api/vendor/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password, rememberMe } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find vendor by email
    const vendor = await Vendor.findOne({ email: email.toLowerCase().trim() });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'No vendor account found with this email'
      });
    }

    // Check if account is locked (after 5 failed attempts)
    if (vendor.lockUntil && vendor.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((vendor.lockUntil - new Date()) / 60000);
      return res.status(403).json({
        success: false,
        message: `Account is locked. Please try again after ${minutesLeft} minutes`
      });
    }

    // Check password
    const isMatch = await vendor.matchPassword(password);
    
    if (!isMatch) {
      // Increment login attempts
      vendor.loginAttempts = (vendor.loginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts
      if (vendor.loginAttempts >= 5) {
        vendor.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
        await vendor.save();
        return res.status(403).json({
          success: false,
          message: 'Too many failed attempts. Account locked for 30 minutes.',
          attempts: vendor.loginAttempts,
          locked: true
        });
      }
      
      await vendor.save();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
        attempts: vendor.loginAttempts,
        remainingAttempts: 5 - vendor.loginAttempts
      });
    }

    // Check if vendor is approved
    if (vendor.status === 'pending' || vendor.vendorStatus === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please wait for admin approval.',
        status: 'pending'
      });
    }

    if (vendor.status === 'rejected' || vendor.vendorStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Your vendor application has been rejected. Please contact support.',
        status: 'rejected'
      });
    }

    if (vendor.status === 'suspended' || vendor.vendorStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
        status: 'suspended'
      });
    }

    // Reset login attempts on successful login
    vendor.loginAttempts = 0;
    vendor.lockUntil = null;
    vendor.lastLogin = new Date();
    await vendor.save();

    // Generate JWT Token
    const token = jwt.sign(
      { 
        id: vendor._id, 
        email: vendor.email, 
        role: 'vendor',
        status: vendor.status,
        storeId: vendor.storeId
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_this',
      { expiresIn: rememberMe ? '30d' : '7d' }
    );

    // Response
    res.json({
      success: true,
      token: token,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        brandName: vendor.brandName,
        storeName: vendor.storeName || vendor.brandName,
        storeId: vendor.storeId,
        status: vendor.status,
        vendorStatus: vendor.vendorStatus,
        permissions: vendor.permissions || [],
        phone: vendor.phone || '',
        address: vendor.address || {},
        lastLogin: vendor.lastLogin
      }
    });

  } catch (error) {
    console.error('Vendor login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// ============================================
// ✅ VENDOR REGISTER API - ADD THIS
// ============================================
app.post('/api/vendor/register', async (req, res) => {
  try {
    await connectDB();
    const { name, email, password, brandName, phone, address, gstNumber, panNumber, bankDetails } = req.body;

    // Validation
    if (!name || !email || !password || !brandName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({ 
      $or: [
        { email: email.toLowerCase().trim() },
        { brandName: brandName.trim() }
      ]
    });

    if (existingVendor) {
      return res.status(409).json({
        success: false,
        message: existingVendor.email === email.toLowerCase().trim() 
          ? 'Vendor with this email already exists' 
          : 'Vendor with this brand name already exists'
      });
    }

    // Create new vendor
    const vendor = new Vendor({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      brandName: brandName.trim(),
      storeName: brandName.trim(),
      phone: phone || '',
      address: address || {},
      gstNumber: gstNumber || '',
      panNumber: panNumber || '',
      bankDetails: bankDetails || {},
      status: 'pending',
      vendorStatus: 'pending',
      permissions: ['manage_products', 'view_orders', 'manage_inventory', 'view_analytics']
    });

    await vendor.save();

    // Generate token for immediate login (if auto-approve enabled)
    // For now, keep pending approval
    res.status(201).json({
      success: true,
      message: 'Vendor registration successful! Please wait for admin approval.',
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        brandName: vendor.brandName,
        status: vendor.status,
        storeId: vendor.storeId
      }
    });

  } catch (error) {
    console.error('Vendor registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// ============================================
// ✅ VENDOR FORGOT PASSWORD API - ADD THIS
// ============================================
app.post('/api/vendor/forgot-password', async (req, res) => {
  try {
    await connectDB();
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    const vendor = await Vendor.findOne({ email: email.toLowerCase().trim() });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'No vendor found with this email'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: vendor._id, email: vendor.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_this',
      { expiresIn: '1h' }
    );

    // Save reset token to database
    vendor.resetPasswordToken = resetToken;
    vendor.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await vendor.save();

    // Send email (you can implement email sending)
    // For now, just return success
    res.json({
      success: true,
      message: 'Password reset link sent to your email',
      resetToken: resetToken // Remove this in production
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// ============================================
// ✅ VENDOR RESET PASSWORD API - ADD THIS
// ============================================
app.post('/api/vendor/reset-password', async (req, res) => {
  try {
    await connectDB();
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token and new password'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_this');
    
    const vendor = await Vendor.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!vendor) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    vendor.password = newPassword;
    vendor.resetPasswordToken = '';
    vendor.resetPasswordExpires = null;
    await vendor.save();

    res.json({
      success: true,
      message: 'Password reset successful!'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }
});

// ============================================
// ✅ VENDOR GET PROFILE API - ADD THIS
// ============================================
app.get('/api/vendor/profile', authMiddleware, vendorMiddleware, async (req, res) => {
  try {
    await connectDB();
    
    const vendor = await Vendor.findById(req.user.id).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      vendor: vendor
    });

  } catch (error) {
    console.error('Get vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ============================================
// ✅ VENDOR UPDATE PROFILE API - ADD THIS
// ============================================
app.put('/api/vendor/profile', authMiddleware, vendorMiddleware, async (req, res) => {
  try {
    await connectDB();
    
    const vendor = await Vendor.findById(req.user.id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Allowed fields to update
    const allowedFields = ['name', 'phone', 'address', 'brandName', 'storeName', 'gstNumber', 'panNumber', 'bankDetails'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        vendor[field] = req.body[field];
      }
    });

    vendor.updatedAt = new Date();
    await vendor.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      vendor: vendor
    });

  } catch (error) {
    console.error('Update vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ============================================
// ✅ VENDOR GET STATS API - ADD THIS
// ============================================
app.get('/api/vendor/stats', authMiddleware, vendorMiddleware, async (req, res) => {
  try {
    await connectDB();
    
    const vendorId = req.user.id;
    
    // Get total products
    const totalProducts = await Product.countDocuments({ vendorId: vendorId });
    
    // Get total orders (you'll need to add vendorId to orders)
    const totalOrders = await Order.countDocuments({ 'items.vendorId': vendorId });
    
    // Get total revenue
    const orders = await Order.find({ 'items.vendorId': vendorId });
    let totalRevenue = 0;
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.vendorId && item.vendorId.toString() === vendorId) {
          totalRevenue += item.price * item.quantity;
        }
      });
    });

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalRevenue: Math.round(totalRevenue),
        pendingOrders: 0 // Add logic for pending orders
      }
    });

  } catch (error) {
    console.error('Get vendor stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ============================================
// ✅ ADMIN: GET ALL VENDORS - ADD THIS
// ============================================
app.get('/api/admin/vendors', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const vendors = await Vendor.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpires -bankDetails')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Vendor.countDocuments(filter);

    res.json({
      success: true,
      vendors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalVendors: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ============================================
// ✅ ADMIN: APPROVE VENDOR - ADD THIS
// ============================================
app.patch('/api/admin/vendors/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.status = 'approved';
    vendor.vendorStatus = 'approved';
    vendor.updatedAt = new Date();
    await vendor.save();

    res.json({
      success: true,
      message: 'Vendor approved successfully',
      vendor: vendor
    });

  } catch (error) {
    console.error('Approve vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ============================================
// ✅ ADMIN: REJECT VENDOR - ADD THIS
// ============================================
app.patch('/api/admin/vendors/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.status = 'rejected';
    vendor.vendorStatus = 'rejected';
    vendor.updatedAt = new Date();
    await vendor.save();

    res.json({
      success: true,
      message: 'Vendor rejected successfully',
      vendor: vendor
    });

  } catch (error) {
    console.error('Reject vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ============================================
// ✅ ADMIN: SUSPEND VENDOR - ADD THIS
// ============================================
app.patch('/api/admin/vendors/:id/suspend', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.status = 'suspended';
    vendor.vendorStatus = 'suspended';
    vendor.updatedAt = new Date();
    await vendor.save();

    res.json({
      success: true,
      message: 'Vendor suspended successfully',
      vendor: vendor
    });

  } catch (error) {
    console.error('Suspend vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ============================================
// ✅ VENDOR PRODUCT ROUTES - ADD THIS
// ============================================

// Get vendor's own products
app.get('/api/vendor/products', authMiddleware, vendorMiddleware, async (req, res) => {
  try {
    await connectDB();
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const products = await Product.find({ vendorId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Product.countDocuments({ vendorId: req.user.id });
    
    res.json({
      success: true,
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total,
        limit: limitNum,
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get vendor products error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add vendor product with vendorId
app.post('/api/vendor/products', authMiddleware, vendorMiddleware, async (req, res) => {
  try {
    await connectDB();
    
    const productData = req.body;
    
    // Add vendorId to product
    productData.vendorId = req.user.id;
    
    const name = productData.name || productData.title || 'Unnamed Product';
    const price = Number(productData.price) || Number(productData.currentPrice) || 0;
    const originalPrice = Number(productData.originalPrice) || Number(productData.mrp) || price * 1.2;
    
    if (price === 0 || isNaN(price)) {
      return res.status(400).json({ 
        error: 'Valid price is required'
      });
    }
    
    let descriptionValue = productData.description;
    if (Array.isArray(descriptionValue)) {
      descriptionValue = descriptionValue.join(' ');
    } else if (typeof descriptionValue === 'string') {
      descriptionValue = descriptionValue;
    } else {
      descriptionValue = '';
    }
    
    let keyFeaturesValue = productData.keyFeatures;
    if (typeof keyFeaturesValue === 'string') {
      keyFeaturesValue = [keyFeaturesValue];
    } else if (!Array.isArray(keyFeaturesValue)) {
      keyFeaturesValue = [];
    }
    
    let imagesValue = productData.images;
    if (typeof imagesValue === 'string') {
      imagesValue = [imagesValue];
    } else if (!Array.isArray(imagesValue)) {
      imagesValue = [];
    }
    
    let variationsValue = productData.variations;
    if (!Array.isArray(variationsValue)) {
      variationsValue = [];
    }
    
    const category = productData.category || productData.detectedCategory || productData.mainCategory || 'Uncategorized';
    const mainCategory = productData.mainCategory || productData.detectedCategory || 'Other';
    const subCategory = productData.subCategory || productData.subcategory || '';
    const subcategory = productData.subCategory || productData.subcategory || '';
    
    const product = new Product({
      name: name,
      brand: productData.brand || '',
      category: category,
      mainCategory: mainCategory,
      subCategory: subCategory,
      subcategory: subcategory,
      price: price,
      originalPrice: originalPrice,
      stock: Number(productData.stock) || 10,
      images: imagesValue,
      description: descriptionValue,
      shortDescription: productData.shortDescription || '',
      keyFeatures: keyFeaturesValue,
      sizes: productData.sizes || [],
      colors: productData.colors || [],
      variants: productData.variants || [],
      variations: variationsValue,
      fabric: productData.fabric || '',
      material: productData.material || '',
      gender: productData.gender || 'unisex',
      weight: productData.weight || '',
      dimensions: productData.dimensions || '',
      ingredients: productData.ingredients || '',
      metaTitle: productData.metaTitle || name.substring(0, 60),
      metaDescription: productData.metaDescription || descriptionValue.substring(0, 160),
      metaKeywords: productData.metaKeywords || '',
      slug: productData.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 100),
      isNew: true,
      status: 'active',
      adminApproved: req.user?.role === 'admin' || false,
      rating: productData.rating || 4.0,
      reviewCount: productData.reviewCount || 0,
      vendorId: req.user.id
    });
    
    await product.save();
    res.status(201).json({ success: true, product });
    
  } catch (error) {
    console.error('Add vendor product error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors,
        fields: Object.keys(error.errors)
      });
    }
    
    res.status(500).json({ 
      error: error.message
    });
  }
});

// ========== ROUTES REGISTRATION ==========
app.use('/api/otp', otpRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);

// ========== ADDRESS ROUTES ==========
app.get('/api/addresses', authMiddleware, async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    res.json(addresses);
  } catch (error) {
    console.error('GET addresses error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/addresses', authMiddleware, async (req, res) => {
  try {
    console.log('Received address data:', req.body);
    
    const { fullName, phone, addressLine1, addressLine2, landmark, city, state, pincode, country, type, isDefault } = req.body;
    
    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }
    
    if (phone.length < 10) {
      return res.status(400).json({ error: 'Phone number must be at least 10 digits' });
    }
    
    if (pincode.length < 6) {
      return res.status(400).json({ error: 'Pincode must be at least 6 digits' });
    }
    
    if (isDefault) {
      await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    }
    
    const newAddress = new Address({
      userId: req.user.id,
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || '',
      landmark: landmark || '',
      city,
      state,
      pincode,
      country: country || 'India',
      type: type || 'Home',
      isDefault: isDefault || false
    });
    
    await newAddress.save();
    console.log('Address saved:', newAddress);
    res.status(201).json(newAddress);
  } catch (error) {
    console.error('POST address error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/addresses/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating address:', id, req.body);
    
    const addressDoc = await Address.findOne({ _id: id, userId: req.user.id });
    if (!addressDoc) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    const { fullName, phone, addressLine1, addressLine2, landmark, city, state, pincode, country, type, isDefault } = req.body;
    
    if (isDefault) {
      await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    }
    
    addressDoc.fullName = fullName || addressDoc.fullName;
    addressDoc.phone = phone || addressDoc.phone;
    addressDoc.addressLine1 = addressLine1 || addressDoc.addressLine1;
    addressDoc.addressLine2 = addressLine2 || addressDoc.addressLine2;
    addressDoc.landmark = landmark || addressDoc.landmark;
    addressDoc.city = city || addressDoc.city;
    addressDoc.state = state || addressDoc.state;
    addressDoc.pincode = pincode || addressDoc.pincode;
    addressDoc.country = country || addressDoc.country;
    addressDoc.type = type || addressDoc.type;
    addressDoc.isDefault = isDefault || false;
    
    await addressDoc.save();
    console.log('Address updated:', addressDoc);
    res.json(addressDoc);
  } catch (error) {
    console.error('PUT address error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/addresses/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting address:', id);
    
    const addressDoc = await Address.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!addressDoc) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    console.error('DELETE address error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/addresses/:id/default', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Setting default address:', id);
    
    await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    const addressDoc = await Address.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { isDefault: true },
      { new: true }
    );
    
    if (!addressDoc) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    res.json(addressDoc);
  } catch (error) {
    console.error('PATCH default error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CART ROUTES ==========
app.get('/api/cart', authMiddleware, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
      await cart.save();
    }
    res.json(cart);
  } catch (error) {
    console.error('GET cart error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cart', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID required' });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }
    
    const existingItem = cart.items.find(item => item.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }
    
    cart.updatedAt = new Date();
    await cart.save();
    await cart.populate('items.productId');
    
    res.status(201).json(cart);
  } catch (error) {
    console.error('POST cart error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/cart/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    item.quantity = quantity;
    cart.updatedAt = new Date();
    await cart.save();
    await cart.populate('items.productId');
    
    res.json(cart);
  } catch (error) {
    console.error('PUT cart error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/cart/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    cart.updatedAt = new Date();
    await cart.save();
    
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('DELETE cart error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== PRODUCT ROUTES ==========
app.get('/api/products', async (req, res) => {
  try {
    await connectDB();
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const products = await Product.find({ status: 'active', adminApproved: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Product.countDocuments({ status: 'active', adminApproved: true });
    
    res.json({
      products: products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total,
        limit: limitNum,
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    await connectDB();
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    
    const productData = req.body;
    
    const name = productData.name || productData.title || 'Unnamed Product';
    const price = Number(productData.price) || Number(productData.currentPrice) || 0;
    const originalPrice = Number(productData.originalPrice) || Number(productData.mrp) || price * 1.2;
    
    if (price === 0 || isNaN(price)) {
      return res.status(400).json({ 
        error: 'Valid price is required'
      });
    }
    
    let descriptionValue = productData.description;
    if (Array.isArray(descriptionValue)) {
      descriptionValue = descriptionValue.join(' ');
    } else if (typeof descriptionValue === 'string') {
      descriptionValue = descriptionValue;
    } else {
      descriptionValue = '';
    }
    
    let keyFeaturesValue = productData.keyFeatures;
    if (typeof keyFeaturesValue === 'string') {
      keyFeaturesValue = [keyFeaturesValue];
    } else if (!Array.isArray(keyFeaturesValue)) {
      keyFeaturesValue = [];
    }
    
    let imagesValue = productData.images;
    if (typeof imagesValue === 'string') {
      imagesValue = [imagesValue];
    } else if (!Array.isArray(imagesValue)) {
      imagesValue = [];
    }
    
    let variationsValue = productData.variations;
    if (!Array.isArray(variationsValue)) {
      variationsValue = [];
    }
    
    const category = productData.category || productData.detectedCategory || productData.mainCategory || 'Uncategorized';
    const mainCategory = productData.mainCategory || productData.detectedCategory || 'Other';
    const subCategory = productData.subCategory || productData.subcategory || '';
    const subcategory = productData.subCategory || productData.subcategory || '';
    
    const product = new Product({
      name: name,
      brand: productData.brand || '',
      category: category,
      mainCategory: mainCategory,
      subCategory: subCategory,
      subcategory: subcategory,
      price: price,
      originalPrice: originalPrice,
      stock: Number(productData.stock) || 10,
      images: imagesValue,
      description: descriptionValue,
      shortDescription: productData.shortDescription || '',
      keyFeatures: keyFeaturesValue,
      sizes: productData.sizes || [],
      colors: productData.colors || [],
      variants: productData.variants || [],
      variations: variationsValue,
      fabric: productData.fabric || '',
      material: productData.material || '',
      gender: productData.gender || 'unisex',
      weight: productData.weight || '',
      dimensions: productData.dimensions || '',
      ingredients: productData.ingredients || '',
      metaTitle: productData.metaTitle || name.substring(0, 60),
      metaDescription: productData.metaDescription || descriptionValue.substring(0, 160),
      metaKeywords: productData.metaKeywords || '',
      slug: productData.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 100),
      isNew: true,
      status: 'active',
      adminApproved: true,
      rating: productData.rating || 4.0,
      reviewCount: productData.reviewCount || 0,
      vendorId: productData.vendorId || null
    });
    
    await product.save();
    res.status(201).json({ success: true, product });
    
  } catch (error) {
    console.error('Add product error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors
      });
    }
    
    res.status(500).json({ 
      error: error.message
    });
  }
});

app.put('/api/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (req.body.subCategory !== undefined) {
      product.subCategory = req.body.subCategory;
    }
    if (req.body.subcategory !== undefined) {
      product.subcategory = req.body.subcategory;
    }
    
    if (req.body.variations !== undefined) {
      product.variations = req.body.variations;
    }
    
    if (req.body.variants !== undefined) {
      product.variants = req.body.variants;
    }
    
    const { variations, variants, subCategory, subcategory, ...otherData } = req.body;
    Object.assign(product, otherData);
    
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== REVIEW ROUTES ==========
app.get('/api/reviews/can-review/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    
    const order = await Order.findOne({
      userId,
      'items.productId': productId,
      status: 'delivered'
    });
    
    const existingReview = await Review.findOne({ productId, userId, orderId: order?._id });
    
    res.json({
      canReview: !!order && !existingReview,
      alreadyReviewed: !!existingReview,
      orderId: order?._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reviews', authMiddleware, async (req, res) => {
  try {
    const { productId, orderId, rating, title, comment, images, videos } = req.body;
    const userId = req.user.id;
    
    const order = await Order.findOne({
      _id: orderId,
      userId,
      'items.productId': productId,
      status: 'delivered'
    });
    
    if (!order) {
      return res.status(403).json({ error: 'You can only review products after delivery' });
    }
    
    const existingReview = await Review.findOne({ productId, userId, orderId });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }
    
    const review = new Review({
      productId,
      userId,
      orderId,
      rating,
      title: title || '',
      comment,
      images: images || [],
      videos: videos || [],
      isVerifiedPurchase: true,
      status: 'pending'
    });
    
    await review.save();
    res.status(201).json({ success: true, review, message: 'Review submitted! Awaiting admin approval.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reviews/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const reviews = await Review.find({ productId, status: 'approved' })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments({ productId, status: 'approved' });
    const avgRating = await Review.getAverageRating(productId);
    
    res.json({
      reviews,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      averageRating: avgRating.rating,
      totalReviews: avgRating.count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/reviews/:reviewId/helpful', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    
    if (review.helpfulUsers.includes(userId)) {
      return res.json({ helpful: review.helpful });
    }
    
    review.helpful += 1;
    review.helpfulUsers.push(userId);
    await review.save();
    res.json({ helpful: review.helpful });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reviews/admin/pending', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'pending' })
      .populate('userId', 'name email')
      .populate('productId', 'name images')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reviews/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    
    const reviews = await Review.find(filter)
      .populate('userId', 'name email')
      .populate('productId', 'name images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments(filter);
    res.json({ reviews, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/reviews/admin/:reviewId/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { adminNote } = req.body;
    
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    
    review.status = 'approved';
    review.approvedAt = new Date();
    if (adminNote) review.adminNote = adminNote;
    await review.save();
    
    const avgRating = await Review.getAverageRating(review.productId);
    await Product.findByIdAndUpdate(review.productId, { rating: avgRating.rating, reviewCount: avgRating.count });
    
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/reviews/admin/:reviewId/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { adminNote } = req.body;
    
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    
    review.status = 'rejected';
    if (adminNote) review.adminNote = adminNote;
    await review.save();
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/reviews/admin/:reviewId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.reviewId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/reviews/:reviewId', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    
    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    
    await review.deleteOne();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== WISHLIST ROUTES ==========
app.get('/api/wishlist', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    let wishlist = await Wishlist.findOne({ userId }).populate('items.productId');
    
    if (!wishlist) {
      return res.json([]);
    }
    
    const formattedWishlist = wishlist.items.map(item => ({
      _id: item.productId._id,
      id: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      originalPrice: item.productId.originalPrice,
      image: item.productId.images?.[0] || null,
      brand: item.productId.brand,
      category: item.productId.category,
      addedAt: item.addedAt
    }));
    
    res.json(formattedWishlist);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/wishlist', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID required' });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    let wishlist = await Wishlist.findOne({ userId });
    
    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [{ productId }] });
    } else {
      const existingItem = wishlist.items.find(item => item.productId.toString() === productId);
      if (existingItem) {
        return res.status(400).json({ error: 'Product already in wishlist' });
      }
      wishlist.items.push({ productId });
    }
    
    await wishlist.save();
    
    res.json({ success: true, message: 'Added to wishlist', count: wishlist.items.length });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/wishlist/:productId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    
    const wishlist = await Wishlist.findOne({ userId });
    
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }
    
    wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);
    await wishlist.save();
    
    res.json({ success: true, message: 'Removed from wishlist', count: wishlist.items.length });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/wishlist/clear/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    await Wishlist.findOneAndDelete({ userId });
    res.json({ success: true, message: 'Wishlist cleared' });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ORDERS ROUTES ==========
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('GET orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('GET order error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { items, total, address, paymentMethod } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }
    
    const order = new Order({
      userId: req.user.id,
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        variationName: item.variationName,
        variationSecondary: item.variationSecondary,
        vendorId: item.vendorId || null
      })),
      total,
      address,
      paymentMethod: paymentMethod || 'COD',
      status: 'pending',
      paymentStatus: 'pending'
    });
    
    await order.save();
    
    // Clear cart after order
    await Cart.findOneAndDelete({ userId: req.user.id });
    
    res.status(201).json(order);
  } catch (error) {
    console.error('POST order error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/orders/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    order.status = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }
    await order.save();
    
    res.json(order);
  } catch (error) {
    console.error('PATCH order status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== BANNER ROUTES ==========
app.get('/api/banners', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const banners = await Banner.find().sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/banners/active', async (req, res) => {
  try {
    await connectDB();
    const banners = await Banner.find({ active: true }).sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/banners', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const banner = new Banner(req.body);
    await banner.save();
    res.status(201).json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/banners/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });
    
    Object.assign(banner, req.body);
    await banner.save();
    res.json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/banners/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== OFFER ROUTES ==========
app.get('/api/offers/active-offer', async (req, res) => {
  try {
    await connectDB();
    const currentDate = new Date();
    const offer = await Offer.findOne({
      isActive: true,
      type: 'top_banner',
      startDate: { $lte: currentDate },
      $or: [{ endDate: { $gte: currentDate } }, { endDate: null }]
    }).sort({ createdAt: -1 });
    
    res.json(offer || {
      title: 'FREE SHIPPING',
      description: 'FREE SHIPPING ON ALL ORDERS • NO MINIMUM ORDER',
      discountValue: 0,
      minOrderValue: 0
    });
  } catch (error) {
    res.json({
      title: 'FREE SHIPPING',
      description: 'FREE SHIPPING ON ALL ORDERS • NO MINIMUM ORDER',
      discountValue: 0,
      minOrderValue: 0
    });
  }
});

app.get('/api/offers/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/offers/create', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const offer = new Offer(req.body);
    await offer.save();
    res.status(201).json({ success: true, offer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/offers/update/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    
    Object.assign(offer, req.body);
    offer.updatedAt = new Date();
    await offer.save();
    res.json({ success: true, offer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/offers/toggle/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    
    offer.isActive = !offer.isActive;
    await offer.save();
    res.json({ success: true, isActive: offer.isActive });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/offers/delete/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== SHIPPING ROUTES ==========
app.post('/api/shipping/check-delivery', async (req, res) => {
  try {
    const { pincode, cartTotal, weight = 0.5 } = req.body;
    
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 5);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 3);
    
    return res.json({
      success: true,
      deliverable: true,
      shippingCharge: 0,
      estimatedDelivery: {
        minDate: minDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        maxDate: estimatedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        minDays: 3,
        maxDays: 5
      },
      courierName: 'Free Express Delivery',
      freeShippingThreshold: 0,
      cutOffTime: '16:00'
    });
    
  } catch (error) {
    console.error('Delivery check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/shipping/settings', async (req, res) => {
  res.json({
    success: true,
    settings: {
      freeShippingThreshold: 0,
      cutOffTime: '16:00'
    }
  });
});

// ========== COUPON ROUTES ==========
app.post('/api/coupons/validate', async (req, res) => {
  try {
    await connectDB();
    const { code, cartTotal } = req.body;
    const couponCode = code.toUpperCase();
    
    const coupon = await Coupon.findOne({ 
      code: couponCode, 
      isActive: true,
      startDate: { $lte: new Date() },
      $or: [
        { endDate: { $gte: new Date() } },
        { endDate: null }
      ]
    });
    
    if (!coupon) {
      return res.json({ valid: false, message: 'Invalid coupon code' });
    }
    
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.json({ valid: false, message: 'Coupon usage limit exceeded' });
    }
    
    if (cartTotal < coupon.minOrderValue) {
      return res.json({ valid: false, message: `Minimum order of ₹${coupon.minOrderValue} required` });
    }
    
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
      if (discountAmount > cartTotal) discountAmount = cartTotal;
    }
    
    res.json({
      valid: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount),
        minOrderValue: coupon.minOrderValue
      }
    });
    
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

app.get('/api/coupons/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/coupons/create', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const existingCoupon = await Coupon.findOne({ code: req.body.code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    
    const coupon = new Coupon({
      ...req.body,
      code: req.body.code.toUpperCase()
    });
    
    await coupon.save();
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/coupons/update/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    
    Object.assign(coupon, req.body);
    coupon.updatedAt = new Date();
    await coupon.save();
    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/coupons/toggle/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({ success: true, isActive: coupon.isActive });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/coupons/delete/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== AMAZON IMPORT ==========
const scrapeAmazonProduct = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    const pageText = $('body').text();
    const html = response.data;
    
    const name = $('#productTitle').text().trim() || 'Unknown Product';
    
    let price = $('#priceblock_ourprice').text();
    if (!price) price = $('#priceblock_dealprice').text();
    if (!price) price = $('.a-price-whole').first().text();
    const priceMatch = price.match(/[\d,]+/);
    const finalPrice = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
    
    let originalPrice = 0;
    const mrpMatch = html.match(/M\.?R\.?P\.?\s*:?\s*[₹]?\s*(\d+(?:,\d+)?(?:\.\d+)?)/i);
    if (mrpMatch) {
      originalPrice = parseInt(mrpMatch[1].replace(/,/g, ''));
    }
    if (!originalPrice) {
      const listMatch = html.match(/List Price[:\s]*[₹]?\s*(\d+(?:,\d+)?)/i);
      if (listMatch) {
        originalPrice = parseInt(listMatch[1].replace(/,/g, ''));
      }
    }
    if (originalPrice === 0 || originalPrice <= finalPrice) {
      originalPrice = Math.round(finalPrice * 1.2);
    }
    
    const images = [];
    $('#imgTagWrapperId img, .a-dynamic-image, #landingImage').each((i, el) => {
      let src = $(el).attr('src') || $(el).attr('data-old-hires');
      if (src && src.includes('.jpg') && !images.includes(src)) {
        src = src.split('._')[0] + '._SL1500_.jpg';
        images.push(src);
      }
    });
    
    let descriptionArray = [];
    $('#feature-bullets .a-list-item, #feature-bullets .a-spacing-small').each((i, el) => {
      let text = $(el).text().trim();
      if (text && text.length > 15 && text.length < 500) {
        text = text.replace(/【.*?】/g, '').replace(/\s+/g, ' ').trim();
        if (!text.includes('See more') && !text.includes('Report an issue')) {
          descriptionArray.push(text);
        }
      }
    });
    if (descriptionArray.length === 0) {
      const productDesc = $('#productDescription').text().trim();
      if (productDesc) {
        let sentences = productDesc.split(/\.\s+|\.\n+|\n+/);
        for (let sentence of sentences) {
          let clean = sentence.trim();
          if (clean.length > 25 && clean.length < 400) {
            descriptionArray.push(clean);
          }
        }
      }
    }
    descriptionArray = [...new Set(descriptionArray)];
    
    let keyFeaturesArray = [];
    $('#feature-bullets .a-list-item').each((i, el) => {
      let text = $(el).text().trim();
      if (text && text.length > 10 && text.length < 200) {
        text = text.replace(/【.*?】/g, '').trim();
        if (!text.toLowerCase().includes('see more')) {
          keyFeaturesArray.push(text);
        }
      }
    });
    
    let weight = '';
    const weightMatch1 = html.match(/Item Weight\s*:?\s*([\d.]+)\s*(g|kg|gm|gram|grams)/i);
    if (weightMatch1) {
      weight = `${weightMatch1[1]}${weightMatch1[2] === 'gram' || weightMatch1[2] === 'grams' ? 'g' : weightMatch1[2]}`;
    }
    if (!weight) {
      const nameWeight = name.match(/(\d+)\s*(g|ml|kg|gm)/i);
      if (nameWeight) {
        weight = `${nameWeight[1]}${nameWeight[2]}`;
      }
    }
    
    let ingredients = '';
    const ingredientsMatch1 = html.match(/Active Ingredients\s*:?\s*([^<>.]+?)(?:\.|$|<br|\(|\)|\n)/i);
    if (ingredientsMatch1 && ingredientsMatch1[1] && ingredientsMatch1[1].length > 5) {
      ingredients = ingredientsMatch1[1].trim();
    }
    if (!ingredients) {
      const ingredientsMatch2 = html.match(/Ingredients\s*:?\s*([^<>.]+?)(?:\.|$|<br|\(|\)|\n)/i);
      if (ingredientsMatch2 && ingredientsMatch2[1] && ingredientsMatch2[1].length > 5) {
        ingredients = ingredientsMatch2[1].trim();
      }
    }
    if (!ingredients) {
      const ingredientsMatch3 = html.match(/Key Ingredients\s*:?\s*([^<>.]+?)(?:\.|$|<br|\(|\)|\n)/i);
      if (ingredientsMatch3 && ingredientsMatch3[1] && ingredientsMatch3[1].length > 5) {
        ingredients = ingredientsMatch3[1].trim();
      }
    }
    if (!ingredients) {
      $('table, .a-keyvalue, .product-detail-table').each((i, table) => {
        $(table).find('tr').each((j, row) => {
          const label = $(row).find('th, td:first-child').text().trim();
          const value = $(row).find('td:last-child').text().trim();
          if ((label.toLowerCase().includes('ingredient') || label.toLowerCase().includes('active')) && value && value.length > 5) {
            ingredients = value;
            return false;
          }
        });
        if (ingredients) return false;
      });
    }
    if (ingredients && ingredients.length > 300) {
      ingredients = ingredients.substring(0, 300);
    }
    if (ingredients) {
      ingredients = ingredients.replace(/see more|read more|click here/i, '').trim();
    }
    
    let dimensions = '';
    const dimMatch = html.match(/Product Dimensions\s*:?\s*([\d.]+)\s*x\s*([\d.]+)\s*x\s*([\d.]+)\s*(?:cm|mm|inch)/i);
    if (dimMatch) {
      dimensions = `${dimMatch[1]} x ${dimMatch[2]} x ${dimMatch[3]} cm`;
    }
    
    let brand = '';
    const bylineText = $('#bylineInfo').text().trim();
    if (bylineText) {
      brand = bylineText.replace(/Visit the|Store|Shop|by|Brand:/gi, '').trim();
    }
    if (!brand) brand = $('#brand').text().trim();
    if (!brand && name.includes('-')) brand = name.split('-')[0].trim();
    
    let variations = [];
    
    $('table, .a-dynamic-list, .a-lineitem, [role="table"]').each((i, table) => {
      const tableText = $(table).text();
      if (tableText.match(/(\d+\s*(g|ml|kg|gm))/i)) {
        $(table).find('tr, td, .a-row').each((j, row) => {
          const rowText = $(row).text();
          const sizeMatches = rowText.match(/(\d+)\s*(g|ml|kg|gm)/gi);
          const priceMatches = rowText.match(/₹(\d+(?:,\d+)?)/g);
          if (sizeMatches) {
            sizeMatches.forEach((size, idx) => {
              let priceVal = finalPrice;
              if (priceMatches && priceMatches[idx]) {
                priceVal = parseInt(priceMatches[idx].replace(/[₹,]/g, ''));
              }
              if (!variations.find(v => v.name === size) && 
                  !size.match(/buy|cart|subscribe|offer|click|view/i)) {
                variations.push({ name: size, price: priceVal, mrp: Math.round(priceVal * 1.2), stock: 10 });
              }
            });
          }
        });
      }
    });
    
    $('select[name*="size"], select[name*="variation"]').each((i, select) => {
      $(select).find('option').each((j, option) => {
        let optText = $(option).text().trim();
        const sizeMatch = optText.match(/(\d+)\s*(g|ml|kg|gm)/i);
        if (sizeMatch && !variations.find(v => v.name === sizeMatch[0])) {
          variations.push({ name: sizeMatch[0], price: finalPrice, mrp: Math.round(finalPrice * 1.2), stock: 10 });
        }
      });
    });
    
    const allSizes = pageText.match(/(\d+)\s*(?:g|ml|kg|gm)/gi);
    if (allSizes) {
      const uniqueSizes = [...new Set(allSizes)];
      uniqueSizes.forEach(size => {
        if (!variations.find(v => v.name === size) && 
            !size.match(/buy|cart|subscribe|save|offer|click|view/i) &&
            size.length < 15) {
          variations.push({ name: size, price: finalPrice, mrp: Math.round(finalPrice * 1.2), stock: 10 });
        }
      });
    }
    
    variations = variations.filter((v, i, self) => i === self.findIndex((t) => t.name === v.name));
    variations = variations.slice(0, 15);
    
    const detectCategory = (productName, productDesc, keyFeatures) => {
      const text = `${productName} ${productDesc} ${keyFeatures.join(' ')}`.toLowerCase();
      
      const makeupKeywords = [
        'lipstick', 'foundation', 'kajal', 'eyeshadow', 'blush', 'mascara', 
        'highlighter', 'concealer', 'primer', 'compact', 'lip gloss', 'lip liner',
        'eyeliner', 'bronzer', 'contour', 'setting spray', 'makeup remover', 
        'bb cream', 'cc cream', 'lip stain', 'lip oil', 'lip plumper',
        'eyebrow', 'eye pencil', 'kohl', 'face powder', 'loose powder',
        'compact powder', 'color corrector', 'makeup fixer'
      ];
      for (const keyword of makeupKeywords) {
        if (text.includes(keyword)) return 'Makeup';
      }
      
      const skincareKeywords = [
        'face wash', 'cleanser', 'serum', 'moisturizer', 'sunscreen', 'cream', 
        'lotion', 'toner', 'mask', 'eye cream', 'scrub', 'face cream', 
        'night cream', 'day cream', 'vitamin c', 'retinol', 'hyaluronic', 
        'niacinamide', 'acne', 'pimple', 'spot treatment', 'face mist',
        'lip balm', 'facial oil'
      ];
      for (const keyword of skincareKeywords) {
        if (text.includes(keyword)) return 'Skincare';
      }
      
      const hairKeywords = ['shampoo', 'conditioner', 'hair oil', 'hair serum', 'hair mask', 'hair color', 'hair spray', 'dandruff', 'hair fall'];
      for (const keyword of hairKeywords) {
        if (text.includes(keyword)) return 'Hair';
      }
      
      const clothingKeywords = ['dress', 'top', 'kurti', 'saree', 'jeans', 't-shirt', 'shirt', 'jacket', 'lehenga'];
      for (const keyword of clothingKeywords) {
        if (text.includes(keyword)) return 'Clothing';
      }
      
      const accessoriesKeywords = ['bag', 'jewelry', 'watch', 'sunglasses', 'belt', 'scarf', 'wallet', 'earrings'];
      for (const keyword of accessoriesKeywords) {
        if (text.includes(keyword)) return 'Accessories';
      }
      
      return 'Skincare';
    };
    
    const descriptionText = descriptionArray.join(' ');
    const detectedCategory = detectCategory(name, descriptionText, keyFeaturesArray);
    
    const detectSubCategory = (productName, productDesc, category) => {
      const text = `${productName} ${productDesc}`.toLowerCase();
      
      const subCatMap = {
        'Makeup': ['Lipstick', 'Foundation', 'Kajal', 'Eyeshadow', 'Blush', 'Mascara', 'Highlighter', 'Concealer', 'Primer', 'Compact', 'Lip Gloss'],
        'Skincare': ['Face Wash', 'Cleanser', 'Serum', 'Moisturizer', 'Sunscreen', 'Face Mask', 'Eye Cream', 'Toner', 'Face Scrub', 'Lip Balm'],
        'Hair': ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Serum', 'Hair Mask', 'Hair Color'],
        'Clothing': ['Dress', 'Top', 'Kurti', 'Saree', 'Jeans', 'T-Shirt', 'Jacket', 'Lehenga'],
        'Accessories': ['Bag', 'Jewelry', 'Watch', 'Sunglasses', 'Belt', 'Scarf', 'Wallet']
      };
      
      const subCats = subCatMap[category] || [];
      for (const sub of subCats) {
        if (text.includes(sub.toLowerCase())) return sub;
      }
      return '';
    };
    
    const detectedSubCategory = detectSubCategory(name, descriptionText, detectedCategory);
    
    return {
      name,
      brand: brand || '',
      price: finalPrice,
      originalPrice: originalPrice,
      images: [...new Set(images)].slice(0, 5),
      description: descriptionArray.slice(0, 15),
      keyFeatures: keyFeaturesArray.slice(0, 10),
      detectedCategory: detectedCategory,
      detectedSubCategory: detectedSubCategory,
      variations: variations,
      weight: weight,
      dimensions: dimensions,
      ingredients: ingredients,
      skinType: 'all',
      concerns: []
    };
    
  } catch (error) {
    console.error('Scraping error:', error.message);
    throw new Error('Failed to fetch product details. Please check the URL.');
  }
};

app.post('/api/import/amazon', authMiddleware, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'Amazon URL is required' });
    }
    
    if (!url.includes('amazon.in') && !url.includes('amazon.com')) {
      return res.status(400).json({ error: 'Please enter a valid Amazon URL' });
    }
    
    const scrapedData = await scrapeAmazonProduct(url);
    
    const finalData = {
      ...scrapedData,
      price: Number(scrapedData.price) || 0,
      originalPrice: Number(scrapedData.originalPrice) || Number(scrapedData.price) * 1.2 || 0,
      stock: 10,
      status: 'active'
    };
    
    res.json({
      success: true,
      scraped: finalData,
      message: 'Product details fetched successfully!'
    });
    
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== SEO: XML SITEMAP ==========
const { generateSitemap } = require('./sitemap');

app.get('/api/sitemap.xml', async (req, res) => {
  try {
    const sitemap = await generateSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.url} not found` });
});

module.exports = app;
