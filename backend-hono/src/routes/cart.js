import { Hono } from 'hono';
import { getCartByUser, addToCart, updateCartQuantity, removeFromCart, clearCart } from '../db/queries.js';
import { authMiddleware } from '../middleware/auth.js';

const cart = new Hono();

cart.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const items = await getCartByUser(c.env, user.id);
  return c.json({ success: true, cart: items });
});

cart.post('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const { product_id, quantity } = await c.req.json();
  
  const id = await addToCart(c.env, { user_id: user.id, product_id, quantity });
  return c.json({ success: true, id });
});

cart.put('/:productId', authMiddleware, async (c) => {
  const user = c.get('user');
  const productId = c.req.param('productId');
  const { quantity } = await c.req.json();
  
  await updateCartQuantity(c.env, user.id, productId, quantity);
  return c.json({ success: true });
});

cart.delete('/:productId', authMiddleware, async (c) => {
  const user = c.get('user');
  const productId = c.req.param('productId');
  
  await removeFromCart(c.env, user.id, productId);
  return c.json({ success: true });
});

cart.delete('/', authMiddleware, async (c) => {
  const user = c.get('user');
  await clearCart(c.env, user.id);
  return c.json({ success: true });
});

export default cart;
