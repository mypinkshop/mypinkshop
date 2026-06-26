import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function AdminReports() {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('last30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [salesData, setSalesData] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    topProducts: [],
    dailySales: []
  });
  const [inventoryData, setInventoryData] = useState({
    totalSKUs: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    lowStockProducts: []
  });
  const [taxData, setTaxData] = useState({
    totalTax: 0,
    gst5: 0,
    gst12: 0,
    gst18: 0,
    period: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadReportData(token);
  }, [navigate, dateRange, reportType]);

  // ✅ Load report data from backend
  const loadReportData = async (token) => {
    try {
      setLoading(true);
      setError('');

      // 1. Load orders for sales report
      const ordersRes = await fetch(`${API_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (ordersRes.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      let allOrders = [];
      if (ordersRes.ok) {
        allOrders = await ordersRes.json();
        allOrders = Array.isArray(allOrders) ? allOrders : [];
      }

      // 2. Load products for inventory report
      const productsRes = await fetch(`${API_URL}/api/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let allProducts = [];
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        allProducts = productsData.products || productsData || [];
      }

      // Process data
      processReportData(allOrders, allProducts);

    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to load report data');
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Process report data
  const processReportData = (allOrders, allProducts) => {
    // Filter orders by date range
    const filteredOrders = filterOrdersByDateRange(allOrders, dateRange);

    // Calculate Sales Data
    const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered' || o.status === 'confirmed');
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total || o.amount || 0), 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Calculate top selling products
    const productSales = {};
    filteredOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const id = item.productId || item._id || item.id || 'unknown';
          productSales[id] = productSales[id] || { 
            name: item.name || 'Unknown', 
            quantity: 0, 
            revenue: 0, 
            price: item.price || 0 
          };
          productSales[id].quantity += (item.quantity || 1);
          productSales[id].revenue += (item.price * (item.quantity || 1));
        });
      }
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Calculate daily sales
    const dailySalesMap = {};
    filteredOrders.forEach(order => {
      const date = order.createdAt?.split('T')[0] || order.date;
      if (date) {
        dailySalesMap[date] = (dailySalesMap[date] || 0) + (order.total || order.amount || 0);
      }
    });
    const dailySales = Object.entries(dailySalesMap)
      .map(([date, sales]) => ({ date, sales }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30);

    setSalesData({
      totalOrders,
      totalRevenue,
      averageOrderValue,
      topProducts,
      dailySales
    });

    // Calculate Inventory Data
    const totalSKUs = allProducts.length;
    const inStock = allProducts.filter(p => (p.stock || 0) > 10).length;
    const lowStock = allProducts.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
    const outOfStock = allProducts.filter(p => (p.stock || 0) === 0).length;
    const lowStockProducts = allProducts
      .filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10)
      .slice(0, 10);

    setInventoryData({
      totalSKUs,
      inStock,
      lowStock,
      outOfStock,
      lowStockProducts
    });

    // Calculate Tax Data
    const totalTax = deliveredOrders.reduce((sum, o) => sum + (o.tax || o.total * 0.18 || 0), 0);
    const gst5 = deliveredOrders.reduce((sum, o) => sum + ((o.total || 0) * 0.05), 0);
    const gst12 = deliveredOrders.reduce((sum, o) => sum + ((o.total || 0) * 0.12), 0);
    const gst18 = deliveredOrders.reduce((sum, o) => sum + ((o.total || 0) * 0.18), 0);
    const period = getDateRangeText(dateRange);

    setTaxData({
      totalTax: Math.round(totalTax),
      gst5: Math.round(gst5),
      gst12: Math.round(gst12),
      gst18: Math.round(gst18),
      period
    });
  };

  const filterOrdersByDateRange = (orders, range) => {
    const now = new Date();
    let startDate;

    switch(range) {
      case 'last7':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last30':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'last90':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
    }

    return orders.filter(order => {
      const orderDate = new Date(order.createdAt || order.date);
      return orderDate >= startDate;
    });
  };

  const getDateRangeText = (range) => {
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now);

    switch(range) {
      case 'last7':
        start.setDate(start.getDate() - 7);
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()} (Last 7 days)`;
      case 'last30':
        start.setDate(start.getDate() - 30);
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()} (Last 30 days)`;
      case 'last90':
        start.setDate(start.getDate() - 90);
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()} (Last 90 days)`;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()} (Last Year)`;
      default:
        return 'Current Period';
    }
  };

  const downloadCSV = () => {
    let csvData = [];
    let filename = '';

    if (reportType === 'sales') {
      csvData = [
        ['Report Type', 'Sales Report'],
        ['Date Range', getDateRangeText(dateRange)],
        ['Generated On', new Date().toLocaleString()],
        [],
        ['Metric', 'Value'],
        ['Total Orders', salesData.totalOrders],
        ['Total Revenue', `₹${salesData.totalRevenue.toLocaleString()}`],
        ['Average Order Value', `₹${salesData.averageOrderValue.toLocaleString()}`],
        [],
        ['Top Selling Products'],
        ['Product Name', 'Units Sold', 'Revenue']
      ];
      salesData.topProducts.forEach(p => {
        csvData.push([p.name, p.quantity, `₹${p.revenue.toLocaleString()}`]);
      });
      filename = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (reportType === 'inventory') {
      csvData = [
        ['Report Type', 'Inventory Report'],
        ['Generated On', new Date().toLocaleString()],
        [],
        ['Metric', 'Count'],
        ['Total SKUs', inventoryData.totalSKUs],
        ['In Stock (>10 units)', inventoryData.inStock],
        ['Low Stock (1-10 units)', inventoryData.lowStock],
        ['Out of Stock', inventoryData.outOfStock],
        [],
        ['Low Stock Products'],
        ['Product Name', 'Current Stock', 'Category']
      ];
      inventoryData.lowStockProducts.forEach(p => {
        csvData.push([p.name, p.stock || 0, p.category || 'N/A']);
      });
      filename = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      csvData = [
        ['Report Type', 'Tax Report'],
        ['Period', taxData.period],
        ['Generated On', new Date().toLocaleString()],
        [],
        ['Tax Type', 'Amount'],
        ['Total Tax Collected', `₹${taxData.totalTax.toLocaleString()}`],
        ['GST 5%', `₹${taxData.gst5.toLocaleString()}`],
        ['GST 12%', `₹${taxData.gst12.toLocaleString()}`],
        ['GST 18%', `₹${taxData.gst18.toLocaleString()}`]
      ];
      filename = `tax_report_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('📊 Report downloaded successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
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

  const maxDailySales = Math.max(...salesData.dailySales.map(d => d.sales), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/dashboard')} className="text-gray-600 hover:text-gray-800 transition text-xl">
            ←
          </button>
          <div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">📊 Reports</h1>
            <p className="text-xs text-gray-400 mt-0.5">Analytics & Insights</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">

        {/* Report Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setReportType('sales')}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  reportType === 'sales'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📊 Sales
              </button>
              <button
                onClick={() => setReportType('inventory')}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  reportType === 'inventory'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📦 Inventory
              </button>
              <button
                onClick={() => setReportType('tax')}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  reportType === 'tax'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🏛️ Tax
              </button>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-500 bg-white"
            >
              <option value="last7">Last 7 days</option>
              <option value="last30">Last 30 days</option>
              <option value="last90">Last 90 days</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Sales Report */}
        {reportType === 'sales' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <span className="text-2xl">📦</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{salesData.totalOrders}</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-2xl font-bold text-green-600">₹{salesData.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Avg Order Value</p>
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-2xl font-bold text-pink-600">₹{salesData.averageOrderValue.toLocaleString()}</p>
              </div>
            </div>

            {salesData.dailySales.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">Daily Sales Trend</h3>
                <div className="relative h-48">
                  <div className="flex items-end gap-2 h-full">
                    {salesData.dailySales.map((day, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="relative w-full">
                          <div 
                            className="w-full bg-pink-100 rounded-t-lg transition-all duration-500"
                            style={{ height: `${Math.max((day.sales / maxDailySales) * 100, 5)}%`, minHeight: '20px' }}
                          >
                            <div 
                              className="w-full bg-gradient-to-t from-pink-500 to-rose-500 rounded-t-lg transition-all duration-500"
                              style={{ height: `${(day.sales / maxDailySales) * 100}%` }}
                            ></div>
                          </div>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            ₹{Math.round(day.sales / 1000)}k
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{day.date?.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">🏆 Top Selling Products</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-5 py-3 text-left">#</th>
                      <th className="px-5 py-3 text-left">Product Name</th>
                      <th className="px-5 py-3 text-right">Units Sold</th>
                      <th className="px-5 py-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {salesData.topProducts.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-5 py-8 text-center text-gray-400">
                          No sales data available
                        </td>
                      </tr>
                    ) : (
                      salesData.topProducts.map((product, idx) => (
                        <tr key={idx} className="hover:bg-pink-50/30 transition">
                          <td className="px-5 py-3 font-medium text-gray-500">{idx + 1}</td>
                          <td className="px-5 py-3 font-medium text-gray-800">{product.name}</td>
                          <td className="px-5 py-3 text-right font-semibold">{product.quantity}</td>
                          <td className="px-5 py-3 text-right font-semibold text-green-600">₹{product.revenue.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={downloadCSV} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg transition flex items-center gap-2">
                📥 Download CSV
              </button>
            </div>
          </div>
        )}

        {/* Inventory Report */}
        {reportType === 'inventory' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 text-center">
                <p className="text-sm text-gray-500">Total SKUs</p>
                <p className="text-2xl font-bold text-gray-800">{inventoryData.totalSKUs}</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 text-center">
                <p className="text-sm text-gray-500">In Stock</p>
                <p className="text-2xl font-bold text-green-600">{inventoryData.inStock}</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 text-center">
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{inventoryData.lowStock}</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 text-center">
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{inventoryData.outOfStock}</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Stock Distribution</h3>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div className="bg-green-500" style={{ width: `${(inventoryData.inStock / inventoryData.totalSKUs) * 100}%` }}></div>
                  <div className="bg-yellow-500" style={{ width: `${(inventoryData.lowStock / inventoryData.totalSKUs) * 100}%` }}></div>
                  <div className="bg-red-500" style={{ width: `${(inventoryData.outOfStock / inventoryData.totalSKUs) * 100}%` }}></div>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> In Stock ({inventoryData.inStock})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded-full"></span> Low Stock ({inventoryData.lowStock})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Out of Stock ({inventoryData.outOfStock})</span>
              </div>
            </div>

            {inventoryData.lowStockProducts.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 overflow-hidden">
                <div className="bg-yellow-50 px-5 py-4 border-b border-yellow-100">
                  <h3 className="font-semibold text-yellow-800">⚠️ Low Stock Products (&lt;10 units)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-5 py-3 text-left">Product Name</th>
                        <th className="px-5 py-3 text-right">Current Stock</th>
                        <th className="px-5 py-3 text-left">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {inventoryData.lowStockProducts.map((product, idx) => (
                        <tr key={idx} className="hover:bg-yellow-50/30 transition">
                          <td className="px-5 py-3 font-medium text-gray-800">{product.name}</td>
                          <td className="px-5 py-3 text-right font-semibold text-yellow-600">{product.stock}</td>
                          <td className="px-5 py-3 text-gray-500">{product.category || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={downloadCSV} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg transition flex items-center gap-2">
                📥 Download CSV
              </button>
            </div>
          </div>
        )}

        {/* Tax Report */}
        {reportType === 'tax' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100">
                <p className="text-sm text-gray-500 mb-2">Total Tax Collected</p>
                <p className="text-2xl font-bold text-gray-800">₹{taxData.totalTax.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">{taxData.period}</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100">
                <p className="text-sm text-gray-500 mb-2">GST Breakdown</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>5% GST</span><span className="font-semibold">₹{taxData.gst5.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>12% GST</span><span className="font-semibold">₹{taxData.gst12.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>18% GST</span><span className="font-semibold">₹{taxData.gst18.toLocaleString()}</span></div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
                <p className="text-sm text-gray-500 mb-2">Tax Period</p>
                <p className="text-lg font-semibold text-purple-600">{getDateRangeText(dateRange)}</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Tax Distribution by GST Slab</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>GST 5%</span>
                    <span className="font-medium">₹{taxData.gst5.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(taxData.gst5 / taxData.totalTax) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>GST 12%</span>
                    <span className="font-medium">₹{taxData.gst12.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(taxData.gst12 / taxData.totalTax) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>GST 18%</span>
                    <span className="font-medium">₹{taxData.gst18.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-pink-500 h-2 rounded-full" style={{ width: `${(taxData.gst18 / taxData.totalTax) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={downloadCSV} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg transition flex items-center gap-2">
                📥 Download CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminReports;
