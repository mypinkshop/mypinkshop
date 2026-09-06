// src/index.js
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import vendorRoutes from './routes/vendors.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import reviewRoutes from './routes/reviews.js';
import wishlistRoutes from './routes/wishlist.js';
import cartRoutes from './routes/cart.js';
import addressRoutes from './routes/addresses.js';
import bannerRoutes from './routes/banners.js';
import offerRoutes from './routes/offers.js';
import couponRoutes from './routes/coupons.js';
import shippingRoutes from './routes/shipping.js';
import adminRoutes from './routes/admin.js';
import dashboardRoutes from './routes/dashboard.js';
import walletRoutes from './routes/wallet.js';
import adRoutes from './routes/ads.js';
import notificationRoutes from './routes/notifications.js';
import otpRoutes from './routes/otp.js';
import paymentRoutes from './routes/payment.js';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());

// CORS
app.use('*', cors({
  origin: [
    'https://mypinkshop.com',
    'https://www.mypinkshop.com',
    'https://api.mypinkshop.com',
    'https://mypinkshop.pages.dev',
    'https://mypinkshop.vercel.app',
    'http://localhost:3000',
    'http://localhost:8081'
  ],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    message: '🎀 MyPinkShop API is running!',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (c) => {
  try {
    // Check D1 connection
    await c.env.DB.prepare('SELECT 1').run();
    return c.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      status: 'ok',
      database: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/vendor', vendorRoutes);
app.route('/api/products', productRoutes);
app.route('/api/orders', orderRoutes);
app.route('/api/reviews', reviewRoutes);
app.route('/api/wishlist', wishlistRoutes);
app.route('/api/cart', cartRoutes);
app.route('/api/addresses', addressRoutes);
app.route('/api/banners', bannerRoutes);
app.route('/api/offers', offerRoutes);
app.route('/api/coupons', couponRoutes);
app.route('/api/shipping', shippingRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/wallet', walletRoutes);
app.route('/api/ads', adRoutes);
app.route('/api/notifications', notificationRoutes);
app.route('/api/brand-applications', brandApplicationRoutes);
app.route('/api/otp', otpRoutes);
app.route('/api/payments', paymentRoutes);

// Sitemap
app.get('/api/sitemap.xml', async (c) => {
  const sitemap = await generateSitemap(c.env.DB);
  c.header('Content-Type', 'application/xml');
  return c.body(sitemap);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: `Route ${c.req.path} not found`
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Global error:', err);
  return c.json({
    success: false,
    error: err.message || 'Something went wrong!'
  }, 500);
});

export default app;
