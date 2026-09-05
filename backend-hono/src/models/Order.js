// src/models/Order.js

// ✅ Nykaa Style Order ID Generator (Cloudflare Workers Compatible)
const generateOrderId = () => {
  const prefix = 'MPS';
  const part1 = Math.floor(Math.random() * 900000000 + 100000000).toString();
  const part2 = Math.floor(Math.random() * 9000000 + 1000000).toString();
  const part3 = Math.floor(Math.random() * 9 + 1).toString();
  return `${prefix}-${part1}-${part2}-${part3}`;
};

// Helper: Parse JSON safely
const safeParse = (str) => {
  try { return JSON.parse(str); } catch { return {}; }
};

// 📌 CREATE ORDER
export const createOrder = async (db, data) => {
  const orderId = data.orderId || generateOrderId();
  const orderNumber = data.orderNumber || orderId;

  const result = await db.prepare(
    `INSERT INTO orders (orderId, orderNumber, buyerId, userId, buyerName, buyerEmail, buyerPhone, buyerAddress, vendorId, vendorName, productId, productName, quantity, price, total, status, paymentMethod, paymentStatus, orderDate, items, shipping)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'pending', CURRENT_TIMESTAMP, ?, ?)`
  ).bind(
    orderId,
    orderNumber,
    data.buyerId,
    data.userId || data.buyerId,
    data.buyerName || 'Customer',
    data.buyerEmail,
    data.buyerPhone,
    JSON.stringify(data.buyerAddress || {}),
    data.vendorId || null,
    data.vendorName || 'Vendor',
    data.productId || null,
    data.productName || '',
    data.quantity || 1,
    data.price || 0,
    data.total,
    data.paymentMethod || 'cod',
    JSON.stringify(data.items || []),
    JSON.stringify(data.shipping || {})
  ).run();

  return result.meta.last_row_id;
};

// 📌 GET ORDER BY ID
export const getOrder = async (db, id, buyerId = null) => {
  let query = `SELECT * FROM orders WHERE id = ?`;
  let params = [id];

  if (buyerId) {
    query += ` AND buyerId = ?`;
    params.push(buyerId);
  }

  return await db.prepare(query).bind(...params).first();
};

// 📌 GET ORDER BY ORDER ID
export const getOrderByOrderId = async (db, orderId, buyerId = null) => {
  let query = `SELECT * FROM orders WHERE orderId = ?`;
  let params = [orderId];

  if (buyerId) {
    query += ` AND buyerId = ?`;
    params.push(buyerId);
  }

  return await db.prepare(query).bind(...params).first();
};

// 📌 GET ALL ORDERS (User)
export const getUserOrders = async (db, buyerId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM orders WHERE buyerId = ? ORDER BY orderDate DESC LIMIT ? OFFSET ?`
  ).bind(buyerId, limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM orders WHERE buyerId = ?`
  ).bind(buyerId).first();

  return {
    orders: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 GET ALL ORDERS (Admin)
export const getAllOrders = async (db, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM orders ORDER BY orderDate DESC LIMIT ? OFFSET ?`
  ).bind(limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM orders`
  ).first();

  return {
    orders: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 GET ALL RETURNS (Admin)
export const getAllReturns = async (db, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM orders WHERE returnRequested = 1 ORDER BY orderDate DESC LIMIT ? OFFSET ?`
  ).bind(limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM orders WHERE returnRequested = 1`
  ).first();

  return {
    orders: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 UPDATE ORDER
export const updateOrder = async (db, id, data) => {
  let query = `UPDATE orders SET `;
  let params = [];
  let fields = Object.keys(data);

  fields.forEach((field, index) => {
    query += `${field} = ?, `;
    params.push(data[field]);
  });

  query += `updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  params.push(id);

  await db.prepare(query).bind(...params).run();

  return await getOrder(db, id);
};

// 📌 UPDATE ORDER STATUS
export const updateOrderStatus = async (db, id, status) => {
  const order = await getOrder(db, id);
  if (!order) return null;

  await db.prepare(
    `UPDATE orders SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(status, id).run();

  if (status === 'delivered') {
    await db.prepare(
      `UPDATE orders SET deliveredAt = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(id).run();
  }

  if (status === 'cancelled') {
    await db.prepare(
      `UPDATE orders SET cancelledAt = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(id).run();
  }

  return await getOrder(db, id);
};

// 📌 DELETE ORDER
export const deleteOrder = async (db, id, buyerId = null) => {
  let query = `DELETE FROM orders WHERE id = ?`;
  let params = [id];

  if (buyerId) {
    query += ` AND buyerId = ?`;
    params.push(buyerId);
  }

  const result = await db.prepare(query).bind(...params).run();
  return result.meta.changes > 0;
};
