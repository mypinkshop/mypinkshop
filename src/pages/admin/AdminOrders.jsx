import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import toast from 'react-hot-toast';

function AdminOrders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' ya 'returns'
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

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadOrders(token);
  }, [navigate]);

  const loadOrders = async (token) => {
    try {
      setLoading(true);
      setError('');

      const ordersRes = await fetch(`${API_URL}/api/orders/all`, {
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

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        // ✅ Backend se populate ho kar aaye customerName, customerEmail, vendorName
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } else {
        setError('Failed to load orders');
        toast.error('Failed to load orders');
      }

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

      if (res.ok) {
        toast.success(`✅ Order status updated to ${newStatus}`);
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
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

  // ✅ MPS Order ID helper
  const getOrderId = (order) => {
    return order.orderNumber || order.orderId || order._id;
  };

  // ✅ Customer Name/Email helper
  const getCustomerName = (order) => {
    return order.buyerName || order.customerName || order.userId?.name || order.userId?.email || 'Customer';
  };

  const getCustomerEmail = (order) => {
    return order.buyerEmail || order.customerEmail || order.userId?.email || '';
  };

  // ✅ Brand helper
  const getBrand = (order) => {
    return order.vendorName || order.brand || order.vendorId?.name || 'N/A';
  };

  // ✅ Filter logic: Order tab mein cancelled hide karo, Cancelled tab mein sirf cancelled
  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'cancelled') return order.status?.toLowerCase() === 'cancelled';
    if (order.status?.toLowerCase() === 'cancelled') return false; // Main table mein cancelled hide

    if (filterStatus !== 'all' && order.status?.toLowerCase() !== filterStatus) return false;
    if (filterBrand !== 'all' && getBrand(order) !== filterBrand) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return getOrderId(order).toLowerCase().includes(searchLower) || 
             getCustomerName(order).toLowerCase().includes(searchLower) ||
             getCustomerEmail(order).toLowerCase().includes(searchLower);
    }
    return true;
  });

  const filteredReturns = returns.filter(r => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (r.orderId || r._id || '').toLowerCase().includes(searchLower) || 
             (r.customerName || r.customer || '').toLowerCase().includes(searchLower);
    }
    return true;
  });

  // ✅ Stats Calculation
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => !['cancelled', 'delivered'].includes(o.status?.toLowerCase())).length;
  const shippedOrders = orders.filter(o => o.status?.toLowerCase() === 'shipped').length;
  const pendingReturns = returns.filter(r => r.status === 'pending').length;
  const cancelledOrders = orders.filter(o => o.status?.toLowerCase() === 'cancelled').length;

  // ✅ Brand List
  const brands = [...new Set(orders.map(order => getBrand(order)))];

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-14 h-14 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg font-medium">Loading Orders...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md border border-gray-700">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <AdminSidebar />
      
      {/* Header */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 sm:px-6 py-4 fixed top-0 right-0 left-0 md:left-64 z-40 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">📋 Orders & Returns</h1>
            <p className="text-gray-400 text-xs mt-0.5">Manage customer orders and return requests</p>
          </div>
          <div className="w-full sm:w-auto">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search by Order ID or Customer..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 lg:w-80 pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500 placeholder-gray-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64">
        <div className="pt-24 px-4 md:px-6 pb-8">
          
          {/* Clickable Stats Cards (Dark & Colorful) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button 
              onClick={() => { setActiveTab('orders'); setFilterStatus('all'); }}
              className={`group text-left rounded-2xl p-5 border transition-all hover:scale-105 ${
                activeTab === 'orders' && filterStatus === 'all' 
                  ? 'bg-gradient-to-br from-pink-600 to-rose-600 border-pink-500 shadow-pink-900/50' 
                  : 'bg-gradient-to-br from-gray-800 to-gray-700 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-300 text-xs font-medium">Total Orders</p>
                <span className="text-2xl">📦</span>
              </div>
              <p className={`text-3xl font-bold ${activeTab === 'orders' && filterStatus === 'all' ? 'text-white' : 'text-white'}`}>{totalOrders}</p>
            </button>

            <button 
              onClick={() => { setActiveTab('orders'); setFilterStatus('processing'); }}
              className={`group text-left rounded-2xl p-5 border transition-all hover:scale-105 ${
                filterStatus === 'processing' 
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-500 shadow-purple-900/50' 
                  : 'bg-gradient-to-br from-gray-800 to-gray-700 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-300 text-xs font-medium">Active Orders</p>
                <span className="text-2xl">⚙️</span>
              </div>
              <p className="text-3xl font-bold text-white">{activeOrders}</p>
            </button>

            <button 
              onClick={() => { setActiveTab('orders'); setFilterStatus('shipped'); }}
              className={`group text-left rounded-2xl p-5 border transition-all hover:scale-105 ${
                filterStatus === 'shipped' 
                  ? 'bg-gradient-to-br from-blue-600 to-cyan-600 border-blue-500 shadow-blue-900/50' 
                  : 'bg-gradient-to-br from-gray-800 to-gray-700 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-300 text-xs font-medium">Shipped Orders</p>
                <span className="text-2xl">🚚</span>
              </div>
              <p className="text-3xl font-bold text-white">{shippedOrders}</p>
            </button>

            <button 
              onClick={() => { setActiveTab('returns'); setFilterStatus('all'); }}
              className={`group text-left rounded-2xl p-5 border transition-all hover:scale-105 ${
                activeTab === 'returns' 
                  ? 'bg-gradient-to-br from-orange-600 to-amber-600 border-orange-500 shadow-orange-900/50' 
                  : 'bg-gradient-to-br from-gray-800 to-gray-700 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-300 text-xs font-medium">Pending Returns</p>
                <span className="text-2xl">🔄</span>
              </div>
              <p className="text-3xl font-bold text-white">{pendingReturns}</p>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-4 border-b border-gray-700 mb-6">
            <button
              onClick={() => { setActiveTab('orders'); setFilterStatus('all'); }}
              className={`px-5 py-2.5 text-sm font-medium transition-all ${activeTab === 'orders' ? 'text-pink-400 border-b-2 border-pink-500' : 'text-gray-400 hover:text-white'}`}
            >
              📋 Orders ({orders.filter(o => o.status?.toLowerCase() !== 'cancelled').length})
            </button>
            <button
              onClick={() => { setActiveTab('returns'); setFilterStatus('all'); }}
              className={`px-5 py-2.5 text-sm font-medium transition-all ${activeTab === 'returns' ? 'text-pink-400 border-b-2 border-pink-500' : 'text-gray-400 hover:text-white'}`}
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
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      filterStatus === opt.value
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <label className="text-sm text-gray-400 font-medium">🏷️ Brand:</label>
                <select 
                  value={filterBrand} 
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500"
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
            <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-800 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3.5 text-left text-gray-300">Order ID</th>
                      <th className="px-4 py-3.5 text-left text-gray-300">Customer</th>
                      <th className="px-4 py-3.5 text-left text-gray-300">Brand</th>
                      <th className="px-4 py-3.5 text-right text-gray-300">Amount</th>
                      <th className="px-4 py-3.5 text-center text-gray-300">Items</th>
                      <th className="px-4 py-3.5 text-center text-gray-300">Date</th>
                      <th className="px-4 py-3.5 text-center text-gray-300">Payment</th>
                      <th className="px-4 py-3.5 text-center text-gray-300">Status</th>
                      <th className="px-4 py-3.5 text-center text-gray-300">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
                          <div className="text-5xl mb-3">📦</div>
                          <p>No orders found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-800/60 transition cursor-pointer" onClick={() => { setSelectedOrder(order); setShowDetailsModal(true); }}>
                          <td className="px-4 py-3">
                            <p className="font-mono text-sm font-medium text-white">#{getOrderId(order)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-200">{getCustomerName(order)}</p>
                            <p className="text-xs text-gray-500">{getCustomerEmail(order)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-pink-900/30 text-pink-300 px-2 py-1 rounded-full border border-pink-800">
                              {getBrand(order)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-white">₹{(order.total || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-center text-gray-400">{order.items?.length || 0}</td>
                          <td className="px-4 py-3 text-center text-gray-500 text-xs">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs bg-gray-800 border border-gray-700 px-2 py-1 rounded-full text-gray-300">{order.paymentMethod || 'COD'}</span>
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
                                onChange={(e) => updateOrderStatus(order._id, e.target.value)} 
                                disabled={processingId === order._id}
                                className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-pink-500 disabled:opacity-50"
                              >
                                <option value="pending">⏳ Pending</option>
                                <option value="processing">⚙️ Processing</option>
                                <option value="confirmed">✓ Confirmed</option>
                                <option value="shipped">🚚 Shipped</option>
                                <option value="delivered">✅ Delivered</option>
                                <option value="cancelled">❌ Cancelled</option>
                              </select>
                            ) : (
                              <span className="text-xs text-gray-500">Locked</span>
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
            <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-800 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3.5 text-left text-gray-300">Return ID</th>
                      <th className="px-4 py-3.5 text-left text-gray-300">Order ID</th>
                      <th className="px-4 py-3.5 text-left text-gray-300">Customer</th>
                      <th className="px-4 py-3.5 text-left text-gray-300">Product</th>
                      <th className="px-4 py-3.5 text-left text-gray-300">Reason</th>
                      <th className="px-4 py-3.5 text-right text-gray-300">Amount</th>
                      <th className="px-4 py-3.5 text-center text-gray-300">Status</th>
                      <th className="px-4 py-3.5 text-center text-gray-300">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredReturns.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                          <div className="text-5xl mb-3">🔄</div>
                          <p>No return requests found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredReturns.map((returnReq) => (
                        <tr key={returnReq._id || returnReq.id} className="hover:bg-gray-800/60 transition">
                          <td className="px-4 py-3 font-mono text-xs text-gray-300">#{returnReq._id?.slice(-6) || returnReq.id}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-300">#{returnReq.orderId?.slice(-6) || returnReq.orderId}</td>
                          <td className="px-4 py-3 font-medium text-gray-200">{returnReq.customerName || returnReq.customer}</td>
                          <td className="px-4 py-3 text-gray-400">{returnReq.productName || returnReq.product}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{returnReq.reason}</td>
                          <td className="px-4 py-3 text-right font-semibold text-white">₹{returnReq.amount || 0}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              returnReq.status === 'approved' ? 'bg-green-900/50 text-green-300 border border-green-800' : 
                              returnReq.status === 'rejected' ? 'bg-red-900/50 text-red-300 border border-red-800' : 
                              'bg-yellow-900/50 text-yellow-300 border border-yellow-800'
                            }`}>
                              {returnReq.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {returnReq.status === 'pending' && (
                              <div className="flex gap-2 justify-center">
                                <button onClick={() => updateReturnStatus(returnReq._id || returnReq.id, 'approved')} disabled={processingId === (returnReq._id || returnReq.id)} className="px-2 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition disabled:opacity-50">✅ Approve</button>
                                <button onClick={() => updateReturnStatus(returnReq._id || returnReq.id, 'rejected')} disabled={processingId === (returnReq._id || returnReq.id)} className="px-2 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition disabled:opacity-50">❌ Reject</button>
                              </div>
                            )}
                            {returnReq.status !== 'pending' && (
                              <span className="text-xs text-gray-500">Processed</span>
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
            <p className="text-xs text-gray-500">
              Showing {activeTab === 'orders' ? filteredOrders.length : filteredReturns.length} of {activeTab === 'orders' ? orders.length : returns.length} items
            </p>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">📋 Order Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-4 text-white">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Order ID</p><p className="font-mono font-medium text-white">#{getOrderId(selectedOrder)}</p></div>
                <div><p className="text-xs text-gray-500">Date</p><p className="font-medium">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">Customer</p><p className="font-medium">{getCustomerName(selectedOrder)}</p></div>
                <div><p className="text-xs text-gray-500">Brand</p><p className="font-medium">{getBrand(selectedOrder)}</p></div>
                <div><p className="text-xs text-gray-500">Payment Method</p><p className="font-medium">{selectedOrder.paymentMethod || 'COD'}</p></div>
                <div><p className="text-xs text-gray-500">Total Amount</p><p className="font-bold text-pink-400">₹{(selectedOrder.total || 0).toLocaleString()}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedOrder.status)}`}>{getStatusText(selectedOrder.status)}</span></div>
                {selectedOrder.trackingNumber && (
                  <div><p className="text-xs text-gray-500">Tracking</p><p className="font-medium text-blue-400">#{selectedOrder.trackingNumber}</p></div>
                )}
              </div>
              
              <div className="pt-4 border-t border-gray-800">
                <h4 className="font-semibold text-white mb-3">🛍️ Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-white">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        {item.vendorName && (
                          <p className="text-xs text-pink-400">Brand: {item.vendorName}</p>
                        )}
                      </div>
                      <p className="font-semibold text-white">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedOrder.address && (
                <div className="pt-4 border-t border-gray-800">
                  <h4 className="font-semibold text-white mb-2">📍 Shipping Address</h4>
                  <div className="text-sm text-gray-400">
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
