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
  const [activeTab, setActiveTab] = useState('orders');
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
  
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  const [savedCards, setSavedCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardForm, setCardForm] = useState({
    last4: '',
    cardType: '',
    expiryMonth: '',
    expiryYear: '',
    isDefault: false
  });

  const [upiOptions, setUpiOptions] = useState([]);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiForm, setUpiForm] = useState({
    upiId: '',
    isDefault: false
  });

  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  // ========== SEARCH ==========
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

  // ========== PROFILE IMAGE ==========
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
        const imageUrl = data.url;
        
        await fetch(`${API_URL}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ profileImage: imageUrl })
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

  // ========== FETCH DATA ==========
  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    fetchAllData();
  }, [user, token]);

  useEffect(() => {
    const savedImage = sessionStorage.getItem('user_profile_image');
    if (savedImage) setProfileImage(savedImage);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserData(),
      fetchAddresses(),
      fetchOrders(),
      fetchReviews(),
      fetchSavedCards(),
      fetchUpiOptions()
    ]);
    setLoading(false);
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          gender: data.gender || '',
          dob: data.dob || '',
          createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
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
    }
  };

  const fetchAddresses = async () => {
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
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/orders/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const ordersData = Array.isArray(data) ? data : (data.orders || data.order || []);
        // ✅ FILTER: Cancelled orders ko hatao
        const filteredOrders = ordersData.filter(o => o.status?.toLowerCase() !== 'cancelled');
        const sortedOrders = filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders);
        console.log('✅ Orders fetched:', sortedOrders.length);
      } else {
        const fallbackRes = await fetch(`${API_URL}/api/orders/my-orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          const ordersData = Array.isArray(data) ? data : (data.orders || data.order || []);
          const filteredOrders = ordersData.filter(o => o.status?.toLowerCase() !== 'cancelled');
          const sortedOrders = filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setOrders(sortedOrders);
          console.log('✅ Orders fetched (fallback):', sortedOrders.length);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
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
        setReviews(data.reviews || []);
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
        setSavedCards(data.cards || []);
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    } finally {
      setCardsLoading(false);
    }
  };

  const fetchUpiOptions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/upi`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUpiOptions(data.upi || []);
      }
    } catch (error) {
      console.error('Failed to fetch UPI:', error);
    }
  };

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
      
      const data = await response.json();
      
      if (response.ok) {
        setUserData(prev => ({ ...prev, [field]: data[field] || value }));
        setEditingField(null);
        toast.success(`${field} updated! ✨`);
        fetchUserData();
      } else {
        toast.error(data.error || 'Update failed');
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      if (response.ok) {
        toast.success('Password changed! 🔒');
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

  // ========== ADDRESS FUNCTIONS ==========
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    
    if (!addressForm.fullName.trim() || !addressForm.phone || !addressForm.pincode || !addressForm.addressLine1 || !addressForm.city || !addressForm.state) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (!/^[0-9]{10}$/.test(addressForm.phone)) {
      toast.error('Enter valid 10-digit phone');
      return;
    }
    if (!/^[0-9]{6}$/.test(addressForm.pincode)) {
      toast.error('Enter valid 6-digit pincode');
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
          isDefault: false
        });
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
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Default address updated!');
      fetchAddresses();
    } catch (error) {
      toast.error('Error setting default');
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
          image: item.image
        });
      }
      toast.success('Added to cart! 🛒');
      navigate('/cart');
    } catch (error) {
      toast.error('Error adding to cart');
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
        toast.success('Order cancelled!');
        fetchOrders();
      }
    } catch (error) {
      toast.error('Error cancelling');
    }
  };

  // ========== CARD FUNCTIONS ==========
  const handleAddCard = async () => {
    if (!cardForm.last4 || cardForm.last4.length !== 4) {
      toast.error('Enter last 4 digits');
      return;
    }
    if (!cardForm.expiryMonth || cardForm.expiryMonth.length !== 2) {
      toast.error('Enter expiry month (MM)');
      return;
    }
    if (!cardForm.expiryYear || cardForm.expiryYear.length !== 4) {
      toast.error('Enter expiry year (YYYY)');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/users/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cardForm)
      });
      
      if (response.ok) {
        toast.success('Card saved! 💳');
        setShowCardModal(false);
        setCardForm({ last4: '', cardType: '', expiryMonth: '', expiryYear: '', isDefault: false });
        fetchSavedCards();
      } else {
        toast.error('Failed to save card');
      }
    } catch (error) {
      toast.error('Error saving card');
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!confirm('Delete this card?')) return;
    try {
      const response = await fetch(`${API_URL}/api/users/cards/${cardId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Card deleted!');
        fetchSavedCards();
      }
    } catch (error) {
      toast.error('Error deleting card');
    }
  };

  // ========== UPI FUNCTIONS ==========
  const handleAddUpi = async () => {
    if (!upiForm.upiId || !upiForm.upiId.includes('@')) {
      toast.error('Enter valid UPI ID (example@upi)');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/users/upi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(upiForm)
      });
      
      if (response.ok) {
        toast.success('UPI added! 📱');
        setShowUpiModal(false);
        setUpiForm({ upiId: '', isDefault: false });
        fetchUpiOptions();
      } else {
        toast.error('Failed to add UPI');
      }
    } catch (error) {
      toast.error('Error adding UPI');
    }
  };

  const handleDeleteUpi = async (upiId) => {
    if (!confirm('Delete this UPI?')) return;
    try {
      const response = await fetch(`${API_URL}/api/users/upi/${upiId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('UPI deleted!');
        fetchUpiOptions();
      }
    } catch (error) {
      toast.error('Error deleting UPI');
    }
  };

  // ========== UI HELPERS ==========
  const getStatusColor = (status) => {
    const colors = {
      delivered: 'text-emerald-600 bg-emerald-50',
      shipped: 'text-blue-600 bg-blue-50',
      confirmed: 'text-purple-600 bg-purple-50',
      pending: 'text-amber-600 bg-amber-50',
      processing: 'text-amber-600 bg-amber-50',
      cancelled: 'text-rose-600 bg-rose-50'
    };
    return colors[status?.toLowerCase()] || 'text-gray-600 bg-gray-50';
  };

  const getStatusText = (status) => {
    const texts = {
      delivered: 'Delivered',
      shipped: 'Shipped',
      confirmed: 'Confirmed',
      pending: 'Processing',
      processing: 'Processing',
      cancelled: 'Cancelled'
    };
    return texts[status?.toLowerCase()] || status || 'Processing';
  };

  const getInitials = (name) => {
    if (!name) return '👤';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // ✅ MPS- Format Order ID
  const getOrderIdDisplay = (order) => {
    if (!order) return 'N/A';
    
    if (order.orderId && order.orderId.startsWith('MPS-')) {
      return order.orderId;
    }
    
    if (order._id) {
      return order._id.slice(-12).toUpperCase();
    }
    
    return 'N/A';
  };

  // ========== TABS ==========
  const tabs = [
    { id: 'orders', label: '📦 Orders' },
    { id: 'addresses', label: '📍 Addresses' },
    { id: 'profile', label: '👤 Profile' },
    { id: 'wishlist', label: '❤️ Wishlist' },
    { id: 'reviews', label: '⭐ Reviews' },
    { id: 'payments', label: '💳 Payments' },
    { id: 'security', label: '🔐 Security' }
  ];

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

  // Filter orders - Cancelled ko hatao
  const filteredOrders = filterStatus === 'all' 
    ? orders.filter(o => o.status?.toLowerCase() !== 'cancelled')
    : orders.filter(o => o.status?.toLowerCase() === filterStatus);

  return (
    <>
      <Helmet>
        <title>My Account - MyPinkShop</title>
        <meta name="description" content="Manage your MyPinkShop account." />
        <link rel="canonical" href="https://www.mypinkshop.com/profile" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        
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
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">My Account</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-2xl text-white overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
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
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-800">{userData.name || 'User'}</h2>
                <p className="text-sm text-gray-500">{userData.email}</p>
                <p className="text-xs text-gray-400">Member since {userData.createdAt}</p>
              </div>
              <button 
                onClick={logout}
                className="text-sm text-rose-600 border border-rose-200 px-4 py-1.5 rounded-full hover:bg-rose-50 transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-pink-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ========== ORDERS TAB - PROFESSIONAL (New Design) ========== */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* Header with Filter */}
              <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3 bg-[#fffafb]">
                <h3 className="font-semibold text-gray-800 text-lg">
                  My Orders ({filteredOrders.length})
                </h3>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-pink-500 bg-white shadow-sm cursor-pointer"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Processing</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              
              {/* Loading / Empty State */}
              {ordersLoading ? (
                <div className="p-10 text-center">
                  <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-400 mt-3">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-gray-400">No orders found</p>
                  <Link to="/shop" className="inline-block mt-4 bg-pink-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition">Start Shopping →</Link>
                </div>
              ) : (
                /* Orders List */
                <div className="p-4 sm:p-6 space-y-4">
                  {filteredOrders.map(order => (
                    <div key={order._id} className="border border-pink-100 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                      
                      {/* Card Header: ID, Date, Total, Status */}
                      <div className="flex justify-between items-center px-5 py-4 bg-[#fffafb] border-b border-pink-50">
                        <div className="flex flex-wrap gap-4 sm:gap-8">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order ID</p>
                            <p className="text-sm font-bold text-gray-700 mt-1">#{getOrderIdDisplay(order)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order Date</p>
                            <p className="text-sm font-semibold text-gray-600 mt-1">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</p>
                            <p className="text-sm font-bold text-gray-700 mt-1">₹{order.total?.toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>

                      {/* Card Body: Product Items */}
                      <div className="px-5 py-4 border-b border-gray-50">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-lg border border-gray-100 p-1 bg-white shrink-0">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                  ) : (
                                    <div className="w-full h-full bg-pink-50 rounded flex items-center justify-center text-lg">🛍️</div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{item.name}</p>
                                  <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                    <p className="text-sm font-semibold text-gray-700">₹{item.price?.toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No items found</p>
                        )}
                      </div>

                      {/* Card Footer: Action Buttons */}
                      <div className="px-5 py-3 flex items-center justify-between">
                        <button 
                          onClick={() => navigate(`/order-tracking/${order._id}`)} 
                          className="text-sm font-semibold text-gray-700 hover:text-pink-600 transition flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          Track Order
                        </button>
                        
                        {/* Cancel Button - Sirf pending/confirmed par dikhega */}
                        {['pending', 'confirmed'].includes(order.status?.toLowerCase()) && (
                          <button 
                            onClick={() => cancelOrder(order._id)} 
                            className="text-sm font-semibold text-rose-600 bg-rose-50 px-4 py-2 rounded-full hover:bg-rose-100 transition flex items-center gap-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            Cancel Order
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Saved Addresses</h3>
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
                  className="text-pink-600 text-sm hover:underline"
                >
                  + Add New
                </button>
              </div>
              
              {addresses.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No addresses saved</div>
              ) : (
                <div className="p-4 space-y-3">
                  {addresses.map(addr => (
                    <div key={addr._id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition">
                      <div className="flex justify-between items-start">
                        <div>
                          {addr.isDefault && (
                            <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">Default</span>
                          )}
                          <p className="font-medium text-gray-800 mt-1">{addr.fullName}</p>
                          <p className="text-sm text-gray-500">{addr.addressLine1}</p>
                          {addr.addressLine2 && <p className="text-sm text-gray-500">{addr.addressLine2}</p>}
                          <p className="text-sm text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>
                          <p className="text-sm text-gray-500">📞 {addr.phone}</p>
                        </div>
                        <div className="flex gap-2">
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== PROFILE TAB ========== */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Profile Details</h3>
              </div>
              <div className="divide-y divide-gray-50">
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Full Name</p>
                    <p className="font-medium text-gray-800">{userData.name}</p>
                  </div>
                  {editingField === 'name' ? (
                    <div className="flex gap-2">
                      <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1 text-sm" />
                      <button onClick={() => handleFieldUpdate('name', editValue)} className="text-emerald-500 text-sm">Save</button>
                      <button onClick={() => setEditingField(null)} className="text-gray-400 text-sm">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingField('name'); setEditValue(userData.name); }} className="text-pink-600 text-sm hover:underline">Edit</button>
                  )}
                </div>

                <div className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="font-medium text-gray-800">{userData.email}</p>
                  </div>
                  {editingField === 'email' ? (
                    <div className="flex gap-2">
                      <input type="email" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1 text-sm" />
                      <button onClick={() => handleFieldUpdate('email', editValue)} className="text-emerald-500 text-sm">Save</button>
                      <button onClick={() => setEditingField(null)} className="text-gray-400 text-sm">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingField('email'); setEditValue(userData.email); }} className="text-pink-600 text-sm hover:underline">Edit</button>
                  )}
                </div>

                <div className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="font-medium text-gray-800">{userData.phone || 'Not added'}</p>
                  </div>
                  {editingField === 'phone' ? (
                    <div className="flex gap-2">
                      <input type="tel" value={editValue} onChange={(e) => setEditValue(e.target.value)} maxLength="10" className="border border-gray-200 rounded-lg px-3 py-1 text-sm" />
                      <button onClick={() => handleFieldUpdate('phone', editValue)} className="text-emerald-500 text-sm">Save</button>
                      <button onClick={() => setEditingField(null)} className="text-gray-400 text-sm">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingField('phone'); setEditValue(userData.phone || ''); }} className="text-pink-600 text-sm hover:underline">Edit</button>
                  )}
                </div>

                <div className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Gender</p>
                    <p className="font-medium text-gray-800">{userData.gender || 'Not specified'}</p>
                  </div>
                  {editingField === 'gender' ? (
                    <div className="flex gap-2">
                      <select value={editValue} onChange={(e) => setEditValue(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1 text-sm">
                        <option value="">Select</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                      <button onClick={() => handleFieldUpdate('gender', editValue)} className="text-emerald-500 text-sm">Save</button>
                      <button onClick={() => setEditingField(null)} className="text-gray-400 text-sm">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingField('gender'); setEditValue(userData.gender || ''); }} className="text-pink-600 text-sm hover:underline">Edit</button>
                  )}
                </div>

                <div className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Date of Birth</p>
                    <p className="font-medium text-gray-800">{userData.dob || 'Not specified'}</p>
                  </div>
                  {editingField === 'dob' ? (
                    <div className="flex gap-2">
                      <input type="date" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1 text-sm" />
                      <button onClick={() => handleFieldUpdate('dob', editValue)} className="text-emerald-500 text-sm">Save</button>
                      <button onClick={() => setEditingField(null)} className="text-gray-400 text-sm">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingField('dob'); setEditValue(userData.dob || ''); }} className="text-pink-600 text-sm hover:underline">Edit</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========== WISHLIST TAB ========== */}
          {activeTab === 'wishlist' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">My Wishlist ({wishlist?.length || 0})</h3>
              </div>
              {!wishlist || wishlist.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400">Your wishlist is empty</p>
                  <Link to="/shop" className="inline-block mt-3 text-pink-600 hover:underline">Start Shopping →</Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {wishlist.slice(0, 5).map(product => (
                    <div key={product.id} className="p-4 flex items-center gap-4">
                      <Link to={`/product/${product.id}`}>
                        <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-lg" />
                      </Link>
                      <div className="flex-1">
                        <Link to={`/product/${product.id}`} className="font-medium text-gray-800 hover:text-pink-500">
                          {product.name}
                        </Link>
                        <p className="text-pink-600 font-bold">₹{product.price}</p>
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
                  {wishlist.length > 5 && (
                    <div className="p-3 text-center">
                      <Link to="/wishlist" className="text-pink-600 text-sm hover:underline">View all {wishlist.length} items →</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========== REVIEWS TAB ========== */}
          {activeTab === 'reviews' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">My Reviews</h3>
              </div>
              {reviewsLoading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400">No reviews yet</p>
                  <Link to="/shop" className="inline-block mt-3 text-pink-600 hover:underline">Shop and review →</Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {reviews.map(review => (
                    <div key={review._id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link to={`/product/${review.productId?._id}`} className="font-medium text-gray-800 hover:text-pink-500">
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

          {/* ========== PAYMENTS TAB ========== */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Saved Cards</h3>
                  <button onClick={() => setShowCardModal(true)} className="text-pink-600 text-sm hover:underline">+ Add Card</button>
                </div>
                {cardsLoading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading cards...</p>
                  </div>
                ) : savedCards.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">No saved cards</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {savedCards.map(card => (
                      <div key={card._id} className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💳</span>
                          <div>
                            <p className="font-medium">•••• {card.last4}</p>
                            <p className="text-xs text-gray-500">Expires {card.expiryMonth}/{card.expiryYear}</p>
                            {card.isDefault && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">Default</span>}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteCard(card._id)} className="text-rose-500 text-sm">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">UPI IDs</h3>
                  <button onClick={() => setShowUpiModal(true)} className="text-pink-600 text-sm hover:underline">+ Add UPI</button>
                </div>
                {upiOptions.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">No UPI IDs saved</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {upiOptions.map(upi => (
                      <div key={upi._id} className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📱</span>
                          <div>
                            <p className="font-medium">{upi.upiId}</p>
                            {upi.isDefault && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">Default</span>}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteUpi(upi._id)} className="text-rose-500 text-sm">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== SECURITY TAB ========== */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Security Settings</h3>
              </div>
              <div className="p-4">
                {showPasswordEdit ? (
                  <div className="space-y-3">
                    <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" />
                    <input type="password" placeholder="New Password (min 6 chars)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" />
                    <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" />
                    <div className="flex gap-2">
                      <button onClick={handlePasswordUpdate} className="bg-pink-500 text-white px-4 py-2 rounded-xl text-sm hover:shadow-lg transition">Save</button>
                      <button onClick={() => setShowPasswordEdit(false)} className="bg-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-300 transition">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowPasswordEdit(true)} className="text-pink-600 text-sm hover:underline">Change Password</button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddressModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 bg-white">
                <h3 className="text-lg font-semibold">{editingAddress ? 'Edit Address' : 'Add Address'}</h3>
                <button onClick={() => setShowAddressModal(false)} className="text-gray-400 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleAddressSubmit} className="p-5 space-y-3">
                <input type="text" placeholder="Full Name *" value={addressForm.fullName} onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none" required />
                <input type="tel" placeholder="Mobile Number *" value={addressForm.phone} onChange={(e) => setAddressForm({...addressForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10)})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none" required maxLength="10" />
                <input type="text" placeholder="Pincode *" value={addressForm.pincode} onChange={(e) => setAddressForm({...addressForm, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6)})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none" required maxLength="6" />
                <input type="text" placeholder="Address Line 1 *" value={addressForm.addressLine1} onChange={(e) => setAddressForm({...addressForm, addressLine1: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none" required />
                <input type="text" placeholder="Address Line 2 (Optional)" value={addressForm.addressLine2} onChange={(e) => setAddressForm({...addressForm, addressLine2: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="City *" value={addressForm.city} onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none" required />
                  <input type="text" placeholder="State *" value={addressForm.state} onChange={(e) => setAddressForm({...addressForm, state: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none" required />
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

        {/* Card Modal */}
        {showCardModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Card</h3>
              <select value={cardForm.cardType} onChange={(e) => setCardForm({...cardForm, cardType: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-3 focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none">
                <option value="">Select Card Type</option>
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="rupay">RuPay</option>
              </select>
              <input type="text" placeholder="Last 4 digits *" maxLength="4" value={cardForm.last4} onChange={(e) => setCardForm({...cardForm, last4: e.target.value.replace(/[^0-9]/g, '').slice(0, 4)})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-3 focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none" required />
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input type="text" placeholder="Expiry Month (MM)" maxLength="2" value={cardForm.expiryMonth} onChange={(e) => setCardForm({...cardForm, expiryMonth: e.target.value.replace(/[^0-9]/g, '').slice(0, 2)})} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none" />
                <input type="text" placeholder="Expiry Year (YYYY)" maxLength="4" value={cardForm.expiryYear} onChange={(e) => setCardForm({...cardForm, expiryYear: e.target.value.replace(/[^0-9]/g, '').slice(0, 4)})} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none" />
              </div>
              <label className="flex items-center gap-2 mb-4 cursor-pointer text-sm">
                <input type="checkbox" checked={cardForm.isDefault} onChange={(e) => setCardForm({...cardForm, isDefault: e.target.checked})} /> Set as default
              </label>
              <div className="flex gap-3">
                <button onClick={handleAddCard} className="flex-1 bg-pink-500 text-white py-2 rounded-xl hover:shadow-lg transition">Save Card</button>
                <button onClick={() => setShowCardModal(false)} className="flex-1 bg-gray-200 text-gray-600 py-2 rounded-xl hover:bg-gray-300 transition">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* UPI Modal */}
        {showUpiModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Add UPI ID</h3>
              <input 
                type="text" 
                placeholder="example@upi" 
                value={upiForm.upiId} 
                onChange={(e) => setUpiForm({...upiForm, upiId: e.target.value})} 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-3 focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none" 
              />
              <p className="text-xs text-gray-400 mb-3">Enter your UPI ID (e.g., name@upi, name@paytm, etc.)</p>
              <label className="flex items-center gap-2 mb-4 cursor-pointer text-sm">
                <input type="checkbox" checked={upiForm.isDefault} onChange={(e) => setUpiForm({...upiForm, isDefault: e.target.checked})} /> Set as default
              </label>
              <div className="flex gap-3">
                <button onClick={handleAddUpi} className="flex-1 bg-pink-500 text-white py-2 rounded-xl hover:shadow-lg transition">Save UPI</button>
                <button onClick={() => setShowUpiModal(false)} className="flex-1 bg-gray-200 text-gray-600 py-2 rounded-xl hover:bg-gray-300 transition">Cancel</button>
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

export default Profile;
