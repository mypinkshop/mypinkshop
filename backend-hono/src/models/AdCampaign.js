// src/models/AdCampaign.js

// 📌 HELPER: Parse JSON safely
const safeParse = (str) => {
  try { return JSON.parse(str); } catch { return []; }
};

// 📌 HELPER: Update daily stats (Mongoose ke 'recordImpression', 'recordClick', 'recordConversion' ki jagah)
const updateDailyStats = (dailyStats, field, value) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  let updatedStats = [...dailyStats];
  const existingIndex = updatedStats.findIndex(stat => stat.date === todayStr);
  
  if (existingIndex >= 0) {
    updatedStats[existingIndex][field] += value;
  } else {
    const newStat = {
      date: todayStr,
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      revenue: 0
    };
    newStat[field] = value;
    updatedStats.push(newStat);
  }
  
  return updatedStats;
};

// 📌 HELPER: Get today's spend from dailyStats
const getDailySpend = (dailyStats) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const todayStat = dailyStats.find(stat => stat.date === todayStr);
  return todayStat ? todayStat.spend : 0;
};

// 📌 CREATE CAMPAIGN
export const createCampaign = async (db, data) => {
  const result = await db.prepare(
    `INSERT INTO ad_campaigns (vendorId, name, type, productId, budget, dailyBudget, bidType, bidAmount, startDate, endDate, banner, targeting, status, adminApproved)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`
  ).bind(
    data.vendorId, data.name, data.type, data.productId, data.budget,
    data.dailyBudget, data.bidType, data.bidAmount, data.startDate, data.endDate,
    JSON.stringify(data.banner || {}), JSON.stringify(data.targeting || {})
  ).run();
  
  return result.meta.last_row_id;
};

// 📌 GET CAMPAIGN BY ID
export const getCampaign = async (db, id, vendorId = null) => {
  let query = `SELECT * FROM ad_campaigns WHERE id = ?`;
  let params = [id];
  
  if (vendorId) {
    query += ` AND vendorId = ?`;
    params.push(vendorId);
  }
  
  return await db.prepare(query).bind(...params).first();
};

// 📌 GET ALL CAMPAIGNS (Vendor)
export const getVendorCampaigns = async (db, vendorId, page, limit, status, type) => {
  let query = `SELECT * FROM ad_campaigns WHERE vendorId = ?`;
  let params = [vendorId];
  
  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }
  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }
  
  query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
  params.push(limit, (page - 1) * limit);
  
  const { results } = await db.prepare(query).bind(...params).all();
  const totalResult = await db.prepare(`SELECT COUNT(*) as count FROM ad_campaigns WHERE vendorId = ?`).bind(vendorId).first();
  
  return { campaigns: results, total: totalResult.count };
};

// 📌 GET ACTIVE FOR PLACEMENT (Public)
export const getActiveForPlacement = async (db, type, category = null, limit = 10) => {
  let query = `SELECT * FROM ad_campaigns WHERE type = ? AND status = 'active' AND adminApproved = 1 AND spent < budget`;
  let params = [type];
  
  if (category) {
    query += ` AND targeting LIKE ?`;
    params.push(`%${category}%`);
  }
  
  query += ` ORDER BY bidAmount DESC LIMIT ?`;
  params.push(limit);
  
  const { results } = await db.prepare(query).bind(...params).all();
  
  return results;
};

// 📌 RECORD IMPRESSION
export const recordImpression = async (db, id) => {
  const campaign = await getCampaign(db, id);
  if (!campaign) return { success: false, message: 'Campaign not found' };
  
  const dailyStats = safeParse(campaign.dailyStats);
  const updatedStats = updateDailyStats(dailyStats, 'impressions', 1);
  
  await db.prepare(
    `UPDATE ad_campaigns SET impressions = impressions + 1, dailyStats = ? WHERE id = ?`
  ).bind(JSON.stringify(updatedStats), id).run();
  
  return { success: true };
};

// 📌 RECORD CLICK
export const recordClick = async (db, id) => {
  const campaign = await getCampaign(db, id);
  if (!campaign) return { success: false, message: 'Campaign not found' };
  
  if (campaign.status !== 'active') return { success: false, message: 'Campaign is not active' };
  
  // Check budget exhausted
  if (campaign.spent >= campaign.budget) {
    await db.prepare(
      `UPDATE ad_campaigns SET status = 'completed', completedAt = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(id).run();
    return { success: false, message: 'Campaign budget exhausted' };
  }
  
  // Record click + spend
  const dailyStats = safeParse(campaign.dailyStats);
  const updatedStats = updateDailyStats(dailyStats, 'clicks', 1);
  updatedStats[updatedStats.length - 1].spend += campaign.bidAmount;
  
  await db.prepare(
    `UPDATE ad_campaigns SET clicks = clicks + 1, spent = spent + ?, dailyStats = ? WHERE id = ?`
  ).bind(campaign.bidAmount, JSON.stringify(updatedStats), id).run();
  
  // Deduct from wallet
  const wallet = await db.prepare(`SELECT * FROM wallets WHERE vendorId = ?`).bind(campaign.vendorId).first();
  if (wallet) {
    if (wallet.balance < campaign.bidAmount) {
      await db.prepare(
        `UPDATE ad_campaigns SET status = 'paused', pausedAt = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(id).run();
      return { success: false, message: 'Vendor wallet insufficient balance. Campaign paused.' };
    }
    await db.prepare(
      `UPDATE wallets SET balance = balance - ? WHERE vendorId = ?`
    ).bind(campaign.bidAmount, campaign.vendorId).run();
  }
  
  return { success: true, campaign };
};

// 📌 RECORD CONVERSION
export const recordConversion = async (db, id, revenue = 0) => {
  const campaign = await getCampaign(db, id);
  if (!campaign) return { success: false, message: 'Campaign not found' };
  
  const dailyStats = safeParse(campaign.dailyStats);
  const updatedStats = updateDailyStats(dailyStats, 'conversions', 1);
  updatedStats[updatedStats.length - 1].revenue += revenue;
  
  await db.prepare(
    `UPDATE ad_campaigns SET conversions = conversions + 1, revenue = revenue + ?, dailyStats = ? WHERE id = ?`
  ).bind(revenue, JSON.stringify(updatedStats), id).run();
  
  return { success: true };
};

// 📌 GET CAMPAIGN STATS (With Daily Stats)
export const getCampaignStats = async (db, id, vendorId = null) => {
  const campaign = await getCampaign(db, id, vendorId);
  if (!campaign) return null;
  
  const dailyStats = safeParse(campaign.dailyStats);
  
  return {
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
    dailyStats: dailyStats.slice(-30)
  };
};
