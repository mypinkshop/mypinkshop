const express = require('express');
const cors = require('cors');

const app = express();

// Simple CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ========== SIMPLE TEST ROUTES ==========

app.get('/', (req, res) => {
  res.json({ 
    message: '🎀 MyPinkShop API is running!',
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
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

app.get('/api/ping', (req, res) => {
  res.json({ 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel
module.exports = app;
