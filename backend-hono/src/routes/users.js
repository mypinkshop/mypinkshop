import { Hono } from 'hono';
import { getUserById, updateUser } from '../db/queries.js';
import { authMiddleware } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const users = new Hono();

users.get('/profile', authMiddleware, async (c) => {
  const user = c.get('user');
  const userData = await getUserById(c.env, user.id);
  return c.json({ success: true, user: userData });
});

users.put('/profile', authMiddleware, async (c) => {
  const user = c.get('user');
  const data = await c.req.json();
  
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  
  await updateUser(c.env, user.id, data);
  return c.json({ success: true });
});

export default users;
