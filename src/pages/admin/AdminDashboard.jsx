import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, Store, Package, DollarSign, TrendingUp, 
  ShoppingBag, CheckCircle, Clock, XCircle,
  Eye, MoreHorizontal, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    const mockStats = {
      totalUsers: 12580,
      totalVendors: 342,
      totalProducts: 2847,
      totalEarnings: 4582000,
      pendingVendors: 18,
      revenueGrowth: 23.5,
      ordersGrowth: 15.2,
      recentOrders: [
        { _id: 1, orderNumber: 'MPS-1001', buyerId: { name: 'Priya Sharma' }, vendorId: { brandName: 'Nykaa Beauty' }, total: 2598, status: 'delivered', date: '2024-05-10' },
        { _id: 2, orderNumber: 'MPS-1002', buyerId: { name: 'Aditi Singh' }, vendorId: { brandName: 'Mamaearth' }, total: 1798, status: 'shipped', date: '2024-05-09' },
        { _id: 3, orderNumber: 'MPS-1003', buyerId: { name: 'Neha Gupta' }, vendorId: { brandName: 'Sugar Cosmetics' }, total: 899, status: 'pending', date: '2024-05-09' },
        { _id: 4, orderNumber: 'MPS-1004', buyerId: { name: 'Riya Mehta' }, vendorId: { brandName: 'Plum' }, total: 3499, status: 'delivered', date: '2024-05-08' },
        { _id: 5, orderNumber: 'MPS-1005', buyerId: { name: 'Anjali Verma' }, vendorId: { brandName: 'Nykaa Beauty' }, total: 1599, status: 'processing', date: '2024-05-08' },
      ]
    };

    fetch('https://mypinkshop-dr93.vercel.app/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setStats(mockStats);
        setLoading(false);
      });
  }, []);

  const statsCards = [
    { title: 'Total Users', value: stats?.totalUsers?.toLocaleString() || '0', icon: Users, color: 'from-blue-500 to-cyan-500', change: '+12%', changeType: 'up' },
    { title: 'Total Vendors', value: stats?.totalVendors?.toLocaleString() || '0', icon: Store, color: 'from-purple-500 to-pink-500', change: '+8%', changeType: 'up' },
    { title: 'Total Products', value: stats?.totalProducts?.toLocaleString() || '0', icon: Package, color: 'from-emerald-500 to-teal-500', change: '+23%', changeType: 'up' },
    { title: 'Revenue', value: `₹${(stats?.totalEarnings || 0).toLocaleString()}`, icon: DollarSign, color: 'from-amber-500 to-orange-500', change: '+18%', changeType: 'up' },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'processing': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered': return <CheckCircle size={14} className="mr-1" />;
      case 'shipped': return <Clock size={14} className="mr-1" />;
      case 'pending': return <Clock size={14} className="mr-1" />;
      default: return <ShoppingBag size={14} className="mr-1" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-xl z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">MyPinkShop</h1>
              <p className="text-xs text-gray-500">Admin Panel v2.0</p>
            </div>
          </div>

          <nav className="space-y-2">
            <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg transition-all">
              <TrendingUp size={20} />
              <span>Dashboard</span>
            </Link>
            <Link to="/admin/vendors" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-all group">
              <Store size={20} />
              <span>Vendors</span>
            </Link>
            <Link to="/admin/products" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-all group">
              <Package size={20} />
              <span>Products</span>
            </Link>
            <Link to="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-all group">
              <ShoppingBag size={20} />
              <span>Orders</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 p-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, Super Admin</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition">
                <span className="text-white font-bold text-lg">A</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full -mr-16 -mt-16 opacity-10 group-hover:opacity-20 transition`}></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                    <stat.icon size={24} className="text-white" />
                  </div>
                  <span className={`flex items-center gap-1 text-sm font-semibold ${stat.changeType === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {stat.change}
                    {stat.changeType === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                <p className="text-gray-500 text-sm mt-1">{stat.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-gray-800">Revenue Overview</h3>
              <select className="text-sm border rounded-lg px-3 py-1 bg-white">
                <option>This Week</option>
                <option>This Month</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-xl">
              <div className="text-center">
                <TrendingUp size={48} className="text-pink-400 mx-auto mb-3" />
                <p className="text-gray-400">Chart visualization coming soon</p>
              </div>
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-6">Top Categories</h3>
            <div className="space-y-4">
              {[
                { name: 'Skincare', percentage: 35, color: 'bg-pink-500' },
                { name: 'Makeup', percentage: 28, color: 'bg-purple-500' },
                { name: 'The Drip', percentage: 22, color: 'bg-amber-500' },
                { name: 'Accessories', percentage: 15, color: 'bg-emerald-500' },
              ].map((cat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{cat.name}</span>
                    <span className="text-gray-500">{cat.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color} rounded-full transition-all duration-500`} style={{ width: `${cat.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Recent Orders</h3>
            <Link to="/admin/orders" className="text-sm text-pink-500 hover:text-pink-600 flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats?.recentOrders?.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.buyerId?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.vendorId?.brandName || order.vendorId?.name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">₹{order.total}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.date).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <button className="text-gray-400 hover:text-pink-500 transition">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
