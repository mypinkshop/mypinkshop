import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useReviews } from '../context/ReviewContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';

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

  const API_URL = 'https://api.mypinkshop.com';

  // Handle search
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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/orders/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const data = await response.json();
      setOrders(data);
      
      for (const order of data) {
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
      case 'delivered': return 'text-green-600';
      case 'shipped': return 'text-blue-600';
      case 'confirmed': return 'text-purple-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
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
      default: return status || 'Processing';
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
        alert('Order cancelled successfully!');
        fetchOrders();
      } else {
        alert('Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
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
    alert('Items added to cart!');
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
      alert('Maximum 5 images allowed');
      return;
    }
    
    setUploadingImages(true);
    try {
      const uploadedUrls = await uploadReviewMedia(files);
      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      alert('Failed to upload images: ' + error.message);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      alert('Please write your review');
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
        alert('✅ Review submitted! Awaiting admin approval.');
        setShowReviewModal(false);
        setSelectedProduct(null);
        setSelectedOrderForReview(null);
        fetchOrders();
        await fetchProductReviews(selectedProduct.productId);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to submit review: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getProgressWidth = (tracking) => {
    if (!tracking || tracking.length === 0) return 0;
    const completedCount = tracking.filter(t => t.completed).length;
    return (completedCount / tracking.length) * 100;
  };

  // SEO Schema
  const generateBreadcrumbSchema = () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.mypinkshop.com" },
      { "@type": "ListItem", "position": 2, "name": "My Orders", "item": "https://www.mypinkshop.com/my-orders" }
    ]
  });

  const generateOrganizationSchema = () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MyPinkShop",
    "url": "https://www.mypinkshop.com",
    "logo": "https://www.mypinkshop.com/logo.png"
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Orders - MyPinkShop | Track & Manage Your Orders</title>
        <meta name="description" content="View and manage your orders at MyPinkShop. Track delivery status, cancel orders, reorder items, and download invoices. Login to access your order history." />
        <meta name="keywords" content="my orders, order tracking, order history, track order, cancel order, reorder, mypinkshop orders" />
        <link rel="canonical" href="https://www.mypinkshop.com/my-orders" />
        <meta property="og:title" content="My Orders - MyPinkShop" />
        <meta property="og:description" content="Track and manage your orders. View order status, cancel orders, and reorder items." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mypinkshop.com/my-orders" />
        <meta property="og:image" content="https://www.mypinkshop.com/og-orders.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="My Orders - MyPinkShop" />
        <meta name="twitter:description" content="Track and manage your orders easily." />
        <meta name="twitter:image" content="https://www.mypinkshop.com/og-orders.jpg" />
        <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema())}</script>
        <script type="application/ld+json">{JSON.stringify(generateOrganizationSchema())}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        
        {/* Dynamic Offer Banner */}
        <OfferBanner />

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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">My Orders</h1>
          <p className="text-gray-500 mb-6">Track and manage your orders</p>

          {orders.length === 0 ? (
            // Empty Orders
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-pink-100">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No orders yet</h2>
              <p className="text-gray-500 mb-6">Looks like you haven't placed any orders.</p>
              <Link to="/shop" className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                Start Shopping →
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order._id} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 overflow-hidden hover:shadow-md transition shadow-sm">
                  
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 sm:px-6 py-4 border-b border-pink-100 flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Order #{order._id?.slice(-8)}</p>
                      <p className="text-xs text-gray-500">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Total Amount</p>
                        <p className="text-lg font-bold text-pink-600">₹{order.total?.toLocaleString()}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)} bg-white/50`}>
                        {getStatusText(order.status)}
                      </div>
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
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-14 h-14 rounded-xl object-cover border border-pink-100 bg-white"
                              loading="lazy"
                              decoding="async"
                              width="56"
                              height="56"
                              style={{ aspectRatio: '1/1' }}
                            />
                          ) : (
                            <div className="w-14 h-14 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl flex items-center justify-center text-2xl">
                              🛍️
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{item.name}</h4>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            {item.variationName && (
                              <p className="text-xs text-gray-400">Option: {item.variationName} {item.variationSecondary ? `- ${item.variationSecondary}` : ''}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-800">₹{item.price * item.quantity}</p>
                            <p className="text-xs text-gray-400">₹{item.price} each</p>
                            
                            {order.status === 'delivered' && (
                              canReview ? (
                                <button
                                  onClick={() => handleWriteReview(order, item)}
                                  className="mt-2 px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-xs hover:shadow-md transition"
                                >
                                  ✍️ Write Review
                                </button>
                              ) : alreadyReviewed ? (
                                <span className="mt-2 inline-block text-green-600 text-xs flex items-center gap-1">✓ Reviewed</span>
                              ) : null
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Actions */}
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 sm:px-6 py-4 border-t border-pink-100 flex flex-wrap gap-3 justify-end">
                    <button 
                      onClick={() => handleTrackOrder(order)}
                      className="px-4 py-2 text-pink-600 border border-pink-200 rounded-xl hover:bg-pink-50 transition text-sm font-medium"
                    >
                      📍 Track Order
                    </button>
                    {order.status === 'pending' && (
                      <button onClick={() => cancelOrder(order._id)} className="px-4 py-2 text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition text-sm font-medium">
                        ❌ Cancel Order
                      </button>
                    )}
                    {order.status === 'delivered' && (
                      <>
                        <button className="px-4 py-2 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-medium">
                          📄 Download Invoice
                        </button>
                        <button onClick={() => reorder(order)} className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:shadow-md transition text-sm font-medium">
                          🛒 Buy Again
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tracking Modal */}
        {showTracking && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-4 border-b border-pink-100 rounded-t-2xl flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Track Order #{selectedOrder._id?.slice(-8)}</h3>
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
                </div>
                
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

                <div className="mt-6 p-4 bg-pink-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Delivery Address</p>
                  <p className="text-sm text-gray-600">{selectedOrder.shippingAddress || selectedOrder.address}</p>
                  <p className="text-xs text-gray-500 mt-2">Payment: {selectedOrder.paymentMethod}</p>
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
                <h3 className="text-lg font-semibold text-gray-800">Write a Review</h3>
                <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="flex gap-3 pb-3 border-b border-pink-100">
                  {selectedProduct.image ? (
                    <img 
                      src={selectedProduct.image} 
                      alt={selectedProduct.name}
                      className="w-16 h-16 rounded-xl object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl flex items-center justify-center text-2xl">🛍️</div>
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{selectedProduct.name}</p>
                    <p className="text-xs text-gray-500">Order #{selectedOrderForReview?._id?.slice(-8)}</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Title (Optional)</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Photos (Optional)</label>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-pink-100">
                        <img src={img} alt={`Review ${idx}`} className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="reviewImageUpload" />
                  <label htmlFor="reviewImageUpload" className="inline-block px-4 py-2.5 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition text-sm">
                    {uploadingImages ? '📤 Uploading...' : '📸 Upload Images'}
                  </label>
                  <p className="text-xs text-gray-400 mt-1">Max 5 images, up to 5MB each</p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-xl">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <span>✓</span> Your review will be marked as "Verified Purchase"
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
