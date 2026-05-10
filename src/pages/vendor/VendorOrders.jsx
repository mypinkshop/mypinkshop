import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('vendorToken');

  useEffect(() => {
    if (!token) {
      navigate('/vendor/login');
      return;
    }

    setOrders([
      { id: '#MPS-1001', customer: 'Priya Sharma', amount: 2598, status: 'delivered', date: '2024-05-10', items: 2 },
      { id: '#MPS-1002', customer: 'Aditi Singh', amount: 1798, status: 'shipped', date: '2024-05-09', items: 1 },
      { id: '#MPS-1003', customer: 'Neha Gupta', amount: 899, status: 'pending', date: '2024-05-09', items: 1 },
      { id: '#MPS-1004', customer: 'Riya Mehta', amount: 3499, status: 'processing', date: '2024-05-08', items: 3 },
    ]);
    setLoading(false);
  }, [token, navigate]);

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    alert(`Order ${orderId} status updated to ${newStatus}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">
      <VendorHeader />
      <VendorSidebar activeTab="orders" />

      <main className="ml-64 pt-16 p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
            <p className="text-gray-500 mt-1">Track and manage customer orders</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-pink-100">
            <table className="w-full text-sm">
              <thead className="bg-pink-50">
                <tr className="border-b border-pink-100">
                  <th className="px-6 py-3 text-left text-gray-600">Order ID</th>
                  <th className="px-6 py-3 text-left text-gray-600">Customer</th>
                  <th className="px-6 py-3 text-left text-gray-600">Items</th>
                  <th className="px-6 py-3 text-left text-gray-600">Amount</th>
                  <th className="px-6 py-3 text-left text-gray-600">Date</th>
                  <th className="px-6 py-3 text-left text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-pink-50/50">
                    <td className="px-6 py-3 font-medium">{order.id}</td>
                    <td className="px-6 py-3">{order.customer}</td>
                    <td className="px-6 py-3">{order.items} items</td>
                    <td className="px-6 py-3">₹{order.amount}</td>
                    <td className="px-6 py-3">{order.date}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="px-2 py-1 rounded-lg text-sm border border-pink-200 bg-white"
                      >
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
      </main>
    </div>
  );
}

export default VendorOrders;
