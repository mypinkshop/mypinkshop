import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function TrackOrder() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Mock order data (will connect to API later)
  const ordersData = {
    'MPS1001': {
      id: 'MPS1001',
      date: '2024-05-15',
      total: 2598,
      status: 'delivered',
      estimatedDelivery: '2024-05-17',
      items: [
        { id: 1, name: 'Glass Skin Serum', quantity: 2, price: 1299, image: '💧' },
        { id: 2, name: 'Rice Water Toner', quantity: 1, price: 899, image: '🌸' }
      ],
      shippingAddress: '123, Andheri West, Mumbai - 400053',
      paymentMethod: 'COD',
      tracking: [
        { stage: 'Order Placed', status: 'completed', timestamp: '2024-05-15 10:30 AM', description: 'Your order has been placed successfully' },
        { stage: 'Order Confirmed', status: 'completed', timestamp: '2024-05-15 02:15 PM', description: 'Seller has confirmed your order' },
        { stage: 'Processing', status: 'completed', timestamp: '2024-05-16 09:00 AM', description: 'Seller is preparing your item' },
        { stage: 'Shipped', status: 'completed', timestamp: '2024-05-16 06:30 PM', description: 'Your order has been shipped' },
        { stage: 'Out for Delivery', status: 'completed', timestamp: '2024-05-17 08:30 AM', description: 'Delivery agent is on the way' },
        { stage: 'Delivered', status: 'completed', timestamp: '2024-05-17 03:45 PM', description: 'Your order has been delivered' }
      ]
    },
    'MPS1002': {
      id: 'MPS1002',
      date: '2024-05-10',
      total: 1798,
      status: 'shipped',
      estimatedDelivery: '2024-05-12',
      items: [
        { id: 3, name: 'Cherry Lip Tint', quantity: 2, price: 599, image: '🍒' },
        { id: 5, name: 'Baby Pink Blush', quantity: 1, price: 799, image: '🎀' }
      ],
      shippingAddress: '456, Indiranagar, Bangalore - 560038',
      paymentMethod: 'Card',
      tracking: [
        { stage: 'Order Placed', status: 'completed', timestamp: '2024-05-10 11:20 AM', description: 'Your order has been placed successfully' },
        { stage: 'Order Confirmed', status: 'completed', timestamp: '2024-05-10 03:45 PM', description: 'Seller has confirmed your order' },
        { stage: 'Processing', status: 'completed', timestamp: '2024-05-11 10:00 AM', description: 'Seller is preparing your item' },
        { stage: 'Shipped', status: 'completed', timestamp: '2024-05-11 06:00 PM', description: 'Your order has been shipped' },
        { stage: 'Out for Delivery', status: 'pending', timestamp: 'Pending', description: 'Will be out for delivery soon' },
        { stage: 'Delivered', status: 'pending', timestamp: 'Pending', description: 'Yet to be delivered' }
      ]
    },
    'MPS1003': {
      id: 'MPS1003',
      date: '2024-05-12',
      total: 899,
      status: 'pending',
      estimatedDelivery: '2024-05-15',
      items: [
        { id: 6, name: 'Coquette Bow Dress', quantity: 1, price: 2999, image: '🎀' }
      ],
      shippingAddress: '789, Koregaon Park, Pune - 411001',
      paymentMethod: 'UPI',
      tracking: [
        { stage: 'Order Placed', status: 'completed', timestamp: '2024-05-12 09:15 AM', description: 'Your order has been placed successfully' },
        { stage: 'Order Confirmed', status: 'pending', timestamp: 'Pending', description: 'Awaiting seller confirmation' },
        { stage: 'Processing', status: 'pending', timestamp: 'Pending', description: 'Will start processing soon' },
        { stage: 'Shipped', status: 'pending', timestamp: 'Pending', description: 'Yet to be shipped' },
        { stage: 'Out for Delivery', status: 'pending', timestamp: 'Pending', description: 'Yet to be out for delivery' },
        { stage: 'Delivered', status: 'pending', timestamp: 'Pending', description: 'Yet to be delivered' }
      ]
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setTimeout(() => {
      const foundOrder = ordersData[orderId];
      if (foundOrder) {
        setOrder(foundOrder);
        // Calculate progress percentage
        const completedStages = foundOrder.tracking.filter(s => s.status === 'completed').length;
        const totalStages = foundOrder.tracking.length;
        setProgress((completedStages / totalStages) * 100);
      }
      setLoading(false);
    }, 500);
  }, [orderId, user, navigate]);

  const cancelOrder = () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      alert('Order cancelled successfully!');
      navigate('/my-orders');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = (stage) => {
    const icons = {
      'Order Placed': '📦',
      'Order Confirmed': '✅',
      'Processing': '⚙️',
      'Shipped': '🚚',
      'Out for Delivery': '🚛',
      'Delivered': '🏠'
    };
    return icons[stage] || '📍';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-6">The order you're looking for doesn't exist.</p>
          <Link to="/my-orders" className="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition">
            View My Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50">
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">MyPinkShop</h1>
          </Link>
          <div className="flex items-center gap-5">
            <Link to="/wishlist" className="text-2xl text-gray-600 hover:text-pink-500 transition">🤍</Link>
            <Link to="/cart" className="text-2xl text-gray-600 hover:text-pink-500 transition">🛒</Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-pink-500">Home</Link>
          <span>/</span>
          <Link to="/my-orders" className="hover:text-pink-500">My Orders</Link>
          <span>/</span>
          <span className="text-pink-600">Track Order #{order.id}</span>
        </div>

        {/* Order Status Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100 mb-6">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Track Order</h1>
              <p className="text-gray-500 text-sm mt-1">Order ID: #{order.id}</p>
            </div>
            <div className="text-right">
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </div>
              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <button
                  onClick={cancelOrder}
                  className="block mt-2 text-sm text-red-500 hover:text-red-600"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              {progress === 100 ? 'Order Delivered' : `${Math.round(progress)}% Complete`}
            </p>
          </div>

          {/* Estimated Delivery */}
          <div className="bg-pink-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚚</span>
              <div>
                <p className="text-sm text-gray-500">Estimated Delivery</p>
                <p className="font-semibold text-gray-800">
                  {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="space-y-0">
            {order.tracking.map((step, idx) => (
              <div key={idx} className="relative pb-8 last:pb-0">
                {idx !== order.tracking.length - 1 && (
                  <div className={`absolute left-5 top-10 w-0.5 h-12 ${step.status === 'completed' ? 'bg-pink-500' : 'bg-gray-200'}`}></div>
                )}
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                    step.status === 'completed' ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step.status === 'completed' ? '✓' : getStatusIcon(step.stage)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <h3 className={`font-semibold ${step.status === 'completed' ? 'text-gray-800' : 'text-gray-400'}`}>
                          {step.stage}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                      </div>
                      {step.timestamp !== 'Pending' && (
                        <p className="text-xs text-gray-400">{step.timestamp}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Order Summary</h3>
          
          {/* Items */}
          <div className="space-y-3 mb-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex gap-3 pb-3 border-b border-pink-50 last:border-0">
                <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-2xl">
                  {item.image}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">₹{item.price * item.quantity}</p>
                  <p className="text-xs text-gray-400">₹{item.price} each</p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between pt-3 border-t border-pink-100">
            <span className="font-semibold">Total Amount</span>
            <span className="font-bold text-pink-600 text-lg">₹{order.total}</span>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
          <h3 className="font-semibold text-gray-800 mb-3">Shipping Address</h3>
          <p className="text-gray-600 text-sm">{order.shippingAddress}</p>
          <p className="text-gray-500 text-xs mt-2">Payment Method: {order.paymentMethod}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <Link to="/my-orders" className="flex-1 text-center border border-pink-500 text-pink-600 py-3 rounded-full font-medium hover:bg-pink-50 transition">
            Back to Orders
          </Link>
          <Link to="/shop" className="flex-1 text-center bg-pink-500 text-white py-3 rounded-full font-medium hover:bg-pink-600 transition">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TrackOrder;
