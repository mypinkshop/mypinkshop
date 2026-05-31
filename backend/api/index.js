const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');  // ✅ ADD THIS LINE

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ========== SCHEMAS ========== (Same as yours - no change)

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
  vendorName: { type: String, default: '' },
  name: { type: String, required: true },
  brand: { type: String, default: '' },
  category: { type: String, required: true },
  mainCategory: { type: String, default: '' },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  emoji: { type: String, default: '🛍️' },
  badge: { type: String, default: '' },
  rating: { type: Number, default: 4.5 },
  stock: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  adminApproved: { type: Boolean, default: true },
  images: { type: [String], default: [] },
  shortDescription: { type: String, default: '' },
  description: { type: String, default: '' },
  keyFeatures: { type: [String], default: [] },
  specifications: { type: Object, default: {} },
  weight: { type: String, default: '' },
  dimensions: { type: String, default: '' },
  shippingCharges: { type: Number, default: 0 },
  seoTitle: { type: String, default: '' },
  seoDescription: { type: String, default: '' },
  seoKeywords: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

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

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Banner = mongoose.model('Banner', bannerSchema);

// ========== R2 Upload Service ==========
const AWS = require('aws-sdk');
const multer = require('multer');

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

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'), false);
    }
  }
});

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

// MongoDB connection
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

// ========== AUTH MIDDLEWARE (ADD THIS) ==========

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ========== ROUTES ==========

app.get('/', (req, res) => {
  res.json({ 
    message: '🎀 MyPinkShop API is running!',
    status: 'active',
    version: '1.0.0'
  });
});

app.get('/api/health', async (req, res) => {
  await connectDB();
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// ========== AUTH ROUTES (with token generation) ==========

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
    
    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );
    
    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
    
    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== PRODUCT ROUTES (Protected) ==========

app.get('/api/products', authMiddleware, async (req, res) => {
  try {
    await connectDB();
    const products = await Product.find({ status: 'active', adminApproved: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', authMiddleware, async (req, res) => {
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
  if (req.user.role !== 'admin' && req.user.role !== 'vendor') {
    return res.status(403).json({ message: 'Admin or vendor access required' });
  }
  
  try {
    await connectDB();
    
    const product = new Product({
      name: req.body.name,
      brand: req.body.brand || req.body.vendorName || '',
      vendorName: req.body.vendorName || req.body.brand || '',
      category: req.body.category,
      mainCategory: req.body.mainCategory || '',
      price: req.body.price,
      originalPrice: req.body.originalPrice || req.body.price * 1.2,
      stock: req.body.stock || 0,
      images: req.body.images || [],
      shortDescription: req.body.shortDescription || '',
      description: req.body.description || '',
      keyFeatures: req.body.keyFeatures || [],
      specifications: req.body.specifications || {},
      weight: req.body.weight || '',
      dimensions: req.body.dimensions || '',
      shippingCharges: req.body.shippingCharges || 0,
      seoTitle: req.body.seoTitle || '',
      seoDescription: req.body.seoDescription || '',
      seoKeywords: req.body.seoKeywords || '',
      badge: req.body.badge || '',
      rating: req.body.rating || 4.0,
      status: 'active',
      adminApproved: req.user.role === 'admin',
      isNew: true
    });
    
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    if (req.body.stock !== undefined) product.stock = req.body.stock;
    if (req.body.status !== undefined) product.status = req.body.status;
    if (req.body.adminApproved !== undefined) product.adminApproved = req.body.adminApproved;
    if (req.body.price !== undefined) product.price = req.body.price;
    if (req.body.name !== undefined) product.name = req.body.name;
    if (req.body.brand !== undefined) product.brand = req.body.brand;
    
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, error: error.message });
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

// Public - no auth required
app.get('/api/banners/active', async (req, res) => {
  try {
    await connectDB();
    const banners = await Banner.find({ active: true }).sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/banners', authMiddleware, adminMiddleware, upload.array('images', 6), async (req, res) => {
  try {
    await connectDB();
    
    const imageUrls = [];
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToR2(file, 'banners');
        if (result.success) {
          imageUrls.push(result.url);
        }
      }
    }
    
    const banner = new Banner({
      title: req.body.title || '',
      subtitle: req.body.subtitle || '',
      buttonText: req.body.buttonText || '',
      link: req.body.link || '/shop',
      images: imageUrls,
      order: parseInt(req.body.order) || 0,
      active: req.body.active === 'true' || req.body.active === true,
      showTextOverlay: req.body.showTextOverlay === 'true' || req.body.showTextOverlay === true
    });
    
    await banner.save();
    res.json({ success: true, banner });
  } catch (error) {
    console.error('Add banner error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/banners/:id', authMiddleware, adminMiddleware, upload.array('images', 6), async (req, res) => {
  try {
    await connectDB();
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }
    
    banner.title = req.body.title || '';
    banner.subtitle = req.body.subtitle || '';
    banner.buttonText = req.body.buttonText || '';
    banner.link = req.body.link || '/shop';
    banner.order = parseInt(req.body.order) || banner.order;
    banner.active = req.body.active === 'true' || req.body.active === true;
    banner.showTextOverlay = req.body.showTextOverlay === 'true' || req.body.showTextOverlay === true;
    
    if (req.files && req.files.length > 0) {
      const newImageUrls = [];
      for (const file of req.files) {
        const result = await uploadToR2(file, 'banners');
        if (result.success) {
          newImageUrls.push(result.url);
        }
      }
      banner.images = [...banner.images, ...newImageUrls];
    }
    
    await banner.save();
    res.json({ success: true, banner });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/banners/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }
    
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== UPLOAD ROUTE ==========

app.post('/api/upload', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    await connectDB();
    
    const imageUrls = [];
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToR2(file, 'products');
        if (result.success) {
          imageUrls.push(result.url);
        } else {
          console.error('Upload failed:', result.error);
        }
      }
    }
    
    if (imageUrls.length === 0) {
      return res.status(400).json({ success: false, error: 'No images uploaded' });
    }
    
    res.json({ 
      success: true, 
      url: imageUrls[0],
      urls: imageUrls
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = app;
