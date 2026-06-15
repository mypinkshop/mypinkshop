const express = require('express');
const router = express.Router();
const multer = require('multer');
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); // ✅ ADD THIS
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

// ========== Cloudflare R2 for review images ==========
const s3 = new AWS.S3({
  endpoint: `http://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'auto',
  s3ForcePathStyle: true,
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// Auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ========== UPLOAD REVIEW MEDIA ==========
router.post('/upload', authMiddleware, upload.array('media', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedUrls = [];
    for (const file of req.files) {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.originalname.split('.').pop();
      const folder = file.mimetype.startsWith('image/') ? 'review-images' : 'review-videos';
      const filename = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

      const params = {
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      await s3.upload(params).promise();
      uploadedUrls.push(`${PUBLIC_URL}/${filename}`);
    }

    res.json({
      success: true,
      urls: uploadedUrls,
      message: `${uploadedUrls.length} media uploaded successfully`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CHECK IF USER CAN REVIEW ==========
router.get('/can-review/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    
    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.json({ canReview: false, alreadyReviewed: false, orderId: null });
    }
    
    const order = await Order.findOne({
      userId,
      'items.productId': productId,
      status: 'delivered'
    });
    
    const existingReview = await Review.findOne({
      productId,
      userId,
      orderId: order?._id
    });
    
    res.json({
      canReview: !!order && !existingReview,
      alreadyReviewed: !!existingReview,
      orderId: order?._id
    });
  } catch (error) {
    console.error('Can review error:', error);
    res.json({ canReview: false, alreadyReviewed: false, orderId: null });
  }
});

// ========== CREATE REVIEW ==========
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, orderId, rating, title, comment, images, videos } = req.body;
    const userId = req.user.id;
    
    // ✅ Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    const order = await Order.findOne({
      _id: orderId,
      userId,
      'items.productId': productId,
      status: 'delivered'
    });
    
    if (!order) {
      return res.status(403).json({ error: 'You can only review products after delivery' });
    }
    
    const existingReview = await Review.findOne({ productId, userId, orderId });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }
    
    const review = new Review({
      productId,
      userId,
      orderId,
      rating,
      title: title || '',
      comment,
      images: images || [],
      videos: videos || [],
      isVerifiedPurchase: true,
      status: 'pending'
    });
    
    await review.save();
    
    res.status(201).json({
      success: true,
      review,
      message: 'Review submitted successfully! Awaiting admin approval.'
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== GET APPROVED REVIEWS FOR PRODUCT (FIXED) ==========
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // ✅ FIX: Validate ObjectId first
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(200).json({
        reviews: [],
        total: 0,
        page: 1,
        pages: 0,
        averageRating: 0,
        totalReviews: 0
      });
    }
    
    const reviews = await Review.find({
      productId: productId,
      status: 'approved'
    })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
    
    const total = await Review.countDocuments({ 
      productId: productId, 
      status: 'approved' 
    });
    
    // ✅ FIX: Manual average calculation (since static method might not exist)
    let averageRating = 0;
    let totalReviews = 0;
    
    if (total > 0) {
      const avgResult = await Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'approved' } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);
      
      if (avgResult.length > 0) {
        averageRating = Math.round(avgResult[0].avgRating * 10) / 10;
        totalReviews = avgResult[0].count;
      }
    }
    
    res.json({
      reviews: reviews || [],
      total: total || 0,
      page: parseInt(page),
      pages: Math.ceil((total || 0) / limit),
      averageRating: averageRating,
      totalReviews: totalReviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    // ✅ FIX: Return empty data instead of 500 error
    res.status(200).json({
      reviews: [],
      total: 0,
      page: 1,
      pages: 0,
      averageRating: 0,
      totalReviews: 0,
      error: error.message
    });
  }
});

// ========== MARK REVIEW AS HELPFUL ==========
router.patch('/:reviewId/helpful', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    
    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    if (review.helpfulUsers && review.helpfulUsers.includes(userId)) {
      return res.json({ helpful: review.helpful });
    }
    
    review.helpful = (review.helpful || 0) + 1;
    if (!review.helpfulUsers) review.helpfulUsers = [];
    review.helpfulUsers.push(userId);
    await review.save();
    
    res.json({ helpful: review.helpful });
  } catch (error) {
    console.error('Helpful error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== USER: GET MY REVIEWS ==========
router.get('/my-reviews', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const reviews = await Review.find({ userId })
      .populate('productId', 'name images price')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      reviews: reviews || []
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN: GET PENDING REVIEWS ==========
router.get('/admin/pending', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'pending' })
      .populate('userId', 'name email')
      .populate('productId', 'name images')
      .sort({ createdAt: -1 });
    
    res.json(reviews || []);
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN: GET ALL REVIEWS ==========
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    
    const reviews = await Review.find(filter)
      .populate('userId', 'name email')
      .populate('productId', 'name images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments(filter);
    
    res.json({
      reviews: reviews || [],
      total: total || 0,
      page: parseInt(page),
      pages: Math.ceil((total || 0) / limit)
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN: APPROVE REVIEW ==========
router.patch('/admin/:reviewId/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { adminNote } = req.body;
    
    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    review.status = 'approved';
    review.approvedAt = new Date();
    if (adminNote) review.adminNote = adminNote;
    await review.save();
    
    // ✅ Calculate and update product rating
    const avgResult = await Review.aggregate([
      { $match: { productId: review.productId, status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    
    if (avgResult.length > 0) {
      await Product.findByIdAndUpdate(review.productId, {
        rating: Math.round(avgResult[0].avgRating * 10) / 10,
        reviewCount: avgResult[0].count
      });
    }
    
    res.json({ success: true, review });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN: REJECT REVIEW ==========
router.patch('/admin/:reviewId/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { adminNote } = req.body;
    
    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    review.status = 'rejected';
    if (adminNote) review.adminNote = adminNote;
    await review.save();
    
    res.json({ success: true, review });
  } catch (error) {
    console.error('Reject review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN: DELETE REVIEW ==========
router.delete('/admin/:reviewId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }
    
    await Review.findByIdAndDelete(reviewId);
    
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== USER: DELETE OWN REVIEW ==========
router.delete('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    
    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }
    
    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete own review error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
