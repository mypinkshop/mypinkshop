const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Log: Token mila ya nahi
      console.log('🔑 Auth Check - Token Received:', token ? 'YES' : 'NO');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Log: JWT verify ho gaya
      console.log('✅ JWT Verified for ID:', decoded.id);

      req.user = await User.findById(decoded.id).select('-password');
      
      // Safety check: Agar user exist nahi karta
      if (!req.user) {
        console.log('⚠️ User not found in DB for ID:', decoded.id);
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      console.log('✅ User Authenticated:', req.user.email);
      return next(); // IMPORTANT: 'return' use karna zaroori hai
    } catch (error) {
      // 🔥 Error ko poora log karein taaki Vercel mein dikhe
      console.error('❌ CRITICAL AUTH ERROR:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    console.log('❌ No Token in Headers');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

const vendorMiddleware = (req, res, next) => {
  if (req.user && (req.user.role === 'vendor' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Vendor access required' });
  }
};

module.exports = { protect, adminMiddleware, vendorMiddleware };
