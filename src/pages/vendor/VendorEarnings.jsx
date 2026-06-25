import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorEarnings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [earnings, setEarnings] = useState({
    total: 0,
    available: 0,
    pending: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingClearance: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [vendorInfo, setVendorInfo] = useState(null);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      navigate('/vendor/login');
      return;
    }
    fetchVendorProfile(token);
    fetchEarnings(token);
  }, [navigate]);

  // ✅ Fetch vendor profile
  const fetchVendorProfile = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/vendor/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVendorInfo(data.vendor);
      }
    } catch (err) {
      console.error('Error fetching vendor:', err);
    }
  };

  // ✅ Fetch earnings from backend
  const fetchEarnings = async (token) => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`${API_URL}/api/vendor/earnings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (data.success) {
        const e = data.earnings;
        setEarnings({
          total: e.total || 0,
          available: e.total * 0.7 || 0,
          pending: e.total * 0.3 || 0,
          thisMonth: e.thisMonth || 0,
          lastMonth: e.lastMonth || 0,
          pendingClearance: e.pending || 0,
        });
        setTransactions(e.history || []);
      } else {
        setError(data.message || 'Failed to load earnings');
      }
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestWithdrawal = () => {
    if (earnings.available < 1000) {
      alert('⚠️ Minimum withdrawal amount is ₹1000');
      return;
    }
    alert(`✅ Withdrawal request for ₹${earnings.available.toLocaleString()} submitted successfully!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading earnings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      <VendorSidebar activeTab="payments" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">💰 Earnings</h1>
            <p className="text-gray-500 text-sm">Track your sales earnings and withdrawals</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
              <p className="text-sm opacity-90">Total Earnings</p>
              <p className="text-3xl font-bold mt-1">₹{earnings.total.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Available for Withdrawal</p>
              <p className="text-2xl font-bold text-green-600 mt-1">₹{earnings.available.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Pending Clearance</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">₹{earnings.pendingClearance.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition">
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">₹{earnings.thisMonth.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Last Month</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">₹{earnings.lastMonth.toLocaleString()}</p>
            </div>
          </div>

          {/* Withdraw Button */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="font-semibold text-gray-800">💳 Request Withdrawal</h3>
                <p className="text-sm text-gray-500 mt-1">Minimum withdrawal amount: ₹1000</p>
              </div>
              <button 
                onClick={requestWithdrawal} 
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transition transform hover:-translate-y-0.5"
              >
                Withdraw ₹{earnings.available.toLocaleString()}
              </button>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">📋 Transaction History</h2>
              <span className="text-xs text-gray-400">Last 10 transactions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Order ID</th>
                    <th className="px-5 py-3 text-right font-semibold text-gray-600">Amount</th>
                    <th className="px-5 py-3 text-right font-semibold text-gray-600">Commission (15%)</th>
                    <th className="px-5 py-3 text-right font-semibold text-gray-600">Net Earnings</th>
                    <th className="px-5 py-3 text-center font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-8 text-center text-gray-400">
                        💰 No transactions yet
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3 text-gray-500">
                          {tx.date ? new Date(tx.date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-5 py-3 font-medium text-pink-600">#{tx.orderId?.slice(-8) || 'N/A'}</td>
                        <td className="px-5 py-3 text-right">₹{Math.round(tx.amount / 0.85 || 0).toLocaleString()}</td>
                        <td className="px-5 py-3 text-right text-red-500">-₹{Math.round(tx.commission || tx.amount * 0.15 || 0).toLocaleString()}</td>
                        <td className="px-5 py-3 text-right font-semibold text-green-600">₹{Math.round(tx.amount || 0).toLocaleString()}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tx.status === 'settled' || tx.status === 'paid' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {tx.status === 'settled' || tx.status === 'paid' ? '✅ Settled' : '⏳ Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {transactions.length > 0 && (
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan="4" className="px-5 py-3 font-semibold text-gray-800">Total</td>
                      <td className="px-5 py-3 text-right font-bold text-green-600">
                        ₹{transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0).toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorEarnings;
