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
  const { addToCart, cartCount } = useCart();
  const { wishlistCount, wishlist, removeFromWishlist } = useWishlist();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Profile Image
  const [profileImage, setProfileImage] = useState(() => {
    return sessionStorage.getItem('user_profile_image') || null;
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // User Data
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    emailVerified: false,
    phoneVerified: false,
    createdAt: '',
    profileImage: null
  });
  
  // Edit States
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
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
    isDefault: false,
    addressType: 'home'
  });
  
  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchOrder, setSearchOrder] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    wishlistCount: 0,
    reviewCount: 0
  });

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  // ========== HANDLE SEARCH ==========
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

  // ========== PROFILE IMAGE UPLOAD ==========
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
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
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        const imageUrl = data.url;
        
        const updateResponse = await fetch(`${API_URL}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ profileImage: imageUrl })
        });
        
        if (!updateResponse.ok) {
          throw new Error('Failed to update profile image');
        }
        
        setProfileImage(imageUrl);
        sessionStorage.setItem('user_profile_image', imageUrl);
        localStorage.setItem('profileImage', imageUrl);
        
        if (updateUserProfile) {
          updateUserProfile({ profileImage: imageUrl });
        }
        
        toast.success('Profile picture updated! ✨');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  // ========== FETCH FUNCTIONS ==========
  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    
    fetchAllData();
  }, [user, token, navigate]);

  useEffect(() => {
    const savedImage = sessionStorage.getItem('user_profile_image');
    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserData(),
      fetchAddresses(),
      fetchOrders(),
      fetchReviews(),
      fetchStats()
    ]);
    setLoading(false);
  };

  const fetchUserData = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setUserData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          gender: data.gender || '',
          dob: data.dob || '',
          emailVerified: data.emailVerified || false,
          phoneVerified: data.phoneVerified || false,
          createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
          profileImage: data.profileImage || null
        });
        
        if (data.profileImage) {
          setProfileImage(data.profileImage);
          sessionStorage.setItem('user_profile_image', data.profileImage);
          localStorage.setItem('profileImage', data.profileImage);
          if (updateUserProfile) {
            updateUserProfile({ profileImage: data.profileImage });
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast.error('Failed to load profile data');
    }
  };

  const fetchAddresses = async () => {
    if (!token) return;
    setAddressLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/users/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setAddressLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    setOrdersLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/orders/my-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const sortedOrders = (data.orders || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders);
        setFilteredOrders(sortedOrders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!token) return;
    setReviewsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/reviews/my-reviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return;
    
    try {
      const [ordersRes, wishlistRes, reviewsRes] = await Promise.all([
        fetch(`${API_URL}/api/orders/my-orders`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/wishlist`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/reviews/my-reviews`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const ordersData = await ordersRes.json();
      const wishlistData = await wishlistRes.json();
      const reviewsData = await reviewsRes.json();
      
      const totalSpent = (ordersData.orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
      
      setStats({
        totalOrders: (ordersData.orders || []).length,
        totalSpent: totalSpent,
        wishlistCount: (wishlistData.wishlist || []).length,
        reviewCount: (reviewsData.reviews || []).length
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Filter orders
  useEffect(() => {
    let filtered = orders;
    if (searchOrder) {
      filtered = filtered.filter(order => 
        order._id?.toLowerCase().includes(searchOrder.toLowerCase()) || 
        order.id?.toLowerCase().includes(searchOrder.toLowerCase())
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => 
        order.status?.toLowerCase() === filterStatus.toLowerCase()
      );
    }
    setFilteredOrders(filtered);
  }, [searchOrder, filterStatus, orders]);

  // ========== UPDATE FUNCTIONS ==========
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
      
      if (response.ok) {
        const data = await response.json();
        setUserData(prev => ({ ...prev, [field]: data[field] || value }));
        setEditingField(null);
        toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated! ✨`);
        fetchUserData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Update failed');
      }
    } catch (error) {
      toast.error('Error updating field');
    }
  };

  // ========== ADDRESS FUNCTIONS ==========
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    
    if (!addressForm.fullName.trim()) {
      toast.error('Please enter full name');
      return;
    }
    if (!/^[0-9]{10}$/.test(addressForm.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    if (!/^[0-9]{6}$/.test(addressForm.pincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }
    if (!addressForm.addressLine1.trim()) {
      toast.error('Please enter address line 1');
      return;
    }
    if (!addressForm.city.trim()) {
      toast.error('Please enter city');
      return;
    }
    if (!addressForm.state.trim()) {
      toast.error('Please enter state');
      return;
    }
    
    const url = editingAddress 
      ? `${API_URL}/api/users/addresses/${editingAddress._id}`
      : `${API_URL}/api/users/addresses`;
    const method = editingAddress ? 'PUT' : 'POST';
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addressForm)
      });
      
      if (response.ok) {
        toast.success(editingAddress ? 'Address updated! ✨' : 'Address added! ✨');
        fetchAddresses();
        setShowAddressModal(false);
        setEditingAddress(null);
        setAddressForm({
          fullName: '',
          phone: '',
          pincode: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          isDefault: false,
          addressType: 'home'
        });
      } else {
        toast.error('Failed to save address');
      }
    } catch (error) {
      toast.error('Error saving address');
    }
  };

  const deleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Address deleted!');
        fetchAddresses();
      } else {
        toast.error('Failed to delete address');
      }
    } catch (error) {
      toast.error('Error deleting address');
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/users/addresses/${id}/default`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Default address updated!');
        fetchAddresses();
      } else {
        toast.error('Failed to set default address');
      }
    } catch (error) {
      toast.error('Error setting default address');
    }
  };

  // ========== ORDER FUNCTIONS ==========
  const handleReorder = async (order) => {
    try {
      for (const item of order.items) {
        addToCart({
          id: item.productId || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          image: item.image,
          stock: item.stock
        });
      }
      toast.success('Items added to cart! 🛒');
      navigate('/cart');
    } catch (error) {
      toast.error('Error adding items to cart');
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Order cancelled!');
        fetchOrders();
      } else {
        toast.error('Failed to cancel order');
      }
    } catch (error) {
      toast.error('Error cancelling order');
    }
  };

  // ========== UI HELPERS ==========
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'text-emerald-600 bg-emerald-50';
      case 'shipped': return 'text-blue-600 bg-blue-50';
      case 'confirmed': return 'text-purple-600 bg-purple-50';
      case 'processing': return 'text-amber-600 bg-amber-50';
      case 'pending': return 'text-amber-600 bg-amber-50';
      case 'cancelled': return 'text-rose-600 bg-rose-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'Delivered';
      case 'shipped': return 'Shipped';
      case 'confirmed': return 'Confirmed';
      case 'processing': return 'Processing';
      case 'pending': return 'Processing';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Processing';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'addresses', label: 'Addresses', icon: '📍' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
    { id: 'reviews', label: 'Reviews', icon: '⭐' }
  ];

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-rose-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-pink-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Account - MyPinkShop | Profile & Orders</title>
        <meta name="description" content="Manage your MyPinkShop account. View orders, manage addresses, and update profile." />
        <link rel="canonical" href="https://www.mypinkshop.com/profile" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50/20 via-white to-rose-50/20">
        
        <OfferBanner />

        {/* Glass Header */}
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
              <Link to="/" className="flex items-center gap-2 shrink-0 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200/50 group-hover:scale-105 transition-transform">
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
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200/50 transition-all text-sm sm:text-base"
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
                
                <Avatar user={user} onLogout={logout} />
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-400 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-300">/</span>
            <span className="text-pink-600 font-medium">My Account</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Profile Header - Glass */}
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-sm mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-4xl text-white overflow-hidden shadow-lg shadow-pink-200/50">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-2xl">{getInitials(userData.name)}</span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-gray-100 transition border border-pink-100">
                  <input type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
                  <span className="text-pink-500 text-sm">📷</span>
                </label>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-800">{userData.name || 'User'}</h2>
                <p className="text-gray-400">{userData.email}</p>
                <div className="flex flex-wrap gap-3 mt-2 justify-center md:justify-start">
                  <span className="text-xs bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full text-gray-600 border border-white/30">
                    📦 {stats.totalOrders} Orders
                  </span>
                  <span className="text-xs bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full text-gray-600 border border-white/30">
                    ❤️ {stats.wishlistCount} Wishlist
                  </span>
                  <span className="text-xs bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full text-gray-600 border border-white/30">
                    ⭐ {stats.reviewCount} Reviews
                  </span>
                  <span className="text-xs bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full text-gray-600 border border-white/30">
                    💰 ₹{stats.totalSpent.toLocaleString()} Spent
                  </span>
                </div>
              </div>
              <div className="md:ml-auto">
                <button 
                  onClick={logout}
                  className="px-4 py-2 text-rose-600 border border-rose-200 rounded-full hover:bg-rose-50/50 transition text-sm font-medium backdrop-blur-sm"
                >
                  Logout →
                </button>
              </div>
            </div>
          </div>

          {/* Tabs - Glass */}
          <div className="flex flex-wrap gap-2 mb-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200/50' 
                    : 'bg-white/40 backdrop-blur-sm border border-white/30 text-gray-600 hover:border-pink-300 hover:bg-white/60'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ========== OVERVIEW TAB ========== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-sm">
                  <p className="text-xs text-gray-400 font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-pink-600">{stats.totalOrders}</p>
                </div>
                <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-sm">
                  <p className="text-xs text-gray-400 font-medium">Total Spent</p>
                  <p className="text-2xl font-bold text-emerald-600">₹{stats.totalSpent.toLocaleString()}</p>
                </div>
                <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-sm">
                  <p className="text-xs text-gray-400 font-medium">Wishlist</p>
                  <p className="text-2xl font-bold text-rose-600">{stats.wishlistCount}</p>
                </div>
                <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-sm">
                  <p className="text-xs text-gray-400 font-medium">Reviews</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.reviewCount}</p>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/30 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-white/30 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Recent Orders</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-pink-600 text-sm hover:underline">View All →</button>
                </div>
                {orders.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-400">No orders yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/20">
                    {orders.slice(0, 3).map(order => (
                      <div key={order._id} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">#{order._id?.slice(-8)}</p>
                          <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">₹{order.total?.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== ORDERS TAB ========== */}
          {activeTab === 'orders' && (
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/30 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-white/30 flex flex-wrap justify-between items-center gap-3">
                <h3 className="font-semibold text-gray-800">Your Orders</h3>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="Search by ID..."
                    value={searchOrder}
                    onChange={(e) => setSearchOrder(e.target.value)}
                    className="px-3 py-1.5 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl text-sm focus:outline-none focus:border-pink-500"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1.5 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl text-sm focus:outline-none focus:border-pink-500"
                  >
                    <option value="all">All</option>
                    <option value="pending">Processing</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              {ordersLoading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-gray-400">No orders found</p>
                  <Link to="/shop" className="inline-block mt-3 text-pink-600 hover:underline">Start Shopping →</Link>
                </div>
              ) : (
                <div className="divide-y divide-white/20">
                  {filteredOrders.map(order => (
                    <div key={order._id} className="p-4 hover:bg-white/20 transition">
                      <div className="flex flex-wrap justify-between items-start gap-3">
                        <div>
                          <p className="font-semibold text-gray-800">#{order._id?.slice(-8)}</p>
                          <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-400 mt-1">{order.items?.length || 0} items</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">₹{order.total?.toLocaleString()}</p>
                          <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-3">
                        <button onClick={() => handleReorder(order)} className="text-sm text-pink-600 hover:underline">
                          Reorder
                        </button>
                        {(order.status === 'pending' || order.status === 'confirmed') && (
                          <button onClick={() => cancelOrder(order._id)} className="text-sm text-rose-600 hover:underline">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== ADDRESSES TAB ========== */}
          {activeTab === 'addresses' && (
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/30 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-white/30 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Your Addresses</h3>
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
                      isDefault: addresses.length === 0,
                      addressType: 'home'
                    });
                    setShowAddressModal(true);
                  }}
                  className="text-pink-600 text-sm hover:underline"
                >
                  + Add New
                </button>
              </div>
              
              {addressLoading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading addresses...</p>
                </div>
              ) : addresses.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">📍</div>
                  <p className="text-gray-400">No addresses saved</p>
                </div>
              ) : (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <div key={addr._id} className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:shadow-md transition">
                      {addr.isDefault && (
                        <span className="text-xs bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2 py-0.5 rounded-full mb-2 inline-block">
                          Default
                        </span>
                      )}
                      <span className="text-xs bg-gray-100/50 text-gray-600 px-2 py-0.5 rounded-full mb-2 ml-2 inline-block">
                        {addr.addressType === 'home' ? '🏠 Home' : addr.addressType === 'work' ? '💼 Work' : '📍 Other'}
                      </span>
                      <p className="font-semibold text-gray-800 mt-2">{addr.fullName}</p>
                      <p className="text-sm text-gray-600">{addr.addressLine1}</p>
                      {addr.addressLine2 && <p className="text-sm text-gray-600">{addr.addressLine2}</p>}
                      <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-sm text-gray-500 mt-1">📞 {addr.phone}</p>
                      <div className="flex gap-4 mt-3">
                        <button onClick={() => {
                          setEditingAddress(addr);
                          setAddressForm(addr);
                          setShowAddressModal(true);
                        }} className="text-sm text-pink-600 hover:underline">Edit</button>
                        <button onClick={() => deleteAddress(addr._id)} className="text-sm text-rose-600 hover:underline">Delete</button>
                        {!addr.isDefault && (
                          <button onClick={() => setDefaultAddress(addr._id)} className="text-sm text-gray-500 hover:underline">Set Default</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== PROFILE TAB ========== */}
          {activeTab === 'profile' && (
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/30 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-white/30">
                <h3 className="font-semibold text-gray-800">Profile Information</h3>
              </div>
              <div className="divide-y divide-white/20">
                {/* Name */}
                <div className="p-4 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Full Name</p>
                    <p className="font-medium text-gray-800">{userData.name}</p>
                  </div>
                  {editingField === 'name' ? (
                    <div className="flex gap-2">
                      <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="border border-white/30 rounded-xl px-3 py-1 text-sm bg-white/50" />
                      <button onClick={() => handleFieldUpdate('name', editValue)} className="text-emerald-500 text-sm">Save</button>
                      <button onClick={() => setEditingField(null)} className="text-gray-400 text-sm">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingField('name'); setEditValue(userData.name); }} className="text-pink-600 text-sm hover:underline">Edit</button>
                  )}
                </div>

                {/* Email */}
                <div className="p-4 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="font-medium text-gray-800">{userData.email}</p>
                    {!userData.emailVerified && <p className="text-xs text-amber-500">Not verified</p>}
                  </div>
                  {editingField === 'email' ? (
                    <div className="flex gap-2">
                      <input type="email" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="border border-white/30 rounded-xl px-3 py-1 text-sm bg-white/50" />
                      <button onClick={() => handleFieldUpdate('email', editValue)} className="text-emerald-500 text-sm">Save</button>
                      <button onClick={() => setEditingField(null)} className="text-gray-400 text-sm">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingField('email'); setEditValue(userData.email); }} className="text-pink-600 text-sm hover:underline">Edit</button>
                  )}
                </div>

                {/* Phone */}
                <div className="p-4 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="font-medium text-gray-800">{userData.phone || 'Not added'}</p>
                  </div>
                  {editingField === 'phone' ? (
                    <div className="flex gap-2">
                      <input type="tel" value={editValue} onChange={(e) => setEditValue(e.target.value)} maxLength="10" className="border border-white/30 rounded-xl px-3 py-1 text-sm bg-white/50" />
                      <button onClick={() => handleFieldUpdate('phone', editValue)} className="text-emerald-500 text-sm">Save</button>
                      <button onClick={() => setEditingField(null)} className="text-gray-400 text-sm">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingField('phone'); setEditValue(userData.phone || ''); }} className="text-pink-600 text-sm hover:underline">Edit</button>
                  )}
                </div>

                {/* Member Since */}
                <div className="p-4">
                  <p className="text-xs text-gray-400">Member Since</p>
                  <p className="font-medium text-gray-800">{userData.createdAt}</p>
                </div>
              </div>
            </div>
          )}

          {/* ========== WISHLIST TAB ========== */}
          {activeTab === 'wishlist' && (
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/30 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-white/30">
                <h3 className="font-semibold text-gray-800">My Wishlist ({wishlist?.length || 0})</h3>
              </div>
              {!wishlist || wishlist.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">🤍</div>
                  <p className="text-gray-400">Your wishlist is empty</p>
                  <Link to="/shop" className="inline-block mt-3 text-pink-600 hover:underline">Start Shopping →</Link>
                </div>
              ) : (
                <div className="divide-y divide-white/20">
                  {wishlist.map(product => (
                    <div key={product.id} className="p-4 flex gap-4 items-center">
                      <Link to={`/product/${product.id}`}>
                        <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-xl" />
                      </Link>
                      <div className="flex-1">
                        <Link to={`/product/${product.id}`} className="font-semibold text-gray-800 hover:text-pink-500">
                          {product.name}
                        </Link>
                        <p className="text-pink-600 font-bold mt-1">₹{product.price}</p>
                      </div>
                      <button 
                        onClick={() => {
                          removeFromWishlist(product.id);
                          toast.success('Removed from wishlist');
                        }} 
                        className="text-rose-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== REVIEWS TAB ========== */}
          {activeTab === 'reviews' && (
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/30 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-white/30">
                <h3 className="font-semibold text-gray-800">My Reviews</h3>
              </div>
              
              {reviewsLoading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">⭐</div>
                  <p className="text-gray-400">No reviews yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/20">
                  {reviews.map(review => (
                    <div key={review._id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link to={`/product/${review.productId?._id}`} className="font-semibold text-gray-800 hover:text-pink-500">
                            {review.productId?.name}
                          </Link>
                          <div className="flex text-yellow-400 text-sm mt-1">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Address Modal - Glass */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowAddressModal(false)}>
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-white/30 p-4 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-xl rounded-t-3xl">
                <h3 className="text-lg font-semibold">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                <button onClick={() => setShowAddressModal(false)} className="text-gray-400 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleAddressSubmit} className="p-5 space-y-3">
                <input 
                  type="text" 
                  placeholder="Full Name *" 
                  value={addressForm.fullName} 
                  onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200/50 transition" 
                  required 
                />
                <input 
                  type="tel" 
                  placeholder="Mobile Number (10 digits) *" 
                  value={addressForm.phone} 
                  onChange={(e) => setAddressForm({...addressForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10)})} 
                  className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200/50 transition" 
                  required 
                  maxLength="10"
                />
                <input 
                  type="text" 
                  placeholder="Pincode (6 digits) *" 
                  value={addressForm.pincode} 
                  onChange={(e) => setAddressForm({...addressForm, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6)})} 
                  className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200/50 transition" 
                  required 
                  maxLength="6"
                />
                <input 
                  type="text" 
                  placeholder="Address Line 1 *" 
                  value={addressForm.addressLine1} 
                  onChange={(e) => setAddressForm({...addressForm, addressLine1: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200/50 transition" 
                  required 
                />
                <input 
                  type="text" 
                  placeholder="Address Line 2 (Optional)" 
                  value={addressForm.addressLine2} 
                  onChange={(e) => setAddressForm({...addressForm, addressLine2: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200/50 transition" 
                />
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    placeholder="City *" 
                    value={addressForm.city} 
                    onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200/50 transition" 
                    required 
                  />
                  <input 
                    type="text" 
                    placeholder="State *" 
                    value={addressForm.state} 
                    onChange={(e) => setAddressForm({...addressForm, state: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200/50 transition" 
                    required 
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" name="addressType" checked={addressForm.addressType === 'home'} onChange={() => setAddressForm({...addressForm, addressType: 'home'})} /> 🏠 Home
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" name="addressType" checked={addressForm.addressType === 'work'} onChange={() => setAddressForm({...addressForm, addressType: 'work'})} /> 💼 Work
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" name="addressType" checked={addressForm.addressType === 'other'} onChange={() => setAddressForm({...addressForm, addressType: 'other'})} /> 📍 Other
                  </label>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})} /> Make default
                </label>
                <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-pink-200/50 transition">
                  {editingAddress ? 'Update Address' : 'Add Address'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Footer - Glass */}
        <footer className="bg-white/40 backdrop-blur-xl border-t border-white/30 text-gray-400 py-12 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-200/50">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <h3 className="font-bold text-white text-lg">MyPinkShop</h3>
                </div>
                <p className="text-sm text-gray-400">Luxury beauty and fashion for the modern woman.</p>
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
            <div className="text-center pt-8 border-t border-white/20">
              <p className="text-sm text-gray-400">© 2026 MyPinkShop. All rights reserved.</p>
              <p className="text-xs text-gray-500 mt-2">Made with 💖 for the girlies</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default Profile;
