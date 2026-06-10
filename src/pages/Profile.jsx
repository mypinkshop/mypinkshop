import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

function Profile() {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    emailVerified: false,
    phoneVerified: false,
    createdAt: ''
  });
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchOrder, setSearchOrder] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [showEmailEdit, setShowEmailEdit] = useState(false);
  const [showPhoneEdit, setShowPhoneEdit] = useState(false);
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [offer, setOffer] = useState(null);
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

  const API_URL = 'https://api.mypinkshop.com';

  // Fetch all user data on load
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchUserData();
    fetchAddresses();
    fetchOrders();
    fetchOffer();
  }, [user, navigate]);

  // Fetch offer banner from backend
  const fetchOffer = async () => {
    try {
      const response = await fetch(`${API_URL}/api/offers/active-offer`);
      const data = await response.json();
      setOffer(data);
    } catch (error) {
      console.error('Failed to fetch offer:', error);
    }
  };

  // Fetch user profile from backend
  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          emailVerified: data.emailVerified || false,
          phoneVerified: data.phoneVerified || false,
          createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
        });
        setNewName(data.name || '');
        setNewEmail(data.email || '');
        setNewPhone(data.phone || '');
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch addresses from backend
  const fetchAddresses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
        // Update context if needed
      } else {
        alert('Failed to update name');
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
      } else {
        alert('Failed to update phone');
      }
    } catch (error) {
      alert('Error updating phone');
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
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
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

  // Send verification email
  const sendVerificationEmail = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/send-verification-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert(`Verification link sent to ${userData.email}`);
      } else {
        alert('Failed to send verification email');
      }
    } catch (error) {
      alert('Error sending verification');
    }
  };

  // Send phone verification OTP
  const sendPhoneVerification = async () => {
    if (!userData.phone) {
      alert('Please add a phone number first');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/users/send-phone-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert(`OTP sent to ${userData.phone}`);
      } else {
        alert('Failed to send OTP');
      }
    } catch (error) {
      alert('Error sending OTP');
    }
  };

  // Add/Update address
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
        fetchAddresses(); // Refresh addresses
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
        });
      } else {
        alert('Failed to save address');
      }
    } catch (error) {
      alert('Error saving address');
    }
  };

  // Delete address
  const deleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchAddresses();
      } else {
        alert('Failed to delete address');
      }
    } catch (error) {
      alert('Error deleting address');
    }
  };

  // Set default address
  const setDefaultAddress = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/users/addresses/${id}/default`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchAddresses();
      } else {
        alert('Failed to set default address');
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchOrders(); // Refresh orders
        alert('Order cancelled successfully');
      } else {
        alert('Failed to cancel order');
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      
      {/* Dynamic Top Bar - Offer Banner */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
          <span>✨</span>
          <span>{offer?.description || 'FREE SHIPPING ON ALL ORDERS'}</span>
          <span className="hidden sm:inline">•</span>
          <span>Extra 10% off on first order</span>
          <span className="hidden sm:inline">•</span>
          <span>Cash on Delivery Available</span>
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
                <h2 className="font-semibold text-gray-800">Account Settings</h2>
              </div>
              <div className="divide-y divide-pink-50">
                {[
                  { id: 'orders', label: '📦 Your Orders' },
                  { id: 'addresses', label: '📍 Your Addresses' },
                  { id: 'security', label: '🔐 Login & Security' },
                  { id: 'payments', label: '💳 Payment Methods' },
                ].map(tab => (
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
            {/* Orders Tab */}
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition bg-white"
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
                            <p className="text-sm text-gray-500">Ordered on {new Date(order.createdAt || order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            <p className="text-sm text-gray-500 mt-1">{order.items?.length || 0} items</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">₹{(order.total || order.amount)?.toLocaleString()}</p>
                            <p className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </p>
                            {(order.status === 'pending' || order.status === 'confirmed') && (
                              <button onClick={() => cancelOrder(order._id || order.id)} className="text-xs text-red-600 hover:underline mt-1">
                                Cancel Order
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-3">
                          <Link to={`/track-order/${order._id || order.id}`} className="text-sm text-pink-600 hover:underline">
                            Track Order →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
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
                        isDefault: addresses.length === 0 
                      });
                      setShowAddressModal(true);
                    }}
                    className="text-pink-600 text-sm hover:underline"
                  >
                    + Add Address
                  </button>
                </div>
                {addresses.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-6xl mb-4">📍</div>
                    <p className="text-gray-500">No addresses saved</p>
                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="mt-3 text-pink-600 hover:underline"
                    >
                      Add your first address →
                    </button>
                  </div>
                ) : (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                      <div key={addr._id || addr.id} className="border border-pink-100 rounded-xl p-4 hover:shadow-md transition bg-white">
                        {addr.isDefault && (
                          <span className="text-xs bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2 py-0.5 rounded-full mb-2 inline-block">
                            Default
                          </span>
                        )}
                        <p className="font-semibold text-gray-800">{addr.fullName}</p>
                        <p className="text-sm text-gray-600 mt-1">{addr.addressLine1}</p>
                        {addr.addressLine2 && <p className="text-sm text-gray-600">{addr.addressLine2}</p>}
                        <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="text-sm text-gray-500 mt-1">{addr.phone}</p>
                        <div className="flex gap-4 mt-3">
                          <button
                            onClick={() => {
                              setEditingAddress(addr);
                              setAddressForm(addr);
                              setShowAddressModal(true);
                            }}
                            className="text-sm text-pink-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button onClick={() => deleteAddress(addr._id || addr.id)} className="text-sm text-red-600 hover:underline">
                            Delete
                          </button>
                          {!addr.isDefault && (
                            <button onClick={() => setDefaultAddress(addr._id || addr.id)} className="text-sm text-gray-600 hover:underline">
                              Set as Default
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm">
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 border-b border-pink-100 rounded-t-2xl">
                  <h2 className="font-semibold text-gray-800">Login & Security</h2>
                </div>
                <div className="divide-y divide-pink-50">
                  {/* Name */}
                  <div className="p-4 flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-800">{userData.name}</p>
                    </div>
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
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-800">{userData.email}</p>
                      {!userData.emailVerified && <p className="text-xs text-yellow-600 mt-1">Not verified</p>}
                    </div>
                    <div className="flex gap-3">
                      {!userData.emailVerified && (
                        <button onClick={sendVerificationEmail} className="text-blue-600 text-sm hover:underline">Verify</button>
                      )}
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
                    <div>
                      <p className="text-sm text-gray-500">Mobile Number</p>
                      <p className="font-medium text-gray-800">{userData.phone || 'Not added'}</p>
                      {userData.phone && !userData.phoneVerified && <p className="text-xs text-yellow-600 mt-1">Not verified</p>}
                    </div>
                    <div className="flex gap-3">
                      {userData.phone && !userData.phoneVerified && (
                        <button onClick={sendPhoneVerification} className="text-blue-600 text-sm hover:underline">Verify</button>
                      )}
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
                  </div>

                  {/* Password */}
                  <div className="p-4 flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Password</p>
                      <p className="font-medium text-gray-800">••••••••</p>
                    </div>
                    {showPasswordEdit ? (
                      <div className="flex flex-col gap-2">
                        <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-1 text-sm w-48" />
                        <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-1 text-sm w-48" />
                        <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-1 text-sm w-48" />
                        <div className="flex gap-2">
                          <button onClick={handlePasswordUpdate} className="text-green-600 text-sm">Save</button>
                          <button onClick={() => setShowPasswordEdit(false)} className="text-gray-500 text-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowPasswordEdit(true)} className="text-pink-600 text-sm hover:underline">Change</button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm">
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 border-b border-pink-100 rounded-t-2xl">
                  <h2 className="font-semibold text-gray-800">Payment Methods</h2>
                </div>
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">💳</div>
                  <p className="text-gray-500">No saved payment methods</p>
                  <p className="text-xs text-gray-400 mt-2">Pay with Card, UPI, or COD at checkout</p>
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
            <div className="border-b border-pink-100 p-4 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-lg font-semibold text-gray-800">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleAddressSubmit} className="p-5 space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={addressForm.fullName}
                onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                required
              />
              <input
                type="tel"
                placeholder="Mobile Number"
                value={addressForm.phone}
                onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                required
              />
              <input
                type="text"
                placeholder="Pincode"
                value={addressForm.pincode}
                onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                required
              />
              <input
                type="text"
                placeholder="Address Line 1"
                value={addressForm.addressLine1}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                required
              />
              <input
                type="text"
                placeholder="Address Line 2 (Optional)"
                value={addressForm.addressLine2}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                  required
                />
                <input
                  type="text"
                  placeholder="State"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                  required
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-600">Make this my default address</span>
              </label>
              <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2.5 rounded-xl font-medium hover:shadow-lg transition-all mt-2">
                {editingAddress ? 'Update Address' : 'Add Address'}
              </button>
            </form>
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
            <p className="text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Profile;
