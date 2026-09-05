import { Hono } from 'hono';
import { createReview, getReviewsByProduct, deleteReview } from '../db/queries.js';
import { authMiddleware } from '../middleware/auth.js';

const reviews = new Hono();

reviews.get('/product/:productId', async (c) => {
  const productId = c.req.param('productId');
  const reviewList = await getReviewsByProduct(c.env, productId);
  return c.json({ success: true, reviews: reviewList });
});

reviews.post('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const data = await c.req.json();
  data.user_id = user.id;
  
  const id = await createReview(c.env, data);
  return c.json({ success: true, id });
});

reviews.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  await deleteReview(c.env, id);
  return c.json({ success: true });
});

export default reviews;
