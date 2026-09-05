// src/models/Wallet.js

// 📌 HELPER: Parse JSON safely
const safeParse = (str) => {
  try { return JSON.parse(str); } catch { return []; }
};

// 📌 CREATE WALLET
export const createWallet = async (db, vendorId) => {
  const result = await db.prepare(
    `INSERT INTO wallets (vendorId, balance, totalRecharged, totalSpent, totalEarned, transactions)
     VALUES (?, 0, 0, 0, 0, '[]')`
  ).bind(vendorId).run();

  return result.meta.last_row_id;
};

// 📌 GET WALLET BY VENDOR ID
export const getWallet = async (db, vendorId) => {
  return await db.prepare(
    `SELECT * FROM wallets WHERE vendorId = ?`
  ).bind(vendorId).first();
};

// 📌 GET WALLET BY ID
export const getWalletById = async (db, id) => {
  return await db.prepare(
    `SELECT * FROM wallets WHERE id = ?`
  ).bind(id).first();
};

// 📌 GET ALL WALLETS
export const getAllWallets = async (db, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const { results } = await db.prepare(
    `SELECT * FROM wallets ORDER BY balance DESC LIMIT ? OFFSET ?`
  ).bind(limit, skip).all();

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM wallets`
  ).first();

  return {
    wallets: results,
    total: totalResult.count,
    currentPage: page,
    totalPages: Math.ceil(totalResult.count / limit)
  };
};

// 📌 UPDATE WALLET
export const updateWallet = async (db, vendorId, data) => {
  let query = `UPDATE wallets SET `;
  let params = [];
  let fields = Object.keys(data);

  fields.forEach((field, index) => {
    query += `${field} = ?, `;
    params.push(data[field]);
  });

  query += `lastUpdated = CURRENT_TIMESTAMP WHERE vendorId = ?`;
  params.push(vendorId);

  await db.prepare(query).bind(...params).run();

  return await getWallet(db, vendorId);
};

// 📌 ADD BALANCE
export const addBalance = async (db, vendorId, amount, description, reference = '') => {
  const wallet = await getWallet(db, vendorId);
  if (!wallet) return null;

  const transactions = safeParse(wallet.transactions);
  const newTransaction = {
    type: 'credit',
    amount,
    description,
    reference,
    status: 'completed',
    createdAt: new Date().toISOString()
  };
  transactions.push(newTransaction);

  await db.prepare(
    `UPDATE wallets SET balance = balance + ?, totalRecharged = totalRecharged + ?, transactions = ?, lastUpdated = CURRENT_TIMESTAMP WHERE vendorId = ?`
  ).bind(amount, amount, JSON.stringify(transactions), vendorId).run();

  return await getWallet(db, vendorId);
};

// 📌 DEDUCT BALANCE
export const deductBalance = async (db, vendorId, amount, description, reference = '') => {
  const wallet = await getWallet(db, vendorId);
  if (!wallet) return null;

  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }

  const transactions = safeParse(wallet.transactions);
  const newTransaction = {
    type: 'debit',
    amount,
    description,
    reference,
    status: 'completed',
    createdAt: new Date().toISOString()
  };
  transactions.push(newTransaction);

  await db.prepare(
    `UPDATE wallets SET balance = balance - ?, totalSpent = totalSpent + ?, transactions = ?, lastUpdated = CURRENT_TIMESTAMP WHERE vendorId = ?`
  ).bind(amount, amount, JSON.stringify(transactions), vendorId).run();

  return await getWallet(db, vendorId);
};

// 📌 GET TRANSACTIONS
export const getTransactions = async (db, vendorId, page = 1, limit = 20, type = null, status = null) => {
  const wallet = await getWallet(db, vendorId);
  if (!wallet) return { transactions: [], total: 0, currentPage: page, totalPages: 0 };

  const transactions = safeParse(wallet.transactions);
  const filteredTransactions = transactions.filter(tx => {
    if (type && tx.type !== type) return false;
    if (status && tx.status !== status) return false;
    return true;
  });

  const total = filteredTransactions.length;
  const skip = (page - 1) * limit;
  const paginatedTransactions = filteredTransactions.slice(skip, skip + limit);

  return {
    transactions: paginatedTransactions,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit)
  };
};

// 📌 GET WALLET SUMMARY
export const getWalletSummary = async (db, vendorId) => {
  const wallet = await getWallet(db, vendorId);
  if (!wallet) return null;

  const transactions = safeParse(wallet.transactions);

  return {
    balance: wallet.balance,
    totalRecharged: wallet.totalRecharged,
    totalSpent: wallet.totalSpent,
    totalEarned: wallet.totalEarned,
    transactionCount: transactions.length,
    lastUpdated: wallet.lastUpdated
  };
};

// 📌 GET WALLET STATS (Admin)
export const getWalletStats = async (db) => {
  const { results } = await db.prepare(
    `SELECT 
      COALESCE(SUM(balance), 0) as totalBalance,
      COALESCE(SUM(totalRecharged), 0) as totalRecharged,
      COALESCE(SUM(totalSpent), 0) as totalSpent,
      COALESCE(SUM(totalEarned), 0) as totalEarned,
      COUNT(*) as totalVendors
     FROM wallets`
  ).all();

  return results[0];
};
