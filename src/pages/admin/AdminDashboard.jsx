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
    conversionRate: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadDashboardData();
  }, [navigate, selectedPeriod]);

  const loadDashboardData = () => {
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const allVendors = JSON.parse(localStorage.getItem('registeredVendors') || '[]');
    const allCustomers = JSON.parse(localStorage.getItem('registeredCustomers') || '[]');
    
    // Revenue calculation
    const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total || o.amount || 0), 0);
    
    // Pending items
    const pendingVendors = allVendors.filter(v => v.vendorStatus === 'pending').length;
    const pendingProducts = allProducts.filter(p => p.adminApproved === false).length;
    const lowStockProducts = allProducts.filter(p => (p.stock || 0) < 10).length;
    
    // Today's data
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = allOrders.filter(o => o.date === today);
    const todaySales = todayOrders.reduce((sum, o) => sum + (o.total || o.amount || 0), 0);
    
    // Calculate monthly growth (compare last 30 days with previous 30 days)
    const now = new Date();
    const last30Start = new Date(now.setDate(now.getDate() - 30));
    const prev30Start = new Date(now.setDate(now.getDate() - 60));
    
    const last30Orders = allOrders.filter(o => new Date(o.date) >= last30Start);
    const prev30Orders = allOrders.filter(o => new Date(o.date) >= prev30Start && new Date(o.date) < last30Start);
    
    const last30Revenue = last30Orders.reduce((sum, o) => sum + (o.total || o.amount || 0), 0);
    const prev30Revenue = prev30Orders.reduce((sum, o) => sum + (o.total || o.amount || 0), 0);
    const monthlyGrowth = prev30Revenue > 0 ? ((last30Revenue - prev30Revenue) / prev30Revenue * 100).toFixed(1) : 0;
    
    // Conversion rate (orders / visitors) - mock for now
    const conversionRate = ((allOrders.length / (allCustomers.length * 2)) * 100).toFixed(1);
    
    // Top products by sales
    const productSales = {};
    allOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          productSales[item.id] = (productSales[item.id] || 0) + (item.quantity || 1);
        });
      }
    });
    const topProductsList = allProducts
      .map(p => ({ ...p, totalSold: productSales[p.id] || 0 }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);
    setTopProducts(topProductsList);
    
    // Top vendors by sales
    const vendorSales = {};
    allOrders.forEach(order => {
      if (order.vendor) {
        vendorSales[order.vendor] = (vendorSales[order.vendor] || 0) + (order.total || order.amount || 0);
      }
    });
    const topVendorsList = Object.entries(vendorSales)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
    setTopVendors(topVendorsList);
    
    // Category sales
    const categorySalesMap = {};
    allOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          categorySalesMap[item.category] = (categorySalesMap[item.category] || 0) + (item.price * (item.quantity || 1));
        });
      }
    });
    const categorySalesList = Object.entries(categorySalesMap)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales);
    setCategorySales(categorySalesList);
    
    // Generate sales chart data
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
    
    setStats({
      totalRevenue,
      totalOrders: allOrders.length,
      totalProducts: allProducts.length,
      totalVendors: allVendors.length,
      totalCustomers: allCustomers.length,
      pendingVendors,
      pendingProducts,
      lowStockProducts,
      todaySales,
      todayOrders: todayOrders.length,
      monthlyGrowth,
      conversionRate
    });
    
    setRecentOrders(allOrders.slice(-8).reverse());
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-purple-100 text-purple-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const maxSales = Math.max(...salesData.map(d => d.sales), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminSidebar />
      
      {/* Premium Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 py-4 fixed top-0 right-0 left-64 z-40 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">Welcome back, Super Admin</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-500 bg-white"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <div className="relative">
              <input type="text" placeholder="Search..." className="w-48 lg:w-64 pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-500 bg-gray-50" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md">SA</div>
          </div>
        </div>
      </div>

      <main className="ml-64 pt-20 p-4 sm:p-6">
        
        {/* Stats Cards - Premium Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition group">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Today's Sales</p>
              <span className="text-lg">💰</span>
            </div>
            <p className="text-2xl font-bold text-green-600">₹{stats.todaySales.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.todayOrders} orders</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Total Revenue</p>
              <span className="text-lg">📊</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">₹{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-green-600 mt-1">↑ {stats.monthlyGrowth}% vs last month</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Total Orders</p>
              <span className="text-lg">📦</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
            <p className="text-xs text-gray-400 mt-1">Conversion: {stats.conversionRate}%</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Total Customers</p>
              <span className="text-lg">👥</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalCustomers}</p>
            <p className="text-xs text-gray-400 mt-1">Active buyers</p>
          </div>
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Products</p>
              <span className="text-lg">✨</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
            {stats.pendingProducts > 0 && <p className="text-xs text-yellow-600 mt-1">{stats.pendingProducts} pending</p>}
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Vendors</p>
              <span className="text-lg">🏪</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalVendors}</p>
            {stats.pendingVendors > 0 && <p className="text-xs text-yellow-600 mt-1">{stats.pendingVendors} pending</p>}
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Low Stock</p>
              <span className="text-lg">⚠️</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.lowStockProducts}</p>
            <p className="text-xs text-gray-400 mt-1">Below 10 units</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Avg Order Value</p>
              <span className="text-lg">📈</span>
            </div>
            <p className="text-2xl font-bold text-pink-600">₹{stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString() : 0}</p>
          </div>
        </div>

        {/* Charts Section - Sales & Category */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold text-gray-800">Sales Overview</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedPeriod === 'weekly' ? 'Last 7 days' : selectedPeriod === 'monthly' ? 'This year' : 'Yearly trend'}</p>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-pink-500 rounded-full"></span> Sales (₹)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full"></span> Orders</span>
              </div>
            </div>
            <div className="relative h-64">
              <div className="flex items-end gap-2 h-full">
                {salesData.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full">
                      <div className="w-full bg-pink-100 rounded-t-lg transition-all duration-500" style={{ height: `${Math.max((item.sales / maxSales) * 100, 5)}%`, minHeight: '20px' }}>
                        <div className="w-full bg-gradient-to-t from-pink-500 to-rose-500 rounded-t-lg transition-all duration-500" style={{ height: `${(item.sales / maxSales) * 100}%` }}></div>
                      </div>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        ₹{Math.round(item.sales / 1000)}k
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Sales */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📊</span> Sales by Category
            </h3>
            <div className="space-y-3">
              {categorySales.slice(0, 5).map((cat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{cat.name || 'Other'}</span>
                    <span className="font-semibold">₹{(cat.sales / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min((cat.sales / (categorySales[0]?.sales || 1)) * 100, 100)}%` }}></div>
                  </div>
                </div>
              ))}
              {categorySales.length === 0 && (
                <p className="text-gray-400 text-center py-8">No sales data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Products & Top Vendors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>🏆</span> Top Selling Products
            </h3>
            <div className="space-y-3">
              {topProducts.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No sales yet</p>
              ) : (
                topProducts.map((product, idx) => (
                  <div key={product.id} className="flex items-center gap-3 p-2 hover:bg-pink-50 rounded-xl transition">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-sm font-bold text-pink-600">{idx + 1}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</p>
                      <p className="text-xs text-gray-400">Sold: {product.totalSold || 0}</p>
                    </div>
                    <p className="text-sm font-semibold text-pink-600">₹{product.price}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Vendors */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>🏪</span> Top Performing Vendors
            </h3>
            <div className="space-y-3">
              {topVendors.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No vendor sales yet</p>
              ) : (
                topVendors.map((vendor, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 hover:bg-pink-50 rounded-xl transition">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600">{idx + 1}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{vendor.name}</p>
                    </div>
                    <p className="text-sm font-semibold text-green-600">₹{(vendor.sales / 1000).toFixed(0)}k</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-gray-800">Recent Orders</h3>
              <p className="text-xs text-gray-400 mt-0.5">Latest 8 orders</p>
            </div>
            <Link to="/admin/orders" className="text-sm text-pink-600 hover:underline flex items-center gap-1">
              View All Orders →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="border-b">
                  <th className="px-5 py-3 text-left">Order ID</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Date</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-gray-400">No orders yet</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-pink-50/30 transition">
                      <td className="px-5 py-3 font-mono text-sm font-medium text-gray-800">{order.id}</td>
                      <td className="px-5 py-3 text-gray-600">{order.customerEmail || order.customer || 'Guest'}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-800">₹{(order.total || order.amount || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-gray-500 text-xs">{order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-5 py-3 text-center">
                        <Link to={`/admin/orders`} className="text-pink-500 hover:text-pink-600 text-xs">View</Link>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {stats.pendingVendors > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex justify-between items-center">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">{stats.pendingVendors} vendors pending</p>
                    <p className="text-xs text-yellow-600">Review and approve</p>
                  </div>
                </div>
                <Link to="/admin/vendors?tab=pending" className="bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm">Review</Link>
              </div>
            )}
            {stats.pendingProducts > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex justify-between items-center">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📦</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-800">{stats.pendingProducts} products pending</p>
                    <p className="text-xs text-blue-600">Review listings</p>
                  </div>
                </div>
                <Link to="/admin/products?tab=pending" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm">Review</Link>
              </div>
            )}
            {stats.lowStockProducts > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex justify-between items-center">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold text-orange-800">{stats.lowStockProducts} low stock items</p>
                    <p className="text-xs text-orange-600">Restock soon</p>
                  </div>
                </div>
                <Link to="/admin/inventory" className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm">View</Link>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          <Link to="/admin/add-product" className="bg-white rounded-2xl p-3 text-center border border-gray-100 hover:shadow-md transition group">
            <div className="text-2xl mb-1 group-hover:scale-110 transition">➕</div>
            <p className="text-xs font-medium text-gray-700">Add Product</p>
          </Link>
          <Link to="/admin/orders" className="bg-white rounded-2xl p-3 text-center border border-gray-100 hover:shadow-md transition group">
            <div className="text-2xl mb-1 group-hover:scale-110 transition">📦</div>
            <p className="text-xs font-medium text-gray-700">View Orders</p>
          </Link>
          <Link to="/admin/vendors" className="bg-white rounded-2xl p-3 text-center border border-gray-100 hover:shadow-md transition group">
            <div className="text-2xl mb-1 group-hover:scale-110 transition">🏪</div>
            <p className="text-xs font-medium text-gray-700">Vendors</p>
          </Link>
          <Link to="/admin/banners" className="bg-white rounded-2xl p-3 text-center border border-gray-100 hover:shadow-md transition group">
            <div className="text-2xl mb-1 group-hover:scale-110 transition">🎨</div>
            <p className="text-xs font-medium text-gray-700">Banners</p>
          </Link>
          <Link to="/admin/coupons" className="bg-white rounded-2xl p-3 text-center border border-gray-100 hover:shadow-md transition group">
            <div className="text-2xl mb-1 group-hover:scale-110 transition">🎫</div>
            <p className="text-xs font-medium text-gray-700">Coupons</p>
          </Link>
          <Link to="/admin/reports" className="bg-white rounded-2xl p-3 text-center border border-gray-100 hover:shadow-md transition group">
            <div className="text-2xl mb-1 group-hover:scale-110 transition">📊</div>
            <p className="text-xs font-medium text-gray-700">Reports</p>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
