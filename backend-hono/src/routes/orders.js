import { Hono } from 'hono';
import { 
  createOrder, getOrdersByUser, getOrderById, updateOrderStatus,
  updatePaymentStatus, getOrderStats, getAllOrders
} from '../db/queries.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const orders = new Hono();

orders.post('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const orderData = await c.req.json();
  orderData.user_id = user.id;
  
  const result = await createOrder(c.env, orderData);
  return c.json({ success: true, orderId: result.id, orderNumber: result.orderNumber });
});

orders.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const orders = await getOrdersByUser(c.env, user.id);
  return c.json({ success: true, orders });
});

orders.get('/all', authMiddleware, adminOnly, async (c) => {
  const limit = parseInt(c.req.query('limit')) || 20;
  const offset = parseInt(c.req.query('offset')) || 0;
  const orders = await getAllOrders(c.env, limit, offset);
  return c.json({ success: true, orders });
});

orders.get('/stats', authMiddleware, adminOnly, async (c) => {
  const stats = await getOrderStats(c.env);
  return c.json({ success: true, stats });
});

orders.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const order = await getOrderById(c.env, id);
  if (!order) {
    return c.json({ error: 'Order not found' }, 404);
  }
  return c.json({ success: true, order });
});

orders.put('/:id/status', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();
  await updateOrderStatus(c.env, id, status);
  return c.json({ success: true });
});

orders.put('/:id/payment-status', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();
  await updatePaymentStatus(c.env, id, status);
  return c.json({ success: true });
});

export default orders;
