const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// ✅ CORS - Chrome compatible with function-based origin
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://mypinkshop.vercel.app',
      'https://mypinkshop.com',
      'https://www.mypinkshop.com',
      'http://localhost:3000'
    ];
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// ✅ Explicit OPTIONS handler for preflight requests (Chrome CORS Fix)
app.options('*', (req, res) => {
  const allowedOrigins = [
    'https://mypinkshop.vercel.app',
    'https://mypinkshop.com',
    'https://www.mypinkshop.com',
    'http://localhost:3000'
  ];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(200);
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

// ========== User Schema ==========
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

// ========== Product Schema ==========
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, default: '' },
  category: { type: String, required: true },
  mainCategory: { type: String, default: '' },
  price: { type: Number, required: true },
  originalPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  images: { type: [String], default: [] },
  description: { type: String, default: '' },
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
  fabric: { type: String, default: '' },
  material: { type: String, default: '' },
  gender: { type: String, default: 'unisex' },
  weight: { type: String, default: '' },
  dimensions: { type: String, default: '' }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// ========== Banner Schema ==========
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

// ========== Offer Schema ==========
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
  await connectDB();
  res.json({ 
    status: 'ok', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
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
    const product = new Product({
      name: req.body.name,
      brand: req.body.brand || '',
      category: req.body.category,
      mainCategory: req.body.mainCategory || '',
      price: req.body.price,
      originalPrice: req.body.originalPrice || req.body.price * 1.2,
      stock: req.body.stock || 0,
      images: req.body.images || [],
      description: req.body.description || '',
      shortDescription: req.body.shortDescription || '',
      keyFeatures: req.body.keyFeatures || [],
      sizes: req.body.sizes || [],
      colors: req.body.colors || [],
      variants: req.body.variants || [],
      fabric: req.body.fabric || '',
      material: req.body.material || '',
      gender: req.body.gender || 'unisex',
      weight: req.body.weight || '',
      dimensions: req.body.dimensions || '',
      isNew: true,
      status: 'active',
      adminApproved: req.user?.role === 'admin'
    });
    
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
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
    
    if (req.body.stock !== undefined) product.stock = req.body.stock;
    if (req.body.status !== undefined) product.status = req.body.status;
    if (req.body.price !== undefined) product.price = req.body.price;
    if (req.body.name !== undefined) product.name = req.body.name;
    if (req.body.sizes !== undefined) product.sizes = req.body.sizes;
    if (req.body.colors !== undefined) product.colors = req.body.colors;
    if (req.body.variants !== undefined) product.variants = req.body.variants;
    
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
    const banner = new Banner({
      title: req.body.title || '',
      subtitle: req.body.subtitle || '',
      buttonText: req.body.buttonText || '',
      link: req.body.link || '/shop',
      images: req.body.images || [],
      order: req.body.order || 0,
      active: req.body.active !== false,
      showTextOverlay: req.body.showTextOverlay !== false
    });
    
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
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    banner.title = req.body.title || banner.title;
    banner.subtitle = req.body.subtitle || banner.subtitle;
    banner.buttonText = req.body.buttonText || banner.buttonText;
    banner.link = req.body.link || banner.link;
    banner.order = req.body.order !== undefined ? req.body.order : banner.order;
    banner.active = req.body.active !== undefined ? req.body.active : banner.active;
    
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
    const { title, description, discountValue, minOrderValue } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description required' });
    }
    
    const offer = new Offer({
      title,
      description,
      discountValue: discountValue || 10,
      minOrderValue: minOrderValue || 499,
      isActive: true
    });
    
    await offer.save();
    res.status(201).json({ success: true, offer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/offers/update/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const { title, description, discountValue, minOrderValue, isActive } = req.body;
    
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    if (title !== undefined) offer.title = title;
    if (description !== undefined) offer.description = description;
    if (discountValue !== undefined) offer.discountValue = discountValue;
    if (minOrderValue !== undefined) offer.minOrderValue = minOrderValue;
    if (isActive !== undefined) offer.isActive = isActive;
    offer.updatedAt = new Date();
    
    await offer.save();
    res.json({ success: true, offer });
  } catch (error) {
    console.error('Error in update offer:', error);
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

// Shipping settings (in-memory - can be moved to DB later)
let shippingSettings = {
  defaultDays: [3, 7],
  expressDays: [1, 3],
  freeShippingThreshold: 999,
  shippingCharges: 50,
  expressCharges: 99,
  codCharges: 30,
  deliverablePincodes: ['110001', '110002', '110003', '400001', '400002', '560001', '560002', '700001', '600001'],
  cutOffTime: '16:00',
  sundayDelivery: false,
  warehouseAddress: {
    pincode: '110001',
    city: 'New Delhi',
    state: 'Delhi'
  }
};

// 📍 Check delivery availability and get estimated date (Public)
app.post('/api/shipping/check-delivery', async (req, res) => {
  try {
    const { pincode, cartTotal, isExpress } = req.body;
    
    // Check if pincode is serviceable
    const isServiceable = shippingSettings.deliverablePincodes.length === 0 || 
                          shippingSettings.deliverablePincodes.includes(pincode);
    
    if (!isServiceable) {
      return res.json({
        success: false,
        deliverable: false,
        message: 'Sorry, delivery is not available at this pincode yet.'
      });
    }
    
    // Calculate shipping charges
    let shippingCharge = 0;
    let shippingType = 'standard';
    
    if (cartTotal >= shippingSettings.freeShippingThreshold) {
      shippingCharge = 0;
    } else if (isExpress) {
      shippingCharge = shippingSettings.expressCharges;
      shippingType = 'express';
    } else {
      shippingCharge = shippingSettings.shippingCharges;
    }
    
    // Calculate estimated delivery date
    const daysToAdd = isExpress ? shippingSettings.expressDays[1] : shippingSettings.defaultDays[1];
    const minDays = isExpress ? shippingSettings.expressDays[0] : shippingSettings.defaultDays[0];
    
    let estimatedDate = new Date();
    let daysAdded = 0;
    let actualDays = 0;
    
    // Skip Sundays if not available
    while (daysAdded < daysToAdd) {
      estimatedDate.setDate(estimatedDate.getDate() + 1);
      if (estimatedDate.getDay() !== 0 || shippingSettings.sundayDelivery) {
        daysAdded++;
        actualDays++;
      }
    }
    
    const minEstimatedDate = new Date();
    let minDaysAdded = 0;
    while (minDaysAdded < minDays) {
      minEstimatedDate.setDate(minEstimatedDate.getDate() + 1);
      if (minEstimatedDate.getDay() !== 0 || shippingSettings.sundayDelivery) {
        minDaysAdded++;
      }
    }
    
    res.json({
      success: true,
      deliverable: true,
      shippingCharge,
      shippingType,
      estimatedDelivery: {
        minDate: minEstimatedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        maxDate: estimatedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        minDays: minDays,
        maxDays: actualDays
      },
      freeShippingThreshold: shippingSettings.freeShippingThreshold,
      cutOffTime: shippingSettings.cutOffTime
    });
    
  } catch (error) {
    console.error('Delivery check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📦 Get shipping settings (Public - limited info, Admin - full info)
app.get('/api/shipping/settings', async (req, res) => {
  try {
    // Check if user is admin
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === 'admin') {
          return res.json({ success: true, settings: shippingSettings });
        }
      } catch (e) {
        // Token invalid, return public info
      }
    }
    
    // Public info (limited)
    res.json({ 
      success: true, 
      settings: {
        freeShippingThreshold: shippingSettings.freeShippingThreshold,
        cutOffTime: shippingSettings.cutOffTime
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📦 Update shipping settings (Admin only)
app.post('/api/shipping/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    shippingSettings = { ...shippingSettings, ...req.body };
    res.json({ success: true, settings: shippingSettings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = app;
