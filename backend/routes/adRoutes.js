const express = require('express');
const router = express.Router();
const AdCampaign = require('../models/AdCampaign');
const Wallet = require('../models/Wallet');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const { protect, vendorMiddleware, adminMiddleware } = require('../middleware/auth');

// ============================================
// ✅ VENDOR AD ROUTES
// ============================================

// ========== GET ALL CAMPAIGNS ==========
router.get('/', protect, vendorMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = { vendorId: req.user.id };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const campaigns = await AdCampaign.find(filter)
      .populate('productId', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await AdCampaign.countDocuments(filter);

    res.json({
      success: true,
      campaigns,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalCampaigns: total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET SINGLE CAMPAIGN ==========
router.get('/:id', protect, vendorMiddleware, async (req, res) => {
  try {
    const campaign = await AdCampaign.findOne({
      _id: req.params.id,
      vendorId: req.user.id
    }).populate('productId', 'name price images brand');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.json({ success: true, campaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== CREATE PRODUCT AD CAMPAIGN ==========
router.post('/product', protect, vendorMiddleware, async (req, res) => {
  try {
    const {
      name,
      productId,
      budget,
      dailyBudget,
      bidType = 'cpc',
      bidAmount,
      startDate,
      endDate,
      targeting = {}
    } = req.body;

    // Validate
    if (!name || !productId || !budget || !dailyBudget || !bidAmount || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check product belongs to vendor
    const product = await Product.findOne({
      _id: productId,
      vendorId: req.user.id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or does not belong to you'
      });
    }

    // Check wallet balance
    const wallet = await Wallet.findOne({ vendorId: req.user.id });
    if (!wallet || wallet.balance < budget) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Need ₹${budget}. Available: ₹${wallet?.balance || 0}`
      });
    }

    // Create campaign
    const campaign = new AdCampaign({
      vendorId: req.user.id,
      name,
      type: 'product',
      productId,
      budget,
      dailyBudget,
      bidType,
      bidAmount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      targeting,
      status: 'pending',
      adminApproved: false
    });

    await campaign.save();

    // Deduct budget from wallet (hold amount)
    await wallet.deductBalance(
      budget,
      `Ad campaign hold: ${name}`,
      `CAMPAIGN_${campaign._id}`
    );

    res.status(201).json({
      success: true,
      message: 'Product ad campaign created successfully. Waiting for admin approval.',
      campaign
    });
  } catch (error) {
    console.error('Create product ad error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== CREATE BANNER AD CAMPAIGN ==========
router.post('/banner', protect, vendorMiddleware, async (req, res) => {
  try {
    const {
      name,
      budget,
      dailyBudget,
      bidType = 'cpm',
      bidAmount,
      startDate,
      endDate,
      banner,
      targeting = {}
    } = req.body;

    // Validate
    if (!name || !budget || !dailyBudget || !bidAmount || !startDate || !endDate || !banner) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (!banner.imageUrl || !banner.linkUrl) {
      return res.status(400).json({
        success: false,
        message: 'Banner image and link are required'
      });
    }

    // Check wallet balance
    const wallet = await Wallet.findOne({ vendorId: req.user.id });
    if (!wallet || wallet.balance < budget) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Need ₹${budget}. Available: ₹${wallet?.balance || 0}`
      });
    }

    // Create campaign
    const campaign = new AdCampaign({
      vendorId: req.user.id,
      name,
      type: 'banner',
      budget,
      dailyBudget,
      bidType,
      bidAmount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      banner,
      targeting,
      status: 'pending',
      adminApproved: false
    });

    await campaign.save();

    // Deduct budget from wallet (hold amount)
    await wallet.deductBalance(
      budget,
      `Banner ad campaign hold: ${name}`,
      `CAMPAIGN_${campaign._id}`
    );

    res.status(201).json({
      success: true,
      message: 'Banner ad campaign created successfully. Waiting for admin approval.',
      campaign
    });
  } catch (error) {
    console.error('Create banner ad error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== UPDATE CAMPAIGN ==========
router.put('/:id', protect, vendorMiddleware, async (req, res) => {
  try {
    const campaign = await AdCampaign.findOne({
      _id: req.params.id,
      vendorId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Can only edit pending or paused campaigns
    if (campaign.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit active campaign. Pause it first.'
      });
    }

    if (campaign.status === 'completed' || campaign.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit completed campaign'
      });
    }

    const allowedFields = ['name', 'budget', 'dailyBudget', 'bidAmount', 'endDate', 'targeting'];
    if (campaign.type === 'banner') {
      allowedFields.push('banner');
    }

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        campaign[field] = req.body[field];
      }
    });

    campaign.updatedAt = new Date();
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== PAUSE CAMPAIGN ==========
router.patch('/:id/pause', protect, vendorMiddleware, async (req, res) => {
  try {
    const campaign = await AdCampaign.findOne({
      _id: req.params.id,
      vendorId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active campaigns can be paused'
      });
    }

    campaign.status = 'paused';
    campaign.pausedAt = new Date();
    campaign.updatedAt = new Date();
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign paused successfully',
      campaign
    });
  } catch (error) {
    console.error('Pause campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== RESUME CAMPAIGN ==========
router.patch('/:id/resume', protect, vendorMiddleware, async (req, res) => {
  try {
    const campaign = await AdCampaign.findOne({
      _id: req.params.id,
      vendorId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: 'Only paused campaigns can be resumed'
      });
    }

    // Check if campaign is still within dates
    const now = new Date();
    if (campaign.endDate < now) {
      campaign.status = 'ended';
      await campaign.save();
      return res.status(400).json({
        success: false,
        message: 'Campaign has ended. Cannot resume.'
      });
    }

    // Check if budget is exhausted
    if (campaign.spent >= campaign.budget) {
      campaign.status = 'completed';
      await campaign.save();
      return res.status(400).json({
        success: false,
        message: 'Campaign budget exhausted. Cannot resume.'
      });
    }

    campaign.status = 'active';
    campaign.updatedAt = new Date();
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign resumed successfully',
      campaign
    });
  } catch (error) {
    console.error('Resume campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== DELETE CAMPAIGN ==========
router.delete('/:id', protect, vendorMiddleware, async (req, res) => {
  try {
    const campaign = await AdCampaign.findOne({
      _id: req.params.id,
      vendorId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Only allow deletion of pending or completed campaigns
    if (campaign.status === 'active' || campaign.status === 'paused') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete active or paused campaign. End it first.'
      });
    }

    // Refund remaining budget if any
    if (campaign.status === 'pending' && campaign.spent === 0) {
      const wallet = await Wallet.findOne({ vendorId: req.user.id });
      if (wallet) {
        await wallet.addBalance(
          campaign.budget,
          `Campaign cancelled: ${campaign.name}`,
          `REFUND_${campaign._id}`
        );
      }
    }

    await campaign.deleteOne();

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET CAMPAIGN STATS ==========
router.get('/:id/stats', protect, vendorMiddleware, async (req, res) => {
  try {
    const campaign = await AdCampaign.findOne({
      _id: req.params.id,
      vendorId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    const stats = {
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      conversions: campaign.conversions,
      revenue: campaign.revenue,
      spent: campaign.spent,
      remaining: campaign.budget - campaign.spent,
      ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions * 100).toFixed(2) : 0,
      conversionRate: campaign.clicks > 0 ? (campaign.conversions / campaign.clicks * 100).toFixed(2) : 0,
      cpc: campaign.clicks > 0 ? (campaign.spent / campaign.clicks).toFixed(2) : 0,
      cpm: campaign.impressions > 0 ? (campaign.spent / campaign.impressions * 1000).toFixed(2) : 0,
      dailyStats: campaign.dailyStats.slice(-30) // Last 30 days
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get campaign stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// ✅ PUBLIC AD ROUTES
// ============================================

// ========== GET ACTIVE SPONSORED PRODUCTS ==========
router.get('/public/sponsored-products', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    
    const campaigns = await AdCampaign.getActiveForPlacement(
      'product',
      category,
      parseInt(limit)
    );

    const products = campaigns.map(c => c.productId).filter(p => p);

    res.json({
      success: true,
      products,
      sponsored: true
    });
  } catch (error) {
    console.error('Get sponsored products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET ACTIVE BANNER ADS ==========
router.get('/public/banners', async (req, res) => {
  try {
    const { position = 'homepage_top', limit = 5 } = req.query;

    const now = new Date();
    const banners = await AdCampaign.find({
      type: 'banner',
      status: 'active',
      adminApproved: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      'banner.position': position,
      $expr: { $lt: ['$spent', '$budget'] }
    })
    .sort({ bidAmount: -1 })
    .limit(parseInt(limit))
    .select('banner vendorId name');

    // Get vendor names
    const bannersWithVendor = await Promise.all(banners.map(async (banner) => {
      const vendor = await Vendor.findById(banner.vendorId).select('brandName storeName');
      return {
        ...banner.toObject(),
        vendorName: vendor?.brandName || vendor?.storeName || 'Vendor'
      };
    }));

    res.json({
      success: true,
      banners: bannersWithVendor
    });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// ✅ ADMIN AD ROUTES
// ============================================

// ========== GET ALL CAMPAIGNS (ADMIN) ==========
router.get('/admin/all', protect, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const campaigns = await AdCampaign.find(filter)
      .populate('vendorId', 'name email brandName storeName')
      .populate('productId', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await AdCampaign.countDocuments(filter);

    res.json({
      success: true,
      campaigns,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalCampaigns: total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Admin get campaigns error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== ADMIN: APPROVE CAMPAIGN ==========
router.patch('/admin/:id/approve', protect, adminMiddleware, async (req, res) => {
  try {
    const campaign = await AdCampaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending campaigns can be approved'
      });
    }

    campaign.status = 'active';
    campaign.adminApproved = true;
    campaign.adminRemarks = req.body.remarks || '';
    campaign.updatedAt = new Date();
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign approved successfully',
      campaign
    });
  } catch (error) {
    console.error('Approve campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== ADMIN: REJECT CAMPAIGN (WITH REFUND) ==========
router.patch('/admin/:id/reject', protect, adminMiddleware, async (req, res) => {
  try {
    const campaign = await AdCampaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending campaigns can be rejected'
      });
    }

    const reason = req.body.reason || 'Campaign does not meet our advertising guidelines.';

    campaign.status = 'rejected';
    campaign.adminApproved = false;
    campaign.rejectedReason = reason;
    campaign.adminRemarks = req.body.remarks || '';
    campaign.updatedAt = new Date();
    await campaign.save();

    // Refund the budget back to vendor wallet
    const wallet = await Wallet.findOne({ vendorId: campaign.vendorId });
    if (wallet && campaign.spent === 0) {
      await wallet.addBalance(
        campaign.budget,
        `Campaign rejected: ${campaign.name}`,
        `REFUND_${campaign._id}`
      );
    }

    res.json({
      success: true,
      message: 'Campaign rejected. Budget refunded to vendor wallet.',
      campaign
    });
  } catch (error) {
    console.error('Reject campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== ADMIN: FORCE END CAMPAIGN ==========
router.patch('/admin/:id/end', protect, adminMiddleware, async (req, res) => {
  try {
    const campaign = await AdCampaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status === 'completed' || campaign.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'Campaign is already ended'
      });
    }

    const reason = req.body.reason || 'Ended by admin.';

    campaign.status = 'ended';
    campaign.completedAt = new Date();
    campaign.adminRemarks = reason;
    campaign.updatedAt = new Date();
    await campaign.save();

    // Refund remaining budget
    const remaining = campaign.budget - campaign.spent;
    if (remaining > 0) {
      const wallet = await Wallet.findOne({ vendorId: campaign.vendorId });
      if (wallet) {
        await wallet.addBalance(
          remaining,
          `Campaign ended early by admin: ${campaign.name}`,
          `REFUND_${campaign._id}`
        );
      }
    }

    res.json({
      success: true,
      message: 'Campaign ended. Remaining budget refunded.',
      campaign
    });
  } catch (error) {
    console.error('End campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== ADMIN: GET AD STATS ==========
router.get('/admin/stats', protect, adminMiddleware, async (req, res) => {
  try {
    const totalCampaigns = await AdCampaign.countDocuments();
    const activeCampaigns = await AdCampaign.countDocuments({ status: 'active' });
    const pendingCampaigns = await AdCampaign.countDocuments({ status: 'pending' });
    const completedCampaigns = await AdCampaign.countDocuments({ status: 'completed' });

    const stats = await AdCampaign.aggregate([
      {
        $group: {
          _id: null,
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' },
          totalConversions: { $sum: '$conversions' },
          totalRevenue: { $sum: '$revenue' },
          totalSpent: { $sum: '$spent' },
          totalBudget: { $sum: '$budget' }
        }
      }
    ]);

    // Monthly trend
    const monthlyTrend = await AdCampaign.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          spend: { $sum: '$spent' },
          revenue: { $sum: '$revenue' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      summary: {
        totalCampaigns,
        activeCampaigns,
        pendingCampaigns,
        completedCampaigns
      },
      stats: stats[0] || {
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        totalSpent: 0,
        totalBudget: 0
      },
      monthlyTrend
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// ✅ TRACKING ROUTES
// ============================================

// ========== TRACK IMPRESSION ==========
router.post('/track/impression/:campaignId', async (req, res) => {
  try {
    const campaign = await AdCampaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    await campaign.recordImpression();

    res.json({ success: true });
  } catch (error) {
    console.error('Track impression error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== TRACK CLICK ==========
router.get('/track/click/:campaignId', async (req, res) => {
  try {
    const campaign = await AdCampaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    await campaign.recordClick();

    // Redirect to product or banner link
    if (campaign.type === 'product' && campaign.productId) {
      return res.redirect(`/product/${campaign.productId._id || campaign.productId}`);
    } else if (campaign.type === 'banner' && campaign.banner?.linkUrl) {
      return res.redirect(campaign.banner.linkUrl);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== TRACK CONVERSION ==========
router.post('/track/conversion/:campaignId', async (req, res) => {
  try {
    const { revenue = 0 } = req.body;
    const campaign = await AdCampaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    await campaign.recordConversion(revenue);

    res.json({ success: true });
  } catch (error) {
    console.error('Track conversion error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
