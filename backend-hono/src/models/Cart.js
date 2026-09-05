// src/models/Cart.js

// 📌 HELPER: Parse JSON safely
const safeParse = (str) => {
  try { return JSON.parse(str); } catch { return []; }
};

// 📌 CREATE CART
export const createCart = async (db, userId) => {
  const result = await db.prepare(
    `INSERT INTO carts (userId, items) VALUES (?, '[]')`
  ).bind(userId).run();

  return result.meta.last_row_id;
};

// 📌 GET CART BY USER ID
export const getCart = async (db, userId) => {
  return await db.prepare(
    `SELECT * FROM carts WHERE userId = ?`
  ).bind(userId).first();
};

// 📌 GET CART BY ID
export const getCartById = async (db, id) => {
  return await db.prepare(
    `SELECT * FROM carts WHERE id = ?`
  ).bind(id).first();
};

// 📌 UPDATE CART
export const updateCart = async (db, userId, items) => {
  const result = await db.prepare(
    `UPDATE carts SET items = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`
  ).bind(JSON.stringify(items), userId).run();

  return result.meta.changes > 0;
};

// 📌 DELETE CART
export const deleteCart = async (db, userId) => {
  const result = await db.prepare(
    `DELETE FROM carts WHERE userId = ?`
  ).bind(userId).run();

  return result.meta.changes > 0;
};

// 📌 GET ITEMS FROM CART
export const getCartItems = async (db, userId) => {
  const cart = await getCart(db, userId);
  if (!cart) return [];
  return safeParse(cart.items);
};

// 📌 ADD ITEM TO CART
export const addItemToCart = async (db, userId, productId, quantity = 1) => {
  // Step 1: Get cart
  const cart = await getCart(db, userId);
  if (!cart) {
    await createCart(db, userId);
    return await addItemToCart(db, userId, productId, quantity);
  }

  // Step 2: Get current items
  const items = safeParse(cart.items);

  // Step 3: Check if item already exists
  const existingItem = items.find(item => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    items.push({
      productId,
      quantity
    });
  }

  // Step 4: Update cart
  await updateCart(db, userId, items);

  return items;
};

// 📌 REMOVE ITEM FROM CART
export const removeItemFromCart = async (db, userId, productId) => {
  const cart = await getCart(db, userId);
  if (!cart) return [];

  const items = safeParse(cart.items);
  const updatedItems = items.filter(item => item.productId !== productId);

  await updateCart(db, userId, updatedItems);

  return updatedItems;
};

// 📌 UPDATE ITEM QUANTITY
export const updateItemQuantity = async (db, userId, productId, quantity) => {
  const cart = await getCart(db, userId);
  if (!cart) return [];

  const items = safeParse(cart.items);
  const updatedItems = items.map(item => {
    if (item.productId === productId) {
      return { ...item, quantity };
    }
    return item;
  });

  await updateCart(db, userId, updatedItems);

  return updatedItems;
};

// 📌 GET CART TOTAL
export const getCartTotal = async (db, userId) => {
  const items = await getCartItems(db, userId);
  
  // Fetch product prices
  const productIds = items.map(item => item.productId);
  const total = 0;
  
  if (productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',');
    const { results } = await db.prepare(
      `SELECT id, price FROM products WHERE id IN (${placeholders})`
    ).bind(...productIds).all();

    const priceMap = new Map(results.map(p => ({ id: p.id, price: p.price })));
    total = items.reduce((sum, item) => {
      const product = priceMap.get(item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  }

  return total;
};
