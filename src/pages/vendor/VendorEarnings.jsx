import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorEarnings() {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    total: 0,
    available: 0,
    pending: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingClearance: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [vendor, setVendor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendor');
    
    if (!token || !vendorData) {
      navigate('/vendor/login');
      return;
    }

    const vendorInfo = JSON.parse(vendorData);
    setVendor(vendorInfo);
    const vendorName = vendorInfo.brandName || vendorInfo.name;
    
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const myOrders = allOrders.filter(o => o.vendor === vendorName);
    
    const deliveredOrders = myOrders.filter(o => o.status === 'delivered');
    const pendingOrders = myOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    
    const totalSales = deliveredOrders.reduce((sum, o) => sum + o.amount, 0);
    const commission = totalSales * 0.15;
    const netEarnings = totalSales - commission;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const thisMonthOrders = deliveredOrders.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });
    const thisMonthEarnings = thisMonthOrders.reduce((sum, o) => sum + (o.amount * 0.85), 0);
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthOrders = deliveredOrders.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear;
    });
    const lastMonthEarnings = lastMonthOrders.reduce((sum, o) => sum + (o.amount * 0.85), 0);
    
    const pendingClearance = pendingOrders.reduce((sum, o) => sum + (o.amount * 0.85), 0);
    
    setEarnings({
      total: netEarnings,
      available: netEarnings * 0.7,
      pending: netEarnings * 0.3,
      thisMonth: thisMonthEarnings,
      lastMonth: lastMonthEarnings,
      pendingClearance: pendingClearance,
    });
    
    const transactionList = deliveredOrders.slice(0, 10).map(order => ({
      id: order.id,
      date: order.date,
      orderId: order.id,
      amount: order.amount * 0.85,
      commission: order.amount * 0.15,
      status: order.paymentStatus || 'settled',
    }));
    setTransactions(transactionList);
    
    setLoading(false);
  }, [navigate]);

  const requestWithdrawal = () => {
    if (earnings.available < 1000) {
      alert('Minimum withdrawal amount is ₹1000');
      return;
    }
    alert(`Withdrawal request for ₹${earnings.available.toLocaleString()} submitted successfully!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      <VendorSidebar activeTab="earnings" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Earnings</h1>
            <p className="text-gray-500 text-sm">Track your sales earnings and withdrawals</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-5 text-white">
              <p className="text-sm opacity-90">Total Earnings</p>
              <p className="text-3xl font-bold mt-1">₹{earnings.total.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Available for Withdrawal</p>
              <p className="text-2xl font-bold text-green-600 mt-1">₹{earnings.available.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Pending Clearance</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">₹{earnings.pendingClearance.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">₹{earnings.thisMonth.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Last Month</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">₹{earnings.lastMonth.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="font-semibold text-gray-800">Request Withdrawal</h3>
                <p className="text-sm text-gray-500 mt-1">Minimum withdrawal amount: ₹1000</p>
              </div>
              <button onClick={requestWithdrawal} className="bg-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-pink-700 transition">
                Withdraw ₹{earnings.available.toLocaleString()}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">Transaction History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-left">Order ID</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Commission (15%)</th>
                    <th className="px-5 py-3 text-right">Net Earnings</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.length === 0 ? (
                    <tr className="hover:bg-gray-50">
                      <td colSpan="6" className="px-5 py-8 text-center text-gray-500">No transactions yet</td>
                    </tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">{tx.date}</td>
                        <td className="px-5 py-3 font-medium">{tx.orderId}</td>
                        <td className="px-5 py-3 text-right">₹{Math.round(tx.amount / 0.85).toLocaleString()}</td>
                        <td className="px-5 py-3 text-right text-red-500">-₹{Math.round(tx.commission).toLocaleString()}</td>
                        <td className="px-5 py-3 text-right font-semibold text-green-600">₹{Math.round(tx.amount).toLocaleString()}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${tx.status === 'settled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {tx.status === 'settled' ? 'Settled' : 'Pending'}
                          </span>
                        </td>
                      </table>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorEarnings;
