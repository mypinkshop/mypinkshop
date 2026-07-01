import { Link, useLocation } from 'react-router-dom';

function VendorSidebar({ activeTab }) {
  const location = useLocation();
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/vendor/dashboard' },
    { id: 'products', label: 'Inventory', icon: '📦', path: '/vendor/products' },
    { id: 'add-product', label: 'Add Product', icon: '➕', path: '/vendor/add-product' },
    { id: 'orders', label: 'Orders', icon: '📋', path: '/vendor/orders' },
    { id: 'returns', label: 'Returns', icon: '🔄', path: '/vendor/returns' },
    { id: 'ads', label: 'Advertising', icon: '📢', path: '/vendor/ads' },
   // { id: 'coupons', label: 'Coupons', icon: '🎫', path: '/vendor/coupons' },
    { id: 'reports', label: 'Reports', icon: '📊', path: '/vendor/reports' },
    { id: 'order-reports', label: 'Order Reports', icon: '📋', path: '/vendor/order-reports' },
    { id: 'performance', label: 'Account Health', icon: '💚', path: '/vendor/account-health' },
    { id: 'earnings', label: 'Earnings', icon: '💰', path: '/vendor/earnings' },
    { id: 'shipping', label: 'Shipping', icon: '🚚', path: '/vendor/shipping' },
    { id: 'tax', label: 'Tax & GST', icon: '💰', path: '/vendor/tax' },
    { id: 'permissions', label: 'User Permissions', icon: '👥', path: '/vendor/permissions' },
    { id: 'fba', label: 'FBA Shipments', icon: '🚛', path: '/vendor/fba' },
    { id: 'store', label: 'Store Builder', icon: '🏪', path: '/vendor/store-builder' },
    { id: 'profile', label: 'Profile', icon: '👤', path: '/vendor/profile' },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '/vendor/settings' },
  ];

  return (
    <aside className="fixed left-0 top-14 h-full w-64 bg-white border-r border-gray-200 shadow-sm overflow-y-auto z-40">
      <div className="p-4">
        <nav className="space-y-1">
          {menuItems.map(item => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                location.pathname === item.path || activeTab === item.id
                  ? 'bg-pink-50 text-pink-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'fba' && (
                <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                  Soon
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default VendorSidebar;
