import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();
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
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [newName, setNewName] = useState('');
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
        joinedDate: parsed.createdAt ? new Date(parsed.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '1 January 2025',
      });
      setNewName(parsed.name || '');
    }

    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      setProfileImage(savedImage);
    }

    const savedAddresses = localStorage.getItem('userAddresses');
    if (savedAddresses) {
      setAddresses(JSON.parse(savedAddresses));
    } else {
      setAddresses([
        { id: 1, fullName: 'Priya Sharma', mobile: '9876543210', pincode: '400053', address: '123, Andheri West', city: 'Mumbai', state: 'Maharashtra', isDefault: true },
      ]);
    }

    const savedOrders = localStorage.getItem('userOrders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    } else {
      setOrders([
        { id: '#MPS1001', date: '2025-05-10', total: 2598, status: 'Delivered', items: 2, image: '💧' },
        { id: '#MPS1002', date: '2025-05-05', total: 1798, status: 'Shipped', items: 1, image: '🌸' },
      ]);
    }
  }, []);

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

  const handleNameUpdate = () => {
    if (newName.trim()) {
      const updatedUser = { ...userData, name: newName };
      setUserData(updatedUser);
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.name = newName;
      localStorage.setItem('user', JSON.stringify(storedUser));
      setShowNameEdit(false);
      alert('Name updated successfully!');
    }
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    let updatedAddresses;
    if (editingAddress) {
      updatedAddresses = addresses.map(addr => addr.id === editingAddress.id ? { ...addr, ...addressForm } : addr);
    } else {
      const newAddress = { id: Date.now(), ...addressForm };
      updatedAddresses = [...addresses, newAddress];
    }
    setAddresses(updatedAddresses);
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
    setShowAddressModal(false);
    setEditingAddress(null);
    setAddressForm({ fullName: '', mobile: '', pincode: '', address: '', city: '', state: '', isDefault: false });
    alert(editingAddress ? 'Address updated!' : 'Address added!');
  };

  const deleteAddress = (id) => {
    if (confirm('Delete this address?')) {
      const updatedAddresses = addresses.filter(addr => addr.id !== id);
      setAddresses(updatedAddresses);
      localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
      alert('Address deleted!');
    }
  };

  const setDefaultAddress = (id) => {
    const updatedAddresses = addresses.map(addr => ({ ...addr, isDefault: addr.id === id }));
    setAddresses(updatedAddresses);
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
  };

  const sendVerificationEmail = () => {
    alert(`Verification link sent to ${userData.email}`);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Delivered': return 'bg-green-100 text-green-700';
      case 'Shipped': return 'bg-blue-100 text-blue-700';
      case 'Processing': return 'bg-purple-100 text-purple-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

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
        {/* Profile Header - Amazon Style */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-pink-200 shadow-md" />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md">
                  {userData.name?.charAt(0) || 'U'}
                </div>
              )}
              <button onClick={() => fileInputRef.current.click()} className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 transition">
                <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {showNameEdit ? (
                  <div className="flex items-center gap-2">
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="px-3 py-1 border rounded-lg" />
                    <button onClick={handleNameUpdate} className="text-green-600 hover:text-green-700">Save</button>
                    <button onClick={() => setShowNameEdit(false)} className="text-gray-500 hover:text-gray-600">Cancel</button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-800">{userData.name}</h1>
                    <button onClick={() => setShowNameEdit(true)} className="text-pink-500 text-sm hover:underline">Edit</button>
                  </>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">{userData.email}</p>
              <p className="text-gray-400 text-xs mt-1">Member since {userData.joinedDate}</p>
            </div>
          </div>
        </div>

        {/* Amazon Style Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-6">
          {['orders', 'addresses', 'security', 'payments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium transition ${
                activeTab === tab 
                  ? 'text-pink-600 border-b-2 border-pink-600' 
                  : 'text-gray-600 hover:text-pink-600'
              }`}
            >
              {tab === 'orders' && 'Your Orders'}
              {tab === 'addresses' && 'Your Addresses'}
              {tab === 'security' && 'Login & Security'}
              {tab === 'payments' && 'Payment Methods'}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
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
                          <p className="font-medium text-gray-800">{order.id}</p>
                          <p className="text-sm text-gray-500">Placed on {order.date}</p>
                          <p className="text-sm text-gray-500">{order.items} items</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-pink-600">₹{order.total}</p>
                        <p className={`text-sm px-2 py-0.5 rounded-full inline-block ${getStatusBadge(order.status)}`}>{order.status}</p>
                        <button onClick={() => navigate(`/track-order/${order.id}`)} className="text-sm text-pink-500 hover:underline block mt-2">Track Order</button>
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
            <div className="flex justify-end">
              <button onClick={() => { setEditingAddress(null); setAddressForm({ fullName: '', mobile: '', pincode: '', address: '', city: '', state: '', isDefault: false }); setShowAddressModal(true); }} className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-600 transition">
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

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
            <div className="p-5 flex justify-between items-center">
              <div><p className="font-medium text-gray-800">Name</p><p className="text-sm text-gray-500">{userData.name}</p></div>
              <button onClick={() => setShowNameEdit(true)} className="text-pink-500 text-sm hover:underline">Edit</button>
            </div>
            <div className="p-5 flex justify-between items-center">
              <div><p className="font-medium text-gray-800">Email</p><div className="flex items-center gap-2"><p className="text-sm text-gray-500">{userData.email}</p>{userData.emailVerified ? <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">Verified</span> : <button onClick={sendVerificationEmail} className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full hover:bg-yellow-200">Verify Now</button>}</div></div>
              <button className="text-pink-500 text-sm hover:underline">Edit</button>
            </div>
            <div className="p-5 flex justify-between items-center">
              <div><p className="font-medium text-gray-800">Mobile Number</p><p className="text-sm text-gray-500">{userData.mobile || 'Not added'}</p></div>
              <button className="text-pink-500 text-sm hover:underline">Add</button>
            </div>
            <div className="p-5 flex justify-between items-center">
              <div><p className="font-medium text-gray-800">Password</p><p className="text-sm text-gray-500">••••••••</p></div>
              <button className="text-pink-500 text-sm hover:underline">Change</button>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
            <div className="text-5xl mb-3">💳</div>
            <p className="text-gray-500">No saved payment methods</p>
            <button className="mt-2 text-pink-500 text-sm hover:underline">Add Payment Method</button>
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
              <label className="flex items-center gap-2"><input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} /><span className="text-sm">Set as default address</span></label>
              <button type="submit" className="w-full bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition">{editingAddress ? 'Update' : 'Add'} Address</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
