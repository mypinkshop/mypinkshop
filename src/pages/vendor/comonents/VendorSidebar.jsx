import { Link } from 'react-router-dom';

function VendorSidebar({ activeTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/vendor/dashboard' },
    { id: 'products', label: 'Products', icon: '📦', path: '/vendor/products' },
    { id: 'add-product', label: 'Add Product', icon: '➕', path: '/vendor/add-product' },
    { id: 'orders', label: 'Orders', icon: '📋', path: '/vendor/orders' },
    { id: 'earnings', label: 'Earnings', icon: '💰', path: '/vendor/earnings' },
    { id: 'profile', label: 'Store Profile', icon: '⚙️', path: '/vendor/profile' },
  ];

  return (
    <aside className="fixed left-0 top-14 h-full w-64 bg-white border-r border-pink-100 shadow-sm">
      <div className="p-4">
        <div className="mb-6 flex items-center gap-2 border-b border-pink-100 pb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white">🏪</div>
          <span className="text-sm font-semibold text-gray-700">Seller Panel</span>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-pink-50 hover:text-pink-600'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default VendorSidebar;
