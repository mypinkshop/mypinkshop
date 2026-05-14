import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('orders');
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    mobile: '',
    emailVerified: false,
    mobileVerified: false,
    joinedDate: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const fileInputRef = useRef(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    mobile: '',
    pincode: '',
    address: '',
    city: '',
    state: '',
    isDefault: false,
  });

  // Get tab from URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'addresses') setActiveTab('addresses');
  }, [location]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserData({
        name: parsed.name || '',
        email: parsed.email || '',
        mobile: parsed.mobile || '',
        emailVerified: parsed.emailVerified || false,
        mobileVerified: parsed.mobileVerified || false,
        joinedDate: parsed.createdAt ? new Date(parsed.createdAt).toLocaleDateString() : '2025-01-01',
      });
    }

    // Load profile image
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      setProfileImage(savedImage);
    }

    // Mock addresses
    setAddresses([
      { id: 1, fullName: 'Priya Sharma', mobile: '9876543210', pincode: '400053', address: '123, Andheri West', city: 'Mumbai', state: 'Maharashtra', isDefault: true },
    ]);

    // Mock orders
    setOrders([
      { id: '#MPS1001', date: '2025-05-10', total: 2598, status: 'Delivered', items: 2, image: '💧' },
      { id: '#MPS1002', date: '2025-05-05', total: 1798, status: 'Shipped', items: 1, image: '🌸' },
    ]);
  }, [location]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        setProfileImage(imageData);
        localStorage.setItem('profileImage', imageData);
        alert('Profile picture updated!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (editingAddress) {
      setAddresses(addresses.map(addr => addr.id === editingAddress.id ? { ...addr, ...addressForm } : addr));
    } else {
      setAddresses([...addresses, { id: Date.now(), ...addressForm }]);
    }
    setShowAddressModal(false);
    setEditingAddress(null);
    setAddressForm({ fullName: '', mobile: '', pincode: '', address: '', city: '', state: '', isDefault: false });
    alert(editingAddress ? 'Address updated!' : 'Address added!');
  };

  const deleteAddress = (id) => {
    if (confirm('Delete this address?')) {
      setAddresses(addresses.filter(addr => addr.id !== id));
    }
  };

  const setDefaultAddress = (id) => {
    setAddresses(addresses.map(addr => ({ ...addr, isDefault: addr.id === id })));
  };

  const sendVerificationEmail = () => {
    alert(`Verification link sent to ${userData.email}`);
  };

  const tabs = [
    { id: 'orders', label: 'Your Orders', icon: '📦' },
    { id: 'addresses', label: 'Your Addresses', icon: '📍' },
    { id: 'security', label: 'Login & Security', icon: '🔐' },
    { id: 'payments', label: 'Payment Methods', icon: '💳' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-block hover:opacity-80 transition">
            <h1 className="text-2xl font-bold text-pink-600">MyPinkShop</h1>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Section with Profile Picture */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm">
                  {userData.name?.charAt(0) || 'U'}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current.click()}
                className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition"
              >
                <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Hello, {userData.name || 'User'}!</h1>
              <p className="text-white/80 text-sm">Member since {userData.joinedDate}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-t-lg font-medium transition ${
                activeTab === tab.id 
                  ? 'bg-white text-pink-600 border-t border-l border-r border-gray-200' 
                  : 'text-gray-600 hover:text-pink-600'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Your Orders</h2>
              <p className="text-sm text-gray-500">Track, return, or buy things again</p>
            </div>
            {orders.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-5xl mb-3">📦</div>
                <p className="text-gray-500">No orders yet</p>
                <Link to="/shop" className="mt-3 text-pink-500 text-sm inline-block">Start Shopping →</Link>
              </div>
            ) : (
              <div className="divide-y">
                {orders.map(order => (
                  <div key={order.id} className="p-5 hover:bg-gray-50 transition">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">{order.image}</div>
                        <div>
                          <p className="font-medium">{order.id}</p>
                          <p className="text-sm text-gray-500">Placed on {order.date}</p>
                          <p className="text-sm text-gray-500">{order.items} items</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-pink-600">₹{order.total}</p>
                        <p className="text-sm text-green-600">{order.status}</p>
                        <button 
                          onClick={() => navigate(`/track-order/${order.id}`)}
                          className="text-sm text-pink-500 hover:underline mt-1"
                        >
                          Track Order
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Your Addresses</h2>
              <button
                onClick={() => { setEditingAddress(null); setAddressForm({ fullName: '', mobile: '', pincode: '', address: '', city: '', state: '', isDefault: false }); setShowAddressModal(true); }}
                className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-600 transition"
              >
                + Add Address
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map(addr => (
                <div key={addr.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  {addr.isDefault && <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">Default</span>}
                  <p className="font-medium mt-2">{addr.fullName}</p>
                  <p className="text-sm text-gray-600">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                  <p className="text-sm text-gray-500">Mobile: {addr.mobile}</p>
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => { setEditingAddress(addr); setAddressForm(addr); setShowAddressModal(true); }} className="text-sm text-pink-500 hover:underline">Edit</button>
                    <button onClick={() => deleteAddress(addr.id)} className="text-sm text-red-500 hover:underline">Delete</button>
                    {!addr.isDefault && <button onClick={() => setDefaultAddress(addr.id)} className="text-sm text-gray-500 hover:underline">Set as Default</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Login & Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Login & Security</h2>
            </div>
            <div className="divide-y">
              <div className="p-5 flex justify-between items-center">
                <div>
                  <p className="font-medium">Name</p>
                  <p className="text-sm text-gray-600">{userData.name}</p>
                </div>
                <button className="text-pink-500 text-sm hover:underline">Edit</button>
              </div>
              <div className="p-5 flex justify-between items-center">
                <div>
                  <p className="font-medium">Email</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600">{userData.email}</p>
                    {userData.emailVerified ? (
                      <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">Verified</span>
                    ) : (
                      <button onClick={sendVerificationEmail} className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full hover:bg-yellow-200">Verify Now</button>
                    )}
                  </div>
                </div>
                <button className="text-pink-500 text-sm hover:underline">Edit</button>
              </div>
              <div className="p-5 flex justify-between items-center">
                <div>
                  <p className="font-medium">Mobile Number</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600">{userData.mobile || 'Not added'}</p>
                    {userData.mobileVerified && <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">Verified</span>}
                  </div>
                </div>
                <button className="text-pink-500 text-sm hover:underline">Add/Update</button>
              </div>
              <div className="p-5 flex justify-between items-center">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-gray-600">••••••••</p>
                </div>
                <button className="text-pink-500 text-sm hover:underline">Change</button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Your Payment Methods</h2>
              <button className="text-pink-500 text-sm hover:underline">+ Add Payment Method</button>
            </div>
            <div className="p-5 text-center text-gray-500">
              <div className="text-4xl mb-3">💳</div>
              <p className="text-gray-500">No saved payment methods</p>
              <button className="mt-2 text-pink-500 text-sm">Add a card or UPI</button>
            </div>
          </div>
        )}
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddressModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleAddressSubmit} className="p-5 space-y-4">
              <input type="text" placeholder="Full Name" value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              <input type="tel" placeholder="Mobile Number" value={addressForm.mobile} onChange={(e) => setAddressForm({ ...addressForm, mobile: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              <input type="text" placeholder="Pincode" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              <textarea placeholder="Address (House No, Building, Street)" rows="2" value={addressForm.address} onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                <input type="text" placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} />
                <span className="text-sm">Set as default address</span>
              </label>
              <button type="submit" className="w-full bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition">{editingAddress ? 'Update' : 'Add'} Address</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
