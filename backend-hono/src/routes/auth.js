import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail, updateUser } from '../db/queries.js';
import { generateToken, generateRefreshToken, verifyToken } from '../middleware/auth.js';

const auth = new Hono();

auth.post('/register', async (c) => {
  const { name, email, password, phone } = await c.req.json();
  
  const existingUser = await getUserByEmail(c.env, email);
  if (existingUser) {
    return c.json({ error: 'User already exists' }, 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const userId = await createUser(c.env, {
    name,
    email,
    password: hashedPassword,
    phone
  });

  const token = await generateToken({ id: userId, email, role: 'user' }, c.env.JWT_SECRET);
  const refreshToken = await generateRefreshToken({ id: userId, email }, c.env.JWT_SECRET);
  await updateUser(c.env, userId, { refresh_token: refreshToken });
  
  return c.json({
    success: true,
    token,
    refreshToken,
    user: { id: userId, name, email, role: 'user' }
  });
});

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  
  const user = await getUserByEmail(c.env, email);
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = await generateToken({ id: user.id, email: user.email, role: user.role }, c.env.JWT_SECRET);
  const refreshToken = await generateRefreshToken({ id: user.id, email: user.email }, c.env.JWT_SECRET);
  await updateUser(c.env, user.id, { refresh_token: refreshToken });
  
  return c.json({
    success: true,
    token,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

auth.post('/refresh', async (c) => {
  const { refreshToken } = await c.req.json();
  if (!refreshToken) {
    return c.json({ error: 'Refresh token required' }, 400);
  }

  const payload = await verifyToken(refreshToken, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ error: 'Invalid refresh token' }, 401);
  }

  const user = await getUserByEmail(c.env, payload.email);
  if (!user || user.refresh_token !== refreshToken) {
    return c.json({ error: 'Invalid refresh token' }, 401);
  }

  const newToken = await generateToken({ id: user.id, email: user.email, role: user.role }, c.env.JWT_SECRET);
  const newRefreshToken = await generateRefreshToken({ id: user.id, email: user.email }, c.env.JWT_SECRET);
  await updateUser(c.env, user.id, { refresh_token: newRefreshToken });

  return c.json({
    success: true,
    token: newToken,
    refreshToken: newRefreshToken
  });
});

auth.post('/logout', async (c) => {
  const { refreshToken } = await c.req.json();
  if (refreshToken) {
    const payload = await verifyToken(refreshToken, c.env.JWT_SECRET);
    if (payload) {
      const user = await getUserByEmail(c.env, payload.email);
      if (user) {
        await updateUser(c.env, user.id, { refresh_token: null });
      }
    }
  }
  return c.json({ success: true });
});

export default auth;
