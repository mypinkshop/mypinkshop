import { useState, useEffect } from 'react';
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
      setNewEmail(parsed.email || '');
      setNewMobile(parsed.mobile || '');
    }

    const savedAddresses = localStorage.getItem('userAddresses');
    if (savedAddresses) {
      setAddresses(JSON.parse(savedAddresses));
    } else {
      setAddresses([
        { id: 1, fullName: 'Priya Sharma', mobile: '9876543210', pincode: '400053', addressLine1: '123, Andheri West', addressLine2: 'Near Metro Station', city: 'Mumbai', state: 'Maharashtra', isDefault: true },
      ]);
    }

    const savedOrders = localStorage.getItem('userOrders');
    if (savedOrders) {
      const parsedOrders = JSON.parse(savedOrders);
      setOrders(parsedOrders);
      setFilteredOrders(parsedOrders);
    } else {
      const mockOrders = [
        { id: '#MPS-1001', date: '2025-05-15', total: 2598, status: 'Delivered', items: 2 },
        { id: '#MPS-1002', date: '2025-05-10', total: 1798, status: 'Shipped', items: 1 },
        { id: '#MPS-1003', date: '2025-05-05', total: 899, status: 'Processing', items: 1 },
      ];
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
    }
  }, []);

  // Filter orders
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
      alert('Name updated successfully!');
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
      alert('Email updated! Please verify your new email address.');
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
      alert('Mobile number updated! Please verify your mobile number.');
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
    const fullAddress = `${addressForm.addressLine1}${addressForm.addressLine2 ? ', ' + addressForm.addressLine2 : ''}`;
    let updatedAddresses;
    if (editingAddress) {
      updatedAddresses = addresses.map(addr => addr.id === editingAddress.id ? { ...addr, ...addressForm, address: fullAddress } : addr);
    } else {
      const newAddress = { id: Date.now(), ...addressForm, address: fullAddress };
      updatedAddresses = [...addresses, newAddress];
    }
    setAddresses(updatedAddresses);
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
    setShowAddressModal(false);
    setEditingAddress(null);
    setAddressForm({ fullName: '', mobile: '', pincode: '', addressLine1: '', addressLine2: '', city: '', state: '', isDefault: false });
    alert(editingAddress ? 'Address updated!' : 'Address added!');
  };

  const deleteAddress = (id) => {
    if (confirm('Are you sure you want to delete this address?')) {
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
    if (confirm('Are you sure you want to cancel this order?')) {
      const updatedOrders = orders.map(order => order.id === orderId ? { ...order, status: 'Cancelled' } : order);
      setOrders(updatedOrders);
      localStorage.setItem('userOrders', JSON.stringify(updatedOrders));
      alert('Order cancelled successfully');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return 'text-green-600';
      case 'Shipped': return 'text-blue-600';
      case 'Processing': return 'text-yellow-600';
      case 'Cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Amazon Style Header */}
      <header className="bg-white border-b border-gray-200 py-3 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <Link to="/" className="text-xl font-bold text-pink-600 hover:text-pink-700 transition">MyPinkShop</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-normal text-gray-700 mb-6">Your Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="md:col-span-1">
            <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h2 className="font-medium text-gray-700">Account Settings</h2>
              </div>
              <div className="divide-y divide-gray-100">
                <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${activeTab === 'orders' ? 'text-pink-600 font-medium bg-pink-50' : 'text-gray-600'}`}>Your Orders</button>
                <button onClick={() => setActiveTab('addresses')} className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${activeTab === 'addresses' ? 'text-pink-600 font-medium bg-pink-50' : 'text-gray-600'}`}>Your Addresses</button>
                <button onClick={() => setActiveTab('security')} className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${activeTab === 'security' ? 'text-pink-600 font-medium bg-pink-50' : 'text-gray-600'}`}>Login & Security</button>
                <button onClick={() => setActiveTab('payments')} className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${activeTab === 'payments' ? 'text-pink-600 font-medium bg-pink-50' : 'text-gray-600'}`}>Payment Methods</button>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="md:col-span-3">
            {/* Orders Tab with Search & Filter */}
            {activeTab === 'orders' && (
              <div className="border border-gray-200 rounded-md bg-white">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h2 className="font-medium text-gray-700">Your Orders</h2>
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <input type="text" placeholder="Search orders by ID..." value={searchOrder} onChange={(e) => setSearchOrder(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500" />
                    </div>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500">
                      <option value="all">All Orders</option>
                      <option value="delivered">Delivered</option>
                      <option value="shipped">Shipped</option>
                      <option value="processing">Processing</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                {filteredOrders.length === 0 ? (
                  <div className="p-8 text-center"><p className="text-gray-500">No orders found</p></div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredOrders.map(order => (
                      <div key={order.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div><p className="font-medium text-gray-800">{order.id}</p><p className="text-sm text-gray-500">Ordered on {order.date}</p><p className="text-sm text-gray-500 mt-1">{order.items} items</p></div>
                          <div className="text-right"><p className="font-bold text-gray-800">₹{order.total.toLocaleString()}</p><p className={`text-sm ${getStatusColor(order.status)}`}>{order.status}</p>{order.status === 'Processing' && (<button onClick={() => cancelOrder(order.id)} className="text-sm text-red-600 hover:underline mt-1">Cancel Order</button>)}</div>
                        </div>
                        <div className="mt-3 flex gap-3"><button className="text-sm text-pink-600 hover:underline">View Order Details</button>{order.status === 'Shipped' && <button className="text-sm text-pink-600 hover:underline">Track Package</button>}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="border border-gray-200 rounded-md bg-white">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="font-medium text-gray-700">Your Addresses</h2>
                  <button onClick={() => { setEditingAddress(null); setAddressForm({ fullName: '', mobile: '', pincode: '', addressLine1: '', addressLine2: '', city: '', state: '', isDefault: false }); setShowAddressModal(true); }} className="text-pink-600 text-sm hover:underline">Add Address</button>
                </div>
                {addresses.length === 0 ? (<div className="p-8 text-center"><p className="text-gray-500">No addresses saved</p></div>) : (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                      <div key={addr.id} className="border border-gray-200 rounded-md p-4">
                        {addr.isDefault && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mb-2 inline-block">Default</span>}
                        <p className="font-medium">{addr.fullName}</p>
                        <p className="text-sm text-gray-600 mt-1">{addr.addressLine1}</p>
                        {addr.addressLine2 && <p className="text-sm text-gray-600">{addr.addressLine2}</p>}
                        <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="text-sm text-gray-500 mt-1">Mobile: {addr.mobile}</p>
                        <div className="flex gap-4 mt-3"><button onClick={() => { setEditingAddress(addr); setAddressForm(addr); setShowAddressModal(true); }} className="text-sm text-pink-600 hover:underline">Edit</button><button onClick={() => deleteAddress(addr.id)} className="text-sm text-red-600 hover:underline">Delete</button>{!addr.isDefault && <button onClick={() => setDefaultAddress(addr.id)} className="text-sm text-gray-600 hover:underline">Set as Default</button>}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="border border-gray-200 rounded-md bg-white">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200"><h2 className="font-medium text-gray-700">Login & Security</h2></div>
                <div className="divide-y divide-gray-100">
                  <div className="p-4 flex justify-between items-center"><div><p className="text-sm text-gray-500">Name</p><p className="font-medium">{userData.name}</p></div>{showNameEdit ? (<div className="flex gap-2"><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="border rounded px-2 py-1 text-sm" /><button onClick={handleNameUpdate} className="text-green-600 text-sm">Save</button><button onClick={() => setShowNameEdit(false)} className="text-gray-500 text-sm">Cancel</button></div>) : (<button onClick={() => setShowNameEdit(true)} className="text-pink-600 text-sm hover:underline">Edit</button>)}</div>
                  <div className="p-4 flex justify-between items-center"><div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{userData.email}</p>{!userData.emailVerified && <p className="text-xs text-yellow-600 mt-1">Not verified</p>}</div><div className="flex gap-3">{!userData.emailVerified && <button onClick={sendVerificationEmail} className="text-blue-600 text-sm hover:underline">Verify</button>}{showEmailEdit ? (<div className="flex gap-2"><input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="border rounded px-2 py-1 text-sm" /><button onClick={handleEmailUpdate} className="text-green-600 text-sm">Save</button><button onClick={() => setShowEmailEdit(false)} className="text-gray-500 text-sm">Cancel</button></div>) : (<button onClick={() => setShowEmailEdit(true)} className="text-pink-600 text-sm hover:underline">Edit</button>)}</div></div>
                  <div className="p-4 flex justify-between items-center"><div><p className="text-sm text-gray-500">Mobile Number</p><p className="font-medium">{userData.mobile || 'Not added'}</p>{userData.mobile && !userData.mobileVerified && <p className="text-xs text-yellow-600 mt-1">Not verified</p>}</div><div className="flex gap-3">{userData.mobile && !userData.mobileVerified && <button onClick={sendMobileVerification} className="text-blue-600 text-sm hover:underline">Verify</button>}{showMobileEdit ? (<div className="flex gap-2"><input type="tel" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} placeholder="10-digit mobile" className="border rounded px-2 py-1 text-sm" /><button onClick={handleMobileUpdate} className="text-green-600 text-sm">Save</button><button onClick={() => setShowMobileEdit(false)} className="text-gray-500 text-sm">Cancel</button></div>) : (<button onClick={() => setShowMobileEdit(true)} className="text-pink-600 text-sm hover:underline">Add/Update</button>)}</div></div>
                  <div className="p-4 flex justify-between items-center"><div><p className="text-sm text-gray-500">Password</p><p className="font-medium">••••••••</p></div>{showPasswordEdit ? (<div className="flex flex-col gap-2 items-end"><input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="border rounded px-2 py-1 text-sm w-48" /><input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="border rounded px-2 py-1 text-sm w-48" /><input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="border rounded px-2 py-1 text-sm w-48" /><div className="flex gap-2"><button onClick={handlePasswordUpdate} className="text-green-600 text-sm">Save</button><button onClick={() => setShowPasswordEdit(false)} className="text-gray-500 text-sm">Cancel</button></div></div>) : (<button onClick={() => setShowPasswordEdit(true)} className="text-pink-600 text-sm hover:underline">Change</button>)}</div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="border border-gray-200 rounded-md bg-white">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200"><h2 className="font-medium text-gray-700">Payment Methods</h2></div>
                <div className="p-8 text-center"><p className="text-gray-500">No saved payment methods</p><button className="mt-2 text-pink-600 text-sm hover:underline">Add a payment method</button></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddressModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-4 flex justify-between items-center sticky top-0 bg-white"><h3 className="text-lg font-medium">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3><button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button></div>
            <form onSubmit={handleAddressSubmit} className="p-5 space-y-3">
              <input type="text" placeholder="Full Name" value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500" required />
              <input type="tel" placeholder="Mobile Number" value={addressForm.mobile} onChange={(e) => setAddressForm({ ...addressForm, mobile: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" required />
              <input type="text" placeholder="Pincode" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" required />
              <input type="text" placeholder="Address Line 1" value={addressForm.addressLine1} onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" required />
              <input type="text" placeholder="Address Line 2 (Optional)" value={addressForm.addressLine2} onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" />
              <div className="grid grid-cols-2 gap-3"><input type="text" placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" required /><input type="text" placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" required /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} /><span className="text-sm text-gray-600">Make this my default address</span></label>
              <button type="submit" className="w-full bg-pink-600 text-white py-2 rounded font-medium hover:bg-pink-700 transition mt-2">{editingAddress ? 'Update Address' : 'Add Address'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
