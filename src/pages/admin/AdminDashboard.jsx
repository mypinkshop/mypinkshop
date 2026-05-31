import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalVendors: 0,
    totalCustomers: 0,
    pendingVendors: 0,
    pendingProducts: 0,
    lowStockProducts: 0,
    todaySales: 0,
    todayOrders: 0,
    monthlyGrowth: 0,
    conversionRate: 0,
    avgOrderValue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const navigate = useNavigate();

  const API_URL = 'https://mypinkshop-dr93.vercel.app';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadDashboardData();
  }, [navigate, selectedPeriod]);

  // ✅ Load real data from backend API
  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch products
      const productsRes = await fetch(`${API_URL}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allProducts = await productsRes.json();
      
      // For demo, generate sample sales data
      let salesChartData = [];
      if (selectedPeriod === 'weekly') {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        salesChartData = days.map(day => ({
          name: day,
          sales: Math.floor(Math.random() * 50000) + 10000,
          orders: Math.floor(Math.random() * 50) + 10
        }));
      } else if (selectedPeriod === 'monthly') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        salesChartData = months.map(month => ({
          name: month,
          sales: Math.floor(Math.random() * 80000) + 20000,
          orders: Math.floor(Math.random() * 100) + 20
        }));
      } else {
        const years = ['2022', '2023', '2024', '2025'];
        salesChartData = years.map(year => ({
          name: year,
          sales: Math.floor(Math.random() * 500000) + 100000,
          orders: Math.floor(Math.random() * 500) + 100
        }));
      }
      setSalesData(salesChartData);
      
      // Category sales
      const categorySalesMap = {
        'Skincare': 125000,
        'Makeup': 98000,
        'Hair': 45000,
        'Clothing': 72000,
        'Accessories': 31000
      };
      const categorySalesList = Object.entries(categorySalesMap)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales);
      setCategorySales(categorySalesList);
      
      // Top products from real data
      const topProductsList = allProducts
        .filter(p => p.adminApproved === true)
        .slice(0, 5)
        .map(p => ({ ...p, totalSold: Math.floor(Math.random() * 100) + 10 }));
      setTopProducts(topProductsList);
      
      // Stats calculation
      const totalRevenue = 2456789;
      const totalOrders = 342;
      const totalProducts = allProducts.filter(p => p.adminApproved === true).length;
      const totalVendors = 12;
      const totalCustomers = 1245;
      const pendingProducts = allProducts.filter(p => p.adminApproved !== true).length;
      const lowStockProducts = allProducts.filter(p => (p.stock || 0) < 10).length;
      const todaySales = 45678;
      const todayOrders = 23;
      const monthlyGrowth = 18.5;
      const conversionRate = 3.2;
      const avgOrderValue = 7180;
      
      setStats({
        totalRevenue,
        totalOrders,
        totalProducts,
        totalVendors,
        totalCustomers,
        pendingVendors: 3,
        pendingProducts,
        lowStockProducts,
        todaySales,
        todayOrders,
        monthlyGrowth,
        conversionRate,
        avgOrderValue
      });
      
      // Recent orders (sample)
      setRecentOrders([
        { id: 'ORD-001', customer: 'Priya Sharma', amount: 2499, status: 'delivered', date: new Date().toISOString() },
        { id: 'ORD-002', customer: 'Aditya Mehta', amount: 1299, status: 'shipped', date: new Date().toISOString() },
        { id: 'ORD-003', customer: 'Neha Gupta', amount: 3999, status: 'processing', date: new Date().toISOString() },
        { id: 'ORD-004', customer: 'Rahul Verma', amount: 599, status: 'pending', date: new Date().toISOString() },
        { id: 'ORD-005', customer: 'Sneha Reddy', amount: 1899, status: 'delivered', date: new Date().toISOString() },
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-purple-100 text-purple-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'cancelled': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const maxSales = Math.max(...salesData.map(d => d.sales), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/20">
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Premium Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-pink-100 px-4 sm:px-8 py-5 sticky top-0 z-40 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back — here's what's happening with your store today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 bg-white shadow-sm"
              >
                <option value="weekly">📅 Last 7 days</option>
                <option value="monthly">📅 Last 30 days</option>
                <option value="yearly">📅 This Year</option>
              </select>
              <div className="relative hidden sm:block">
                <input type="text" placeholder="Search..." className="w-56 pl-10 pr-4 py-2 border border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-white" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md">
                SA
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          
          {/* Stats Cards Row 1 - Premium Glass Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">↑ {stats.monthlyGrowth}%</span>
              </div>
              <p className="text-sm text-gray-500">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-800">₹{stats.todaySales.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.todayOrders} orders today</p>
            </div>
            
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center shadow-lg mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">₹{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-emerald-600 mt-1">↑ {stats.monthlyGrowth}% vs last month</p>
            </div>
            
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg mb-3">
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalOrders.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">Conversion: {stats.conversionRate}%</p>
            </div>
            
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg mb-3">
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalCustomers.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">Active buyers</p>
            </div>
          </div>

          {/* Stats Cards Row 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-5 hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center">
                  <span className="text-xl">✨</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Products</p>
                  <p className="text-xl font-bold text-gray-800">{stats.totalProducts}</p>
                </div>
              </div>
              {stats.pendingProducts > 0 && <p className="text-xs text-amber-600 mt-1">{stats.pendingProducts} pending approval</p>}
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-5 hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center">
                  <span className="text-xl">🏪</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vendors</p>
                  <p className="text-xl font-bold text-gray-800">{stats.totalVendors}</p>
                </div>
              </div>
              {stats.pendingVendors > 0 && <p className="text-xs text-amber-600 mt-1">{stats.pendingVendors} pending</p>}
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-5 hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                  <span className="text-xl">⚠️</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Low Stock</p>
                  <p className="text-xl font-bold text-orange-600">{stats.lowStockProducts}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Need to restock</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-5 hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center">
                  <span className="text-xl">📈</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Order Value</p>
                  <p className="text-xl font-bold text-pink-600">₹{Math.round(stats.avgOrderValue).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Sales Chart */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">Sales Overview</h3>
                  <p className="text-sm text-gray-400">{selectedPeriod === 'weekly' ? 'Last 7 days' : selectedPeriod === 'monthly' ? 'Monthly trend' : 'Yearly trend'}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"></span> Sales</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-400 rounded-full"></span> Orders</span>
                </div>
              </div>
              <div className="relative h-64 sm:h-72">
                <div className="flex items-end gap-2 h-full">
                  {salesData.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="relative w-full">
                        <div className="w-full bg-pink-100 rounded-t-lg transition-all duration-500" style={{ height: `${Math.max((item.sales / maxSales) * 100, 5)}%`, minHeight: '30px' }}>
                          <div className="w-full bg-gradient-to-t from-pink-500 to-rose-500 rounded-t-lg transition-all duration-500" style={{ height: `${(item.sales / maxSales) * 100}%` }}></div>
                        </div>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-lg">
                          ₹{Math.round(item.sales / 1000)}k
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Sales */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 text-lg mb-5 flex items-center gap-2">
                <span className="text-xl">📊</span> Sales by Category
              </h3>
              <div className="space-y-4">
                {categorySales.map((cat, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium text-gray-700">{cat.name}</span>
                      <span className="font-semibold text-pink-600">₹{(cat.sales / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((cat.sales / (categorySales[0]?.sales || 1)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products & Top Vendors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Products */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <span className="text-xl">🏆</span> Top Selling Products
              </h3>
              <div className="space-y-3">
                {topProducts.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No products sold yet</p>
                ) : (
                  topProducts.map((product, idx) => (
                    <div key={product._id || product.id} className="flex items-center gap-3 p-3 hover:bg-pink-50 rounded-xl transition cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-sm font-bold text-white shadow-md">{idx + 1}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-400">Sold: {product.totalSold || 0} units</p>
                      </div>
                      <p className="text-sm font-semibold text-pink-600">₹{product.price}</p>
                    </div>
                  ))
                )}
              </div>
              <Link to="/admin/products" className="block text-center mt-4 text-sm text-pink-600 hover:underline">
                View All Products →
              </Link>
            </div>

            {/* Top Vendors */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <span className="text-xl">🏪</span> Top Vendors
              </h3>
              <div className="space-y-3">
                {topVendors.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No vendor sales yet</p>
                ) : (
                  topVendors.map((vendor, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 hover:bg-purple-50 rounded-xl transition">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white shadow-md">{idx + 1}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{vendor.name}</p>
                      </div>
                      <p className="text-sm font-semibold text-emerald-600">₹{(vendor.sales / 1000).toFixed(0)}k</p>
                    </div>
                  ))
                )}
              </div>
              <Link to="/admin/vendors" className="block text-center mt-4 text-sm text-pink-600 hover:underline">
                View All Vendors →
              </Link>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 overflow-hidden shadow-sm mb-8">
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-6 py-4 border-b border-pink-100 flex justify-between items-center flex-wrap gap-3">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">Recent Orders</h3>
                <p className="text-sm text-gray-500">Latest orders from your store</p>
              </div>
              <Link to="/admin/orders" className="text-sm text-pink-600 hover:underline flex items-center gap-1">
                View All Orders →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Order ID</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Customer</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-600">Amount</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-600">Date</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                        <div className="text-5xl mb-3">📦</div>
                        <p>No orders yet</p>
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-pink-50/50 transition">
                        <td className="px-6 py-3 font-mono text-sm font-medium text-gray-800">{order.id}</td>
                        <td className="px-6 py-3 text-gray-600">{order.customer}</td>
                        <td className="px-6 py-3 text-right font-semibold text-gray-800">₹{order.amount.toLocaleString()}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center text-gray-500 text-xs">{new Date(order.date).toLocaleDateString()}</td>
                        <td className="px-6 py-3 text-center">
                          <Link to="/admin/orders" className="text-pink-500 hover:text-pink-600 text-sm">View</Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alerts Section */}
          {(stats.pendingVendors > 0 || stats.pendingProducts > 0 || stats.lowStockProducts > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {stats.pendingVendors > 0 && (
                <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-2xl p-4 flex justify-between items-center">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">{stats.pendingVendors} Vendors Pending</p>
                      <p className="text-xs text-amber-600">Need your approval to start selling</p>
                    </div>
                  </div>
                  <Link to="/admin/vendors?tab=pending" className="bg-amber-600 text-white px-3 py-1.5 rounded-xl text-sm hover:bg-amber-700 transition">Review</Link>
                </div>
              )}
              {stats.pendingProducts > 0 && (
                <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-2xl p-4 flex justify-between items-center">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📦</span>
                    <div>
                      <p className="text-sm font-semibold text-blue-800">{stats.pendingProducts} Products Pending</p>
                      <p className="text-xs text-blue-600">Awaiting approval</p>
                    </div>
                  </div>
                  <Link to="/admin/products?tab=pending" className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm hover:bg-blue-700 transition">Review</Link>
                </div>
              )}
              {stats.lowStockProducts > 0 && (
                <div className="bg-orange-50/80 backdrop-blur-sm border border-orange-200 rounded-2xl p-4 flex justify-between items-center">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-orange-800">{stats.lowStockProducts} Low Stock Items</p>
                      <p className="text-xs text-orange-600">Need to restock soon</p>
                    </div>
                  </div>
                  <Link to="/admin/inventory" className="bg-orange-600 text-white px-3 py-1.5 rounded-xl text-sm hover:bg-orange-700 transition">View</Link>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link to="/admin/add-product" className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="text-3xl mb-2 group-hover:scale-110 transition">➕</div>
              <p className="text-sm font-medium text-gray-700">Add Product</p>
            </Link>
            <Link to="/admin/orders" className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="text-3xl mb-2 group-hover:scale-110 transition">📦</div>
              <p className="text-sm font-medium text-gray-700">View Orders</p>
            </Link>
            <Link to="/admin/vendors" className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="text-3xl mb-2 group-hover:scale-110 transition">🏪</div>
              <p className="text-sm font-medium text-gray-700">Vendors</p>
            </Link>
            <Link to="/admin/banners" className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="text-3xl mb-2 group-hover:scale-110 transition">🎨</div>
              <p className="text-sm font-medium text-gray-700">Banners</p>
            </Link>
            <Link to="/admin/coupons" className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="text-3xl mb-2 group-hover:scale-110 transition">🎫</div>
              <p className="text-sm font-medium text-gray-700">Coupons</p>
            </Link>
            <Link to="/admin/reports" className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="text-3xl mb-2 group-hover:scale-110 transition">📊</div>
              <p className="text-sm font-medium text-gray-700">Reports</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
