import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTracking, setShowTracking] = useState(false);
  const { user, logout } = useAuth();
  const { addToCart, cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const userOrders = allOrders.filter(order => order.customerEmail === user.email);
    userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    setOrders(userOrders);
    setLoading(false);
  }, [user, navigate]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'delivered': return 'Delivered';
      case 'shipped': return 'Shipped';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Pending';
    }
  };

  const cancelOrder = (orderId) => {
    if(window.confirm('Are you sure you want to cancel this order?')) {
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      );
      setOrders(updatedOrders);
      
      const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
      const updatedAllOrders = allOrders.map(order => 
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      );
      localStorage.setItem('adminOrdersList', JSON.stringify(updatedAllOrders));
      
      alert('Order cancelled successfully!');
    }
  };

  const reorder = (order) => {
    order.items.forEach(item => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image
      });
    });
    alert('Items added to cart!');
    navigate('/cart');
  };

  const handleTrackOrder = (order) => {
    setSelectedOrder(order);
    setShowTracking(true);
  };

  const getProgressWidth = (tracking) => {
    if (!tracking) return 0;
    const completedCount = tracking.filter(t => t.completed).length;
    return (completedCount / tracking.length) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-500">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
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

        {/* Empty Orders */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="bg-white rounded-lg p-12 max-w-md mx-auto border border-gray-200 shadow-sm">
            <div className="text-6xl mb-6">📦</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">No orders yet</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't placed any orders.</p>
            <Link to="/shop" className="inline-block bg-pink-600 text-white px-8 py-3 rounded font-semibold hover:bg-pink-700 transition">
              Start Shopping →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm">© 2026 MyPinkShop. All rights reserved.</p>
          </div>
        </footer>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-pink-600">Home</Link>
          <span>/</span>
          <span className="text-gray-700">My Orders</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">My Orders</h1>
        <p className="text-gray-500 mb-6">Track and manage your orders</p>

        {/* Order Cards */}
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
              {/* Order Header */}
              <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Order #{order.id}</p>
                  <p className="text-xs text-gray-500">
                    Placed on {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="text-lg font-bold text-pink-600">₹{order.total.toLocaleString()}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="px-4 sm:px-6 py-4">
                {order.items && order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                    {/* ✅ PRODUCT IMAGE */}
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-2xl text-gray-400">
                        🛍️
                      </div>
                    )}
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
              <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-wrap gap-3 justify-end">
                <button 
                  onClick={() => handleTrackOrder(order)}
                  className="px-4 py-2 text-pink-600 border border-pink-200 rounded-lg hover:bg-pink-50 transition text-sm font-medium"
                >
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
                    <button onClick={() => reorder(order)} className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition text-sm font-medium">
                      Buy Again
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tracking Modal */}
      {showTracking && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Track Order #{selectedOrder.id}</h3>
              <button onClick={() => setShowTracking(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-6">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-pink-600 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressWidth(selectedOrder.tracking)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Tracking Steps */}
              <div className="space-y-4">
                {selectedOrder.tracking && selectedOrder.tracking.map((step, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="relative">
                      <div className={`w-4 h-4 rounded-full mt-1 ${step.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      {idx < selectedOrder.tracking.length - 1 && (
                        <div className={`absolute top-5 left-1.5 w-0.5 h-8 ${step.completed && selectedOrder.tracking[idx+1]?.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className={`font-medium ${step.completed ? 'text-gray-800' : 'text-gray-400'}`}>{step.stage}</p>
                      <p className="text-xs text-gray-400">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-600 mb-1">Delivery Address</p>
                <p className="text-sm text-gray-600">{selectedOrder.shippingAddress}</p>
                <p className="text-xs text-gray-500 mt-2">Payment: {selectedOrder.paymentMethod}</p>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default MyOrders;
