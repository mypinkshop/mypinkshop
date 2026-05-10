import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorEarnings() {
  const [earnings, setEarnings] = useState({
    total: 106250,
    available: 85000,
    pending: 21250,
    thisMonth: 45000,
    lastMonth: 38000,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('vendorToken');

  useEffect(() => {
    if (!token) {
      navigate('/vendor/login');
      return;
    }

    setTransactions([
      { id: 1, date: '2024-05-10', orderId: '#MPS-1001', amount: 2208, status: 'settled' },
      { id: 2, date: '2024-05-09', orderId: '#MPS-1002', amount: 1528, status: 'settled' },
      { id: 3, date: '2024-05-08', orderId: '#MPS-1003', amount: 764, status: 'pending' },
      { id: 4, date: '2024-05-07', orderId: '#MPS-0999', amount: 2975, status: 'settled' },
    ]);
    setLoading(false);
  }, [token, navigate]);

  const requestWithdrawal = () => {
    alert(`Withdrawal request for ₹${earnings.available} submitted successfully!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">
      <VendorHeader />
      <VendorSidebar activeTab="earnings" />

      <main className="ml-64 pt-16 p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Earnings</h1>
            <p className="text-gray-500 mt-1">Track your sales earnings and withdrawals</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-5 text-white">
              <p className="text-sm opacity-90">Total Earnings</p>
              <p className="text-3xl font-bold mt-1">₹{earnings.total.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-pink-100">
              <p className="text-gray-500 text-sm">Available for Withdrawal</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">₹{earnings.available.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-pink-100">
              <p className="text-gray-500 text-sm">Pending Clearance</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">₹{earnings.pending.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-pink-100">
              <p className="text-gray-500 text-sm">This Month's Earnings</p>
              <p className="text-2xl font-bold text-green-600 mt-1">₹{earnings.thisMonth.toLocaleString()}</p>
            </div>
          </div>

          {/* Withdrawal Button */}
          <div className="bg-white rounded-2xl p-6 border border-pink-100 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-800">Request Withdrawal</h3>
              <p className="text-sm text-gray-500 mt-1">Minimum withdrawal amount: ₹1000</p>
            </div>
            <button
              onClick={requestWithdrawal}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition"
            >
              Withdraw ₹{earnings.available.toLocaleString()} →
            </button>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-pink-100">
            <div className="px-6 py-4 border-b border-pink-100">
              <h3 className="font-semibold text-gray-800">Transaction History</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-pink-50">
                <tr className="border-b border-pink-100">
                  <th className="px-6 py-3 text-left text-gray-600">Date</th>
                  <th className="px-6 py-3 text-left text-gray-600">Order ID</th>
                  <th className="px-6 py-3 text-left text-gray-600">Amount</th>
                  <th className="px-6 py-3 text-left text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-pink-50/50">
                    <td className="px-6 py-3">{tx.date}</td>
                    <td className="px-6 py-3 font-medium">{tx.orderId}</td>
                    <td className="px-6 py-3">₹{tx.amount.toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'settled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {tx.status}
                      </span>
                     </td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorEarnings;
