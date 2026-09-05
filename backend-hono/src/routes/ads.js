import { Hono } from 'hono';

const ads = new Hono();

// Helper to parse JSON safely
const safeParse = (str) => {
  try { return JSON.parse(str); } catch { return {}; }
};

// ============================================
// ✅ VENDOR AD ROUTES
// ============================================

// ========== GET ALL CAMPAIGNS ==========
ads.get('/', async (c) => {
  try {
    const user = c.get('user'); // Assume auth middleware sets this
    const { page = 1, limit = 20, status, type } = c.req.query();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = `SELECT * FROM ad_campaigns WHERE vendorId = ?`;
    let params = [user.id];

    if (status) { query += ` AND status = ?`; params.push(status); }
    if (type) { query += ` AND type = ?`; params.push(type); }

    query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    params.push(limitNum, skip);

    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    const totalResult = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM ad_campaigns WHERE vendorId = ?`).bind(user.id).first();

    return c.json({
      success: true,
      campaigns: results,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalResult.count / limitNum),
        totalCampaigns: totalResult.count,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== GET SINGLE CAMPAIGN ==========
ads.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM ad_campaigns WHERE id = ? AND vendorId = ?`
    ).bind(c.req.param('id'), user.id).all();

    if (!results || results.length === 0) {
      return c.json({ success: false, message: 'Campaign not found' }, 404);
    }

    return c.json({ success: true, campaign: results[0] });
  } catch (error) {
    console.error('Get campaign error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== CREATE PRODUCT AD CAMPAIGN ==========
ads.post('/product', async (c) => {
  try {
    const user = c.get('user'); // Vendor ID
    const body = await c.req.json();

    const { name, productId, budget, dailyBudget, bidType = 'cpc', bidAmount, startDate, endDate, targeting = {} } = body;

    if (!name || !productId || !budget || !dailyBudget || !bidAmount || !startDate || !endDate) {
      return c.json({ success: false, message: 'All fields are required' }, 400);
    }

    // Check product belongs to vendor
    const product = await c.env.DB.prepare(
      `SELECT * FROM products WHERE id = ? AND vendorId = ?`
    ).bind(productId, user.id).first();

    if (!product) {
      return c.json({ success: false, message: 'Product not found or does not belong to you' }, 404);
    }

    // Check wallet balance
    const wallet = await c.env.DB.prepare(
      `SELECT * FROM wallets WHERE vendorId = ?`
    ).bind(user.id).first();

    if (!wallet) {
      return c.json({ success: false, message: 'Wallet not found. Please recharge your wallet first.' }, 400);
    }

    if (wallet.balance < budget) {
      return c.json({ success: false, message: `Insufficient wallet balance. Need ₹${budget}. Available: ₹${wallet.balance}` }, 400);
    }

    // Create campaign
    const result = await c.env.DB.prepare(
      `INSERT INTO ad_campaigns (vendorId, name, type, productId, budget, dailyBudget, bidType, bidAmount, startDate, endDate, targeting, status, adminApproved)
       VALUES (?, ?, 'product', ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`
    ).bind(user.id, name, productId, budget, dailyBudget, bidType, bidAmount, new Date(startDate).toISOString(), new Date(endDate).toISOString(), JSON.stringify(targeting)).run();

    const campaignId = result.meta.last_row_id;

    // Deduct budget from wallet
    await c.env.DB.prepare(
      `UPDATE wallets SET balance = balance - ? WHERE vendorId = ?`
    ).bind(budget, user.id).run();

    return c.json({
      success: true,
      message: 'Product ad campaign created successfully. Waiting for admin approval.',
      campaign: { id: campaignId }
    }, 201);
  } catch (error) {
    console.error('Create product ad error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== CREATE BANNER AD CAMPAIGN ==========
ads.post('/banner', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    const { name, budget, dailyBudget, bidType = 'cpm', bidAmount, startDate, endDate, banner, targeting = {} } = body;

    if (!name || !budget || !dailyBudget || !bidAmount || !startDate || !endDate || !banner) {
      return c.json({ success: false, message: 'All fields are required' }, 400);
    }

    if (!banner.imageUrl || !banner.linkUrl) {
      return c.json({ success: false, message: 'Banner image and link are required' }, 400);
    }

    const wallet = await c.env.DB.prepare(
      `SELECT * FROM wallets WHERE vendorId = ?`
    ).bind(user.id).first();

    if (!wallet) {
      return c.json({ success: false, message: 'Wallet not found. Please recharge your wallet first.' }, 400);
    }

    if (wallet.balance < budget) {
      return c.json({ success: false, message: `Insufficient wallet balance. Need ₹${budget}. Available: ₹${wallet.balance}` }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO ad_campaigns (vendorId, name, type, budget, dailyBudget, bidType, bidAmount, startDate, endDate, banner, targeting, status, adminApproved)
       VALUES (?, ?, 'banner', ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`
    ).bind(user.id, name, budget, dailyBudget, bidType, bidAmount, new Date(startDate).toISOString(), new Date(endDate).toISOString(), JSON.stringify(banner), JSON.stringify(targeting)).run();

    const campaignId = result.meta.last_row_id;

    await c.env.DB.prepare(
      `UPDATE wallets SET balance = balance - ? WHERE vendorId = ?`
    ).bind(budget, user.id).run();

    return c.json({
      success: true,
      message: 'Banner ad campaign created successfully. Waiting for admin approval.',
      campaign: { id: campaignId }
    }, 201);
  } catch (error) {
    console.error('Create banner ad error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== UPDATE CAMPAIGN ==========
ads.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const campaign = await c.env.DB.prepare(
      `SELECT * FROM ad_campaigns WHERE id = ? AND vendorId = ?`
    ).bind(c.req.param('id'), user.id).first();

    if (!campaign) {
      return c.json({ success: false, message: 'Campaign not found' }, 404);
    }

    if (campaign.status === 'active') {
      return c.json({ success: false, message: 'Cannot edit active campaign. Pause it first.' }, 400);
    }

    const allowedFields = ['name', 'budget', 'dailyBudget', 'bidAmount', 'endDate', 'targeting'];
    if (campaign.type === 'banner') {
      allowedFields.push('banner');
    }

    let updateQuery = `UPDATE ad_campaigns SET `;
    let updateParams = [];
    allowedFields.forEach((field, index) => {
      if (body[field] !== undefined) {
        updateQuery += `${field} = ?, `;
        updateParams.push(typeof body[field] === 'object' ? JSON.stringify(body[field]) : body[field]);
      }
    });

    updateQuery += `updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND vendorId = ?`;
    updateParams.push(c.req.param('id'), user.id);

    await c.env.DB.prepare(updateQuery).bind(...updateParams).run();

    return c.json({ success: true, message: 'Campaign updated successfully' });
  } catch (error) {
    console.error('Update campaign error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== PAUSE CAMPAIGN ==========
ads.patch('/:id/pause', async (c) => {
  try {
    const user = c.get('user');
    const campaign = await c.env.DB.prepare(
      `SELECT * FROM ad_campaigns WHERE id = ? AND vendorId = ?`
    ).bind(c.req.param('id'), user.id).first();

    if (!campaign) return c.json({ success: false, message: 'Campaign not found' }, 404);
    if (campaign.status !== 'active') return c.json({ success: false, message: 'Only active campaigns can be paused' }, 400);

    await c.env.DB.prepare(
      `UPDATE ad_campaigns SET status = 'paused', pausedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(c.req.param('id')).run();

    return c.json({ success: true, message: 'Campaign paused successfully' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== RESUME CAMPAIGN ==========
ads.patch('/:id/resume', async (c) => {
  try {
    const user = c.get('user');
    const campaign = await c.env.DB.prepare(
      `SELECT * FROM ad_campaigns WHERE id = ? AND vendorId = ?`
    ).bind(c.req.param('id'), user.id).first();

    if (!campaign) return c.json({ success: false, message: 'Campaign not found' }, 404);
    if (campaign.status !== 'paused') return c.json({ success: false, message: 'Only paused campaigns can be resumed' }, 400);

    const now = new Date();
    if (new Date(campaign.endDate) < now) {
      await c.env.DB.prepare(`UPDATE ad_campaigns SET status = 'ended' WHERE id = ?`).bind(c.req.param('id')).run();
      return c.json({ success: false, message: 'Campaign has ended. Cannot resume.' }, 400);
    }

    if (campaign.spent >= campaign.budget) {
      await c.env.DB.prepare(`UPDATE ad_campaigns SET status = 'completed' WHERE id = ?`).bind(c.req.param('id')).run();
      return c.json({ success: false, message: 'Campaign budget exhausted. Cannot resume.' }, 400);
    }

    await c.env.DB.prepare(
      `UPDATE ad_campaigns SET status = 'active', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(c.req.param('id')).run();

    return c.json({ success: true, message: 'Campaign resumed successfully' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== DELETE CAMPAIGN ==========
ads.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const campaign = await c.env.DB.prepare(
      `SELECT * FROM ad_campaigns WHERE id = ? AND vendorId = ?`
    ).bind(c.req.param('id'), user.id).first();

    if (!campaign) return c.json({ success: false, message: 'Campaign not found' }, 404);

    if (campaign.status === 'active' || campaign.status === 'paused') {
      return c.json({ success: false, message: 'Cannot delete active or paused campaign. End it first.' }, 400);
    }

    if (campaign.status === 'pending' && campaign.spent === 0) {
      await c.env.DB.prepare(
        `UPDATE wallets SET balance = balance + ? WHERE vendorId = ?`
      ).bind(campaign.budget, user.id).run();
    }

    await c.env.DB.prepare(`DELETE FROM ad_campaigns WHERE id = ?`).bind(c.req.param('id')).run();

    return c.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== GET CAMPAIGN STATS ==========
ads.get('/:id/stats', async (c) => {
  try {
    const user = c.get('user');
    const campaign = await c.env.DB.prepare(
      `SELECT * FROM ad_campaigns WHERE id = ? AND vendorId = ?`
    ).bind(c.req.param('id'), user.id).first();

    if (!campaign) return c.json({ success: false, message: 'Campaign not found' }, 404);

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
      cpm: campaign.impressions > 0 ? (campaign.spent / campaign.impressions * 1000).toFixed(2) : 0
    };

    return c.json({ success: true, stats });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ============================================
// ✅ PUBLIC AD ROUTES
// ============================================

// ========== GET SPONSORED PRODUCTS ==========
ads.get('/public/sponsored-products', async (c) => {
  try {
    const { category, limit = 10 } = c.req.query();
    
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM ad_campaigns 
       WHERE type = 'product' AND status = 'active' AND adminApproved = 1
       ORDER BY bidAmount DESC LIMIT ?`
    ).bind(parseInt(limit)).all();

    const products = results.map(r => r.productId).filter(p => p);

    return c.json({
      success: true,
      products,
      sponsored: true
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== GET PUBLIC BANNERS ==========
ads.get('/public/banners', async (c) => {
  try {
    const { position = 'homepage_top', limit = 5 } = c.req.query();
    const now = new Date().toISOString();

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM ad_campaigns 
       WHERE type = 'banner' AND status = 'active' AND adminApproved = 1
       AND startDate <= ? AND endDate >= ?
       AND spent < budget
       ORDER BY bidAmount DESC LIMIT ?`
    ).bind(now, now, parseInt(limit)).all();

    const bannersWithVendor = await Promise.all(results.map(async (banner) => {
      const vendor = await c.env.DB.prepare(
        `SELECT brandName, storeName FROM vendors WHERE id = ?`
      ).bind(banner.vendorId).first();

      return {
        ...banner,
        banner: safeParse(banner.banner),
        vendorName: vendor?.brandName || vendor?.storeName || 'Vendor'
      };
    }));

    return c.json({
      success: true,
      banners: bannersWithVendor
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ============================================
// ✅ ADMIN AD ROUTES
// ============================================

// ========== ADMIN: GET ALL CAMPAIGNS ==========
ads.get('/admin/all', async (c) => {
  try {
    const { page = 1, limit = 20, status, type } = c.req.query();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = `SELECT * FROM ad_campaigns WHERE 1=1`;
    let params = [];

    if (status) { query += ` AND status = ?`; params.push(status); }
    if (type) { query += ` AND type = ?`; params.push(type); }

    query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    params.push(limitNum, skip);

    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    const totalResult = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM ad_campaigns`).first();

    return c.json({
      success: true,
      campaigns: results,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalResult.count / limitNum),
        totalCampaigns: totalResult.count,
        limit: limitNum
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== ADMIN: APPROVE CAMPAIGN ==========
ads.patch('/admin/:id/approve', async (c) => {
  try {
    const { remarks } = await c.req.json().catch(() => ({}));
    const campaign = await c.env.DB.prepare(
      `SELECT * FROM ad_campaigns WHERE id = ?`
    ).bind(c.req.param('id')).first();

    if (!campaign) return c.json({ success: false, message: 'Campaign not found' }, 404);
    if (campaign.status !== 'pending') return c.json({ success: false, message: 'Only pending campaigns can be approved' }, 400);

    await c.env.DB.prepare(
      `UPDATE ad_campaigns SET status = 'active', adminApproved = 1, adminRemarks = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(remarks || '', c.req.param('id')).run();

    return c.json({ success: true, message: 'Campaign approved successfully' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== ADMIN: REJECT CAMPAIGN ==========
ads.patch('/admin/:id/reject', async (c) => {
  try {
    const { reason = 'Campaign does not meet our advertising guidelines.', remarks } = await c.req.json().catch(() => ({}));
    const campaign = await c.env.DB.prepare(
      `SELECT * FROM ad_campaigns WHERE id = ?`
    ).bind(c.req.param('id')).first();

    if (!campaign) return c.json({ success: false, message: 'Campaign not found' }, 404);
    if (campaign.status !== 'pending') return c.json({ success: false, message: 'Only pending campaigns can be rejected' }, 400);

    await c.env.DB.prepare(
      `UPDATE ad_campaigns SET status = 'rejected', adminApproved = 0, rejectedReason = ?, adminRemarks = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(reason, remarks || '', c.req.param('id')).run();

    // Refund budget
    if (campaign.spent === 0) {
      await c.env.DB.prepare(
        `UPDATE wallets SET balance = balance + ? WHERE vendorId = ?`
      ).bind(campaign.budget, campaign.vendorId).run();
    }

    return c.json({ success: true, message: 'Campaign rejected. Budget refunded to vendor wallet.' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== ADMIN: FORCE END CAMPAIGN ==========
ads.patch('/admin/:id/end', async (c) => {
  try {
    const { reason = 'Ended by admin.' } = await c.req.json().catch(() => ({}));
    const campaign = await c.env.DB.prepare(
      `SELECT * FROM ad_campaigns WHERE id = ?`
    ).bind(c.req.param('id')).first();

    if (!campaign) return c.json({ success: false, message: 'Campaign not found' }, 404);
    if (campaign.status === 'completed' || campaign.status === 'ended') return c.json({ success: false, message: 'Campaign is already ended' }, 400);

    const remaining = campaign.budget - campaign.spent;

    await c.env.DB.prepare(
      `UPDATE ad_campaigns SET status = 'ended', completedAt = CURRENT_TIMESTAMP, adminRemarks = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(reason, c.req.param('id')).run();

    if (remaining > 0) {
      await c.env.DB.prepare(
        `UPDATE wallets SET balance = balance + ? WHERE vendorId = ?`
      ).bind(remaining, campaign.vendorId).run();
    }

    return c.json({ success: true, message: 'Campaign ended. Remaining budget refunded.' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== ADMIN: GET AD STATS ==========
ads.get('/admin/stats', async (c) => {
  try {
    const total = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM ad_campaigns`).first();
    const active = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM ad_campaigns WHERE status = 'active'`).first();
    const pending = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM ad_campaigns WHERE status = 'pending'`).first();
    const completed = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM ad_campaigns WHERE status = 'completed'`).first();

    const aggregate = await c.env.DB.prepare(
      `SELECT 
        COALESCE(SUM(impressions), 0) as totalImpressions,
        COALESCE(SUM(clicks), 0) as totalClicks,
        COALESCE(SUM(conversions), 0) as totalConversions,
        COALESCE(SUM(revenue), 0) as totalRevenue,
        COALESCE(SUM(spent), 0) as totalSpent,
        COALESCE(SUM(budget), 0) as totalBudget
       FROM ad_campaigns`
    ).first();

    return c.json({
      success: true,
      summary: {
        totalCampaigns: total.count,
        activeCampaigns: active.count,
        pendingCampaigns: pending.count,
        completedCampaigns: completed.count
      },
      stats: aggregate
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ============================================
// ✅ TRACKING ROUTES
// ============================================

// ========== TRACK IMPRESSION ==========
ads.post('/track/impression/:campaignId', async (c) => {
  try {
    const campaign = await c.env.DB.prepare(
      `SELECT * FROM ad_campaigns WHERE id = ?`
    ).bind(c.req.param('campaignId')).first();

    if (!campaign) return c.json({ success: false, message: 'Campaign not found' }, 404);

    await c.env.DB.prepare(
      `UPDATE ad_campaigns SET impressions = impressions + 1, spent = spent + ? WHERE id = ?`
    ).bind(campaign.bidAmount * 0.001, c.req.param('campaignId')).run(); // Assume CPM model

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== TRACK CLICK ==========
ads.get('/track/click/:campaignId', async (c) => {
  try {
    const campaign = await c.env.DB.prepare(
      `SELECT * FROM ad_campaigns WHERE id = ?`
    ).bind(c.req.param('campaignId')).first();

    if (!campaign) return c.json({ success: false, message: 'Campaign not found' }, 404);
    if (campaign.status !== 'active') return c.json({ success: false, message: 'Campaign is not active' }, 400);

    if (campaign.spent >= campaign.budget) {
      await c.env.DB.prepare(`UPDATE ad_campaigns SET status = 'completed' WHERE id = ?`).bind(c.req.param('campaignId')).run();
      return c.json({ success: false, message: 'Campaign budget exhausted' }, 400);
    }

    await c.env.DB.prepare(
      `UPDATE ad_campaigns SET clicks = clicks + 1, spent = spent + ? WHERE id = ?`
    ).bind(campaign.bidAmount, c.req.param('campaignId')).run();

    // Deduct from wallet
    await c.env.DB.prepare(
      `UPDATE wallets SET balance = balance - ? WHERE vendorId = ?`
    ).bind(campaign.bidAmount, campaign.vendorId).run();

    // Redirect
    if (campaign.type === 'product' && campaign.productId) {
      return c.redirect(`/product/${campaign.productId}`);
    } else if (campaign.type === 'banner' && campaign.banner) {
      const banner = safeParse(campaign.banner);
      if (banner.linkUrl) return c.redirect(banner.linkUrl);
    }

    return c.json({ success: true, message: 'Click tracked successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

// ========== TRACK CONVERSION ==========
ads.post('/track/conversion/:campaignId', async (c) => {
  try {
    const { revenue = 0 } = await c.req.json();
    const campaign = await c.env.DB.prepare(
      `SELECT * FROM ad_campaigns WHERE id = ?`
    ).bind(c.req.param('campaignId')).first();

    if (!campaign) return c.json({ success: false, message: 'Campaign not found' }, 404);

    await c.env.DB.prepare(
      `UPDATE ad_campaigns SET conversions = conversions + 1, revenue = revenue + ? WHERE id = ?`
    ).bind(revenue, c.req.param('campaignId')).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default ads;
