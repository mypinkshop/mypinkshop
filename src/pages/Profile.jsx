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
  const [activeTab, setActiveTab] = useState('hub');
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
    createdAt: '',
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
    isDefault: false,
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

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  const withId = (item) =>
    item && typeof item === 'object' ? { ...item, _id: item._id || item.id } : item;
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
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        const imageUrl = data.data?.url || data.url;
        await fetch(`${API_URL}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatar: imageUrl }),
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
      fetchSavedCards(),
    ]);
    setLoading(false);
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
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
          createdAt: data.created_at
            ? new Date(data.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : '',
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
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAddresses(
          withIds(
            (data.data || []).map((a) => ({
              ...a,
              fullName: a.name,
              addressLine1: a.line1,
              addressLine2: a.line2,
              isDefault: !!a.is_default,
            }))
          )
        );
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/orders/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let ordersArray = [];
      if (response.ok) {
        const data = await response.json();
        ordersArray = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
      }

      const normalized = ordersArray.map((order) => {
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
          total: order.total || order.total_amount || order.subtotal || 0,
          shippingAddress: parsedAddress,
          paymentMethod: order.paymentMethod || order.payment_method,
          paymentStatus: order.paymentStatus || order.payment_status,
          items: (order.items || []).map((item) => ({
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
        headers: { Authorization: `Bearer ${token}` },
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
    try {
      const response = await fetch(`${API_URL}/api/users/cards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSavedCards(
          withIds(
            (data.data || []).map((c) => ({
              ...c,
              last4: c.card_last4,
              expiryMonth: c.expiry_month,
              expiryYear: c.expiry_year,
              isDefault: !!c.is_default,
            }))
          )
        );
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    }
  };

  const handleFieldUpdate = async (field, value) => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        setUserData((prev) => ({ ...prev, [field]: value }));
        setEditingField(null);

        const fieldLabels = {
          name: 'Name',
          email: 'Email',
          phone: 'Phone number',
          gender: 'Gender',
          dob: 'Date of Birth',
        };
        toast.success(`${fieldLabels[field] || field} Changed Successfully! ✨`);
        fetchUserData();
      } else {
        const json = await response.json().catch(() => ({}));
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        toast.success('Password Changed Successfully! 🔒');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setActiveTab('hub');
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
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
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
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

  const getStatusConfig = (status) => {
    const s = (status || '').toLowerCase();
    const configs = {
      delivered: { label: 'Delivered', icon: '✓', bg: 'bg-emerald-50', text: 'text-emerald-700' },
      shipped: { label: 'Shipped', icon: '🚚', bg: 'bg-blue-50', text: 'text-blue-700' },
      confirmed: { label: 'Confirmed', icon: '📋', bg: 'bg-purple-50', text: 'text-purple-700' },
      pending: { label: 'Processing', icon: '⏳', bg: 'bg-amber-50', text: 'text-amber-700' },
      processing: { label: 'Processing', icon: '⏳', bg: 'bg-amber-50', text: 'text-amber-700' },
      cancelled: { label: 'Cancelled', icon: '✕', bg: 'bg-rose-50', text: 'text-rose-700' },
      failed: { label: 'Failed', icon: '✕', bg: 'bg-rose-50', text: 'text-rose-700' },
    };
    return configs[s] || configs.pending;
  };

  const getInitials = (name) => {
    if (!name) return '👤';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
    return isNaN(date.getTime())
      ? dateString
      : date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading your account...</p>
        </div>
      </div>
    );
  }

  const filteredOrders =
    filterStatus === 'all'
      ? orders
      : orders.filter((o) => o.status?.toLowerCase() === filterStatus);

  // ✅ Tab list for sidebar + mobile
  const tabs = [
    { id: 'hub', label: 'Dashboard', icon: '🏠' },
    { id: 'orders', label: 'My Orders', icon: '📦', count: orders.length },
    { id: 'addresses', label: 'Addresses', icon: '📍', count: addresses.length },
    { id: 'profile', label: 'Profile Details', icon: '👤' },
    { id: 'wishlist', label: 'Wishlist', icon: '❤️', count: wishlist?.length || 0 },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'security', label: 'Security', icon: '🔐' },
  ];

  return (
    <>
      <Helmet>
        <title>My Account - MyPinkShop</title>
        <meta name="description" content="Manage your MyPinkShop account, orders, and addresses." />
        <link rel="canonical" href="https://www.mypinkshop.com/profile" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-pink-100 flex flex-col">
        <OfferBanner />

        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
              <Link to="/" className="flex items-center gap-2 shrink-0 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-lg sm:text-xl">M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                    MyPinkShop
                  </h1>
                  <p className="text-[9px] sm:text-[10px] text-pink-500 font-semibold tracking-wider">
                    FOR THE GIRLIES ✨
                  </p>
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
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border-2 border-pink-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-white"
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
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <Avatar user={user} onLogout={logout} />
              </div>
            </div>
          </div>
        </header>

        {/* BREADCRUMB */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-bold">My Account</span>
          </div>
        </div>

        {/* MAIN */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 w-full">

          {/* PROFILE HERO BANNER */}
          <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 rounded-3xl p-6 sm:p-8 mb-6 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 text-[300px] flex items-center justify-center pointer-events-none select-none">
              💖
            </div>

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white flex items-center justify-center text-3xl text-pink-600 overflow-hidden shadow-lg ring-4 ring-white/50">
                    {profileImage ? (
                      <img src={getImageUrl(profileImage)} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-2xl">{getInitials(userData.name)}</span>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-pink-50 border-2 border-pink-500">
                    <input type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
                    <span className="text-sm">📷</span>
                  </label>
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                <div className="text-white">
                  <h2 className="text-xl sm:text-3xl font-bold mb-1">Hello, {userData.name || 'User'}! ✨</h2>
                  <p className="text-sm text-pink-100 font-medium">{userData.email}</p>
                  {userData.phone && (
                    <p className="text-sm text-pink-100 font-medium">📞 {userData.phone}</p>
                  )}
                  <p className="text-xs text-pink-200 mt-1">Member since {userData.createdAt}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 text-center text-white">
                  <p className="text-2xl font-bold">{orders.length}</p>
                  <p className="text-[10px] font-semibold text-pink-100 uppercase tracking-wider">Orders</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 text-center text-white">
                  <p className="text-2xl font-bold">{wishlist?.length || 0}</p>
                  <p className="text-[10px] font-semibold text-pink-100 uppercase tracking-wider">Wishlist</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 text-center text-white">
                  <p className="text-2xl font-bold">{addresses.length}</p>
                  <p className="text-[10px] font-semibold text-pink-100 uppercase tracking-wider">Addresses</p>
                </div>
              </div>
            </div>
          </div>

          {/* TABS — Mobile horizontal scroll */}
          <div className="lg:hidden mb-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                      : 'bg-white text-gray-700 border-2 border-pink-200 hover:bg-pink-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold ${
                        activeTab === tab.id ? 'bg-white text-pink-600' : 'bg-pink-500 text-white'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* TWO COLUMN LAYOUT */}
          <div className="grid lg:grid-cols-4 gap-6">

            {/* SIDEBAR — Desktop only */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="bg-white rounded-3xl border-2 border-pink-100 shadow-sm p-4 sticky top-24">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">
                  My Account
                </h3>
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                          : 'text-gray-700 hover:bg-pink-50'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-lg">{tab.icon}</span>
                        <span>{tab.label}</span>
                      </span>
                      {tab.count > 0 && (
                        <span
                          className={`text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold ${
                            activeTab === tab.id ? 'bg-white text-pink-600' : 'bg-pink-100 text-pink-600'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="lg:col-span-3">

              {/* DASHBOARD HUB */}
              {activeTab === 'hub' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="bg-white rounded-3xl p-6 border-2 border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-3xl mb-4 shadow-md group-hover:scale-110 transition">
                      📦
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">My Orders</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Track, return, or buy again — {orders.length} total
                    </p>
                    <span className="text-sm font-bold text-pink-600 flex items-center gap-1">
                      View Orders →
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('addresses')}
                    className="bg-white rounded-3xl p-6 border-2 border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-3xl mb-4 shadow-md group-hover:scale-110 transition">
                      📍
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">My Addresses</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Manage delivery locations — {addresses.length} saved
                    </p>
                    <span className="text-sm font-bold text-blue-600 flex items-center gap-1">
                      Manage →
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className="bg-white rounded-3xl p-6 border-2 border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-3xl mb-4 shadow-md group-hover:scale-110 transition">
                      👤
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Profile Details</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Edit name, email, phone and more
                    </p>
                    <span className="text-sm font-bold text-purple-600 flex items-center gap-1">
                      Edit Profile →
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('wishlist')}
                    className="bg-white rounded-3xl p-6 border-2 border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-3xl mb-4 shadow-md group-hover:scale-110 transition">
                      ❤️
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">My Wishlist</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Your favorite saved items — {wishlist?.length || 0} saved
                    </p>
                    <span className="text-sm font-bold text-rose-600 flex items-center gap-1">
                      View →
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('payments')}
                    className="bg-white rounded-3xl p-6 border-2 border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-3xl mb-4 shadow-md group-hover:scale-110 transition">
                      💳
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Payment Options</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Saved cards & payment methods
                    </p>
                    <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                      Manage →
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('security')}
                    className="bg-white rounded-3xl p-6 border-2 border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl mb-4 shadow-md group-hover:scale-110 transition">
                      🔐
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Security</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Change password & secure account
                    </p>
                    <span className="text-sm font-bold text-amber-600 flex items-center gap-1">
                      Update →
                    </span>
                  </button>
                </div>
              )}

              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <div className="bg-white rounded-3xl shadow-sm border-2 border-pink-100 overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 border-b-2 border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50 flex flex-wrap justify-between items-center gap-3">
                    <h3 className="font-bold text-gray-900 text-lg">
                      My Orders ({filteredOrders.length})
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      {['all', 'pending', 'confirmed', 'shipped', 'delivered'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            filterStatus === status
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                              : 'bg-white border-2 border-pink-200 text-gray-700 hover:bg-pink-50'
                          }`}
                        >
                          {status === 'all' ? 'All' : getStatusConfig(status).label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {ordersLoading ? (
                    <div className="p-10 text-center">
                      <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-gray-400 mt-3 font-medium">Loading orders...</p>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center text-5xl">
                        📦
                      </div>
                      <p className="text-gray-600 font-bold text-lg mb-4">No orders yet</p>
                      <Link
                        to="/shop"
                        className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg transition"
                      >
                        Start Shopping →
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-6 space-y-5">
                      {filteredOrders.map((order) => {
                        const statusConfig = getStatusConfig(order.status);
                        const isCancelled = ['cancelled', 'failed'].includes(order.status?.toLowerCase());
                        const isDelivered = order.status?.toLowerCase() === 'delivered';
                        const canCancel =
                          ['pending', 'confirmed'].includes(order.status?.toLowerCase()) &&
                          order.paymentStatus !== 'failed';

                        return (
                          <div
                            key={order._id}
                            className={`bg-white rounded-3xl border-2 overflow-hidden shadow-sm hover:shadow-xl transition-all ${
                              isCancelled
                                ? 'border-rose-100'
                                : isDelivered
                                ? 'border-emerald-100'
                                : 'border-pink-100'
                            }`}
                          >
                            <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-5 sm:px-6 py-4">
                              <div className="flex flex-wrap justify-between items-center gap-3">
                                <div className="flex flex-wrap items-center gap-5">
                                  <div>
                                    <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Order ID</p>
                                    <p className="text-sm font-bold text-white font-mono">{getOrderIdDisplay(order)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Placed</p>
                                    <p className="text-sm font-semibold text-white">{formatDate(order.createdAt)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Total</p>
                                    <p className="text-sm font-bold text-white">₹{order.total?.toLocaleString()}</p>
                                  </div>
                                </div>
                                <span className="bg-white/25 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                  <span>{statusConfig.icon}</span>
                                  {statusConfig.label}
                                </span>
                              </div>
                            </div>

                            <div className="px-5 sm:px-6 py-4">
                              {order.items &&
                                order.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-4 py-3 border-b border-pink-50 last:border-0"
                                  >
                                    <Link
                                      to={`/product/${item.productId}`}
                                      className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-100 flex-shrink-0 flex items-center justify-center p-1"
                                    >
                                      {item.image ? (
                                        <img
                                          src={getImageUrl(item.image)}
                                          alt={item.name}
                                          className="w-full h-full object-contain"
                                        />
                                      ) : (
                                        <div className="text-2xl">🛍️</div>
                                      )}
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                      <Link
                                        to={`/product/${item.productId}`}
                                        className="font-bold text-gray-900 text-sm hover:text-pink-600 transition line-clamp-2"
                                      >
                                        {item.name}
                                      </Link>
                                      <p className="text-xs text-gray-500 mt-1 font-medium">
                                        Qty: {item.quantity}
                                      </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="font-bold text-pink-600 text-sm">
                                        ₹{(item.price * item.quantity)?.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                            </div>

                            <div className="px-5 sm:px-6 py-3 border-t-2 border-pink-50 bg-gradient-to-r from-pink-50/50 to-rose-50/50 flex flex-wrap gap-2 justify-between items-center">
                              <button
                                onClick={() => handleTrackOrder(order)}
                                className="px-4 py-2 text-pink-600 bg-white border-2 border-pink-200 rounded-full hover:bg-pink-50 transition text-sm font-bold flex items-center gap-1.5"
                              >
                                📍 Track Order
                              </button>
                              {canCancel && !isCancelled && (
                                <button
                                  onClick={() => cancelOrder(order._id)}
                                  className="px-4 py-2 text-rose-600 bg-white border-2 border-rose-200 rounded-full hover:bg-rose-50 transition text-sm font-bold"
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
              )}

              {/* ADDRESSES TAB */}
              {activeTab === 'addresses' && (
                <div className="bg-white rounded-3xl shadow-sm border-2 border-pink-100 overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 border-b-2 border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-lg">Saved Addresses</h3>
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
                        });
                        setShowAddressModal(true);
                      }}
                      className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-full text-sm font-bold hover:shadow-lg transition"
                    >
                      + Add New
                    </button>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center text-5xl">
                        📍
                      </div>
                      <p className="text-gray-600 font-bold text-lg mb-4">No addresses saved</p>
                      <button
                        onClick={() => {
                          setAddressForm({
                            fullName: userData.name || '',
                            phone: userData.phone || '',
                            pincode: '',
                            addressLine1: '',
                            addressLine2: '',
                            city: '',
                            state: '',
                            isDefault: true,
                          });
                          setShowAddressModal(true);
                        }}
                        className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg transition"
                      >
                        Add Your First Address
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div
                          key={addr._id}
                          className={`border-2 rounded-2xl p-5 relative transition hover:shadow-lg ${
                            addr.isDefault ? 'border-pink-400 bg-pink-50' : 'border-pink-100'
                          }`}
                        >
                          {addr.isDefault && (
                            <span className="absolute top-4 right-4 text-xs bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1 rounded-full font-bold shadow-md">
                              ⭐ Default
                            </span>
                          )}
                          <p className="font-bold text-gray-900 text-base mb-2">{addr.fullName}</p>
                          <p className="text-sm text-gray-700 font-medium">{addr.addressLine1}</p>
                          {addr.addressLine2 && <p className="text-sm text-gray-700 font-medium">{addr.addressLine2}</p>}
                          <p className="text-sm text-gray-700 font-medium">
                            {addr.city}, {addr.state} -{' '}
                            <span className="font-mono font-bold">{addr.pincode}</span>
                          </p>
                          <p className="text-sm text-gray-700 font-medium mt-2">📞 {addr.phone}</p>

                          <div className="mt-4 pt-3 border-t-2 border-pink-100 flex flex-wrap gap-3">
                            <button
                              onClick={() => {
                                setEditingAddress(addr);
                                setAddressForm(addr);
                                setShowAddressModal(true);
                              }}
                              className="text-sm text-blue-600 font-bold hover:underline"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => deleteAddress(addr._id)}
                              className="text-sm text-rose-600 font-bold hover:underline"
                            >
                              🗑️ Delete
                            </button>
                            {!addr.isDefault && (
                              <button
                                onClick={() => setDefaultAddress(addr._id)}
                                className="text-sm text-gray-600 font-bold hover:underline"
                              >
                                ⭐ Set Default
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <div className="bg-white rounded-3xl shadow-sm border-2 border-pink-100 overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 border-b-2 border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50">
                    <h3 className="font-bold text-gray-900 text-lg">Profile Details</h3>
                  </div>
                  <div className="divide-y divide-pink-100">
                    {[
                      { field: 'name', label: 'Full Name', value: userData.name, type: 'text' },
                      { field: 'email', label: 'Email Address', value: userData.email, type: 'email' },
                      { field: 'phone', label: 'Phone Number', value: userData.phone || 'Not added', type: 'tel' },
                      { field: 'gender', label: 'Gender', value: userData.gender || 'Not specified', type: 'select' },
                      { field: 'dob', label: 'Date of Birth', value: userData.dob || 'Not specified', type: 'date' },
                    ].map((item) => (
                      <div key={item.field} className="p-5 sm:p-6">
                        <div className="flex flex-wrap justify-between items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                              {item.label}
                            </p>
                            <p className="font-bold text-gray-900 text-base break-words">{item.value}</p>
                          </div>

                          {editingField === item.field ? (
                            <div className="flex flex-wrap gap-2">
                              {item.type === 'select' ? (
                                <select
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="border-2 border-pink-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-pink-500 bg-white"
                                >
                                  <option value="">Select</option>
                                  <option value="Female">Female</option>
                                  <option value="Male">Male</option>
                                  <option value="Other">Other</option>
                                </select>
                              ) : (
                                <input
                                  type={item.type}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  maxLength={item.type === 'tel' ? 10 : undefined}
                                  className="border-2 border-pink-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-pink-500 bg-white"
                                />
                              )}
                              <button
                                onClick={() => handleFieldUpdate(item.field, editValue)}
                                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:shadow-md"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingField(null)}
                                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingField(item.field);
                                setEditValue(item.value === 'Not added' || item.value === 'Not specified' ? '' : item.value);
                              }}
                              className="text-pink-600 font-bold text-sm hover:underline px-4 py-2 rounded-full border-2 border-pink-200 hover:bg-pink-50"
                            >
                              ✏️ Edit
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WISHLIST TAB */}
              {activeTab === 'wishlist' && (
                <div className="bg-white rounded-3xl shadow-sm border-2 border-pink-100 overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 border-b-2 border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50">
                    <h3 className="font-bold text-gray-900 text-lg">
                      My Wishlist ({wishlist?.length || 0})
                    </h3>
                  </div>

                  {!wishlist || wishlist.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center text-5xl">
                        ❤️
                      </div>
                      <p className="text-gray-600 font-bold text-lg mb-4">Your wishlist is empty</p>
                      <Link
                        to="/shop"
                        className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg transition"
                      >
                        Start Shopping →
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {wishlist.map((product) => (
                        <div
                          key={product.id}
                          className="border-2 border-pink-100 rounded-2xl p-4 flex items-center gap-4 bg-white hover:shadow-lg transition"
                        >
                          <Link to={`/product/${product.id}`} className="shrink-0">
                            <img
                              src={getImageUrl(product.image)}
                              alt={product.name}
                              className="w-20 h-20 object-cover rounded-2xl border-2 border-pink-100"
                            />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/product/${product.id}`}
                              className="font-bold text-gray-900 text-sm hover:text-pink-600 line-clamp-2"
                            >
                              {product.name}
                            </Link>
                            <p className="text-pink-600 font-bold text-base mt-2">
                              ₹{product.price}
                            </p>
                            <button
                              onClick={() => {
                                removeFromWishlist(product.id);
                                toast.success('Removed from wishlist');
                              }}
                              className="text-rose-500 text-xs font-bold mt-2 hover:underline flex items-center gap-1"
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

              {/* PAYMENTS TAB */}
              {activeTab === 'payments' && (
                <div className="bg-white rounded-3xl shadow-sm border-2 border-pink-100 overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 border-b-2 border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50">
                    <h3 className="font-bold text-gray-900 text-lg">Payment Options</h3>
                  </div>
                  <div className="p-6">
                    {savedCards.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center text-5xl">
                          💳
                        </div>
                        <p className="text-gray-600 font-bold text-lg mb-2">No saved cards</p>
                        <p className="text-sm text-gray-500">
                          Save cards during checkout for faster payments
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {savedCards.map((card) => (
                          <div
                            key={card._id}
                            className="p-4 border-2 border-pink-100 rounded-2xl flex justify-between items-center hover:shadow-md transition"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">💳</span>
                              <div>
                                <p className="font-bold text-gray-900">•••• {card.last4}</p>
                                <p className="text-xs text-gray-500 font-medium">
                                  Expires {card.expiryMonth}/{card.expiryYear}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === 'security' && (
                <div className="bg-white rounded-3xl shadow-sm border-2 border-pink-100 overflow-hidden max-w-xl">
                  <div className="px-5 sm:px-6 py-4 border-b-2 border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50">
                    <h3 className="font-bold text-gray-900 text-lg">🔐 Change Password</h3>
                  </div>
                  <div className="p-5 sm:p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Current Password *
                      </label>
                      <input
                        type="password"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        New Password (min 6 chars) *
                      </label>
                      <input
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 bg-white"
                      />
                    </div>
                    <div className="pt-2 flex gap-3">
                      <button
                        onClick={handlePasswordUpdate}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3.5 rounded-xl font-bold hover:shadow-lg transition"
                      >
                        Update Password
                      </button>
                      <button
                        onClick={() => setActiveTab('hub')}
                        className="px-6 bg-gray-100 text-gray-600 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </main>
          </div>
        </div>

        {/* TRUST BADGES */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-gradient-to-r from-pink-100 via-rose-100 to-pink-100 border-2 border-pink-200 rounded-3xl p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: '🚚', title: 'Free Shipping', sub: 'On orders ₹499+' },
                { icon: '💵', title: 'COD Available', sub: 'Pay on delivery' },
                { icon: '↩️', title: 'Easy Returns', sub: '7-day return' },
                { icon: '🔒', title: 'Secure', sub: '100% trusted' },
              ].map((badge, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-center sm:items-start gap-2 text-center sm:text-left bg-white rounded-2xl p-3 shadow-sm"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-lg">{badge.icon}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-xs">{badge.title}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{badge.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRACKING MODAL */}
        {showTracking && selectedOrder && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowTracking(false)}
          >
            <div
              className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-500 p-5 rounded-t-3xl flex justify-between items-center z-10">
                <div>
                  <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Tracking Order</p>
                  <h3 className="text-base font-bold text-white font-mono">
                    {getOrderIdDisplay(selectedOrder)}
                  </h3>
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
                    <p className="text-sm text-gray-500 font-medium">Fetching live tracking...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-pink-300 before:via-pink-200 before:to-gray-200">
                      <div className="relative">
                        <div className="absolute -left-8 top-0 w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs shadow-md ring-4 ring-pink-100">
                          ✓
                        </div>
                        <p className="font-bold text-gray-900 text-sm">Order Placed</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">
                          {formatDate(selectedOrder.createdAt)}
                        </p>
                      </div>

                      <div className="relative">
                        <div
                          className={`absolute -left-8 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ring-4 shadow-md ${
                            ['confirmed', 'shipped', 'delivered'].includes(selectedOrder.status?.toLowerCase())
                              ? 'bg-pink-500 text-white ring-pink-100'
                              : 'bg-gray-200 text-gray-500 ring-gray-100'
                          }`}
                        >
                          {['confirmed', 'shipped', 'delivered'].includes(selectedOrder.status?.toLowerCase()) ? '✓' : '•'}
                        </div>
                        <p
                          className={`font-bold text-sm ${
                            ['confirmed', 'shipped', 'delivered'].includes(selectedOrder.status?.toLowerCase())
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                        >
                          Order Confirmed
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">
                          {['confirmed', 'shipped', 'delivered'].includes(selectedOrder.status?.toLowerCase())
                            ? formatDate(selectedOrder.updatedAt || selectedOrder.createdAt)
                            : 'Pending confirmation'}
                        </p>
                      </div>

                      {liveTrackingData?.tracking_data?.shipment_track ? (
                        liveTrackingData.tracking_data.shipment_track.map((track, idx) => (
                          <div key={idx} className="relative">
                            <div className="absolute -left-8 top-0 w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs shadow-md ring-4 ring-pink-100">
                              📦
                            </div>
                            <p className="font-bold text-gray-900 text-sm">{track.current_status || 'In Transit'}</p>
                            <p className="text-xs text-gray-500 mt-0.5 font-medium">
                              {track.location || 'Hub'} - {track.activity}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 font-medium">{track.date}</p>
                          </div>
                        ))
                      ) : (
                        <div className="relative">
                          <div className="absolute -left-8 top-0 w-6 h-6 rounded-full bg-pink-400 text-white flex items-center justify-center text-xs shadow-md ring-4 ring-pink-100">
                            ⏳
                          </div>
                          <p className="font-bold text-gray-700 text-sm">Preparing Shipment</p>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">
                            Your order is being prepared for dispatch.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADDRESS MODAL */}
        {showAddressModal && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={() => setShowAddressModal(false)}
          >
            <div
              className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-500 p-5 rounded-t-3xl flex justify-between items-center z-10">
                <h3 className="text-lg font-bold text-white">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h3>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddressSubmit} className="p-5 space-y-3">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:border-pink-500 outline-none bg-white"
                  required
                />
                <input
                  type="tel"
                  placeholder="Mobile Number *"
                  value={addressForm.phone}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10),
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:border-pink-500 outline-none bg-white"
                  required
                  maxLength="10"
                />
                <input
                  type="text"
                  placeholder="Pincode *"
                  value={addressForm.pincode}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6),
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:border-pink-500 outline-none bg-white"
                  required
                  maxLength="6"
                />
                <input
                  type="text"
                  placeholder="Address Line 1 *"
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:border-pink-500 outline-none bg-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:border-pink-500 outline-none bg-white"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="City *"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:border-pink-500 outline-none bg-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="State *"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:border-pink-500 outline-none bg-white"
                    required
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium p-3 bg-pink-50 rounded-xl">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="w-4 h-4 accent-pink-500"
                  />
                  Set as default address
                </label>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3.5 rounded-xl font-bold hover:shadow-lg transition"
                >
                  {editingAddress ? 'Update Address' : 'Add Address'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="bg-gray-900 text-gray-400 py-12 mt-auto">
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
                  <li><a href="#" className="hover:text-pink-500 transition">Facebook</a></li>
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
