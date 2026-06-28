const Offer = require('../models/Offer');

export default async function handler(req, res) {
  // ✅ CORS Headers
  res.setHeader('Access-Control-Allow-Origin', 'https://www.mypinkshop.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
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
    
    res.status(200).json(offer || {
      title: 'Free Shipping',
      description: 'FREE SHIPPING ON ORDERS ABOVE ₹499 • EXTRA 10% OFF ON FIRST ORDER',
      discountValue: 10,
      minOrderValue: 499
    });
  } catch (error) {
    console.error('❌ Offer error:', error);
    // ✅ Error me bhi 200 + fallback (CORS friendly)
    res.status(200).json({
      title: 'Free Shipping',
      description: 'FREE SHIPPING ON ORDERS ABOVE ₹499 • EXTRA 10% OFF ON FIRST ORDER',
      discountValue: 10,
      minOrderValue: 499
    });
  }
}
