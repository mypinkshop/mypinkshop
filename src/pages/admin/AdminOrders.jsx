import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import toast from 'react-hot-toast';

function AdminOrders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadOrders(token);
  }, [navigate]);

  // ✅ Load orders from backend
  const loadOrders = async (token) => {
    try {
      setLoading(true);
      setError('');

      // 1. Load all orders
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

      let ordersData = [];
      if (ordersRes.ok) {
        ordersData = await ordersRes.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } else {
        setError('Failed to load orders');
        toast.error('Failed to load orders');
      }

      // 2. Load returns
      const returnsRes = await fetch(`${API_URL}/api/returns/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (returnsRes.ok) {
        const returnsData = await returnsRes.json();
        setReturns(Array.isArray(returnsData) ? returnsData : []);
      }

    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem('adminToken');
    setProcessingId(orderId);

    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      if (res.ok) {
        toast.success(`✅ Order status updated to ${newStatus}`);
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
        updateLocalStorage(orderId, newStatus);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Update return status
  const updateReturnStatus = async (returnId, newStatus) => {
    const token = localStorage.getItem('adminToken');
    setProcessingId(returnId);

    try {
      const res = await fetch(`${API_URL}/api/returns/${returnId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      if (res.ok) {
        toast.success(`✅ Return ${newStatus}`);
        setReturns(returns.map(r => 
          r._id === returnId ? { ...r, status: newStatus } : r
        ));
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to update return status');
      }
    } catch (err) {
      console.error('Error updating return:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Update localStorage for compatibility
  const updateLocalStorage = (orderId, newStatus) => {
    try {
      const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
      const updatedAllOrders = allOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      localStorage.setItem('adminOrdersList', JSON.stringify(updatedAllOrders));
    } catch (e) {
      console.error('Error updating localStorage:', e);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      delivered: 'bg-green-100 text-green-700',
      shipped: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-purple-100 text-purple-700',
      confirmed: 'bg-indigo-100 text-indigo-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return '✅ Delivered';
      case 'shipped': return '🚚 Shipped';
      case 'pending': return '⏳ Pending';
      case 'processing': return '⚙️ Processing';
      case 'confirmed': return '✓ Confirmed';
      case 'cancelled': return '❌ Cancelled';
      default: return status || 'Pending';
    }
  };

  // ✅ Get unique brands from orders
  const brands = [...new Set(orders.map(order => order.brand || order.vendorName || 'Unknown'))];

  // ✅ Filter orders with brand filter
  const filteredOrders = orders.filter(order => {
    if (filterStatus !== 'all' && order.status?.toLowerCase() !== filterStatus) return false;
    if (filterBrand !== 'all' && order.brand !== filterBrand && order.vendorName !== filterBrand) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const orderId = (order._id || order.id || '').toLowerCase();
      const customer = (order.customerName || order.customerEmail || '').toLowerCase();
      return orderId.includes(searchLower) || customer.includes(searchLower);
    }
    return true;
  });

  const filteredReturns = returns.filter(r => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const orderId = (r.orderId || r._id || '').toLowerCase();
      const customer = (r.customerName || r.customer || '').toLowerCase();
      return orderId.includes(searchLower) || customer.includes(searchLower);
    }
    return true;
  });

  const statusOptions = [
    { value: 'all', label: 'All Status', icon: '📋' },
    { value: 'pending', label: 'Pending', icon: '⏳' },
    { value: 'processing', label: 'Processing', icon: '⚙️' },
    { value: 'confirmed', label: 'Confirmed', icon: '✓' },
    { value: 'shipped', label: 'Shipped', icon: '🚚' },
    { value: 'delivered', label: 'Delivered', icon: '✅' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminSidebar />
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 fixed top-0 right-0 left-0 md:left-64 z-40 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">📋 Orders & Returns</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage customer orders and return requests</p>
          </div>
          <div className="w-full sm:w-auto">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search by Order ID or Customer..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 lg:w-80 pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-gray-50"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64">
        <div className="pt-20 sm:pt-24 md:pt-24 px-3 sm:px-4 md:px-6 pb-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Total Orders</p>
                <span className="text-lg">📦</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Pending</p>
                <span className="text-lg">⏳</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending' || o.status === 'processing').length}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Shipped</p>
                <span className="text-lg">🚚</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'shipped').length}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Return Requests</p>
                <span className="text-lg">🔄</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{returns.filter(r => r.status === 'pending').length}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-4 border-b border-gray-200 mb-6">
            <button
              onClick={() => { setActiveTab('orders'); setFilterStatus('all'); }}
              className={`px-5 py-2 text-sm font-medium transition-all ${activeTab === 'orders' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              📋 Orders ({orders.length})
            </button>
            <button
              onClick={() => { setActiveTab('returns'); setFilterStatus('all'); }}
              className={`px-5 py-2 text-sm font-medium transition-all ${activeTab === 'returns' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              🔄 Returns ({returns.length})
            </button>
          </div>

          {/* Status & Brand Filter */}
          {activeTab === 'orders' && (
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterStatus(opt.value)}
                    className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      filterStatus === opt.value
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>

              {/* ✅ BRAND FILTER */}
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-sm text-gray-600 font-medium">🏷️ Brand:</label>
                <select 
                  value={filterBrand} 
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-white"
                >
                  <option value="all">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Orders Table */}
          {activeTab === 'orders' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">Order ID</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Brand</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Items</th>
                      <th className="px-4 py-3 text-center">Date</th>
                      <th className="px-4 py-3 text-center">Payment</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-12 text-center text-gray-400">
                          <div className="text-5xl mb-3">📦</div>
                          <p>No orders found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order._id || order.id} className="hover:bg-pink-50/30 transition cursor-pointer" onClick={() => { setSelectedOrder(order); setShowDetailsModal(true); }}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-mono text-sm font-medium text-gray-800">#{order._id?.slice(-8) || order.id}</p>
                              {order.returnRequested && (
                                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Return</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-800">{order.customerName || order.customerEmail?.split('@')[0] || 'Customer'}</p>
                              <p className="text-xs text-gray-400">{order.customerEmail}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">
                              {order.brand || order.vendorName || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-pink-600">₹{(order.total || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">{order.items?.length || 0}</td>
                          <td className="px-4 py-3 text-center text-gray-500 text-xs">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{order.paymentMethod || 'COD'}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            {order.status !== 'delivered' && order.status !== 'cancelled' ? (
                              <select 
                                value={order.status || 'pending'} 
                                onChange={(e) => updateOrderStatus(order._id || order.id, e.target.value)} 
                                disabled={processingId === (order._id || order.id)}
                                className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-pink-500 bg-white disabled:opacity-50"
                              >
                                <option value="pending">⏳ Pending</option>
                                <option value="processing">⚙️ Processing</option>
                                <option value="confirmed">✓ Confirmed</option>
                                <option value="shipped">🚚 Shipped</option>
                                <option value="delivered">✅ Delivered</option>
                                <option value="cancelled">❌ Cancelled</option>
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
          )}

          {/* Returns Table */}
          {activeTab === 'returns' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">Return ID</th>
                      <th className="px-4 py-3 text-left">Order ID</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Product</th>
                      <th className="px-4 py-3 text-left">Reason</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredReturns.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-12 text-center text-gray-400">
                          <div className="text-5xl mb-3">🔄</div>
                          <p>No return requests found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredReturns.map((returnReq) => (
                        <tr key={returnReq._id || returnReq.id} className="hover:bg-pink-50/30 transition">
                          <td className="px-4 py-3 font-mono text-xs text-gray-800">#{returnReq._id?.slice(-6) || returnReq.id}</td>
                          <td className="px-4 py-3 font-mono text-xs">#{returnReq.orderId?.slice(-6) || returnReq.orderId}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{returnReq.customerName || returnReq.customer}</td>
                          <td className="px-4 py-3 text-gray-600">{returnReq.productName || returnReq.product}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{returnReq.reason}</td>
                          <td className="px-4 py-3 text-right font-semibold text-pink-600">₹{returnReq.amount || 0}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              returnReq.status === 'approved' ? 'bg-green-100 text-green-700' : 
                              returnReq.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {returnReq.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {returnReq.status === 'pending' && (
                              <div className="flex gap-2 justify-center">
                                <button onClick={() => updateReturnStatus(returnReq._id || returnReq.id, 'approved')} disabled={processingId === (returnReq._id || returnReq.id)} className="px-2 py-1 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition disabled:opacity-50">✅ Approve</button>
                                <button onClick={() => updateReturnStatus(returnReq._id || returnReq.id, 'rejected')} disabled={processingId === (returnReq._id || returnReq.id)} className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition disabled:opacity-50">❌ Reject</button>
                              </div>
                            )}
                            {returnReq.status !== 'pending' && (
                              <span className="text-xs text-gray-400">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Showing {activeTab === 'orders' ? filteredOrders.length : filteredReturns.length} of {activeTab === 'orders' ? orders.length : returns.length} items
            </p>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">📋 Order Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Order ID</p><p className="font-mono font-medium">#{selectedOrder._id?.slice(-8) || selectedOrder.id}</p></div>
                <div><p className="text-xs text-gray-500">Date</p><p className="font-medium">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">Customer</p><p className="font-medium">{selectedOrder.customerName || selectedOrder.customerEmail || 'Customer'}</p></div>
                <div><p className="text-xs text-gray-500">Brand</p><p className="font-medium">{selectedOrder.brand || selectedOrder.vendorName || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">Payment Method</p><p className="font-medium">{selectedOrder.paymentMethod || 'COD'}</p></div>
                <div><p className="text-xs text-gray-500">Total Amount</p><p className="font-bold text-pink-600">₹{(selectedOrder.total || 0).toLocaleString()}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedOrder.status)}`}>{getStatusText(selectedOrder.status)}</span></div>
                {selectedOrder.trackingNumber && (
                  <div><p className="text-xs text-gray-500">Tracking</p><p className="font-medium text-blue-600">#{selectedOrder.trackingNumber}</p></div>
                )}
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-gray-800 mb-3">🛍️ Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        {item.vendorName && (
                          <p className="text-xs text-pink-500">Brand: {item.vendorName}</p>
                        )}
                      </div>
                      <p className="font-semibold text-pink-600">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedOrder.address && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-gray-800 mb-2">📍 Shipping Address</h4>
                  <div className="text-sm text-gray-600">
                    <p>{selectedOrder.address.fullName}</p>
                    <p>{selectedOrder.address.addressLine1}</p>
                    <p>{selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}</p>
                    <p>Phone: {selectedOrder.address.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
