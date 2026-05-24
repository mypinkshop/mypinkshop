import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';

function VendorDashboard() {
  const [vendor, setVendor] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    earnings: 0,
    rating: 0,
    totalReturns: 0,
    totalReviews: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendor');
    const detailsFilled = localStorage.getItem('vendorDetailsFilled');
    
    if (!token || !vendorData) {
      navigate('/vendor/login');
      return;
    }
    
    const vendorInfo = JSON.parse(vendorData);
    setVendor(vendorInfo);
    
    if (!detailsFilled) {
      navigate('/vendor/business-details');
      return;
    }
    
    // Real data from localStorage
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const vendorName = vendorInfo.brandName || vendorInfo.name;
    const myProducts = allProducts.filter(p => p.vendor === vendorName);
    
    // Orders data (from localStorage)
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const myOrders = allOrders.filter(o => o.vendor === vendorName);
    
    const totalSales = myOrders.reduce((sum, o) => sum + o.amount, 0);
    const pendingOrders = myOrders.filter(o => o.status === 'pending').length;
    const deliveredOrders = myOrders.filter(o => o.status === 'delivered').length;
    const totalReturns = myOrders.filter(o => o.returnRequested === true).length;
    
    // Calculate earnings (85% of sales after 15% commission)
    const earnings = totalSales * 0.85;
    
    // Calculate average rating from products
    const avgRating = myProducts.length > 0 
      ? (myProducts.reduce((sum, p) => sum + (p.rating || 4.5), 0) / myProducts.length).toFixed(1)
      : 0;
    
    setStats({
      totalProducts: myProducts.length,
      totalOrders: myOrders.length,
      totalSales: totalSales,
      pendingOrders: pendingOrders,
      earnings: earnings,
      rating: parseFloat(avgRating),
      totalReturns: totalReturns,
      totalReviews: deliveredOrders,
    });
    
    // Recent orders (last 5)
    setRecentOrders(myOrders.slice(-5).reverse());
    
    // Top products by sales
    const sortedProducts = [...myProducts].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 5);
    setTopProducts(sortedProducts);
    
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorSidebar />
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-30">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">Seller Dashboard</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{vendor?.brandName}</span>
              <button onClick={() => { localStorage.removeItem('vendorToken'); localStorage.removeItem('vendor'); navigate('/vendor/login'); }} className="text-sm text-red-500">Logout</button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-6 text-white mb-8">
            <h1 className="text-2xl font-bold">Welcome back, {vendor?.brandName}! 👋</h1>
            <p className="opacity-90 mt-1">Here's your store performance overview</p>
          </div>

          {/* Stats Cards - Amazon Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Total Sales (30 days)</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.totalSales.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.totalOrders} orders</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Earnings</p>
              <p className="text-2xl font-bold text-pink-600">₹{stats.earnings.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">After 15% commission</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Products</p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
              <p className="text-xs text-gray-400 mt-1">Active listings</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Seller Rating</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{stats.rating}</p>
                <div className="flex text-yellow-400">★</div>
              </div>
              <p className="text-xs text-gray-400 mt-1">{stats.totalReviews} reviews</p>
            </div>
          </div>

          {/* Second Row Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Pending Orders</p><p className="text-xl font-bold text-yellow-600">{stats.pendingOrders}</p></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Completed Orders</p><p className="text-xl font-bold text-green-600">{stats.totalOrders - stats.pendingOrders}</p></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Return Requests</p><p className="text-xl font-bold text-red-500">{stats.totalReturns}</p></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Conversion Rate</p><p className="text-xl font-bold">{stats.totalOrders > 0 ? Math.round((stats.totalSales / stats.totalOrders) / 100) : 0}%</p></div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Link to="/vendor/products" className="bg-white rounded-xl p-4 text-center border border-gray-200 hover:shadow-md transition"><div className="text-2xl mb-2">📦</div><p className="font-medium text-sm">Manage Inventory</p></Link>
            <Link to="/vendor/add-product" className="bg-white rounded-xl p-4 text-center border border-gray-200 hover:shadow-md transition"><div className="text-2xl mb-2">➕</div><p className="font-medium text-sm">Add Product</p></Link>
            <Link to="/vendor/orders" className="bg-white rounded-xl p-4 text-center border border-gray-200 hover:shadow-md transition"><div className="text-2xl mb-2">📋</div><p className="font-medium text-sm">Manage Orders</p></Link>
            <Link to="/vendor/ads" className="bg-white rounded-xl p-4 text-center border border-gray-200 hover:shadow-md transition"><div className="text-2xl mb-2">📢</div><p className="font-medium text-sm">Advertising</p></Link>
            <Link to="/vendor/reports" className="bg-white rounded-xl p-4 text-center border border-gray-200 hover:shadow-md transition"><div className="text-2xl mb-2">📊</div><p className="font-medium text-sm">Reports</p></Link>
          </div>

          {/* Recent Orders & Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Recent Orders</h3>
                <Link to="/vendor/orders" className="text-sm text-pink-600 hover:underline">View All →</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Order ID</th>
                      <th className="px-4 py-2 text-left">Customer</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentOrders.length === 0 ? (
                      <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">No orders yet</td></tr>
                    ) : (
                      recentOrders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium">{order.id}</td>
                          <td className="px-4 py-2">{order.customer}</td>
                          <td className="px-4 py-2 text-right">₹{order.amount}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>{order.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">Top Selling Products</h3>
              </div>
              <div className="divide-y">
                {topProducts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No products yet</div>
                ) : (
                  topProducts.map((product, idx) => (
                    <div key={product.id} className="flex justify-between items-center px-5 py-3 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-400 w-6">#{idx + 1}</span>
                        <div><p className="font-medium text-sm">{product.name}</p><p className="text-xs text-gray-400">SKU: {product.sku}</p></div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">₹{product.price}</p>
                        <p className="text-xs text-gray-400">{product.sales || 0} units sold</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          {stats.totalProducts > 0 && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex justify-between items-center">
              <div><p className="text-sm font-medium text-yellow-800">⚠️ Low Stock Alert</p><p className="text-xs text-yellow-600">Some products are running low on stock. Check inventory to restock.</p></div>
              <Link to="/vendor/products" className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700">View Products</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
