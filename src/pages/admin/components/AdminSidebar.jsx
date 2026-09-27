// AdminSidebar.jsx - Full Redesigned with Pink Theme
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Badges
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  /* ------------------------------------------------------------------ */
  /* Screen size                                                        */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  /* ------------------------------------------------------------------ */
  /* Badge counts                                                       */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const fetchBadges = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Notifications
      try {
        const r = await fetch(`${API_URL}/api/notifications/unread-count`, { headers });
        if (r.ok) {
          const d = await r.json();
          setUnreadNotifications(d.data?.count ?? d.count ?? 0);
        }
      } catch {}

      // Pending orders
      try {
        const r = await fetch(`${API_URL}/api/orders/all?limit=100`, { headers });
        if (r.ok) {
          const d = await r.json();
          const all = Array.isArray(d) ? d : d.data || [];
          setPendingOrderCount(
            all.filter((o) => o.status?.toLowerCase() === 'pending').length
          );
        }
      } catch {}

      // Pending reviews
      try {
        const r = await fetch(`${API_URL}/api/reviews/admin/stats`, { headers });
        if (r.ok) {
          const d = await r.json();
          const s = d.data || d.stats || {};
          setPendingReviewCount(s.pending || 0);
        }
      } catch {}
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, [API_URL]);

  /* ------------------------------------------------------------------ */
  /* Menu items — grouped for better UX                                 */
  /* ------------------------------------------------------------------ */
  const menuGroups = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', icon: '📊', path: '/admin/dashboard' },
      ],
    },
    {
      title: 'Catalogue',
      items: [
        { name: 'Brands', icon: '🏷️', path: '/admin/brands' },
        { name: 'Categories', icon: '📁', path: '/admin/categories' },
        { name: 'Inventory', icon: '📦', path: '/admin/products' },
        { name: 'Add Product', icon: '➕', path: '/admin/add-product' },
        { name: 'Bulk Upload', icon: '📤', path: '/admin/bulk-upload' },
      ],
    },
    {
      title: 'Sales',
      items: [
        {
          name: 'Orders',
          icon: '🛒',
          path: '/admin/orders',
          badge: pendingOrderCount > 0 ? pendingOrderCount : null,
          badgeColor: 'orange',
        },
        { name: 'Customers', icon: '👥', path: '/admin/customers' },
        { name: 'Payments', icon: '💳', path: '/admin/payments' },
      ],
    },
    {
      title: 'Marketing',
      items: [
        { name: 'Offers', icon: '🎁', path: '/admin/offers' },
        { name: 'Banners', icon: '🎨', path: '/admin/banners' },
        { name: 'Coupons', icon: '🎫', path: '/admin/coupons' },
        { name: 'Homepage', icon: '🏠', path: '/admin/homepage' },
        { name: 'Advertising', icon: '📢', path: '/admin/advertising' },
        { name: 'Ad Analytics', icon: '📈', path: '/admin/ad-analytics' },
      ],
    },
    {
      title: 'Engagement',
      items: [
        {
          name: 'Notifications',
          icon: '🔔',
          path: '/admin/notifications',
          badge: unreadNotifications > 0 ? unreadNotifications : null,
          badgeColor: 'red',
        },
        {
          name: 'Reviews',
          icon: '⭐',
          path: '/admin/reviews',
          badge: pendingReviewCount > 0 ? pendingReviewCount : null,
          badgeColor: 'purple',
        },
      ],
    },
    {
      title: 'Vendors',
      items: [
        { name: 'Vendors', icon: '🏪', path: '/admin/vendors' },
        { name: 'Brand Applications', icon: '📝', path: '/admin/brand-applications' },
      ],
    },
    {
      title: 'System',
      items: [
        { name: 'Reports', icon: '📊', path: '/admin/reports' },
        { name: 'Settings', icon: '⚙️', path: '/admin/settings' },
      ],
    },
  ];

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */
  const isActive = (path) => {
    if (path === '/admin/dashboard') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    if (window.confirm('Logout from admin panel?')) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminAuthenticated');
      navigate('/admin/login');
    }
  };

  const getBadgeColor = (color) => {
    switch (color) {
      case 'orange':
        return 'bg-orange-500 text-white';
      case 'purple':
        return 'bg-purple-500 text-white';
      case 'red':
      default:
        return 'bg-red-500 text-white';
    }
  };

  /* ------------------------------------------------------------------ */
  /* Sidebar content (shared mobile + desktop)                          */
  /* ------------------------------------------------------------------ */
  const SidebarContent = () => (
    <>
      {/* ==================== LOGO ==================== */}
      <div
        className={`px-4 py-5 border-b border-white/10 flex items-center ${
          collapsed && !isMobile ? 'justify-center' : 'justify-between'
        }`}
      >
        <Link to="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30 shrink-0">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <h1 className="font-bold text-white text-base leading-tight">
                MyPinkShop
              </h1>
              <p className="text-[10px] text-pink-300/70 tracking-wide">
                ADMIN PANEL
              </p>
            </div>
          )}
        </Link>

        {!isMobile && !collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-gray-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10"
            title="Collapse"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Collapse toggle (when collapsed) */}
      {collapsed && !isMobile && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-3 text-gray-400 hover:text-white transition p-2 rounded-lg hover:bg-white/10"
          title="Expand"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* ==================== PROFILE ==================== */}
      <div className={`px-3 py-3 border-b border-white/10 ${collapsed && !isMobile ? 'flex flex-col items-center gap-2' : ''}`}>
        {(!collapsed || isMobile) ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
              SA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                Super Admin
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                admin@mypinkshop.com
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:bg-red-500 hover:text-white transition-all shrink-0"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
              SA
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:bg-red-500 hover:text-white transition-all"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* ==================== NAVIGATION ==================== */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 admin-sidebar-scroll">
        {menuGroups.map((group) => (
          <div key={group.title}>
            {(!collapsed || isMobile) && (
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em] px-3 mb-2">
                {group.title}
              </p>
            )}
            {collapsed && !isMobile && (
              <div className="mx-auto w-6 h-px bg-white/10 mb-3" />
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => isMobile && setMobileMenuOpen(false)}
                    title={collapsed && !isMobile ? item.name : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                      active
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    } ${collapsed && !isMobile ? 'justify-center' : ''}`}
                  >
                    <span
                      className={`text-lg shrink-0 transition-transform ${
                        active ? 'scale-110' : 'group-hover:scale-110'
                      }`}
                    >
                      {item.icon}
                    </span>

                    {(!collapsed || isMobile) && (
                      <>
                        <span className="text-sm font-medium flex-1 truncate">
                          {item.name}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full min-w-[20px] text-center font-bold shrink-0 ${getBadgeColor(
                              item.badgeColor
                            )} ${active ? 'animate-pulse' : ''}`}
                          >
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </>
                    )}

                    {/* Collapsed badge dot */}
                    {collapsed && !isMobile && item.badge && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ==================== FOOTER ==================== */}
      <div className="px-4 py-3 border-t border-white/10">
        {(!collapsed || isMobile) ? (
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-500 tracking-wider">
              v2.0.0
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] text-gray-400">Online</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </>
  );

  /* ================================================================== */
  /* MOBILE VIEW                                                        */
  /* ================================================================== */
  if (isMobile) {
    const totalBadges = unreadNotifications + pendingReviewCount + pendingOrderCount;

    return (
      <>
        {/* Mobile top bar */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-3 flex items-center justify-between shadow-lg md:hidden border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">
                MyPinkShop
              </h1>
              <p className="text-[9px] text-pink-300/70 tracking-wide">
                ADMIN PANEL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalBadges > 0 && (
              <Link
                to="/admin/notifications"
                className="relative p-2 hover:bg-white/10 rounded-lg transition"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalBadges > 9 ? '9+' : totalBadges}
                </span>
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-white p-2 hover:bg-white/10 rounded-lg transition"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden animate-fade-in"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-gray-900 to-gray-800 text-white z-50 shadow-2xl flex flex-col animate-slide-in-left md:hidden">
              <div className="flex justify-end p-3 border-b border-white/10">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col">
                <SidebarContent />
              </div>
            </aside>
          </>
        )}

        {/* Spacer for fixed header */}
        <div className="h-16 md:hidden" />
      </>
    );
  }

  /* ================================================================== */
  /* DESKTOP VIEW                                                       */
  /* ================================================================== */
  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 z-40 shadow-2xl flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <SidebarContent />
    </aside>
  );
}

export default AdminSidebar;
