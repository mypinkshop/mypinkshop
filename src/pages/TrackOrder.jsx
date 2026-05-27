import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

function TrackOrder() {
  const { orderId } = useParams();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const foundOrder = allOrders.find(o => o.id === orderId && o.customerEmail === user.email);
    
    if (foundOrder) {
      setOrder(foundOrder);
      
      if (foundOrder.tracking) {
        const completedStages = foundOrder.tracking.filter(s => s.completed === true).length;
        const totalStages = foundOrder.tracking.length;
        setProgress((completedStages / totalStages) * 100);
      } else {
        const statusProgress = {
          'pending': 20,
          'confirmed': 40,
          'processing': 60,
          'shipped': 75,
          'delivered': 100,
          'cancelled': 0
        };
        setProgress(statusProgress[foundOrder.status] || 0);
      }
    }
    setLoading(false);
  }, [orderId, user, navigate]);

  const cancelOrder = () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
      const updatedOrders = allOrders.map(o => 
        o.id === orderId ? { ...o, status: 'cancelled' } : o
      );
      localStorage.setItem('adminOrdersList', JSON.stringify(updatedOrders));
      setOrder({ ...order, status: 'cancelled' });
      alert('Order cancelled successfully!');
      navigate('/my-orders');
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'bg-green-500';
      case 'shipped': return 'bg-blue-500';
      case 'processing': return 'bg-purple-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-purple-100 text-purple-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'Delivered';
      case 'shipped': return 'Shipped';
      case 'processing': return 'Processing';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Pending';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-lg p-12 max-w-md mx-auto border border-gray-200 shadow-sm">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Order Not Found</h2>
            <p className="text-gray-500 mb-6">The order you're looking for doesn't exist.</p>
            <Link to="/my-orders" className="inline-block bg-pink-600 text-white px-6 py-2 rounded hover:bg-pink-700 transition">
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Top Bar */}
      <div className="bg-gray-900 text-white py-2 text-center text-sm">
        Free Shipping on ₹999+ | Easy Returns | Secure Shopping
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-pink-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">M</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">MyPinkShop</h1>
                <p className="text-[9px] sm:text-[10px] text-gray-400">FOR THE GIRLIES</p>
              </div>
            </Link>

            <div className="flex-1 max-w-md lg:max-w-2xl">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search for products..."
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-300 rounded focus:outline-none focus:border-pink-500 text-sm sm:text-base"
                  onKeyPress={(e) => e.key === 'Enter' && navigate(`/shop?search=${e.target.value}`)}
                />
                <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-pink-600 text-white px-4 sm:px-6 py-1.5 rounded text-sm font-medium hover:bg-pink-700 transition">
                  Search
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
              <Link to="/wishlist" className="relative p-1.5 sm:p-2 text-gray-600 hover:text-pink-600 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{wishlistCount}</span>}
              </Link>
              
              <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-600 hover:text-pink-600 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{cartCount}</span>}
              </Link>
              
              {user ? <Avatar user={user} onLogout={logout} /> : 
                <Link to="/login" className="p-1.5 sm:p-2 text-gray-600 hover:text-pink-600 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              }
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-pink-600">Home</Link>
          <span>/</span>
          <Link to="/my-orders" className="hover:text-pink-600">My Orders</Link>
          <span>/</span>
          <span className="text-gray-700">Track Order #{order.id}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        
        {/* Order Status Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Track Order</h1>
              <p className="text-gray-500 text-sm mt-1">Order ID: <span className="font-mono">{order.id}</span></p>
              <p className="text-xs text-gray-400 mt-1">
                Placed on {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadgeColor(order.status)}`}>
                {getStatusText(order.status)}
              </div>
              {order.status === 'pending' && (
                <button
                  onClick={cancelOrder}
                  className="block mt-2 text-sm text-red-500 hover:text-red-600 transition"
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
                className={`h-2 rounded-full transition-all duration-500 ${getStatusColor(order.status)}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              {progress === 100 ? 'Order Delivered' : `${Math.round(progress)}% Complete`}
            </p>
          </div>

          {/* Estimated Delivery */}
          {order.estimatedDelivery && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-xl">🚚</span>
                <div>
                  <p className="text-sm text-gray-500">Estimated Delivery</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tracking Timeline */}
          {order.tracking && order.tracking.length > 0 && (
            <div className="space-y-0">
              {order.tracking.map((step, idx) => (
                <div key={idx} className="relative pb-8 last:pb-0">
                  {idx !== order.tracking.length - 1 && (
                    <div className={`absolute left-5 top-10 w-0.5 h-12 ${step.completed ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                  )}
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                      step.completed ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step.completed ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <h3 className={`font-semibold ${step.completed ? 'text-gray-800' : 'text-gray-400'}`}>
                            {step.stage}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                        </div>
                        {step.timestamp && step.timestamp !== 'Pending' && (
                          <p className="text-xs text-gray-400">{step.timestamp}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(!order.tracking || order.tracking.length === 0) && (
            <div className="text-center py-8">
              <p className="text-gray-500">Tracking information will be updated soon.</p>
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Order Summary</h3>
          
          {/* Items */}
          <div className="space-y-3 mb-4">
            {order.items && order.items.map((item, idx) => (
              <div key={idx} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                {/* ✅ PRODUCT IMAGE */}
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl text-gray-400">
                    🛍️
                  </div>
                )}
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

          {/* Price Breakdown */}
          <div className="space-y-2 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-800">₹{order.subtotal || order.total}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-₹{order.discount}</span>
              </div>
            )}
            {order.deliveryCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery Charges</span>
                <span className="text-gray-800">₹{order.deliveryCharges}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (GST)</span>
                <span className="text-gray-800">₹{order.tax}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-800">Total Amount</span>
              <span className="font-bold text-pink-600 text-lg">₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Shipping Address</h3>
          <p className="text-gray-600 text-sm">{order.shippingAddress}</p>
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">Payment: {order.paymentMethod}</p>
            <p className="text-xs text-gray-500">Delivery: {order.deliveryMethod === 'express' ? 'Express' : 'Standard'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Link to="/my-orders" className="flex-1 text-center border border-pink-600 text-pink-600 py-3 rounded font-medium hover:bg-pink-50 transition">
            ← Back to Orders
          </Link>
          <Link to="/shop" className="flex-1 text-center bg-pink-600 text-white py-3 rounded font-medium hover:bg-pink-700 transition">
            Continue Shopping →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-pink-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <h3 className="font-bold text-white text-lg">MyPinkShop</h3>
              </div>
              <p className="text-sm">Luxury beauty and fashion for the modern woman.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/shop?category=skincare" className="hover:text-pink-500 transition">Skincare</Link></li>
                <li><Link to="/shop?category=makeup" className="hover:text-pink-500 transition">Makeup</Link></li>
                <li><Link to="/shop?category=clothing" className="hover:text-pink-500 transition">Clothing</Link></li>
                <li><Link to="/shop?category=accessories" className="hover:text-pink-500 transition">Accessories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-pink-500 transition">Contact Us</Link></li>
                <li><Link to="/faqs" className="hover:text-pink-500 transition">FAQs</Link></li>
                <li><Link to="/shipping" className="hover:text-pink-500 transition">Shipping Info</Link></li>
                <li><Link to="/returns" className="hover:text-pink-500 transition">Returns Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Follow Us</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-pink-500 transition">Instagram</a></li>
                <li><a href="#" className="hover:text-pink-500 transition">TikTok</a></li>
                <li><a href="#" className="hover:text-pink-500 transition">Pinterest</a></li>
                <li><a href="#" className="hover:text-pink-500 transition">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-gray-800">
            <p className="text-sm">© 2026 MyPinkShop. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default TrackOrder;
