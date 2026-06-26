import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorOrderReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('last30');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

  // ✅ Fetch vendor data from backend
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
      
      if (ordersData.success) {
        setOrders(ordersData.orders || []);
        filterOrdersByDateRange(ordersData.orders || [], dateRange);
      } else {
        setError(ordersData.message || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Error fetching vendor data:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter orders by date range
  const filterOrdersByDateRange = (ordersList, range) => {
    const today = new Date();
    let filtered = [...ordersList];
    
    if (range === 'last7') {
      const cutoff = new Date();
      cutoff.setDate(today.getDate() - 7);
      filtered = ordersList.filter(o => {
        const orderDate = o.createdAt ? new Date(o.createdAt) : new Date(o.date);
        return orderDate >= cutoff;
      });
    } else if (range === 'last30') {
      const cutoff = new Date();
      cutoff.setDate(today.getDate() - 30);
      filtered = ordersList.filter(o => {
        const orderDate = o.createdAt ? new Date(o.createdAt) : new Date(o.date);
        return orderDate >= cutoff;
      });
    } else if (range === 'last90') {
      const cutoff = new Date();
      cutoff.setDate(today.getDate() - 90);
      filtered = ordersList.filter(o => {
        const orderDate = o.createdAt ? new Date(o.createdAt) : new Date(o.date);
        return orderDate >= cutoff;
      });
    } else if (range === 'custom' && startDate && endDate) {
      filtered = ordersList.filter(o => {
        const orderDate = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : o.date;
        return orderDate >= startDate && orderDate <= endDate;
      });
    }
    
    setFilteredOrders(filtered);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    filterOrdersByDateRange(orders, range);
  };

  const applyCustomDate = () => {
    if (startDate && endDate) {
      filterOrdersByDateRange(orders, 'custom');
    }
  };

  // ✅ Download CSV
  const downloadCSV = () => {
    const csvData = [
      ['Order ID', 'Customer', 'Date', 'Items', 'Amount', 'Status', 'Payment Method'],
      ...filteredOrders.map(order => [
        order._id || order.id || 'N/A',
        order.customerName || order.customer || 'Customer',
        order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : order.date || 'N/A',
        order.items?.length || 1,
        order.total || order.amount || 0,
        order.status || 'pending',
        order.paymentMethod || 'COD',
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-purple-100 text-purple-700';
      case 'confirmed': return 'bg-indigo-100 text-indigo-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totalStats = {
    totalOrders: filteredOrders.length,
    totalAmount: filteredOrders.reduce((sum, o) => sum + (o.total || o.amount || 0), 0),
    averageOrderValue: filteredOrders.length > 0 
      ? filteredOrders.reduce((sum, o) => sum + (o.total || o.amount || 0), 0) / filteredOrders.length 
      : 0,
    deliveredOrders: filteredOrders.filter(o => o.status === 'delivered').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading orders...</p>
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
      <VendorSidebar activeTab="order-reports" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">📊 Order Reports</h1>
              <p className="text-gray-500 text-sm">View and download your order data</p>
            </div>
            <button 
              onClick={downloadCSV} 
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg text-sm hover:shadow-lg transition flex items-center gap-2"
            >
              📥 Download CSV
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{totalStats.totalOrders}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">₹{totalStats.totalAmount.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Average Order Value</p>
              <p className="text-2xl font-bold text-blue-600">₹{Math.round(totalStats.averageOrderValue).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Delivered Orders</p>
              <p className="text-2xl font-bold text-green-600">{totalStats.deliveredOrders}</p>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-5 py-3 border-b border-gray-200">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleDateRangeChange('last7')} 
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${dateRange === 'last7' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Last 7 Days
                  </button>
                  <button 
                    onClick={() => handleDateRangeChange('last30')} 
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${dateRange === 'last30' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Last 30 Days
                  </button>
                  <button 
                    onClick={() => handleDateRangeChange('last90')} 
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${dateRange === 'last90' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Last 90 Days
                  </button>
                  <button 
                    onClick={() => setDateRange('custom')} 
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${dateRange === 'custom' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Custom
                  </button>
                </div>
                {dateRange === 'custom' && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200" 
                    />
                    <span className="text-gray-500">to</span>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200" 
                    />
                    <button 
                      onClick={applyCustomDate} 
                      className="bg-pink-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-pink-700 transition"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Order ID</th>
                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Customer</th>
                    <th className="px-5 py-3 text-center font-semibold text-gray-600">Date</th>
                    <th className="px-5 py-3 text-center font-semibold text-gray-600">Items</th>
                    <th className="px-5 py-3 text-right font-semibold text-gray-600">Amount</th>
                    <th className="px-5 py-3 text-center font-semibold text-gray-600">Payment</th>
                    <th className="px-5 py-3 text-center font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-5 py-8 text-center text-gray-400">
                        📭 No orders found in this date range
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order._id || order.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3 font-medium text-pink-600">
                          #{order._id?.slice(-8) || order.id || 'N/A'}
                        </td>
                        <td className="px-5 py-3">{order.customerName || order.customer || 'Customer'}</td>
                        <td className="px-5 py-3 text-center text-gray-500">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : order.date || 'N/A'}
                        </td>
                        <td className="px-5 py-3 text-center">{order.items?.length || 1}</td>
                        <td className="px-5 py-3 text-right font-bold">₹{(order.total || order.amount || 0).toLocaleString()}</td>
                        <td className="px-5 py-3 text-center text-xs">
                          {order.paymentMethod || 'COD'}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                            {order.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredOrders.length > 0 && (
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan="4" className="px-5 py-3 font-semibold text-gray-800">Total</td>
                      <td className="px-5 py-3 text-right font-bold text-green-600">
                        ₹{totalStats.totalAmount.toLocaleString()}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorOrderReports;
