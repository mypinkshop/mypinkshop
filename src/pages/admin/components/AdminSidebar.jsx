// AdminSidebar.js - Complete with All Pages & Notification Badge

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  // Check screen size
  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // ✅ Unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;
        
        const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUnreadNotifications(data.data?.count ?? data.count ?? 0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [API_URL]);

  // ✅ Pending orders count
  useEffect(() => {
    const fetchPendingOrderCount = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;
        
        const response = await fetch(`${API_URL}/api/orders/all?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const responseData = await response.json();
          const allOrders = Array.isArray(responseData) ? responseData : (responseData.data || []);
          setPendingOrderCount(allOrders.filter(order => order.status?.toLowerCase() === 'pending').length);
        }
      } catch (error) {
        console.error('Error fetching pending orders:', error);
      }
    };

    fetchPendingOrderCount();
    const interval = setInterval(fetchPendingOrderCount, 30000);
    return () => clearInterval(interval);
  }, [API_URL]);

  // ✅ Pending reviews count
  useEffect(() => {
    const fetchPendingReviewCount = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const response = await fetch(`${API_URL}/api/reviews/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const stats = data.data || data.stats || {};
          setPendingReviewCount(stats.pending || 0);
        }
      } catch (error) {
        console.error('Error fetching pending reviews:', error);
      }
    };

    fetchPendingReviewCount();
    const interval = setInterval(fetchPendingReviewCount, 30000);
    return () => clearInterval(interval);
  }, [API_URL]);

  // Complete menu items
  const menuItems = [
    { name: 'Dashboard', icon: '📊', path: '/admin/dashboard', badge: null },
    { name: 'Vendors', icon: '🏪', path: '/admin/vendors', badge: null },
    { name: 'Brand Applications', icon: '📝', path: '/admin/brand-applications', badge: null },
    { name: 'Inventory', icon: '📦', path: '/admin/products', badge: null },
    { name: 'Add Product', icon: '➕', path: '/admin/add-product', badge: null },
    { name: 'Bulk Upload', icon: '📤', path: '/admin/bulk-upload', badge: null },
    { name: 'Categories', icon: '📁', path: '/admin/categories', badge: null },
    { name: 'Orders', icon: '🛒', path: '/admin/orders', badge: pendingOrderCount > 0 ? pendingOrderCount : null },
    { name: 'Customers', icon: '👥', path: '/admin/customers', badge: null },
    { name: 'Payments', icon: '💳', path: '/admin/payments', badge: null },
    { name: 'Offers', icon: '🏷️', path: '/admin/offers', badge: null },
    { name: 'Banners', icon: '🎨', path: '/admin/banners', badge: null },
    { name: 'Coupons', icon: '🎫', path: '/admin/coupons', badge: null },
    { name: 'Homepage', icon: '🏠', path: '/admin/homepage', badge: null },
    { name: 'Advertising', icon: '📢', path: '/admin/advertising', badge: null },
    { name: 'Ad Analytics', icon: '📊', path: '/admin/ad-analytics', badge: null },
    { name: 'Notifications', icon: '🔔', path: '/admin/notifications', badge: unreadNotifications > 0 ? unreadNotifications : null },
    { name: 'Reviews', icon: '⭐', path: '/admin/reviews', badge: pendingReviewCount > 0 ? pendingReviewCount : null },
    { name: 'Reports', icon: '📈', path: '/admin/reports', badge: null },
    { name: 'Settings', icon: '⚙️', path: '/admin/settings', badge: null },
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminAuthenticated');
      navigate('/admin/login');
    }
  };

  // Sidebar content
  const SidebarContent = () => (
    <>
      {/* ═══════════ TOP: LOGO + PROFILE + LOGOUT ═══════════ */}
      
      {/* Logo */}
      <div className={`p-5 border-b border-gray-700 flex ${collapsed && !isMobile ? 'justify-center' : 'justify-between'} items-center`}>
        {(!collapsed || isMobile) && (
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">MyPinkShop</h1>
              <p className="text-[9px] text-gray-400">Super Admin</p>
            </div>
          </Link>
        )}
        {(collapsed && !isMobile) && (
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">M</span>
          </div>
        )}
        {!isMobile && (
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="text-gray-400 hover:text-white transition"
          >
            {collapsed ? '→' : '←'}
          </button>
        )}
      </div>

      {/* ✅ Profile + Logout — UPAR */}
      {(!collapsed || isMobile) ? (
        <div className="px-3 py-3 border-b border-gray-700">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-gray-800/50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md shrink-0">
              SA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Super Admin</p>
              <p className="text-[10px] text-gray-400 truncate">admin@mypinkshop.com</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-200 shrink-0"
              title="Logout"
            >
              <span className="text-lg">🚪</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-3 border-b border-gray-700 gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md">
            SA
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-200"
            title="Logout"
          >
            <span className="text-lg">🚪</span>
          </button>
        </div>
      )}

      {/* ═══════════ NAVIGATION ═══════════ */}
      <nav className="mt-4 px-3 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                location.pathname === item.path
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="text-xl group-hover:scale-110 transition">{item.icon}</span>
              {(!collapsed || isMobile) && (
                <>
                  <span className="text-sm font-medium flex-1">{item.name}</span>
                  {item.badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center font-bold ${
                      item.name === 'Orders' ? 'bg-orange-500 text-white animate-pulse' :
                      item.name === 'Reviews' ? 'bg-purple-500 text-white animate-pulse' :
                      'bg-red-500 text-white'
                    }`}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* ═══════════ BOTTOM: VERSION ONLY ═══════════ */}
      <div className="p-3 mt-auto">
        {(!collapsed || isMobile) && (
          <p className="text-[10px] text-gray-500 text-center">v2.0.0</p>
        )}
      </div>
    </>
  );

  // Mobile view
  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-3 flex items-center justify-between shadow-lg md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h1 className="font-bold text-white text-lg">MyPinkShop</h1>
          </div>
          <div className="flex items-center gap-2">
            {(unreadNotifications > 0 || pendingReviewCount > 0) && (
              <div className="relative">
                <span className="text-xl">🔔</span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {(unreadNotifications + pendingReviewCount) > 9 ? '9+' : (unreadNotifications + pendingReviewCount)}
                </span>
              </div>
            )}
            <button 
              onClick={() => setMobileMenuOpen(true)} 
              className="text-white p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-gray-900 to-gray-800 text-white z-50 shadow-2xl flex flex-col animate-slide-in md:hidden">
              <div className="flex justify-end p-3">
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="text-gray-400 hover:text-white p-2 text-xl"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent />
              </div>
            </aside>
          </>
        )}

        <div className="h-14 md:hidden"></div>
      </>
    );
  }

  // Desktop view
  return (
    <aside className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 z-50 shadow-2xl flex flex-col ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      <SidebarContent />
    </aside>
  );
}

export default AdminSidebar;
