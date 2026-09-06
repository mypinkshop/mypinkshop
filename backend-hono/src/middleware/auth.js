// src/middleware/auth.js (Hono Version)
import { verify } from 'hono/jwt';

// ========== PROTECT MIDDLEWARE ==========
export const protect = async (c, next) => {
  let token;

  // Get token from Authorization header
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      token = authHeader.split(' ')[1];
      
      // Log: Token mila ya nahi
      console.log('🔑 Auth Check - Token Received:', token ? 'YES' : 'NO');

      // Verify JWT token
      const decoded = await verify(token, c.env.JWT_SECRET);
      
      // Log: JWT verify ho gaya
      console.log('✅ JWT Verified for ID:', decoded.id);

      // Fetch user from D1 database
      const user = await c.env.DB.prepare(
        'SELECT id, name, email, role, isEmailVerified, isActive FROM users WHERE id = ?'
      ).bind(decoded.id).first();
      
      // Safety check: Agar user exist nahi karta
      if (!user) {
        console.log('⚠️ User not found in DB for ID:', decoded.id);
        return c.json({ message: 'Not authorized, user not found' }, 401);
      }

      // Check if user is active
      if (user.isActive === 0) {
        console.log('⚠️ User account is disabled:', user.email);
        return c.json({ message: 'Account disabled. Please contact support.' }, 401);
      }

      console.log('✅ User Authenticated:', user.email);
      
      // Set user in context
      c.set('user', user);
      
      return next(); // IMPORTANT: 'return' use karna zaroori hai
      
    } catch (error) {
      // 🔥 Error ko poora log karein taaki Cloudflare logs mein dikhe
      console.error('❌ CRITICAL AUTH ERROR:', error.message);
      
      // Different error messages for different JWT errors
      if (error.message === 'invalid token' || error.message === 'jwt malformed') {
        return c.json({ message: 'Invalid token format' }, 401);
      } else if (error.message === 'jwt expired') {
        return c.json({ message: 'Token expired. Please login again.' }, 401);
      } else {
        return c.json({ message: 'Not authorized, token failed' }, 401);
      }
    }
  } else {
    console.log('❌ No Token in Headers');
    return c.json({ message: 'Not authorized, no token' }, 401);
  }
};

// ========== ADMIN MIDDLEWARE ==========
export const adminMiddleware = async (c, next) => {
  const user = c.get('user');
  
  if (user && user.role === 'admin') {
    await next();
  } else {
    return c.json({ message: 'Admin access required' }, 403);
  }
};

// ========== VENDOR MIDDLEWARE ==========
export const vendorMiddleware = async (c, next) => {
  const user = c.get('user');
  
  if (user && (user.role === 'vendor' || user.role === 'admin')) {
    await next();
  } else {
    return c.json({ message: 'Vendor access required' }, 403);
  }
};

// ========== BUYER MIDDLEWARE ==========
export const buyerMiddleware = async (c, next) => {
  const user = c.get('user');
  
  if (user && user.role === 'buyer') {
    await next();
  } else {
    return c.json({ message: 'Buyer access required' }, 403);
  }
};

// ========== VERIFIED USER MIDDLEWARE ==========
export const verifiedMiddleware = async (c, next) => {
  const user = c.get('user');
  
  if (user && user.isEmailVerified === 1) {
    await next();
  } else {
    return c.json({ message: 'Please verify your email first' }, 403);
  }
};

// ========== OPTIONAL: ROLES BASED MIDDLEWARE ==========
export const roleMiddleware = (allowedRoles) => {
  return async (c, next) => {
    const user = c.get('user');
    
    if (user && allowedRoles.includes(user.role)) {
      await next();
    } else {
      return c.json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      }, 403);
    }
  };
};

// ========== COMBINED MIDDLEWARE ==========
export const authMiddleware = {
  protect,
  admin: adminMiddleware,
  vendor: vendorMiddleware,
  buyer: buyerMiddleware,
  verified: verifiedMiddleware,
  roles: roleMiddleware
};
