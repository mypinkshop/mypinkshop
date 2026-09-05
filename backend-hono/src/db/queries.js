import { v4 as uuidv4 } from 'uuid';

// ============ USERS ============
export const createUser = async (env, userData) => {
  const id = uuidv4();
  await env.DB.prepare(
    `INSERT INTO users (id, name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, userData.name, userData.email, userData.password, userData.phone || null, userData.role || 'user').run();
  return id;
};

export const getUserByEmail = async (env, email) => {
  return await env.DB.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first();
};

export const getUserById = async (env, id) => {
  return await env.DB.prepare(`SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?`).bind(id).first();
};

export const updateUser = async (env, id, data) => {
  const updates = [];
  const values = [];
  if (data.name) { updates.push('name = ?'); values.push(data.name); }
  if (data.phone) { updates.push('phone = ?'); values.push(data.phone); }
  if (data.password) { updates.push('password = ?'); values.push(data.password); }
  if (data.refresh_token !== undefined) { updates.push('refresh_token = ?'); values.push(data.refresh_token); }
  values.push(id);
  await env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
};

export const getAllUsers = async (env, limit = 20, offset = 0) => {
  const result = await env.DB.prepare(
    `SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(limit, offset).all();
  return result.results;
};

export const updateUserRole = async (env, id, role) => {
  await env.DB.prepare(`UPDATE users SET role = ? WHERE id = ?`).bind(role, id).run();
};

export const deleteUser = async (env, id) => {
  await env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(id).run();
};

// ============ PRODUCTS ============
export const getAllProducts = async (env, limit = 20, offset = 0, filters = {}) => {
  let query = `SELECT * FROM products WHERE is_active = 1`;
  const params = [];
  
  if (filters.category) {
    query += ` AND category = ?`;
    params.push(filters.category);
  }
  if (filters.minPrice) {
    query += ` AND price >= ?`;
    params.push(filters.minPrice);
  }
  if (filters.maxPrice) {
    query += ` AND price <= ?`;
    params.push(filters.maxPrice);
  }
  if (filters.search) {
    query += ` AND (name LIKE ? OR description LIKE ?)`;
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const result = await env.DB.prepare(query).bind(...params).all();
  return result.results;
};

export const getProductById = async (env, id) => {
  return await env.DB.prepare(`SELECT * FROM products WHERE id = ? AND is_active = 1`).bind(id).first();
};

export const createProduct = async (env, productData) => {
  const id = uuidv4();
  const images = JSON.stringify(productData.images || []);
  await env.DB.prepare(
    `INSERT INTO products (id, name, description, price, discounted_price, category, brand, stock, images, vendor_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, productData.name, productData.description, productData.price, 
    productData.discounted_price || null, productData.category, productData.brand || null,
    productData.stock || 0, images, productData.vendor_id || null
  ).run();
  return id;
};

export const updateProduct = async (env, id, data) => {
  const updates = [];
  const values = [];
  if (data.name) { updates.push('name = ?'); values.push(data.name); }
  if (data.description) { updates.push('description = ?'); values.push(data.description); }
  if (data.price) { updates.push('price = ?'); values.push(data.price); }
  if (data.discounted_price !== undefined) { updates.push('discounted_price = ?'); values.push(data.discounted_price); }
  if (data.category) { updates.push('category = ?'); values.push(data.category); }
  if (data.brand) { updates.push('brand = ?'); values.push(data.brand); }
  if (data.stock !== undefined) { updates.push('stock = ?'); values.push(data.stock); }
  if (data.images) { updates.push('images = ?'); values.push(JSON.stringify(data.images)); }
  if (data.is_active !== undefined) { updates.push('is_active = ?'); values.push(data.is_active); }
  values.push(id);
  await env.DB.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
};

export const deleteProduct = async (env, id) => {
  await env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(id).run();
};

export const getProductsByVendor = async (env, vendorId, limit = 20, offset = 0) => {
  const result = await env.DB.prepare(
    `SELECT * FROM products WHERE vendor_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(vendorId, limit, offset).all();
  return result.results;
};

// ============ ORDERS ============
export const createOrder = async (env, orderData) => {
  const id = uuidv4();
  const orderNumber = `MP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  await env.DB.prepare(
    `INSERT INTO orders (id, user_id, order_number, total_amount, payment_method, payment_status, order_status, shipping_address_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, orderData.user_id, orderNumber, orderData.total_amount, 
    orderData.payment_method, orderData.payment_status || 'pending', 
    orderData.order_status || 'pending', orderData.shipping_address_id
  ).run();
  
  for (const item of orderData.items) {
    await env.DB.prepare(
      `INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)`
    ).bind(uuidv4(), id, item.product_id, item.quantity, item.price).run();
  }
  return { id, orderNumber };
};

export const getOrdersByUser = async (env, userId) => {
  const result = await env.DB.prepare(
    `SELECT o.*, 
            json_group_array(json_object('product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price)) as items
     FROM orders o 
     LEFT JOIN order_items oi ON o.id = oi.order_id 
     WHERE o.user_id = ? 
     GROUP BY o.id 
     ORDER BY o.created_at DESC`
  ).bind(userId).all();
  return result.results;
};

export const getOrderById = async (env, id) => {
  const order = await env.DB.prepare(`SELECT * FROM orders WHERE id = ?`).bind(id).first();
  if (order) {
    const items = await env.DB.prepare(`SELECT * FROM order_items WHERE order_id = ?`).bind(id).all();
    order.items = items.results;
  }
  return order;
};

export const updateOrderStatus = async (env, id, status) => {
  await env.DB.prepare(`UPDATE orders SET order_status = ? WHERE id = ?`).bind(status, id).run();
};

export const updateOrderPaymentStatus = async (env, id, status) => {
  await env.DB.prepare(`UPDATE orders SET payment_status = ? WHERE id = ?`).bind(status, id).run();
};

export const getAllOrders = async (env, limit = 20, offset = 0) => {
  const result = await env.DB.prepare(
    `SELECT o.*, u.name as user_name, u.email as user_email 
     FROM orders o 
     JOIN users u ON o.user_id = u.id 
     ORDER BY o.created_at DESC 
     LIMIT ? OFFSET ?`
  ).bind(limit, offset).all();
  return result.results;
};

export const getOrderStats = async (env) => {
  const total = await env.DB.prepare(`SELECT COUNT(*) as count FROM orders`).first();
  const revenue = await env.DB.prepare(`SELECT SUM(total_amount) as total FROM orders WHERE payment_status = 'paid'`).first();
  const pending = await env.DB.prepare(`SELECT COUNT(*) as count FROM orders WHERE order_status = 'pending'`).first();
  return {
    totalOrders: total?.count || 0,
    totalRevenue: revenue?.total || 0,
    pendingOrders: pending?.count || 0
  };
};

// ============ ADDRESSES ============
export const createAddress = async (env, addressData) => {
  const id = uuidv4();
  await env.DB.prepare(
    `INSERT INTO addresses (id, user_id, full_name, phone, address_line1, address_line2, city, state, pincode, is_default) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, addressData.user_id, addressData.full_name, addressData.phone, 
    addressData.address_line1, addressData.address_line2 || null, 
    addressData.city, addressData.state, addressData.pincode, addressData.is_default || 0
  ).run();
  return id;
};

export const getAddressesByUser = async (env, userId) => {
  const result = await env.DB.prepare(`SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC`).bind(userId).all();
  return result.results;
};

export const updateAddress = async (env, id, data) => {
  const updates = [];
  const values = [];
  if (data.full_name) { updates.push('full_name = ?'); values.push(data.full_name); }
  if (data.phone) { updates.push('phone = ?'); values.push(data.phone); }
  if (data.address_line1) { updates.push('address_line1 = ?'); values.push(data.address_line1); }
  if (data.address_line2 !== undefined) { updates.push('address_line2 = ?'); values.push(data.address_line2); }
  if (data.city) { updates.push('city = ?'); values.push(data.city); }
  if (data.state) { updates.push('state = ?'); values.push(data.state); }
  if (data.pincode) { updates.push('pincode = ?'); values.push(data.pincode); }
  if (data.is_default !== undefined) { updates.push('is_default = ?'); values.push(data.is_default); }
  values.push(id);
  await env.DB.prepare(`UPDATE addresses SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
};

export const deleteAddress = async (env, id) => {
  await env.DB.prepare(`DELETE FROM addresses WHERE id = ?`).bind(id).run();
};

// ============ REVIEWS ============
export const createReview = async (env, reviewData) => {
  const id = uuidv4();
  await env.DB.prepare(
    `INSERT INTO reviews (id, product_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)`
  ).bind(id, reviewData.product_id, reviewData.user_id, reviewData.rating, reviewData.comment || null).run();
  return id;
};

export const getReviewsByProduct = async (env, productId) => {
  const result = await env.DB.prepare(
    `SELECT r.*, u.name as user_name FROM reviews r 
     JOIN users u ON r.user_id = u.id 
     WHERE r.product_id = ? 
     ORDER BY r.created_at DESC`
  ).bind(productId).all();
  return result.results;
};

export const deleteReview = async (env, id) => {
  await env.DB.prepare(`DELETE FROM reviews WHERE id = ?`).bind(id).run();
};

// ============ WISHLIST ============
export const addToWishlist = async (env, wishlistData) => {
  const id = uuidv4();
  await env.DB.prepare(
    `INSERT INTO wishlist (id, user_id, product_id) VALUES (?, ?, ?)`
  ).bind(id, wishlistData.user_id, wishlistData.product_id).run();
  return id;
};

export const getWishlistByUser = async (env, userId) => {
  const result = await env.DB.prepare(
    `SELECT p.* FROM wishlist w JOIN products p ON w.product_id = p.id WHERE w.user_id = ?`
  ).bind(userId).all();
  return result.results;
};

export const removeFromWishlist = async (env, userId, productId) => {
  await env.DB.prepare(`DELETE FROM wishlist WHERE user_id = ? AND product_id = ?`).bind(userId, productId).run();
};

// ============ CART ============
export const getCartByUser = async (env, userId) => {
  const result = await env.DB.prepare(
    `SELECT c.*, p.name, p.price, p.discounted_price, p.images 
     FROM cart c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.user_id = ?`
  ).bind(userId).all();
  return result.results;
};

export const addToCart = async (env, cartData) => {
  const existing = await env.DB.prepare(
    `SELECT * FROM cart WHERE user_id = ? AND product_id = ?`
  ).bind(cartData.user_id, cartData.product_id).first();
  
  if (existing) {
    await env.DB.prepare(
      `UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?`
    ).bind(cartData.quantity || 1, cartData.user_id, cartData.product_id).run();
    return existing.id;
  } else {
    const id = uuidv4();
    await env.DB.prepare(
      `INSERT INTO cart (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)`
    ).bind(id, cartData.user_id, cartData.product_id, cartData.quantity || 1).run();
    return id;
  }
};

export const updateCartQuantity = async (env, userId, productId, quantity) => {
  await env.DB.prepare(
    `UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?`
  ).bind(quantity, userId, productId).run();
};

export const removeFromCart = async (env, userId, productId) => {
  await env.DB.prepare(`DELETE FROM cart WHERE user_id = ? AND product_id = ?`).bind(userId, productId).run();
};

export const clearCart = async (env, userId) => {
  await env.DB.prepare(`DELETE FROM cart WHERE user_id = ?`).bind(userId).run();
};

// ============ PAYMENTS ============
export const createPayment = async (env, paymentData) => {
  const id = uuidv4();
  await env.DB.prepare(
    `INSERT INTO payments (id, order_id, payment_id, status, amount) VALUES (?, ?, ?, ?, ?)`
  ).bind(id, paymentData.order_id, paymentData.payment_id, paymentData.status, paymentData.amount).run();
  return id;
};

export const getPaymentByOrderId = async (env, orderId) => {
  return await env.DB.prepare(`SELECT * FROM payments WHERE order_id = ?`).bind(orderId).first();
};

export const updatePaymentStatus = async (env, paymentId, status) => {
  await env.DB.prepare(`UPDATE payments SET status = ? WHERE payment_id = ?`).bind(status, paymentId).run();
};
