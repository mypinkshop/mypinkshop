import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('sales');
  const [salesData, setSalesData] = useState({
    totalOrders: 0,
    totalSales: 0,
    averageOrderValue: 0,
    totalProducts: 0,
    totalReturns: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  });
  const [dailySales, setDailySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [vendorInfo, setVendorInfo] = useState(null);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      navigate('/vendor/login');
      return;
    }
    fetchVendorData(token);
  }, [navigate]);

  // ✅ Fetch all vendor data
  const fetchVendorData = async (token) => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch vendor profile
      const profileRes = await fetch(`${API_URL}/api/vendor/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      if (profileData.success) {
        setVendorInfo(profileData.vendor);
      }

      // 2. Fetch vendor orders
      const ordersRes = await fetch(`${API_URL}/api/vendor/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();
      
      let myOrders = [];
      if (ordersData.success) {
        myOrders = ordersData.orders || [];
        setOrders(myOrders);
      }

      // 3. Fetch vendor products
      const productsRes = await fetch(`${API_URL}/api/vendor/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const productsData = await productsRes.json();
      const myProducts = productsData.success ? productsData.products || [] : [];

      // ✅ Calculate stats
      const totalSales = myOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const totalOrders = myOrders.length;
      const pendingOrders = myOrders.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'confirmed').length;
      const deliveredOrders = myOrders.filter(o => o.status === 'delivered').length;
      const cancelledOrders = myOrders.filter(o => o.status === 'cancelled').length;
      const totalReturns = myOrders.filter(o => o.returnRequested === true).length;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      setSalesData({
        totalOrders,
        totalSales,
        averageOrderValue,
        totalProducts: myProducts.length,
        totalReturns,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
      });

      // ✅ Daily sales (last 30 days)
      const daily = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayOrders = myOrders.filter(o => {
          const orderDate = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '';
          return orderDate === dateStr;
        });
        daily.push({
          date: dateStr,
          orders: dayOrders.length,
          sales: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        });
      }
      setDailySales(daily);

      // ✅ Top products
      const productSales = {};
      myOrders.forEach(order => {
        if (order.items && order.items.length > 0) {
          order.items.forEach(item => {
            const productName = item.name || 'Unknown Product';
            productSales[productName] = (productSales[productName] || 0) + (item.price * item.quantity || 0);
          });
        }
      });
      const topProductsList = Object.entries(productSales)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);
      setTopProducts(topProductsList);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Download CSV
  const downloadCSV = () => {
    let csvData = [];
    if (dateRange === 'sales') {
      csvData = [['Date', 'Orders', 'Sales (₹)'], ...dailySales.map(d => [d.date, d.orders, d.sales])];
    } else if (dateRange === 'products') {
      csvData = [['Product Name', 'Sales (₹)'], ...topProducts.map(p => [p.name, p.sales])];
    } else if (dateRange === 'inventory') {
      csvData = [['Total Products', salesData.totalProducts]];
    } else if (dateRange === 'tax') {
      csvData = [
        ['Total Sales', salesData.totalSales],
        ['Tax Rate', '5%'],
        ['Total Tax', salesData.totalSales * 0.05],
        ['CGST (2.5%)', salesData.totalSales * 0.025],
        ['SGST (2.5%)', salesData.totalSales * 0.025]
      ];
    }
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dateRange}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading reports...</p>
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
      <VendorHeader />
      <VendorSidebar activeTab="reports" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">📊 Reports</h1>
              <p className="text-gray-500 text-sm">View and download your sales data</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)} 
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
              >
                <option value="sales">📈 Sales Report</option>
                <option value="products">📦 Product Report</option>
                <option value="inventory">📋 Inventory Report</option>
                <option value="tax">🧾 Tax Report</option>
              </select>
              <button 
                onClick={downloadCSV} 
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg text-sm hover:shadow-lg transition flex items-center gap-2"
              >
                📥 Download CSV
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold text-green-600">₹{salesData.totalSales.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{salesData.totalOrders}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Average Order Value</p>
              <p className="text-2xl font-bold text-blue-600">₹{Math.round(salesData.averageOrderValue).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Products</p>
              <p className="text-2xl font-bold text-purple-600">{salesData.totalProducts}</p>
            </div>
          </div>

          {/* Sales Report */}
          {dateRange === 'sales' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-semibold text-gray-800">📈 Daily Sales (Last 30 Days)</h2>
                <span className="text-xs text-gray-400">Total: ₹{dailySales.reduce((sum, d) => sum + d.sales, 0).toLocaleString()}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b">
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
                      <th className="px-5 py-3 text-right font-semibold text-gray-600">Orders</th>
                      <th className="px-5 py-3 text-right font-semibold text-gray-600">Sales (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dailySales.map((day, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3 text-gray-600">{day.date}</td>
                        <td className="px-5 py-3 text-right">{day.orders}</td>
                        <td className="px-5 py-3 text-right font-medium text-green-600">₹{day.sales.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td className="px-5 py-3 font-semibold">Total</td>
                      <td className="px-5 py-3 text-right font-semibold">{dailySales.reduce((sum, d) => sum + d.orders, 0)}</td>
                      <td className="px-5 py-3 text-right font-bold text-green-600">₹{dailySales.reduce((sum, d) => sum + d.sales, 0).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Product Report */}
          {dateRange === 'products' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-5 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">🏆 Top Selling Products</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b">
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">#</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Product Name</th>
                      <th className="px-5 py-3 text-right font-semibold text-gray-600">Sales (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topProducts.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-5 py-8 text-center text-gray-400">📭 No sales data available</td>
                      </tr>
                    ) : (
                      topProducts.map((product, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition">
                          <td className="px-5 py-3 text-center">#{idx + 1}</td>
                          <td className="px-5 py-3 font-medium">{product.name}</td>
                          <td className="px-5 py-3 text-right font-bold text-pink-600">₹{product.sales.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inventory Report */}
          {dateRange === 'inventory' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-5 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">📋 Inventory Summary</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">Total Products</p>
                    <p className="text-2xl font-bold text-gray-800">{salesData.totalProducts}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">In Stock</p>
                    <p className="text-2xl font-bold text-green-600">{salesData.totalProducts}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">Low Stock</p>
                    <p className="text-2xl font-bold text-yellow-600">0</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-600">0</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">💡 Detailed inventory report can be downloaded from the Inventory section.</p>
              </div>
            </div>
          )}

          {/* Tax Report */}
          {dateRange === 'tax' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-5 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">🧾 Tax Summary</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-800">₹{salesData.totalSales.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Tax Rate (GST)</p>
                    <p className="text-2xl font-bold text-purple-600">5%</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Total Tax</p>
                    <p className="text-2xl font-bold text-orange-600">₹{(salesData.totalSales * 0.05).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">2.5% CGST + 2.5% SGST</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Tax Period</p>
                    <p className="text-xl font-bold text-gray-800">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600">💡 Tax report based on 5% GST (2.5% CGST + 2.5% SGST). Consult your tax advisor for accurate filing.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default VendorReports;
