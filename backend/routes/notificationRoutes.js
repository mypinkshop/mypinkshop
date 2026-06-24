const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// ✅ Admin: Send notification
router.post('/send', [auth, adminAuth], async (req, res) => {
  try {
    const { title, message, userType, userId, type } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    let users = [];
    if (userType === 'specific' && userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      users = [user];
    } else {
      users = await User.find({});
    }

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No users found' });
    }

    const notifications = await Promise.all(
      users.map(async (user) => {
        const notification = new Notification({
          userId: user._id,
          title,
          message,
          type: type || 'system',
          isRead: false,
          data: { 
            sentBy: req.user._id,
            sentByName: req.user.name || 'Admin',
            userType: userType || 'all'
          }
        });
        return await notification.save();
      })
    );

    res.status(200).json({ 
      success: true,
      message: `✅ Notification sent to ${notifications.length} users`,
      count: notifications.length
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification' });
  }
});

// ✅ Admin: Get sent notifications
router.get('/admin/sent', [auth, adminAuth], async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    
    const grouped = {};
    notifications.forEach(n => {
      const key = n.createdAt.toISOString().split('T')[0] + n.title + n.message;
      if (!grouped[key]) {
        grouped[key] = {
          _id: n._id,
          title: n.title,
          message: n.message,
          type: n.type,
          createdAt: n.createdAt,
          userCount: 0,
          users: [],
          sentBy: n.data?.sentByName || 'Admin'
        };
      }
      grouped[key].userCount++;
    });

    res.json(Object.values(grouped));
  } catch (error) {
    console.error('Get sent notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// ✅ Admin: Delete notification
router.delete('/admin/:id', [auth, adminAuth], async (req, res) => {
  try {
    const { id } = req.params;
    let result;
    if (id.length === 24) {
      result = await Notification.deleteOne({ _id: id });
    } else {
      result = await Notification.deleteMany({ title: id });
    }
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: `✅ ${result.deletedCount} notification(s) deleted` });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

// ✅ User: Get my notifications
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments({ userId: req.user._id })
    ]);
    
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user._id, 
      isRead: false 
    });
    
    res.json({
      success: true,
      notifications,
      unreadCount,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// ✅ User: Mark as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: '✅ Marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
});

// ✅ User: Mark all as read
router.put('/read-all', auth, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    
    res.json({ 
      success: true, 
      message: `✅ ${result.modifiedCount} notifications marked as read`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
});

// ✅ User: Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: '🗑️ Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

// ✅ User: Get unread count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user._id, 
      isRead: false 
    });
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
});

module.exports = router;
