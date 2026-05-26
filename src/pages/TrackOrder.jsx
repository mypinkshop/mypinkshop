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

    // Load REAL order from localStorage
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const foundOrder = allOrders.find(o => o.id === orderId && o.customerEmail === user.email);
    
    if (foundOrder) {
      setOrder(foundOrder);
      
      // Calculate progress based on tracking stages
      if (foundOrder.tracking) {
        const completedStages = foundOrder.tracking.filter(s => s.completed === true).length;
        const totalStages = foundOrder.tracking.length;
        setProgress((completedStages / totalStages) * 100);
      } else {
        // Default progress based on status
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
      case 'confirmed': return 'bg-cyan-500';
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
      case 'confirmed': return 'bg-cyan-100 text-cyan-700';
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
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Pending';
    }
  };

  const getStatusIcon = (stage) => {
    const icons = {
      'Order Placed': '📦',
      'Order Confirmed': '✅',
      'Confirmed': '✅',
      'Processing': '⚙️',
      'Shipped': '🚚',
      'Out for Delivery': '🚛',
      'Delivered': '🏠'
    };
    return icons[stage] || '📍';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        {/* Premium Top Bar */}
        <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
          <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
            <span>✨</span>
            <span>Free Shipping on ₹999+</span>
            <span className="hidden sm:inline">•</span>
            <span>Easy Returns</span>
            <span className="hidden sm:inline">•</span>
            <span>Secure Shopping</span>
            <span>✨</span>
          </div>
        </div>

        {/* Premium Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
              <Link to="/" className="flex items-center gap-2 shrink-0 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-lg sm:text-xl">M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">MyPinkShop</h1>
                  <p className="text-[9px] sm:text-[10px] text-gray-400 tracking-wider">FOR THE GIRLIES ✨</p>
                </div>
              </Link>

              <div className="flex-1 max-w-md lg:max-w-2xl">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search for products..."
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-gray-50"
                    onKeyPress={(e) => e.key === 'Enter' && navigate(`/shop?search=${e.target.value}`)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
                <Link to="/wishlist" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{wishlistCount}</span>}
                </Link>
                
                <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{cartCount}</span>}
                </Link>
                
                {user ? <Avatar user={user} onLogout={logout} /> : 
                  <Link to="/login" className="p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                }
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto border border-pink-100 shadow-sm">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Order Not Found</h2>
            <p className="text-gray-500 mb-6">The order you're looking for doesn't exist.</p>
            <Link to="/my-orders" className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition">
              View My Orders
            </Link>
          </div>
        </div>

        {/* Premium Footer */}
        <footer className="bg-gray-900 text-gray-400 py-8 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm">© 2026 MyPinkShop. All rights reserved.</p>
            <p className="text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      
      {/* Premium Top Bar */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
          <span>✨</span>
          <span>Free Shipping on ₹999+</span>
          <span className="hidden sm:inline">•</span>
          <span>Easy Returns</span>
          <span className="hidden sm:inline">•</span>
          <span>Secure Shopping</span>
          <span>✨</span>
        </div>
      </div>

      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg sm:text-xl">M</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">MyPinkShop</h1>
                <p className="text-[9px] sm:text-[10px] text-gray-400 tracking-wider">FOR THE GIRLIES ✨</p>
              </div>
            </Link>

            <div className="flex-1 max-w-md lg:max-w-2xl">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search for products..."
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-gray-50"
                  onKeyPress={(e) => e.key === 'Enter' && navigate(`/shop?search=${e.target.value}`)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
              <Link to="/wishlist" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{wishlistCount}</span>}
              </Link>
              
              <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{cartCount}</span>}
              </Link>
              
              {user ? <Avatar user={user} onLogout={logout} /> : 
                <Link to="/login" className="p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
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
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
          <span className="text-gray-400">/</span>
          <Link to="/my-orders" className="text-gray-500 hover:text-pink-500 transition">My Orders</Link>
          <span className="text-gray-400">/</span>
          <span className="text-pink-600 font-medium">Track Order #{order.id}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        
        {/* Order Status Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-pink-100 mb-6">
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
              {progress === 100 ? '🎉 Order Delivered' : `${Math.round(progress)}% Complete`}
            </p>
          </div>

          {/* Estimated Delivery */}
          {order.estimatedDelivery && (
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
          )}

          {/* Tracking Timeline */}
          {order.tracking && order.tracking.length > 0 && (
            <div className="space-y-0">
              {order.tracking.map((step, idx) => (
                <div key={idx} className="relative pb-8 last:pb-0">
                  {idx !== order.tracking.length - 1 && (
                    <div className={`absolute left-5 top-10 w-0.5 h-12 ${step.completed ? 'bg-pink-500' : 'bg-gray-200'}`}></div>
                  )}
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                      step.completed ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step.completed ? '✓' : getStatusIcon(step.stage)}
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

          {/* Default tracking if not available */}
          {(!order.tracking || order.tracking.length === 0) && (
            <div className="text-center py-8">
              <p className="text-gray-500">Tracking information will be updated soon.</p>
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-pink-100 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>📋</span> Order Summary
          </h3>
          
          {/* Items */}
          <div className="space-y-3 mb-4">
            {order.items && order.items.map((item, idx) => (
              <div key={idx} className="flex gap-3 pb-3 border-b border-pink-50 last:border-0">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                  {item.emoji || '✨'}
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

          {/* Price Breakdown */}
          <div className="space-y-2 pt-3 border-t border-pink-100">
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
            <div className="flex justify-between pt-2 border-t border-pink-100">
              <span className="font-semibold text-gray-800">Total Amount</span>
              <span className="font-bold text-pink-600 text-lg">₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-pink-100">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span>📍</span> Shipping Address
          </h3>
          <p className="text-gray-600 text-sm">{order.shippingAddress}</p>
          <div className="flex gap-4 mt-3 pt-3 border-t border-pink-50">
            <p className="text-xs text-gray-500">Payment: {order.paymentMethod}</p>
            <p className="text-xs text-gray-500">Delivery: {order.deliveryMethod === 'express' ? 'Express' : 'Standard'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Link to="/my-orders" className="flex-1 text-center border-2 border-pink-500 text-pink-600 py-3 rounded-xl font-medium hover:bg-pink-50 transition">
            ← Back to Orders
          </Link>
          <Link to="/shop" className="flex-1 text-center bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition transform hover:-translate-y-0.5">
            Continue Shopping →
          </Link>
        </div>
      </div>

      {/* Premium Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6 text-xs mb-4">
            <Link to="/terms" className="hover:text-pink-500 transition">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-pink-500 transition">Privacy Policy</Link>
            <a href="#" className="hover:text-pink-500 transition">Help</a>
            <a href="#" className="hover:text-pink-500 transition">Contact Us</a>
          </div>
          <p className="text-center text-xs text-gray-500">© 2026 MyPinkShop. All rights reserved.</p>
          <p className="text-center text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
        </div>
      </footer>
    </div>
  );
}

export default TrackOrder;
