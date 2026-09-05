import { Hono } from 'hono';
import { getAllUsers, updateUserRole, deleteUser } from '../db/queries.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const admin = new Hono();

admin.get('/users', authMiddleware, adminOnly, async (c) => {
  const limit = parseInt(c.req.query('limit')) || 20;
  const offset = parseInt(c.req.query('offset')) || 0;
  const users = await getAllUsers(c.env, limit, offset);
  return c.json({ success: true, users });
});

admin.put('/users/:id/role', authMiddleware, adminOnly, async (c) => {
  const id = c.req.param('id');
  const { role } = await c.req.json();
  await updateUserRole(c.env, id, role);
  return c.json({ success: true });
});

admin.delete('/users/:id', authMiddleware, adminOnly, async (c) => {
  const id = c.req.param('id');
  await deleteUser(c.env, id);
  return c.json({ success: true });
});

export default admin;
