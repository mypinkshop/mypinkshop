import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Mock orders data (will connect to API later)
    setOrders([
      {
        id: 'MPS-1001',
        date: '2024-05-15',
        total: 2598,
        status: 'delivered',
        items: [
          { id: 1, name: 'Glass Skin Serum', quantity: 2, price: 1299, image: '💧' },
          { id: 2, name: 'Rice Water Toner', quantity: 1, price: 899, image: '🌸' }
        ],
        tracking: [
          { stage: 'Order Placed', date: '2024-05-15 10:30 AM', completed: true },
          { stage: 'Confirmed', date: '2024-05-15 02:15 PM', completed: true },
          { stage: 'Shipped', date: '2024-05-16 09:00 AM', completed: true },
          { stage: 'Out for Delivery', date: '2024-05-17 08:30 AM', completed: true },
          { stage: 'Delivered', date: '2024-05-17 03:45 PM', completed: true }
        ],
        shippingAddress: '123, Andheri West, Mumbai - 400053',
        paymentMethod: 'COD'
      },
      {
        id: 'MPS-1002',
        date: '2024-05-10',
        total: 1798,
        status: 'shipped',
        items: [
          { id: 3, name: 'Cherry Lip Tint', quantity: 2, price: 599, image: '🍒' },
          { id: 4, name: 'Baby Pink Blush', quantity: 1, price: 799, image: '🎀' }
        ],
        tracking: [
          { stage: 'Order Placed', date: '2024-05-10 11:20 AM', completed: true },
          { stage: 'Confirmed', date: '2024-05-10 03:45 PM', completed: true },
          { stage: 'Shipped', date: '2024-05-11 10:00 AM', completed: true },
          { stage: 'Out for Delivery', date: 'Pending', completed: false },
          { stage: 'Delivered', date: 'Pending', completed: false }
        ],
        shippingAddress: '456, Indiranagar, Bangalore - 560038',
        paymentMethod: 'Card'
      },
      {
        id: 'MPS-1003',
        date: '2024-05-05',
        total: 899,
        status: 'pending',
        items: [
          { id: 5, name: 'Coquette Bow Dress', quantity: 1, price: 2999, image: '🎀' }
        ],
        tracking: [
          { stage: 'Order Placed', date: '2024-05-05 09:15 AM', completed: true },
          { stage: 'Confirmed', date: 'Pending', completed: false },
          { stage: 'Shipped', date: 'Pending', completed: false },
          { stage: 'Out for Delivery', date: 'Pending', completed: false },
          { stage: 'Delivered', date: 'Pending', completed: false }
        ],
        shippingAddress: '789, Koregaon Park, Pune - 411001',
        paymentMethod: 'UPI'
      }
    ]);
    setLoading(false);
  }, [user, navigate]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'bg-green-500';
      case 'shipped': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'delivered': return 'Delivered';
      case 'shipped': return 'Shipped';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const cancelOrder = (orderId) => {
    if(window.confirm('Are you sure you want to cancel this order?')) {
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      ));
      alert('Order cancelled successfully!');
    }
  };

  const reorder = (order) => {
    order.items.forEach(item => {
      // Add to cart logic will go here
      console.log('Adding to cart:', item.name);
    });
    alert('Items added to cart!');
    navigate('/cart');
  };

  const trackOrder = (order) => {
    setSelectedOrder(order);
    setShowTrackModal(true);
  };

  const TrackModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTrackModal(false)}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-pink-100 p-5 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Track Order #{selectedOrder?.id}</h3>
          <button onClick={() => setShowTrackModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <div className="p-6">
          {/* Timeline */}
          <div className="relative">
            {selectedOrder?.tracking.map((step, idx) => (
              <div key={idx} className="flex mb-8 relative">
                <div className="flex flex-col items-center mr-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${step.completed ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {step.completed ? '✓' : idx + 1}
                  </div>
                  {idx < selectedOrder.tracking.length - 1 && (
                    <div className={`w-0.5 h-12 mt-1 ${step.completed ? 'bg-pink-500' : 'bg-gray-200'}`}></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>{step.stage}</p>
                  <p className="text-sm text-gray-500">{step.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">
        {/* Header */}
        <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-pink-100">
          <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
            <Link to="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">MyPinkShop</h1>
            </Link>
            <Link to="/cart" className="relative">
              <span className="text-2xl">🛒</span>
            </Link>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="text-8xl mb-6">📦</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">No orders yet</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't placed any orders.</p>
          <Link to="/" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-full hover:shadow-lg transition inline-block">
            Start Shopping →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-pink-100">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <Link to="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">MyPinkShop</h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/wishlist" className="text-2xl">🤍</Link>
            <Link to="/cart" className="relative">
              <span className="text-2xl">🛒</span>
            </Link>
            <Link to="/profile" className="text-2xl">👤</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
          <p className="text-gray-500 mt-1">Track and manage your orders</p>
        </div>

        {/* Order Cards */}
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-md transition">
              {/* Order Header */}
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-6 py-4 border-b border-pink-100 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <p className="text-sm text-gray-500">Order #{order.id}</p>
                  <p className="text-xs text-gray-400">Placed on {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-lg font-bold text-pink-600">₹{order.total.toLocaleString()}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="px-6 py-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-3 border-b border-pink-50 last:border-0">
                    <div className="w-16 h-16 bg-pink-50 rounded-xl flex items-center justify-center text-3xl">
                      {item.image}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{item.name}</h4>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">₹{item.price * item.quantity}</p>
                      <p className="text-xs text-gray-400">₹{item.price} each</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Actions */}
              <div className="bg-gray-50 px-6 py-4 border-t border-pink-100 flex flex-wrap gap-3 justify-end">
                <button onClick={() => trackOrder(order)} className="px-4 py-2 text-pink-600 border border-pink-200 rounded-lg hover:bg-pink-50 transition text-sm font-medium">
                  Track Order
                </button>
                {order.status === 'pending' && (
                  <button onClick={() => cancelOrder(order.id)} className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition text-sm font-medium">
                    Cancel Order
                  </button>
                )}
                {order.status === 'delivered' && (
                  <>
                    <button className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                      Download Invoice
                    </button>
                    <button onClick={() => reorder(order)} className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition text-sm font-medium">
                      Buy Again
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Track Modal */}
      {showTrackModal && <TrackModal />}
    </div>
  );
}

export default MyOrders;
