import { Hono } from 'hono';
import { getOrderStats } from '../db/queries.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const dashboard = new Hono();

dashboard.get('/stats', authMiddleware, adminOnly, async (c) => {
  const stats = await getOrderStats(c.env);
  return c.json({ success: true, stats });
});

export default dashboard;
