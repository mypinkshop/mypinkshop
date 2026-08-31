import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useReviews } from '../context/ReviewContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTracking, setShowTracking] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewEligibility, setReviewEligibility] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { user, token, logout } = useAuth();
  const { addToCart, cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { canUserReview, addReview, uploadReviewMedia, fetchProductReviews } = useReviews();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  // Auto-remove cancelled orders after 30 minutes
  useEffect(() => {
    const checkAndRemoveCancelled = () => {
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      let hasChanges = false;
      
      const updatedOrders = orders.filter(order => {
        if (order.status === 'cancelled' || order.status === 'failed') {
          const cancelledTime = new Date(order.updatedAt || order.cancelledAt).getTime();
          if (cancelledTime < thirtyMinutesAgo) {
            hasChanges = true;
            return false;
          }
        }
        return true;
      });
      
      if (hasChanges) {
        setOrders(updatedOrders);
      }
    };
    
    const interval = setInterval(checkAndRemoveCancelled, 60000);
    return () => clearInterval(interval);
  }, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/orders/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const data = await response.json();
      
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      const filteredData = data.filter(order => {
        if (order.status === 'cancelled' || order.status === 'failed') {
          const cancelledTime = new Date(order.updatedAt || order.cancelledAt).getTime();
          return cancelledTime >= thirtyMinutesAgo;
        }
        return true;
      });
      
      setOrders(filteredData);
      
      for (const order of filteredData) {
        if (order.status === 'delivered') {
          for (const item of order.items) {
            try {
              const eligibility = await canUserReview(item.productId);
              setReviewEligibility(prev => ({
                ...prev,
                [`${order._id}_${item.productId}`]: eligibility
              }));
            } catch (err) {
              console.error('Error checking eligibility:', err);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'text-emerald-600';
      case 'shipped': return 'text-blue-600';
      case 'confirmed': return 'text-purple-600';
      case 'pending': return 'text-amber-600';
      case 'cancelled': return 'text-rose-600';
      case 'failed': return 'text-rose-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'delivered': return 'Delivered';
      case 'shipped': return 'Shipped';
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Processing';
      case 'cancelled': return 'Cancelled';
      case 'failed': return 'Payment Failed';
      default: return status || 'Processing';
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'delivered': return 'bg-emerald-50';
      case 'shipped': return 'bg-blue-50';
      case 'confirmed': return 'bg-purple-50';
      case 'pending': return 'bg-amber-50';
      case 'cancelled': return 'bg-rose-50';
      case 'failed': return 'bg-rose-50';
      default: return 'bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered': return '✅';
      case 'shipped': return '🚚';
      case 'confirmed': return '📋';
      case 'pending': return '⏳';
      case 'cancelled': return '❌';
      case 'failed': return '💔';
      default: return '📦';
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        toast.success('Order cancelled successfully!');
        fetchOrders();
      } else {
        toast.error('Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  const reorder = (order) => {
    order.items.forEach(item => {
      addToCart({
        id: item.productId,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image
      });
    });
    toast.success('Items added to cart!');
    navigate('/cart');
  };

  const handleTrackOrder = (order) => {
    setSelectedOrder(order);
    setShowTracking(true);
  };

  const handleWriteReview = (order, product) => {
    setSelectedOrderForReview(order);
    setSelectedProduct(product);
    setShowReviewModal(true);
    setRating(0);
    setTitle('');
    setComment('');
    setImages([]);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    setUploadingImages(true);
    try {
      const uploadedUrls = await uploadReviewMedia(files);
      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      toast.error('Failed to upload images: ' + error.message);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please write your review');
      return;
    }
    
    setSubmitting(true);
    try {
      const eligibility = reviewEligibility[`${selectedOrderForReview._id}_${selectedProduct.productId}`];
      const result = await addReview(
        selectedProduct.productId,
        eligibility?.orderId || selectedOrderForReview._id,
        rating,
        title,
        comment,
        images,
        []
      );
      
      if (result.success) {
        toast.success('✅ Review submitted! Awaiting admin approval.');
        setShowReviewModal(false);
        setSelectedProduct(null);
        setSelectedOrderForReview(null);
        fetchOrders();
        await fetchProductReviews(selectedProduct.productId);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to submit review: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getProgressWidth = (tracking) => {
    if (!tracking || tracking.length === 0) return 0;
    const completedCount = tracking.filter(t => t.completed).length;
    return (completedCount / tracking.length) * 100;
  };

  const filterOrders = () => {
    if (filterStatus === 'all') return orders;
    return orders.filter(order => order.status === filterStatus);
  };

  const filteredOrders = filterOrders();
  const orderCount = filteredOrders.length;

  // Stats
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'shipped').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled' || o.status === 'failed').length;

  // ✅ FIXED: Order ID Display - Pehle orderId check karega
  const getOrderIdDisplay = (order) => {
    if (!order) return 'N/A';
    
    // ✅ Pehle orderId check karo (MPS- format)
    if (order.orderId) {
      return order.orderId;
    }
    
    // ✅ Agar _id hai toh slice karo
    if (order._id) {
      return order._id.slice(-12).toUpperCase();
    }
    
    return 'N/A';
  };

  // Stats Click Handlers
  const handleStatClick = (status) => {
    if (status === 'all') {
      setFilterStatus('all');
    } else if (status === 'delivered') {
      setFilterStatus('delivered');
    } else if (status === 'pending') {
      setFilterStatus('pending');
    } else if (status === 'cancelled') {
      setFilterStatus('cancelled');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-pink-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400 font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Orders - MyPinkShop | Track & Manage Your Orders</title>
        <meta name="description" content="View and manage your orders at MyPinkShop. Track delivery status, cancel orders, reorder items, and download invoices." />
        <link rel="canonical" href="https://www.mypinkshop.com/my-orders" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        
        <OfferBanner />

        {/* Header */}
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-gray-50"
                  />
                  <button 
                    onClick={handleSearch}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 sm:px-6 py-1.5 sm:py-1.5 rounded-full text-sm font-medium hover:shadow-lg transition-all"
                  >
                    <span className="hidden sm:inline">Search</span>
                    <span className="sm:hidden">🔍</span>
                  </button>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">My Orders</span>
          </div>
        </div>

        {/* 🔥 Stats Cards - Clickable with rounded corners and dark on active */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => handleStatClick('all')}
              className={`text-left transition-all transform hover:scale-105 rounded-2xl overflow-hidden ${
                filterStatus === 'all' ? 'ring-2 ring-pink-500 ring-offset-2' : ''
              }`}
            >
              <div className={`rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all ${
                filterStatus === 'all' 
                  ? 'bg-gradient-to-br from-pink-600 to-pink-700 border-pink-700 text-white' 
                  : 'bg-gradient-to-br from-pink-100 to-pink-200/50 border-pink-200/50'
              }`}>
                <p className={`text-xs font-medium ${filterStatus === 'all' ? 'text-pink-200' : 'text-pink-600/70'}`}>Total Orders</p>
                <p className={`text-2xl font-bold ${filterStatus === 'all' ? 'text-white' : 'text-pink-700'}`}>{totalOrders}</p>
                <p className={`text-xs mt-1 ${filterStatus === 'all' ? 'text-pink-200' : 'text-pink-400/70'}`}>Click to view all</p>
              </div>
            </button>
            
            <button
              onClick={() => handleStatClick('delivered')}
              className={`text-left transition-all transform hover:scale-105 rounded-2xl overflow-hidden ${
                filterStatus === 'delivered' ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
              }`}
            >
              <div className={`rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all ${
                filterStatus === 'delivered' 
                  ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-700 text-white' 
                  : 'bg-gradient-to-br from-emerald-100 to-emerald-200/50 border-emerald-200/50'
              }`}>
                <p className={`text-xs font-medium ${filterStatus === 'delivered' ? 'text-emerald-200' : 'text-emerald-600/70'}`}>Delivered</p>
                <p className={`text-2xl font-bold ${filterStatus === 'delivered' ? 'text-white' : 'text-emerald-700'}`}>{deliveredOrders}</p>
                <p className={`text-xs mt-1 ${filterStatus === 'delivered' ? 'text-emerald-200' : 'text-emerald-400/70'}`}>Click to view</p>
              </div>
            </button>
            
            <button
              onClick={() => handleStatClick('pending')}
              className={`text-left transition-all transform hover:scale-105 rounded-2xl overflow-hidden ${
                filterStatus === 'pending' || filterStatus === 'confirmed' || filterStatus === 'shipped' ? 'ring-2 ring-amber-500 ring-offset-2' : ''
              }`}
            >
              <div className={`rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all ${
                filterStatus === 'pending' || filterStatus === 'confirmed' || filterStatus === 'shipped'
                  ? 'bg-gradient-to-br from-amber-600 to-amber-700 border-amber-700 text-white' 
                  : 'bg-gradient-to-br from-amber-100 to-amber-200/50 border-amber-200/50'
              }`}>
                <p className={`text-xs font-medium ${filterStatus === 'pending' || filterStatus === 'confirmed' || filterStatus === 'shipped' ? 'text-amber-200' : 'text-amber-600/70'}`}>In Progress</p>
                <p className={`text-2xl font-bold ${filterStatus === 'pending' || filterStatus === 'confirmed' || filterStatus === 'shipped' ? 'text-white' : 'text-amber-700'}`}>{pendingOrders}</p>
                <p className={`text-xs mt-1 ${filterStatus === 'pending' || filterStatus === 'confirmed' || filterStatus === 'shipped' ? 'text-amber-200' : 'text-amber-400/70'}`}>Click to view</p>
              </div>
            </button>
            
            <button
              onClick={() => handleStatClick('cancelled')}
              className={`text-left transition-all transform hover:scale-105 rounded-2xl overflow-hidden ${
                filterStatus === 'cancelled' || filterStatus === 'failed' ? 'ring-2 ring-rose-500 ring-offset-2' : ''
              }`}
            >
              <div className={`rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all ${
                filterStatus === 'cancelled' || filterStatus === 'failed'
                  ? 'bg-gradient-to-br from-rose-600 to-rose-700 border-rose-700 text-white' 
                  : 'bg-gradient-to-br from-rose-100 to-rose-200/50 border-rose-200/50'
              }`}>
                <p className={`text-xs font-medium ${filterStatus === 'cancelled' || filterStatus === 'failed' ? 'text-rose-200' : 'text-rose-600/70'}`}>Cancelled / Failed</p>
                <p className={`text-2xl font-bold ${filterStatus === 'cancelled' || filterStatus === 'failed' ? 'text-white' : 'text-rose-700'}`}>{cancelledOrders}</p>
                <p className={`text-xs mt-1 ${filterStatus === 'cancelled' || filterStatus === 'failed' ? 'text-rose-200' : 'text-rose-400/70'}`}>Click to view</p>
              </div>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-12">
          
          {/* Header with Filters */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">My Orders</h1>
              <p className="text-gray-500 text-sm">
                {orderCount} {orderCount === 1 ? 'order' : 'orders'} 
                {filterStatus !== 'all' && ` • Filtered: ${getStatusText(filterStatus)}`}
              </p>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filterStatus === status 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200/50' 
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-pink-300 hover:bg-pink-50'
                  }`}
                >
                  {status === 'all' ? 'All' : getStatusText(status)}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center border border-pink-100 shadow-sm">
              <div className="text-7xl mb-4">📦</div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">No orders found</h2>
              <p className="text-gray-400 mb-6">
                {filterStatus !== 'all' 
                  ? `You don't have any ${getStatusText(filterStatus)} orders.` 
                  : 'Looks like you haven\'t placed any orders.'}
              </p>
              <Link to="/shop" className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-pink-200/50 transition-all transform hover:-translate-y-0.5">
                Start Shopping →
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order, index) => {
                const canCancel = (order.status === 'pending' || order.status === 'confirmed') && order.paymentStatus !== 'failed';
                const isCancelled = order.status === 'cancelled' || order.status === 'failed';
                const isDelivered = order.status === 'delivered';
                const isShipped = order.status === 'shipped';
                
                return (
                  <div key={order._id}>
                    {/* Order Card */}
                    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl hover:shadow-pink-100/30 transition-all duration-300 ${
                      isCancelled ? 'border-rose-200 opacity-70' : isDelivered ? 'border-emerald-200' : 'border-pink-100'
                    }`}>
                      
                      {/* Header */}
                      <div className={`px-4 sm:px-6 py-3 flex flex-wrap justify-between items-center gap-3 border-b ${
                        isCancelled ? 'bg-rose-50/80 border-rose-100' : 
                        isDelivered ? 'bg-emerald-50/80 border-emerald-100' : 
                        'bg-pink-50/80 border-pink-100'
                      }`}>
                        <div className="flex items-center gap-6 flex-wrap">
                          <div>
                            <span className="text-xs text-gray-400 font-medium">ORDER ID</span>
                            <p className="text-sm font-mono font-bold text-gray-800 tracking-wide">
                              {getOrderIdDisplay(order)}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 font-medium">ORDER DATE</span>
                            <p className="text-sm font-medium text-gray-700">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 font-medium">TOTAL</span>
                            <p className="text-sm font-bold text-pink-600">₹{order.total?.toLocaleString()}</p>
                          </div>
                          {order.paymentStatus === 'failed' && (
                            <div className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full text-xs font-medium">
                              Payment Failed
                            </div>
                          )}
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusBg(order.status)} ${getStatusColor(order.status)} flex items-center gap-1.5`}>
                          <span>{getStatusIcon(order.status)}</span>
                          {getStatusText(order.status)}
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="px-4 sm:px-6 py-4">
                        {order.items && order.items.map((item, idx) => {
                          const eligibilityKey = `${order._id}_${item.productId}`;
                          const canReview = reviewEligibility[eligibilityKey]?.canReview && 
                                            !reviewEligibility[eligibilityKey]?.alreadyReviewed &&
                                            order.status === 'delivered';
                          const alreadyReviewed = reviewEligibility[eligibilityKey]?.alreadyReviewed;
                          
                          return (
                            <div key={idx} className="flex items-center gap-4 py-3 border-b border-pink-50 last:border-0">
                              <Link 
                                to={`/product/${item.productId}`}
                                className="w-16 h-16 rounded-xl overflow-hidden bg-pink-50 border border-pink-100 flex-shrink-0 hover:shadow-md transition hover:scale-105"
                              >
                                {item.image ? (
                                  <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                                )}
                              </Link>
                              <div className="flex-1">
                                <Link 
                                  to={`/product/${item.productId}`}
                                  className="font-semibold text-gray-800 text-sm hover:text-pink-600 hover:underline transition line-clamp-1"
                                >
                                  {item.name}
                                </Link>
                                <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
                                {item.variationName && (
                                  <p className="text-xs text-gray-400">Option: {item.variationName} {item.variationSecondary ? `- ${item.variationSecondary}` : ''}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-800">₹{item.price * item.quantity}</p>
                                <p className="text-xs text-gray-400">₹{item.price} each</p>
                                
                                {isDelivered && (
                                  canReview ? (
                                    <button
                                      onClick={() => handleWriteReview(order, item)}
                                      className="mt-2 px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-xs hover:shadow-md transition"
                                    >
                                      ✍️ Review
                                    </button>
                                  ) : alreadyReviewed ? (
                                    <span className="mt-2 inline-block text-emerald-500 text-xs flex items-center gap-1">✓ Reviewed</span>
                                  ) : null
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order Actions */}
                      <div className={`px-4 sm:px-6 py-3 border-t flex flex-wrap gap-3 justify-between items-center ${
                        isCancelled ? 'bg-rose-50/30 border-rose-100' : 
                        isDelivered ? 'bg-emerald-50/30 border-emerald-100' : 
                        'bg-gray-50/50 border-gray-100'
                      }`}>
                        <div className="flex flex-wrap gap-3">
                          <button 
                            onClick={() => handleTrackOrder(order)}
                            className="px-4 py-1.5 text-pink-600 border border-pink-200 rounded-full hover:bg-pink-50 transition text-sm font-medium"
                          >
                            📍 Track Order
                          </button>
                          {isDelivered && (
                            <>
                              <button className="px-4 py-1.5 text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50 transition text-sm font-medium">
                                📄 Download Invoice
                              </button>
                              <button 
                                onClick={() => reorder(order)} 
                                className="px-4 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full hover:shadow-md transition text-sm font-medium"
                              >
                                🛒 Buy Again
                              </button>
                            </>
                          )}
                        </div>
                        
                        {canCancel && !isCancelled && (
                          <button 
                            onClick={() => cancelOrder(order._id)} 
                            className="px-4 py-1.5 text-rose-600 border border-rose-200 rounded-full hover:bg-rose-50 transition text-sm font-medium"
                          >
                            ❌ Cancel Order
                          </button>
                        )}
                      </div>

                      {canCancel && !isCancelled && (
                        <div className="px-4 sm:px-6 py-2 bg-amber-50/50 border-t border-amber-100/50">
                          <p className="text-xs text-amber-600 flex items-center gap-1.5">
                            <span>ℹ️</span> 
                            Cancellation is available only before shipping. Once shipped, order cannot be cancelled.
                          </p>
                        </div>
                      )}
                      
                      {isCancelled && (
                        <div className="px-4 sm:px-6 py-2 bg-rose-50/80 border-t border-rose-100">
                          <p className="text-xs text-rose-600 flex items-center gap-1.5">
                            <span>⏰</span> 
                            This order was {order.status === 'failed' ? 'payment failed' : 'cancelled'} and will be removed after 30 minutes.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Separator Line */}
                    {index < filteredOrders.length - 1 && (
                      <div className="flex items-center gap-4 py-3">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent"></div>
                        <div className="flex items-center gap-1">
                          <span className="text-pink-300 text-xs">✦</span>
                          <span className="text-pink-300 text-xs">✦</span>
                          <span className="text-pink-300 text-xs">✦</span>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tracking Modal */}
        {showTracking && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-4 border-b border-pink-100 rounded-t-2xl flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">📍 Track Order #{selectedOrder._id?.slice(-8)}</h3>
                <button onClick={() => setShowTracking(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${getProgressWidth(selectedOrder.tracking)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 text-right mt-1">{Math.round(getProgressWidth(selectedOrder.tracking))}% complete</p>
                </div>
                
                <div className="space-y-4">
                  {selectedOrder.tracking && selectedOrder.tracking.map((step, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="relative">
                        <div className={`w-4 h-4 rounded-full mt-1 ${step.completed ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                        {idx < selectedOrder.tracking.length - 1 && (
                          <div className={`absolute top-5 left-1.5 w-0.5 h-8 ${step.completed && selectedOrder.tracking[idx+1]?.completed ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className={`font-medium ${step.completed ? 'text-gray-800' : 'text-gray-400'}`}>{step.stage}</p>
                        <p className="text-xs text-gray-400">{step.date}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-pink-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-600 mb-1">📍 Delivery Address</p>
                  <p className="text-sm text-gray-600">{selectedOrder.shippingAddress || selectedOrder.address}</p>
                  <p className="text-xs text-gray-400 mt-2">Payment: {selectedOrder.paymentMethod}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REVIEW MODAL */}
        {showReviewModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowReviewModal(false)}>
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-pink-100 p-4 rounded-t-2xl flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">✍️ Write a Review</h3>
                <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="flex gap-3 pb-3 border-b border-pink-100">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-pink-50 border border-pink-100">
                    {selectedProduct.image ? (
                      <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{selectedProduct.name}</p>
                    <p className="text-xs text-gray-400">Order #{selectedOrderForReview?._id?.slice(-8)}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating *</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(star => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="text-3xl focus:outline-none"
                      >
                        <span className={star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Summarize your experience"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    maxLength="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Review *</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="4"
                    placeholder="Share your experience with this product"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Photos</label>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-pink-100">
                        <img src={img} alt={`Review ${idx}`} className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="reviewImageUpload" />
                  <label htmlFor="reviewImageUpload" className="inline-block px-4 py-2.5 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition text-sm">
                    {uploadingImages ? '📤 Uploading...' : '📸 Upload Images'}
                  </label>
                  <p className="text-xs text-gray-400 mt-1">Max 5 images, up to 5MB each</p>
                </div>
                
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <p className="text-sm text-emerald-700 flex items-center gap-2">
                    <span>✓</span> Verified Purchase
                  </p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2.5 rounded-xl hover:shadow-md transition disabled:opacity-50 font-medium"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
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
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <h3 className="font-bold text-white text-lg">MyPinkShop</h3>
                </div>
                <p className="text-sm">Luxury beauty and fashion for the modern woman.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Shop</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/skincare" className="hover:text-pink-500 transition">Skincare</Link></li>
                  <li><Link to="/makeup" className="hover:text-pink-500 transition">Makeup</Link></li>
                  <li><Link to="/hair" className="hover:text-pink-500 transition">Hair</Link></li>
                  <li><Link to="/clothing" className="hover:text-pink-500 transition">Clothing</Link></li>
                  <li><Link to="/accessories" className="hover:text-pink-500 transition">Accessories</Link></li>
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
              <p className="text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default MyOrders;
