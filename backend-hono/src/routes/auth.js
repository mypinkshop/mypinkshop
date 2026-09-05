import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail, updateUser } from '../db/queries.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js';

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

  const token = generateToken({ id: userId, email, role: 'user' });
  const refreshToken = generateRefreshToken({ id: userId, email });
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

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id, email: user.email });
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

  const decoded = verifyRefreshToken(refreshToken, c.env.JWT_SECRET);
  if (!decoded) {
    return c.json({ error: 'Invalid refresh token' }, 401);
  }

  const user = await getUserByEmail(c.env, decoded.email);
  if (!user || user.refresh_token !== refreshToken) {
    return c.json({ error: 'Invalid refresh token' }, 401);
  }

  const newToken = generateToken({ id: user.id, email: user.email, role: user.role });
  const newRefreshToken = generateRefreshToken({ id: user.id, email: user.email });
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
    const decoded = verifyRefreshToken(refreshToken, c.env.JWT_SECRET);
    if (decoded) {
      const user = await getUserByEmail(c.env, decoded.email);
      if (user) {
        await updateUser(c.env, user.id, { refresh_token: null });
      }
    }
  }
  return c.json({ success: true });
});

export default auth;
