const express = require('express');
const router = express.Router();
const multer = require('multer');
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendReviewApprovedEmail, sendReviewRejectedEmail } = require('../services/emailService');

// ========== Cloudflare R2 ==========
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

// ========== Auth Middleware ==========
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

// ========== UPDATE PRODUCT RATING (Helper) ==========
const updateProductRating = async (productId) => {
  const avgResult = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  
  if (avgResult.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgResult[0].avgRating * 10) / 10,
      reviewCount: avgResult[0].count
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      reviewCount: 0
    });
  }
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

// ========== CREATE REVIEW (UPDATED - Rating Only Support) ==========
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      productId, 
      orderId, 
      rating, 
      title, 
      comment, 
      images, 
      videos,
      isRatingOnly = false  // ✅ New field
    } = req.body;
    
    const userId = req.user.id;
    
    // Validate product
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    // Check if user can review
    const order = await Order.findOne({
      _id: orderId,
      userId,
      'items.productId': productId,
      status: 'delivered'
    });
    
    if (!order) {
      return res.status(403).json({ error: 'You can only review products after delivery' });
    }
    
    // Check if already reviewed
    const existingReview = await Review.findOne({ 
      productId, 
      userId, 
      orderId 
    });
    
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }
    
    // ✅ Rating only - Auto approve
    // ✅ Full review - Pending approval
    const status = isRatingOnly ? 'approved' : 'pending';
    
    const review = new Review({
      productId,
      userId,
      orderId,
      rating,
      title: title || '',
      comment: comment || '',
      images: images || [],
      videos: videos || [],
      isVerifiedPurchase: true,
      isRatingOnly: isRatingOnly,
      status: status,
      approvedAt: isRatingOnly ? new Date() : null
    });
    
    await review.save();
    
    // ✅ Update product rating immediately (for both)
    await updateProductRating(productId);
    
    const message = isRatingOnly 
      ? 'Rating submitted successfully!' 
      : 'Review submitted! Awaiting admin approval.';
    
    res.status(201).json({
      success: true,
      review,
      message,
      autoApproved: isRatingOnly
    });
    
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== GET APPROVED REVIEWS FOR PRODUCT (UPDATED) ==========
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, type = 'all' } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.json({
        success: true,
        reviews: [],
        total: 0,
        page: 1,
        pages: 0,
        averageRating: 0,
        totalReviews: 0,
        ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        ratingOnlyCount: 0,
        reviewWithCommentCount: 0
      });
    }
    
    // ✅ Filter based on type
    let filter = { productId: new mongoose.Types.ObjectId(productId), status: 'approved' };
    
    if (type === 'rating_only') {
      filter.isRatingOnly = true;
    } else if (type === 'with_comment') {
      filter.isRatingOnly = false;
      filter.comment = { $ne: '' };
    }
    
    const [reviews, total, avgResult, ratingCounts, ratingOnlyCount, commentCount] = await Promise.all([
      Review.find(filter)
        .populate('userId', 'name')
        .sort({ helpful: -1, createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      Review.countDocuments(filter),
      Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'approved' } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]),
      Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'approved' } },
        { $group: { _id: '$rating', count: { $sum: 1 } } }
      ]),
      Review.countDocuments({ productId, status: 'approved', isRatingOnly: true }),
      Review.countDocuments({ 
        productId, 
        status: 'approved', 
        isRatingOnly: false,
        comment: { $ne: '' } 
      })
    ]);
    
    // Format rating counts
    const formattedCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingCounts.forEach(item => {
      formattedCounts[item._id] = item.count;
    });
    
    res.json({
      success: true,
      reviews: reviews || [],
      total: total || 0,
      page: parseInt(page),
      pages: Math.ceil((total || 0) / parseInt(limit)),
      averageRating: avgResult.length > 0 ? Math.round(avgResult[0].avgRating * 10) / 10 : 0,
      totalReviews: avgResult.length > 0 ? avgResult[0].count : 0,
      ratingCounts: formattedCounts,
      ratingOnlyCount: ratingOnlyCount,
      reviewWithCommentCount: commentCount
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.json({
      success: false,
      reviews: [],
      total: 0,
      page: 1,
      pages: 0,
      averageRating: 0,
      totalReviews: 0,
      ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      ratingOnlyCount: 0,
      reviewWithCommentCount: 0,
      error: error.message
    });
  }
});

// ========== MARK REVIEW AS HELPFUL ==========
router.patch('/:reviewId/helpful', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    
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
    // ✅ Only full reviews (with comment) go to pending
    // Rating only reviews are auto-approved
    const reviews = await Review.find({ 
      status: 'pending',
      isRatingOnly: false,
      comment: { $ne: '' }
    })
      .populate('userId', 'name email')
      .populate('productId', 'name images brand category')
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
    const { status, page = 1, limit = 20, type = 'all' } = req.query;
    
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (type === 'rating_only') filter.isRatingOnly = true;
    if (type === 'with_comment') { 
      filter.isRatingOnly = false;
      filter.comment = { $ne: '' };
    }
    
    const reviews = await Review.find(filter)
      .populate('userId', 'name email')
      .populate('productId', 'name images brand category')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments(filter);
    
    res.json({
      reviews: reviews || [],
      total: total || 0,
      page: parseInt(page),
      pages: Math.ceil((total || 0) / parseInt(limit))
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN: GET REVIEW STATS ==========
router.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [total, pending, approved, rejected, ratingDistribution, ratingOnlyCount, commentCount] = await Promise.all([
      Review.countDocuments(),
      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({ status: 'approved' }),
      Review.countDocuments({ status: 'rejected' }),
      Review.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Review.countDocuments({ isRatingOnly: true, status: 'approved' }),
      Review.countDocuments({ 
        isRatingOnly: false, 
        status: 'approved',
        comment: { $ne: '' } 
      })
    ]);
    
    // Monthly trends
    const monthlyTrends = await Review.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    
    res.json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected,
        ratingDistribution: ratingDistribution.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        ratingOnlyCount,
        reviewWithCommentCount: commentCount,
        monthlyTrends: monthlyTrends.map(item => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          count: item.count,
          avgRating: Math.round(item.avgRating * 10) / 10
        }))
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN: APPROVE REVIEW ==========
router.patch('/admin/:reviewId/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { adminNote } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }
    
    const review = await Review.findById(reviewId)
      .populate('userId', 'name email')
      .populate('productId', 'name');
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    review.status = 'approved';
    review.isVerifiedPurchase = true;
    review.approvedAt = new Date();
    if (adminNote) review.adminNote = adminNote;
    await review.save();
    
    await updateProductRating(review.productId);
    
    // ✅ Send email only for full reviews (not rating only)
    if (!review.isRatingOnly && review.comment) {
      await sendReviewApprovedEmail(review.userId.email, {
        name: review.userId.name,
        productName: review.productId.name,
        productId: review.productId._id,
        rating: review.rating,
        comment: review.comment
      });
    }
    
    res.json({ success: true, review });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN: BULK APPROVE REVIEWS ==========
router.patch('/admin/bulk-approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reviewIds } = req.body;
    
    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({ error: 'No review IDs provided' });
    }
    
    const validIds = reviewIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    const reviews = await Review.find({ _id: { $in: validIds } });
    
    for (const review of reviews) {
      review.status = 'approved';
      review.isVerifiedPurchase = true;
      review.approvedAt = new Date();
      await review.save();
      await updateProductRating(review.productId);
    }
    
    res.json({ 
      success: true, 
      message: `${reviews.length} reviews approved successfully` 
    });
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN: BULK REJECT REVIEWS ==========
router.patch('/admin/bulk-reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reviewIds } = req.body;
    
    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({ error: 'No review IDs provided' });
    }
    
    const validIds = reviewIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    await Review.updateMany(
      { _id: { $in: validIds } },
      { status: 'rejected', rejectedAt: new Date() }
    );
    
    res.json({ 
      success: true, 
      message: `${validIds.length} reviews rejected successfully` 
    });
  } catch (error) {
    console.error('Bulk reject error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN: REJECT REVIEW ==========
router.patch('/admin/:reviewId/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { adminNote } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }
    
    const review = await Review.findById(reviewId)
      .populate('userId', 'name email')
      .populate('productId', 'name');
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    review.status = 'rejected';
    review.rejectedAt = new Date();
    if (adminNote) review.adminNote = adminNote;
    await review.save();
    
    // ✅ Send email only for full reviews
    if (!review.isRatingOnly && review.comment) {
      await sendReviewRejectedEmail(review.userId.email, {
        name: review.userId.name,
        productName: review.productId.name,
        reason: adminNote || 'Does not meet our review guidelines'
      });
    }
    
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
    
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const productId = review.productId;
    await review.deleteOne();
    
    await updateProductRating(productId);
    
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
    
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }
    
    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const productId = review.productId;
    await review.deleteOne();
    
    await updateProductRating(productId);
    
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete own review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ADMIN: EXPORT REVIEWS AS CSV ==========
router.get('/admin/export', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    
    const reviews = await Review.find(filter)
      .populate('userId', 'name email')
      .populate('productId', 'name brand category price')
      .sort({ createdAt: -1 });
    
    let csv = 'Product,Customer,Rating,Title,Comment,Status,Verified,Rating Only,Helpful,Date\n';
    
    reviews.forEach(r => {
      csv += `"${r.productId?.name || 'N/A'}","${r.userId?.name || 'Anonymous'} (${r.userId?.email || ''})",`;
      csv += `${r.rating},"${(r.title || '').replace(/"/g, '""')}","${(r.comment || '').replace(/"/g, '""')}",`;
      csv += `${r.status},${r.isVerifiedPurchase ? 'Yes' : 'No'},${r.isRatingOnly ? 'Yes' : 'No'},`;
      csv += `${r.helpful || 0},${new Date(r.createdAt).toLocaleDateString()}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=reviews-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
