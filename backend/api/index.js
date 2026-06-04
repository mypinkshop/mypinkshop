const express = require('express');
const cors = require('cors');

const app = express();

// Simple CORS
app.use(cors());
app.use(express.json());

// ========== SIMPLE ROUTES ==========

app.get('/', (req, res) => {
  res.json({ 
    message: 'API is running!',
    status: 'alive',
    time: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Server is healthy',
    time: new Date().toISOString()
  });
});

app.get('/api/offers/active-offer', (req, res) => {
  res.json({
    title: 'Free Shipping',
    description: 'FREE SHIPPING ON ORDERS ABOVE ₹499 • EXTRA 10% OFF',
    discountValue: 10,
    minOrderValue: 499
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Test route working!',
    env_check: {
      mongo_uri: !!process.env.MONGO_URI,
      jwt: !!process.env.JWT_SECRET
    }
  });
});

module.exports = app;
