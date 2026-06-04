const Offer = require('../models/Offer');

export default async function handler(req, res) {
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
    
    res.json(offer || {
      title: 'Free Shipping',
      description: 'FREE SHIPPING ON ORDERS ABOVE ₹999 • EXTRA 10% OFF ON FIRST ORDER',
      discountValue: 10,
      minOrderValue: 999
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
