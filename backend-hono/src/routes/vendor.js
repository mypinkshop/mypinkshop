import { Hono } from 'hono';
import { getProductsByVendor } from '../db/queries.js';
import { authMiddleware, vendorOrAdmin } from '../middleware/auth.js';

const vendor = new Hono();

vendor.get('/products', authMiddleware, vendorOrAdmin, async (c) => {
  const user = c.get('user');
  const limit = parseInt(c.req.query('limit')) || 20;
  const offset = parseInt(c.req.query('offset')) || 0;
  const products = await getProductsByVendor(c.env, user.id, limit, offset);
  return c.json({ success: true, products });
});

export default vendor;
