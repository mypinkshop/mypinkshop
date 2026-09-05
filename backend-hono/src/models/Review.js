// src/models/Review.js

// 📌 HELPER: Parse JSON safely
const safeParse = (str) => {
  try { return JSON.parse(str); } catch { return []; }
};

// 📌 CREATE REVIEW
export const createReview = async (db, data) => {
  const result = await db.prepare(
    `INSERT INTO reviews (productId, userId, orderId, rating, title, comment, images, videos, status, isVerifiedPurchase, isRatingOnly, helpful, helpfulUsers, adminNote, isRecommended, reviewSummary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, 0, '[]', '', ?, ?)`
  ).bind(
    data.productId,
    data.userId,
    data.orderId,
    data.rating,
    data.title || '',
    data.comment || '',
    JSON.stringify(data.images || []),
    JSON.stringify(data.videos || []),
    data.isVerifiedPurchase ? 1 : 0,
    data.isRatingOnly ? 1 : 0,
    data.isRecommended ? 1 : 0,
    data.reviewSummary || ''
  ).run();

  return result.meta.last_row_id;
};

// 📌 GET REVIEW BY ID
export const getReview = async (db, id) => {
  return await db.prepare(
    `SELECT * FROM reviews WHERE id = ?`
  ).bind(id).first();
};

// 📌 GET ALL REVIEWS
export const getAllReviews = async (db, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM reviews ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM reviews`
  ).first();

  return {
    reviews: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 GET REVIEWS BY PRODUCT
export const getReviewsByProduct = async (db, productId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM reviews WHERE productId = ? AND status = 'approved' ORDER BY helpful DESC, createdAt DESC LIMIT ? OFFSET ?`
  ).bind(productId, limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM reviews WHERE productId = ? AND status = 'approved'`
  ).bind(productId).first();

  return {
    reviews: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 GET REVIEWS BY USER
export const getReviewsByUser = async (db, userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM reviews WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(userId, limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM reviews WHERE userId = ?`
  ).bind(userId).first();

  return {
    reviews: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 GET REVIEW STATS FOR PRODUCT
export const getReviewStats = async (db, productId) => {
  const { results } = await db.prepare(
    `SELECT rating, COUNT(*) as count FROM reviews WHERE productId = ? AND status = 'approved' GROUP BY rating`
  ).bind(productId).all();

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalReviews = 0;
  let totalRating = 0;
  let ratingOnlyCount = 0;
  let reviewWithCommentCount = 0;

  results.forEach(item => {
    distribution[item.rating] = item.count;
    totalReviews += item.count;
    totalRating += item.rating * item.count;
  });

  const ratingOnlyResult = await db.prepare(
    `SELECT COUNT(*) as count FROM reviews WHERE productId = ? AND status = 'approved' AND isRatingOnly = 1`
  ).bind(productId).first();

  const commentResult = await db.prepare(
    `SELECT COUNT(*) as count FROM reviews WHERE productId = ? AND status = 'approved' AND isRatingOnly = 0 AND comment != ''`
  ).bind(productId).first();

  ratingOnlyCount = ratingOnlyResult.count;
  reviewWithCommentCount = commentResult.count;

  return {
    averageRating: totalReviews > 0 ? (totalRating / totalReviews).toFixed(2) : 0,
    totalReviews,
    ratingDistribution: distribution,
    ratingOnlyCount,
    reviewWithCommentCount
  };
};

// 📌 UPDATE REVIEW
export const updateReview = async (db, id, data) => {
  let query = `UPDATE reviews SET `;
  let params = [];
  let fields = Object.keys(data);

  fields.forEach((field, index) => {
    query += `${field} = ?, `;
    params.push(data[field]);
  });

  query += `updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  params.push(id);

  await db.prepare(query).bind(...params).run();

  return await getReview(db, id);
};

// 📌 APPROVE OR REJECT (Admin)
export const adminActionOnReview = async (db, id, status, adminNote) => {
  const review = await getReview(db, id);
  if (!review) return null;

  await db.prepare(
    `UPDATE reviews SET status = ?, adminNote = ?, approvedAt = CASE WHEN ? = 'approved' THEN CURRENT_TIMESTAMP ELSE approvedAt END, rejectedAt = CASE WHEN ? = 'rejected' THEN CURRENT_TIMESTAMP ELSE rejectedAt END, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(status, adminNote || '', status, status, id).run();

  return await getReview(db, id);
};

// 📌 DELETE REVIEW
export const deleteReview = async (db, id) => {
  const result = await db.prepare(`DELETE FROM reviews WHERE id = ?`).bind(id).run();
  return result.meta.changes > 0;
};

// 📌 MARK AS HELPFUL
export const markReviewHelpful = async (db, id, userId) => {
  const review = await getReview(db, id);
  if (!review) return null;

  const helpfulUsers = safeParse(review.helpfulUsers);
  if (!helpfulUsers.includes(userId)) {
    helpfulUsers.push(userId);
    await db.prepare(
      `UPDATE reviews SET helpful = helpful + 1, helpfulUsers = ? WHERE id = ?`
    ).bind(JSON.stringify(helpfulUsers), id).run();
  }

  return await getReview(db, id);
};

// 📌 GET UNIQUE REVIEW COUNT (User can review once per product)
export const hasUserReviewedProduct = async (db, userId, productId) => {
  const result = await db.prepare(
    `SELECT COUNT(*) as count FROM reviews WHERE userId = ? AND productId = ?`
  ).bind(userId, productId).first();

  return result.count > 0;
};
