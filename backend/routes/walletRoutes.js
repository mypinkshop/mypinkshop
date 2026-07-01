const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const Vendor = require('../models/Vendor');
const { protect, vendorMiddleware, adminMiddleware } = require('../middleware/auth');

// ============================================
// ✅ VENDOR WALLET ROUTES
// ============================================

// ========== GET WALLET BALANCE & DETAILS ==========
router.get('/', protect, vendorMiddleware, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ vendorId: req.user.id });
    
    if (!wallet) {
      wallet = new Wallet({
        vendorId: req.user.id,
        balance: 0,
        totalRecharged: 0,
        totalSpent: 0,
        transactions: []
      });
      await wallet.save();
    }

    res.json({
      success: true,
      wallet: {
        balance: wallet.balance,
        totalRecharged: wallet.totalRecharged,
        totalSpent: wallet.totalSpent,
        totalEarned: wallet.totalEarned,
        isActive: wallet.isActive,
        lastUpdated: wallet.lastUpdated
      }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ========== GET TRANSACTION HISTORY ==========
router.get('/transactions', protect, vendorMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const wallet = await Wallet.findOne({ vendorId: req.user.id });
    
    if (!wallet) {
      return res.json({
        success: true,
        transactions: [],
        pagination: {
          currentPage: pageNum,
          totalPages: 0,
          totalTransactions: 0
        }
      });
    }

    let transactions = wallet.transactions;
    
    if (type) {
      transactions = transactions.filter(tx => tx.type === type);
    }
    if (status) {
      transactions = transactions.filter(tx => tx.status === status);
    }

    transactions = transactions.sort((a, b) => b.createdAt - a.createdAt);

    const total = transactions.length;
    const paginatedTransactions = transactions.slice(skip, skip + limitNum);

    res.json({
      success: true,
      transactions: paginatedTransactions,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalTransactions: total,
        limit: limitNum,
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ========== RECHARGE WALLET ==========
router.post('/recharge', protect, vendorMiddleware, async (req, res) => {
  try {
    const { amount, paymentMethod = 'manual', reference = '' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid amount'
      });
    }

    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum recharge amount is ₹100'
      });
    }

    if (amount > 100000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum recharge amount is ₹100,000'
      });
    }

    let wallet = await Wallet.findOne({ vendorId: req.user.id });
    
    if (!wallet) {
      wallet = new Wallet({
        vendorId: req.user.id,
        balance: 0,
        totalRecharged: 0,
        totalSpent: 0,
        transactions: []
      });
    }

    await wallet.addBalance(
      amount,
      `Wallet recharge via ${paymentMethod}`,
      reference || `RECHARGE_${Date.now()}`
    );

    res.json({
      success: true,
      message: `₹${amount} added to wallet successfully`,
      wallet: {
        balance: wallet.balance,
        totalRecharged: wallet.totalRecharged,
        totalSpent: wallet.totalSpent
      }
    });
  } catch (error) {
    console.error('Recharge wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ========== GET WALLET SUMMARY ==========
router.get('/summary', protect, vendorMiddleware, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ vendorId: req.user.id });
    
    if (!wallet) {
      return res.json({
        success: true,
        summary: {
          balance: 0,
          totalRecharged: 0,
          totalSpent: 0,
          totalEarned: 0,
          transactionCount: 0
        }
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSpending = wallet.transactions
      .filter(tx => 
        tx.type === 'debit' && 
        tx.status === 'completed' &&
        tx.createdAt >= thirtyDaysAgo
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    res.json({
      success: true,
      summary: {
        balance: wallet.balance,
        totalRecharged: wallet.totalRecharged,
        totalSpent: wallet.totalSpent,
        totalEarned: wallet.totalEarned,
        transactionCount: wallet.transactions.length,
        recentSpending: recentSpending,
        lastUpdated: wallet.lastUpdated
      }
    });
  } catch (error) {
    console.error('Get wallet summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ============================================
// ✅ ADMIN WALLET ROUTES
// ============================================

router.get('/admin/all', protect, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {};
    
    if (search) {
      const vendors = await Vendor.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { brandName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const vendorIds = vendors.map(v => v._id);
      query.vendorId = { $in: vendorIds };
    }

    const wallets = await Wallet.find(query)
      .populate('vendorId', 'name email brandName storeName status')
      .sort({ balance: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Wallet.countDocuments(query);

    const summary = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance' },
          totalRecharged: { $sum: '$totalRecharged' },
          totalSpent: { $sum: '$totalSpent' },
          totalVendors: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      wallets,
      summary: summary[0] || {
        totalBalance: 0,
        totalRecharged: 0,
        totalSpent: 0,
        totalVendors: 0
      },
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalWallets: total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get admin wallets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.patch('/admin/:vendorId/add', protect, adminMiddleware, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { amount, reason = 'Admin adjustment' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid amount'
      });
    }

    const wallet = await Wallet.findOne({ vendorId });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    await wallet.addBalance(
      amount,
      `Admin credit: ${reason}`,
      `ADMIN_${Date.now()}`
    );

    res.json({
      success: true,
      message: `₹${amount} added to vendor's wallet`,
      wallet: {
        balance: wallet.balance,
        totalRecharged: wallet.totalRecharged
      }
    });
  } catch (error) {
    console.error('Admin add balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.patch('/admin/:vendorId/deduct', protect, adminMiddleware, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { amount, reason = 'Admin adjustment' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid amount'
      });
    }

    const wallet = await Wallet.findOne({ vendorId });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (!wallet.hasSufficientBalance(amount)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${wallet.balance}`
      });
    }

    await wallet.deductBalance(
      amount,
      `Admin debit: ${reason}`,
      `ADMIN_${Date.now()}`
    );

    res.json({
      success: true,
      message: `₹${amount} deducted from vendor's wallet`,
      wallet: {
        balance: wallet.balance,
        totalSpent: wallet.totalSpent
      }
    });
  } catch (error) {
    console.error('Admin deduct balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/admin/:vendorId', protect, adminMiddleware, async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const wallet = await Wallet.findOne({ vendorId })
      .populate('vendorId', 'name email brandName storeName status phone');
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    res.json({
      success: true,
      wallet
    });
  } catch (error) {
    console.error('Get vendor wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/admin/stats/overview', protect, adminMiddleware, async (req, res) => {
  try {
    const stats = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance' },
          totalRecharged: { $sum: '$totalRecharged' },
          totalSpent: { $sum: '$totalSpent' },
          totalVendors: { $sum: 1 },
          avgBalance: { $avg: '$balance' },
          maxBalance: { $max: '$balance' },
          minBalance: { $min: '$balance' }
        }
      }
    ]);

    const lowBalanceVendors = await Wallet.find({ balance: { $lt: 500 } })
      .populate('vendorId', 'name email brandName')
      .limit(10);

    const topVendors = await Wallet.find()
      .populate('vendorId', 'name email brandName')
      .sort({ balance: -1 })
      .limit(5);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = await Wallet.aggregate([
      { $unwind: '$transactions' },
      { $match: { 'transactions.createdAt': { $gte: today } } },
      {
        $group: {
          _id: null,
          totalCredits: {
            $sum: {
              $cond: [{ $eq: ['$transactions.type', 'credit'] }, '$transactions.amount', 0]
            }
          },
          totalDebits: {
            $sum: {
              $cond: [{ $eq: ['$transactions.type', 'debit'] }, '$transactions.amount', 0]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalBalance: 0,
        totalRecharged: 0,
        totalSpent: 0,
        totalVendors: 0,
        avgBalance: 0,
        maxBalance: 0,
        minBalance: 0
      },
      lowBalanceVendors,
      topVendors,
      todayTransactions: todayTransactions[0] || {
        totalCredits: 0,
        totalDebits: 0,
        count: 0
      }
    });
  } catch (error) {
    console.error('Get wallet stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ✅ VERY IMPORTANT - Export router
module.exports = router;
