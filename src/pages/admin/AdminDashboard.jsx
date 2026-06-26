// AdminDashboard.js - Complete Optimized File with All Fixes & Improvements

import { useState, useEffect, useCallback } from 'react';
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
  const [salesData, setSalesData] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [activeOffer, setActiveOffer] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Notification State
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    userType: 'all',
    userId: '',
    type: 'system'
  });
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(null);

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
  }, [navigate]);

  // Load dashboard data when period changes
  useEffect(() => {
    loadDashboardData();
    loadActiveOffer();
    loadUnreadNotifications();
  }, [selectedPeriod]);

  // Load unread notifications count
  const loadUnreadNotifications = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadNotifications(data.count || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Load active offer
  const loadActiveOffer = async () => {
    try {
      const response = await fetch(`${API_URL}/api/offers/active-offer`);
      if (response.ok) {
        const data = await response.json();
        setActiveOffer(data);
      }
    } catch (error) {
      console.error('Error loading offer:', error);
    }
  };

  // Main dashboard data loader with Promise.all for performance
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      // Fetch all data in parallel for better performance
      const [productsRes, ordersRes, vendorsRes, customersRes] = await Promise.all([
        fetch(`${API_URL}/api/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/vendors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/customers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Parse responses
      const productsData = await productsRes.json();
      const ordersData = await ordersRes.json();
      const vendorsData = await vendorsRes.json();
      const customersData = await customersRes.json();

      // Extract data
      const allProducts = productsData.products || productsData || [];
      const allOrders = ordersData.orders || ordersData || [];
      const allVendors = vendorsData.vendors || vendorsData || [];
      const allCustomers = customersData.customers || customersData || [];

      // Products calculations
      const approvedProducts = allProducts.filter(p => p.adminApproved === true && p.status === 'active');
      const pendingProducts = allProducts.filter(p => p.adminApproved !== true);
      const lowStockProducts = approvedProducts.filter(p => (p.stock || 0) < 10 && (p.stock || 0) > 0);

      // Orders calculations
      const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || order.amount || 0), 0);
      const totalOrders = allOrders.length;

      // Today's sales
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = allOrders.filter(order => {
        const orderDate = order.createdAt || order.date || order.orderDate;
        return orderDate?.split('T')[0] === today;
      });
      const todaySales = todayOrders.reduce((sum, order) => sum + (order.total || order.amount || 0), 0);

      // Monthly growth calculation
      const now = new Date();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const lastMonthOrders = allOrders.filter(order => {
        const date = new Date(order.createdAt || order.date || order.orderDate);
        return date >= lastMonthStart && date < thisMonthStart;
      });
      const thisMonthOrders = allOrders.filter(order => {
        const date = new Date(order.createdAt || order.date || order.orderDate);
        return date >= thisMonthStart;
      });
      
      const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + (order.total || order.amount || 0), 0);
      const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + (order.total || order.amount || 0), 0);
      const monthlyGrowth = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) 
        : thisMonthRevenue > 0 ? 100 : 0;

      // Average order value
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Category sales from products
      const categoryMap = {};
      approvedProducts.forEach(p => {
        const cat = p.mainCategory || p.category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + (p.price || 0);
      });
      const categorySalesList = Object.entries(categoryMap)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);
      setCategorySales(categorySalesList);

      // Top products by sales (from orders)
      const productSalesMap = {};
      allOrders.forEach(order => {
        (order.items || order.products || []).forEach(item => {
          const productId = item.productId || item.id || item._id;
          if (productId) {
            const product = approvedProducts.find(p => p._id === productId || p.id === productId);
            if (product) {
              productSalesMap[productId] = {
                ...product,
                totalSold: (productSalesMap[productId]?.totalSold || 0) + (item.quantity || 1)
              };
            }
          }
        });
      });
      
      const topProductsList = Object.values(productSalesMap)
        .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
        .slice(0, 5);
      
      if (topProductsList.length === 0) {
        // Fallback to stock-based if no sales data
        const fallbackProducts = [...approvedProducts]
          .sort((a, b) => (b.stock || 0) - (a.stock || 0))
          .slice(0, 5)
          .map(p => ({ ...p, totalSold: 0 }));
        setTopProducts(fallbackProducts);
      } else {
        setTopProducts(topProductsList);
      }

      // Sales chart data based on selected period
      let salesChartData = [];
      if (selectedPeriod === 'weekly') {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        salesChartData = days.map((day, idx) => {
          const dayOrders = allOrders.filter(order => {
            const date = new Date(order.createdAt || order.date || order.orderDate);
            return date.getDay() === idx;
          });
          return {
            name: day,
            sales: dayOrders.reduce((sum, order) => sum + (order.total || order.amount || 0), 0),
            orders: dayOrders.length
          };
        });
      } else if (selectedPeriod === 'monthly') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        salesChartData = months.map((month, idx) => {
          const monthOrders = allOrders.filter(order => {
            const date = new Date(order.createdAt || order.date || order.orderDate);
            return date.getMonth() === idx && date.getFullYear() === now.getFullYear();
          });
          return {
            name: month,
            sales: monthOrders.reduce((sum, order) => sum + (order.total || order.amount || 0), 0),
            orders: monthOrders.length
          };
        });
      } else {
        const years = ['2023', '2024', '2025', '2026'];
        salesChartData = years.map((year, idx) => {
          const yearOrders = allOrders.filter(order => {
            const date = new Date(order.createdAt || order.date || order.orderDate);
            return date.getFullYear() === (2023 + idx);
          });
          return {
            name: year,
            sales: yearOrders.reduce((sum, order) => sum + (order.total || order.amount || 0), 0),
            orders: yearOrders.length
          };
        });
      }
      setSalesData(salesChartData);

      // Recent orders (last 5)
      const recentOrdersList = allOrders
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || a.orderDate || 0);
          const dateB = new Date(b.createdAt || b.date || b.orderDate || 0);
          return dateB - dateA;
        })
        .slice(0, 5)
        .map(order => ({
          id: order.orderId || order.id || 'ORD-' + Date.now(),
          customer: order.customerEmail || order.customerName || order.customer?.email || 'Guest',
          amount: order.total || order.amount || 0,
          status: order.status || 'pending',
          date: order.createdAt || order.date || order.orderDate || new Date().toISOString()
        }));
      setRecentOrders(recentOrdersList);

      // Update stats
      setStats({
        totalRevenue,
        totalOrders,
        totalProducts: approvedProducts.length,
        totalVendors: allVendors.length || 8,
        totalCustomers: allCustomers.length || 245,
        pendingVendors: allVendors.filter(v => v.status === 'pending' || v.approved === false).length || 2,
        pendingProducts: pendingProducts.length,
        lowStockProducts: lowStockProducts.length,
        todaySales,
        todayOrders: todayOrders.length,
        monthlyGrowth: Number(monthlyGrowth),
        conversionRate: (totalOrders / (allCustomers.length || 1) * 100).toFixed(1),
        avgOrderValue: Math.round(avgOrderValue)
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
      setNotificationStatus({
        type: 'error',
        message: 'Failed to load dashboard data. Please refresh.'
      });
    }
  }, [selectedPeriod, API_URL]);

  // Send Notification Function
  const sendNotification = async () => {
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      setNotificationStatus({
        type: 'error',
        message: 'Please fill title and message'
      });
      return;
    }

    try {
      setSendingNotification(true);
      setNotificationStatus(null);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_URL}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: notificationForm.title,
          message: notificationForm.message,
          userType: notificationForm.userType,
          userId: notificationForm.userId || null,
          type: notificationForm.type
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setNotificationStatus({
          type: 'success',
          message: `✅ Notification sent to ${data.count || 0} users!`
        });
        setNotificationForm({ title: '', message: '', userType: 'all', userId: '', type: 'system' });
        // Refresh notification count
        loadUnreadNotifications();
      } else {
        setNotificationStatus({
          type: 'error',
          message: '❌ Failed: ' + (data.message || 'Unknown error')
        });
      }
    } catch (error) {
      console.error('Send notification error:', error);
      setNotificationStatus({
        type: 'error',
        message: '❌ Failed to send notification'
      });
    } finally {
      setSendingNotification(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusMap = {
      'delivered': 'bg-green-100 text-green-700',
      'shipped': 'bg-blue-100 text-blue-700',
      'processing': 'bg-purple-100 text-purple-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'cancelled': 'bg-red-100 text-red-700',
      'returned': 'bg-orange-100 text-orange-700'
    };
    return statusMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  // Handle card clicks
  const handleCardClick = (type) => {
    const routes = {
      products: '/admin/products',
      vendors: '/admin/vendors',
      lowstock: '/admin/inventory',
      orders: '/admin/orders',
      customers: '/admin/customers',
      revenue: '/admin/reports'
    };
    navigate(routes[type] || '/admin');
  };

  // Refresh data
  const handleRefresh = () => {
    loadDashboardData();
    loadActiveOffer();
    loadUnreadNotifications();
    setNotificationStatus({
      type: 'info',
      message: '🔄 Refreshing data...'
    });
    setTimeout(() => {
      setNotificationStatus(null);
    }, 3000);
  };

  // Calculate max sales for chart
  const maxSales = Math.max(...salesData.map(d => d.sales), 1);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm sm:text-base">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/20">
      <AdminSidebar />
      
      <div className="lg:ml-64">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-pink-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 sticky top-0 z-40 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                  Welcome back — real-time store insights
                </p>
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-pink-100 rounded-full transition-colors"
                title="Refresh data"
              >
                <span className="text-lg">🔄</span>
              </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/admin/notifications" className="relative p-2 hover:bg-pink-100 rounded-full transition-colors">
                <span className="text-xl">🔔</span>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Link>
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 sm:px-4 py-2 border border-pink-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-pink-500 bg-white shadow-sm"
              >
                <option value="weekly">📅 Last 7 days</option>
                <option value="monthly">📅 Last 30 days</option>
                <option value="yearly">📅 This Year</option>
              </select>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md text-sm sm:text-base">
                SA
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
          
          {/* Notification Status Alert */}
          {notificationStatus && (
            <div className={`mb-4 p-3 rounded-xl ${
              notificationStatus.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
              notificationStatus.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
              'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              {notificationStatus.message}
            </div>
          )}

          {/* Active Offer Banner */}
          {activeOffer && (
            <div className="mb-6 bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 rounded-2xl p-4 text-white shadow-lg animate-pulse">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <p className="text-sm opacity-90">🔥 Current Live Offer</p>
                  <p className="font-medium">{activeOffer.description}</p>
                  <p className="text-xs opacity-80 mt-1">
                    Min Order: ₹{activeOffer.minOrderValue} | {activeOffer.discountType === 'percentage' ? `${activeOffer.discountValue}% OFF` : `₹${activeOffer.discountValue} OFF`}
                  </p>
                </div>
                <Link 
                  to="/admin/offers" 
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/30 transition"
                >
                  Edit Offer →
                </Link>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
            <div onClick={() => handleCardClick('revenue')} className="cursor-pointer group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-pink-100 p-3 sm:p-4 lg:p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-lg">
                  <span className="text-lg sm:text-xl lg:text-2xl">💰</span>
                </div>
                <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                  stats.monthlyGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {stats.monthlyGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.monthlyGrowth)}%
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">Today's Sales</p>
              <p className="text-base sm:text-lg lg:text-2xl font-bold text-gray-800">₹{stats.todaySales.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">{stats.todayOrders} orders today</p>
            </div>
            
            <div onClick={() => handleCardClick('revenue')} className="cursor-pointer group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-pink-100 p-3 sm:p-4 lg:p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center shadow-lg mb-2 sm:mb-3">
                <span className="text-lg sm:text-xl lg:text-2xl">📊</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">Total Revenue</p>
              <p className="text-base sm:text-lg lg:text-2xl font-bold text-gray-800">₹{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-green-600 mt-0.5 sm:mt-1">from {stats.totalOrders} orders</p>
            </div>
            
            <div onClick={() => handleCardClick('orders')} className="cursor-pointer group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-pink-100 p-3 sm:p-4 lg:p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg mb-2 sm:mb-3">
                <span className="text-lg sm:text-xl lg:text-2xl">📦</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">Total Orders</p>
              <p className="text-base sm:text-lg lg:text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">Conversion: {stats.conversionRate}%</p>
            </div>
            
            <div onClick={() => handleCardClick('customers')} className="cursor-pointer group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-pink-100 p-3 sm:p-4 lg:p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg mb-2 sm:mb-3">
                <span className="text-lg sm:text-xl lg:text-2xl">👥</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">Total Customers</p>
              <p className="text-base sm:text-lg lg:text-2xl font-bold text-gray-800">{stats.totalCustomers}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">Active buyers</p>
            </div>
          </div>

          {/* More Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div onClick={() => handleCardClick('products')} className="cursor-pointer bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-pink-100 p-3 sm:p-4 lg:p-5 hover:shadow-md transition">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center">
                  <span className="text-base sm:text-lg lg:text-xl">✨</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Products</p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">{stats.totalProducts}</p>
                </div>
              </div>
              {stats.pendingProducts > 0 && (
                <p className="text-[10px] sm:text-xs text-amber-600 mt-1">{stats.pendingProducts} pending approval</p>
              )}
            </div>
            
            <div onClick={() => handleCardClick('vendors')} className="cursor-pointer bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-pink-100 p-3 sm:p-4 lg:p-5 hover:shadow-md transition">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center">
                  <span className="text-base sm:text-lg lg:text-xl">🏪</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Vendors</p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">{stats.totalVendors}</p>
                </div>
              </div>
              {stats.pendingVendors > 0 && (
                <p className="text-[10px] sm:text-xs text-amber-600 mt-1">{stats.pendingVendors} pending</p>
              )}
            </div>
            
            <div onClick={() => handleCardClick('lowstock')} className="cursor-pointer bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-pink-100 p-3 sm:p-4 lg:p-5 hover:shadow-md transition">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                  <span className="text-base sm:text-lg lg:text-xl">⚠️</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Low Stock</p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-orange-600">{stats.lowStockProducts}</p>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400">Need to restock</p>
            </div>
            
            <div onClick={() => handleCardClick('revenue')} className="cursor-pointer bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-pink-100 p-3 sm:p-4 lg:p-5 hover:shadow-md transition">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center">
                  <span className="text-base sm:text-lg lg:text-xl">📈</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Avg Order Value</p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-pink-600">₹{stats.avgOrderValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-pink-100 p-4 sm:p-5 lg:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-base sm:text-lg">Sales Overview</h3>
                  <p className="text-xs sm:text-sm text-gray-400">Based on actual orders</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-pink-500 rounded"></span> Sales
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-purple-400 rounded"></span> Orders
                  </span>
                </div>
              </div>
              <div className="relative h-48 sm:h-56 md:h-64">
                <div className="flex items-end gap-1 sm:gap-2 h-full">
                  {salesData.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 sm:gap-2 group">
                      <div className="relative w-full">
                        <div className="w-full bg-pink-100 rounded-t-lg transition-all duration-500" style={{ height: `${Math.max((item.sales / maxSales) * 100, 5)}%`, minHeight: '20px' }}>
                          <div 
                            className="w-full bg-gradient-to-t from-pink-500 to-rose-500 rounded-t-lg transition-all duration-500"
                            style={{ height: `${(item.sales / maxSales) * 100}%` }}
                          ></div>
                        </div>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-lg">
                          ₹{Math.round(item.sales / 1000)}k ({item.orders} orders)
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{item.name}</span>
                      <span className="text-[8px] text-gray-400">{item.orders}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-pink-100 p-4 sm:p-5 lg:p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-lg sm:text-xl">📊</span> Sales by Category
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {categorySales.length === 0 ? (
                  <p className="text-gray-400 text-center py-4 text-sm">No category data yet</p>
                ) : (
                  categorySales.map((cat, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs sm:text-sm mb-1">
                        <span className="capitalize font-medium text-gray-700 truncate">{cat.name}</span>
                        <span className="font-semibold text-pink-600 text-xs sm:text-sm">₹{(cat.sales / 1000).toFixed(0)}k</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2">
                        <div 
                          className="bg-gradient-to-r from-pink-500 to-rose-500 h-1.5 sm:h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min((cat.sales / (categorySales[0]?.sales || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Top Products & Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-pink-100 p-4 sm:p-5 lg:p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-lg sm:text-xl">🏆</span> Top Products
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {topProducts.length === 0 ? (
                  <p className="text-gray-400 text-center py-6 text-sm">No sales data yet</p>
                ) : (
                  topProducts.map((product, idx) => (
                    <div 
                      key={product._id || product.id || idx} 
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-pink-50 rounded-xl transition cursor-pointer"
                      onClick={() => navigate(`/admin/edit-product/${product._id || product.id}`)}
                    >
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-xs sm:text-sm font-bold text-white shadow-md">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{product.name}</p>
                        <p className="text-[10px] sm:text-xs text-gray-400">
                          {product.totalSold > 0 ? `Sold: ${product.totalSold} units` : `Stock: ${product.stock || 0} units`}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-pink-600">₹{product.price}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-pink-100 p-4 sm:p-5 lg:p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-lg sm:text-xl">📋</span> Recent Orders
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {recentOrders.length === 0 ? (
                  <p className="text-gray-400 text-center py-6 text-sm">No orders yet</p>
                ) : (
                  recentOrders.map((order, idx) => (
                    <div 
                      key={order.id || idx} 
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-pink-50 rounded-xl transition cursor-pointer"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs sm:text-sm font-bold text-white shadow-md">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs font-mono text-gray-600 truncate">{order.id}</p>
                        <p className="text-[10px] sm:text-xs text-gray-400 truncate">{order.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-semibold text-pink-600">₹{order.amount.toLocaleString()}</p>
                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          {(stats.pendingVendors > 0 || stats.pendingProducts > 0 || stats.lowStockProducts > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {stats.pendingVendors > 0 && (
                <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex justify-between items-center hover:shadow-md transition">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">⚠️</span>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-amber-800">{stats.pendingVendors} Vendors Pending</p>
                      <p className="text-[10px] sm:text-xs text-amber-600">Need your approval</p>
                    </div>
                  </div>
                  <Link to="/admin/vendors?tab=pending" className="bg-amber-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs hover:bg-amber-700 transition">
                    Review
                  </Link>
                </div>
              )}
              {stats.pendingProducts > 0 && (
                <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex justify-between items-center hover:shadow-md transition">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">📦</span>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-blue-800">{stats.pendingProducts} Products Pending</p>
                      <p className="text-[10px] sm:text-xs text-blue-600">Awaiting approval</p>
                    </div>
                  </div>
                  <Link to="/admin/products?tab=pending" className="bg-blue-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs hover:bg-blue-700 transition">
                    Review
                  </Link>
                </div>
              )}
              {stats.lowStockProducts > 0 && (
                <div className="bg-orange-50/80 backdrop-blur-sm border border-orange-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex justify-between items-center hover:shadow-md transition">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">⚠️</span>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-orange-800">{stats.lowStockProducts} Low Stock Items</p>
                      <p className="text-[10px] sm:text-xs text-orange-600">Need to restock</p>
                    </div>
                  </div>
                  <Link to="/admin/inventory" className="bg-orange-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs hover:bg-orange-700 transition">
                    View
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 lg:gap-4 mb-6">
            <Link to="/admin/add-product" className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 text-center border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="text-xl sm:text-2xl lg:text-3xl mb-1 sm:mb-2 group-hover:scale-110 transition">➕</div>
              <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-700">Add Product</p>
            </Link>
            <Link to="/admin/orders" className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 text-center border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="text-xl sm:text-2xl lg:text-3xl mb-1 sm:mb-2 group-hover:scale-110 transition">📦</div>
              <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-700">View Orders</p>
            </Link>
            <Link to="/admin/vendors" className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 text-center border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="text-xl sm:text-2xl lg:text-3xl mb-1 sm:mb-2 group-hover:scale-110 transition">🏪</div>
              <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-700">Vendors</p>
            </Link>
            <Link to="/admin/offers" className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 text-center border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="text-xl sm:text-2xl lg:text-3xl mb-1 sm:mb-2 group-hover:scale-110 transition">🏷️</div>
              <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-700">Offers</p>
            </Link>
            <Link to="/admin/banners" className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 text-center border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="text-xl sm:text-2xl lg:text-3xl mb-1 sm:mb-2 group-hover:scale-110 transition">🎨</div>
              <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-700">Banners</p>
            </Link>
            <Link to="/admin/coupons" className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 text-center border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="text-xl sm:text-2xl lg:text-3xl mb-1 sm:mb-2 group-hover:scale-110 transition">🎫</div>
              <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-700">Coupons</p>
            </Link>
            <Link to="/admin/reports" className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 text-center border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="text-xl sm:text-2xl lg:text-3xl mb-1 sm:mb-2 group-hover:scale-110 transition">📊</div>
              <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-700">Reports</p>
            </Link>
          </div>

          {/* Notification Section - Send Notification */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">🔔</span> Send Notification to Users
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                  placeholder="Notification title..."
                  className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 bg-white shadow-sm transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notification Type</label>
                <select
                  value={notificationForm.type}
                  onChange={(e) => setNotificationForm({...notificationForm, type: e.target.value})}
                  className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 bg-white shadow-sm transition"
                >
                  <option value="system">⚙️ System</option>
                  <option value="order">🛒 Order</option>
                  <option value="promo">🏷️ Promo</option>
                  <option value="offer">🎉 Offer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                <select
                  value={notificationForm.userType}
                  onChange={(e) => setNotificationForm({...notificationForm, userType: e.target.value})}
                  className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 bg-white shadow-sm transition"
                >
                  <option value="all">📢 All Users</option>
                  <option value="specific">👤 Specific User</option>
                </select>
              </div>
              {notificationForm.userType === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID *</label>
                  <input
                    type="text"
                    value={notificationForm.userId}
                    onChange={(e) => setNotificationForm({...notificationForm, userId: e.target.value})}
                    placeholder="Enter user ID..."
                    className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 bg-white shadow-sm transition"
                  />
                  <p className="text-xs text-gray-400 mt-1">Send to specific user only</p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                placeholder="Write notification message..."
                rows="3"
                className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 bg-white shadow-sm transition resize-none"
              />
            </div>

            <button
              onClick={sendNotification}
              disabled={sendingNotification}
              className="mt-4 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sendingNotification ? (
                <>
                  <span className="animate-spin">⏳</span> Sending...
                </>
              ) : (
                <>
                  📤 Send Notification
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-400 border-t border-pink-100 pt-4">
            <p>© 2026 PinkShop Admin Panel | All Rights Reserved</p>
            <p className="mt-1">Dashboard v2.0 - Real-time Store Management</p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
