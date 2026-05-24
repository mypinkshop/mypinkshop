import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
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
    
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    
    const returnRequests = allOrders
      .filter(order => order.vendor === vendorName && order.returnRequested === true)
      .map(order => ({
        id: order.returnId || 'RET-' + order.id,
        orderId: order.id,
        customer: order.customer,
        product: order.productName || order.items?.[0]?.name || 'Product',
        reason: order.returnReason || 'Not specified',
        status: order.returnStatus || 'pending',
        requestedDate: order.returnRequestedDate || order.date,
        amount: order.amount,
        returnType: order.returnType || 'refund',
        resolution: order.returnResolution || '',
      }));
    
    setReturns(returnRequests);
    setLoading(false);
  }, [navigate]);

  const updateReturnStatus = (returnId, newStatus) => {
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const updatedOrders = allOrders.map(order => {
      if (order.returnId === returnId || order.id === returnId.replace('RET-', '')) {
        return { ...order, returnStatus: newStatus };
      }
      return order;
    });
    localStorage.setItem('adminOrdersList', JSON.stringify(updatedOrders));
    
    setReturns(returns.map(r => r.id === returnId ? { ...r, status: newStatus } : r));
    alert(`Return ${returnId} ${newStatus === 'approved' ? 'approved' : 'rejected'}`);
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
    if (searchTerm && !r.orderId.toLowerCase().includes(searchTerm.toLowerCase()) && !r.customer.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    rejected: returns.filter(r => r.status === 'rejected').length,
    totalAmount: returns.reduce((sum, r) => sum + r.amount, 0),
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
      <VendorSidebar activeTab="returns" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Returns & Refunds</h1>
              <p className="text-gray-500 text-sm">Manage customer return requests</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500">Total Returns</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500">Total Refund Amount</p>
              <p className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
              <div className="flex gap-2">
                <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 rounded-lg text-sm ${filterStatus === 'all' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>All Returns</button>
                <button onClick={() => setFilterStatus('pending')} className={`px-3 py-1.5 rounded-lg text-sm ${filterStatus === 'pending' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Pending ({stats.pending})</button>
                <button onClick={() => setFilterStatus('approved')} className={`px-3 py-1.5 rounded-lg text-sm ${filterStatus === 'approved' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Approved</button>
                <button onClick={() => setFilterStatus('rejected')} className={`px-3 py-1.5 rounded-lg text-sm ${filterStatus === 'rejected' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Rejected</button>
              </div>
              <div className="relative">
                <input type="text" placeholder="Search by order ID or customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left">Return ID</th>
                    <th className="px-4 py-3 text-left">Order ID</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Requested</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReturns.length === 0 ? (
                    <tr className="hover:bg-gray-50">
                      <td colSpan="9" className="px-4 py-8 text-center text-gray-500">No return requests found</td>
                    </tr>
                  ) : (
                    filteredReturns.map(returnReq => (
                      <tr key={returnReq.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedReturn(returnReq); setShowDetails(true); }}>
                        <td className="px-4 py-3 font-mono text-xs">{returnReq.id}</td>
                        <td className="px-4 py-3">{returnReq.orderId}</td>
                        <td className="px-4 py-3">{returnReq.customer}</td>
                        <td className="px-4 py-3">{returnReq.product}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{returnReq.reason}</td>
                        <td className="px-4 py-3 text-right font-medium">₹{returnReq.amount}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{returnReq.requestedDate}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(returnReq.status)}`}>{getStatusText(returnReq.status)}</span>
                        </td>
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {returnReq.status === 'pending' && (
                            <div className="flex gap-2 justify-center">
                              <button onClick={() => updateReturnStatus(returnReq.id, 'approved')} className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600">Approve</button>
                              <button onClick={() => updateReturnStatus(returnReq.id, 'rejected')} className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">Reject</button>
                            </div>
                          )}
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

      {showDetails && selectedReturn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold">Return Details</h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400">Return ID</p><p className="font-mono text-sm">{selectedReturn.id}</p></div>
                <div><p className="text-xs text-gray-400">Order ID</p><p className="font-medium">{selectedReturn.orderId}</p></div>
                <div><p className="text-xs text-gray-400">Customer</p><p className="font-medium">{selectedReturn.customer}</p></div>
                <div><p className="text-xs text-gray-400">Requested Date</p><p className="text-sm">{selectedReturn.requestedDate}</p></div>
              </div>
              <div><p className="text-xs text-gray-400">Product</p><p className="font-medium">{selectedReturn.product}</p></div>
              <div><p className="text-xs text-gray-400">Reason for Return</p><p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedReturn.reason}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400">Refund Amount</p><p className="text-xl font-bold text-pink-600">₹{selectedReturn.amount}</p></div>
                <div><p className="text-xs text-gray-400">Return Type</p><p className="capitalize">{selectedReturn.returnType}</p></div>
              </div>
              {selectedReturn.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button onClick={() => { updateReturnStatus(selectedReturn.id, 'approved'); setShowDetails(false); }} className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">Approve Return</button>
                  <button onClick={() => { updateReturnStatus(selectedReturn.id, 'rejected'); setShowDetails(false); }} className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">Reject Return</button>
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
