import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const VendorWallet = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState({
    balance: 0,
    totalRecharged: 0,
    totalSpent: 0,
    totalEarned: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTransactions: 0
  });
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  // Fetch wallet data
  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, [currentPage, filterType]);

  const fetchWalletData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setWallet(data.wallet);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/wallet/transactions?page=${currentPage}&limit=10`;
      if (filterType !== 'all') {
        url += `&type=${filterType}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    const amount = parseFloat(rechargeAmount);
    if (!amount || amount < 100) {
      toast.error('Minimum recharge amount is ₹100');
      return;
    }

    if (amount > 100000) {
      toast.error('Maximum recharge amount is ₹100,000');
      return;
    }

    setRechargeLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/wallet/recharge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          amount: amount,
          paymentMethod: 'manual'
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setShowRechargeModal(false);
        setRechargeAmount('');
        fetchWalletData();
        fetchTransactions();
      } else {
        toast.error(data.message || 'Recharge failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setRechargeLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 mb-6">
          {/* ✅ BACK BUTTON */}
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 bg-white hover:bg-pink-50 border border-gray-200 hover:border-pink-300 text-gray-700 hover:text-pink-600 px-4 py-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg 
              className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-800">💰 Wallet</h1>
            <p className="text-gray-500 text-sm">Manage your wallet balance and transactions</p>
          </div>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 mb-6 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-pink-100 text-sm">Available Balance</p>
              <p className="text-4xl font-bold mt-1">{formatAmount(wallet.balance)}</p>
              <div className="flex gap-4 mt-2 text-sm text-pink-100">
                <span>Total Recharged: {formatAmount(wallet.totalRecharged)}</span>
                <span>Total Spent: {formatAmount(wallet.totalSpent)}</span>
              </div>
            </div>
            <button
              onClick={() => setShowRechargeModal(true)}
              className="bg-white text-pink-600 px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              + Add Money
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Recharged</p>
            <p className="text-xl font-bold text-green-600">{formatAmount(wallet.totalRecharged)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="text-xl font-bold text-red-600">{formatAmount(wallet.totalSpent)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Earned</p>
            <p className="text-xl font-bold text-blue-600">{formatAmount(wallet.totalEarned)}</p>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="font-semibold text-gray-800">Transaction History</h2>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-500"
              >
                <option value="all">All Transactions</option>
                <option value="credit">Credits</option>
                <option value="debit">Debits</option>
              </select>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-1">Recharge your wallet to get started</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <div key={tx._id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tx.status === 'completed' 
                              ? 'bg-green-100 text-green-600' 
                              : tx.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {tx.status}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(tx.createdAt)}</span>
                          {tx.reference && (
                            <span className="text-xs text-gray-400">• Ref: {tx.reference}</span>
                          )}
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'} {formatAmount(tx.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Add Money to Wallet</h3>
              <button
                onClick={() => setShowRechargeModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Enter amount (₹)</p>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 text-lg"
                min="100"
                max="100000"
              />
              <div className="flex gap-2 mt-2">
                {[100, 500, 1000, 5000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setRechargeAmount(amount.toString())}
                    className="px-3 py-1 border border-gray-200 rounded-lg text-sm hover:border-pink-500 hover:bg-pink-50 transition"
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Min: ₹100 | Max: ₹100,000</p>
            </div>

            <button
              onClick={handleRecharge}
              disabled={rechargeLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {rechargeLoading ? 'Processing...' : 'Add Money'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              * This is a manual recharge. Payment gateway coming soon.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorWallet;
