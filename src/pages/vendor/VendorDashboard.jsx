import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
            </Link>
          ))}
        </div>
      </nav>
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

function VendorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [vendorInfo, setVendorInfo] = useState(null);
  const [stats, setStats] = useState({
    todaySales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    unshippedOrders: 0,
    totalProducts: 0,
    lowStock: 0,
    totalEarnings: 0,
    pendingBalance: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const vendorToken = localStorage.getItem('vendorToken');
    if (!vendorToken) {
      navigate('/vendor/login');
      return;
    }
    loadVendorData();
  }, [navigate]);

  const loadVendorData = () => {
    const vendors = JSON.parse(localStorage.getItem('registeredVendors') || '[]');
    const currentVendor = vendors.find(v => v.email === user?.email);
    setVendorInfo(currentVendor);
    
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const vendorProducts = allProducts.filter(p => p.vendor === currentVendor?.brandName || p.brand === currentVendor?.brandName);
    
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const vendorOrders = allOrders.filter(order => {
      if (order.items) {
        return order.items.some(item => item.vendor === currentVendor?.brandName);
      }
      return false;
    });
    
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
      pendingBalance: totalEarnings * 0.7
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
      <div className="ml-64">
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Seller Central</h1>
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
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500">Today's Sales</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.todaySales.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-2xl font-bold text-pink-600">₹{stats.totalEarnings.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-sm text-gray-500">Products</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-800">Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr><th className="px-4 py-3 text-left">Order ID</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-center">Status</th></tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-400">No orders yet</td></tr>
                  ) : (
                    recentOrders.map((order, idx) => (
                      <tr key={idx} className="border-t"><td className="px-4 py-3">{order.id}</td><td className="px-4 py-3">{new Date(order.date).toLocaleDateString()}</td><td className="px-4 py-3 text-right font-semibold">₹{(order.total || 0).toLocaleString()}</td><td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">{order.status || 'pending'}</span></td></tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
