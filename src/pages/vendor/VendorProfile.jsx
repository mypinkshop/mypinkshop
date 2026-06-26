import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';
import toast from 'react-hot-toast';

function VendorProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeMenu, setActiveMenu] = useState('settings');
  const [vendorInfo, setVendorInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    brandName: '',
    storeName: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    gstNumber: '',
    panNumber: '',
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      accountHolderName: ''
    }
  });

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      navigate('/vendor/login');
      return;
    }
    fetchVendorProfile(token);
  }, [navigate]);

  const fetchVendorProfile = async (token) => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`${API_URL}/api/vendor/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (data.success) {
        const vendor = data.vendor;
        setVendorInfo(vendor);
        setFormData({
          name: vendor.name || '',
          brandName: vendor.brandName || '',
          storeName: vendor.storeName || vendor.brandName || '',
          phone: vendor.phone || '',
          email: vendor.email || '',
          address: {
            street: vendor.address?.street || '',
            city: vendor.address?.city || '',
            state: vendor.address?.state || '',
            pincode: vendor.address?.pincode || '',
            country: vendor.address?.country || 'India'
          },
          gstNumber: vendor.gstNumber || '',
          panNumber: vendor.panNumber || '',
          bankDetails: {
            accountNumber: vendor.bankDetails?.accountNumber || '',
            ifscCode: vendor.bankDetails?.ifscCode || '',
            accountHolderName: vendor.bankDetails?.accountHolderName || ''
          }
        });
      } else {
        setError(data.message || 'Failed to load profile');
        toast.error(data.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      navigate('/vendor/login');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_URL}/api/vendor/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          brandName: formData.brandName,
          storeName: formData.storeName,
          gstNumber: formData.gstNumber,
          panNumber: formData.panNumber,
          bankDetails: formData.bankDetails
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('✅ Profile updated successfully!');
        toast.success('✅ Profile updated successfully!');
        
        const vendor = JSON.parse(localStorage.getItem('vendor') || '{}');
        vendor.name = formData.name;
        vendor.brandName = formData.brandName;
        vendor.phone = formData.phone;
        localStorage.setItem('vendor', JSON.stringify(vendor));
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to update profile');
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      <VendorSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">⚙️ Profile Settings</h1>
            <p className="text-gray-500 text-sm">Manage your vendor profile and business details</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-lg mb-6 flex items-center gap-2">
              <span>✅</span> {success}
            </div>
          )}

          <form onSubmit={updateProfile} className="space-y-6">
            {/* Brand Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">🏷️ Brand Information</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                  <input
                    type="text"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">📍 Business Address</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    placeholder="Building, Street, Area"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    name="address.pincode"
                    value={formData.address.pincode}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  />
                </div>
              </div>
            </div>

            {/* Tax Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">📄 Tax Information</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    placeholder="22AAAAA0000A1Z"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    placeholder="ABCDE1234F"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">🏦 Bank Details</h2>
                <p className="text-xs text-gray-500">For payment settlements</p>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    name="bankDetails.accountHolderName"
                    value={formData.bankDetails.accountHolderName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    placeholder="As per bank account"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    name="bankDetails.accountNumber"
                    value={formData.bankDetails.accountNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    placeholder="Bank account number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    name="bankDetails.ifscCode"
                    value={formData.bankDetails.ifscCode}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    placeholder="IFSC code"
                  />
                </div>
              </div>
            </div>

            {/* ✅ FIXED: Address Display - Alag-alag fields mein, koi object render nahi */}
            {vendorInfo && vendorInfo.address && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-3">📍 Current Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Street:</span>
                    <p className="text-gray-800 font-medium">{vendorInfo.address.street || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">City:</span>
                    <p className="text-gray-800 font-medium">{vendorInfo.address.city || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">State:</span>
                    <p className="text-gray-800 font-medium">{vendorInfo.address.state || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Pincode:</span>
                    <p className="text-gray-800 font-medium">{vendorInfo.address.pincode || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Country:</span>
                    <p className="text-gray-800 font-medium">{vendorInfo.address.country || 'India'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: vendorInfo?.name || '',
                    brandName: vendorInfo?.brandName || '',
                    storeName: vendorInfo?.storeName || vendorInfo?.brandName || '',
                    phone: vendorInfo?.phone || '',
                    email: vendorInfo?.email || '',
                    address: {
                      street: vendorInfo?.address?.street || '',
                      city: vendorInfo?.address?.city || '',
                      state: vendorInfo?.address?.state || '',
                      pincode: vendorInfo?.address?.pincode || '',
                      country: vendorInfo?.address?.country || 'India'
                    },
                    gstNumber: vendorInfo?.gstNumber || '',
                    panNumber: vendorInfo?.panNumber || '',
                    bankDetails: {
                      accountNumber: vendorInfo?.bankDetails?.accountNumber || '',
                      ifscCode: vendorInfo?.bankDetails?.ifscCode || '',
                      accountHolderName: vendorInfo?.bankDetails?.accountHolderName || ''
                    }
                  });
                }}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </form>

          {/* Store ID / Status */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <p className="text-sm text-gray-500">Store ID</p>
                <p className="font-mono text-sm text-gray-800">{vendorInfo?.storeId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Status</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  vendorInfo?.status === 'approved' ? 'bg-green-100 text-green-700' :
                  vendorInfo?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  vendorInfo?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {vendorInfo?.status || 'Pending'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="text-sm text-gray-800">
                  {vendorInfo?.createdAt ? new Date(vendorInfo.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorProfile;
