import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function AdminDashboard() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { section: 'MAIN', items: [
      { name: 'Dashboard', icon: '📊', path: '/admin/dashboard' },
      { name: 'Add Product', icon: '➕', path: '/admin/add-product' },
      { name: 'Products', icon: '📦', path: '/admin/products' },
      { name: 'Inventory', icon: '📋', path: '/admin/inventory' },
      { name: 'Categories', icon: '📁', path: '/admin/categories' },
    ]},
    { section: 'SALES', items: [
      { name: 'Orders', icon: '🛒', path: '/admin/orders' },
      { name: 'Returns & Refunds', icon: '🔄', path: '/admin/orders?tab=returns' },
      { name: 'Coupons', icon: '🎫', path: '/admin/coupons' },
      { name: 'Tax Settings', icon: '💰', path: '/admin/tax' },
    ]},
    { section: 'SELLERS', items: [
      { name: 'All Vendors', icon: '🏪', path: '/admin/vendors' },
      { name: 'Pending Approvals', icon: '⏳', path: '/admin/vendors?tab=pending' },
      { name: 'Vendor Payments', icon: '💳', path: '/admin/payments' },
    ]},
    { section: 'CUSTOMERS', items: [
      { name: 'All Customers', icon: '👥', path: '/admin/customers' },
    ]},
    { section: 'MARKETING', items: [
      { name: 'Advertising', icon: '📢', path: '/admin/advertising' },
      { name: 'Coupons', icon: '🎫', path: '/admin/coupons' },
    ]},
    { section: 'LOGISTICS', items: [
      { name: 'Shipping Zones', icon: '🚚', path: '/admin/shipping' },
    ]},
    { section: 'REPORTS', items: [
      { name: 'Sales Report', icon: '📊', path: '/admin/reports' },
      { name: 'Inventory Report', icon: '📋', path: '/admin/reports?type=inventory' },
      { name: 'Tax Report', icon: '💰', path: '/admin/reports?type=tax' },
    ]},
    { section: 'SETTINGS', items: [
      { name: 'General Settings', icon: '⚙️', path: '/admin/settings' },
      { name: 'Commission', icon: '🏷️', path: '/admin/settings#commission' },
    ]},
  ];

  const stats = {
    todaySales: 12450,
    todayOrders: 45,
    totalRevenue: 4520000,
    totalOrders: 342,
    totalProducts: 2847,
    totalVendors: 342,
    totalCustomers: 12580,
    pendingVendors: 18,
  };

  const recentOrders = [
    { id: '#MPS-1001', customer: 'Priya Sharma', amount: 2598, status: 'delivered' },
    { id: '#MPS-1002', customer: 'Aditi Singh', amount: 1798, status: 'shipped' },
    { id: '#MPS-1003', customer: 'Neha Gupta', amount: 899, status: 'pending' },
    { id: '#MPS-1004', customer: 'Riya Mehta', amount: 3499, status: 'processing' },
    { id: '#MPS-1005', customer: 'Anjali Verma', amount: 1599, status: 'shipped' },
  ];

  const topProducts = [
    { name: 'Glass Skin Serum', sales: 234, revenue: 303966 },
    { name: 'Cherry Lip Tint', sales: 189, revenue: 113211 },
    { name: 'Satin Slip Dress', sales: 156, revenue: 389844 },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      delivered: 'bg-green-100 text-green-700',
      shipped: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-purple-100 text-purple-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 fixed top-0 right-0 left-0 z-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600 hover:text-gray-800">
              <span className="text-xl">{sidebarOpen ? '◀' : '▶'}</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-800">MyPinkShop Seller Central</h1>
            <span className="text-xs text-gray-400">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input type="text" placeholder="Search" className="w-64 pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold">SA</div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed left-0 top-14 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 overflow-y-auto ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="p-4">
          {menuItems.map((section, idx) => (
            <div key={idx} className="mb-6">
              {sidebarOpen && <p className="text-xs font-semibold text-gray-400 mb-2">{section.section}</p>}
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => (
                  <Link
                    key={itemIdx}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      location.pathname === item.path ? 'bg-pink-50 text-pink-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {sidebarOpen && <span>{item.name}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className={`pt-14 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Today's Sales</p><p className="text-xl font-bold text-green-600">₹{stats.todaySales.toLocaleString()}</p></div>
            <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Today's Orders</p><p className="text-xl font-bold">{stats.todayOrders}</p></div>
            <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Total Revenue</p><p className="text-xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p></div>
            <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Total Orders</p><p className="text-xl font-bold">{stats.totalOrders}</p></div>
            <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Products</p><p className="text-xl font-bold">{stats.totalProducts}</p></div>
            <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Vendors</p><p className="text-xl font-bold">{stats.totalVendors}</p><p className="text-xs text-yellow-600">{stats.pendingVendors} pending</p></div>
            <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Customers</p><p className="text-xl font-bold">{stats.totalCustomers}</p></div>
          </div>

          {/* Recent Orders & Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Orders */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Recent Orders</h3>
                <Link to="/admin/orders" className="text-xs text-pink-600 hover:underline">View All</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left">Order ID</th>
                      <th className="px-3 py-2 text-left">Customer</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{order.id}</td>
                        <td className="px-3 py-2">{order.customer}</td>
                        <td className="px-3 py-2 text-right">₹{order.amount}</td>
                        <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadge(order.status)}`}>{order.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="font-semibold text-gray-700">Top Selling Products</h3>
              </div>
              <div className="divide-y">
                {topProducts.map((product, idx) => (
                  <div key={idx} className="flex justify-between items-center px-4 py-2 hover:bg-gray-50">
                    <div><p className="font-medium text-sm">{product.name}</p><p className="text-xs text-gray-400">{product.sales} units sold</p></div>
                    <p className="font-semibold text-green-600">₹{product.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Vendors Alert */}
          {stats.pendingVendors > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex justify-between items-center">
              <div><p className="text-sm font-medium text-yellow-800">⚠️ {stats.pendingVendors} vendors pending approval</p><p className="text-xs text-yellow-600">Review and approve vendor registrations</p></div>
              <Link to="/admin/vendors?tab=pending" className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700">Review Now</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
