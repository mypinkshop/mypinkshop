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
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [newName, setNewName] = useState('');
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
      setOrders(JSON.parse(savedOrders));
    } else {
      setOrders([
        { id: '#MPS-1001', date: '2025-05-15', total: 2598, status: 'Delivered', items: 2 },
        { id: '#MPS-1002', date: '2025-05-10', total: 1798, status: 'Shipped', items: 1 },
        { id: '#MPS-1003', date: '2025-05-05', total: 899, status: 'Processing', items: 1 },
      ]);
    }
  }, []);

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
      setOrders(orders.map(order => order.id === orderId ? { ...order, status: 'Cancelled' } : order));
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
    <div className="min-h-screen bg-white">
      {/* Amazon Style Header */}
      <header className="border-b border-gray-200 py-3 sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-4">
          <Link to="/" className="text-xl font-bold text-pink-600">MyPinkShop</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-normal text-gray-700 mb-6">Your Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Sidebar - Amazon Style */}
          <div className="md:col-span-1">
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h2 className="font-medium text-gray-700">Account Settings</h2>
              </div>
              <div className="divide-y divide-gray-100">
                <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${activeTab === 'orders' ? 'text-pink-600 font-medium' : 'text-gray-600'}`}>Your Orders</button>
                <button onClick={() => setActiveTab('addresses')} className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${activeTab === 'addresses' ? 'text-pink-600 font-medium' : 'text-gray-600'}`}>Your Addresses</button>
                <button onClick={() => setActiveTab('security')} className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${activeTab === 'security' ? 'text-pink-600 font-medium' : 'text-gray-600'}`}>Login & Security</button>
                <button onClick={() => setActiveTab('payments')} className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${activeTab === 'payments' ? 'text-pink-600 font-medium' : 'text-gray-600'}`}>Payment Methods</button>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="md:col-span-2">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="border border-gray-200 rounded-md">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h2 className="font-medium text-gray-700">Your Orders</h2>
                </div>
                {orders.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No orders yet</p>
                    <Link to="/shop" className="text-pink-600 hover:underline text-sm mt-2 inline-block">Start Shopping</Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {orders.map(order => (
                      <div key={order.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-800">{order.id}</p>
                            <p className="text-sm text-gray-500">Ordered on {order.date}</p>
                            <p className="text-sm text-gray-500 mt-1">{order.items} items</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">₹{order.total.toLocaleString()}</p>
                            <p className={`text-sm ${getStatusColor(order.status)}`}>{order.status}</p>
                            {order.status === 'Processing' && (
                              <button onClick={() => cancelOrder(order.id)} className="text-sm text-red-600 hover:underline mt-1">Cancel Order</button>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex gap-3">
                          <button className="text-sm text-pink-600 hover:underline">View Order Details</button>
                          {order.status === 'Shipped' && <button className="text-sm text-pink-600 hover:underline">Track Package</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="border border-gray-200 rounded-md">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="font-medium text-gray-700">Your Addresses</h2>
                  <button onClick={() => { setEditingAddress(null); setAddressForm({ fullName: '', mobile: '', pincode: '', addressLine1: '', addressLine2: '', city: '', state: '', isDefault: false }); setShowAddressModal(true); }} className="text-pink-600 text-sm hover:underline">Add Address</button>
                </div>
                {addresses.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No addresses saved</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {addresses.map(addr => (
                      <div key={addr.id} className="border border-gray-200 rounded-md p-4">
                        {addr.isDefault && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mb-2 inline-block">Default</span>}
                        <p className="font-medium">{addr.fullName}</p>
                        <p className="text-sm text-gray-600 mt-1">{addr.addressLine1}</p>
                        {addr.addressLine2 && <p className="text-sm text-gray-600">{addr.addressLine2}</p>}
                        <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="text-sm text-gray-500 mt-1">Mobile: {addr.mobile}</p>
                        <div className="flex gap-4 mt-3">
                          <button onClick={() => { setEditingAddress(addr); setAddressForm(addr); setShowAddressModal(true); }} className="text-sm text-pink-600 hover:underline">Edit</button>
                          <button onClick={() => deleteAddress(addr.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                          {!addr.isDefault && <button onClick={() => setDefaultAddress(addr.id)} className="text-sm text-gray-600 hover:underline">Set as Default</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="border border-gray-200 rounded-md">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h2 className="font-medium text-gray-700">Login & Security</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="p-4 flex justify-between items-center">
                    <div><p className="text-sm text-gray-500">Name</p><p className="font-medium">{userData.name}</p></div>
                    {showNameEdit ? (
                      <div className="flex gap-2"><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="border rounded px-2 py-1 text-sm" /><button onClick={handleNameUpdate} className="text-green-600 text-sm">Save</button><button onClick={() => setShowNameEdit(false)} className="text-gray-500 text-sm">Cancel</button></div>
                    ) : (
                      <button onClick={() => setShowNameEdit(true)} className="text-pink-600 text-sm hover:underline">Edit</button>
                    )}
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{userData.email}</p>{!userData.emailVerified && <p className="text-xs text-yellow-600 mt-1">Not verified</p>}</div>
                    <button className="text-pink-600 text-sm hover:underline">Edit</button>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <div><p className="text-sm text-gray-500">Mobile Number</p><p className="font-medium">{userData.mobile || 'Not added'}</p></div>
                    <button className="text-pink-600 text-sm hover:underline">Add</button>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <div><p className="text-sm text-gray-500">Password</p><p className="font-medium">••••••••</p></div>
                    <button className="text-pink-600 text-sm hover:underline">Change</button>
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="border border-gray-200 rounded-md">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h2 className="font-medium text-gray-700">Payment Methods</h2>
                </div>
                <div className="p-8 text-center">
                  <p className="text-gray-500">No saved payment methods</p>
                  <button className="mt-2 text-pink-600 text-sm hover:underline">Add a payment method</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Modal - Amazon Style */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddressModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-4 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-medium">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleAddressSubmit} className="p-5 space-y-3">
              <input type="text" placeholder="Full Name" value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500" required />
              <input type="tel" placeholder="Mobile Number" value={addressForm.mobile} onChange={(e) => setAddressForm({ ...addressForm, mobile: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500" required />
              <input type="text" placeholder="Pincode" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500" required />
              <input type="text" placeholder="Address Line 1 (House No, Building, Street)" value={addressForm.addressLine1} onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500" required />
              <input type="text" placeholder="Address Line 2 (Optional)" value={addressForm.addressLine2} onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500" required />
                <input type="text" placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500" required />
              </div>
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
