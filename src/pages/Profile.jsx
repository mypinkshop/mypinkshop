import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';

function Profile() {
  const navigate = useNavigate();
  const { user, logout, token, updateUserProfile } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount, wishlist, removeFromWishlist } = useWishlist();
  const [activeTab, setActiveTab] = useState('hub'); // 'hub' for Amazon/Nykaa style dashboard grid, or specific tabs
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [profileImage, setProfileImage] = useState(() => {
    return sessionStorage.getItem('user_profile_image') || null;
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    createdAt: ''
  });
  
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    pincode: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    isDefault: false
  });
  
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTracking, setShowTracking] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [liveTrackingData, setLiveTrackingData] = useState(null);
  
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  const [savedCards, setSavedCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  const withId = (item) => (item && typeof item === 'object' ? { ...item, _id: item._id || item.id } : item);
  const withIds = (arr) => (Array.isArray(arr) ? arr.map(withId) : []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }
    
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('images', file);
    
    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        const imageUrl = data.data?.url || data.url;
        await fetch(`${API_URL}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ avatar: imageUrl })
        });
        
        setProfileImage(imageUrl);
        sessionStorage.setItem('user_profile_image', imageUrl);
        localStorage.setItem('profileImage', imageUrl);
        if (updateUserProfile) {
          updateUserProfile({ profileImage: imageUrl });
        }
        toast.success('Profile picture updated! ✨');
      }
    } catch (error) {
      toast.error('Failed to upload');
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    fetchAllData();
  }, [user, token]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserData(),
      fetchAddresses(),
      fetchOrders(),
      fetchReviews(),
      fetchSavedCards()
    ]);
    setLoading(false);
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const json = await response.json();
        const data = json.data || json;
        setUserData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          gender: data.gender || '',
          dob: data.dob || '',
          createdAt: data.created_at ? new Date(data.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
        });
        
        if (data.avatar || data.profileImage) {
          let imgUrl = data.avatar || data.profileImage;
          if (imgUrl.startsWith('/')) imgUrl = `${API_URL}${imgUrl}`;
          setProfileImage(imgUrl);
          sessionStorage.setItem('user_profile_image', imgUrl);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAddresses(withIds((data.data || []).map(a => ({
          ...a,
          fullName: a.name,
          addressLine1: a.line1,
          addressLine2: a.line2,
          isDefault: !!a.is_default,
        }))));
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/orders/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let ordersArray = [];
      if (response.ok) {
        const data = await response.json();
        ordersArray = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      }

      const normalized = ordersArray.map(order => {
        let parsedAddress = order.shippingAddress || order.shipping_address;
        if (typeof parsedAddress === 'string') {
          try { parsedAddress = JSON.parse(parsedAddress); } catch (e) {}
        }
        return {
          ...order,
          _id: order._id || order.id,
          createdAt: order.createdAt || order.created_at,
          updatedAt: order.updatedAt || order.updated_at,
          total: order.total || order.total_amount || order.subtotal || 0,
          shippingAddress: parsedAddress,
          paymentMethod: order.paymentMethod || order.payment_method,
          paymentStatus: order.paymentStatus || order.payment_status,
          items: (order.items || []).map(item => ({
            ...item,
            productId: item.productId || item.product_id || item.id,
            name: item.name || item.product_name,
            image: item.image || item.product_image || item.img,
            price: item.price || item.unit_price || 0,
          })),
        };
      });

      setOrders(normalized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reviews/my-reviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReviews(withIds(data.data || []));
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchSavedCards = async () => {
    setCardsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users/cards`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSavedCards(withIds((data.data || []).map(c => ({
          ...c,
          last4: c.card_last4,
          expiryMonth: c.expiry_month,
          expiryYear: c.expiry_year,
          isDefault: !!c.is_default,
        }))));
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    } finally {
      setCardsLoading(false);
    }
  };

  const handleFieldUpdate = async (field, value) => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ [field]: value })
      });
      
      const json = await response.json();
      
      if (response.ok && json.success) {
        const updatedData = json.data || json;
        setUserData(prev => ({
          ...prev,
          [field]: updatedData[field] !== undefined ? updatedData[field] : value
        }));
        setEditingField(null);
        
        const fieldLabels = { name: 'Name', email: 'Email', phone: 'Phone number', gender: 'Gender', dob: 'Date of Birth' };
        toast.success(`${fieldLabels[field] || field} Changed Successfully! ✨`);
        fetchUserData();
      } else {
        toast.error(json.error || 'Update failed');
      }
    } catch (error) {
      toast.error('Error updating field');
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      if (response.ok) {
        toast.success('Password Changed Successfully! 🔒');
        setShowPasswordEdit(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Current password is incorrect');
      }
    } catch (error) {
      toast.error('Error changing password');
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const url = editingAddress 
      ? `${API_URL}/api/users/addresses/${editingAddress.id || editingAddress._id}`
      : `${API_URL}/api/users/addresses`;
    const method = editingAddress ? 'PUT' : 'POST';

    const payload = {
      name: addressForm.fullName,
      phone: addressForm.phone,
      line1: addressForm.addressLine1,
      line2: addressForm.addressLine2,
      city: addressForm.city,
      state: addressForm.state,
      pincode: addressForm.pincode,
      isDefault: addressForm.isDefault,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        toast.success(editingAddress ? 'Address Updated! ✨' : 'Address Added! ✨');
        fetchAddresses();
        setShowAddressModal(false);
        setEditingAddress(null);
      } else {
        toast.error('Failed to save address');
      }
    } catch (error) {
      toast.error('Error saving address');
    }
  };

  const deleteAddress = async (id) => {
    if (!confirm('Delete this address?')) return;
    try {
      const response = await fetch(`${API_URL}/api/users/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Address deleted!');
        fetchAddresses();
      }
    } catch (error) {
      toast.error('Error deleting address');
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      await fetch(`${API_URL}/api/users/addresses/${id}/default`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Default address updated!');
      fetchAddresses();
    } catch (error) {
      toast.error('Error setting default');
    }
  };

  const cancelOrder = async (orderId) => {
    if (!confirm('Cancel this order?')) return;
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Order cancelled successfully!');
        fetchOrders();
      }
    } catch (error) {
      toast.error('Error cancelling order');
    }
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

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'text-emerald-600 bg-emerald-50';
      case 'shipped': return 'text-blue-600 bg-blue-50';
      case 'confirmed': return 'text-purple-600 bg-purple-50';
      case 'pending': case 'processing': return 'text-amber-600 bg-amber-50';
      case 'cancelled': case 'failed': return 'text-rose-600 bg-rose-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'Delivered';
      case 'shipped': return 'Shipped';
      case 'confirmed': return 'Confirmed';
      case 'pending': case 'processing': return 'Processing';
      case 'cancelled': return 'Cancelled';
      case 'failed': return 'Payment Failed';
      default: return status || 'Processing';
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return '✅';
      case 'shipped': return '🚚';
      case 'confirmed': return '📋';
      case 'pending': case 'processing': return '⏳';
      case 'cancelled': return '❌';
      case 'failed': return '💔';
      default: return '📦';
    }
  };

  const getInitials = (name) => {
    if (!name) return '👤';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getOrderIdDisplay = (order) => {
    if (!order) return 'N/A';
    if (order.order_number) return order.order_number;
    if (order.orderId) return order.orderId;
    const idVal = order._id || order.id;
    return idVal ? String(idVal).slice(-12).toUpperCase() : 'N/A';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status?.toLowerCase() === filterStatus);

  return (
    <>
      <Helmet>
        <title>My Account - MyPinkShop</title>
        <meta name="description" content="Manage your MyPinkShop account, orders, and addresses." />
        <link rel="canonical" href="https://www.mypinkshop.com/profile" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        <OfferBanner />

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
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
                
                <Avatar user={user} onLogout={logout} />
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            {activeTab === 'hub' ? (
              <span className="text-pink-600 font-medium">My Account</span>
            ) : (
              <>
                <button onClick={() => setActiveTab('hub')} className="text-gray-500 hover:text-pink-500 transition">My Account</button>
                <span className="text-gray-400">/</span>
                <span className="text-pink-600 font-medium capitalize">{activeTab}</span>
              </>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-6xl">
          
          {/* Top Profile Banner */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-2xl text-white overflow-hidden shadow-inner">
                  {profileImage ? (
                    <img src={getImageUrl(profileImage)} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-xl">{getInitials(userData.name)}</span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center cursor-pointer hover:bg-gray-50 border border-gray-200">
                  <input type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
                  <span className="text-pink-500 text-[10px]">📷</span>
                </label>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Hello, {userData.name || 'User'}! ✨</h2>
                <p className="text-sm text-gray-500">{userData.email} • {userData.phone || 'No phone added'}</p>
                <p className="text-xs text-gray-400 mt-0.5">Member since {userData.createdAt}</p>
              </div>
            </div>
            {activeTab !== 'hub' && (
              <button 
                onClick={() => setActiveTab('hub')}
                className="text-sm text-pink-600 bg-pink-50 border border-pink-200 px-4 py-2 rounded-xl hover:bg-pink-100 transition font-medium flex items-center gap-1.5"
              >
                ← Back to Dashboard
              </button>
            )}
          </div>

          {/* ================= AMAZON / NYKAA STYLE DASHBOARD HUB ================= */}
          {activeTab === 'hub' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Tile 1: Orders */}
              <div 
                onClick={() => setActiveTab('orders')}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-300 transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    📦
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Your Orders</h3>
                  <p className="text-sm text-gray-500">Track, return, or buy things again, and manage active shipments.</p>
                </div>
                <div className="mt-6 flex items-center text-sm font-semibold text-pink-600 group-hover:translate-x-1 transition-transform">
                  View Orders →
                </div>
              </div>

              {/* Tile 2: Addresses */}
              <div 
                onClick={() => setActiveTab('addresses')}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-300 transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    📍
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Your Addresses</h3>
                  <p className="text-sm text-gray-500">Edit addresses for orders and gifts, add new delivery locations.</p>
                </div>
                <div className="mt-6 flex items-center text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                  Manage Addresses →
                </div>
              </div>

              {/* Tile 3: Profile Details */}
              <div 
                onClick={() => setActiveTab('profile')}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-300 transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    👤
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Login & Security</h3>
                  <p className="text-sm text-gray-500">Edit name, email, phone number, gender, date of birth, and profile details.</p>
                </div>
                <div className="mt-6 flex items-center text-sm font-semibold text-purple-600 group-hover:translate-x-1 transition-transform">
                  Edit Profile →
                </div>
              </div>

              {/* Tile 4: Wishlist */}
              <div 
                onClick={() => setActiveTab('wishlist')}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-300 transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    ❤️
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Your Wishlist</h3>
                  <p className="text-sm text-gray-500">View saved favorite items, skincare products, and fashion items.</p>
                </div>
                <div className="mt-6 flex items-center text-sm font-semibold text-rose-600 group-hover:translate-x-1 transition-transform">
                  View Wishlist →
                </div>
              </div>

              {/* Tile 5: Payments */}
              <div 
                onClick={() => setActiveTab('payments')}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-300 transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    💳
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Payment Options</h3>
                  <p className="text-sm text-gray-500">Manage saved credit/debit cards and preferred UPI IDs for quick checkout.</p>
                </div>
                <div className="mt-6 flex items-center text-sm font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
                  Manage Payments →
                </div>
              </div>

              {/* Tile 6: Security / Password */}
              <div 
                onClick={() => setActiveTab('security')}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-300 transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    🔐
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Security & Password</h3>
                  <p className="text-sm text-gray-500">Change your password and secure your account against unauthorized access.</p>
                </div>
                <div className="mt-6 flex items-center text-sm font-semibold text-amber-600 group-hover:translate-x-1 transition-transform">
                  Update Password →
                </div>
              </div>

            </div>
          )}

          {/* ================= ORDERS TAB ================= */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3 bg-[#fffafb]">
                <h3 className="font-semibold text-gray-800 text-lg">
                  My Orders ({filteredOrders.length})
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'pending', 'confirmed', 'shipped', 'delivered'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        filterStatus === status 
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' 
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-pink-300'
                      }`}
                    >
                      {status === 'all' ? 'All' : getStatusText(status)}
                    </button>
                  ))}
                </div>
              </div>
              
              {ordersLoading ? (
                <div className="p-10 text-center">
                  <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-400 mt-3">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-3">📦</div>
                  <p className="text-gray-500 font-medium">No orders found</p>
                  <Link to="/shop" className="inline-block mt-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg transition">Start Shopping →</Link>
                </div>
              ) : (
                <div className="p-4 sm:p-6 space-y-6">
                  {filteredOrders.map(order => {
                    const canCancel = ['pending', 'confirmed'].includes(order.status?.toLowerCase()) && order.paymentStatus !== 'failed';
                    const isCancelled = ['cancelled', 'failed'].includes(order.status?.toLowerCase());
                    const isDelivered = order.status?.toLowerCase() === 'delivered';

                    return (
                      <div key={order._id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition ${isCancelled ? 'border-rose-200 opacity-70' : isDelivered ? 'border-emerald-200' : 'border-pink-100'}`}>
                        <div className={`px-5 py-3 flex flex-wrap justify-between items-center gap-3 border-b ${isCancelled ? 'bg-rose-50' : isDelivered ? 'bg-emerald-50' : 'bg-pink-50/80'}`}>
                          <div className="flex items-center gap-6 flex-wrap">
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ORDER ID</span>
                              <p className="text-sm font-mono font-bold text-gray-800">{getOrderIdDisplay(order)}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ORDER DATE</span>
                              <p className="text-sm font-medium text-gray-700">{formatDate(order.createdAt)}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">TOTAL</span>
                              <p className="text-sm font-bold text-pink-600">₹{order.total?.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)} flex items-center gap-1.5`}>
                            <span>{getStatusIcon(order.status)}</span>
                            {getStatusText(order.status)}
                          </div>
                        </div>

                        <div className="px-5 py-4">
                          {order.items && order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 py-3 border-b border-pink-50 last:border-0">
                              <Link to={`/product/${item.productId}`} className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-pink-100 flex-shrink-0 flex items-center justify-center p-1 hover:shadow-md transition">
                                {item.image ? (
                                  <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-contain" />
                                ) : (
                                  <div className="text-2xl">🛍️</div>
                                )}
                              </Link>
                              <div className="flex-1">
                                <Link to={`/product/${item.productId}`} className="font-semibold text-gray-800 text-sm hover:text-pink-600 transition line-clamp-1">{item.name}</Link>
                                <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-800">₹{(item.price * item.quantity)?.toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="px-5 py-3 border-t bg-gray-50/50 flex flex-wrap gap-3 justify-between items-center">
                          <button 
                            onClick={() => handleTrackOrder(order)} 
                            className="px-4 py-1.5 text-pink-600 border border-pink-200 rounded-full hover:bg-pink-50 transition text-sm font-medium flex items-center gap-1"
                          >
                            📍 Track Order
                          </button>
                          {canCancel && !isCancelled && (
                            <button 
                              onClick={() => cancelOrder(order._id)} 
                              className="px-4 py-1.5 text-rose-600 border border-rose-200 rounded-full hover:bg-rose-50 transition text-sm font-medium"
                            >
                              ❌ Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= ADDRESSES TAB ================= */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 text-lg">Saved Addresses</h3>
                <button
                  onClick={() => {
                    setEditingAddress(null);
                    setAddressForm({ 
                      fullName: userData.name || '', 
                      phone: userData.phone || '', 
                      pincode: '', 
                      addressLine1: '', 
                      addressLine2: '', 
                      city: '', 
                      state: '', 
                      isDefault: addresses.length === 0 
                    });
                    setShowAddressModal(true);
                  }}
                  className="bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-pink-600 transition shadow-sm"
                >
                  + Add New Address
                </button>
              </div>
              
              {addresses.length === 0 ? (
                <div className="p-12 text-center text-gray-400">No addresses saved yet</div>
              ) : (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <div key={addr._id} className="border border-pink-100 bg-pink-50/30 rounded-2xl p-5 relative hover:shadow-md transition">
                      {addr.isDefault && (
                        <span className="absolute top-4 right-4 text-xs bg-pink-100 text-pink-600 px-2.5 py-1 rounded-full font-semibold">Default</span>
                      )}
                      <p className="font-bold text-gray-800 text-base mb-1">{addr.fullName}</p>
                      <p className="text-sm text-gray-600">{addr.addressLine1}</p>
                      {addr.addressLine2 && <p className="text-sm text-gray-600">{addr.addressLine2}</p>}
                      <p className="text-sm text-gray-600">{addr.city}, {addr.state} - <span className="font-mono font-medium">{addr.pincode}</span></p>
                      <p className="text-sm text-gray-600 mt-2">📞 {addr.phone}</p>
                      
                      <div className="mt-4 pt-3 border-t border-pink-100 flex gap-3">
                        <button onClick={() => {
                          setEditingAddress(addr);
                          setAddressForm(addr);
                          setShowAddressModal(true);
                        }} className="text-sm text-blue-600 font-medium hover:underline">Edit</button>
                        <button onClick={() => deleteAddress(addr._id)} className="text-sm text-rose-600 font-medium hover:underline">Delete</button>
                        {!addr.isDefault && (
                          <button onClick={() => setDefaultAddress(addr._id)} className="text-sm text-gray-500 font-medium hover:underline">Set Default</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= PROFILE / SECURITY DETAILS TAB ================= */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-lg">Login & Security / Profile Details</h3>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="p-6 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Full Name</p>
                    <p className="font-semibold text-gray-800 text-base mt-0.5">{userData.name}</p>
                  </div>
                  {editingField === 'name' ? (
                    <div className="flex gap-2">
                      <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-pink-500" />
                      <button onClick={() => handleFieldUpdate('name', editValue)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium">Save</button>
                      <button onClick={() => setEditingField(null)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-sm">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingField('name'); setEditValue(userData.name); }} className="text-pink-600 font-semibold text-sm hover:underline">Edit</button>
                  )}
                </div>

                <div className="p-6 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Email Address</p>
                    <p className="font-semibold text-gray-800 text-base mt-0.5">{userData.email}</p>
                  </div>
                  {editingField === 'email' ? (
                    <div className="flex gap-2">
                      <input type="email" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-pink-500" />
                      <button onClick={() => handleFieldUpdate('email', editValue)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium">Save</button>
                      <button onClick={() => setEditingField(null)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-sm">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingField('email'); setEditValue(userData.email); }} className="text-pink-600 font-semibold text-sm hover:underline">Edit</button>
                  )}
                </div>

                <div className="p-6 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Phone Number</p>
                    <p className="font-semibold text-gray-800 text-base mt-0.5">{userData.phone || 'Not added'}</p>
                  </div>
                  {editingField === 'phone' ? (
                    <div className="flex gap-2">
                      <input type="tel" value={editValue} onChange={(e) => setEditValue(e.target.value)} maxLength="10" className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-pink-500" />
                      <button onClick={() => handleFieldUpdate('phone', editValue)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium">Save</button>
                      <button onClick={() => setEditingField(null)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-sm">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingField('phone'); setEditValue(userData.phone || ''); }} className="text-pink-600 font-semibold text-sm hover:underline">Edit</button>
                  )}
                </div>

                <div className="p-6 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Gender</p>
                    <p className="font-semibold text-gray-800 text-base mt-0.5">{userData.gender || 'Not specified'}</p>
                  </div>
                  {editingField === 'gender' ? (
                    <div className="flex gap-2">
                      <select value={editValue} onChange={(e) => setEditValue(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-pink-500 bg-white">
                        <option value="">Select</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                      <button onClick={() => handleFieldUpdate('gender', editValue)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium">Save</button>
                      <button onClick={() => setEditingField(null)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-sm">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingField('gender'); setEditValue(userData.gender || ''); }} className="text-pink-600 font-semibold text-sm hover:underline">Edit</button>
                  )}
                </div>

                <div className="p-6 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Date of Birth</p>
                    <p className="font-semibold text-gray-800 text-base mt-0.5">{userData.dob || 'Not specified'}</p>
                  </div>
                  {editingField === 'dob' ? (
                    <div className="flex gap-2">
                      <input type="date" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-pink-500" />
                      <button onClick={() => handleFieldUpdate('dob', editValue)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium">Save</button>
                      <button onClick={() => setEditingField(null)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-sm">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingField('dob'); setEditValue(userData.dob || ''); }} className="text-pink-600 font-semibold text-sm hover:underline">Edit</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= WISHLIST TAB ================= */}
          {activeTab === 'wishlist' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-lg">My Wishlist ({wishlist?.length || 0})</h3>
              </div>
              {!wishlist || wishlist.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-400 mb-3">Your wishlist is empty</p>
                  <Link to="/shop" className="inline-block bg-pink-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-pink-600 transition">Start Shopping →</Link>
                </div>
              ) : (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlist.map(product => (
                    <div key={product.id} className="border border-pink-100 rounded-2xl p-4 flex items-center gap-4 bg-white shadow-sm hover:shadow-md transition">
                      <Link to={`/product/${product.id}`} className="shrink-0">
                        <img src={getImageUrl(product.image)} alt={product.name} className="w-20 h-20 object-cover rounded-xl border border-pink-100" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${product.id}`} className="font-semibold text-gray-800 text-sm hover:text-pink-500 line-clamp-1">
                          {product.name}
                        </Link>
                        <p className="text-pink-600 font-bold text-base mt-1">₹{product.price}</p>
                        <button 
                          onClick={() => {
                            removeFromWishlist(product.id);
                            toast.success('Removed from wishlist');
                          }} 
                          className="text-rose-500 text-xs font-medium mt-2 hover:underline flex items-center gap-1"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= PAYMENTS TAB ================= */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-lg">Payment Options (Saved Cards & UPI)</h3>
              </div>
              <div className="p-6">
                {savedCards.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-4xl mb-2">💳</p>
                    <p>No saved cards or payment options found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedCards.map(card => (
                      <div key={card._id} className="p-4 border rounded-xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💳</span>
                          <div>
                            <p className="font-bold text-gray-800">•••• {card.last4}</p>
                            <p className="text-xs text-gray-500">Expires {card.expiryMonth}/{card.expiryYear}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= SECURITY TAB ================= */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-xl mx-auto">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-lg">Change Password</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password *</label>
                  <input type="password" placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password (min 6 chars) *</label>
                  <input type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password *</label>
                  <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-pink-500" />
                </div>
                <div className="pt-2 flex gap-3">
                  <button onClick={handlePasswordUpdate} className="flex-1 bg-pink-500 text-white py-3 rounded-xl font-semibold hover:bg-pink-600 transition shadow-md">Update Password</button>
                  <button onClick={() => setActiveTab('hub')} className="px-6 bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">Cancel</button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* LIVE TRACKING MODAL */}
        {showTracking && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowTracking(false)}>
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white p-4 border-b border-pink-100 rounded-t-2xl flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">📍 Track Order #{getOrderIdDisplay(selectedOrder)}</h3>
                <button onClick={() => setShowTracking(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
              <div className="p-6">
                {trackingLoading ? (
                  <div className="text-center py-10">
                    <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-sm text-gray-400">Fetching live tracking updates...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-pink-100">
                      
                      <div className="relative">
                        <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</div>
                        <p className="font-semibold text-gray-800 text-sm">Order Placed (Website)</p>
                        <p className="text-xs text-gray-400">{formatDate(selectedOrder.createdAt)}</p>
                      </div>

                      <div className="relative">
                        <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs ${['confirmed', 'shipped', 'delivered'].includes(selectedOrder.status?.toLowerCase()) ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                          {['confirmed', 'shipped', 'delivered'].includes(selectedOrder.status?.toLowerCase()) ? '✓' : '•'}
                        </div>
                        <p className={`font-semibold text-sm ${['confirmed', 'shipped', 'delivered'].includes(selectedOrder.status?.toLowerCase()) ? 'text-gray-800' : 'text-gray-400'}`}>
                          Order Processed & Confirmed (Admin Panel)
                        </p>
                        <p className="text-xs text-gray-400">
                          {['confirmed', 'shipped', 'delivered'].includes(selectedOrder.status?.toLowerCase()) ? formatDate(selectedOrder.updatedAt || selectedOrder.createdAt) : 'Pending admin review'}
                        </p>
                      </div>

                      {liveTrackingData?.tracking_data?.shipment_track ? (
                        liveTrackingData.tracking_data.shipment_track.map((track, idx) => (
                          <div key={idx} className="relative">
                            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs">📦</div>
                            <p className="font-semibold text-gray-800 text-sm">{track.current_status || 'In Transit'}</p>
                            <p className="text-xs text-gray-500">{track.location || 'Hub'} - {track.activity}</p>
                            <p className="text-xs text-gray-400">{track.date}</p>
                          </div>
                        ))
                      ) : (
                        <div className="relative">
                          <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs">⏳</div>
                          <p className="font-semibold text-gray-600 text-sm">Awaiting Courier Pickup (Shiprocket)</p>
                          <p className="text-xs text-gray-400">Shipment is being prepared for dispatch from our Mumbai warehouse.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddressModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 bg-white">
                <h3 className="text-lg font-semibold">{editingAddress ? 'Edit Address' : 'Add Address'}</h3>
                <button onClick={() => setShowAddressModal(false)} className="text-gray-400 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleAddressSubmit} className="p-5 space-y-3">
                <input type="text" placeholder="Full Name *" value={addressForm.fullName} onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-pink-500 outline-none" required />
                <input type="tel" placeholder="Mobile Number *" value={addressForm.phone} onChange={(e) => setAddressForm({...addressForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10)})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-pink-500 outline-none" required maxLength="10" />
                <input type="text" placeholder="Pincode *" value={addressForm.pincode} onChange={(e) => setAddressForm({...addressForm, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6)})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-pink-500 outline-none" required maxLength="6" />
                <input type="text" placeholder="Address Line 1 *" value={addressForm.addressLine1} onChange={(e) => setAddressForm({...addressForm, addressLine1: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-pink-500 outline-none" required />
                <input type="text" placeholder="Address Line 2 (Optional)" value={addressForm.addressLine2} onChange={(e) => setAddressForm({...addressForm, addressLine2: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-pink-500 outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="City *" value={addressForm.city} onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-pink-500 outline-none" required />
                  <input type="text" placeholder="State *" value={addressForm.state} onChange={(e) => setAddressForm({...addressForm, state: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-pink-500 outline-none" required />
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})} /> Set as default
                </label>
                <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2.5 rounded-xl font-medium hover:shadow-lg transition">
                  {editingAddress ? 'Update Address' : 'Add Address'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12 sm:py-16 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
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

export default Profile;
