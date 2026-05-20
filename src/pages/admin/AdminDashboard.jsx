import { useState } from 'react';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 4520000,
    totalOrders: 342,
    totalProducts: 2847,
    totalVendors: 342,
    totalCustomers: 12580,
    pendingOrders: 23,
    pendingVendors: 18,
    lowStockProducts: 12,
    todaySales: 12450,
    todayOrders: 45,
  });

  const recentOrders = [
    { id: '#MPS-1001', customer: 'Priya Sharma', vendor: 'Nykaa Beauty', amount: 2598, status: 'delivered', date: '2025-05-19' },
    { id: '#MPS-1002', customer: 'Aditi Singh', vendor: 'Mamaearth', amount: 1798, status: 'shipped', date: '2025-05-18' },
    { id: '#MPS-1003', customer: 'Neha Gupta', vendor: 'Sugar Cosmetics', amount: 899, status: 'pending', date: '2025-05-18' },
    { id: '#MPS-1004', customer: 'Riya Mehta', vendor: 'Nykaa Beauty', amount: 3499, status: 'processing', date: '2025-05-17' },
    { id: '#MPS-1005', customer: 'Anjali Verma', vendor: 'Plum', amount: 1599, status: 'shipped', date: '2025-05-17' },
  ];

  const topProducts = [
    { id: 1, name: 'Glass Skin Serum', sales: 234, revenue: 303966 },
    { id: 2, name: 'Cherry Lip Tint', sales: 189, revenue: 113211 },
    { id: 3, name: 'Satin Slip Dress', sales: 156, revenue: 389844 },
    { id: 4, name: 'Rice Water Toner', sales: 145, revenue: 130355 },
    { id: 5, name: 'Baby Pink Blush', sales: 123, revenue: 98277 },
  ];

  const quickActions = [
    { name: 'Add Product', icon: '➕', link: '/admin/add-product', color: 'bg-pink-500' },
    { name: 'Manage Vendors', icon: '🏪', link: '/admin/vendors', color: 'bg-blue-500' },
    { name: 'View Orders', icon: '📦', link: '/admin/orders', color: 'bg-green-500' },
    { name: 'Create Coupon', icon: '🎫', link: '/admin/coupons', color: 'bg-purple-500' },
    { name: 'Shipping', icon: '🚚', link: '/admin/shipping', color: 'bg-amber-500' },
    { name: 'Tax Settings', icon: '💰', link: '/admin/tax', color: 'bg-indigo-500' },
    { name: 'Advertising', icon: '📢', link: '/admin/advertising', color: 'bg-rose-500' },
    { name: 'Reports', icon: '📊', link: '/admin/reports', color: 'bg-teal-500' },
  ];

  const menuSections = [
    { title: 'INVENTORY', icon: '📦', items: [
      { name: 'All Products', link: '/admin/products', count: stats.totalProducts },
      { name: 'Add Product', link: '/admin/add-product' },
      { name: 'Inventory', link: '/admin/inventory' },
      { name: 'Categories', link: '/admin/categories' },
    ]},
    { title: 'SALES', icon: '💰', items: [
      { name: 'Orders', link: '/admin/orders', count: stats.totalOrders },
      { name: 'Coupons', link: '/admin/coupons' },
      { name: 'Tax Settings', link: '/admin/tax' },
    ]},
    { title: 'SELLERS', icon: '🏪', items: [
      { name: 'All Vendors', link: '/admin/vendors', count: stats.totalVendors },
      { name: 'Pending Approvals', link: '/admin/vendors?tab=pending', count: stats.pendingVendors },
      { name: 'Vendor Payments', link: '/admin/payments' },
    ]},
    { title: 'CUSTOMERS', icon: '👥', items: [
      { name: 'All Customers', link: '/admin/customers', count: stats.totalCustomers },
    ]},
    { title: 'MARKETING', icon: '📢', items: [
      { name: 'Advertising', link: '/admin/advertising' },
      { name: 'Coupons', link: '/admin/coupons' },
    ]},
    { title: 'LOGISTICS', icon: '🚚', items: [
      { name: 'Shipping Zones', link: '/admin/shipping' },
    ]},
    { title: 'REPORTS', icon: '📊', items: [
      { name: 'Sales Report', link: '/admin/reports' },
    ]},
    { title: 'SETTINGS', icon: '⚙️', items: [
      { name: 'General Settings', link: '/admin/settings' },
    ]},
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
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

      {/* Stats Cards */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Today's Sales</p><p className="text-xl font-bold text-green-600">₹{stats.todaySales.toLocaleString()}</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Today's Orders</p><p className="text-xl font-bold">{stats.todayOrders}</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Total Revenue</p><p className="text-xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Total Orders</p><p className="text-xl font-bold">{stats.totalOrders}</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Products</p><p className="text-xl font-bold">{stats.totalProducts}</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Vendors</p><p className="text-xl font-bold">{stats.totalVendors}</p><p className="text-xs text-yellow-600">{stats.pendingVendors} pending</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Customers</p><p className="text-xl font-bold">{stats.totalCustomers}</p></div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">QUICK ACTIONS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {quickActions.map(action => (
              <Link key={action.name} to={action.link} className={`${action.color} text-white rounded-lg p-3 text-center hover:opacity-90 transition`}>
                <div className="text-xl mb-1">{action.icon}</div>
                <p className="text-xs font-medium">{action.name}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Menu Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {menuSections.map(section => (
            <div key={section.title} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                <span className="text-lg">{section.icon}</span>
                <h3 className="font-semibold text-gray-700">{section.title}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {section.items.map(item => (
                  <Link key={item.name} to={item.link} className="flex justify-between items-center px-4 py-2 hover:bg-gray-50 transition">
                    <span className="text-sm text-gray-600">{item.name}</span>
                    {item.count !== undefined && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{item.count}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Recent Orders</h3>
              <Link to="/admin/orders" className="text-xs text-pink-600 hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Order ID</th>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{order.id}</td>
                      <td className="px-3 py-2">{order.customer}</td>
                      <td className="px-3 py-2 text-right">₹{order.amount}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>{order.status}</span>
                      </td>
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
            <div className="divide-y divide-gray-100">
              {topProducts.map(product => (
                <div key={product.id} className="flex justify-between items-center px-4 py-2 hover:bg-gray-50">
                  <div><p className="font-medium text-sm">{product.name}</p><p className="text-xs text-gray-400">{product.sales} units sold</p></div>
                  <p className="font-semibold text-green-600">₹{product.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Vendors Alert */}
        {stats.pendingVendors > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex justify-between items-center">
            <div><p className="text-sm font-medium text-yellow-800">⚠️ {stats.pendingVendors} vendors pending approval</p><p className="text-xs text-yellow-600">Review and approve vendor registrations</p></div>
            <Link to="/admin/vendors?tab=pending" className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700">Review Now</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
