// AdminDashboard.js - Premium Redesign
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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
    pendingReviews: 0,
    lowStockProducts: 0,
    todaySales: 0,
    todayOrders: 0,
    monthlyGrowth: 0,
    conversionRate: 0,
    avgOrderValue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [activeOffer, setActiveOffer] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  const getToken = () => localStorage.getItem('adminToken');

  // ===== HELPERS =====
  const safeArray = (data, ...keys) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      for (const key of keys) if (Array.isArray(data[key])) return data[key];
      if (Array.isArray(data.data)) return data.data;
    }
    return [];
  };

  const getOrderTotal = (order) => Number(order.total_amount || order.total || order.amount || 0);
  const getOrderDate = (order) => order.created_at || order.createdAt || order.date || null;

  const parseDate = (str) => {
    if (!str) return new Date(0);
    try { return new Date(str.replace(' ', 'T')); } catch { return new Date(0); }
  };

  // ===== AUTH =====
  useEffect(() => {
    const token = getToken();
    if (!token) navigate('/admin/login');
  }, [navigate]);

  // ===== LOAD DASHBOARD =====
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) { navigate('/admin/login'); return; }

      const [productsRes, ordersRes, vendorsRes, usersRes, reviewsRes] = await Promise.all([
        fetch(`${API_URL}/api/products`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/orders/all?limit=500`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/vendors`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
        fetch(`${API_URL}/api/users`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
        fetch(`${API_URL}/api/reviews/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null)
      ]);

      let allProducts = [], allOrders = [], allVendors = [], allUsers = [], reviewStats = { pending: 0, total: 0 };

      try { if (productsRes?.ok) allProducts = safeArray(await productsRes.json()); } catch (e) { console.error(e); }
      try { if (ordersRes?.ok) allOrders = safeArray(await ordersRes.json()); } catch (e) { console.error(e); }
      try { if (vendorsRes?.ok) allVendors = safeArray(await vendorsRes.json()); } catch (e) { console.error(e); }
      try { if (usersRes?.ok) allUsers = safeArray(await usersRes.json()); } catch (e) { console.error(e); }
      try {
        if (reviewsRes?.ok) {
          const rData = await reviewsRes.json();
          reviewStats = rData.data || rData.stats || { pending: 0, total: 0 };
        }
      } catch (e) { console.error(e); }

      // Products
      const approvedProducts = allProducts.filter(p =>
        (p.adminApproved === true || p.admin_approved === 1) &&
        (p.status === 'active' || p.is_active === 1)
      );
      const pendingProducts = allProducts.filter(p =>
        p.adminApproved !== true && p.admin_approved !== 1
      );
      const lowStockProducts = approvedProducts.filter(p => {
        const stock = Number(p.stock || 0);
        return stock > 0 && stock < 10;
      });

      // Orders
      const totalRevenue = allOrders.reduce((s, o) => s + getOrderTotal(o), 0);
      const totalOrders = allOrders.length;

      const today = new Date().toISOString().split('T')[0];
      const todayOrders = allOrders.filter(o => {
        const d = getOrderDate(o);
        if (!d) return false;
        return d.split('T')[0] === today || d.split(' ')[0] === today;
      });
      const todaySales = todayOrders.reduce((s, o) => s + getOrderTotal(o), 0);

      // Monthly growth
      const now = new Date();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const lastMonthOrders = allOrders.filter(o => {
        const d = parseDate(getOrderDate(o));
        return d >= lastMonthStart && d < thisMonthStart;
      });
      const thisMonthOrders = allOrders.filter(o => parseDate(getOrderDate(o)) >= thisMonthStart);

      const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + getOrderTotal(o), 0);
      const thisMonthRevenue = thisMonthOrders.reduce((s, o) => s + getOrderTotal(o), 0);
      const monthlyGrowth = lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
        : thisMonthRevenue > 0 ? 100 : 0;

      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Category sales
      const categoryMap = {};
      approvedProducts.forEach(p => {
        const cat = p.mainCategory || p.category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + (Number(p.price) || 0);
      });
      setCategorySales(Object.entries(categoryMap)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5));

      // Top products
      const productSalesMap = {};
      allOrders.forEach(order => {
        const items = order.items || order.products || [];
        if (!Array.isArray(items)) return;
        items.forEach(item => {
          const pid = item.product_id || item.productId || item.id || item._id;
          if (pid) {
            const prod = approvedProducts.find(p => (p._id || p.id) === pid);
            if (prod) {
              productSalesMap[pid] = productSalesMap[pid] || { ...prod, totalSold: 0 };
              productSalesMap[pid].totalSold += (item.quantity || 1);
            }
          }
        });
      });
      let topProductsList = Object.values(productSalesMap)
        .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
        .slice(0, 5);
      if (topProductsList.length === 0) {
        topProductsList = [...approvedProducts]
          .sort((a, b) => (b.stock || 0) - (a.stock || 0))
          .slice(0, 5)
          .map(p => ({ ...p, totalSold: 0 }));
      }
      setTopProducts(topProductsList);

      // Sales chart
      let salesChartData = [];
      if (selectedPeriod === 'weekly') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        salesChartData = days.map((day, idx) => {
          const dayOrders = allOrders.filter(o => parseDate(getOrderDate(o)).getDay() === idx);
          return { name: day, sales: dayOrders.reduce((s, o) => s + getOrderTotal(o), 0), orders: dayOrders.length };
        });
      } else if (selectedPeriod === 'monthly') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        salesChartData = months.map((month, idx) => {
          const mOrders = allOrders.filter(o => {
            const d = parseDate(getOrderDate(o));
            return d.getMonth() === idx && d.getFullYear() === now.getFullYear();
          });
          return { name: month, sales: mOrders.reduce((s, o) => s + getOrderTotal(o), 0), orders: mOrders.length };
        });
      } else {
        const years = ['2023', '2024', '2025', '2026'];
        salesChartData = years.map((year, idx) => {
          const yOrders = allOrders.filter(o => parseDate(getOrderDate(o)).getFullYear() === (2023 + idx));
          return { name: year, sales: yOrders.reduce((s, o) => s + getOrderTotal(o), 0), orders: yOrders.length };
        });
      }
      setSalesData(salesChartData);

      // Recent orders
      setRecentOrders(allOrders
        .slice()
        .sort((a, b) => parseDate(getOrderDate(b)) - parseDate(getOrderDate(a)))
        .slice(0, 5)
        .map(order => ({
          id: order.order_number || order.id || 'N/A',
          orderId: order.id,
          customer: order.user_id || order.customerEmail || 'Customer',
          amount: getOrderTotal(order),
          status: order.status || 'pending',
          date: getOrderDate(order)
        }))
      );

      // Pending vendors
      const pendingVendors = allVendors.filter(v =>
        v.status === 'pending' || v.vendorStatus === 'pending'
      ).length;

      setStats({
        totalRevenue,
        totalOrders,
        totalProducts: approvedProducts.length,
        totalVendors: allVendors.length,
        totalCustomers: allUsers.length,
        pendingVendors,
        pendingProducts: pendingProducts.length,
        pendingReviews: reviewStats.pending || 0,
        lowStockProducts: lowStockProducts.length,
        todaySales,
        todayOrders: todayOrders.length,
        monthlyGrowth: Number(monthlyGrowth),
        conversionRate: allUsers.length > 0 ? ((totalOrders / allUsers.length) * 100).toFixed(1) : '0.0',
        avgOrderValue: Math.round(avgOrderValue)
      });

      setLoading(false);
    } catch (error) {
      console.error('Dashboard error:', error);
      setLoading(false);
      toast.error('Failed to load dashboard');
    }
  }, [selectedPeriod, API_URL, navigate]);

  const loadUnreadNotifications = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadNotifications(data.data?.count ?? data.count ?? 0);
      }
    } catch (e) { console.error(e); }
  };

  const loadActiveOffer = async () => {
    try {
      const res = await fetch(`${API_URL}/api/offers/active-offer`);
      if (res.ok) {
        const data = await res.json();
        setActiveOffer(data.data ?? data);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/admin/login'); return; }
    loadDashboardData();
    loadActiveOffer();
    loadUnreadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  // ===== HELPERS =====
  const getStatusColor = (status) => ({
    delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    shipped: 'bg-blue-100 text-blue-700 border-blue-200',
    confirmed: 'bg-purple-100 text-purple-700 border-purple-200',
    processing: 'bg-amber-100 text-amber-700 border-amber-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  }[status?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200');

  const maxSales = Math.max(...salesData.map(d => d.sales), 1);
  const totalTrend = salesData.reduce((s, d) => s + d.sales, 0);

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30">
        <AdminSidebar />
        <div className="lg:ml-64 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-20 bg-white rounded-3xl"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-3xl"></div>)}
            </div>
            <div className="h-80 bg-white rounded-3xl"></div>
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-64 bg-white rounded-3xl"></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50/30">
      <AdminSidebar />

      <div className="lg:ml-64">
        {/* ============ HEADER ============ */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Welcome back — real-time store insights</p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/admin/notifications"
                  className="relative w-10 h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center transition shadow-sm"
                >
                  <span className="text-lg">🔔</span>
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-md">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </Link>

                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:border-pink-400 cursor-pointer shadow-sm"
                >
                  <option value="weekly">📅 Last 7 days</option>
                  <option value="monthly">📅 Last 30 days</option>
                  <option value="yearly">📅 This Year</option>
                </select>

                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  SA
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          
          {/* ============ ACTIVE OFFER BANNER ============ */}
          {activeOffer && (
            <div className="mb-6 bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 text-[200px] flex items-center justify-end pr-8 pointer-events-none">
                🔥
              </div>
              <div className="relative flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-90 mb-1">🔥 Live Offer</p>
                  <p className="font-bold text-lg">{activeOffer.description}</p>
                  <p className="text-xs opacity-90 mt-1">
                    Min Order ₹{activeOffer.minOrderValue} • {activeOffer.discountType === 'percentage' ? `${activeOffer.discountValue}% OFF` : `₹${activeOffer.discountValue} OFF`}
                  </p>
                </div>
                <Link
                  to="/admin/offers"
                  className="px-5 py-2.5 bg-white text-pink-600 rounded-xl text-sm font-bold hover:shadow-lg transition"
                >
                  Edit Offer →
                </Link>
              </div>
            </div>
          )}

          {/* ============ HERO KPI CARDS ============ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            
            {/* Today's Sales */}
            <div className="group relative bg-white rounded-3xl border border-slate-200/60 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform"></div>
              <div className="relative">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                    <span className="text-xl">💰</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    stats.monthlyGrowth >= 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {stats.monthlyGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.monthlyGrowth)}%
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today's Sales</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">₹{stats.todaySales.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">{stats.todayOrders} orders today</p>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="group relative bg-white rounded-3xl border border-slate-200/60 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform"></div>
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg mb-3">
                  <span className="text-xl">📊</span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">₹{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-[11px] text-emerald-600 mt-1 font-medium">from {stats.totalOrders} orders</p>
              </div>
            </div>

            {/* Total Orders */}
            <div className="group relative bg-white rounded-3xl border border-slate-200/60 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform"></div>
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg mb-3">
                  <span className="text-xl">📦</span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Orders</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalOrders}</p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Conversion {stats.conversionRate}%</p>
              </div>
            </div>

            {/* Total Customers */}
            <div className="group relative bg-white rounded-3xl border border-slate-200/60 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform"></div>
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg mb-3">
                  <span className="text-xl">👥</span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Customers</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalCustomers}</p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Active buyers</p>
              </div>
            </div>
          </div>

          {/* ============ MAIN GRID: Chart + Quick Actions ============ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* Sales Chart */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
              <div className="flex flex-wrap justify-between items-start mb-6 gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">📈 Sales Overview</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Total <span className="font-bold text-pink-600">₹{totalTrend.toLocaleString()}</span> in this period
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-br from-pink-400 to-rose-500"></span> Sales
                  </span>
                </div>
              </div>

              <div className="relative h-64">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] font-bold text-slate-400">
                  <span>₹{Math.round(maxSales / 1000)}k</span>
                  <span>₹{Math.round(maxSales / 2000)}k</span>
                  <span>₹0</span>
                </div>

                {/* Chart area */}
                <div className="ml-10 h-full flex items-end gap-2 pb-8 relative">
                  {/* Grid lines */}
                  <div className="absolute inset-x-0 top-0 h-px bg-slate-100"></div>
                  <div className="absolute inset-x-0 top-1/2 h-px bg-slate-100"></div>
                  <div className="absolute inset-x-0 bottom-8 h-px bg-slate-200"></div>

                  {salesData.map((item, idx) => {
                    const heightPercent = (item.sales / maxSales) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative">
                        {/* Bar */}
                        <div className="w-full h-full flex items-end">
                          <div
                            className="w-full rounded-t-xl bg-gradient-to-t from-pink-400 via-pink-500 to-rose-500 transition-all duration-500 hover:from-pink-500 hover:to-rose-600 shadow-sm group-hover:shadow-lg cursor-pointer relative"
                            style={{ height: `${Math.max(heightPercent, 2)}%`, minHeight: '8px' }}
                          >
                            {/* Tooltip */}
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap shadow-xl z-10">
                              ₹{item.sales.toLocaleString()}
                              <div className="text-[9px] opacity-70 font-normal mt-0.5">{item.orders} orders</div>
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                            </div>
                          </div>
                        </div>
                        {/* X-axis label */}
                        <span className="absolute -bottom-6 text-[10px] font-bold text-slate-500 group-hover:text-pink-600 transition">
                          {item.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">⚡ Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { to: '/admin/add-product', icon: '➕', label: 'Add Product', color: 'from-pink-500 to-rose-500' },
                  { to: '/admin/reviews', icon: '⭐', label: 'Reviews', color: 'from-amber-500 to-orange-500' },
                  { to: '/admin/orders', icon: '📦', label: 'Orders', color: 'from-blue-500 to-indigo-500' },
                  { to: '/admin/coupons', icon: '🎫', label: 'Coupons', color: 'from-purple-500 to-pink-500' },
                  { to: '/admin/vendors', icon: '🏪', label: 'Vendors', color: 'from-teal-500 to-emerald-500' },
                  { to: '/admin/reports', icon: '📊', label: 'Reports', color: 'from-slate-500 to-slate-700' },
                ].map((action, i) => (
                  <Link
                    key={i}
                    to={action.to}
                    className="group relative bg-white rounded-2xl p-4 border border-slate-200 hover:border-transparent hover:shadow-lg transition-all overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-100 transition`}></div>
                    <div className="relative flex flex-col items-center text-center">
                      <span className="text-2xl mb-2 group-hover:scale-110 transition">{action.icon}</span>
                      <p className="text-[11px] font-bold text-slate-700 group-hover:text-white transition">{action.label}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ============ SECONDARY STATS ============ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Link to="/admin/products" className="bg-white rounded-2xl border border-slate-200/60 p-4 hover:shadow-md hover:-translate-y-0.5 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-lg shadow-md">
                  ✨
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Products</p>
                  <p className="text-lg font-bold text-slate-900">{stats.totalProducts}</p>
                </div>
              </div>
              {stats.pendingProducts > 0 && (
                <p className="text-[10px] text-amber-600 mt-2 font-bold">⚠ {stats.pendingProducts} pending</p>
              )}
            </Link>

            <Link to="/admin/vendors" className="bg-white rounded-2xl border border-slate-200/60 p-4 hover:shadow-md hover:-translate-y-0.5 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-lg shadow-md">
                  🏪
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Vendors</p>
                  <p className="text-lg font-bold text-slate-900">{stats.totalVendors}</p>
                </div>
              </div>
              {stats.pendingVendors > 0 && (
                <p className="text-[10px] text-amber-600 mt-2 font-bold">⚠ {stats.pendingVendors} pending</p>
              )}
            </Link>

            <Link to="/admin/inventory" className="bg-white rounded-2xl border border-slate-200/60 p-4 hover:shadow-md hover:-translate-y-0.5 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg shadow-md">
                  ⚠️
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Low Stock</p>
                  <p className="text-lg font-bold text-orange-600">{stats.lowStockProducts}</p>
                </div>
              </div>
            </Link>

            <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-lg shadow-md">
                  📈
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Avg Order</p>
                  <p className="text-lg font-bold text-pink-600">₹{stats.avgOrderValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ============ 3-COLUMN: Recent Orders | Top Products | Alerts ============ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* Recent Orders */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-900">📋 Recent Orders</h3>
                <Link to="/admin/orders" className="text-xs font-bold text-pink-600 hover:text-pink-700">View All →</Link>
              </div>
              <div className="space-y-3">
                {recentOrders.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 text-sm">No orders yet</p>
                ) : (
                  recentOrders.map((order, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate(`/admin/orders/${order.orderId}`)}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono font-bold text-slate-700 truncate">{order.id}</p>
                        <p className="text-[10px] text-slate-400 truncate">{order.customer}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-pink-600">₹{order.amount.toLocaleString()}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-900">🏆 Top Products</h3>
                <Link to="/admin/products" className="text-xs font-bold text-pink-600 hover:text-pink-700">View All →</Link>
              </div>
              <div className="space-y-3">
                {topProducts.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 text-sm">No products yet</p>
                ) : (
                  topProducts.map((product, idx) => (
                    <div
                      key={product._id || product.id || idx}
                      onClick={() => navigate(`/admin/edit-product/${product._id || product.id}`)}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-pink-100 to-rose-100 flex-shrink-0 flex items-center justify-center">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">✨</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{product.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {product.totalSold > 0 ? `Sold ${product.totalSold}` : `Stock ${product.stock || 0}`}
                        </p>
                      </div>
                      <p className="text-xs font-bold text-pink-600 flex-shrink-0">₹{product.price}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">⚠️ Alerts & Tasks</h3>
              <div className="space-y-3">
                {stats.pendingReviews > 0 && (
                  <Link to="/admin/reviews" className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl hover:shadow-md transition">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-lg shadow-md">
                      ⭐
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">{stats.pendingReviews} Reviews Pending</p>
                      <p className="text-[10px] text-slate-500">Awaiting moderation</p>
                    </div>
                    <span className="text-slate-400">→</span>
                  </Link>
                )}

                {stats.pendingProducts > 0 && (
                  <Link to="/admin/products?tab=pending" className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl hover:shadow-md transition">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-lg shadow-md">
                      📦
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">{stats.pendingProducts} Products Pending</p>
                      <p className="text-[10px] text-slate-500">Awaiting approval</p>
                    </div>
                    <span className="text-slate-400">→</span>
                  </Link>
                )}

                {stats.pendingVendors > 0 && (
                  <Link to="/admin/vendors" className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl hover:shadow-md transition">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg shadow-md">
                      🏪
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">{stats.pendingVendors} Vendors Pending</p>
                      <p className="text-[10px] text-slate-500">Need approval</p>
                    </div>
                    <span className="text-slate-400">→</span>
                  </Link>
                )}

                {stats.lowStockProducts > 0 && (
                  <Link to="/admin/inventory" className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl hover:shadow-md transition">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-lg shadow-md">
                      ⚠️
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">{stats.lowStockProducts} Low Stock Items</p>
                      <p className="text-[10px] text-slate-500">Restock needed</p>
                    </div>
                    <span className="text-slate-400">→</span>
                  </Link>
                )}

                {stats.pendingReviews === 0 && stats.pendingProducts === 0 && stats.pendingVendors === 0 && stats.lowStockProducts === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="text-sm font-bold text-emerald-600">All caught up!</p>
                    <p className="text-[11px] text-slate-400 mt-1">No pending tasks</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============ CATEGORY SALES ============ */}
          {categorySales.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm mb-6">
              <h3 className="text-base font-bold text-slate-900 mb-5">📊 Sales by Category</h3>
              <div className="space-y-4">
                {categorySales.map((cat, idx) => {
                  const percent = (cat.sales / (categorySales[0]?.sales || 1)) * 100;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="capitalize text-slate-700">{cat.name}</span>
                        <span className="text-pink-600">₹{cat.sales.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-rose-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============ FOOTER ============ */}
          <div className="mt-8 text-center text-xs text-slate-400 border-t border-slate-200 pt-6">
            <p>© 2026 MyPinkShop Admin Panel — All Rights Reserved</p>
            <p className="mt-1">Dashboard v2.0 • Real-time Store Management</p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
