import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatsCard from './components/StatsCard';

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayRevenue: 12450,
    todayOrders: 45,
    totalRevenue: 4520000,
    totalOrders: 1234,
    totalProducts: 2847,
    totalVendors: 342,
    pendingVendors: 18,
    lowStockProducts: 12,
  });

  const [recentOrders, setRecentOrders] = useState([
    { id: '#MPS1001', customer: 'Priya Sharma', vendor: 'Nykaa Beauty', amount: 2598, status: 'delivered', date: '2024-05-12' },
    { id: '#MPS1002', customer: 'Aditi Singh', vendor: 'Mamaearth', amount: 1798, status: 'shipped', date: '2024-05-12' },
    { id: '#MPS1003', customer: 'Neha Gupta', vendor: 'Sugar Cosmetics', amount: 899, status: 'pending', date: '2024-05-11' },
    { id: '#MPS1004', customer: 'Riya Mehta', vendor: 'Nykaa Beauty', amount: 3499, status: 'delivered', date: '2024-05-11' },
    { id: '#MPS1005', customer: 'Anjali Verma', vendor: 'Plum', amount: 1599, status: 'processing', date: '2024-05-10' },
  ]);

  const topProducts = [
    { id: 1, name: 'Glass Skin Serum', sales: 234, revenue: 303966 },
    { id: 2, name: 'Cherry Lip Tint', sales: 189, revenue: 113211 },
    { id: 3, name: 'Satin Slip Dress', sales: 156, revenue: 389844 },
    { id: 4, name: 'Rice Water Toner', sales: 145, revenue: 130355 },
    { id: 5, name: 'Baby Pink Blush', sales: 123, revenue: 98277 },
  ];

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">
          {/* Today's Stats */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Today's Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatsCard title="Today's Revenue" value={`₹${stats.todayRevenue.toLocaleString()}`} icon="💰" trend="up" trendValue="12%" />
              <StatsCard title="Today's Orders" value={stats.todayOrders} icon="📦" trend="up" trendValue="8%" />
              <StatsCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon="🏆" />
              <StatsCard title="Total Orders" value={stats.totalOrders} icon="📋" />
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Total Products</p>
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Total Vendors</p>
                <span className="text-2xl">🏪</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalVendors}</p>
              <p className="text-xs text-yellow-600 mt-1">{stats.pendingVendors} pending approval</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Low Stock Alert</p>
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-2xl font-bold text-red-500">{stats.lowStockProducts}</p>
              <p className="text-xs text-gray-500 mt-1">Products with stock {'<'} 10</p>
            </div>
          </div>

          {/* Top Products & Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold">🔥 Top Selling Products</h3>
              </div>
              <div className="divide-y">
                {topProducts.map((product, idx) => (
                  <div key={product.id} className="px-5 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400 w-6">{idx + 1}</span>
                      <span className="font-medium">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{product.sales} sales</p>
                      <p className="text-xs text-gray-500">₹{product.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold">📋 Recent Orders</h3>
                <button className="text-sm text-pink-500 hover:text-pink-600">View All →</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left">Order ID</th>
                      <th className="px-5 py-3 text-left">Customer</th>
                      <th className="px-5 py-3 text-left">Amount</th>
                      <th className="px-5 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium">{order.id}</td>
                        <td className="px-5 py-3">{order.customer}</td>
                        <td className="px-5 py-3">₹{order.amount}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Required */}
          <div className="mt-6 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="font-medium text-gray-800">Action Required</p>
                  <p className="text-sm text-gray-600">{stats.pendingVendors} vendors pending approval</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition">
                Review Now →
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
