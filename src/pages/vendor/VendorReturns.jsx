import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [vendorInfo, setVendorInfo] = useState(null);
  const [processingId, setProcessingId] = useState(null);
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

      // 2. Fetch vendor returns/orders with returns
      const ordersRes = await fetch(`${API_URL}/api/vendor/orders?returnRequested=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();
      
      if (ordersData.success) {
        const orders = ordersData.orders || [];
        
        // Transform orders to returns format
        const returnRequests = orders
          .filter(order => order.returnRequested === true || order.returnStatus)
          .map(order => ({
            id: order.returnId || `RET-${order._id?.slice(-6) || 'N/A'}`,
            orderId: order._id || order.id,
            customer: order.customerName || order.customer || 'Customer',
            product: order.items?.[0]?.name || 'Product',
            reason: order.returnReason || 'Not specified',
            status: order.returnStatus || 'pending',
            requestedDate: order.returnRequestedDate || order.createdAt,
            amount: order.total || order.amount || 0,
            returnType: order.returnType || 'refund',
            resolution: order.returnResolution || '',
          }));
        
        setReturns(returnRequests);
      } else {
        setError(ordersData.message || 'Failed to load returns');
      }
    } catch (err) {
      console.error('Error fetching returns:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update return status
  const updateReturnStatus = async (returnId, newStatus) => {
    const token = localStorage.getItem('vendorToken');
    setProcessingId(returnId);
    
    try {
      const res = await fetch(`${API_URL}/api/vendor/returns/${returnId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus,
          resolvedAt: new Date().toISOString()
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setReturns(returns.map(r => 
          r.id === returnId ? { ...r, status: newStatus } : r
        ));
        alert(`✅ Return ${returnId} ${newStatus === 'approved' ? 'approved' : 'rejected'}`);
        if (showDetails) setShowDetails(false);
      } else {
        alert(data.message || 'Failed to update return status');
      }
    } catch (err) {
      console.error('Error updating return:', err);
      alert('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending Review';
      default: return status;
    }
  };

  const filteredReturns = returns.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const orderId = r.orderId?.toLowerCase() || '';
      const customer = r.customer?.toLowerCase() || '';
      const product = r.product?.toLowerCase() || '';
      if (!orderId.includes(search) && !customer.includes(search) && !product.includes(search)) return false;
    }
    return true;
  });

  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    rejected: returns.filter(r => r.status === 'rejected').length,
    totalAmount: returns.reduce((sum, r) => sum + (r.amount || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading returns...</p>
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
      <VendorSidebar activeTab="returns" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">🔄 Returns & Refunds</h1>
              <p className="text-gray-500 text-sm">Manage customer return requests</p>
            </div>
            <div className="text-sm text-gray-500">
              Total: <span className="font-bold text-gray-800">{stats.total}</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
              <p className="text-xs text-gray-500">Total Returns</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
              <p className="text-xs text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
              <p className="text-xs text-gray-500">Total Refund Amount</p>
              <p className="text-2xl font-bold text-pink-600">₹{stats.totalAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 rounded-lg text-sm transition ${filterStatus === 'all' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All Returns</button>
                <button onClick={() => setFilterStatus('pending')} className={`px-3 py-1.5 rounded-lg text-sm transition ${filterStatus === 'pending' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Pending ({stats.pending})</button>
                <button onClick={() => setFilterStatus('approved')} className={`px-3 py-1.5 rounded-lg text-sm transition ${filterStatus === 'approved' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Approved</button>
                <button onClick={() => setFilterStatus('rejected')} className={`px-3 py-1.5 rounded-lg text-sm transition ${filterStatus === 'rejected' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Rejected</button>
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search by order ID, customer, product..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-64 pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200" 
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>

            {/* Returns Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Return ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Order</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Product</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Amount</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                        🔄 No return requests found
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map(returnReq => (
                      <tr 
                        key={returnReq.id} 
                        className="hover:bg-gray-50 transition cursor-pointer" 
                        onClick={() => { setSelectedReturn(returnReq); setShowDetails(true); }}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-pink-600">{returnReq.id}</td>
                        <td className="px-4 py-3 font-medium">#{returnReq.orderId?.slice(-6) || 'N/A'}</td>
                        <td className="px-4 py-3">{returnReq.customer}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{returnReq.product}</td>
                        <td className="px-4 py-3 text-right font-bold">₹{returnReq.amount}</td>
                        <td className="px-4 py-3 text-center text-gray-500">
                          {returnReq.requestedDate ? new Date(returnReq.requestedDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(returnReq.status)}`}>
                            {getStatusText(returnReq.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {returnReq.status === 'pending' && (
                            <div className="flex gap-2 justify-center">
                              <button 
                                onClick={() => updateReturnStatus(returnReq.id, 'approved')} 
                                disabled={processingId === returnReq.id}
                                className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition disabled:opacity-50"
                              >
                                ✅ Approve
                              </button>
                              <button 
                                onClick={() => updateReturnStatus(returnReq.id, 'rejected')} 
                                disabled={processingId === returnReq.id}
                                className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition disabled:opacity-50"
                              >
                                ❌ Reject
                              </button>
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

          {/* Return Policy Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">📋 Return Policy</p>
            <p className="text-xs text-blue-600 mt-1">
              Returns are processed within 3-5 business days. Approved returns will be refunded to the original payment method.
            </p>
          </div>
        </div>
      </main>

      {/* Return Details Modal */}
      {showDetails && selectedReturn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 p-5 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">📋 Return Details</h3>
              <button 
                onClick={() => setShowDetails(false)} 
                className="text-gray-400 hover:text-gray-600 text-2xl transition"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Return ID</p>
                  <p className="font-mono text-sm text-pink-600">{selectedReturn.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Order ID</p>
                  <p className="font-medium">#{selectedReturn.orderId?.slice(-6) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Customer</p>
                  <p className="font-medium">{selectedReturn.customer}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Requested Date</p>
                  <p className="text-sm text-gray-500">
                    {selectedReturn.requestedDate ? new Date(selectedReturn.requestedDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Product</p>
                <p className="font-medium">{selectedReturn.product}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Reason for Return</p>
                <p className="text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedReturn.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Refund Amount</p>
                  <p className="text-xl font-bold text-pink-600">₹{selectedReturn.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Return Type</p>
                  <p className="capitalize font-medium">{selectedReturn.returnType}</p>
                </div>
              </div>
              {selectedReturn.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => { updateReturnStatus(selectedReturn.id, 'approved'); }} 
                    disabled={processingId === selectedReturn.id}
                    className="flex-1 bg-green-500 text-white py-2.5 rounded-lg font-medium hover:bg-green-600 transition disabled:opacity-50"
                  >
                    ✅ Approve Return
                  </button>
                  <button 
                    onClick={() => { updateReturnStatus(selectedReturn.id, 'rejected'); }} 
                    disabled={processingId === selectedReturn.id}
                    className="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50"
                  >
                    ❌ Reject Return
                  </button>
                </div>
              )}
              {selectedReturn.status !== 'pending' && (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">
                    Status: <span className="font-semibold">{selectedReturn.status === 'approved' ? '✅ Approved' : '❌ Rejected'}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorReturns;
