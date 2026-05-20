import { useState } from 'react';

function AdminOrders() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([
    { id: '#MPS-1001', customer: 'Priya Sharma', vendor: 'Nykaa Beauty', amount: 2598, status: 'delivered', date: '2025-05-15', items: 2, paymentMethod: 'COD', returnRequested: false },
    { id: '#MPS-1002', customer: 'Aditi Singh', vendor: 'Mamaearth', amount: 1798, status: 'shipped', date: '2025-05-14', items: 1, paymentMethod: 'Card', returnRequested: false },
    { id: '#MPS-1003', customer: 'Neha Gupta', vendor: 'Sugar Cosmetics', amount: 899, status: 'pending', date: '2025-05-13', items: 1, paymentMethod: 'UPI', returnRequested: false },
    { id: '#MPS-1004', customer: 'Riya Mehta', vendor: 'Nykaa Beauty', amount: 3499, status: 'processing', date: '2025-05-12', items: 3, paymentMethod: 'COD', returnRequested: true },
  ]);

  const [returns, setReturns] = useState([
    { id: 'RET-001', orderId: '#MPS-1004', customer: 'Riya Mehta', product: 'Glass Skin Serum', reason: 'Damaged product', status: 'pending', requestedDate: '2025-05-16', amount: 1299 },
    { id: 'RET-002', orderId: '#MPS-1001', customer: 'Priya Sharma', product: 'Cherry Lip Tint', reason: 'Wrong size', status: 'approved', requestedDate: '2025-05-14', amount: 599 },
  ]);

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
    alert(`Order ${orderId} status updated to ${newStatus}`);
  };

  const updateReturnStatus = (returnId, newStatus) => {
    setReturns(returns.map(r => r.id === returnId ? { ...r, status: newStatus } : r));
    alert(`Return ${returnId} ${newStatus}`);
  };

  const getStatusBadge = (status) => {
    const styles = {
      delivered: 'bg-green-100 text-green-700',
      shipped: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-800">←</button>
          <h1 className="text-xl font-semibold text-gray-800">Orders & Returns</h1>
        </div>
      </div>

      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'orders' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Orders ({orders.length})</button>
          <button onClick={() => setActiveTab('returns')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'returns' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Returns ({returns.length})</button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Order ID</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Vendor</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Items</th>
                    <th className="px-4 py-3 text-center">Date</th>
                    <th className="px-4 py-3 text-center">Payment</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{order.id}{order.returnRequested && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1 rounded">Return</span>}</td>
                      <td className="px-4 py-3">{order.customer}</td>
                      <td className="px-4 py-3">{order.vendor}</td>
                      <td className="px-4 py-3 text-right font-medium">₹{order.amount}</td>
                      <td className="px-4 py-3 text-center">{order.items}</td>
                      <td className="px-4 py-3 text-center">{order.date}</td>
                      <td className="px-4 py-3 text-center text-xs">{order.paymentMethod}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Returns Tab */}
        {activeTab === 'returns' && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
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
                  {returns.map(returnReq => (
                    <tr key={returnReq.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{returnReq.id}</td>
                      <td className="px-4 py-3">{returnReq.orderId}</td>
                      <td className="px-4 py-3">{returnReq.customer}</td>
                      <td className="px-4 py-3">{returnReq.product}</td>
                      <td className="px-4 py-3 text-gray-500">{returnReq.reason}</td>
                      <td className="px-4 py-3 text-right font-medium">₹{returnReq.amount}</td>
                      <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs ${returnReq.status === 'approved' ? 'bg-green-100 text-green-700' : returnReq.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{returnReq.status}</span></td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          {returnReq.status === 'pending' && (
                            <>
                              <button onClick={() => updateReturnStatus(returnReq.id, 'approved')} className="text-green-600 text-xs hover:underline">Approve</button>
                              <button onClick={() => updateReturnStatus(returnReq.id, 'rejected')} className="text-red-600 text-xs hover:underline">Reject</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOrders;
