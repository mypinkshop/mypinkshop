import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true); // Dark by default
  const [loading, setLoading] = useState(false);

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

  const StatCard = ({ title, value, icon, subtitle, badge, progress }) => (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-5 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
      <div className="absolute top-0 right-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 blur-2xl" />
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
            {badge && <span className="mt-2 inline-block rounded-full bg-pink-500/20 px-2 py-0.5 text-xs font-medium text-pink-400">{badge}</span>}
          </div>
          <div className="rounded-xl bg-gray-800/50 p-3 backdrop-blur-sm">{icon}</div>
        </div>
        {progress && (
          <div className="mt-4">
            <div className="h-1.5 w-full rounded-full bg-gray-700">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const SmallStat = ({ title, value, change }) => (
    <div className="rounded-xl bg-gray-800/50 p-4 backdrop-blur-sm transition-all hover:bg-gray-800">
      <p className="text-xs text-gray-400">{title}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
      {change && <p className="mt-1 text-xs text-green-400">{change}</p>}
    </div>
  );

  const BuyerCard = ({ name, amount, date, avatar }) => (
    <div className="flex items-center gap-3 rounded-xl bg-gray-800/30 p-3 transition-all hover:bg-gray-800">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-sm font-bold text-white">
        {avatar}
      </div>
      <div className="flex-1">
        <p className="font-medium text-white">{name}</p>
        <p className="text-xs text-gray-400">{date}</p>
      </div>
      <p className="font-semibold text-white">₹{amount}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Bar */}
      <div className="fixed top-0 right-0 left-0 z-50 border-b border-gray-800 bg-gray-900/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">M</div>
            <h1 className="text-xl font-bold text-white">MyPinkShop <span className="text-xs font-normal text-gray-400">Super Admin</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input type="text" placeholder="Search..." className="w-64 rounded-lg bg-gray-800 border border-gray-700 py-1.5 pl-9 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500" />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            </div>
            <button className="rounded-lg bg-gray-800 p-2 text-gray-400 hover:bg-gray-700">🔔</button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">SA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-14 h-full w-64 border-r border-gray-800 bg-gray-900/95 backdrop-blur-sm">
        <div className="p-4">
          <div className="mb-6 flex items-center gap-2 border-b border-gray-800 pb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white">📊</div>
            <span className="text-sm font-semibold text-white">Dashboard</span>
          </div>
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'configurations', label: 'Configurations', icon: '⚙️' },
              { id: 'catalog', label: 'Catalog', icon: '📚' },
              { id: 'orders', label: 'Orders', icon: '📦' },
              { id: 'customers', label: 'Customers', icon: '👥' },
              { id: 'returns', label: 'Returns', icon: '🔄' },
              { id: 'content', label: 'Content Management', icon: '📝' },
              { id: 'sales', label: 'Sales', icon: '💰' },
              { id: 'wallet', label: 'Wallet System', icon: '💳' },
              { id: 'shipping', label: 'Shipping & Taxes', icon: '🚚' },
              { id: 'quotes', label: 'Request Quotes', icon: '💬' },
              { id: 'cart', label: 'Shopping Cart', icon: '🛒' },
              { id: 'rma', label: 'RMA Settings', icon: '🛠️' },
              { id: 'notifications', label: 'Push Notification', icon: '🔔' },
              { id: 'channel', label: 'Channel Manager', icon: '🌐' },
              { id: 'wishlist', label: 'WishList', icon: '❤️' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 mt-14 p-6">
        <div className="mx-auto max-w-[1400px] space-y-6">
          {/* Language Selector */}
          <div className="flex justify-end">
            <div className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-1.5">
              <span className="text-sm text-gray-300">🌐</span>
              <span className="text-sm text-white">Select Language</span>
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <StatCard title="ORDERS" value={stats.orders} icon={<span className="text-xl">📦</span>} subtitle="Total Orders" />
            <StatCard title="CUSTOMERS" value={stats.customers} icon={<span className="text-xl">👥</span>} subtitle="Active Customers" />
            <StatCard title="QUOTES" value={stats.quotes} icon={<span className="text-xl">💬</span>} subtitle="Pending Quotes" badge="7 New" />
            <StatCard title="RETURN REQUESTS" value={stats.returns} icon={<span className="text-xl">🔄</span>} subtitle="Awaiting Action" badge="29 Pending" />
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Left Column - Currently Pending */}
            <div className="space-y-5">
              <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-400">CURRENTLY PENDING</h3>
                  <span className="text-xs text-pink-400">VIEW ALL →</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-3xl font-bold text-white">{stats.pendingOrders}</p>
                    <p className="text-sm text-gray-500">ORDERS</p>
                    <p className="mt-2 text-xs text-green-400">₹{stats.revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{stats.pendingReturns}</p>
                    <p className="text-sm text-gray-500">RETURN/EXCHANGE</p>
                    <p className="mt-2 text-xs text-red-400">₹{stats.returnAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-400">ABANDONED CART</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white">{stats.abandonedCart}</p>
                    <p className="text-sm text-gray-500">Carts</p>
                  </div>
                  <p className="text-lg font-semibold text-white">₹{stats.abandonedAmount.toLocaleString()}</p>
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-gray-700">
                  <div className="h-1.5 w-2/3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-400">OUT OF STOCK PRODUCTS</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white">{stats.outOfStock}</p>
                    <p className="text-sm text-gray-500">Products</p>
                  </div>
                  <p className="text-lg font-semibold text-white">₹{stats.outOfStockAmount.toLocaleString()}</p>
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-gray-700">
                  <div className="h-1.5 w-1/4 rounded-full bg-gradient-to-r from-red-500 to-pink-500" />
                </div>
              </div>
            </div>

            {/* Right Column - Recent Buyers */}
            <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-400">RECENT BUYERS</h3>
                <span className="text-xs text-gray-500">In the last 1 hour</span>
              </div>
              <div className="space-y-2">
                {recentBuyers.map((buyer) => (
                  <BuyerCard key={buyer.id} {...buyer} />
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <SmallStat title="Amazon" value="Sync" />
            <SmallStat title="eBay" value="Connected" />
            <SmallStat title="Channel Manager" value="Active" />
            <SmallStat title="Push Notification" value="On" />
            <SmallStat title="RMA Settings" value="Configured" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
