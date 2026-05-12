import { useState } from 'react';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  const stats = {
    orders: 351,
    customers: 210,
    quotes: 7,
    returns: 29,
    pendingOrders: 145,
    pendingReturns: 27,
    abandonedCart: 196,
    outOfStock: 71,
    revenue: 4800,
    returnAmount: 32711,
    abandonedAmount: 32711,
    outOfStockAmount: 32711,
  };

  const recentBuyers = [
    { id: 1, name: 'Priya Sharma', amount: 2598, date: '10 mins ago', avatar: 'PS' },
    { id: 2, name: 'Aditi Singh', amount: 1798, date: '25 mins ago', avatar: 'AS' },
    { id: 3, name: 'Neha Gupta', amount: 899, date: '1 hour ago', avatar: 'NG' },
    { id: 4, name: 'Riya Mehta', amount: 3499, date: '2 hours ago', avatar: 'RM' },
  ];

  const StatCard = ({ title, value, icon, badge, progress }) => (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-pink-100">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">{title}</p>
            <p className="mt-2 text-4xl font-bold text-gray-800">{value}</p>
            {badge && <span className="mt-2 inline-block rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-600">{badge}</span>}
          </div>
          <div className="rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 p-3 text-white shadow-md">{icon}</div>
        </div>
        {progress && (
          <div className="mt-5">
            <div className="h-1.5 w-full rounded-full bg-pink-100">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const SmallStat = ({ title, value, change }) => (
    <div className="rounded-xl border border-pink-100 bg-white p-4 transition-all hover:border-pink-200 hover:shadow-md">
      <p className="text-xs text-gray-400">{title}</p>
      <p className="mt-1 text-xl font-bold text-gray-800">{value}</p>
      {change && <p className="mt-1 text-xs text-green-500">{change}</p>}
    </div>
  );

  const BuyerCard = ({ name, amount, date, avatar }) => (
    <div className="flex items-center gap-3 rounded-xl border border-pink-50 bg-white p-3 transition-all hover:border-pink-100 hover:shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-sm font-bold text-white shadow-md">
        {avatar}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-800">{name}</p>
        <p className="text-xs text-gray-400">{date}</p>
      </div>
      <p className="font-bold text-gray-800">₹{amount}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">
      {/* Top Bar */}
      <div className="fixed top-0 right-0 left-0 z-50 border-b border-pink-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
          <Link to="/admin/dashboard" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow-md">M</div>
            <h1 className="text-xl font-bold text-gray-800">MyPinkShop <span className="text-xs font-normal text-gray-400">Super Admin</span></h1>
          </Link>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input type="text" placeholder="Search..." className="w-64 rounded-lg border border-pink-100 bg-white py-1.5 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200" />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <button className="rounded-lg bg-pink-50 p-2 text-pink-500 transition-colors hover:bg-pink-100">🔔</button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow-md">SA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-14 h-full w-64 border-r border-pink-100 bg-white">
        <div className="p-4">
          <div className="mb-6 flex items-center gap-2 border-b border-pink-100 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white">📊</div>
            <span className="text-sm font-semibold text-gray-700">Dashboard</span>
          </div>
          <nav className="space-y-1">
            <Link to="/admin/dashboard" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md"><span>📊</span><span>Dashboard</span></Link>
            <Link to="/admin/vendors" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all text-gray-500 hover:bg-pink-50 hover:text-pink-600"><span>🏪</span><span>Vendors</span><span className="ml-auto bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">18</span></Link>
            <Link to="/admin/products" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all text-gray-500 hover:bg-pink-50 hover:text-pink-600"><span>📦</span><span>Products</span></Link>
            <Link to="/admin/categories" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all text-gray-500 hover:bg-pink-50 hover:text-pink-600"><span>📁</span><span>Categories</span></Link>
            <Link to="/admin/orders" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all text-gray-500 hover:bg-pink-50 hover:text-pink-600"><span>📋</span><span>Orders</span></Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 mt-14 p-6">
        <div className="mx-auto max-w-[1400px] space-y-6">
          <div className="flex justify-end">
            <div className="flex items-center gap-2 rounded-lg border border-pink-100 bg-white px-3 py-1.5 shadow-sm"><span className="text-sm text-gray-500">🌐</span><span className="text-sm font-medium text-gray-600">Select Language</span></div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="ORDERS" value={stats.orders} icon={<span className="text-xl">📦</span>} />
            <StatCard title="CUSTOMERS" value={stats.customers} icon={<span className="text-xl">👥</span>} />
            <StatCard title="QUOTES" value={stats.quotes} icon={<span className="text-xl">💬</span>} badge="7 New" />
            <StatCard title="RETURN REQUESTS" value={stats.returns} icon={<span className="text-xl">🔄</span>} badge="29 Pending" />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-5">
              <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">CURRENTLY PENDING</h3><span className="text-xs font-medium text-pink-500 hover:cursor-pointer hover:underline">VIEW ALL →</span></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-3xl font-bold text-gray-800">{stats.pendingOrders}</p><p className="text-sm text-gray-500">ORDERS</p><p className="mt-2 text-sm font-semibold text-green-600">₹{stats.revenue.toLocaleString()}</p></div>
                  <div><p className="text-3xl font-bold text-gray-800">{stats.pendingReturns}</p><p className="text-sm text-gray-500">RETURN/EXCHANGE</p><p className="mt-2 text-sm font-semibold text-red-500">₹{stats.returnAmount.toLocaleString()}</p></div>
                </div>
              </div>
              <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">ABANDONED CART</h3>
                <div className="flex items-center justify-between"><div><p className="text-3xl font-bold text-gray-800">{stats.abandonedCart}</p><p className="text-sm text-gray-500">Carts</p></div><p className="text-lg font-bold text-gray-800">₹{stats.abandonedAmount.toLocaleString()}</p></div>
                <div className="mt-4 h-1.5 w-full rounded-full bg-pink-100"><div className="h-1.5 w-2/3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500" /></div>
              </div>
              <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">OUT OF STOCK PRODUCTS</h3>
                <div className="flex items-center justify-between"><div><p className="text-3xl font-bold text-gray-800">{stats.outOfStock}</p><p className="text-sm text-gray-500">Products</p></div><p className="text-lg font-bold text-gray-800">₹{stats.outOfStockAmount.toLocaleString()}</p></div>
                <div className="mt-4 h-1.5 w-full rounded-full bg-pink-100"><div className="h-1.5 w-1/4 rounded-full bg-gradient-to-r from-pink-500 to-rose-500" /></div>
              </div>
            </div>

            <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">RECENT BUYERS</h3><span className="text-xs text-gray-400">In the last 1 hour</span></div>
              <div className="space-y-2">{recentBuyers.map((buyer) => (<BuyerCard key={buyer.id} {...buyer} />))}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <SmallStat title="Amazon" value="Sync" /><SmallStat title="eBay" value="Connected" /><SmallStat title="Channel Manager" value="Active" /><SmallStat title="Push Notification" value="On" /><SmallStat title="RMA Settings" value="Configured" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
