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

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

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

  // Fetch unread notifications count
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
          setUnreadNotifications(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [API_URL]);

  // Complete menu items with all pages
  const menuItems = [
    // Main
    { name: 'Dashboard', icon: '📊', path: '/admin/dashboard', badge: null },
    { name: 'Vendors', icon: '🏪', path: '/admin/vendors', badge: null },
    { name: 'Brand Applications', icon: '📝', path: '/admin/brand-applications', badge: null },
    
    // Products
    { name: 'Inventory', icon: '📦', path: '/admin/products', badge: null },
    { name: 'Add Product', icon: '➕', path: '/admin/add-product', badge: null },
    { name: 'Bulk Upload', icon: '📤', path: '/admin/bulk-upload', badge: null },
    { name: 'Categories', icon: '📁', path: '/admin/categories', badge: null },
    
    // Sales
    { name: 'Orders', icon: '🛒', path: '/admin/orders', badge: null },
    { name: 'Customers', icon: '👥', path: '/admin/customers', badge: null },
    { name: 'Payments', icon: '💳', path: '/admin/payments', badge: null },
    
    // Marketing
    { name: 'Offers', icon: '🏷️', path: '/admin/offers', badge: null },
    { name: 'Banners', icon: '🎨', path: '/admin/banners', badge: null },
    { name: 'Coupons', icon: '🎫', path: '/admin/coupons', badge: null },
    { name: 'Homepage', icon: '🏠', path: '/admin/homepage', badge: null },
    
    // Management
    { name: 'Notifications', icon: '🔔', path: '/admin/notifications', badge: unreadNotifications > 0 ? unreadNotifications : null },
    { name: 'Reviews', icon: '⭐', path: '/admin/reviews', badge: null },
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

      {/* Navigation */}
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
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-3 mt-auto">
        <div className="border-t border-gray-700 my-2"></div>
        
        {(!collapsed || isMobile) && (
          <div className="px-3 py-2 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md">
                SA
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Super Admin</p>
                <p className="text-[10px] text-gray-400">admin@mypinkshop.com</p>
              </div>
            </div>
          </div>
        )}
        
        {(collapsed && !isMobile) && (
          <div className="flex justify-center py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md">
              SA
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 ${
            collapsed && !isMobile ? 'justify-center' : ''
          }`}
        >
          <span className="text-xl">🚪</span>
          {(!collapsed || isMobile) && <span className="text-sm font-medium">Logout</span>}
        </button>
        
        {/* Version info */}
        {(!collapsed || isMobile) && (
          <p className="text-[10px] text-gray-500 text-center mt-3">v2.0.0</p>
        )}
      </div>
    </>
  );

  // Mobile view
  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-3 flex items-center justify-between shadow-lg md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h1 className="font-bold text-white text-lg">MyPinkShop</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification badge on mobile header */}
            {unreadNotifications > 0 && (
              <div className="relative">
                <span className="text-xl">🔔</span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
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

        {/* Mobile Drawer */}
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
    <aside className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 z-50 shadow-2xl ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      <SidebarContent />
    </aside>
  );
}

export default AdminSidebar;
