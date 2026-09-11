import { useState, useEffect, useCallback } from 'react';
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
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [liveTrackingData, setLiveTrackingData] = useState(null);

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
    if (e.key === 'Enter') handleSearch();
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const formattedString = dateString.includes(' ') && !dateString.includes('T')
      ? dateString.replace(' ', 'T') + (dateString.endsWith('Z') ? '' : 'Z')
      : dateString;
    const date = new Date(formattedString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/orders/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      const ordersArray = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      const normalized = ordersArray.map(order => {
        let parsedAddress = order.shippingAddress || order.shipping_address;
        if (typeof parsedAddress === 'string') {
          try {
            parsedAddress = JSON.parse(parsedAddress);
          } catch (e) {}
        }

        return {
          ...order,
          _id: order._id || order.id,
          createdAt: order.createdAt || order.created_at,
          updatedAt: order.updatedAt || order.updated_at,
          total: order.total || order.total_amount || order.subtotal,
          orderNumber: order.order_number || order.orderNumber,
          shippingAddress: parsedAddress,
          paymentMethod: order.paymentMethod || order.payment_method,
          paymentStatus: order.paymentStatus || order.payment_status,
          items: (order.items || []).map(item => ({
            ...item,
            productId: item.productId || item.product_id,
            name: item.name || item.product_name,
            image: item.image || item.product_image || item.img,
            price: item.price || item.unit_price || 0,
          })),
        };
      });

      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      const filteredData = normalized.filter(order => {
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
            } catch (err) {}
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

  // ============ STATUS HELPERS (SAB PINK GRADIENT) ============
  const getStatusConfig = (status) => {
    // ✅ Sab status pe SAME pink gradient — brand consistency
    const PINK_GRADIENT = 'from-pink-500 to-rose-500';

    const configs = {
      delivered: { label: 'Delivered', icon: '✓', gradient: PINK_GRADIENT },
      shipped: { label: 'Shipped', icon: '🚚', gradient: PINK_GRADIENT },
      confirmed: { label: 'Confirmed', icon: '📋', gradient: PINK_GRADIENT },
      processing: { label: 'Processing', icon: '⏳', gradient: PINK_GRADIENT },
      pending: { label: 'Processing', icon: '⏳', gradient: PINK_GRADIENT },
      cancelled: { label: 'Cancelled', icon: '✕', gradient: PINK_GRADIENT },
      failed: { label: 'Failed', icon: '✕', gradient: PINK_GRADIENT },
      refunded: { label: 'Refunded', icon: '↩', gradient: PINK_GRADIENT },
    };
    return configs[status] || configs.pending;
  };

  const getPaymentStatusConfig = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'paid' || s === 'completed') {
      return { label: 'Paid', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    }
    if (s === 'failed') {
      return { label: 'Failed', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    }
    return { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
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

  const handleTrackOrder = async (order) => {
    setSelectedOrder(order);
    setShowTracking(true);
    setTrackingLoading(true);
    setLiveTrackingData(null);

    const targetOrderId = order.orderId || order._id || order.id;

    try {
      const response = await fetch(`${API_URL}/api/shipping/tracking/${targetOrderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.trackingData) {
        setLiveTrackingData(data.trackingData);
      }
    } catch (err) {
      console.error('Error fetching live tracking:', err);
    } finally {
      setTrackingLoading(false);
    }
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

  const filterOrders = () => {
    if (filterStatus === 'all') return orders;
    if (filterStatus === 'pending') return orders.filter(o => ['pending', 'processing', 'confirmed', 'shipped'].includes(o.status));
    if (filterStatus === 'cancelled') return orders.filter(o => ['cancelled', 'failed'].includes(o.status));
    return orders.filter(order => order.status === filterStatus);
  };

  const filteredOrders = filterOrders();

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const pendingOrders = orders.filter(o => ['pending', 'processing', 'confirmed', 'shipped'].includes(o.status)).length;
  const cancelledOrders = orders.filter(o => ['cancelled', 'failed'].includes(o.status)).length;

  const getOrderIdDisplay = (order) => {
    if (!order) return 'N/A';
    if (order.orderNumber) return order.orderNumber;
    if (order.order_number) return order.order_number;
    if (order.orderId) return order.orderId;
    const idVal = order._id || order.id;
    return idVal ? String(idVal).slice(-12).toUpperCase() : 'N/A';
  };

  const getStatusText = (status) => getStatusConfig(status).label;

  // ============ LOADING SKELETON ============
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white">
        <OfferBanner />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-20 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-3xl shadow-sm mb-6 overflow-hidden animate-pulse">
              <div className="h-20 bg-gray-100"></div>
              <div className="p-6">
                <div className="h-20 bg-gray-100 rounded-xl"></div>
              </div>
            </div>
          ))}
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

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white">
        <OfferBanner />

        {/* ============ HEADER ============ */}
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
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 sm:px-6 py-1.5 rounded-full text-sm font-medium hover:shadow-lg transition-all"
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

        {/* ============ BREADCRUMB ============ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">My Orders</span>
          </div>
        </div>

        {/* ============ PREMIUM STATS CARDS ============ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => setFilterStatus('all')}
              className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                filterStatus === 'all'
                  ? 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-200'
                  : 'bg-white border border-pink-100'
              }`}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${filterStatus === 'all' ? 'text-pink-100' : 'text-gray-400'}`}>Total</span>
                  <span className={`text-2xl ${filterStatus === 'all' ? '' : 'opacity-60'}`}>📦</span>
                </div>
                <p className={`text-3xl font-bold ${filterStatus === 'all' ? 'text-white' : 'text-gray-800'}`}>{totalOrders}</p>
                <p className={`text-xs mt-1 ${filterStatus === 'all' ? 'text-pink-100' : 'text-gray-500'}`}>All Orders</p>
              </div>
            </button>

            <button
              onClick={() => setFilterStatus('delivered')}
              className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                filterStatus === 'delivered'
                  ? 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-200'
                  : 'bg-white border border-pink-100'
              }`}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${filterStatus === 'delivered' ? 'text-pink-100' : 'text-gray-400'}`}>Delivered</span>
                  <span className={`text-2xl ${filterStatus === 'delivered' ? '' : 'opacity-60'}`}>✅</span>
                </div>
                <p className={`text-3xl font-bold ${filterStatus === 'delivered' ? 'text-white' : 'text-pink-600'}`}>{deliveredOrders}</p>
                <p className={`text-xs mt-1 ${filterStatus === 'delivered' ? 'text-pink-100' : 'text-gray-500'}`}>Completed</p>
              </div>
            </button>

            <button
              onClick={() => setFilterStatus('pending')}
              className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                filterStatus === 'pending'
                  ? 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-200'
                  : 'bg-white border border-pink-100'
              }`}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${filterStatus === 'pending' ? 'text-pink-100' : 'text-gray-400'}`}>In Progress</span>
                  <span className={`text-2xl ${filterStatus === 'pending' ? '' : 'opacity-60'}`}>⏳</span>
                </div>
                <p className={`text-3xl font-bold ${filterStatus === 'pending' ? 'text-white' : 'text-pink-600'}`}>{pendingOrders}</p>
                <p className={`text-xs mt-1 ${filterStatus === 'pending' ? 'text-pink-100' : 'text-gray-500'}`}>Active</p>
              </div>
            </button>

            <button
              onClick={() => setFilterStatus('cancelled')}
              className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                filterStatus === 'cancelled'
                  ? 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-200'
                  : 'bg-white border border-pink-100'
              }`}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${filterStatus === 'cancelled' ? 'text-pink-100' : 'text-gray-400'}`}>Cancelled</span>
                  <span className={`text-2xl ${filterStatus === 'cancelled' ? '' : 'opacity-60'}`}>✕</span>
                </div>
                <p className={`text-3xl font-bold ${filterStatus === 'cancelled' ? 'text-white' : 'text-pink-600'}`}>{cancelledOrders}</p>
                <p className={`text-xs mt-1 ${filterStatus === 'cancelled' ? 'text-pink-100' : 'text-gray-500'}`}>Failed/Cancelled</p>
              </div>
            </button>
          </div>
        </div>

        {/* ============ MAIN CONTENT ============ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">My Orders</h1>
              <p className="text-gray-500 text-sm">{filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} {filterStatus !== 'all' && `• ${getStatusText(filterStatus)}`}</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'delivered', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200/50'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-pink-300 hover:bg-pink-50'
                  }`}
                >
                  {status === 'all' ? 'All Orders' : status === 'pending' ? 'In Progress' : status === 'delivered' ? 'Delivered' : 'Cancelled'}
                </button>
              ))}
            </div>
          </div>

          {/* ============ EMPTY STATE ============ */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-pink-100 shadow-sm">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center">
                <span className="text-6xl">🛍️</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                {filterStatus === 'all' ? 'No orders yet' : `No ${getStatusText(filterStatus).toLowerCase()} orders`}
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                {filterStatus === 'all'
                  ? "You haven't placed any orders yet. Start shopping to see them here!"
                  : `You don't have any ${getStatusText(filterStatus).toLowerCase()} orders right now.`}
              </p>
              <Link to="/shop" className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3.5 rounded-full font-semibold hover:shadow-lg transition-all">
                Start Shopping →
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredOrders.map((order) => {
                const canCancel = ['pending', 'processing', 'confirmed'].includes(order.status) && order.paymentStatus !== 'failed';
                const isCancelled = ['cancelled', 'failed'].includes(order.status);
                const isDelivered = order.status === 'delivered';
                const statusConfig = getStatusConfig(order.status);
                const payConfig = getPaymentStatusConfig(order.paymentStatus);

                return (
                  <div
                    key={order._id}
                    className={`bg-white rounded-3xl border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${
                      isCancelled ? 'border-rose-100' : isDelivered ? 'border-emerald-100' : 'border-pink-100'
                    }`}
                  >
                    {/* ✅ PREMIUM PINK GRADIENT HEADER (Same as Payment Success) */}
                    <div className={`bg-gradient-to-r ${statusConfig.gradient} px-5 sm:px-6 py-4`}>
                      <div className="flex flex-wrap justify-between items-center gap-3">
                        <div className="flex flex-wrap items-center gap-5 sm:gap-8">
                          <div>
                            <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Order Number</p>
                            <p className="text-sm sm:text-base font-bold text-white font-mono">{getOrderIdDisplay(order)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Order Date</p>
                            <p className="text-sm sm:text-base font-medium text-white">{formatDate(order.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Total</p>
                            <p className="text-sm sm:text-base font-bold text-white">₹{order.total?.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                            <span>{statusConfig.icon}</span>
                            {statusConfig.label}
                          </span>
                          <span className={`bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full`}>
                            {payConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ✅ ITEMS */}
                    <div className="px-5 sm:px-6 py-4">
                      {order.items && order.items.map((item, idx) => {
                        const eligibilityKey = `${order._id}_${item.productId}`;
                        const canReview = reviewEligibility[eligibilityKey]?.canReview && !reviewEligibility[eligibilityKey]?.alreadyReviewed && isDelivered;
                        const alreadyReviewed = reviewEligibility[eligibilityKey]?.alreadyReviewed;

                        return (
                          <div key={idx} className="flex items-center gap-4 py-3 border-b border-pink-50 last:border-0">
                            <Link
                              to={`/product/${item.productId}`}
                              className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 flex-shrink-0 flex items-center justify-center p-1 hover:shadow-md hover:scale-105 transition-all"
                            >
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                              ) : (
                                <div className="text-2xl">🛍️</div>
                              )}
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link
                                to={`/product/${item.productId}`}
                                className="font-semibold text-gray-800 text-sm hover:text-pink-600 transition line-clamp-1"
                              >
                                {item.name}
                              </Link>
                              <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                              {item.variationName && (
                                <p className="text-xs text-gray-400">Option: {item.variationName}</p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-gray-800 text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
                              {isDelivered && canReview && (
                                <button
                                  onClick={() => handleWriteReview(order, item)}
                                  className="mt-2 px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-xs hover:shadow-md transition"
                                >
                                  ✍️ Review
                                </button>
                              )}
                              {alreadyReviewed && (
                                <span className="mt-2 inline-block text-emerald-500 text-xs font-medium">✓ Reviewed</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ✅ ACTION BUTTONS */}
                    <div className="px-5 sm:px-6 py-4 border-t border-pink-50 bg-gradient-to-r from-pink-50/50 to-rose-50/50 flex flex-wrap gap-3 justify-between items-center">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleTrackOrder(order)}
                          className="px-4 py-2 text-pink-600 bg-white border border-pink-200 rounded-full hover:bg-pink-50 hover:border-pink-300 transition text-sm font-medium flex items-center gap-1.5"
                        >
                          📍 Track Order
                        </button>
                        {isDelivered && (
                          <button
                            onClick={() => reorder(order)}
                            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full hover:shadow-md transition text-sm font-medium flex items-center gap-1.5"
                          >
                            🛒 Buy Again
                          </button>
                        )}
                      </div>
                      {canCancel && !isCancelled && (
                        <button
                          onClick={() => cancelOrder(order._id)}
                          className="px-4 py-2 text-rose-600 bg-white border border-rose-200 rounded-full hover:bg-rose-50 hover:border-rose-300 transition text-sm font-medium"
                        >
                          ✕ Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============ LIVE TRACKING MODAL (PREMIUM) ============ */}
        {showTracking && selectedOrder && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowTracking(false)}
          >
            <div
              className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-500 p-5 rounded-t-3xl flex justify-between items-center z-10">
                <div>
                  <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Tracking Order</p>
                  <h3 className="text-base font-bold text-white font-mono">{getOrderIdDisplay(selectedOrder)}</h3>
                </div>
                <button
                  onClick={() => setShowTracking(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                {trackingLoading ? (
                  <div className="text-center py-10">
                    <div className="animate-spin w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-sm text-gray-400">Fetching live tracking...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Timeline */}
                    <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-pink-300 before:via-pink-200 before:to-gray-200">

                      {/* Step 1 */}
                      <div className="relative">
                        <div className="absolute -left-8 top-0 w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs shadow-md ring-4 ring-pink-100">
                          ✓
                        </div>
                        <p className="font-semibold text-gray-800 text-sm">Order Placed</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(selectedOrder.createdAt)}</p>
                      </div>

                      {/* Step 2 */}
                      <div className="relative">
                        <div className={`absolute -left-8 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ring-4 shadow-md ${
                          ['confirmed', 'shipped', 'delivered'].includes(selectedOrder.status)
                            ? 'bg-pink-500 text-white ring-pink-100'
                            : 'bg-gray-200 text-gray-500 ring-gray-100'
                        }`}>
                          {['confirmed', 'shipped', 'delivered'].includes(selectedOrder.status) ? '✓' : '•'}
                        </div>
                        <p className={`font-semibold text-sm ${['confirmed', 'shipped', 'delivered'].includes(selectedOrder.status) ? 'text-gray-800' : 'text-gray-400'}`}>
                          Order Confirmed
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {['confirmed', 'shipped', 'delivered'].includes(selectedOrder.status)
                            ? formatDate(selectedOrder.updatedAt || selectedOrder.createdAt)
                            : 'Pending confirmation'}
                        </p>
                      </div>

                      {/* Live Updates */}
                      {liveTrackingData?.tracking_data?.shipment_track ? (
                        liveTrackingData.tracking_data.shipment_track.map((track, idx) => (
                          <div key={idx} className="relative">
                            <div className="absolute -left-8 top-0 w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs shadow-md ring-4 ring-pink-100">
                              📦
                            </div>
                            <p className="font-semibold text-gray-800 text-sm">{track.current_status || 'In Transit'}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{track.location || 'Hub'} - {track.activity}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{track.date}</p>
                          </div>
                        ))
                      ) : (
                        <div className="relative">
                          <div className="absolute -left-8 top-0 w-6 h-6 rounded-full bg-pink-400 text-white flex items-center justify-center text-xs shadow-md ring-4 ring-pink-100">
                            ⏳
                          </div>
                          <p className="font-semibold text-gray-600 text-sm">Preparing Shipment</p>
                          <p className="text-xs text-gray-400 mt-0.5">Your order is being prepared for dispatch.</p>
                        </div>
                      )}
                    </div>

                    {/* Address Card */}
                    <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-100">
                      <p className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                        <span>📍</span> Delivery Address
                      </p>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p className="font-bold text-gray-800 text-sm">
                          {typeof selectedOrder.shippingAddress === 'object' && selectedOrder.shippingAddress !== null
                            ? (selectedOrder.shippingAddress.fullName || user?.fullName || 'Customer')
                            : (user?.fullName || 'Customer')}
                        </p>
                        <p>
                          {typeof selectedOrder.shippingAddress === 'object' && selectedOrder.shippingAddress !== null
                            ? (selectedOrder.shippingAddress.addressLine1 || selectedOrder.shippingAddress.address || 'N/A')
                            : String(selectedOrder.shippingAddress || selectedOrder.address || 'N/A')}
                        </p>
                        <p>
                          {typeof selectedOrder.shippingAddress === 'object' && selectedOrder.shippingAddress !== null ? (
                            <>
                              {selectedOrder.shippingAddress.city || 'Mumbai'}, {selectedOrder.shippingAddress.state || 'Maharashtra'} - <span className="font-mono font-semibold">{selectedOrder.shippingAddress.pincode || '400072'}</span>
                            </>
                          ) : 'Mumbai, Maharashtra - 400072'}
                        </p>
                        <p className="text-gray-500 pt-1">
                          Phone: <span className="font-medium">{typeof selectedOrder.shippingAddress === 'object' && selectedOrder.shippingAddress !== null ? (selectedOrder.shippingAddress.phone || 'N/A') : 'N/A'}</span>
                        </p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-pink-200/60 flex justify-between items-center text-[11px]">
                        <span className="text-gray-500">Payment: <strong className="uppercase text-gray-700">{selectedOrder.paymentMethod || 'Online'}</strong></span>
                        <span className={`capitalize px-2.5 py-1 rounded-full font-semibold ${getPaymentStatusConfig(selectedOrder.paymentStatus).bg} ${getPaymentStatusConfig(selectedOrder.paymentStatus).text}`}>
                          {getPaymentStatusConfig(selectedOrder.paymentStatus).label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============ REVIEW MODAL ============ */}
        {showReviewModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowReviewModal(false)}>
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-500 border-b border-pink-100 p-5 rounded-t-3xl flex justify-between items-center z-10">
                <h3 className="text-lg font-bold text-white">✍️ Write a Review</h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div className="flex gap-3 pb-4 border-b border-pink-100">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 p-1 flex items-center justify-center">
                    {selectedProduct.image ? <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-contain" /> : <div>🛍️</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm line-clamp-2">{selectedProduct.name}</p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">#{getOrderIdDisplay(selectedOrderForReview)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your Rating *</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="text-4xl focus:outline-none transition-transform hover:scale-110"
                      >
                        <span className={star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Review Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Summarize your experience"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm"
                    maxLength="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Review *</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="4"
                    placeholder="Share your experience with this product"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Add Photos</label>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-pink-100">
                        <img src={img} alt={`Review ${idx}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-md"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="reviewImageUpload" />
                  <label
                    htmlFor="reviewImageUpload"
                    className="inline-flex items-center gap-2 px-4 py-3 border-2 border-dashed border-pink-200 rounded-2xl cursor-pointer hover:bg-pink-50 transition text-sm text-pink-600 font-medium"
                  >
                    {uploadingImages ? (
                      <>
                        <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                        Uploading...
                      </>
                    ) : (
                      <>📸 Upload Images</>
                    )}
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl hover:shadow-lg transition disabled:opacity-50 font-semibold text-sm"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 border-2 border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition font-medium text-sm text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ FOOTER ============ */}
        <footer className="bg-gray-900 text-gray-400 py-12 mt-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm">© 2026 MyPinkShop. All rights reserved.</p>
            <p className="text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
          </div>
        </footer>
      </div>
    </>
  );
}

export default MyOrders;
