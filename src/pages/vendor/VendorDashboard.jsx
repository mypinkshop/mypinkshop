import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorDashboard() {
  const [vendor, setVendor] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 24,
    totalOrders: 156,
    totalSales: 125000,
    pendingOrders: 8,
    earnings: 106250,
    rating: 4.8,
  });
  const [recentOrders, setRecentOrders] = useState([
    { id: '#MPS-1001', customer: 'Priya Sharma', amount: 2598, status: 'delivered', date: '2024-05-10' },
    { id: '#MPS-1002', customer: 'Aditi Singh', amount: 1798, status: 'shipped', date: '2024-05-09' },
    { id: '#MPS-1003', customer: 'Neha Gupta', amount: 899, status: 'pending', date: '2024-05-09' },
  ]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('vendorToken');

  useEffect(() => {
    if (!token) {
      navigate('/vendor/login');
      return;
    }
    const vendorData = JSON.parse(localStorage.getItem('vendor') || '{}');
    setVendor(vendorData);
    setLoading(false);
  }, [token, navigate]);

  const getStatusBadge = (status) => {
    const styles = {
      delivered: 'bg-green-100 text-green-700',
      shipped: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
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
      <VendorHeader vendor={vendor} />
      <VendorSidebar activeTab="dashboard" />

      <main className="ml-64 pt-16 p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold mb-2">Welcome back, {vendor?.brandName || vendor?.name || 'Seller'}! 👋</h1>
                <p className="opacity-90">Here's your store performance overview.</p>
              </div>
              <Link to="/vendor/add-product" className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition">
                + Add New Product
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-pink-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-xl">📦</div>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <p className="text-gray-500 text-sm">Total Products</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-pink-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl">📋</div>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <p className="text-gray-500 text-sm">Total Orders</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-pink-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xl">💰</div>
                <p className="text-2xl font-bold">₹{stats.totalSales.toLocaleString()}</p>
              </div>
              <p className="text-gray-500 text-sm">Total Sales</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-pink-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-xl">⏳</div>
                <p className="text-2xl font-bold">{stats.pendingOrders}</p>
              </div>
              <p className="text-gray-500 text-sm">Pending Orders</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-pink-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-xl">🏆</div>
                <p className="text-2xl font-bold">{stats.rating} ★</p>
              </div>
              <p className="text-gray-500 text-sm">Seller Rating</p>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-pink-100">
            <div className="px-6 py-4 border-b border-pink-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Recent Orders</h3>
              <Link to="/vendor/orders" className="text-sm text-pink-500 hover:text-pink-600">View All →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-pink-50">
                  <tr className="border-b border-pink-100">
                    <th className="px-6 py-3 text-left text-gray-600">Order ID</th>
                    <th className="px-6 py-3 text-left text-gray-600">Customer</th>
                    <th className="px-6 py-3 text-left text-gray-600">Amount</th>
                    <th className="px-6 py-3 text-left text-gray-600">Date</th>
                    <th className="px-6 py-3 text-left text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-pink-50/50">
                      <td className="px-6 py-3 font-medium">{order.id}</td>
                      <td className="px-6 py-3">{order.customer}</td>
                      <td className="px-6 py-3">₹{order.amount}</td>
                      <td className="px-6 py-3">{order.date}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button className="text-pink-500 hover:text-pink-600">View →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorDashboard;
