import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const VendorSidebar = ({ activeMenu, setActiveMenu }) => {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊', path: '/vendor/dashboard' },
    { id: 'catalogue', name: 'Catalogue', icon: '📦', path: '/vendor/products' },
    { id: 'inventory', name: 'Inventory', icon: '📋', path: '/vendor/inventory' },
    { id: 'orders', name: 'Orders', icon: '🛒', path: '/vendor/orders' },
    { id: 'payments', name: 'Payments', icon: '💳', path: '/vendor/earnings' },
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
              localStorage.removeItem('vendor');
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [vendorInfo, setVendorInfo] = useState(null);
  const [stats, setStats] = useState({
    todaySales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
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
    loadVendorData(vendorToken);
  }, [navigate]);

  // ✅ BACKEND API INTEGRATION
  const loadVendorData = async (token) => {
    try {
      setLoading(true);
      setError('');
      
      const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';
      
      // 1. Fetch Vendor Profile
      const profileRes = await fetch(`${API_URL}/api/vendor/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      
      if (profileData.success) {
        setVendorInfo(profileData.vendor);
        localStorage.setItem('vendor', JSON.stringify(profileData.vendor));
      } else {
        setError('Failed to load vendor profile');
      }

      // 2. Fetch Vendor Stats
      const statsRes = await fetch(`${API_URL}/api/vendor/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      
      if (statsData.success) {
        setStats({
          todaySales: statsData.stats.todaySales || 0,
          totalOrders: statsData.stats.totalOrders || 0,
          pendingOrders: statsData.stats.pendingOrders || 0,
          totalProducts: statsData.stats.totalProducts || 0,
          totalEarnings: statsData.stats.totalRevenue || 0,
          pendingBalance: statsData.stats.totalRevenue * 0.7 || 0
        });
      }

      // 3. Fetch Recent Orders
      const ordersRes = await fetch(`${API_URL}/api/vendor/orders?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();
      
      if (ordersData.success) {
        setRecentOrders(ordersData.orders || []);
      }

    } catch (err) {
      console.error('Error loading vendor data:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Try Again
          </button>
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
              <p className="text-sm text-gray-500">Welcome back, {vendorInfo?.brandName || vendorInfo?.name || 'Seller'} 👋</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input type="text" placeholder="Search..." className="w-64 pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-md">
                {vendorInfo?.brandName?.charAt(0) || vendorInfo?.name?.charAt(0) || 'S'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Today's Sales</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.todaySales.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-2xl font-bold text-pink-600">₹{stats.totalEarnings.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Products</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h3 className="font-semibold text-gray-700 mb-4">⚡ Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link to="/vendor/products/add" className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition transform hover:-translate-y-0.5 text-sm font-medium">
                ➕ Add Product
              </Link>
              <Link to="/vendor/orders" className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                📋 View Orders
              </Link>
              <Link to="/vendor/earnings" className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                💳 Earnings
              </Link>
            </div>
          </div>
          
          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">📋 Recent Orders</h2>
              <Link to="/vendor/orders" className="text-sm text-pink-600 hover:underline">
                View All →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-600 font-semibold">Order ID</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-semibold">Customer</th>
                    <th className="px-4 py-3 text-right text-gray-600 font-semibold">Amount</th>
                    <th className="px-4 py-3 text-center text-gray-600 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                        🛒 No orders yet
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order, idx) => (
                      <tr key={idx} className="border-t hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-pink-600 font-medium">#{order._id?.slice(-6) || order.id}</td>
                        <td className="px-4 py-3 text-gray-600">{order.customerName || 'Customer'}</td>
                        <td className="px-4 py-3 text-right font-semibold">₹{(order.total || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
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
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
