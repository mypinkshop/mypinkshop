import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [activeTab, setActiveTab] = useState('orders');
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    mobile: '',
    emailVerified: false,
    mobileVerified: false,
    joinedDate: '',
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
  const [showMobileEdit, setShowMobileEdit] = useState(false);
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    mobile: '',
    pincode: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    isDefault: false,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserData({
        name: parsed.name || '',
        email: parsed.email || '',
        mobile: parsed.mobile || '',
        emailVerified: parsed.emailVerified || false,
        mobileVerified: parsed.mobileVerified || false,
        joinedDate: parsed.createdAt ? new Date(parsed.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      });
      setNewName(parsed.name || '');
      setNewEmail(parsed.email || '');
      setNewMobile(parsed.mobile || '');
    }

    const savedAddresses = localStorage.getItem('userAddresses');
    if (savedAddresses) {
      setAddresses(JSON.parse(savedAddresses));
    }

    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const userOrders = allOrders.filter(order => order.customerEmail === user?.email);
    userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    setOrders(userOrders);
    setFilteredOrders(userOrders);
  }, [user, navigate]);

  useEffect(() => {
    let filtered = orders;
    if (searchOrder) {
      filtered = filtered.filter(order => order.id.toLowerCase().includes(searchOrder.toLowerCase()));
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status.toLowerCase() === filterStatus.toLowerCase());
    }
    setFilteredOrders(filtered);
  }, [searchOrder, filterStatus, orders]);

  const handleNameUpdate = () => {
    if (newName.trim()) {
      const updatedUser = { ...userData, name: newName };
      setUserData(updatedUser);
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.name = newName;
      localStorage.setItem('user', JSON.stringify(storedUser));
      setShowNameEdit(false);
    }
  };

  const handleEmailUpdate = () => {
    if (newEmail.trim() && newEmail.includes('@')) {
      const updatedUser = { ...userData, email: newEmail, emailVerified: false };
      setUserData(updatedUser);
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.email = newEmail;
      storedUser.emailVerified = false;
      localStorage.setItem('user', JSON.stringify(storedUser));
      setShowEmailEdit(false);
    } else {
      alert('Please enter a valid email address');
    }
  };

  const handleMobileUpdate = () => {
    if (newMobile.trim() && newMobile.length >= 10) {
      const updatedUser = { ...userData, mobile: newMobile, mobileVerified: false };
      setUserData(updatedUser);
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.mobile = newMobile;
      storedUser.mobileVerified = false;
      localStorage.setItem('user', JSON.stringify(storedUser));
      setShowMobileEdit(false);
    } else {
      alert('Please enter a valid 10-digit mobile number');
    }
  };

  const handlePasswordUpdate = () => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    alert('Password changed successfully!');
    setShowPasswordEdit(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const sendVerificationEmail = () => {
    alert(`Verification link sent to ${userData.email}`);
  };

  const sendMobileVerification = () => {
    alert(`OTP sent to ${userData.mobile}`);
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    
    let updatedAddresses;
    if (editingAddress) {
      updatedAddresses = addresses.map(addr => 
        addr.id === editingAddress.id ? { ...addr, ...addressForm } : addr
      );
    } else {
      const newAddress = { id: Date.now(), ...addressForm };
      updatedAddresses = [...addresses, newAddress];
    }
    
    setAddresses(updatedAddresses);
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
    setShowAddressModal(false);
    setEditingAddress(null);
    setAddressForm({ fullName: '', mobile: '', pincode: '', addressLine1: '', addressLine2: '', city: '', state: '', isDefault: false });
  };

  const deleteAddress = (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      const updatedAddresses = addresses.filter(addr => addr.id !== id);
      setAddresses(updatedAddresses);
      localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
    }
  };

  const setDefaultAddress = (id) => {
    const updatedAddresses = addresses.map(addr => ({ ...addr, isDefault: addr.id === id }));
    setAddresses(updatedAddresses);
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
  };

  const cancelOrder = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
      const updatedAllOrders = allOrders.map(order => 
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      );
      localStorage.setItem('adminOrdersList', JSON.stringify(updatedAllOrders));
      
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      );
      setOrders(updatedOrders);
      alert('Order cancelled successfully');
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'text-green-600';
      case 'shipped': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'Delivered';
      case 'shipped': return 'Shipped';
      case 'pending': return 'Processing';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Processing';
    }
  };

  if (!user) {
    return null;
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
              
              <Avatar user={user} onLogout={logout} />
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-pink-600">Home</Link>
          <span>/</span>
          <span className="text-gray-700">My Account</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Your Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">Account Settings</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { id: 'orders', label: 'Your Orders' },
                  { id: 'addresses', label: 'Your Addresses' },
                  { id: 'security', label: 'Login & Security' },
                  { id: 'payments', label: 'Payment Methods' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                      activeTab === tab.id ? 'text-pink-600 font-medium bg-pink-50' : 'text-gray-600'
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
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-800">Your Orders</h2>
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Search orders by ID..."
                        value={searchOrder}
                        onChange={(e) => setSearchOrder(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 bg-white"
                    >
                      <option value="all">All Orders</option>
                      <option value="delivered">Delivered</option>
                      <option value="shipped">Shipped</option>
                      <option value="pending">Processing</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                {filteredOrders.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-5xl mb-3">📦</div>
                    <p className="text-gray-500">No orders found</p>
                    <Link to="/shop" className="inline-block mt-3 text-pink-600 hover:underline">Start Shopping →</Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredOrders.map(order => (
                      <div key={order.id} className="p-4 hover:bg-gray-50 transition">
                        <div className="flex flex-wrap justify-between items-start gap-3">
                          <div>
                            <p className="font-semibold text-gray-800">{order.id}</p>
                            <p className="text-sm text-gray-500">Ordered on {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            <p className="text-sm text-gray-500 mt-1">{order.items?.length || 0} items</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">₹{order.total?.toLocaleString()}</p>
                            <p className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </p>
                            {order.status === 'pending' && (
                              <button onClick={() => cancelOrder(order.id)} className="text-xs text-red-600 hover:underline mt-1">
                                Cancel Order
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex gap-3">
                          <Link to={`/track-order/${order.id}`} className="text-sm text-pink-600 hover:underline">
                            Track Order
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
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="font-semibold text-gray-800">Your Addresses</h2>
                  <button
                    onClick={() => {
                      setEditingAddress(null);
                      setAddressForm({ fullName: userData.name || '', mobile: userData.mobile || '', pincode: '', addressLine1: '', addressLine2: '', city: '', state: '', isDefault: addresses.length === 0 });
                      setShowAddressModal(true);
                    }}
                    className="text-pink-600 text-sm hover:underline"
                  >
                    + Add Address
                  </button>
                </div>
                {addresses.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-5xl mb-3">📍</div>
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
                      <div key={addr.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                        {addr.isDefault && (
                          <span className="text-xs bg-pink-600 text-white px-2 py-0.5 rounded-full mb-2 inline-block">
                            Default
                          </span>
                        )}
                        <p className="font-semibold text-gray-800">{addr.fullName}</p>
                        <p className="text-sm text-gray-600 mt-1">{addr.addressLine1}</p>
                        {addr.addressLine2 && <p className="text-sm text-gray-600">{addr.addressLine2}</p>}
                        <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="text-sm text-gray-500 mt-1">{addr.mobile}</p>
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
                          <button onClick={() => deleteAddress(addr.id)} className="text-sm text-red-600 hover:underline">
                            Delete
                          </button>
                          {!addr.isDefault && (
                            <button onClick={() => setDefaultAddress(addr.id)} className="text-sm text-gray-600 hover:underline">
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
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-800">Login & Security</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {/* Name */}
                  <div className="p-4 flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-800">{userData.name}</p>
                    </div>
                    {showNameEdit ? (
                      <div className="flex gap-2">
                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1 text-sm" />
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
                          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1 text-sm" />
                          <button onClick={handleEmailUpdate} className="text-green-600 text-sm">Save</button>
                          <button onClick={() => setShowEmailEdit(false)} className="text-gray-500 text-sm">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setShowEmailEdit(true)} className="text-pink-600 text-sm hover:underline">Edit</button>
                      )}
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="p-4 flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Mobile Number</p>
                      <p className="font-medium text-gray-800">{userData.mobile || 'Not added'}</p>
                      {userData.mobile && !userData.mobileVerified && <p className="text-xs text-yellow-600 mt-1">Not verified</p>}
                    </div>
                    <div className="flex gap-3">
                      {userData.mobile && !userData.mobileVerified && (
                        <button onClick={sendMobileVerification} className="text-blue-600 text-sm hover:underline">Verify</button>
                      )}
                      {showMobileEdit ? (
                        <div className="flex gap-2">
                          <input type="tel" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} placeholder="10-digit mobile" className="border border-gray-300 rounded-lg px-3 py-1 text-sm" />
                          <button onClick={handleMobileUpdate} className="text-green-600 text-sm">Save</button>
                          <button onClick={() => setShowMobileEdit(false)} className="text-gray-500 text-sm">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setShowMobileEdit(true)} className="text-pink-600 text-sm hover:underline">Add/Update</button>
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
                        <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1 text-sm w-48" />
                        <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1 text-sm w-48" />
                        <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1 text-sm w-48" />
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
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-800">Payment Methods</h2>
                </div>
                <div className="p-8 text-center">
                  <div className="text-5xl mb-3">💳</div>
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
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-800">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleAddressSubmit} className="p-5 space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={addressForm.fullName}
                onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                required
              />
              <input
                type="tel"
                placeholder="Mobile Number"
                value={addressForm.mobile}
                onChange={(e) => setAddressForm({ ...addressForm, mobile: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Pincode"
                value={addressForm.pincode}
                onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Address Line 1"
                value={addressForm.addressLine1}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Address Line 2 (Optional)"
                value={addressForm.addressLine2}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="State"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-4 h-4 text-pink-600 rounded"
                />
                <span className="text-sm text-gray-600">Make this my default address</span>
              </label>
              <button type="submit" className="w-full bg-pink-600 text-white py-2 rounded-lg font-medium hover:bg-pink-700 transition mt-2">
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

export default Profile;
