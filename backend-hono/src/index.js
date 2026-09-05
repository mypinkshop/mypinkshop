import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import auth from './routes/auth.js';
import products from './routes/products.js';
import orders from './routes/orders.js';
import users from './routes/users.js';
import addresses from './routes/addresses.js';
import reviews from './routes/reviews.js';
import wishlist from './routes/wishlist.js';
import cart from './routes/cart.js';
import admin from './routes/admin.js';
import vendor from './routes/vendor.js';
import dashboard from './routes/dashboard.js';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://mypinkshop.vercel.app', 'https://mypinkshop.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.route('/api/auth', auth);
app.route('/api/products', products);
app.route('/api/orders', orders);
app.route('/api/users', users);
app.route('/api/addresses', addresses);
app.route('/api/reviews', reviews);
app.route('/api/wishlist', wishlist);
app.route('/api/cart', cart);
app.route('/api/admin', admin);
app.route('/api/vendor', vendor);
app.route('/api/dashboard', dashboard);

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

export default app;
