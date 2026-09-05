// src/models/BrandApplication.js

// 📌 HELPER: Parse JSON safely
const safeParse = (str) => {
  try { return JSON.parse(str); } catch { return []; }
};

// 📌 CREATE APPLICATION
export const createBrandApplication = async (db, data) => {
  const result = await db.prepare(
    `INSERT INTO brand_applications (vendorId, brandName, trademarkNumber, trademarkOffice, brandWebsite, productCategories, manufacturingCountries, brandCertificate, brandLogo, status, adminRemarks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '')`
  ).bind(
    data.vendorId,
    data.brandName,
    data.trademarkNumber,
    data.trademarkOffice || 'india',
    data.brandWebsite || '',
    JSON.stringify(data.productCategories || []),
    JSON.stringify(data.manufacturingCountries || []),
    data.brandCertificate || '',
    data.brandLogo || ''
  ).run();

  return result.meta.last_row_id;
};

// 📌 GET APPLICATION BY ID
export const getBrandApplication = async (db, id, vendorId = null) => {
  let query = `SELECT * FROM brand_applications WHERE id = ?`;
  let params = [id];

  if (vendorId) {
    query += ` AND vendorId = ?`;
    params.push(vendorId);
  }

  return await db.prepare(query).bind(...params).first();
};

// 📌 GET ALL APPLICATIONS (Admin)
export const getAllBrandApplications = async (db, page = 1, limit = 20, status = null) => {
  let query = `SELECT * FROM brand_applications`;
  let params = [];

  if (status) {
    query += ` WHERE status = ?`;
    params.push(status);
  }

  query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
  params.push(limit, (page - 1) * limit);

  const { results } = await db.prepare(query).bind(...params).all();
  const totalResult = await db.prepare(`SELECT COUNT(*) as count FROM brand_applications`).first();

  return {
    applications: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 GET ALL APPLICATIONS BY VENDOR
export const getVendorBrandApplications = async (db, vendorId, page = 1, limit = 20) => {
  let query = `SELECT * FROM brand_applications WHERE vendorId = ?`;
  let params = [vendorId];

  query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
  params.push(limit, (page - 1) * limit);

  const { results } = await db.prepare(query).bind(...params).all();
  const totalResult = await db.prepare(`SELECT COUNT(*) as count FROM brand_applications WHERE vendorId = ?`).bind(vendorId).first();

  return {
    applications: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 UPDATE APPLICATION
export const updateBrandApplication = async (db, id, data, vendorId = null) => {
  let query = `UPDATE brand_applications SET `;
  let params = [];
  let fields = Object.keys(data);

  fields.forEach((field, index) => {
    query += `${field} = ?, `;
    params.push(data[field]);
  });

  query += `updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  params.push(id);

  if (vendorId) {
    query += ` AND vendorId = ?`;
    params.push(vendorId);
  }

  await db.prepare(query).bind(...params).run();

  return await getBrandApplication(db, id, vendorId);
};

// 📌 APPROVE OR REJECT (Admin)
export const adminActionOnBrandApplication = async (db, id, status, remarks) => {
  const result = await db.prepare(
    `UPDATE brand_applications SET status = ?, adminRemarks = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(status, remarks || '', id).run();

  return result.meta.changes > 0;
};

// 📌 DELETE APPLICATION
export const deleteBrandApplication = async (db, id, vendorId = null) => {
  let query = `DELETE FROM brand_applications WHERE id = ?`;
  let params = [id];

  if (vendorId) {
    query += ` AND vendorId = ?`;
    params.push(vendorId);
  }

  const result = await db.prepare(query).bind(...params).run();
  return result.meta.changes > 0;
};
