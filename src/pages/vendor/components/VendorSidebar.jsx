import { Link, useLocation } from 'react-router-dom';

function VendorSidebar() {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: '📊', path: '/vendor/dashboard' },
    { name: 'Inventory', icon: '📦', path: '/vendor/products' },
    { name: 'Add Product', icon: '➕', path: '/vendor/add-product' },
    { name: 'Orders', icon: '📋', path: '/vendor/orders' },
    { name: 'Advertising', icon: '📢', path: '/vendor/ads' },
    { name: 'Shipping', icon: '🚚', path: '/vendor/shipping' },
    { name: 'Tax & GST', icon: '💰', path: '/vendor/tax' },
    { name: 'Reports', icon: '📊', path: '/vendor/reports' },
    { name: 'Earnings', icon: '💳', path: '/vendor/earnings' },
    { name: 'Settings', icon: '⚙️', path: '/vendor/settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40 pt-16">
      <div className="p-4">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Seller Panel</h2>
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
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default VendorSidebar;
