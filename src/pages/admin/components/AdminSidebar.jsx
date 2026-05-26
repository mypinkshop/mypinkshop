import { Link, useLocation } from 'react-router-dom';

function AdminSidebar() {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: '📊', path: '/admin/dashboard' },
    { name: 'Vendors', icon: '🏪', path: '/admin/vendors' },
    { name: 'Products', icon: '📦', path: '/admin/products' },
    { name: 'Add Product', icon: '➕', path: '/admin/add-product' },
    { name: 'Inventory', icon: '📋', path: '/admin/inventory' },
    { name: 'Orders', icon: '🛒', path: '/admin/orders' },
    { name: 'Customers', icon: '👥', path: '/admin/customers' },
    { name: 'Categories', icon: '📁', path: '/admin/categories' },
    { name: 'Banner Management', icon: '🎨', path: '/admin/banners' },  // ✅ ADDED THIS
    { name: 'Coupons', icon: '🎫', path: '/admin/coupons' },
    { name: 'Reports', icon: '📈', path: '/admin/reports' },
    { name: 'Settings', icon: '⚙️', path: '/admin/settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40 pt-16">
      <div className="p-4">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Super Admin</h2>
          <p className="text-xs text-gray-400">MyPinkShop</p>
        </div>
        <nav className="space-y-1">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                location.pathname === item.path
                  ? 'bg-pink-50 text-pink-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default AdminSidebar;
