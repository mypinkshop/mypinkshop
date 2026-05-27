import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: '📊', path: '/admin/dashboard', badge: null },
    { name: 'Vendors', icon: '🏪', path: '/admin/vendors', badge: null },
    { name: 'Products', icon: '📦', path: '/admin/products', badge: null },
    { name: 'Add Product', icon: '➕', path: '/admin/add-product', badge: null },
    { name: 'Categories', icon: '📁', path: '/admin/categories', badge: null },
    { name: 'Orders', icon: '🛒', path: '/admin/orders', badge: null },
    { name: 'Customers', icon: '👥', path: '/admin/customers', badge: null },
    { name: 'Banners', icon: '🎨', path: '/admin/banners', badge: null },
    { name: 'Coupons', icon: '🎫', path: '/admin/coupons', badge: null },
    { name: 'Inventory', icon: '📋', path: '/admin/inventory', badge: null },
    { name: 'Advertising', icon: '📢', path: '/admin/advertising', badge: null },
    { name: 'Reports', icon: '📈', path: '/admin/reports', badge: null },
    { name: 'Settings', icon: '⚙️', path: '/admin/settings', badge: null },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminAuthenticated');
    navigate('/admin/login');
  };

  return (
    <aside className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 z-50 shadow-2xl ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className={`p-5 border-b border-gray-700 flex ${collapsed ? 'justify-center' : 'justify-between'} items-center`}>
        {!collapsed && (
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
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">M</span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="text-gray-400 hover:text-white transition"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                location.pathname === item.path
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="text-xl group-hover:scale-110 transition">{item.icon}</span>
              {!collapsed && (
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
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="border-t border-gray-700 my-2"></div>
        
        {!collapsed && (
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
        
        {collapsed && (
          <div className="flex justify-center py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md">
              SA
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
        >
          <span className="text-xl">🚪</span>
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
