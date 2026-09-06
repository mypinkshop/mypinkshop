// src/models/Banner.js

// 📌 CREATE BANNER
export const createBanner = async (db, data) => {
  const result = await db.prepare(
    `INSERT INTO banners (title, subtitle, buttonText, link, image, imageKey, displayOrder, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.title,
    data.subtitle || '',
    data.buttonText || 'Shop Now',
    data.link || '/shop',
    data.image || '',
    data.imageKey || '',
    data.displayOrder || data.order || 0,  // 👈 'order' bhi support karein
    data.active ? 1 : 0
  ).run();

  return result.meta.last_row_id;
};

// 📌 GET BANNER BY ID
export const getBanner = async (db, id) => {
  return await db.prepare(`SELECT * FROM banners WHERE id = ?`).bind(id).first();
};

// 📌 GET ALL BANNERS (Admin)
export const getAllBanners = async (db, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM banners ORDER BY displayOrder ASC, createdAt DESC LIMIT ? OFFSET ?`
  ).bind(limit, skip).all();

  const totalResult = await db.prepare(`SELECT COUNT(*) as count FROM banners`).first();

  return {
    banners: results,
    total: totalResult?.count || 0,
    currentPage: page,
    totalPages: Math.ceil((totalResult?.count || 0) / limit)
  };
};

// 📌 GET ACTIVE BANNERS (Public)
export const getActiveBanners = async (db, limit = 5) => {
  const now = new Date().toISOString();
  
  const { results } = await db.prepare(
    `SELECT * FROM banners 
     WHERE active = 1 
     AND (startDate IS NULL OR startDate <= ?)
     AND (endDate IS NULL OR endDate >= ?)
     ORDER BY displayOrder ASC, createdAt DESC 
     LIMIT ?`
  ).bind(now, now, limit).all();

  return results || [];
};

// 📌 UPDATE BANNER
export const updateBanner = async (db, id, data) => {
  // Check if banner exists
  const existing = await getBanner(db, id);
  if (!existing) return null;

  // Handle 'order' field -> 'displayOrder'
  if (data.order !== undefined && data.displayOrder === undefined) {
    data.displayOrder = data.order;
    delete data.order;
  }

  let query = `UPDATE banners SET `;
  let params = [];
  let fields = Object.keys(data);

  fields.forEach((field, index) => {
    if (field === 'id' || field === 'createdAt') return; // Skip these fields
    query += `${field} = ?, `;
    params.push(data[field]);
  });

  query = query.slice(0, -2); // Remove last comma and space
  query += `, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  params.push(id);

  await db.prepare(query).bind(...params).run();

  return await getBanner(db, id);
};

// 📌 DELETE BANNER
export const deleteBanner = async (db, id) => {
  const result = await db.prepare(`DELETE FROM banners WHERE id = ?`).bind(id).run();
  return result.meta.changes > 0;
};

// 📌 Toggle active state
export const toggleBannerActive = async (db, id) => {
  const banner = await getBanner(db, id);
  if (!banner) return null;

  const newActive = banner.active ? 0 : 1;
  await db.prepare(
    `UPDATE banners SET active = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(newActive, id).run();

  return await getBanner(db, id);
};
