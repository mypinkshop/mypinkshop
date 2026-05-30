const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ========== SCHEMAS ==========

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
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(enteredPassword, this.password);
};

const productSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vendorName: { type: String },
  name: { type: String, required: true },
  category: { type: String, enum: ['skincare', 'makeup', 'hair', 'clothing', 'accessories'], required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  emoji: { type: String, default: '🛍️' },
  badge: { type: String, default: '' },
  rating: { type: Number, default: 4.5 },
  stock: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  adminApproved: { type: Boolean, default: true },
  images: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

// ✅ Banner Schema (NEW)
const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  buttonText: { type: String, default: 'Shop Now' },
  link: { type: String, default: '/shop' },
  image: { type: String, default: '' },
  imageKey: { type: String, default: '' },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Register models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Banner = mongoose.model('Banner', bannerSchema);

// ========== R2 Upload Service ==========
const AWS = require('aws-sdk');
const multer = require('multer');

// Configure R2
const s3 = new AWS.S3({
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'auto',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

// Multer setup (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'), false);
    }
  }
});

// Upload to R2 function
const uploadToR2 = async (file, folder = 'banners') => {
  try {
    const extension = file.originalname.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'public, max-age=31536000'
    };
    
    const result = await s3.upload(params).promise();
    return {
      success: true,
      url: `${PUBLIC_URL}/${fileName}`,
      key: fileName
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    return { success: false, error: error.message };
  }
};

// Delete from R2 function
const deleteFromR2 = async (key) => {
  try {
    await s3.deleteObject({
      Bucket: BUCKET_NAME,
      Key: key
    }).promise();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// MongoDB connection (cached for serverless)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('=> Using cached database connection');
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
  }
};

// ========== ROUTES ==========

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: '🎀 MyPinkShop API is running!',
    status: 'active',
    version: '1.0.0'
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  await connectDB();
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// ========== PRODUCT ROUTES ==========

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    await connectDB();
    const products = await Product.find({ status: 'active', adminApproved: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID
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

// ========== BANNER ROUTES (NEW with R2) ==========

// Get all banners (for admin)
app.get('/api/banners', async (req, res) => {
  try {
    await connectDB();
    const banners = await Banner.find().sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active banners (for homepage)
app.get('/api/banners/active', async (req, res) => {
  try {
    await connectDB();
    const banners = await Banner.find({ active: true }).sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new banner with image
app.post('/api/banners', upload.single('image'), async (req, res) => {
  try {
    await connectDB();
    
    let imageUrl = '';
    let imageKey = '';
    
    if (req.file) {
      const result = await uploadToR2(req.file, 'banners');
      if (result.success) {
        imageUrl = result.url;
        imageKey = result.key;
      } else {
        return res.status(500).json({ success: false, error: result.error });
      }
    }
    
    const banner = new Banner({
      title: req.body.title,
      subtitle: req.body.subtitle || '',
      buttonText: req.body.buttonText || 'Shop Now',
      link: req.body.link || '/shop',
      image: imageUrl,
      imageKey: imageKey,
      order: parseInt(req.body.order) || 0,
      active: req.body.active === 'true' || req.body.active === true
    });
    
    await banner.save();
    res.json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update banner
app.put('/api/banners/:id', upload.single('image'), async (req, res) => {
  try {
    await connectDB();
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }
    
    banner.title = req.body.title || banner.title;
    banner.subtitle = req.body.subtitle || banner.subtitle;
    banner.buttonText = req.body.buttonText || banner.buttonText;
    banner.link = req.body.link || banner.link;
    banner.order = parseInt(req.body.order) || banner.order;
    banner.active = req.body.active === 'true' || req.body.active === true;
    
    if (req.file) {
      if (banner.imageKey) {
        await deleteFromR2(banner.imageKey);
      }
      const result = await uploadToR2(req.file, 'banners');
      if (result.success) {
        banner.image = result.url;
        banner.imageKey = result.key;
      }
    }
    
    await banner.save();
    res.json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete banner
app.delete('/api/banners/:id', async (req, res) => {
  try {
    await connectDB();
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }
    
    if (banner.imageKey) {
      await deleteFromR2(banner.imageKey);
    }
    
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== AUTH ROUTES ==========

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    await connectDB();
    const { name, email, password, role } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'buyer',
    });
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
