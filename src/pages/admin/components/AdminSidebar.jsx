import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size for mobile
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

  const menuItems = [
    { name: 'Dashboard', icon: '📊', path: '/admin/dashboard', badge: null },
    { name: 'Vendors', icon: '🏪', path: '/admin/vendors', badge: null },
    { name: 'Inventory', icon: '📦', path: '/admin/products', badge: null },
    { name: 'Add Product', icon: '➕', path: '/admin/add-product', badge: null },
    { name: 'Categories', icon: '📁', path: '/admin/categories', badge: null },
    { name: 'Orders', icon: '🛒', path: '/admin/orders', badge: null },
    { name: 'Customers', icon: '👥', path: '/admin/customers', badge: null },
    { name: 'Offers & Promotions', icon: '🏷️', path: '/admin/offers', badge: null },  // 🔥 YEH LINE ADD KARI
    { name: 'Banners', icon: '🎨', path: '/admin/banners', badge: null },
    { name: 'Coupons', icon: '🎫', path: '/admin/coupons', badge: null },
    { name: 'Advertising', icon: '📢', path: '/admin/advertising', badge: null },
    { name: 'Reports', icon: '📈', path: '/admin/reports', badge: null },
    { name: 'Reviews', icon: '⭐', path: '/admin/reviews', badge: null },
    { name: 'Settings', icon: '⚙️', path: '/admin/settings', badge: null },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminAuthenticated');
    navigate('/admin/login');
  };

  // Sidebar content component (reused for both mobile and desktop)
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
      <nav className="mt-6 px-3 flex-1 overflow-y-auto">
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
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {item.badge}
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
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 ${collapsed && !isMobile ? 'justify-center' : ''}`}
        >
          <span className="text-xl">🚪</span>
          {(!collapsed || isMobile) && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </>
  );

  // Mobile: Drawer sidebar with hamburger menu
  if (isMobile) {
    return (
      <>
        {/* Mobile Header with Hamburger */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-3 flex items-center justify-between shadow-lg md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h1 className="font-bold text-white text-lg">MyPinkShop</h1>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            className="text-white p-2 hover:bg-gray-700 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Drawer Sidebar */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <aside className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-gray-900 to-gray-800 text-white z-50 shadow-2xl flex flex-col animate-slide-in md:hidden">
              <div className="flex justify-end p-3">
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="text-gray-400 hover:text-white p-2"
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

        {/* Padding for mobile header */}
        <div className="h-14 md:hidden"></div>
      </>
    );
  }

  // Desktop: Fixed sidebar with collapse option
  return (
    <aside className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 z-50 shadow-2xl ${collapsed ? 'w-20' : 'w-64'}`}>
      <SidebarContent />
    </aside>
  );
}

export default AdminSidebar;
