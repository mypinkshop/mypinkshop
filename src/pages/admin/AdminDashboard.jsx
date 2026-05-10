import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [visitors, setVisitors] = useState(1247);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock stats
  const mockStats = {
    totalSales: 4582000,
    totalOrders: 342,
    totalProducts: 2847,
    totalVendors: 342,
    pendingOrders: 23,
    lowStock: 12,
  };

  useEffect(() => {
    // Simulate real-time visitors
    const interval = setInterval(() => {
      setVisitors(prev => prev + Math.floor(Math.random() * 10) - 3);
    }, 5000);
    setStats(mockStats);
    setLoading(false);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { title: 'Total Revenue', value: `₹${(stats?.totalSales || 0).toLocaleString()}`, icon: '💰', change: '+23.5%', color: 'from-pink-500 to-rose-500' },
    { title: 'Total Orders', value: stats?.totalOrders?.toLocaleString() || '0', icon: '📦', change: '+15.2%', color: 'from-blue-500 to-cyan-500' },
    { title: 'Active Vendors', value: stats?.totalVendors?.toLocaleString() || '0', icon: '🏪', change: '+8.1%', color: 'from-purple-500 to-indigo-500' },
    { title: 'Products', value: stats?.totalProducts?.toLocaleString() || '0', icon: '👗', change: '+12.3%', color: 'from-emerald-500 to-teal-500' },
  ];

  const recentOrders = [
    { id: '#MPS-1001', customer: 'Priya Sharma', amount: 2598, status: 'Delivered', date: '2024-05-10' },
    { id: '#MPS-1002', customer: 'Aditi Singh', amount: 1798, status: 'Shipped', date: '2024-05-09' },
    { id: '#MPS-1003', customer: 'Neha Gupta', amount: 899, status: 'Pending', date: '2024-05-09' },
    { id: '#MPS-1004', customer: 'Riya Mehta', amount: 3499, status: 'Processing', date: '2024-05-08' },
    { id: '#MPS-1005', customer: 'Anjali Verma', amount: 1599, status: 'Delivered', date: '2024-05-08' },
  ];

  const activities = [
    { action: 'New vendor registered', user: 'Nykaa Beauty', time: '2 min ago', icon: '🏪' },
    { action: 'Order #MPS-1002 delivered', user: 'Aditi Singh', time: '15 min ago', icon: '📦' },
    { action: 'Product added', user: 'Mamaearth', time: '1 hour ago', icon: '👗' },
    { action: 'New user joined', user: 'Priya Sharma', time: '3 hours ago', icon: '👤' },
    { action: 'Low stock alert', user: '12 products', time: '5 hours ago', icon: '⚠️' },
  ];

  const categoryData = [
    { name: 'Skincare', percentage: 35, color: '#ec4899' },
    { name: 'Makeup', percentage: 28, color: '#8b5cf6' },
    { name: 'The Drip', percentage: 22, color: '#f59e0b' },
    { name: 'Accessories', percentage: 15, color: '#10b981' },
  ];

  const salesData = [4200, 5800, 7100, 8900, 12400, 15600, 13200];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxSale = Math.max(...salesData);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      
      {/* Top Navbar */}
      <div className={`fixed top-0 right-0 left-64 z-50 ${darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90'} backdrop-blur-md border-b shadow-sm`}>
        <div className="px-6 py-3 flex justify-between items-center">
          <div className="relative">
            <input type="text" placeholder="Search orders, products, vendors..." className={`pl-9 pr-4 py-2 rounded-lg text-sm w-80 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-100 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-pink-500`} />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative">
              <span className="text-xl">🔔</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-gray-100">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm">
                <p className="font-semibold">Super Admin</p>
                <p className="text-gray-500 text-xs">admin@mypinkshop.com</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">SA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} shadow-xl z-40`}>
        <div className="p-5 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
            <div>
              <h1 className="font-bold text-lg">MyPinkShop</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-pink-50 text-pink-600">
            <span>📊</span> Dashboard
          </Link>
          <Link to="/admin/vendors" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
            <span>🏪</span> Vendors
          </Link>
          <Link to="/admin/products" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
            <span>👗</span> Products
          </Link>
          <Link to="/admin/orders" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
            <span>📦</span> Orders
          </Link>
          <Link to="/admin/analytics" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
            <span>📈</span> Analytics
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
            <span>⚙️</span> Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 pt-16 p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Dashboard</h1>
            <p className="text-gray-500 text-sm">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition flex items-center gap-2">
              <span>📊</span> Export Report
            </button>
            <button className="px-4 py-2 border border-pink-500 text-pink-500 rounded-lg text-sm font-medium hover:bg-pink-50 transition flex items-center gap-2">
              <span>➕</span> Add Product
            </button>
          </div>
        </div>

        {/* Live Visitors Banner */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-4 mb-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">Live Visitors</p>
              <p className="text-3xl font-bold">{visitors}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Today's Revenue</p>
              <p className="text-xl font-bold">₹{(stats?.totalSales || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {statCards.map((card, idx) => (
            <div key={idx} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-5 shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-2xl">{card.icon}</span>
                <span className="text-green-500 text-sm font-medium">{card.change}</span>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-gray-500 text-sm mt-1">{card.title}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Chart */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-5 shadow-sm`}>
            <h3 className="font-semibold mb-4">Sales Overview (Last 7 Days)</h3>
            <div className="flex items-end gap-2 h-48">
              {salesData.map((sale, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-pink-100 rounded-t-lg transition-all duration-500 hover:bg-pink-200" style={{ height: `${(sale / maxSale) * 100}%`, minHeight: '20px' }}>
                    <div className="w-full h-full bg-pink-500 rounded-t-lg opacity-70 hover:opacity-100 transition" style={{ height: `${(sale / maxSale) * 100}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-500">{days[idx]}</span>
                  <span className="text-xs font-medium">₹{sale}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Donut */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-5 shadow-sm`}>
            <h3 className="font-semibold mb-4">Sales by Category</h3>
            <div className="space-y-3">
              {categoryData.map((cat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{cat.name}</span>
                    <span>{cat.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders Table */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm overflow-hidden`}>
            <div className="px-5 py-3 border-b flex justify-between items-center">
              <h3 className="font-semibold">Recent Orders</h3>
              <Link to="/admin/orders" className="text-sm text-pink-500 hover:text-pink-600">View All →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="px-5 py-3 text-left">Order ID</th>
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-left">Amount</th>
                    <th className="px-5 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentOrders.map((order, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium">{order.id}</td>
                      <td className="px-5 py-3">{order.customer}</td>
                      <td className="px-5 py-3">₹{order.amount}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'Processing' ? 'bg-purple-100 text-purple-700' :
                          'bg-yellow-100 text-yellow-700'
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

          {/* Activity Log */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-5 shadow-sm`}>
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {activities.map((act, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg`}>
                    {act.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{act.action}</p>
                    <p className="text-xs text-gray-500">{act.user} · {act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-center gap-3">
            <span className="text-amber-600 text-xl">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-800">Low Stock Alert</p>
              <p className="text-xs text-amber-700"><strong>{stats?.lowStock || 0}</strong> products are running low on stock. Please restock soon.</p>
            </div>
            <button className="ml-auto text-sm text-amber-700 underline">View Details</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
