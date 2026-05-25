import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalVendors: 0,
    totalCustomers: 0,
    pendingVendors: 0,
    lowStockProducts: 0,
    todaySales: 0,
    todayOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const allVendors = JSON.parse(localStorage.getItem('registeredVendors') || '[]');
    const allCustomers = JSON.parse(localStorage.getItem('registeredCustomers') || '[]');
    
    const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.amount, 0);
    const pendingVendors = allVendors.filter(v => v.vendorStatus === 'pending').length;
    const lowStockProducts = allProducts.filter(p => p.stock < 10).length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = allOrders.filter(o => o.date === today);
    const todaySales = todayOrders.reduce((sum, o) => sum + o.amount, 0);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyData = months.map(month => ({ month, sales: Math.floor(Math.random() * 50000) + 20000 }));
    setSalesData(monthlyData);
    
    setStats({
      totalRevenue,
      totalOrders: allOrders.length,
      totalProducts: allProducts.length,
      totalVendors: allVendors.length,
      totalCustomers: allCustomers.length,
      pendingVendors,
      lowStockProducts,
      todaySales,
      todayOrders: todayOrders.length,
    });
    
    setRecentOrders(allOrders.slice(-5).reverse());
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const maxSales = Math.max(...salesData.map(d => d.sales), 1);

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 fixed top-0 right-0 left-64 z-40">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input type="text" placeholder="Search" className="w-64 pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold">SA</div>
          </div>
        </div>
      </div>

      <main className="ml-64 pt-16 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Today's Sales</p><p className="text-xl font-bold text-green-600">₹{stats.todaySales.toLocaleString()}</p></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Today's Orders</p><p className="text-xl font-bold">{stats.todayOrders}</p></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Revenue</p><p className="text-xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Orders</p><p className="text-xl font-bold">{stats.totalOrders}</p></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Products</p><p className="text-xl font-bold">{stats.totalProducts}</p></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Vendors</p><p className="text-xl font-bold">{stats.totalVendors}</p>{stats.pendingVendors > 0 && <p className="text-xs text-yellow-600">{stats.pendingVendors} pending</p>}</div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Customers</p><p className="text-xl font-bold">{stats.totalCustomers}</p></div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-8">
          <h3 className="font-semibold text-gray-800 mb-4">Sales Overview</h3>
          <div className="flex items-end gap-4 h-48">
            {salesData.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-pink-100 rounded-t-lg" style={{ height: `${(item.sales / maxSales) * 100}%`, minHeight: '20px' }}>
                  <div className="w-full bg-pink-500 rounded-t-lg" style={{ height: `${(item.sales / maxSales) * 100}%` }}></div>
                </div>
                <span className="text-xs text-gray-500">{item.month}</span>
                <span className="text-xs font-medium">₹{Math.round(item.sales / 1000)}k</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Recent Orders</h3>
            <Link to="/admin/orders" className="text-sm text-pink-600 hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr className="border-b"><th className="px-4 py-2 text-left">Order ID</th><th className="px-4 py-2 text-left">Customer</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2 text-center">Status</th></tr></thead>
              <tbody className="divide-y">{recentOrders.map(order => (<tr key={order.id} className="hover:bg-gray-50"><td className="px-4 py-2 font-medium">{order.id}</td><td className="px-4 py-2">{order.customer}</td><td className="px-4 py-2 text-right">₹{order.amount}</td><td className="px-4 py-2 text-center"><span className={`px-2 py-1 rounded-full text-xs ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status}</span></td></tr>))}</tbody>
            </table>
          </div>
        </div>

        {stats.pendingVendors > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex justify-between items-center">
            <div><p className="text-sm font-medium text-yellow-800">⚠️ {stats.pendingVendors} vendors pending approval</p><p className="text-xs text-yellow-600">Review and approve vendor registrations</p></div>
            <Link to="/admin/vendors?tab=pending" className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm">Review</Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
