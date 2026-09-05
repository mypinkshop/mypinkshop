import { Hono } from 'hono';
import { sign, verify } from 'jose'; // JWT library for Cloudflare Workers

const auth = new Hono();

// Secret key for JWT (use env variable)
const getSecretKey = (c) => {
  return new TextEncoder().encode(c.env.JWT_SECRET || 'YbSNEP0omcxXSjCNQM6hCfnr0zwrpZhZElZgZdONQqI');
};

// Helper: Generate JWT Token
const generateToken = async (id, c) => {
  return await sign(
    { id: id.toString() },
    getSecretKey(c),
    { expiresIn: '30d' }
  );
};

// Helper: Check if password matches (Simple hash comparison using Web Crypto)
const verifyPassword = async (password, hashedPassword) => {
  // NOTE: Ye ek simple example hai. Real implementation mein `bcryptjs` ya Web Crypto API use karni chahiye.
  // Yahan hum assume kar rahe hain ki password plain text mein stored hai (temporary fix ke liye)
  return password === hashedPassword;
};

// @route POST /api/auth/register
auth.post('/register', async (c) => {
  try {
    const { name, email, password, role, brandName, gstNumber, phone } = await c.req.json();

    // Check if user already exists
    const userExists = await c.env.DB.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first();
    if (userExists) {
      return c.json({ message: 'User already exists' }, 400);
    }

    // Create new user in D1
    const result = await c.env.DB.prepare(
      `INSERT INTO users (name, email, password, role, brandName, gstNumber, phone, vendorStatus) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      name,
      email,
      password, // NOTE: Production mein password ko hash karna zaroori hai (jaise bcrypt)
      role || 'buyer',
      brandName || '',
      gstNumber || '',
      phone || '',
      role === 'vendor' ? 'pending' : 'approved'
    ).run();

    const userId = result.meta.last_row_id;

    return c.json({
      _id: userId,
      name,
      email,
      role: role || 'buyer',
      token: await generateToken(userId, c)
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ message: error.message }, 500);
  }
});

// @route POST /api/auth/login
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    // 🔥 TEMPORARY ADMIN BYPASS - Remove after database fix 🔥
    if (email === 'admin@mypinkshop.com' && password === 'admin123') {
      console.log('✅ Admin bypass login successful');
      return c.json({
        _id: 'admin_temp_id_123',
        name: 'Super Admin',
        email: 'admin@mypinkshop.com',
        role: 'admin',
        vendorStatus: 'approved',
        token: await generateToken('admin_temp_id_123', c)
      });
    }

    const user = await c.env.DB.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first();
    if (!user) {
      return c.json({ message: 'Invalid email or password' }, 401);
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return c.json({ message: 'Invalid email or password' }, 401);
    }

    return c.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      vendorStatus: user.vendorStatus,
      token: await generateToken(user.id, c)
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ message: error.message }, 500);
  }
});

// @route GET /api/auth/me
auth.get('/me', async (c) => {
  try {
    // Auth middleware ke through user ko verify karo
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ message: 'No token provided' }, 401);
    }

    const { payload } = await verify(token, getSecretKey(c));
    const user = await c.env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(payload.id).first();
    
    if (!user) {
      return c.json({ message: 'User not found' }, 401);
    }

    // Password field ko response se hatao
    const { password, ...safeUser } = user;
    return c.json(safeUser);
  } catch (error) {
    console.error('Get me error:', error);
    return c.json({ message: 'Invalid token' }, 401);
  }
});

// @route GET /api/auth/vendors (Admin only)
auth.get('/vendors', async (c) => {
  try {
    // Auth middleware ke through user ko verify karo
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ message: 'No token provided' }, 401);
    }

    const { payload } = await verify(token, getSecretKey(c));
    const user = await c.env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(payload.id).first();
    
    if (!user || user.role !== 'admin') {
      return c.json({ message: 'Admin access required' }, 403);
    }

    const { results } = await c.env.DB.prepare(
      `SELECT id, name, email, role, brandName, gstNumber, phone, vendorStatus, createdAt FROM users WHERE role = 'vendor'`
    ).all();

    return c.json(results);
  } catch (error) {
    console.error('Get vendors error:', error);
    return c.json({ message: error.message }, 500);
  }
});

// @route PUT /api/auth/vendors/:id/approve (Admin only)
auth.put('/vendors/:id/approve', async (c) => {
  try {
    // Auth middleware ke through user ko verify karo
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ message: 'No token provided' }, 401);
    }

    const { payload } = await verify(token, getSecretKey(c));
    const user = await c.env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(payload.id).first();
    
    if (!user || user.role !== 'admin') {
      return c.json({ message: 'Admin access required' }, 403);
    }

    const vendor = await c.env.DB.prepare(
      `SELECT * FROM users WHERE id = ?`
    ).bind(parseInt(c.req.param('id'))).first();
    if (!vendor) {
      return c.json({ message: 'Vendor not found' }, 404);
    }

    await c.env.DB.prepare(
      `UPDATE users SET vendorStatus = 'approved' WHERE id = ?`
    ).bind(parseInt(c.req.param('id'))).run();

    return c.json({ message: 'Vendor approved successfully' });
  } catch (error) {
    console.error('Approve vendor error:', error);
    return c.json({ message: error.message }, 500);
  }
});

export default auth;
