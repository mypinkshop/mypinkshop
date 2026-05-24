import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendor');
    
    if (!token || !vendorData) {
      navigate('/vendor/login');
      return;
    }

    const vendor = JSON.parse(vendorData);
    const vendorName = vendor.brandName || vendor.name;
    
    // Get real orders from localStorage
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    
    // Filter orders by this vendor
    const myOrders = allOrders.filter(order => order.vendor === vendorName);
    
    setOrders(myOrders);
    setLoading(false);
  }, [navigate]);

  const updateOrderStatus = (orderId, newStatus) => {
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const updatedOrders = allOrders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    localStorage.setItem('adminOrdersList', JSON.stringify(updatedOrders));
    
    // Update local state
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    alert(`Order ${orderId} status updated to ${newStatus}`);
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

  const filteredOrders = orders.filter(order => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (searchTerm && !order.id.toLowerCase().includes(searchTerm.toLowerCase()) && !order.customer?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
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
      <VendorSidebar activeTab="orders" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
              <p className="text-gray-500 text-sm">Manage customer orders</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Total Orders</p><p className="text-2xl font-bold">{stats.total}</p></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Pending</p><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Shipped</p><p className="text-2xl font-bold text-blue-600">{stats.shipped}</p></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Delivered</p><p className="text-2xl font-bold text-green-600">{stats.delivered}</p></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Cancelled</p><p className="text-2xl font-bold text-red-600">{stats.cancelled}</p></div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
              <div className="flex gap-2">
                <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 rounded-lg text-sm ${filterStatus === 'all' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>All</button>
                <button onClick={() => setFilterStatus('pending')} className={`px-3 py-1.5 rounded-lg text-sm ${filterStatus === 'pending' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Pending</button>
                <button onClick={() => setFilterStatus('processing')} className={`px-3 py-1.5 rounded-lg text-sm ${filterStatus === 'processing' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Processing</button>
                <button onClick={() => setFilterStatus('shipped')} className={`px-3 py-1.5 rounded-lg text-sm ${filterStatus === 'shipped' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Shipped</button>
                <button onClick={() => setFilterStatus('delivered')} className={`px-3 py-1.5 rounded-lg text-sm ${filterStatus === 'delivered' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Delivered</button>
              </div>
              <div className="relative">
                <input type="text" placeholder="Search by order ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left">Order ID</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Items</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Date</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length === 0 ? (
                    <tr className="hover:bg-gray-50"><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No orders found</td></tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{order.id}</td>
                        <td className="px-4 py-3">{order.customer}</td>
                        <td className="px-4 py-3">{order.items} items</td>
                        <td className="px-4 py-3 text-right font-semibold">₹{order.amount}</td>
                        <td className="px-4 py-3 text-center">{order.date}</td>
                        <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(order.status)}`}>{order.status}</span></td>
                        <td className="px-4 py-3 text-center">
                          <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="px-2 py-1 border rounded text-xs">
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
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

export default VendorOrders;
