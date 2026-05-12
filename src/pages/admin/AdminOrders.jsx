import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return; }
    const mockOrders = [
      { id: '#MPS1001', customer: 'Priya Sharma', email: 'priya@gmail.com', phone: '9988776655', vendor: 'Nykaa Beauty', amount: 2598, status: 'delivered', date: '2024-05-15', items: 2, paymentMethod: 'COD', address: '123, Andheri West, Mumbai' },
      { id: '#MPS1002', customer: 'Aditi Singh', email: 'aditi@gmail.com', phone: '9876543210', vendor: 'Mamaearth', amount: 1798, status: 'shipped', date: '2024-05-14', items: 2, paymentMethod: 'Card', address: '456, Indiranagar, Bangalore' },
      { id: '#MPS1003', customer: 'Neha Gupta', email: 'neha@gmail.com', phone: '9765432109', vendor: 'Sugar Cosmetics', amount: 899, status: 'pending', date: '2024-05-13', items: 1, paymentMethod: 'UPI', address: '789, Koregaon Park, Pune' },
    ];
    setOrders(mockOrders);
    setLoading(false);
  }, [token, navigate]);

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
              <p className="text-gray-500 text-sm">Manage all customer orders</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="flex gap-2">
              {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${filterStatus === status ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {status} ({orders.filter(o => o.status === status).length})
                </button>
              ))}
            </div>
            <div className="relative">
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="px-6 py-3 text-left">Order ID</th>
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Vendor</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.filter(order => filterStatus === 'all' ? true : order.status === filterStatus).filter(order => searchTerm ? order.id.includes(searchTerm) || order.customer.includes(searchTerm) : true).map(order => (
                  <tr key={order.id} className="hover:bg-gray-50" onClick={() => { setSelectedOrder(order); setShowDetails(true); }}>
                    <td className="px-6 py-4 font-medium">{order.id}</td>
                    <td className="px-6 py-4">{order.customer}</td>
                    <td className="px-6 py-4">{order.vendor}</td>
                    <td className="px-6 py-4">₹{order.amount}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>{order.status}</span></td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="px-2 py-1 border border-gray-200 rounded-lg text-sm">
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
        </main>
      </div>

      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between">
              <h3 className="text-xl font-bold">Order Details</h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-400">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <p><strong>Order ID:</strong> {selectedOrder.id}</p>
              <p><strong>Customer:</strong> {selectedOrder.customer}</p>
              <p><strong>Amount:</strong> ₹{selectedOrder.amount}</p>
              <p><strong>Status:</strong> {selectedOrder.status}</p>
              <p><strong>Payment:</strong> {selectedOrder.paymentMethod}</p>
              <p><strong>Address:</strong> {selectedOrder.address}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
