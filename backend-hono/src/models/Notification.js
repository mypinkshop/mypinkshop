// src/models/Notification.js

// 📌 HELPER: Parse JSON safely
const safeParse = (str) => {
  try { return JSON.parse(str); } catch { return {}; }
};

// 📌 CREATE NOTIFICATION
export const createNotification = async (db, data) => {
  const result = await db.prepare(
    `INSERT INTO notifications (userId, title, message, type, isRead, data)
     VALUES (?, ?, ?, ?, 0, ?)`
  ).bind(
    data.userId,
    data.title,
    data.message,
    data.type || 'system',
    JSON.stringify(data.data || {})
  ).run();

  return result.meta.last_row_id;
};

// 📌 GET NOTIFICATION BY ID
export const getNotification = async (db, id, userId = null) => {
  let query = `SELECT * FROM notifications WHERE id = ?`;
  let params = [id];

  if (userId) {
    query += ` AND userId = ?`;
    params.push(userId);
  }

  return await db.prepare(query).bind(...params).first();
};

// 📌 GET ALL NOTIFICATIONS (User)
export const getUserNotifications = async (db, userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(userId, limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM notifications WHERE userId = ?`
  ).bind(userId).first();

  const unreadResult = await db.prepare(
    `SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0`
  ).bind(userId).first();

  return {
    notifications: results,
    total: totalResult.count,
    unreadCount: unreadResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 GET ALL NOTIFICATIONS (Admin)
export const getAdminNotifications = async (db, page = 1, limit = 100) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM notifications ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM notifications`
  ).first();

  return {
    notifications: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 GET UNREAD COUNT
export const getUnreadCount = async (db, userId) => {
  const result = await db.prepare(
    `SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0`
  ).bind(userId).first();

  return result.count;
};

// 📌 MARK ONE AS READ
export const markAsRead = async (db, id, userId = null) => {
  let query = `UPDATE notifications SET isRead = 1 WHERE id = ?`;
  let params = [id];

  if (userId) {
    query += ` AND userId = ?`;
    params.push(userId);
  }

  const result = await db.prepare(query).bind(...params).run();
  return result.meta.changes > 0;
};

// 📌 MARK ALL AS READ
export const markAllAsRead = async (db, userId) => {
  const result = await db.prepare(
    `UPDATE notifications SET isRead = 1 WHERE userId = ? AND isRead = 0`
  ).bind(userId).run();

  return result.meta.changes > 0;
};

// 📌 DELETE NOTIFICATION
export const deleteNotification = async (db, id, userId = null) => {
  let query = `DELETE FROM notifications WHERE id = ?`;
  let params = [id];

  if (userId) {
    query += ` AND userId = ?`;
    params.push(userId);
  }

  const result = await db.prepare(query).bind(...params).run();
  return result.meta.changes > 0;
};

// 📌 GET ALL NOTIFICATIONS (Admin) - Grouped by title/message
export const getGroupedNotifications = async (db) => {
  const { results } = await db.prepare(
    `SELECT id, title, message, type, createdAt, data FROM notifications ORDER BY createdAt DESC LIMIT 100`
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
        sentBy: safeParse(n.data)?.sentByName || 'Admin'
      };
    }
    grouped[key].userCount++;
  });

  return Object.values(grouped);
};
