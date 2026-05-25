import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorOrderReports() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last30');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
    
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const myOrders = allOrders.filter(o => o.vendor === vendorName);
    setOrders(myOrders);
    filterOrdersByDateRange(myOrders, dateRange);
    
    setLoading(false);
  }, [navigate, dateRange]);

  const filterOrdersByDateRange = (ordersList, range) => {
    const today = new Date();
    let filtered = [...ordersList];
    
    if (range === 'last7') {
      const cutoff = new Date();
      cutoff.setDate(today.getDate() - 7);
      filtered = ordersList.filter(o => new Date(o.date) >= cutoff);
    } else if (range === 'last30') {
      const cutoff = new Date();
      cutoff.setDate(today.getDate() - 30);
      filtered = ordersList.filter(o => new Date(o.date) >= cutoff);
    } else if (range === 'last90') {
      const cutoff = new Date();
      cutoff.setDate(today.getDate() - 90);
      filtered = ordersList.filter(o => new Date(o.date) >= cutoff);
    } else if (range === 'custom' && startDate && endDate) {
      filtered = ordersList.filter(o => o.date >= startDate && o.date <= endDate);
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

  const downloadCSV = () => {
    const csvData = [
      ['Order ID', 'Customer', 'Date', 'Items', 'Amount', 'Status', 'Payment Method'],
      ...filteredOrders.map(order => [
        order.id,
        order.customer,
        order.date,
        order.items || 1,
        order.amount,
        order.status,
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
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totalStats = {
    totalOrders: filteredOrders.length,
    totalAmount: filteredOrders.reduce((sum, o) => sum + o.amount, 0),
    averageOrderValue: filteredOrders.length > 0 ? filteredOrders.reduce((sum, o) => sum + o.amount, 0) / filteredOrders.length : 0,
    pendingOrders: filteredOrders.filter(o => o.status === 'pending').length,
    shippedOrders: filteredOrders.filter(o => o.status === 'shipped').length,
    deliveredOrders: filteredOrders.filter(o => o.status === 'delivered').length,
    cancelledOrders: filteredOrders.filter(o => o.status === 'cancelled').length,
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
      <VendorSidebar activeTab="order-reports" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Order Reports</h1>
              <p className="text-gray-500 text-sm">View and download your order data</p>
            </div>
            <button onClick={downloadCSV} className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-700 transition">
              Download CSV
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold">{totalStats.totalOrders}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">₹{totalStats.totalAmount.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Average Order Value</p>
              <p className="text-2xl font-bold">₹{Math.round(totalStats.averageOrderValue).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Delivered Orders</p>
              <p className="text-2xl font-bold text-green-600">{totalStats.deliveredOrders}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex gap-2">
                  <button onClick={() => handleDateRangeChange('last7')} className={`px-3 py-1.5 rounded-lg text-sm ${dateRange === 'last7' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Last 7 Days</button>
                  <button onClick={() => handleDateRangeChange('last30')} className={`px-3 py-1.5 rounded-lg text-sm ${dateRange === 'last30' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Last 30 Days</button>
                  <button onClick={() => handleDateRangeChange('last90')} className={`px-3 py-1.5 rounded-lg text-sm ${dateRange === 'last90' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Last 90 Days</button>
                  <button onClick={() => setDateRange('custom')} className={`px-3 py-1.5 rounded-lg text-sm ${dateRange === 'custom' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Custom</button>
                </div>
                {dateRange === 'custom' && (
                  <div className="flex gap-2 items-center">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded text-sm" />
                    <span className="text-gray-500">to</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded text-sm" />
                    <button onClick={applyCustomDate} className="bg-pink-600 text-white px-3 py-1.5 rounded text-sm">Apply</button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="px-5 py-3 text-left">Order ID</th>
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-center">Date</th>
                    <th className="px-5 py-3 text-center">Items</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-center">Payment</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </td>
                </thead>
                <tbody className="divide-y">
                  {filteredOrders.length === 0 ? (
                    <tr className="hover:bg-gray-50">
                      <td colSpan="7" className="px-5 py-8 text-center text-gray-500">No orders found in this date range</td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium">{order.id}</td>
                        <td className="px-5 py-3">{order.customer}</td>
                        <td className="px-5 py-3 text-center">{order.date}</td>
                        <td className="px-5 py-3 text-center">{order.items || 1}</td>
                        <td className="px-5 py-3 text-right font-semibold">₹{order.amount.toLocaleString()}</td>
                        <td className="px-5 py-3 text-center text-xs">{order.paymentMethod || 'COD'}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                       </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorOrderReports;
