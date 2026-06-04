const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors({
  origin: ['https://mypinkshop.vercel.app', 'https://mypinkshop.com', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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

// ========== Simple Auth Middleware ==========
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

module.exports = app;
