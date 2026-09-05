import { Hono } from 'hono';

const notifications = new Hono();

// ========== TEST ROUTE ==========
notifications.get('/test', (c) => {
  return c.json({ success: true, message: '✅ Notification routes working!' });
});

// ========== ADMIN: SEND NOTIFICATION ==========
notifications.post('/send', async (c) => {
  try {
    const user = c.get('user'); // Assume auth middleware sets this
    if (!user || user.role !== 'admin') return c.json({ success: false, message: 'Admin access required' }, 403);

    const { title, message, userType, userId, type } = await c.req.json();
    
    if (!title || !message) {
      return c.json({ success: false, message: 'Title and message are required' }, 400);
    }

    let users = [];
    if (userType === 'specific' && userId) {
      const user = await c.env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(userId).first();
      if (!user) {
        return c.json({ success: false, message: 'User not found' }, 404);
      }
      users = [user];
    } else {
      const { results } = await c.env.DB.prepare(`SELECT * FROM users`).all();
      users = results;
    }

    if (users.length === 0) {
      return c.json({ success: false, message: 'No users found' }, 404);
    }

    // Create notifications for all users
    const notificationData = {
      sentBy: user.id,
      sentByName: user.name || 'Admin',
      userType: userType || 'all'
    };

    for (const targetUser of users) {
      await c.env.DB.prepare(
        `INSERT INTO notifications (userId, title, message, type, isRead, data) 
         VALUES (?, ?, ?, ?, 0, ?)`
      ).bind(targetUser.id, title, message, type || 'system', JSON.stringify(notificationData)).run();
    }

    return c.json({ 
      success: true,
      message: `✅ Notification sent to ${users.length} users`,
      count: users.length
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return c.json({ success: false, message: 'Failed to send notification', error: error.message }, 500);
  }
});

// ========== ADMIN: GET SENT NOTIFICATIONS ==========
notifications.get('/admin/sent', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') return c.json({ success: false, message: 'Admin access required' }, 403);

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 100`
    ).all();

    const grouped = {};
    results.forEach(n => {
      const key = n.createdAt.split('T')[0] + n.title + n.message;
      if (!grouped[key]) {
        grouped[key] = {
          _id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          createdAt: n.createdAt,
          userCount: 0,
          users: [],
          sentBy: JSON.parse(n.data || '{}')?.sentByName || 'Admin'
        };
      }
      grouped[key].userCount++;
    });

    return c.json(Object.values(grouped));
  } catch (error) {
    console.error('Get sent notifications error:', error);
    return c.json({ success: false, message: 'Failed to fetch notifications' }, 500);
  }
});

// ========== ADMIN: DELETE NOTIFICATION ==========
notifications.delete('/admin/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') return c.json({ success: false, message: 'Admin access required' }, 403);

    const { id } = c.req.param();
    let result;

    // Check if id is a number (integer) or a title string
    if (!isNaN(parseInt(id))) {
      result = await c.env.DB.prepare(`DELETE FROM notifications WHERE id = ?`).bind(parseInt(id)).run();
    } else {
      result = await c.env.DB.prepare(`DELETE FROM notifications WHERE title = ?`).bind(id).run();
    }
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, message: 'Notification not found' }, 404);
    }
    
    return c.json({ success: true, message: `✅ ${result.meta.changes} notification(s) deleted` });
  } catch (error) {
    console.error('Delete notification error:', error);
    return c.json({ success: false, message: 'Failed to delete notification' }, 500);
  }
});

// ========== USER: GET MY NOTIFICATIONS ==========
notifications.get('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

    const { limit = 50, page = 1 } = c.req.query();
    const skip = (page - 1) * limit;
    
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`
    ).bind(user.id, parseInt(limit), skip).all();

    const unreadCount = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0`
    ).bind(user.id).first();
    
    const total = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM notifications WHERE userId = ?`
    ).bind(user.id).first();

    return c.json({
      success: true,
      notifications: results,
      unreadCount: unreadCount.count,
      total: total.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total.count / limit)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ success: false, message: 'Failed to fetch notifications' }, 500);
  }
});

// ========== USER: MARK ONE AS READ ==========
notifications.put('/:id/read', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

    const notification = await c.env.DB.prepare(
      `SELECT * FROM notifications WHERE id = ? AND userId = ?`
    ).bind(parseInt(c.req.param('id')), user.id).first();
    
    if (!notification) {
      return c.json({ success: false, message: 'Notification not found' }, 404);
    }

    await c.env.DB.prepare(
      `UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?`
    ).bind(parseInt(c.req.param('id')), user.id).run();

    return c.json({ success: true, message: '✅ Marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    return c.json({ success: false, message: 'Failed to mark as read' }, 500);
  }
});

// ========== USER: MARK ALL AS READ ==========
notifications.put('/read-all', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

    const result = await c.env.DB.prepare(
      `UPDATE notifications SET isRead = 1 WHERE userId = ? AND isRead = 0`
    ).bind(user.id).run();

    return c.json({ 
      success: true, 
      message: `✅ ${result.meta.changes} notifications marked as read`,
      count: result.meta.changes
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    return c.json({ success: false, message: 'Failed to mark all as read' }, 500);
  }
});

// ========== USER: DELETE NOTIFICATION ==========
notifications.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

    const notification = await c.env.DB.prepare(
      `SELECT * FROM notifications WHERE id = ? AND userId = ?`
    ).bind(parseInt(c.req.param('id')), user.id).first();
    
    if (!notification) {
      return c.json({ success: false, message: 'Notification not found' }, 404);
    }

    await c.env.DB.prepare(
      `DELETE FROM notifications WHERE id = ? AND userId = ?`
    ).bind(parseInt(c.req.param('id')), user.id).run();

    return c.json({ success: true, message: '🗑️ Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return c.json({ success: false, message: 'Failed to delete notification' }, 500);
  }
});

// ========== USER: GET UNREAD COUNT ==========
notifications.get('/unread-count', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

    const count = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0`
    ).bind(user.id).first();

    return c.json({ unreadCount: count.count });
  } catch (error) {
    console.error('Unread count error:', error);
    return c.json({ success: false, message: 'Failed to get unread count' }, 500);
  }
});

export default notifications;
