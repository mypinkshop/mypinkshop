import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorDashboard() {
  const [vendor, setVendor] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    earnings: 0,
    rating: 4.8,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = 'https://mypinkshop-dr93.vercel.app/api';
  const token = localStorage.getItem('vendorToken');

  useEffect(() => {
    if (!token) {
      navigate('/vendor/login');
      return;
    }

    const vendorData = JSON.parse(localStorage.getItem('vendor') || '{}');
    setVendor(vendorData);

    // Mock data for now (will connect to API later)
    setStats({
      totalProducts: 24,
      totalOrders: 156,
      totalSales: 125000,
      pendingOrders: 8,
      earnings: 106250,
      rating: 4.8,
    });

    setRecentOrders([
      { id: '#MPS-1001', customer: 'Priya Sharma', amount: 2598, status: 'delivered', date: '2024-05-10' },
      { id: '#MPS-1002', customer: 'Aditi Singh', amount: 1798, status: 'shipped', date: '2024-05-09' },
      { id: '#MPS-1003', customer: 'Neha Gupta', amount: 899, status: 'pending', date: '2024-05-09' },
    ]);
    setLoading(false);
  }, [token, navigate]);

  const getStatusBadge = (status) => {
    const styles = {
      delivered: 'bg-green-100 text-green-700',
      shipped: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-purple-100 text-purple-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">
      <VendorHeader vendor={vendor} />
      <VendorSidebar activeTab="dashboard" />

      {/* Main Content */}
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold mb-2">Welcome back, {vendor?.brandName || vendor?.name}! 👋</h1>
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

          {/* Earnings and Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Card */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-500 text-sm">Total Earnings</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">₹{stats.earnings.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-pink-200 flex items-center justify-center text-2xl">💰</div>
              </div>
              <div className="flex gap-4">
                <button className="flex-1 bg-white text-pink-600 border border-pink-200 py-2 rounded-lg font-medium hover:bg-pink-50 transition">
                  Request Withdrawal
                </button>
                <Link to="/vendor/earnings" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg font-medium text-center hover:shadow-lg transition">
                  View Details
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-pink-100">
              <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/vendor/add-product" className="text-center p-3 rounded-xl bg-pink-50 hover:bg-pink-100 transition">
                  <div className="text-2xl mb-1">➕</div>
                  <p className="text-sm font-medium">Add Product</p>
                </Link>
                <Link to="/vendor/products" className="text-center p-3 rounded-xl bg-pink-50 hover:bg-pink-100 transition">
                  <div className="text-2xl mb-1">📦</div>
                  <p className="text-sm font-medium">Manage Products</p>
                </Link>
                <Link to="/vendor/orders" className="text-center p-3 rounded-xl bg-pink-50 hover:bg-pink-100 transition">
                  <div className="text-2xl mb-1">📋</div>
                  <p className="text-sm font-medium">View Orders</p>
                </Link>
                <Link to="/vendor/profile" className="text-center p-3 rounded-xl bg-pink-50 hover:bg-pink-100 transition">
                  <div className="text-2xl mb-1">⚙️</div>
                  <p className="text-sm font-medium">Store Settings</p>
                </Link>
              </div>
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
                  </table>
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
