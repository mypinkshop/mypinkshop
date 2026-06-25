import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorInfo, setVendorInfo] = useState(null);
  const [acceptingOrder, setAcceptingOrder] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      navigate('/vendor/login');
      return;
    }
    fetchVendorProfile(token);
    fetchOrders(token);
  }, [navigate]);

  // ✅ Fetch vendor profile
  const fetchVendorProfile = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/vendor/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVendorInfo(data.vendor);
      }
    } catch (err) {
      console.error('Error fetching vendor:', err);
    }
  };

  // ✅ Fetch orders from backend
  const fetchOrders = async (token) => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`${API_URL}/api/vendor/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ ACCEPT ORDER - Shiprocket Integration
  const acceptOrder = async (orderId) => {
    if (!window.confirm('✅ Accept this order? Shiprocket will be notified for pickup.')) return;
    
    const token = localStorage.getItem('vendorToken');
    setAcceptingOrder(orderId);

    try {
      const res = await fetch(`${API_URL}/api/vendor/orders/${orderId}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: 'confirmed',
          acceptedAt: new Date().toISOString(),
          vendorId: vendorInfo?._id || vendorInfo?.id
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setOrders(orders.map(order => 
          order._id === orderId ? { 
            ...order, 
            status: 'confirmed',
            trackingNumber: data.trackingNumber,
            courierName: data.courierName || 'Shiprocket',
            shipmentId: data.shipmentId
          } : order
        ));
        
        alert(`✅ Order accepted!\nTracking: ${data.trackingNumber || 'Generating...'}\nCourier: ${data.courierName || 'Shiprocket'}`);
        fetchOrders(token);
      } else {
        alert(data.message || 'Failed to accept order');
      }
    } catch (err) {
      console.error('Error accepting order:', err);
      alert('Network error. Please try again.');
    } finally {
      setAcceptingOrder(null);
    }
  };

  // ✅ REJECT ORDER
  const rejectOrder = async (orderId) => {
    if (!window.confirm('❌ Reject this order?')) return;
    
    const token = localStorage.getItem('vendorToken');

    try {
      const res = await fetch(`${API_URL}/api/vendor/orders/${orderId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      const data = await res.json();
      
      if (data.success) {
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: 'cancelled' } : order
        ));
        alert('❌ Order rejected');
        fetchOrders(token);
      } else {
        alert(data.message || 'Failed to reject order');
      }
    } catch (err) {
      console.error('Error rejecting order:', err);
      alert('Network error. Please try again.');
    }
  };

  // ✅ DOWNLOAD INVOICE
  const downloadInvoice = async (orderId) => {
    const token = localStorage.getItem('vendorToken');
    setDownloading(orderId);
    try {
      const res = await fetch(`${API_URL}/api/shipping/invoice/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.open(data.url, '_blank');
      } else {
        alert('Invoice not available yet. Please try again later.');
      }
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice');
    } finally {
      setDownloading(null);
    }
  };

  // ✅ DOWNLOAD LABEL
  const downloadLabel = async (orderId) => {
    const token = localStorage.getItem('vendorToken');
    setDownloading(orderId);
    try {
      const res = await fetch(`${API_URL}/api/shipping/label/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.open(data.url, '_blank');
      } else {
        alert('Label not available yet. Please try again later.');
      }
    } catch (err) {
      console.error('Error downloading label:', err);
      alert('Failed to download label');
    } finally {
      setDownloading(null);
    }
  };

  // ✅ Update order status (Manual)
  const updateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem('vendorToken');
    try {
      const res = await fetch(`${API_URL}/api/vendor/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
        alert(`✅ Order status updated to ${newStatus}`);
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating order:', err);
      alert('Network error. Please try again.');
    }
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

  const filteredOrders = orders.filter(order => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const orderId = order._id?.toLowerCase() || '';
      const customer = order.customerName?.toLowerCase() || '';
      if (!orderId.includes(search) && !customer.includes(search)) return false;
    }
    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending' || o.status === 'processing').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
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
      <VendorSidebar activeTab="orders" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">📋 Orders</h1>
              <p className="text-gray-500 text-sm">Manage customer orders</p>
            </div>
            <div className="text-sm text-gray-500">
              Total: <span className="font-bold text-gray-800">{stats.total}</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
              <p className="text-xs text-gray-500">Confirmed</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.confirmed}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
              <p className="text-xs text-gray-500">Shipped</p>
              <p className="text-2xl font-bold text-blue-600">{stats.shipped}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
              <p className="text-xs text-gray-500">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
              <p className="text-xs text-gray-500">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 rounded-lg text-sm transition ${filterStatus === 'all' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
                <button onClick={() => setFilterStatus('pending')} className={`px-3 py-1.5 rounded-lg text-sm transition ${filterStatus === 'pending' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Pending</button>
                <button onClick={() => setFilterStatus('processing')} className={`px-3 py-1.5 rounded-lg text-sm transition ${filterStatus === 'processing' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Processing</button>
                <button onClick={() => setFilterStatus('confirmed')} className={`px-3 py-1.5 rounded-lg text-sm transition ${filterStatus === 'confirmed' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Confirmed</button>
                <button onClick={() => setFilterStatus('shipped')} className={`px-3 py-1.5 rounded-lg text-sm transition ${filterStatus === 'shipped' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Shipped</button>
                <button onClick={() => setFilterStatus('delivered')} className={`px-3 py-1.5 rounded-lg text-sm transition ${filterStatus === 'delivered' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Delivered</button>
                <button onClick={() => setFilterStatus('cancelled')} className={`px-3 py-1.5 rounded-lg text-sm transition ${filterStatus === 'cancelled' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancelled</button>
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search by order ID or customer..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-64 pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200" 
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Order ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Items</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Amount</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Tracking</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                        🛒 No orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order._id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-pink-600">#{order._id?.slice(-8) || 'N/A'}</td>
                        <td className="px-4 py-3">{order.customerName || 'Customer'}</td>
                        <td className="px-4 py-3 text-center">{order.items?.length || 0}</td>
                        <td className="px-4 py-3 text-right font-bold">₹{order.total || 0}</td>
                        <td className="px-4 py-3 text-center text-gray-500">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                            {order.status || 'pending'}
                          </span>
                          {order.trackingNumber && (
                            <div className="text-[10px] text-gray-400 mt-1">#{order.trackingNumber}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {order.trackingNumber ? (
                            <div className="flex flex-col gap-1 items-center">
                              <a 
                                href={`https://shiprocket.co/track/${order.trackingNumber}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 text-xs"
                              >
                                🔗 Track
                              </a>
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => downloadInvoice(order._id)}
                                  disabled={downloading === order._id}
                                  className="bg-blue-500 text-white px-2 py-0.5 rounded text-[10px] hover:bg-blue-600 disabled:opacity-50"
                                >
                                  📄 Invoice
                                </button>
                                <button 
                                  onClick={() => downloadLabel(order._id)}
                                  disabled={downloading === order._id}
                                  className="bg-green-500 text-white px-2 py-0.5 rounded text-[10px] hover:bg-green-600 disabled:opacity-50"
                                >
                                  🏷️ Label
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {order.status === 'pending' ? (
                            <div className="flex gap-2 justify-center">
                              <button 
                                onClick={() => acceptOrder(order._id)} 
                                disabled={acceptingOrder === order._id}
                                className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-600 transition disabled:opacity-50 whitespace-nowrap"
                              >
                                {acceptingOrder === order._id ? '⏳' : '✅ Accept'}
                              </button>
                              <button 
                                onClick={() => rejectOrder(order._id)} 
                                className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-600 transition whitespace-nowrap"
                              >
                                ❌ Reject
                              </button>
                            </div>
                          ) : order.status !== 'delivered' && order.status !== 'cancelled' ? (
                            <select 
                              value={order.status || 'pending'} 
                              onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-pink-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          ) : (
                            <span className="text-xs text-gray-400">Locked</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800 font-medium">🚚 Shipping Powered by Shiprocket</p>
            <p className="text-xs text-blue-600 mt-1">
              Click <strong>"Accept"</strong> to confirm order and automatically create Shiprocket pickup request.
              Customer will receive tracking details via email/SMS.
            </p>
            <p className="text-xs text-blue-500 mt-2">
              📄 <strong>Invoice & Label:</strong> Available after order acceptance. Click to download.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorOrders;
