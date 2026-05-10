const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @route GET /api/admin/dashboard
// Get admin dashboard stats
router.get('/dashboard', protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVendors = await User.countDocuments({ role: 'vendor' });
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    const pendingVendors = await User.countDocuments({ role: 'vendor', vendorStatus: 'pending' });
    
    // Calculate total earnings (admin commission)
    const orders = await Order.find();
    const totalEarnings = orders.reduce((sum, order) => sum + order.commission, 0);
    
    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('buyerId', 'name email')
      .populate('vendorId', 'name brandName');
    
    res.json({
      totalUsers,
      totalVendors,
      totalBuyers,
      totalProducts,
      totalOrders,
      pendingVendors,
      totalEarnings,
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route GET /api/admin/vendors
// Get all vendors
router.get('/vendors', protect, adminOnly, async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' }).select('-password').sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route PUT /api/admin/vendors/:id/approve
// Approve vendor
router.put('/vendors/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    vendor.vendorStatus = 'approved';
    await vendor.save();
    res.json({ message: 'Vendor approved successfully', vendor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route PUT /api/admin/vendors/:id/block
// Block vendor
router.put('/vendors/:id/block', protect, adminOnly, async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    vendor.vendorStatus = 'blocked';
    await vendor.save();
    
    // Also block all products of this vendor
    await Product.updateMany(
      { vendorId: req.params.id },
      { status: 'inactive' }
    );
    
    res.json({ message: 'Vendor blocked successfully', vendor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route GET /api/admin/products
// Get all products (admin)
router.get('/products', protect, adminOnly, async (req, res) => {
  try {
    const products = await Product.find()
      .populate('vendorId', 'name brandName email')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route PUT /api/admin/products/:id/toggle
// Toggle product status (active/inactive)
router.put('/products/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    product.status = product.status === 'active' ? 'inactive' : 'active';
    await product.save();
    res.json({ message: `Product ${product.status}`, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route GET /api/admin/orders
// Get all orders (admin)
router.get('/orders', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('buyerId', 'name email')
      .populate('vendorId', 'name brandName')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route PUT /api/admin/orders/:id/status
// Update order status (admin)
router.put('/orders/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    order.status = status;
    if (status === 'delivered') {
      order.deliveredDate = new Date();
    }
    await order.save();
    res.json({ message: `Order status updated to ${status}`, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
