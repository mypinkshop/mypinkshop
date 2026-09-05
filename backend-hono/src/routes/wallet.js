import { Hono } from 'hono';

const wallet = new Hono();

// Helper to check if user is vendor
const isVendor = (c) => {
  const user = c.get('user');
  return user && user.role === 'vendor';
};

// Helper to check if user is admin
const isAdmin = (c) => {
  const user = c.get('user');
  return user && user.role === 'admin';
};

// Helper: Parse transactions JSON
const parseTransactions = (str) => {
  try { return JSON.parse(str || '[]'); } catch { return []; }
};

// Helper: Get wallet by vendorId
const getWallet = async (c, vendorId) => {
  return await c.env.DB.prepare(`SELECT * FROM wallets WHERE vendorId = ?`).bind(vendorId).first();
};

// Helper: Add balance to wallet
const addBalance = async (c, wallet, amount, description, reference) => {
  const transactions = parseTransactions(wallet.transactions);
  const newTransaction = {
    type: 'credit',
    amount: amount,
    description: description,
    reference: reference,
    status: 'completed',
    createdAt: new Date().toISOString()
  };
  transactions.push(newTransaction);
  
  await c.env.DB.prepare(
    `UPDATE wallets SET balance = balance + ?, totalRecharged = totalRecharged + ?, transactions = ?, lastUpdated = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(amount, amount, JSON.stringify(transactions), wallet.id).run();
};

// Helper: Deduct balance from wallet
const deductBalance = async (c, wallet, amount, description, reference) => {
  const transactions = parseTransactions(wallet.transactions);
  const newTransaction = {
    type: 'debit',
    amount: amount,
    description: description,
    reference: reference,
    status: 'completed',
    createdAt: new Date().toISOString()
  };
  transactions.push(newTransaction);
  
  await c.env.DB.prepare(
    `UPDATE wallets SET balance = balance - ?, totalSpent = totalSpent + ?, transactions = ?, lastUpdated = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(amount, amount, JSON.stringify(transactions), wallet.id).run();
};

// ============================================
// ✅ VENDOR WALLET ROUTES
// ============================================

// ========== GET WALLET BALANCE & DETAILS ==========
wallet.get('/', async (c) => {
  try {
    const user = c.get('user');
    if (!isVendor(c)) {
      return c.json({ success: false, message: 'Vendor access required' }, 403);
    }

    let existingWallet = await getWallet(c, user.id);
    
    if (!existingWallet) {
      // Create new wallet
      await c.env.DB.prepare(
        `INSERT INTO wallets (vendorId, balance, totalRecharged, totalSpent, totalEarned, transactions) 
         VALUES (?, 0, 0, 0, 0, '[]')`
      ).bind(user.id).run();
      
      existingWallet = await getWallet(c, user.id);
    }

    return c.json({
      success: true,
      wallet: {
        balance: existingWallet.balance,
        totalRecharged: existingWallet.totalRecharged,
        totalSpent: existingWallet.totalSpent,
        totalEarned: existingWallet.totalEarned,
        isActive: existingWallet.isActive,
        lastUpdated: existingWallet.lastUpdated
      }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

// ========== GET TRANSACTION HISTORY ==========
wallet.get('/transactions', async (c) => {
  try {
    const user = c.get('user');
    if (!isVendor(c)) {
      return c.json({ success: false, message: 'Vendor access required' }, 403);
    }

    const { page = 1, limit = 20, type, status } = c.req.query();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const wallet = await getWallet(c, user.id);
    
    if (!wallet) {
      return c.json({
        success: true,
        transactions: [],
        pagination: {
          currentPage: pageNum,
          totalPages: 0,
          totalTransactions: 0
        }
      });
    }

    let transactions = parseTransactions(wallet.transactions);
    
    if (type) {
      transactions = transactions.filter(tx => tx.type === type);
    }
    if (status) {
      transactions = transactions.filter(tx => tx.status === status);
    }

    transactions = transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = transactions.length;
    const paginatedTransactions = transactions.slice(skip, skip + limitNum);

    return c.json({
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
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

// ========== RECHARGE WALLET ==========
wallet.post('/recharge', async (c) => {
  try {
    const user = c.get('user');
    if (!isVendor(c)) {
      return c.json({ success: false, message: 'Vendor access required' }, 403);
    }

    const { amount, paymentMethod = 'manual', reference = '' } = await c.req.json();

    if (!amount || amount <= 0) {
      return c.json({ success: false, message: 'Please enter a valid amount' }, 400);
    }

    if (amount < 100) {
      return c.json({ success: false, message: 'Minimum recharge amount is ₹100' }, 400);
    }

    if (amount > 100000) {
      return c.json({ success: false, message: 'Maximum recharge amount is ₹100,000' }, 400);
    }

    let wallet = await getWallet(c, user.id);
    
    if (!wallet) {
      await c.env.DB.prepare(
        `INSERT INTO wallets (vendorId, balance, totalRecharged, totalSpent, totalEarned, transactions) 
         VALUES (?, 0, 0, 0, 0, '[]')`
      ).bind(user.id).run();
      wallet = await getWallet(c, user.id);
    }

    await addBalance(c, wallet, amount, `Wallet recharge via ${paymentMethod}`, reference || `RECHARGE_${Date.now()}`);

    // Get updated wallet
    wallet = await getWallet(c, user.id);

    return c.json({
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
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

// ========== GET WALLET SUMMARY ==========
wallet.get('/summary', async (c) => {
  try {
    const user = c.get('user');
    if (!isVendor(c)) {
      return c.json({ success: false, message: 'Vendor access required' }, 403);
    }

    const wallet = await getWallet(c, user.id);
    
    if (!wallet) {
      return c.json({
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

    const transactions = parseTransactions(wallet.transactions);
    const recentSpending = transactions
      .filter(tx => 
        tx.type === 'debit' && 
        tx.status === 'completed' &&
        new Date(tx.createdAt) >= thirtyDaysAgo
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    return c.json({
      success: true,
      summary: {
        balance: wallet.balance,
        totalRecharged: wallet.totalRecharged,
        totalSpent: wallet.totalSpent,
        totalEarned: wallet.totalEarned,
        transactionCount: transactions.length,
        recentSpending: recentSpending,
        lastUpdated: wallet.lastUpdated
      }
    });
  } catch (error) {
    console.error('Get wallet summary error:', error);
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

// ============================================
// ✅ ADMIN WALLET ROUTES
// ============================================

// ========== GET ALL WALLETS (Admin) ==========
wallet.get('/admin/all', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const { page = 1, limit = 20, search } = c.req.query();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = `SELECT * FROM wallets`;
    let params = [];

    if (search) {
      query += ` WHERE vendorId IN (SELECT id FROM users WHERE name LIKE ? OR email LIKE ? OR brandName LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY balance DESC LIMIT ? OFFSET ?`;
    params.push(limitNum, skip);

    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    const totalResult = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM wallets`).first();
    
    // Get vendor info for each wallet
    const walletsWithVendor = await Promise.all(results.map(async (wallet) => {
      const vendor = await c.env.DB.prepare(
        `SELECT id, name, email, brandName, storeName, status FROM users WHERE id = ?`
      ).bind(wallet.vendorId).first();
      return { ...wallet, vendorId: vendor };
    }));

    return c.json({
      success: true,
      wallets: walletsWithVendor,
      summary: {
        totalBalance: results.reduce((sum, w) => sum + w.balance, 0),
        totalRecharged: results.reduce((sum, w) => sum + w.totalRecharged, 0),
        totalSpent: results.reduce((sum, w) => sum + w.totalSpent, 0),
        totalVendors: results.length
      },
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalResult.count / limitNum),
        totalWallets: totalResult.count,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get admin wallets error:', error);
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

// ========== ADMIN: ADD BALANCE ==========
wallet.patch('/admin/:vendorId/add', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const { vendorId } = c.req.param();
    const { amount, reason = 'Admin adjustment' } = await c.req.json();

    if (!amount || amount <= 0) {
      return c.json({ success: false, message: 'Please enter a valid amount' }, 400);
    }

    const wallet = await getWallet(c, parseInt(vendorId));
    
    if (!wallet) {
      return c.json({ success: false, message: 'Wallet not found' }, 404);
    }

    await addBalance(c, wallet, amount, `Admin credit: ${reason}`, `ADMIN_${Date.now()}`);

    // Get updated wallet
    const updatedWallet = await getWallet(c, parseInt(vendorId));

    return c.json({
      success: true,
      message: `₹${amount} added to vendor's wallet`,
      wallet: {
        balance: updatedWallet.balance,
        totalRecharged: updatedWallet.totalRecharged
      }
    });
  } catch (error) {
    console.error('Admin add balance error:', error);
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

// ========== ADMIN: DEDUCT BALANCE ==========
wallet.patch('/admin/:vendorId/deduct', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const { vendorId } = c.req.param();
    const { amount, reason = 'Admin adjustment' } = await c.req.json();

    if (!amount || amount <= 0) {
      return c.json({ success: false, message: 'Please enter a valid amount' }, 400);
    }

    const wallet = await getWallet(c, parseInt(vendorId));
    
    if (!wallet) {
      return c.json({ success: false, message: 'Wallet not found' }, 404);
    }

    if (wallet.balance < amount) {
      return c.json({ success: false, message: `Insufficient balance. Available: ₹${wallet.balance}` }, 400);
    }

    await deductBalance(c, wallet, amount, `Admin debit: ${reason}`, `ADMIN_${Date.now()}`);

    // Get updated wallet
    const updatedWallet = await getWallet(c, parseInt(vendorId));

    return c.json({
      success: true,
      message: `₹${amount} deducted from vendor's wallet`,
      wallet: {
        balance: updatedWallet.balance,
        totalSpent: updatedWallet.totalSpent
      }
    });
  } catch (error) {
    console.error('Admin deduct balance error:', error);
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

// ========== ADMIN: GET VENDOR WALLET ==========
wallet.get('/admin/:vendorId', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const { vendorId } = c.req.param();
    
    const wallet = await getWallet(c, parseInt(vendorId));
    
    if (!wallet) {
      return c.json({ success: false, message: 'Wallet not found' }, 404);
    }

    const vendor = await c.env.DB.prepare(
      `SELECT id, name, email, brandName, storeName, status, phone FROM users WHERE id = ?`
    ).bind(parseInt(vendorId)).first();

    return c.json({
      success: true,
      wallet: {
        ...wallet,
        vendorId: vendor
      }
    });
  } catch (error) {
    console.error('Get vendor wallet error:', error);
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

// ========== ADMIN: WALLET STATS OVERVIEW ==========
wallet.get('/admin/stats/overview', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const { results } = await c.env.DB.prepare(
      `SELECT 
        COALESCE(SUM(balance), 0) as totalBalance,
        COALESCE(SUM(totalRecharged), 0) as totalRecharged,
        COALESCE(SUM(totalSpent), 0) as totalSpent,
        COUNT(*) as totalVendors
       FROM wallets`
    ).all();

    const stats = results[0];

    return c.json({
      success: true,
      stats: {
        totalBalance: stats.totalBalance,
        totalRecharged: stats.totalRecharged,
        totalSpent: stats.totalSpent,
        totalVendors: stats.totalVendors
      }
    });
  } catch (error) {
    console.error('Get wallet stats error:', error);
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

export default wallet;
