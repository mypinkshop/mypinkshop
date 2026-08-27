const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// ✅ MUST BE FIRST! /user route ko sabse pehle likhein
router.get('/user', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    console.log('📦 Fetching orders for user ID:', req.user._id);

    // ✅ Yahan 'buyerId' ki jagah 'userId' use karein
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });

    console.log(`✅ Found ${orders.length} orders`);
    res.json(orders);
  } catch (error) {
    console.error('❌ CRITICAL ERROR in /api/orders/user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// ✅ THEN :id route aayega
router.get('/:id', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // ✅ Yahan bhi 'buyerId' ki jagah 'userId' use karein
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('❌ Error fetching order:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

// ✅ POST /api/orders
router.post('/', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { items, total, address, paymentMethod, shippingAddress, buyerAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    const orderNumber = `MPS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const order = new Order({
      orderNumber,
      buyerId: req.user._id, // ✅ BOTH buyerId AUR userId yahan set karo!
      userId: req.user._id,  // ✅ Yahan bhi userId!
      buyerName: req.user.name || address?.fullName || 'Customer',
      buyerEmail: req.user.email,
      buyerPhone: req.user.phone || address?.phone || '',
      buyerAddress: buyerAddress || shippingAddress || address || {},
      vendorId: items[0]?.vendorId || null,
      vendorName: items[0]?.vendorName || 'Vendor',
      productId: items[0]?.productId,
      productName: items[0]?.name,
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      price: items[0]?.price || 0,
      total: total || items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'pending',
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: 'pending',
      orderDate: new Date(),
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        variationName: item.variationName,
        variationSecondary: item.variationSecondary,
        vendorId: item.vendorId || null
      }))
    });

    await order.save();

    res.status(201).json({ success: true, message: 'Order placed successfully', order });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// ✅ PATCH /api/orders/:id/cancel
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status === 'delivered') {
      return res.status(400).json({ success: false, message: 'Cannot cancel delivered order' });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order already cancelled' });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();

    res.json({ success: true, message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
});

// ✅ PATCH /api/orders/:id/status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.json({ success: true, message: `Order status updated to ${status}`, order });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

module.exports = router;
