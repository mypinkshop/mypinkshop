import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ✅ Premium Vendor Sidebar Component
const VendorSidebar = ({ activeMenu, setActiveMenu }) => {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊', path: '/vendor/dashboard' },
    { id: 'catalogue', name: 'Catalogue', icon: '📦', path: '/vendor/products' },
    { id: 'inventory', name: 'Inventory', icon: '📋', path: '/vendor/inventory' },
    { id: 'pricing', name: 'Pricing', icon: '💰', path: '/vendor/pricing' },
    { id: 'orders', name: 'Orders', icon: '🛒', path: '/vendor/orders' },
    { id: 'advertising', name: 'Advertising', icon: '📢', path: '/vendor/ads' },
    { id: 'growth', name: 'Growth', icon: '📈', path: '/vendor/growth' },
    { id: 'reports', name: 'Reports', icon: '📊', path: '/vendor/reports' },
    { id: 'payments', name: 'Payments', icon: '💳', path: '/vendor/earnings' },
    { id: 'brand', name: 'Brand', icon: '🏷️', path: '/vendor/brand-application' },
    { id: 'settings', name: 'Settings', icon: '⚙️', path: '/vendor/settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white z-40 shadow-2xl">
      {/* Logo */}
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div>
            <h1 className="font-bold text-white text-lg">MyPinkShop</h1>
            <p className="text-[10px] text-gray-400">Seller Central</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setActiveMenu(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                activeMenu === item.id
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="text-xl group-hover:scale-110 transition">{item.icon}</span>
              <span className="text-sm font-medium">{item.name}</span>
              {activeMenu === item.id && (
                <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="border-t border-gray-700 pt-4">
          <button 
            onClick={() => {
              localStorage.removeItem('vendorToken');
              window.location.href = '/vendor/login';
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-300 hover:bg-red-600 hover:text-white transition-all"
          >
            <span className="text-xl">🚪</span>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

// Main Vendor Dashboard Component
function VendorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [stats, setStats] = useState({
    todaySales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    unshippedOrders: 0,
    totalProducts: 0,
    lowStock: 0,
    totalEarnings: 0,
    pendingBalance: 0,
    adSales: 0,
    inventoryScore: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [vendorInfo, setVendorInfo] = useState(null);

  useEffect(() => {
    const vendorToken = localStorage.getItem('vendorToken');
    if (!vendorToken) {
      navigate('/vendor/login');
      return;
    }
    loadVendorData();
  }, [navigate]);

  const loadVendorData = () => {
    // Get vendor info
    const vendors = JSON.parse(localStorage.getItem('registeredVendors') || '[]');
    const currentVendor = vendors.find(v => v.email === user?.email);
    setVendorInfo(currentVendor);
    
    // Get all products
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const vendorProducts = allProducts.filter(p => p.vendor === currentVendor?.brandName || p.brand === currentVendor?.brandName);
    
    // Get all orders
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const vendorOrders = allOrders.filter(order => {
      if (order.items) {
        return order.items.some(item => item.vendor === currentVendor?.brandName);
      }
      return false;
    });
    
    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = vendorOrders.filter(o => o.date === today);
    const todaySales = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    const pendingOrders = vendorOrders.filter(o => o.status === 'pending').length;
    const unshippedOrders = vendorOrders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    
    const deliveredOrders = vendorOrders.filter(o => o.status === 'delivered');
    const totalEarnings = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0) * 0.85;
    
    const lowStock = vendorProducts.filter(p => (p.stock || 0) < 10).length;
    
    setStats({
      todaySales,
      totalOrders: vendorOrders.length,
      pendingOrders,
      unshippedOrders,
      totalProducts: vendorProducts.length,
      lowStock,
      totalEarnings,
      pendingBalance: totalEarnings * 0.7,
      adSales: Math.floor(Math.random() * 5000),
      inventoryScore: Math.floor(Math.random() * 100)
    });
    
    setRecentOrders(vendorOrders.slice(-5).reverse());
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      
      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Seller Central
              </h1>
              <p className="text-sm text-gray-500">Welcome back, {vendorInfo?.brandName || 'Seller'}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input type="text" placeholder="Search..." className="w-64 pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md">
                {vendorInfo?.brandName?.charAt(0) || 'S'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="p-6">
          
          {/* Global Snapshot Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {/* Sales Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm text-gray-500">Today's Sales</p>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-2xl font-bold text-green-600">₹{stats.todaySales.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">Today so far</p>
            </div>
            
            {/* Orders Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm text-gray-500">Total Orders</p>
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
              <p className="text-xs text-orange-600 mt-1">{stats.unshippedOrders} unshipped</p>
            </div>
            
            {/* Earnings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm text-gray-500">Total Earnings</p>
                <span className="text-2xl">💵</span>
              </div>
              <p className="text-2xl font-bold text-pink-600">₹{stats.totalEarnings.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">Pending: ₹{stats.pendingBalance.toLocaleString()}</p>
            </div>
            
            {/* Seller Feedback Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm text-gray-500">Seller Rating</p>
                <span className="text-2xl">⭐</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">4.8 ★</p>
              <p className="text-xs text-gray-400 mt-1">Based on 24 reviews</p>
            </div>
          </div>

          {/* Second Row Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
              <p className="text-sm text-blue-600 font-medium">Inventory Performance Index</p>
              <p className="text-3xl font-bold text-blue-800 mt-2">{stats.inventoryScore}</p>
              <p className="text-xs text-blue-600 mt-1">Good standing</p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
              <p className="text-sm text-green-600 font-medium">Global Promotions Sales</p>
              <p className="text-3xl font-bold text-green-800">₹{stats.adSales.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">Last 30 days</p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
              <p className="text-sm text-purple-600 font-medium">Ad Sales</p>
              <p className="text-3xl font-bold text-purple-800">₹{stats.adSales.toLocaleString()}</p>
              <p className="text-xs text-purple-600 mt-1">Today so far</p>
            </div>
          </div>

          {/* Product Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Product Performance</h2>
              <div className="flex gap-3">
                <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>This year</option>
                </select>
                <input type="text" placeholder="Search products..." className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-48" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left">Product Name</th>
                    <th className="px-4 py-3 text-center">Units Sold</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.totalProducts === 0 ? (
                    <tr className="hover:bg-gray-50">
                      <td colSpan="4" className="px-4 py-12 text-center text-gray-400">
                        No products yet. Add your first product!
                      </td>
                    </td>
                  ) : (
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">Your Products</td>
                      <td className="px-4 py-3 text-center">0</td>
                      <td className="px-4 py-3 text-right">₹0</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              <td>
            </div>
          </div>

          {/* Quick Actions & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Partner Network */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🤝</span> Partner Network
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/vendor/services" className="p-3 bg-gray-50 rounded-lg text-center hover:bg-pink-50 transition">
                  <div className="text-2xl mb-1">🛠️</div>
                  <p className="text-sm font-medium">Services</p>
                </Link>
                <Link to="/vendor/b2b" className="p-3 bg-gray-50 rounded-lg text-center hover:bg-pink-50 transition">
                  <div className="text-2xl mb-1">🏢</div>
                  <p className="text-sm font-medium">B2B</p>
                </Link>
                <Link to="/vendor/brand" className="p-3 bg-gray-50 rounded-lg text-center hover:bg-pink-50 transition">
                  <div className="text-2xl mb-1">🏷️</div>
                  <p className="text-sm font-medium">Brands</p>
                </Link>
                <Link to="/vendor/learn" className="p-3 bg-gray-50 rounded-lg text-center hover:bg-pink-50 transition">
                  <div className="text-2xl mb-1">📚</div>
                  <p className="text-sm font-medium">Learn</p>
                </Link>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>💡</span> Recommendations
              </h3>
              <div className="space-y-3">
                <Link to="/vendor/products/add" className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                  <div>
                    <p className="font-medium text-blue-800">List Globally</p>
                    <p className="text-xs text-blue-600">Reach customers worldwide</p>
                  </div>
                  <span className="text-blue-600">→</span>
                </Link>
                <Link to="/vendor/training" className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
                  <div>
                    <p className="font-medium text-purple-800">Tutorials and Training</p>
                    <p className="text-xs text-purple-600">Learn to grow your business</p>
                  </div>
                  <span className="text-purple-600">→</span>
                </Link>
                <Link to="/vendor/ads" className="flex items-center justify-between p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition">
                  <div>
                    <p className="font-medium text-pink-800">Boost sales with minimal effort</p>
                    <p className="text-xs text-pink-600">Advertise your products</p>
                  </div>
                  <span className="text-pink-600">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Recent Orders</h2>
              <Link to="/vendor/orders" className="text-sm text-pink-600 hover:underline">View All →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left">Order ID</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentOrders.length === 0 ? (
                    <tr className="hover:bg-gray-50">
                      <td colSpan="4" className="px-4 py-12 text-center text-gray-400">
                        No orders yet
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
                        <td className="px-4 py-3">{new Date(order.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right font-semibold">₹{(order.total || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {order.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Banner */}
          <div className="mt-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-5 border border-pink-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-sm font-semibold text-pink-800">✨ How would you like to optimize your daily spend of ₹500?</p>
                <p className="text-xs text-pink-600 mt-1">Get started with advertising to boost your sales</p>
              </div>
              <Link to="/vendor/ads" className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition">
                Optimize Now →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
