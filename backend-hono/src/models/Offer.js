// src/models/Offer.js

// 📌 CREATE OFFER
export const createOffer = async (db, data) => {
  const result = await db.prepare(
    `INSERT INTO offers (title, description, isActive, type, discountType, discountValue, minOrderValue, startDate, endDate)
     VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.title,
    data.description,
    data.type || 'top_banner',
    data.discountType || 'percentage',
    data.discountValue || 10,
    data.minOrderValue || 999,
    data.startDate || new Date().toISOString(),
    data.endDate || null
  ).run();

  return result.meta.last_row_id;
};

// 📌 GET OFFER BY ID
export const getOffer = async (db, id) => {
  return await db.prepare(
    `SELECT * FROM offers WHERE id = ?`
  ).bind(id).first();
};

// 📌 GET ALL OFFERS (Admin)
export const getAllOffers = async (db, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM offers ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(limit, skip).all();

  const totalResult = await db.prepare(`SELECT COUNT(*) as count FROM offers`).first();

  return {
    offers: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 GET ACTIVE OFFERS (Public)
export const getActiveOffers = async (db, limit = 10) => {
  const now = new Date().toISOString();
  const { results } = await db.prepare(
    `SELECT * FROM offers 
     WHERE isActive = 1 AND startDate <= ? AND (endDate IS NULL OR endDate >= ?) 
     ORDER BY createdAt DESC LIMIT ?`
  ).bind(now, now, limit).all();

  return results;
};

// 📌 GET ACTIVE OFFER FOR TOP BANNER (Public)
export const getActiveOfferForTopBanner = async (db, limit = 1) => {
  const now = new Date().toISOString();
  const { results } = await db.prepare(
    `SELECT * FROM offers 
     WHERE isActive = 1 AND type = 'top_banner' AND startDate <= ? AND (endDate IS NULL OR endDate >= ?) 
     ORDER BY createdAt DESC LIMIT ?`
  ).bind(now, now, limit).all();

  return results;
};

// 📌 UPDATE OFFER
export const updateOffer = async (db, id, data) => {
  let query = `UPDATE offers SET `;
  let params = [];
  let fields = Object.keys(data);

  fields.forEach((field, index) => {
    query += `${field} = ?, `;
    params.push(data[field]);
  });

  query += `updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  params.push(id);

  await db.prepare(query).bind(...params).run();

  return await getOffer(db, id);
};

// 📌 TOGGLE OFFER ACTIVE
export const toggleOfferActive = async (db, id) => {
  const offer = await getOffer(db, id);
  if (!offer) return null;

  const newActive = offer.isActive ? 0 : 1;
  await db.prepare(
    `UPDATE offers SET isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(newActive, id).run();

  return await getOffer(db, id);
};

// 📌 DELETE OFFER
export const deleteOffer = async (db, id) => {
  const result = await db.prepare(`DELETE FROM offers WHERE id = ?`).bind(id).run();
  return result.meta.changes > 0;
};
