import { Hono } from 'hono';
import { addToWishlist, getWishlistByUser, removeFromWishlist } from '../db/queries.js';
import { authMiddleware } from '../middleware/auth.js';

const wishlist = new Hono();

wishlist.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const items = await getWishlistByUser(c.env, user.id);
  return c.json({ success: true, wishlist: items });
});

wishlist.post('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const { product_id } = await c.req.json();
  
  const id = await addToWishlist(c.env, { user_id: user.id, product_id });
  return c.json({ success: true, id });
});

wishlist.delete('/:productId', authMiddleware, async (c) => {
  const user = c.get('user');
  const productId = c.req.param('productId');
  
  await removeFromWishlist(c.env, user.id, productId);
  return c.json({ success: true });
});

export default wishlist;
