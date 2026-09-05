// src/models/Wishlist.js

// 📌 HELPER: Parse JSON safely
const safeParse = (str) => {
  try { return JSON.parse(str); } catch { return []; }
};

// 📌 CREATE WISHLIST
export const createWishlist = async (db, userId) => {
  const result = await db.prepare(
    `INSERT INTO wishlists (userId, items) VALUES (?, '[]')`
  ).bind(userId).run();

  return result.meta.last_row_id;
};

// 📌 GET WISHLIST BY USER ID
export const getWishlist = async (db, userId) => {
  return await db.prepare(
    `SELECT * FROM wishlists WHERE userId = ?`
  ).bind(userId).first();
};

// 📌 GET WISHLIST BY ID
export const getWishlistById = async (db, id) => {
  return await db.prepare(
    `SELECT * FROM wishlists WHERE id = ?`
  ).bind(id).first();
};

// 📌 UPDATE WISHLIST
export const updateWishlist = async (db, userId, items) => {
  const result = await db.prepare(
    `UPDATE wishlists SET items = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`
  ).bind(JSON.stringify(items), userId).run();

  return result.meta.changes > 0;
};

// 📌 DELETE WISHLIST
export const deleteWishlist = async (db, userId) => {
  const result = await db.prepare(
    `DELETE FROM wishlists WHERE userId = ?`
  ).bind(userId).run();

  return result.meta.changes > 0;
};

// 📌 GET WISHLIST ITEMS
export const getWishlistItems = async (db, userId) => {
  const wishlist = await getWishlist(db, userId);
  if (!wishlist) return [];
  return safeParse(wishlist.items);
};

// 📌 ADD ITEM TO WISHLIST
export const addItemToWishlist = async (db, userId, productId) => {
  // Step 1: Get wishlist
  const wishlist = await getWishlist(db, userId);
  if (!wishlist) {
    await createWishlist(db, userId);
    return await addItemToWishlist(db, userId, productId);
  }

  // Step 2: Get current items
  const items = safeParse(wishlist.items);

  // Step 3: Check if item already exists
  const existingItem = items.find(item => item.productId === productId);
  if (existingItem) {
    return items;
  }

  // Step 4: Add new item
  items.push({
    productId,
    addedAt: new Date().toISOString()
  });

  // Step 5: Update wishlist
  await updateWishlist(db, userId, items);

  return items;
};

// 📌 REMOVE ITEM FROM WISHLIST
export const removeItemFromWishlist = async (db, userId, productId) => {
  const wishlist = await getWishlist(db, userId);
  if (!wishlist) return [];

  const items = safeParse(wishlist.items);
  const updatedItems = items.filter(item => item.productId !== productId);

  await updateWishlist(db, userId, updatedItems);

  return updatedItems;
};

// 📌 GET WISHLIST TOTAL ITEMS
export const getWishlistTotalItems = async (db, userId) => {
  const items = await getWishlistItems(db, userId);
  return items.length;
};
