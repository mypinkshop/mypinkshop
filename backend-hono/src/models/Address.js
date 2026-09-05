// src/models/Address.js

// 📌 CREATE ADDRESS
export const createAddress = async (db, data) => {
  const result = await db.prepare(
    `INSERT INTO addresses (userId, fullName, phone, addressLine1, addressLine2, landmark, city, state, pincode, country, type, isDefault)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.userId,
    data.fullName,
    data.phone,
    data.addressLine1,
    data.addressLine2 || '',
    data.landmark || '',
    data.city,
    data.state,
    data.pincode,
    data.country || 'India',
    data.type || 'Home',
    data.isDefault ? 1 : 0
  ).run();

  return result.meta.last_row_id;
};

// 📌 GET ADDRESS BY ID
export const getAddress = async (db, id, userId = null) => {
  let query = `SELECT * FROM addresses WHERE id = ?`;
  let params = [id];

  if (userId) {
    query += ` AND userId = ?`;
    params.push(userId);
  }

  return await db.prepare(query).bind(...params).first();
};

// 📌 GET ALL ADDRESSES (Vendor/User)
export const getUserAddresses = async (db, userId) => {
  const { results } = await db.prepare(
    `SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC, createdAt DESC`
  ).bind(userId).all();

  return results;
};

// 📌 UPDATE ADDRESS
export const updateAddress = async (db, id, data, userId = null) => {
  let query = `UPDATE addresses SET `;
  let params = [];
  let fields = Object.keys(data);

  fields.forEach((field, index) => {
    query += `${field} = ?, `;
    params.push(data[field]);
  });

  query += `WHERE id = ?`;
  params.push(id);

  if (userId) {
    query += ` AND userId = ?`;
    params.push(userId);
  }

  await db.prepare(query).bind(...params).run();

  return await getAddress(db, id, userId);
};

// 📌 DELETE ADDRESS
export const deleteAddress = async (db, id, userId = null) => {
  let query = `DELETE FROM addresses WHERE id = ?`;
  let params = [id];

  if (userId) {
    query += ` AND userId = ?`;
    params.push(userId);
  }

  const result = await db.prepare(query).bind(...params).run();
  return result.meta.changes > 0;
};

// 📌 SET DEFAULT ADDRESS
export const setDefaultAddress = async (db, id, userId) => {
  // Step 1: Unset all other default addresses for this user
  await db.prepare(
    `UPDATE addresses SET isDefault = 0 WHERE userId = ?`
  ).bind(userId).run();

  // Step 2: Set this address as default
  await db.prepare(
    `UPDATE addresses SET isDefault = 1 WHERE id = ? AND userId = ?`
  ).bind(id, userId).run();

  return await getAddress(db, id, userId);
};
