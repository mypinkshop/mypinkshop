const Offer = require('../models/Offer');

export default async function handler(req, res) {
  // ✅ CORS Headers (Allow multiple origins)
  const allowedOrigins = [
    'https://www.mypinkshop.com',
    'https://mypinkshop.com',
    'https://mypinkshop.vercel.app',
    'http://localhost:3000',
    'http://localhost:8081'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // ✅ Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const currentDate = new Date();
    
    const offer = await Offer.findOne({
      isActive: true,
      type: 'top_banner',
      startDate: { $lte: currentDate },
      $or: [
        { endDate: { $gte: currentDate } },
        { endDate: null }
      ]
    }).sort({ createdAt: -1 });
    
    // ✅ Return offer or default
    res.status(200).json(offer || {
      title: 'Free Shipping',
      description: 'FREE SHIPPING ON ORDERS ABOVE ₹499 • EXTRA 10% OFF ON FIRST ORDER',
      discountValue: 10,
      minOrderValue: 499
    });
    
  } catch (error) {
    console.error('❌ Offer API Error:', error.message);
    console.error('❌ Full error:', error);
    
    // ✅ Always return 200 with fallback, never 500
    res.status(200).json({
      title: 'Free Shipping',
      description: 'FREE SHIPPING ON ORDERS ABOVE ₹499 • EXTRA 10% OFF ON FIRST ORDER',
      discountValue: 10,
      minOrderValue: 499
    });
  }
}
