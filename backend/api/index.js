const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const cheerio = require('cheerio');
const multer = require('multer');
const AWS = require('aws-sdk');

const app = express();

// ========== CORS - MOST PERMISSIVE ==========
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({ origin: '*', credentials: true }));
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

// ========== Multer (Memory Storage for Vercel) ==========
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
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
  }
};

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

// ========== Schemas ==========
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['buyer', 'vendor', 'admin'], default: 'buyer' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
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

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, default: '' },
  category: { type: String, required: true },
  mainCategory: { type: String, default: '' },
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
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  metaKeywords: { type: String, default: '' },
  slug: { type: String, default: '' }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

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

// ========== Auth Middleware ==========
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

// ========== TEST ROUTES ==========
app.get('/', (req, res) => {
  res.json({ message: '🎀 MyPinkShop API is running!', status: 'active' });
});

app.get('/api/health', async (req, res) => {
  try {
    await connectDB();
    res.json({ 
      status: 'ok', 
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({ status: 'ok', database: 'connecting...', timestamp: new Date().toISOString() });
  }
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

// ========== PRODUCT ROUTES ==========
app.get('/api/products', async (req, res) => {
  try {
    await connectDB();
    const products = await Product.find({ status: 'active', adminApproved: true })
      .sort({ createdAt: -1 });
    res.json(products);
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

app.post('/api/products', authMiddleware, async (req, res) => {
  try {
    await connectDB();
    
    let descriptionValue = req.body.description;
    if (Array.isArray(descriptionValue)) {
      descriptionValue = descriptionValue;
    } else if (typeof descriptionValue === 'string') {
      descriptionValue = descriptionValue;
    } else {
      descriptionValue = '';
    }
    
    const product = new Product({
      name: req.body.name,
      brand: req.body.brand || '',
      category: req.body.category,
      mainCategory: req.body.mainCategory || '',
      price: req.body.price,
      originalPrice: req.body.originalPrice || req.body.price * 1.2,
      stock: req.body.stock || 0,
      images: req.body.images || [],
      description: descriptionValue,
      shortDescription: req.body.shortDescription || '',
      keyFeatures: req.body.keyFeatures || [],
      sizes: req.body.sizes || [],
      colors: req.body.colors || [],
      variants: req.body.variants || [],
      variations: req.body.variations || [],
      fabric: req.body.fabric || '',
      material: req.body.material || '',
      gender: req.body.gender || 'unisex',
      weight: req.body.weight || '',
      dimensions: req.body.dimensions || '',
      metaTitle: req.body.metaTitle || '',
      metaDescription: req.body.metaDescription || '',
      metaKeywords: req.body.metaKeywords || '',
      slug: req.body.slug || '',
      isNew: true,
      status: 'active',
      adminApproved: req.user?.role === 'admin'
    });
    
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    Object.assign(product, req.body);
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
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
      title: 'Free Shipping',
      description: 'FREE SHIPPING ON ORDERS ABOVE ₹499 • EXTRA 10% OFF',
      discountValue: 10,
      minOrderValue: 499
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const pickupPincode = '208021';
    
    let delivery;
    let useMock = false;
    
    try {
      await shiprocket.getAuthToken();
      delivery = await shiprocket.getEstimatedDelivery(pickupPincode, pincode, weight);
      
      if (!delivery.deliverable) {
        useMock = true;
      }
    } catch (shiprocketError) {
      console.error('Shiprocket API error:', shiprocketError.message);
      useMock = true;
    }
    
    if (useMock || !delivery || !delivery.deliverable) {
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + 5);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 3);
      
      // 🔥 FIXED: Free shipping threshold changed from 999 to 499
      const freeShippingThreshold = 499;
      let shippingCharge = 50;
      if (cartTotal >= freeShippingThreshold) {
        shippingCharge = 0;
      }
      
      return res.json({
        success: true,
        deliverable: true,
        shippingCharge: shippingCharge,
        estimatedDelivery: {
          minDate: minDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          maxDate: estimatedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          minDays: 3,
          maxDays: 5
        },
        courierName: 'Standard Delivery',
        freeShippingThreshold: freeShippingThreshold,
        cutOffTime: '16:00'
      });
    }
    
    // 🔥 FIXED: Free shipping threshold changed from 999 to 499
    const freeShippingThreshold = 499;
    let shippingCharge = delivery.shippingCharge;
    if (cartTotal >= freeShippingThreshold) {
      shippingCharge = 0;
    }
    
    res.json({
      success: true,
      deliverable: true,
      shippingCharge: shippingCharge,
      estimatedDelivery: {
        minDate: delivery.estimatedDate,
        maxDate: delivery.estimatedDate,
        minDays: delivery.estimatedDays,
        maxDays: delivery.estimatedDays
      },
      courierName: delivery.courierName,
      freeShippingThreshold: freeShippingThreshold,
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
      // 🔥 FIXED: Free shipping threshold changed from 999 to 499
      freeShippingThreshold: 499,
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

// ========== 🔥 FULLY UPGRADED AMAZON IMPORT ROUTES ==========
// 🔥 FIX 1: Full bullet points fetch (no limit)
// 🔥 FIX 2: Variations auto-detect from Amazon
// 🔥 FIX 3: Custom variations fallback if not found
// 🔥 FIX 4: Key ingredients extraction
// 🔥 FIX 5: Skin type detection
// 🔥 FIX 6: Concerns detection
// 🔥 FIX 7: Category auto-detect
// 🔥 FIX 8: SubCategory auto-detect
// 🔥 FIX 9: Brand clean (remove "Visit the store")
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
    
    // ========== 1. PRODUCT NAME ==========
    const name = $('#productTitle').text().trim() || 'Unknown Product';
    
    // ========== 2. PRICE EXTRACTION ==========
    let price = $('#priceblock_ourprice').text();
    if (!price) price = $('#priceblock_dealprice').text();
    if (!price) price = $('.a-price-whole').first().text();
    const priceMatch = price.match(/[\d,]+/);
    const finalPrice = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
    
    let originalPrice = $('#priceblock_wasprice').text();
    if (!originalPrice) originalPrice = $('.a-text-strike').first().text();
    const originalMatch = originalPrice.match(/[\d,]+/);
    const finalOriginalPrice = originalMatch ? parseInt(originalMatch[0].replace(/,/g, '')) : 0;
    
    // ========== 3. IMAGES EXTRACTION ==========
    const images = [];
    $('#imgTagWrapperId img, .a-dynamic-image, #landingImage').each((i, el) => {
      let src = $(el).attr('src') || $(el).attr('data-old-hires');
      if (src && src.includes('.jpg') && !images.includes(src)) {
        src = src.split('._')[0] + '._SL1500_.jpg';
        images.push(src);
      }
    });
    
    // ========== 4. 🔥 FULL DESCRIPTION - ALL BULLET POINTS ==========
    let descriptionArray = [];
    
    // Method 1: Amazon feature bullets
    $('#feature-bullets .a-list-item, #feature-bullets .a-spacing-small, .a-unordered-list .a-list-item').each((i, el) => {
      let text = $(el).text().trim();
      if (text && text.length > 10 && text.length < 500) {
        text = text.replace(/【.*?】/g, '').replace(/\s+/g, ' ').trim();
        const garbageWords = ['See more product details', 'Report an issue', 'Product Description', 'To see our price'];
        let isGarbage = false;
        for (const gw of garbageWords) {
          if (text.toLowerCase().includes(gw.toLowerCase())) {
            isGarbage = true;
            break;
          }
        }
        if (!isGarbage && text.length > 15) {
          descriptionArray.push(text);
        }
      }
    });
    
    // Method 2: Product description paragraphs
    if (descriptionArray.length < 3) {
      $('#productDescription p, #productDescription span, .a-plus .a-row').each((i, el) => {
        let text = $(el).text().trim();
        if (text && text.length > 20 && text.length < 400) {
          text = text.replace(/\s+/g, ' ').trim();
          descriptionArray.push(text);
        }
      });
    }
    
    // Method 3: Split by periods as last resort
    if (descriptionArray.length === 0) {
      const productDesc = $('#productDescription').text().trim();
      if (productDesc) {
        let sentences = productDesc.split(/\.\s+|\.\n+|\n+/);
        for (let sentence of sentences) {
          let clean = sentence.trim();
          if (clean.length > 25 && clean.length < 300) {
            descriptionArray.push(clean);
          }
        }
      }
    }
    
    descriptionArray = [...new Set(descriptionArray)];
    
    // ========== 5. KEY FEATURES / HIGHLIGHTS ==========
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
    
    // ========== 6. 🔥 KEY INGREDIENTS EXTRACTION ==========
    let ingredients = '';
    const fullText = descriptionArray.join(' ') + ' ' + $('#productDescription').text();
    const ingredientsKeywords = ['ingredients', 'key ingredients', 'what\'s inside', 'formulated with', 'contains', 'active ingredients'];
    
    for (const keyword of ingredientsKeywords) {
      const regex = new RegExp(`${keyword}[\\s:]*([^.]+(?:\\.[^.]*)?)`, 'i');
      const match = fullText.match(regex);
      if (match && match[1] && match[1].length > 10) {
        ingredients = match[1].trim();
        if (ingredients.length > 10 && ingredients.length < 300) break;
      }
    }
    
    if (!ingredients && fullText.length > 0) {
      const possibleIngredients = fullText.match(/(?:Vitamin|Hyaluronic|Retinol|Niacinamide|Salicylic|Glycolic|Lactic|Ceramide|Peptide|Antioxidant|Alpha Arbutin|Kojic|Ferulic)[^.]*\./gi);
      if (possibleIngredients) {
        ingredients = possibleIngredients.slice(0, 3).join(', ');
      }
    }
    
    // ========== 7. 🔥 SKIN TYPE DETECTION ==========
    let skinType = 'all';
    const skinTypeKeywords = {
      'oily': ['oily skin', 'excess oil', 'oil control', 'mattifying', 'sebum', 'pore', 'shine'],
      'dry': ['dry skin', 'hydrating', 'moisturizing', 'nourishing', 'parched', 'dehydrated', 'flaky'],
      'combination': ['combination skin', 'mixed skin', 't-zone', 'combo'],
      'sensitive': ['sensitive skin', 'gentle', 'hypoallergenic', 'fragrance free', 'dermatologist tested', 'non-irritating'],
      'normal': ['normal skin', 'daily use', 'everyday', 'all skin types']
    };
    
    const lowerText = fullText.toLowerCase();
    for (const [type, keywords] of Object.entries(skinTypeKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          skinType = type;
          break;
        }
      }
    }
    
    // ========== 8. 🔥 CONCERNS DETECTION ==========
    const concernsMap = {
      'Acne': ['acne', 'pimple', 'breakout', 'blemish', 'spot', 'zits', 'clogged pores'],
      'Aging': ['aging', 'wrinkle', 'fine line', 'anti-aging', 'firming', 'collagen', 'elasticity'],
      'Pigmentation': ['pigmentation', 'dark spot', 'hyperpigmentation', 'melasma', 'uneven tone', 'sun spot'],
      'Dryness': ['dryness', 'dehydrated', 'flaky', 'rough skin', 'tightness'],
      'Dullness': ['dull', 'glow', 'brightening', 'radiance', 'luminous', 'glowing'],
      'Oil Control': ['oil control', 'sebum', 'mattify', 'shine', 'greasy'],
      'Redness': ['redness', 'irritation', 'inflammation', 'calming', 'soothing', 'rosacea'],
      'Dark Spots': ['dark spot', 'sun spot', 'age spot', 'post-acne', 'scar']
    };
    
    const detectedConcerns = [];
    for (const [concern, keywords] of Object.entries(concernsMap)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          detectedConcerns.push(concern);
          break;
        }
      }
    }
    
    // ========== 9. 🔥 BRAND EXTRACTION (CLEAN) ==========
    let brand = '';
    const bylineText = $('#bylineInfo').text().trim();
    if (bylineText) {
      brand = bylineText
        .replace(/Visit the/gi, '')
        .replace(/Store/gi, '')
        .replace(/Shop/gi, '')
        .replace(/by/gi, '')
        .replace(/Brand:/gi, '')
        .trim();
    }
    if (!brand) brand = $('#brand').text().trim();
    if (!brand && name.includes('-')) brand = name.split('-')[0].trim();
    if (brand && (brand.toLowerCase().includes('visit') || brand.toLowerCase().includes('store'))) brand = '';
    
    // ========== 10. 🔥 VARIATIONS EXTRACTION (WITH CUSTOM FALLBACK) ==========
    let variations = [];
    
    // Method 1: Get from size dropdown
    $('#variation_size_name li, .a-dropdown-size select option, select[name="dropdown_selected_size_name"] option').each((i, el) => {
      let varText = $(el).text().trim();
      if (varText && varText !== 'Select' && varText !== 'Choose' && varText !== '--' && varText.length < 30) {
        if (!variations.find(v => v.name === varText)) {
          variations.push({ 
            name: varText, 
            price: finalPrice, 
            mrp: finalOriginalPrice || Math.round(finalPrice * 1.2),
            stock: 10 
          });
        }
      }
    });
    
    // Method 2: Get from color/shade dropdown
    $('#variation_color_name li, .a-dropdown-color select option, #variation_color select option').each((i, el) => {
      let varText = $(el).text().trim();
      if (varText && varText !== 'Select' && varText !== 'Choose' && varText.length < 30) {
        if (!variations.find(v => v.name === varText)) {
          variations.push({ 
            name: varText, 
            price: finalPrice, 
            mrp: finalOriginalPrice || Math.round(finalPrice * 1.2),
            stock: 10 
          });
        }
      }
    });
    
    // Method 3: Get from twister swatches (size/color buttons)
    $('.twisterSwatchWrapper .swatchElement, .a-button-stack .a-button').each((i, el) => {
      let varText = $(el).find('.a-button-text, .swatchTitle').text().trim();
      if (varText && varText.length < 30 && varText.length > 0) {
        if (!variations.find(v => v.name === varText)) {
          variations.push({ 
            name: varText, 
            price: finalPrice, 
            mrp: finalOriginalPrice || Math.round(finalPrice * 1.2),
            stock: 10 
          });
        }
      }
    });
    
    // Method 4: Extract sizes from description (ml, g, kg, L)
    if (variations.length === 0) {
      const sizePattern = /(\d+(?:\.\d+)?)\s*(ml|g|kg|L|mg|gm)/gi;
      const foundSizes = [];
      let match;
      while ((match = sizePattern.exec(fullText)) !== null) {
        const size = match[1] + match[2];
        if (!foundSizes.includes(size)) {
          foundSizes.push(size);
        }
      }
      foundSizes.slice(0, 8).forEach(size => {
        variations.push({ 
          name: size, 
          price: finalPrice, 
          mrp: finalOriginalPrice || Math.round(finalPrice * 1.2),
          stock: 10 
        });
      });
    }
    
    // Method 5: Extract shades/colors from description
    if (variations.length === 0) {
      const shadePattern = /(Fair|Light|Medium|Tan|Deep|Red|Pink|Nude|Coral|Berry|Mauve|Brown|Black|Purple|Blue|Green|Yellow|Orange|Rose|Maroon|Teal|Beige|Ivory|Warm|Cool|Neutral)/gi;
      const foundShades = [];
      let shadeMatch;
      while ((shadeMatch = shadePattern.exec(fullText)) !== null) {
        const shade = shadeMatch[1];
        if (!foundShades.includes(shade)) {
          foundShades.push(shade);
        }
      }
      foundShades.slice(0, 8).forEach(shade => {
        variations.push({ 
          name: shade, 
          price: finalPrice, 
          mrp: finalOriginalPrice || Math.round(finalPrice * 1.2),
          stock: 10 
        });
      });
    }
    
    // ========== 11. 🔥 CUSTOM VARIATIONS GENERATION (FALLBACK) ==========
    if (variations.length === 0) {
      const text = name.toLowerCase();
      if (text.includes('serum') || text.includes('cream') || text.includes('lotion') || text.includes('moisturizer')) {
        variations = [
          { name: '30ml', price: finalPrice, mrp: Math.round(finalPrice * 1.2), stock: 10 },
          { name: '50ml', price: Math.round(finalPrice * 1.4), mrp: Math.round(finalPrice * 1.68), stock: 10 },
          { name: '100ml', price: Math.round(finalPrice * 2.2), mrp: Math.round(finalPrice * 2.64), stock: 10 }
        ];
      } else if (text.includes('shampoo') || text.includes('conditioner') || text.includes('oil')) {
        variations = [
          { name: '200ml', price: finalPrice, mrp: Math.round(finalPrice * 1.2), stock: 10 },
          { name: '400ml', price: Math.round(finalPrice * 1.6), mrp: Math.round(finalPrice * 1.92), stock: 10 },
          { name: '1L', price: Math.round(finalPrice * 2.5), mrp: Math.round(finalPrice * 3), stock: 10 }
        ];
      } else if (text.includes('lipstick') || text.includes('foundation')) {
        variations = [
          { name: 'Standard', price: finalPrice, mrp: finalOriginalPrice || Math.round(finalPrice * 1.2), stock: 10 }
        ];
      } else if (text.includes('face wash') || text.includes('cleanser')) {
        variations = [
          { name: '100ml', price: finalPrice, mrp: Math.round(finalPrice * 1.2), stock: 10 },
          { name: '200ml', price: Math.round(finalPrice * 1.5), mrp: Math.round(finalPrice * 1.8), stock: 10 }
        ];
      } else {
        variations = [
          { name: 'Standard', price: finalPrice, mrp: finalOriginalPrice || Math.round(finalPrice * 1.2), stock: 10 },
          { name: 'Premium', price: Math.round(finalPrice * 1.3), mrp: Math.round(finalPrice * 1.56), stock: 10 }
        ];
      }
    }
    
    // ========== 12. CATEGORY DETECTION ==========
    const detectCategory = (productName, productDesc) => {
      const text = (productName + ' ' + productDesc).toLowerCase();
      const categoryKeywords = {
        'Skincare': ['face wash', 'cleanser', 'serum', 'moisturizer', 'sunscreen', 'cream', 'lotion', 'toner', 'face mask', 'eye cream', 'scrub', 'exfoliator'],
        'Makeup': ['lipstick', 'foundation', 'kajal', 'eyeshadow', 'blush', 'mascara', 'highlighter', 'concealer', 'primer', 'compact', 'lip gloss'],
        'Hair': ['shampoo', 'conditioner', 'hair oil', 'hair serum', 'hair mask', 'hair color', 'hair spray', 'dandruff', 'hair fall'],
        'Clothing': ['dress', 'top', 'kurti', 'saree', 'jeans', 't-shirt', 'shirt', 'jacket', 'lehenga', 'salwar'],
        'Accessories': ['bag', 'jewelry', 'watch', 'sunglasses', 'belt', 'scarf', 'wallet', 'earrings', 'necklace']
      };
      
      for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        for (const keyword of keywords) {
          if (text.includes(keyword)) return cat;
        }
      }
      return 'Skincare';
    };
    
    // ========== 13. SUBCATEGORY DETECTION ==========
    const detectSubCategory = (productName, productDesc, category) => {
      const text = (productName + ' ' + productDesc).toLowerCase();
      const subCatMap = {
        'Skincare': ['Face Wash', 'Cleanser', 'Serum', 'Moisturizer', 'Sunscreen', 'Face Mask', 'Eye Cream', 'Toner', 'Face Scrub', 'Lip Balm', 'Body Lotion'],
        'Makeup': ['Foundation', 'Lipstick', 'Kajal', 'Eyeshadow', 'Blush', 'Mascara', 'Highlighter', 'Concealer', 'Primer', 'Compact', 'Lip Gloss'],
        'Hair': ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Serum', 'Hair Mask', 'Hair Color', 'Hair Spray', 'Anti Dandruff', 'Hair Fall Control'],
        'Clothing': ['Dress', 'Top', 'Kurti', 'Saree', 'Jeans', 'T-Shirt', 'Jacket', 'Lehenga', 'Shorts', 'Skirt'],
        'Accessories': ['Bag', 'Jewelry', 'Watch', 'Sunglasses', 'Belt', 'Scarf', 'Wallet', 'Earrings', 'Necklace']
      };
      
      const subCats = subCatMap[category] || [];
      for (const sub of subCats) {
        if (text.includes(sub.toLowerCase())) return sub;
      }
      return '';
    };
    
    // ========== 14. FINISH / COVERAGE DETECTION (for Makeup) ==========
    let finish = '';
    let coverage = '';
    const descriptionText = descriptionArray.join(' ');
    const detectedCategory = detectCategory(name, descriptionText);
    
    if (detectedCategory === 'Makeup') {
      const finishKeywords = ['matte', 'glossy', 'satin', 'shimmer', 'dewy', 'metallic', 'creamy', 'velvet', 'liquid', 'powder'];
      for (const f of finishKeywords) {
        if (fullText.toLowerCase().includes(f)) {
          finish = f.charAt(0).toUpperCase() + f.slice(1);
          break;
        }
      }
      
      const coverageKeywords = ['light', 'medium', 'full', 'sheer', 'buildable'];
      for (const c of coverageKeywords) {
        if (fullText.toLowerCase().includes(c)) {
          coverage = c.charAt(0).toUpperCase() + c.slice(1);
          break;
        }
      }
    }
    
    // ========== 15. HAIR TYPE DETECTION (for Hair) ==========
    let hairType = 'all';
    if (detectedCategory === 'Hair') {
      const hairTypeKeywords = {
        'oily': ['oily hair', 'oil control', 'clarifying', 'greasy'],
        'dry': ['dry hair', 'hydrating', 'nourishing', 'damaged', 'brittle'],
        'curly': ['curly hair', 'waves', 'curls', 'coils', 'wavy'],
        'straight': ['straight hair', 'sleek', 'smoothing', 'frizz control'],
        'normal': ['normal hair', 'daily use', 'everyday']
      };
      for (const [type, keywords] of Object.entries(hairTypeKeywords)) {
        for (const keyword of keywords) {
          if (fullText.toLowerCase().includes(keyword)) {
            hairType = type;
            break;
          }
        }
      }
    }
    
    // ========== 16. HAIR CONCERNS DETECTION ==========
    const hairConcernsMap = {
      'Hairfall': ['hair fall', 'hair loss', 'falling hair', 'thinning', 'shedding'],
      'Dandruff': ['dandruff', 'flaky scalp', 'dry scalp', 'itching', 'scalp buildup'],
      'Dry Hair': ['dry hair', 'brittle hair', 'rough hair', 'unmanageable'],
      'Frizzy Hair': ['frizzy', 'unruly', 'flyaway', 'frizz control'],
      'Split Ends': ['split ends', 'damaged ends', 'breakage'],
      'Hair Growth': ['hair growth', 'grow hair', 'longer hair', 'density', 'volume'],
      'Volume': ['volume', 'volumizing', 'thin hair', 'fullness', 'body']
    };
    
    const detectedHairConcerns = [];
    for (const [concern, keywords] of Object.entries(hairConcernsMap)) {
      for (const keyword of keywords) {
        if (fullText.toLowerCase().includes(keyword)) {
          detectedHairConcerns.push(concern);
          break;
        }
      }
    }
    
    const detectedSubCategory = detectSubCategory(name, descriptionText, detectedCategory);
    
    return {
      name,
      brand: brand || '',
      price: finalPrice,
      originalPrice: finalOriginalPrice,
      images: [...new Set(images)].slice(0, 5),
      description: descriptionArray,
      keyFeatures: keyFeaturesArray.slice(0, 10),
      detectedCategory: detectedCategory,
      detectedSubCategory: detectedSubCategory,
      variations: variations.slice(0, 15),
      // 🔥 New fields
      ingredients: ingredients,
      skinType: skinType,
      concerns: detectedConcerns.slice(0, 5),
      finish: finish,
      coverage: coverage,
      hairType: hairType,
      hairConcerns: detectedHairConcerns.slice(0, 5)
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
    
    res.json({
      success: true,
      scraped: scrapedData,
      message: 'Product details fetched successfully!'
    });
    
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
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
