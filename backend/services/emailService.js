const nodemailer = require('nodemailer');

// ============ TRANSPORTER ============
let transporter = null;
let isInitialized = false;
let initializationPromise = null;

const initTransporter = () => {
  if (isInitialized && transporter) return Promise.resolve(transporter);
  if (initializationPromise) return initializationPromise;
  
  console.log('🔧 Initializing Sender.net SMTP...');
  console.log('📧 SENDER_USERNAME:', process.env.SENDER_USERNAME ? '✅ Set' : '❌ Missing');
  console.log('📧 SENDER_PASSWORD:', process.env.SENDER_PASSWORD ? '✅ Set' : '❌ Missing');
  console.log('📧 SENDER_HOST:', process.env.SENDER_HOST || 'smtp.sender.net');
  console.log('📧 SENDER_PORT:', process.env.SENDER_PORT || 587);

  initializationPromise = new Promise((resolve, reject) => {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SENDER_HOST || 'smtp.sender.net',
        port: parseInt(process.env.SENDER_PORT) || 587,
        secure: process.env.SENDER_SECURE === 'true' || false,
        auth: {
          user: process.env.SENDER_USERNAME,
          pass: process.env.SENDER_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000
      });

      transporter.verify((error, success) => {
        if (error) {
          console.error('❌❌❌ Sender.net SMTP ERROR ❌❌❌');
          console.error('📛 Error message:', error.message);
          console.error('📛 Error code:', error.code);
          console.error('📛 Error command:', error.command);
          console.error('📛 Error response:', error.response);
          console.error('📛 Error responseCode:', error.responseCode);
          transporter = null;
          isInitialized = false;
          initializationPromise = null;
          reject(error);
        } else {
          console.log('✅✅✅ Sender.net SMTP is ready! ✅✅✅');
          isInitialized = true;
          initializationPromise = null;
          resolve(transporter);
        }
      });
    } catch (error) {
      console.error('❌❌❌ Failed to create transporter ❌❌❌');
      console.error('📛 Error:', error.message);
      transporter = null;
      isInitialized = false;
      initializationPromise = null;
      reject(error);
    }
  });

  return initializationPromise;
};

// ============ GENERIC SEND FUNCTION ============
const sendEmail = async (to, subject, html) => {
  console.log('📨 sendEmail called to:', to);
  
  if (!transporter || !isInitialized) {
    console.log('🔄 Transporter not ready, initializing...');
    try {
      await initTransporter();
    } catch (error) {
      console.error('❌ Transporter initialization failed:', error.message);
      console.log('🔐 FALLBACK MOCK - Email to:', to);
      return { 
        success: true, 
        mock: true, 
        error: error.message,
        message: 'Fallback mock mode'
      };
    }
  }

  if (!transporter || !isInitialized) {
    console.log('🔐 MOCK MODE - Email to:', to);
    console.log('📧 Subject:', subject);
    console.log('📝 HTML preview:', html?.substring(0, 200) + '...');
    return { 
      success: true, 
      mock: true, 
      message: 'Mock mode - email not sent'
    };
  }

  const mailOptions = {
    from: `"MyPinkShop" <noreply@mypinkshop.com>`,
    to: to,
    subject: subject,
    html: html
  };

  try {
    console.log('📤 Sending email to:', to);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', to, '| MessageId:', info.messageId);
    return { 
      success: true, 
      messageId: info.messageId,
      mock: false
    };
  } catch (error) {
    console.error('❌ Send email error:', error.message);
    console.log('🔐 FALLBACK MOCK - Email to:', to);
    return { 
      success: true, 
      mock: true, 
      error: error.message,
      message: 'Fallback mock mode'
    };
  }
};

// ============ TEST FUNCTION ============
const testEmailService = async () => {
  console.log('🧪 Testing email service...');
  const result = await sendEmail(
    'test@mypinkshop.com',
    '🧪 Test Email from MyPinkShop',
    '<h1>Test Successful!</h1><p>Your email service is working.</p>'
  );
  return result;
};

// ============================================
// ✅ AD CAMPAIGN EMAIL TEMPLATES & FUNCTIONS
// ============================================

// 1. Admin - New campaign pending approval
const sendNewCampaignToAdmin = async (adminEmail, campaign, vendor) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #EC4899, #F43F5E); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📢 New Ad Campaign</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Hello Admin,</p>
        <p style="color: #555; font-size: 15px;">A new ad campaign has been created and is pending your approval.</p>
        
        <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Campaign:</strong> ${campaign.name}</p>
          <p style="margin: 5px 0;"><strong>Vendor:</strong> ${vendor?.brandName || vendor?.name || 'Vendor'}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${campaign.type === 'product' ? 'Product Ad' : 'Banner Ad'}</p>
          <p style="margin: 5px 0;"><strong>Budget:</strong> ₹${campaign.budget?.toLocaleString() || 0}</p>
          <p style="margin: 5px 0;"><strong>Bid:</strong> ₹${campaign.bidAmount}/${campaign.bidType === 'cpc' ? 'click' : '1000 impressions'}</p>
          <p style="margin: 5px 0;"><strong>Dates:</strong> ${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()}</p>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <a href="https://www.mypinkshop.com/admin/advertising" style="background: #EC4899; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block;">Review Campaign</a>
        </div>
        
        <p style="color: #888; font-size: 13px; margin-top: 20px;">MyPinkShop Admin Team</p>
      </div>
    </div>
  `;
  return await sendEmail(adminEmail, `📢 New Ad Campaign Pending: ${campaign.name}`, html);
};

// 2. Vendor - Campaign approved
const sendCampaignApproved = async (vendor, campaign) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">✅ Campaign Approved!</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Dear ${vendor.name},</p>
        <p style="color: #555; font-size: 15px;">Great news! Your ad campaign has been approved and is now live.</p>
        
        <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Campaign:</strong> ${campaign.name}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${campaign.type === 'product' ? 'Product Ad' : 'Banner Ad'}</p>
          <p style="margin: 5px 0;"><strong>Budget:</strong> ₹${campaign.budget?.toLocaleString() || 0}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> 🟢 Active</p>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <a href="https://www.mypinkshop.com/vendor/ads/${campaign._id}" style="background: #EC4899; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block;">View Campaign</a>
          <a href="https://www.mypinkshop.com/vendor/dashboard" style="background: #6B7280; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block;">Dashboard</a>
        </div>
        
        <p style="color: #888; font-size: 13px; margin-top: 20px;">MyPinkShop Team</p>
      </div>
    </div>
  `;
  return await sendEmail(vendor.email, `✅ Campaign Approved: ${campaign.name}`, html);
};

// 3. Vendor - Campaign rejected
const sendCampaignRejected = async (vendor, campaign, reason) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #EF4444, #DC2626); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">❌ Campaign Rejected</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Dear ${vendor.name},</p>
        <p style="color: #555; font-size: 15px;">Your ad campaign has been rejected.</p>
        
        <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Campaign:</strong> ${campaign.name}</p>
          <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason || 'Not specified'}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ❌ Rejected</p>
        </div>
        
        <p style="color: #555; font-size: 14px;">Your budget has been refunded to your wallet. You can create a new campaign with the suggested improvements.</p>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <a href="https://www.mypinkshop.com/vendor/ads" style="background: #EC4899; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block;">View Campaigns</a>
          <a href="https://www.mypinkshop.com/vendor/wallet" style="background: #10B981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block;">Check Wallet</a>
        </div>
        
        <p style="color: #888; font-size: 13px; margin-top: 20px;">MyPinkShop Team</p>
      </div>
    </div>
  `;
  return await sendEmail(vendor.email, `❌ Campaign Rejected: ${campaign.name}`, html);
};

// 4. Vendor - Budget exhausted
const sendBudgetExhausted = async (vendor, campaign) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #F59E0B, #D97706); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Budget Exhausted</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Dear ${vendor.name},</p>
        <p style="color: #555; font-size: 15px;">Your campaign has reached its budget limit and has been automatically paused.</p>
        
        <div style="background: #fffbeb; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Campaign:</strong> ${campaign.name}</p>
          <p style="margin: 5px 0;"><strong>Budget:</strong> ₹${campaign.budget?.toLocaleString() || 0}</p>
          <p style="margin: 5px 0;"><strong>Spent:</strong> ₹${campaign.spent?.toLocaleString() || 0}</p>
          <p style="margin: 5px 0;"><strong>Clicks:</strong> ${campaign.clicks?.toLocaleString() || 0}</p>
          <p style="margin: 5px 0;"><strong>Impressions:</strong> ${campaign.impressions?.toLocaleString() || 0}</p>
          <p style="margin: 5px 0;"><strong>Revenue Generated:</strong> ₹${campaign.revenue?.toLocaleString() || 0}</p>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <a href="https://www.mypinkshop.com/vendor/wallet" style="background: #EC4899; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block;">Recharge Wallet</a>
          <a href="https://www.mypinkshop.com/vendor/ads/${campaign._id}" style="background: #6B7280; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block;">View Campaign</a>
        </div>
        
        <p style="color: #888; font-size: 13px; margin-top: 20px;">MyPinkShop Team</p>
      </div>
    </div>
  `;
  return await sendEmail(vendor.email, `⚠️ Campaign Budget Exhausted: ${campaign.name}`, html);
};

// 5. Vendor - Daily budget reached
const sendDailyBudgetReached = async (vendor, campaign) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #8B5CF6, #7C3AED); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📊 Daily Budget Limit</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Dear ${vendor.name},</p>
        <p style="color: #555; font-size: 15px;">Your campaign has reached its daily budget limit. Ads will resume tomorrow.</p>
        
        <div style="background: #f5f3ff; border: 1px solid #c4b5fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Campaign:</strong> ${campaign.name}</p>
          <p style="margin: 5px 0;"><strong>Daily Budget:</strong> ₹${campaign.dailyBudget?.toLocaleString() || 0}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ⏸️ Paused (Resumes Tomorrow)</p>
        </div>
        
        <p style="color: #888; font-size: 13px; margin-top: 20px;">MyPinkShop Team</p>
      </div>
    </div>
  `;
  return await sendEmail(vendor.email, `📊 Daily Budget Limit Reached: ${campaign.name}`, html);
};

// 6. Vendor - Campaign expiring
const sendCampaignExpiring = async (vendor, campaign) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #F59E0B, #D97706); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Campaign Expiring Soon</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Dear ${vendor.name},</p>
        <p style="color: #555; font-size: 15px;">Your campaign will expire in 3 days. Renew it to continue advertising.</p>
        
        <div style="background: #fffbeb; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Campaign:</strong> ${campaign.name}</p>
          <p style="margin: 5px 0;"><strong>End Date:</strong> ${new Date(campaign.endDate).toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Days Left:</strong> 3 days</p>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <a href="https://www.mypinkshop.com/vendor/ads/${campaign._id}" style="background: #EC4899; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block;">Renew Campaign</a>
        </div>
        
        <p style="color: #888; font-size: 13px; margin-top: 20px;">MyPinkShop Team</p>
      </div>
    </div>
  `;
  return await sendEmail(vendor.email, `⏰ Campaign Expiring Soon: ${campaign.name}`, html);
};

// 7. Vendor - Click threshold reached
const sendClickThreshold = async (vendor, campaign, clicks) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🎯 ${clicks} Clicks Achieved!</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Dear ${vendor.name},</p>
        <p style="color: #555; font-size: 15px;">Congratulations! Your campaign has reached <strong>${clicks} clicks</strong>.</p>
        
        <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Campaign:</strong> ${campaign.name}</p>
          <p style="margin: 5px 0;"><strong>Total Clicks:</strong> ${campaign.clicks?.toLocaleString() || 0}</p>
          <p style="margin: 5px 0;"><strong>Impressions:</strong> ${campaign.impressions?.toLocaleString() || 0}</p>
          <p style="margin: 5px 0;"><strong>CTR:</strong> ${campaign.impressions > 0 ? (campaign.clicks / campaign.impressions * 100).toFixed(2) : 0}%</p>
          <p style="margin: 5px 0;"><strong>Revenue:</strong> ₹${campaign.revenue?.toLocaleString() || 0}</p>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <a href="https://www.mypinkshop.com/vendor/ads/${campaign._id}" style="background: #EC4899; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block;">View Campaign</a>
        </div>
        
        <p style="color: #888; font-size: 13px; margin-top: 20px;">MyPinkShop Team</p>
      </div>
    </div>
  `;
  return await sendEmail(vendor.email, `🎯 ${clicks} Clicks Achieved: ${campaign.name}`, html);
};

// 8. Admin - High spend alert
const sendAdminHighSpend = async (adminEmail, campaign, vendor) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #EF4444, #DC2626); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">💰 High Spend Alert</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Hello Admin,</p>
        <p style="color: #555; font-size: 15px;">A campaign has crossed ₹50,000 in spend. Please review.</p>
        
        <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Campaign:</strong> ${campaign.name}</p>
          <p style="margin: 5px 0;"><strong>Vendor:</strong> ${vendor?.brandName || vendor?.name || 'Vendor'}</p>
          <p style="margin: 5px 0;"><strong>Total Spent:</strong> ₹${campaign.spent?.toLocaleString() || 0}</p>
          <p style="margin: 5px 0;"><strong>Budget:</strong> ₹${campaign.budget?.toLocaleString() || 0}</p>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <a href="https://www.mypinkshop.com/admin/advertising" style="background: #EC4899; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block;">Review Campaign</a>
        </div>
        
        <p style="color: #888; font-size: 13px; margin-top: 20px;">MyPinkShop Admin Team</p>
      </div>
    </div>
  `;
  return await sendEmail(adminEmail, `💰 High Spend Alert: ${campaign.name}`, html);
};

// ============================================
// ✅ REVIEW EMAIL TEMPLATES & FUNCTIONS (NEW)
// ============================================

// 9. Customer - Review Reminder (after delivery)
const sendReviewReminderEmail = async (email, data) => {
  const { name, productName, productId, orderId } = data;
  
  const reviewLink = `${process.env.FRONTEND_URL || 'https://www.mypinkshop.com'}/product/${productId}#reviews`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #EC4899, #F43F5E); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📝 Review Your Purchase</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Dear <strong>${name}</strong>,</p>
        <p style="color: #555; font-size: 15px;">Thank you for purchasing <strong>${productName}</strong> from MyPinkShop!</p>
        <p style="color: #555; font-size: 15px;">We'd love to hear about your experience. Your review helps other customers make informed decisions.</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${reviewLink}" style="background: linear-gradient(135deg, #EC4899, #F43F5E); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block;">
            ✍️ Write a Review
          </a>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="color: #92400e; margin: 0;">🎁 <strong>Bonus:</strong> Get <strong>50 Loyalty Points</strong> for your review!</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;">
        <p style="color: #888; font-size: 13px;">Order ID: ${orderId}</p>
        <p style="color: #888; font-size: 13px; margin-top: 20px;">MyPinkShop Team</p>
      </div>
    </div>
  `;
  return await sendEmail(email, `📝 Review Your Purchase - ${productName}`, html);
};

// 10. Customer - Review Approved
const sendReviewApprovedEmail = async (email, data) => {
  const { name, productName, productId, rating, comment } = data;
  
  const productLink = `${process.env.FRONTEND_URL || 'https://www.mypinkshop.com'}/product/${productId}`;
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Review Approved!</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Dear <strong>${name}</strong>,</p>
        <p style="color: #555; font-size: 15px;">Great news! Your review for <strong>${productName}</strong> has been approved and is now live on our website.</p>
        
        <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0; color: #4b5563;">⭐ ${stars}</p>
          <p style="margin: 5px 0 0 0; color: #1f2937; font-style: italic;">"${comment}"</p>
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${productLink}" style="background: linear-gradient(135deg, #EC4899, #F43F5E); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block;">
            👀 View Your Review
          </a>
        </div>
        
        <p style="color: #555; font-size: 15px;">Thank you for helping other customers make better choices!</p>
        <p style="color: #888; font-size: 13px; margin-top: 20px;">MyPinkShop Team</p>
      </div>
    </div>
  `;
  return await sendEmail(email, `🎉 Your Review for ${productName} is Live!`, html);
};

// 11. Customer - Review Rejected
const sendReviewRejectedEmail = async (email, data) => {
  const { name, productName, reason } = data;
  
  const productLink = `${process.env.FRONTEND_URL || 'https://www.mypinkshop.com'}/product/${productId}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #EF4444, #DC2626); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Review Update</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Dear <strong>${name}</strong>,</p>
        <p style="color: #555; font-size: 15px;">Your review for <strong>${productName}</strong> was not approved.</p>
        
        <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${reason}</p>
        </div>
        
        <p style="color: #555; font-size: 14px;">You can submit a new review following our guidelines:</p>
        <ul style="color: #4b5563; font-size: 14px; padding-left: 20px;">
          <li>Be honest and respectful</li>
          <li>Focus on product quality and experience</li>
          <li>Avoid promotional content</li>
        </ul>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${productLink}" style="background: linear-gradient(135deg, #EC4899, #F43F5E); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block;">
            ✍️ Submit New Review
          </a>
        </div>
        
        <p style="color: #888; font-size: 13px; margin-top: 20px;">MyPinkShop Team</p>
      </div>
    </div>
  `;
  return await sendEmail(email, `⚠️ Review Update for ${productName}`, html);
};

// ============================================
// ✅ EXPORT ALL FUNCTIONS
// ============================================

module.exports = {
  // Core
  sendEmail,
  testEmailService,
  initTransporter,
  
  // Ad Campaign Emails
  sendNewCampaignToAdmin,
  sendCampaignApproved,
  sendCampaignRejected,
  sendBudgetExhausted,
  sendDailyBudgetReached,
  sendCampaignExpiring,
  sendClickThreshold,
  sendAdminHighSpend,
  
  // Review Emails (NEW)
  sendReviewReminderEmail,
  sendReviewApprovedEmail,
  sendReviewRejectedEmail
};
