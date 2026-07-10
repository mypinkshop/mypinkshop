const cron = require('node-cron');
const AdCampaign = require('../models/AdCampaign');
const Vendor = require('../models/Vendor');
const emailService = require('./emailService');

// ============================================
// ✅ SCHEDULE: Check for expiring campaigns (Daily at 9 AM)
// ============================================
const scheduleExpiryCheck = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('🔍 Checking for expiring campaigns...');
    
    try {
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const expiringCampaigns = await AdCampaign.find({
        status: 'active',
        endDate: {
          $gte: now,
          $lte: threeDaysFromNow
        }
      });

      console.log(`📧 Found ${expiringCampaigns.length} expiring campaigns`);

      for (const campaign of expiringCampaigns) {
        const vendor = await Vendor.findById(campaign.vendorId);
        if (vendor) {
          await emailService.sendCampaignExpiring(vendor, campaign);
          console.log(`📧 Expiry reminder sent for: ${campaign.name} (${vendor.email})`);
        }
        // Wait 2 seconds between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('❌ Expiry check error:', error);
    }
  });

  console.log('✅ Expiry check cron job scheduled (daily at 9 AM)');
};

// ============================================
// ✅ SCHEDULE: Check for paused campaigns with expired dates (Every 6 hours)
// ============================================
const schedulePausedCampaignCheck = () => {
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔍 Checking for paused campaigns with expired dates...');
    
    try {
      const now = new Date();

      const pausedExpired = await AdCampaign.find({
        status: 'paused',
        endDate: { $lt: now }
      });

      for (const campaign of pausedExpired) {
        campaign.status = 'ended';
        campaign.completedAt = new Date();
        await campaign.save();
        console.log(`⏰ Campaign "${campaign.name}" marked as ended (paused & expired)`);
      }
    } catch (error) {
      console.error('❌ Paused campaign check error:', error);
    }
  });

  console.log('✅ Paused campaign check cron job scheduled (every 6 hours)');
};

// ============================================
// ✅ SCHEDULE: Check for campaigns that ended today (Midnight)
// ============================================
const scheduleEndedCampaignCheck = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('🔍 Checking for campaigns that ended today...');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const endedCampaigns = await AdCampaign.find({
        status: 'active',
        endDate: {
          $gte: today,
          $lt: tomorrow
        }
      });

      for (const campaign of endedCampaigns) {
        campaign.status = 'completed';
        campaign.completedAt = new Date();
        await campaign.save();
        console.log(`✅ Campaign "${campaign.name}" marked as completed (end date reached)`);
      }
    } catch (error) {
      console.error('❌ Ended campaign check error:', error);
    }
  });

  console.log('✅ Ended campaign check cron job scheduled (daily at midnight)');
};

// ============================================
// ✅ SCHEDULE: Weekly summary report to admin (Every Monday at 10 AM)
// ============================================
const scheduleWeeklyReport = () => {
  cron.schedule('0 10 * * 1', async () => {
    console.log('📊 Generating weekly ad summary report...');
    
    try {
      const admin = await User.findOne({ role: 'admin' });
      if (!admin) {
        console.log('⚠️ Admin not found for weekly report');
        return;
      }

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklyStats = await AdCampaign.aggregate([
        {
          $match: {
            createdAt: { $gte: weekAgo }
          }
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$spent' },
            totalRevenue: { $sum: '$revenue' },
            totalImpressions: { $sum: '$impressions' },
            totalClicks: { $sum: '$clicks' },
            totalConversions: { $sum: '$conversions' },
            count: { $sum: 1 }
          }
        }
      ]);

      const stats = weeklyStats[0] || {
        totalSpent: 0,
        totalRevenue: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        count: 0
      };

      // Send email to admin
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #EC4899, #F43F5E); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📊 Weekly Ad Summary</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 16px;">Hello Admin,</p>
            <p style="color: #555; font-size: 15px;">Here is your weekly ad performance summary.</p>
            
            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>New Campaigns:</strong> ${stats.count}</p>
              <p style="margin: 5px 0;"><strong>Total Spent:</strong> ₹${stats.totalSpent.toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Total Revenue:</strong> ₹${stats.totalRevenue.toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Impressions:</strong> ${stats.totalImpressions.toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Clicks:</strong> ${stats.totalClicks.toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Conversions:</strong> ${stats.totalConversions.toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>ROI:</strong> ${stats.totalSpent > 0 ? ((stats.totalRevenue - stats.totalSpent) / stats.totalSpent * 100).toFixed(1) : 0}%</p>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
              <a href="https://www.mypinkshop.com/admin/ad-analytics" style="background: #EC4899; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block;">View Full Analytics</a>
            </div>
            
            <p style="color: #888; font-size: 13px; margin-top: 20px;">MyPinkShop Admin Team</p>
          </div>
        </div>
      `;

      await emailService.sendEmail(admin.email, '📊 Weekly Ad Summary Report', html);
      console.log('📧 Weekly report sent to admin');

    } catch (error) {
      console.error('❌ Weekly report error:', error);
    }
  });

  console.log('✅ Weekly report cron job scheduled (every Monday at 10 AM)');
};

// ============================================
// ✅ START ALL CRON JOBS
// ============================================
const scheduleAllCrons = () => {
  console.log('🔄 Starting all ad cron jobs...');
  scheduleExpiryCheck();
  schedulePausedCampaignCheck();
  scheduleEndedCampaignCheck();
  scheduleWeeklyReport();
  console.log('✅ All ad cron jobs started successfully!');
};

module.exports = { scheduleAllCrons };
