import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorReports() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last30');
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
  const [vendor, setVendor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendor');
    
    if (!token || !vendorData) {
      navigate('/vendor/login');
      return;
    }

    const vendorInfo = JSON.parse(vendorData);
    setVendor(vendorInfo);
    const vendorName = vendorInfo.brandName || vendorInfo.name;
    
    // Get real data from localStorage
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const myProducts = allProducts.filter(p => p.vendor === vendorName);
    
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const myOrders = allOrders.filter(o => o.vendor === vendorName);
    
    const totalSales = myOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalOrders = myOrders.length;
    const pendingOrders = myOrders.filter(o => o.status === 'pending').length;
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
    
    // Generate daily sales data (last 30 days)
    const daily = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOrders = myOrders.filter(o => o.date === dateStr);
      daily.push({
        date: dateStr,
        orders: dayOrders.length,
        sales: dayOrders.reduce((sum, o) => sum + o.amount, 0),
      });
    }
    setDailySales(daily);
    
    // Top products by sales
    const productSales = {};
    myOrders.forEach(order => {
      const productName = order.productName || order.items?.[0]?.name;
      if (productName) {
        productSales[productName] = (productSales[productName] || 0) + order.amount;
      }
    });
    const topProductsList = Object.entries(productSales)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
    setTopProducts(topProductsList);
    
    setLoading(false);
  }, [navigate, dateRange]);

  const downloadCSV = () => {
    let csvData = [];
    if (dateRange === 'sales') {
      csvData = [['Date', 'Orders', 'Sales (₹)'], ...dailySales.map(d => [d.date, d.orders, d.sales])];
    } else if (dateRange === 'products') {
      csvData = [['Product Name', 'Sales (₹)'], ...topProducts.map(p => [p.name, p.sales])];
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
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      <VendorSidebar activeTab="reports" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
              <p className="text-gray-500 text-sm">View and download your sales data</p>
            </div>
            <div className="flex gap-3">
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="sales">Sales Report</option>
                <option value="products">Product Report</option>
                <option value="inventory">Inventory Report</option>
                <option value="tax">Tax Report</option>
              </select>
              <button onClick={downloadCSV} className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-700 transition">
                Download CSV
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Total Sales</p><p className="text-2xl font-bold text-green-600">₹{salesData.totalSales.toLocaleString()}</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Total Orders</p><p className="text-2xl font-bold">{salesData.totalOrders}</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Average Order Value</p><p className="text-2xl font-bold">₹{Math.round(salesData.averageOrderValue).toLocaleString()}</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Products Sold</p><p className="text-2xl font-bold">{salesData.totalProducts}</p></div>
          </div>

          {/* Sales Report */}
          {dateRange === 'sales' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">Daily Sales (Last 30 Days)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b">
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-right">Orders</th>
                      <th className="px-5 py-3 text-right">Sales (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {dailySales.map(day => (
                      <tr key={day.date} className="hover:bg-gray-50">
                        <td className="px-5 py-3">{day.date}</td>
                        <td className="px-5 py-3 text-right">{day.orders}</td>
                        <td className="px-5 py-3 text-right font-medium">₹{day.sales.toLocaleString()}</td>
                      <tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Product Report */}
          {dateRange === 'products' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">Top Selling Products</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b">
                      <th className="px-5 py-3 text-left">Product Name</th>
                      <th className="px-5 py-3 text-right">Sales (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {topProducts.length === 0 ? (
                      <tr><td colSpan="2" className="px-5 py-8 text-center text-gray-500">No sales data available</td></tr>
                    ) : (
                      topProducts.map(product => (
                        <tr key={product.name} className="hover:bg-gray-50">
                          <td className="px-5 py-3">{product.name}</td>
                          <td className="px-5 py-3 text-right font-medium">₹{product.sales.toLocaleString()}</td>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Inventory Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">Total SKUs</p><p className="text-xl font-bold">{salesData.totalProducts}</p></div>
                <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">Low Stock</p><p className="text-xl font-bold text-yellow-600">0</p></div>
                <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">Out of Stock</p><p className="text-xl font-bold text-red-600">0</p></div>
                <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">In Stock</p><p className="text-xl font-bold text-green-600">{salesData.totalProducts}</p></div>
              </div>
              <p className="text-sm text-gray-500">Detailed inventory report can be downloaded from the Inventory section.</p>
            </div>
          )}

          {/* Tax Report */}
          {dateRange === 'tax' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Tax Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">Total Tax Collected</p><p className="text-xl font-bold">₹{(salesData.totalSales * 0.05).toLocaleString()}</p><p className="text-xs text-gray-400">@ 5% GST</p></div>
                <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">CGST (2.5%)</p><p className="text-xl font-bold">₹{(salesData.totalSales * 0.025).toLocaleString()}</p></div>
                <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">SGST (2.5%)</p><p className="text-xl font-bold">₹{(salesData.totalSales * 0.025).toLocaleString()}</p></div>
                <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500">Tax Period</p><p className="text-xl font-bold">May 2025</p></div>
              </div>
              <p className="text-sm text-gray-500">Tax report based on 5% GST (2.5% CGST + 2.5% SGST).</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default VendorReports;
