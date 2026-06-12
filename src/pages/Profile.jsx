import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';

function Profile() {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount, wishlist, removeFromWishlist } = useWishlist();
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
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
    createdAt: ''
  });
  
  // Edit States
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [showEmailEdit, setShowEmailEdit] = useState(false);
  const [showPhoneEdit, setShowPhoneEdit] = useState(false);
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [showGenderEdit, setShowGenderEdit] = useState(false);
  const [showDobEdit, setShowDobEdit] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState('');
  const [newDob, setNewDob] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Addresses
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
    addressType: 'home' // home, work, other
  });
  
  // Orders
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchOrder, setSearchOrder] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnComment, setReturnComment] = useState('');
  
  // Reviews
  const [reviews, setReviews] = useState([]);
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  
  // Saved Cards
  const [savedCards, setSavedCards] = useState([]);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardForm, setCardForm] = useState({
    last4: '',
    cardType: '',
    expiryMonth: '',
    expiryYear: '',
    isDefault: false
  });
  
  // Login History
  const [loginHistory, setLoginHistory] = useState([]);
  
  // Delete Account Modal
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
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

  // Handle profile image upload
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }
    
    setProfileImagePreview(URL.createObjectURL(file));
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
        await fetch(`${API_URL}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ profileImage: data.url })
        });
        setProfileImage(data.url);
        alert('Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  // Check if user is logged in
  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    
    fetchUserData();
    fetchAddresses();
    fetchOrders();
    fetchReviews();
    fetchSavedCards();
    fetchLoginHistory();
  }, [user, token, navigate]);

  // Fetch user profile
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
          createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
        });
        setProfileImage(data.profileImage || '');
        setNewName(data.name || '');
        setNewEmail(data.email || '');
        setNewPhone(data.phone || '');
        setNewGender(data.gender || '');
        setNewDob(data.dob || '');
        setApiError(false);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch addresses
  const fetchAddresses = async () => {
    if (!token) return;
    
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

  // Fetch orders
  const fetchOrders = async () => {
    if (!token) return;
    
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
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    if (!token) return;
    
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
    }
  };

  // Fetch saved cards
  const fetchSavedCards = async () => {
    if (!token) return;
    
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
    }
  };

  // Fetch login history
  const fetchLoginHistory = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/login-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLoginHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch login history:', error);
    }
  };

  // Filter orders
  useEffect(() => {
    let filtered = orders;
    if (searchOrder) {
      filtered = filtered.filter(order => order._id?.toLowerCase().includes(searchOrder.toLowerCase()) || order.id?.toLowerCase().includes(searchOrder.toLowerCase()));
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status?.toLowerCase() === filterStatus.toLowerCase());
    }
    setFilteredOrders(filtered);
  }, [searchOrder, filterStatus, orders]);

  // Update name
  const handleNameUpdate = async () => {
    if (!newName.trim()) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(prev => ({ ...prev, name: data.name }));
        setShowNameEdit(false);
        alert('Name updated successfully!');
      }
    } catch (error) {
      alert('Error updating name');
    }
  };

  // Update email
  const handleEmailUpdate = async () => {
    if (!newEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: newEmail })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(prev => ({ ...prev, email: data.email, emailVerified: false }));
        setShowEmailEdit(false);
        alert('Email updated successfully!');
      } else {
        alert('Email already in use or invalid');
      }
    } catch (error) {
      alert('Error updating email');
    }
  };

  // Update phone
  const handlePhoneUpdate = async () => {
    if (!newPhone || newPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone: newPhone })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(prev => ({ ...prev, phone: data.phone, phoneVerified: false }));
        setShowPhoneEdit(false);
        alert('Phone number updated successfully!');
      }
    } catch (error) {
      alert('Error updating phone');
    }
  };

  // Update gender
  const handleGenderUpdate = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gender: newGender })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(prev => ({ ...prev, gender: data.gender }));
        setShowGenderEdit(false);
        alert('Gender updated successfully!');
      }
    } catch (error) {
      alert('Error updating gender');
    }
  };

  // Update date of birth
  const handleDobUpdate = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dob: newDob })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(prev => ({ ...prev, dob: data.dob }));
        setShowDobEdit(false);
        alert('Date of birth updated successfully!');
      }
    } catch (error) {
      alert('Error updating date of birth');
    }
  };

  // Change password
  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
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
        alert('Password changed successfully!');
        setShowPasswordEdit(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await response.json();
        alert(error.error || 'Current password is incorrect');
      }
    } catch (error) {
      alert('Error changing password');
    }
  };

  // Reorder
  const handleReorder = async (order) => {
    for (const item of order.items) {
      addToCart({
        id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      });
    }
    alert('Items added to cart!');
    navigate('/cart');
  };

  // Download invoice
  const handleDownloadInvoice = (order) => {
    const invoiceHTML = `
      <html>
        <head><title>Invoice #${order._id}</title></head>
        <body>
          <h1>MyPinkShop Invoice</h1>
          <p>Order ID: ${order._id}</p>
          <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
          <table border="1">
            <tr><th>Product</th><th>Quantity</th><th>Price</th><th>Total</th></tr>
            ${order.items.map(item => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${item.price}</td><td>₹${item.price * item.quantity}</td></tr>`).join('')}
          </table>
          <h3>Total: ₹${order.total}</h3>
        </body>
      </html>
    `;
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${order._id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Request return
  const handleReturnRequest = async () => {
    if (!returnReason) {
      alert('Please select a reason for return');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/orders/${selectedOrder._id}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: returnReason, comment: returnComment })
      });
      
      if (response.ok) {
        alert('Return request submitted successfully!');
        setShowReturnModal(false);
        setReturnReason('');
        setReturnComment('');
        fetchOrders();
      } else {
        alert('Failed to submit return request');
      }
    } catch (error) {
      alert('Error submitting return request');
    }
  };

  // Delete review
  const handleDeleteReview = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reviews/${reviewToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Review deleted successfully!');
        setShowDeleteReviewModal(false);
        fetchReviews();
      } else {
        alert('Failed to delete review');
      }
    } catch (error) {
      alert('Error deleting review');
    }
  };

  // Add card
  const handleAddCard = async () => {
    if (!cardForm.last4 || cardForm.last4.length !== 4) {
      alert('Please enter last 4 digits');
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
        alert('Card saved successfully!');
        setShowCardModal(false);
        setCardForm({ last4: '', cardType: '', expiryMonth: '', expiryYear: '', isDefault: false });
        fetchSavedCards();
      } else {
        alert('Failed to save card');
      }
    } catch (error) {
      alert('Error saving card');
    }
  };

  // Delete card
  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/cards/${cardId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Card deleted successfully!');
        fetchSavedCards();
      } else {
        alert('Failed to delete card');
      }
    } catch (error) {
      alert('Error deleting card');
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/users/account`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Account deleted successfully!');
        logout();
        navigate('/');
      } else {
        alert('Failed to delete account');
      }
    } catch (error) {
      alert('Error deleting account');
    }
  };

  // Address CRUD
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    
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
        alert('Address saved successfully!');
      }
    } catch (error) {
      alert('Error saving address');
    }
  };

  const deleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchAddresses();
        alert('Address deleted successfully!');
      }
    } catch (error) {
      alert('Error deleting address');
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/users/addresses/${id}/default`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchAddresses();
        alert('Default address updated!');
      }
    } catch (error) {
      alert('Error setting default address');
    }
  };

  // Cancel order
  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchOrders();
        alert('Order cancelled successfully');
      }
    } catch (error) {
      alert('Error cancelling order');
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'text-green-600';
      case 'shipped': return 'text-blue-600';
      case 'confirmed': return 'text-blue-600';
      case 'processing': return 'text-yellow-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
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

  const tabs = [
    { id: 'orders', label: '📦 Orders', icon: '📦' },
    { id: 'addresses', label: '📍 Addresses', icon: '📍' },
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'security', label: '🔐 Security', icon: '🔐' },
    { id: 'reviews', label: '⭐ My Reviews', icon: '⭐' },
    { id: 'wishlist', label: '❤️ Wishlist', icon: '❤️' },
    { id: 'payments', label: '💳 Payment Methods', icon: '💳' },
    { id: 'history', label: '🕐 Login History', icon: '🕐' },
    { id: 'support', label: '💬 Support', icon: '💬' }
  ];

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Account - MyPinkShop | Profile, Orders & Addresses</title>
        <meta name="description" content="Manage your MyPinkShop account. View orders, manage addresses, update profile information, and track deliveries." />
        <meta name="keywords" content="my account, profile, orders, addresses, order tracking, mypinkshop account" />
        <link rel="canonical" href="https://www.mypinkshop.com/profile" />
        <meta property="og:title" content="My Account - MyPinkShop" />
        <meta property="og:description" content="Manage your account, orders, and addresses." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mypinkshop.com/profile" />
        <meta property="og:image" content="https://www.mypinkshop.com/og-profile.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="My Account - MyPinkShop" />
        <meta name="twitter:description" content="Manage your account, orders, and addresses." />
        <meta name="twitter:image" content="https://www.mypinkshop.com/og-profile.jpg" />
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
                <button onClick={() => navigate('/wishlist')} className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{wishlistCount}</span>}
                </button>
                
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Your Account</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 border-b border-pink-100">
                  <h2 className="font-semibold text-gray-800">Account Menu</h2>
                </div>
                <div className="divide-y divide-pink-50">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-pink-50/50 transition ${
                        activeTab === tab.id ? 'text-pink-600 font-medium bg-pink-50/80' : 'text-gray-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="md:col-span-3">
              
              {/* ========== ORDERS TAB ========== */}
              {activeTab === 'orders' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm">
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 border-b border-pink-100 rounded-t-2xl">
                    <h2 className="font-semibold text-gray-800">Your Orders</h2>
                  </div>
                  <div className="p-4 border-b border-pink-100">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <input
                          type="text"
                          placeholder="Search orders by ID..."
                          value={searchOrder}
                          onChange={(e) => setSearchOrder(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 transition"
                        />
                      </div>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 bg-white"
                      >
                        <option value="all">All Orders</option>
                        <option value="delivered">Delivered</option>
                        <option value="shipped">Shipped</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Processing</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  {filteredOrders.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-6xl mb-4">📦</div>
                      <p className="text-gray-500">No orders found</p>
                      <Link to="/shop" className="inline-block mt-3 text-pink-600 hover:underline">Start Shopping →</Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-pink-50">
                      {filteredOrders.map(order => (
                        <div key={order._id || order.id} className="p-4 hover:bg-pink-50/30 transition">
                          <div className="flex flex-wrap justify-between items-start gap-3">
                            <div>
                              <p className="font-semibold text-gray-800">#{order._id?.slice(-8) || order.id}</p>
                              <p className="text-sm text-gray-500">Ordered on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              <p className="text-sm text-gray-500 mt-1">{order.items?.length || 0} items</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-800">₹{order.total?.toLocaleString()}</p>
                              <p className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Order Actions */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Link to={`/track-order/${order._id || order.id}`} className="text-sm text-pink-600 hover:underline">
                              Track Order →
                            </Link>
                            
                            {order.status === 'delivered' && (
                              <>
                                <button onClick={() => handleReorder(order)} className="text-sm text-green-600 hover:underline">
                                  Reorder
                                </button>
                                <button onClick={() => handleDownloadInvoice(order)} className="text-sm text-blue-600 hover:underline">
                                  Download Invoice
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowReturnModal(true);
                                  }} 
                                  className="text-sm text-orange-600 hover:underline"
                                >
                                  Return
                                </button>
                              </>
                            )}
                            
                            {(order.status === 'pending' || order.status === 'confirmed') && (
                              <button onClick={() => cancelOrder(order._id || order.id)} className="text-sm text-red-600 hover:underline">
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
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm">
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 border-b border-pink-100 rounded-t-2xl flex justify-between items-center">
                    <h2 className="font-semibold text-gray-800">Your Addresses</h2>
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
                      + Add New Address
                    </button>
                  </div>
                  {addresses.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-6xl mb-4">📍</div>
                      <p className="text-gray-500">No addresses saved</p>
                      <button onClick={() => setShowAddressModal(true)} className="mt-3 text-pink-600 hover:underline">
                        Add your first address →
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map(addr => (
                        <div key={addr._id} className="border border-pink-100 rounded-xl p-4 hover:shadow-md transition bg-white">
                          {addr.isDefault && (
                            <span className="text-xs bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2 py-0.5 rounded-full mb-2 inline-block">
                              Default
                            </span>
                          )}
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mb-2 ml-2 inline-block">
                            {addr.addressType === 'home' ? '🏠 Home' : addr.addressType === 'work' ? '💼 Work' : '📍 Other'}
                          </span>
                          <p className="font-semibold text-gray-800 mt-2">{addr.fullName}</p>
                          <p className="text-sm text-gray-600 mt-1">{addr.addressLine1}</p>
                          {addr.addressLine2 && <p className="text-sm text-gray-600">{addr.addressLine2}</p>}
                          <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                          <p className="text-sm text-gray-500 mt-1">📞 {addr.phone}</p>
                          <div className="flex gap-4 mt-3">
                            <button onClick={() => {
                              setEditingAddress(addr);
                              setAddressForm(addr);
                              setShowAddressModal(true);
                            }} className="text-sm text-pink-600 hover:underline">Edit</button>
                            <button onClick={() => deleteAddress(addr._id)} className="text-sm text-red-600 hover:underline">Delete</button>
                            {!addr.isDefault && (
                              <button onClick={() => setDefaultAddress(addr._id)} className="text-sm text-gray-600 hover:underline">Set as Default</button>
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
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm">
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 border-b border-pink-100 rounded-t-2xl">
                    <h2 className="font-semibold text-gray-800">Profile Information</h2>
                  </div>
                  <div className="divide-y divide-pink-50">
                    {/* Profile Picture */}
                    <div className="p-4 flex flex-col items-center">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-4xl text-white overflow-hidden">
                          {profileImage ? (
                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <span>{userData.name?.charAt(0) || 'U'}</span>
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-gray-100">
                          <input type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
                          <span className="text-pink-500 text-sm">📷</span>
                        </label>
                      </div>
                      {uploadingImage && <p className="text-xs text-gray-400 mt-2">Uploading...</p>}
                      <p className="text-xs text-gray-400 mt-2">Click camera icon to change profile picture</p>
                    </div>

                    {/* Name */}
                    <div className="p-4 flex flex-wrap justify-between items-center gap-3">
                      <div><p className="text-sm text-gray-500">Full Name</p><p className="font-medium text-gray-800">{userData.name}</p></div>
                      {showNameEdit ? (
                        <div className="flex gap-2">
                          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-1 text-sm" />
                          <button onClick={handleNameUpdate} className="text-green-600 text-sm">Save</button>
                          <button onClick={() => setShowNameEdit(false)} className="text-gray-500 text-sm">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setShowNameEdit(true)} className="text-pink-600 text-sm hover:underline">Edit</button>
                      )}
                    </div>

                    {/* Email */}
                    <div className="p-4 flex flex-wrap justify-between items-center gap-3">
                      <div><p className="text-sm text-gray-500">Email Address</p><p className="font-medium text-gray-800">{userData.email}</p>{!userData.emailVerified && <p className="text-xs text-yellow-600">Not verified</p>}</div>
                      <div className="flex gap-3">
                        {!userData.emailVerified && <button onClick={() => alert(`Verification link sent to ${userData.email}`)} className="text-blue-600 text-sm hover:underline">Verify</button>}
                        {showEmailEdit ? (
                          <div className="flex gap-2">
                            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-1 text-sm" />
                            <button onClick={handleEmailUpdate} className="text-green-600 text-sm">Save</button>
                            <button onClick={() => setShowEmailEdit(false)} className="text-gray-500 text-sm">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setShowEmailEdit(true)} className="text-pink-600 text-sm hover:underline">Edit</button>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="p-4 flex flex-wrap justify-between items-center gap-3">
                      <div><p className="text-sm text-gray-500">Mobile Number</p><p className="font-medium text-gray-800">{userData.phone || 'Not added'}</p></div>
                      {showPhoneEdit ? (
                        <div className="flex gap-2">
                          <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="10-digit mobile" className="border border-gray-200 rounded-xl px-3 py-1 text-sm" />
                          <button onClick={handlePhoneUpdate} className="text-green-600 text-sm">Save</button>
                          <button onClick={() => setShowPhoneEdit(false)} className="text-gray-500 text-sm">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setShowPhoneEdit(true)} className="text-pink-600 text-sm hover:underline">Add/Update</button>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="p-4 flex flex-wrap justify-between items-center gap-3">
                      <div><p className="text-sm text-gray-500">Gender</p><p className="font-medium text-gray-800">{userData.gender || 'Not specified'}</p></div>
                      {showGenderEdit ? (
                        <div className="flex gap-2">
                          <select value={newGender} onChange={(e) => setNewGender(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-1 text-sm">
                            <option value="">Select</option>
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                            <option value="other">Other</option>
                          </select>
                          <button onClick={handleGenderUpdate} className="text-green-600 text-sm">Save</button>
                          <button onClick={() => setShowGenderEdit(false)} className="text-gray-500 text-sm">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setShowGenderEdit(true)} className="text-pink-600 text-sm hover:underline">Edit</button>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div className="p-4 flex flex-wrap justify-between items-center gap-3">
                      <div><p className="text-sm text-gray-500">Date of Birth</p><p className="font-medium text-gray-800">{userData.dob || 'Not specified'}</p></div>
                      {showDobEdit ? (
                        <div className="flex gap-2">
                          <input type="date" value={newDob} onChange={(e) => setNewDob(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-1 text-sm" />
                          <button onClick={handleDobUpdate} className="text-green-600 text-sm">Save</button>
                          <button onClick={() => setShowDobEdit(false)} className="text-gray-500 text-sm">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setShowDobEdit(true)} className="text-pink-600 text-sm hover:underline">Edit</button>
                      )}
                    </div>

                    {/* Member Since */}
                    <div className="p-4">
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-medium text-gray-800">{userData.createdAt}</p>
                    </div>

                    {/* Delete Account */}
                    <div className="p-4">
                      <button onClick={() => setShowDeleteAccountModal(true)} className="text-red-600 text-sm hover:underline flex items-center gap-1">
                        🗑️ Delete Account
                      </button>
                      <p className="text-xs text-gray-400 mt-1">This action is permanent and cannot be undone</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== SECURITY TAB ========== */}
              {activeTab === 'security' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm">
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 border-b border-pink-100 rounded-t-2xl">
                    <h2 className="font-semibold text-gray-800">Security Settings</h2>
                  </div>
                  <div className="p-4">
                    <div className="mb-4">
                      <p className="font-medium text-gray-800 mb-2">Change Password</p>
                      {showPasswordEdit ? (
                        <div className="space-y-3">
                          <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" />
                          <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" />
                          <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" />
                          <div className="flex gap-2">
                            <button onClick={handlePasswordUpdate} className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm">Save</button>
                            <button onClick={() => setShowPasswordEdit(false)} className="bg-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setShowPasswordEdit(true)} className="text-pink-600 text-sm hover:underline">Change Password</button>
                      )}
                    </div>
                    <div className="pt-4 border-t border-pink-100">
                      <p className="text-sm text-gray-500">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-600 mb-2">Add an extra layer of security to your account</p>
                      <button className="text-pink-600 text-sm hover:underline">Setup 2FA →</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== REVIEWS TAB ========== */}
              {activeTab === 'reviews' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm">
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 border-b border-pink-100 rounded-t-2xl">
                    <h2 className="font-semibold text-gray-800">My Reviews</h2>
                  </div>
                  {reviews.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-6xl mb-4">⭐</div>
                      <p className="text-gray-500">No reviews yet</p>
                      <Link to="/shop" className="inline-block mt-3 text-pink-600 hover:underline">Shop and review products →</Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-pink-50">
                      {reviews.map(review => (
                        <div key={review._id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <Link to={`/product/${review.productId?._id}`} className="font-semibold text-gray-800 hover:text-pink-500">{review.productId?.name}</Link>
                              <div className="flex text-yellow-400 text-sm mt-1">
                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                              </div>
                              <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                              {review.images?.length > 0 && (
                                <div className="flex gap-2 mt-2">
                                  {review.images.map((img, idx) => (
                                    <img key={idx} src={img} alt="Review" className="w-16 h-16 object-cover rounded" />
                                  ))}
                                </div>
                              )}
                            </div>
                            <button onClick={() => { setReviewToDelete(review._id); setShowDeleteReviewModal(true); }} className="text-red-500 text-sm">Delete</button>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Reviewed on {new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ========== WISHLIST TAB ========== */}
              {activeTab === 'wishlist' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm">
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 border-b border-pink-100 rounded-t-2xl">
                    <h2 className="font-semibold text-gray-800">My Wishlist ({wishlist?.length || 0})</h2>
                  </div>
                  {!wishlist || wishlist.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-6xl mb-4">🤍</div>
                      <p className="text-gray-500">Your wishlist is empty</p>
                      <Link to="/shop" className="inline-block mt-3 text-pink-600 hover:underline">Start Shopping →</Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-pink-50">
                      {wishlist.slice(0, 10).map(product => (
                        <div key={product.id} className="p-4 flex gap-4">
                          <Link to={`/product/${product.id}`}>
                            <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded" />
                          </Link>
                          <div className="flex-1">
                            <Link to={`/product/${product.id}`}><h3 className="font-semibold text-gray-800 hover:text-pink-500">{product.name}</h3></Link>
                            <p className="text-pink-600 font-bold mt-1">₹{product.price}</p>
                            <div className="flex gap-3 mt-2">
                              <button onClick={() => { addToCart(product); removeFromWishlist(product.id); }} className="text-sm bg-pink-500 text-white px-3 py-1 rounded">Move to Cart</button>
                              <button onClick={() => removeFromWishlist(product.id)} className="text-sm text-red-500">Remove</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {wishlist.length > 10 && (
                        <div className="p-4 text-center">
                          <Link to="/wishlist" className="text-pink-600 hover:underline">View all {wishlist.length} items →</Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ========== PAYMENTS TAB ========== */}
              {activeTab === 'payments' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm">
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 border-b border-pink-100 rounded-t-2xl flex justify-between items-center">
                    <h2 className="font-semibold text-gray-800">Saved Payment Methods</h2>
                    <button onClick={() => setShowCardModal(true)} className="text-pink-600 text-sm hover:underline">+ Add New Card</button>
                  </div>
                  {savedCards.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-6xl mb-4">💳</div>
                      <p className="text-gray-500">No saved payment methods</p>
                      <button onClick={() => setShowCardModal(true)} className="mt-3 text-pink-600 hover:underline">Add your first card →</button>
                    </div>
                  ) : (
                    <div className="divide-y divide-pink-50">
                      {savedCards.map(card => (
                        <div key={card._id} className="p-4 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{card.cardType === 'visa' ? '💳' : card.cardType === 'mastercard' ? '💳' : '💳'}</span>
                            <div>
                              <p className="font-medium">•••• {card.last4}</p>
                              <p className="text-xs text-gray-500">Expires {card.expiryMonth}/{card.expiryYear}</p>
                            </div>
                            {card.isDefault && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">Default</span>}
                          </div>
                          <button onClick={() => handleDeleteCard(card._id)} className="text-red-500 text-sm">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ========== LOGIN HISTORY TAB ========== */}
              {activeTab === 'history' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm">
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 border-b border-pink-100 rounded-t-2xl">
                    <h2 className="font-semibold text-gray-800">Login History</h2>
                  </div>
                  {loginHistory.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-6xl mb-4">🕐</div>
                      <p className="text-gray-500">No login history available</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-pink-50">
                      {loginHistory.map((log, idx) => (
                        <div key={idx} className="p-4">
                          <p className="font-medium">{new Date(log.time).toLocaleString()}</p>
                          <p className="text-sm text-gray-500">IP: {log.ip} • {log.device || 'Unknown device'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ========== SUPPORT TAB ========== */}
              {activeTab === 'support' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm">
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 border-b border-pink-100 rounded-t-2xl">
                    <h2 className="font-semibold text-gray-800">Support</h2>
                  </div>
                  <div className="p-6 text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Need Help?</h3>
                    <p className="text-gray-500 mb-4">Our support team is here to assist you</p>
                    <Link to="/contact" className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition">
                      Contact Support →
                    </Link>
                    <div className="mt-6 pt-6 border-t border-pink-100">
                      <p className="text-sm text-gray-500">Email: support@mypinkshop.com</p>
                      <p className="text-sm text-gray-500">Phone: +91 1800-123-4567</p>
                      <p className="text-sm text-gray-500">Hours: Mon-Sat, 10 AM - 7 PM</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddressModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-pink-100 p-4 flex justify-between items-center sticky top-0 bg-white">
                <h3 className="text-lg font-semibold">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                <button onClick={() => setShowAddressModal(false)} className="text-gray-400 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleAddressSubmit} className="p-5 space-y-3">
                <input type="text" placeholder="Full Name" value={addressForm.fullName} onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" required />
                <input type="tel" placeholder="Mobile Number" value={addressForm.phone} onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" required />
                <input type="text" placeholder="Pincode" value={addressForm.pincode} onChange={(e) => setAddressForm({...addressForm, pincode: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" required />
                <input type="text" placeholder="Address Line 1" value={addressForm.addressLine1} onChange={(e) => setAddressForm({...addressForm, addressLine1: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" required />
                <input type="text" placeholder="Address Line 2 (Optional)" value={addressForm.addressLine2} onChange={(e) => setAddressForm({...addressForm, addressLine2: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" required />
                  <input type="text" placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm({...addressForm, state: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" required />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2"><input type="radio" name="addressType" checked={addressForm.addressType === 'home'} onChange={() => setAddressForm({...addressForm, addressType: 'home'})} /> 🏠 Home</label>
                  <label className="flex items-center gap-2"><input type="radio" name="addressType" checked={addressForm.addressType === 'work'} onChange={() => setAddressForm({...addressForm, addressType: 'work'})} /> 💼 Work</label>
                  <label className="flex items-center gap-2"><input type="radio" name="addressType" checked={addressForm.addressType === 'other'} onChange={() => setAddressForm({...addressForm, addressType: 'other'})} /> 📍 Other</label>
                </div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})} /> Make this my default address</label>
                <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2.5 rounded-xl font-medium">{editingAddress ? 'Update Address' : 'Add Address'}</button>
              </form>
            </div>
          </div>
        )}

        {/* Return Modal */}
        {showReturnModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Request Return</h3>
              <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-3">
                <option value="">Select reason</option>
                <option value="damaged">Product damaged</option>
                <option value="wrong">Wrong product received</option>
                <option value="size">Size issue</option>
                <option value="quality">Quality issue</option>
                <option value="other">Other</option>
              </select>
              <textarea placeholder="Additional comments (optional)" value={returnComment} onChange={(e) => setReturnComment(e.target.value)} rows="3" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-4"></textarea>
              <div className="flex gap-3">
                <button onClick={handleReturnRequest} className="flex-1 bg-pink-500 text-white py-2 rounded-xl">Submit Request</button>
                <button onClick={() => { setShowReturnModal(false); setReturnReason(''); setReturnComment(''); }} className="flex-1 bg-gray-200 text-gray-600 py-2 rounded-xl">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Review Modal */}
        {showDeleteReviewModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2">Delete Review?</h3>
              <p className="text-gray-500 mb-4">This action cannot be undone</p>
              <div className="flex gap-3">
                <button onClick={handleDeleteReview} className="flex-1 bg-red-500 text-white py-2 rounded-xl">Delete</button>
                <button onClick={() => setShowDeleteReviewModal(false)} className="flex-1 bg-gray-200 text-gray-600 py-2 rounded-xl">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Card Modal */}
        {showCardModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Card</h3>
              <select value={cardForm.cardType} onChange={(e) => setCardForm({...cardForm, cardType: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-3">
                <option value="">Select Card Type</option>
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="rupay">RuPay</option>
              </select>
              <input type="text" placeholder="Last 4 digits" maxLength="4" value={cardForm.last4} onChange={(e) => setCardForm({...cardForm, last4: e.target.value.replace(/[^0-9]/g, '')})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-3" />
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input type="text" placeholder="Expiry Month (MM)" maxLength="2" value={cardForm.expiryMonth} onChange={(e) => setCardForm({...cardForm, expiryMonth: e.target.value.replace(/[^0-9]/g, '')})} className="px-4 py-2.5 border border-gray-200 rounded-xl" />
                <input type="text" placeholder="Expiry Year (YYYY)" maxLength="4" value={cardForm.expiryYear} onChange={(e) => setCardForm({...cardForm, expiryYear: e.target.value.replace(/[^0-9]/g, '')})} className="px-4 py-2.5 border border-gray-200 rounded-xl" />
              </div>
              <label className="flex items-center gap-2 mb-4"><input type="checkbox" checked={cardForm.isDefault} onChange={(e) => setCardForm({...cardForm, isDefault: e.target.checked})} /> Set as default payment method</label>
              <div className="flex gap-3">
                <button onClick={handleAddCard} className="flex-1 bg-pink-500 text-white py-2 rounded-xl">Save Card</button>
                <button onClick={() => setShowCardModal(false)} className="flex-1 bg-gray-200 text-gray-600 py-2 rounded-xl">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteAccountModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="text-center mb-4">
                <div className="text-6xl mb-3">⚠️</div>
                <h3 className="text-xl font-bold text-gray-800">Delete Account</h3>
                <p className="text-gray-500 text-sm mt-2">This action is permanent. All your data will be erased.</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Type <strong className="text-red-600">DELETE</strong> to confirm</p>
                <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-center" placeholder="DELETE" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleDeleteAccount} className="flex-1 bg-red-500 text-white py-2 rounded-xl">Delete Account</button>
                <button onClick={() => { setShowDeleteAccountModal(false); setDeleteConfirmText(''); }} className="flex-1 bg-gray-200 text-gray-600 py-2 rounded-xl">Cancel</button>
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
