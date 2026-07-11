const cron = require('node-cron');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendReviewReminderEmail } = require('../services/emailService');

// ✅ Daily at 9:00 AM - Send review reminders
cron.schedule('0 9 * * *', async () => {
  console.log('📧 [CRON] Running review reminder job...');
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  try {
    // Find delivered orders (7+ days old) without review
    const orders = await Order.find({
      status: 'delivered',
      deliveredAt: { $lte: sevenDaysAgo },
      reviewReminderSent: { $ne: true }
    })
    .populate('userId', 'name email')
    .populate('items.productId', 'name');
    
    console.log(`📦 Found ${orders.length} orders for reminders`);
    
    let sentCount = 0;
    
    for (const order of orders) {
      try {
        // Check if review already exists
        const Review = require('../models/Review');
        const existingReview = await Review.findOne({
          userId: order.userId._id,
          orderId: order._id,
          productId: order.items[0].productId._id
        });
        
        if (!existingReview) {
          // Send reminder email
          await sendReviewReminderEmail(order.userId.email, {
            name: order.userId.name,
            productName: order.items[0].productId.name,
            productId: order.items[0].productId._id,
            orderId: order._id
          });
          
          // Mark as sent
          order.reviewReminderSent = true;
          order.reviewReminderSentAt = new Date();
          await order.save();
          
          sentCount++;
          console.log(`✅ Reminder sent to ${order.userId.email} (${sentCount})`);
        } else {
          // Mark as sent (already reviewed)
          order.reviewReminderSent = true;
          order.reviewReminderSentAt = new Date();
          await order.save();
          console.log(`ℹ️ Already reviewed: ${order.userId.email}`);
        }
      } catch (err) {
        console.error(`❌ Error for ${order.userId.email}:`, err.message);
      }
    }
    
    console.log(`✅ [CRON] Review reminders sent: ${sentCount}`);
  } catch (error) {
    console.error('❌ [CRON] Review reminder error:', error);
  }
});

module.exports = cron;
