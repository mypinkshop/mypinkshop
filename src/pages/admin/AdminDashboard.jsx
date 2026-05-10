import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Hardcoded admin token for testing
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    // TEMPORARY: Skip token check for testing
    // if (!token) {
    //   navigate('/admin/login');
    //   return;
    // }

    // Use mock data for testing
    const mockStats = {
      totalUsers: 156,
      totalVendors: 12,
      totalProducts: 48,
      totalEarnings: 125000,
      pendingVendors: 3,
      recentOrders: [
        { _id: 1, orderNumber: 'MPS-1001', buyerId: { name: 'Priya Sharma' }, vendorId: { brandName: 'Nykaa Beauty' }, total: 2598, status: 'delivered' },
        { _id: 2, orderNumber: 'MPS-1002', buyerId: { name: 'Aditi Singh' }, vendorId: { brandName: 'Mamaearth' }, total: 1798, status: 'shipped' },
        { _id: 3, orderNumber: 'MPS-1003', buyerId: { name: 'Neha Gupta' }, vendorId: { brandName: 'Sugar Cosmetics' }, total: 899, status: 'pending' },
      ]
    };

    // Try real API first, fallback to mock
    fetch('https://mypinkshop-dr93.vercel.app/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('API failed');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.log('Using mock data:', err);
        setStats(mockStats);
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-pink-500 text-white px-4 py-2 rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-pink-500">MyPinkShop Admin</h1>
          <div className="flex gap-4">
            <Link to="/admin/dashboard" className="text-gray-600 hover:text-pink-500">Dashboard</Link>
            <Link to="/admin/vendors" className="text-gray-600 hover:text-pink-500">Vendors</Link>
            <Link to="/admin/products" className="text-gray-600 hover:text-pink-500">Products</Link>
            <Link to="/admin/orders" className="text-gray-600 hover:text-pink-500">Orders</Link>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-600">Logout</button>
          </div>
        </div>
      </nav>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <div className="text-gray-500 text-sm">Total Users</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-2">🏪</div>
            <div className="text-2xl font-bold">{stats?.totalVendors || 0}</div>
            <div className="text-gray-500 text-sm">Total Vendors</div>
            {stats?.pendingVendors > 0 && (
              <div className="text-xs text-orange-500 mt-1">{stats.pendingVendors} pending</div>
            )}
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-2">📦</div>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
            <div className="text-gray-500 text-sm">Total Products</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold">₹{(stats?.totalEarnings || 0).toLocaleString()}</div>
            <div className="text-gray-500 text-sm">Platform Earnings</div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">📋 Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Order ID</th>
                  <th className="text-left py-2">Customer</th>
                  <th className="text-left py-2">Vendor</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders?.map(order => (
                  <tr key={order._id} className="border-b">
                    <td className="py-2 text-sm">{order.orderNumber}</td>
                    <td className="py-2 text-sm">{order.buyerId?.name || '-'}</td>
                    <td className="py-2 text-sm">{order.vendorId?.brandName || order.vendorId?.name}</td>
                    <td className="py-2 text-sm">₹{order.total}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
