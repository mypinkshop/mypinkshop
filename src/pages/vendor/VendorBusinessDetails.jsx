import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function VendorBusinessDetails() {
  const [formData, setFormData] = useState({
    businessName: '',
    panNumber: '',
    gstNumber: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessPincode: '',
    phoneNumber: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vendorInfo, setVendorInfo] = useState(null);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const vendorData = JSON.parse(localStorage.getItem('vendor') || '{}');
    
    if (!token) {
      navigate('/vendor/login');
      return;
    }

    setVendorInfo(vendorData);
    
    // Check if business details already exist in backend
    fetchBusinessDetails(token);
    
    // Pre-fill email and phone from vendor data
    if (vendorData.email) {
      setFormData(prev => ({ ...prev, email: vendorData.email }));
    }
    if (vendorData.phone) {
      setFormData(prev => ({ ...prev, phoneNumber: vendorData.phone }));
    }
  }, [navigate]);

  // ✅ Fetch existing business details from backend
  const fetchBusinessDetails = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/vendor/business-details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (data.success && data.details) {
        // Business details already exist, go to dashboard
        navigate('/vendor/dashboard');
        return;
      }
    } catch (err) {
      // No details found, stay on page
      console.log('No business details found');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  // ✅ Submit business details to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.businessName) {
      setError('⚠️ Please enter business name');
      return;
    }
    if (!formData.panNumber) {
      setError('⚠️ Please enter PAN number');
      return;
    }
    if (!formData.bankAccountNumber) {
      setError('⚠️ Please enter bank account number');
      return;
    }
    if (!formData.bankIfsc) {
      setError('⚠️ Please enter IFSC code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('vendorToken');
    const vendorData = JSON.parse(localStorage.getItem('vendor') || '{}');

    try {
      const res = await fetch(`${API_URL}/api/vendor/business-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          businessName: formData.businessName,
          panNumber: formData.panNumber,
          gstNumber: formData.gstNumber || '',
          bankDetails: {
            accountHolderName: formData.bankAccountName || formData.businessName,
            accountNumber: formData.bankAccountNumber,
            ifscCode: formData.bankIfsc,
            bankName: formData.bankName || ''
          },
          address: {
            street: formData.businessAddress || '',
            city: formData.businessCity || '',
            state: formData.businessState || '',
            pincode: formData.businessPincode || '',
            country: 'India'
          },
          phone: formData.phoneNumber || vendorData.phone || '',
          email: formData.email || vendorData.email || '',
          vendorId: vendorData._id || vendorData.id,
          vendorName: vendorData.brandName || vendorData.name
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('✅ Business details saved successfully!');
        localStorage.setItem('vendorBusinessDetails', JSON.stringify(formData));
        localStorage.setItem('vendorDetailsFilled', 'true');
        
        setTimeout(() => {
          navigate('/vendor/dashboard');
        }, 1500);
      } else {
        setError(data.message || 'Failed to save business details');
      }
    } catch (err) {
      console.error('Error saving business details:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg">
              📝
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Complete Your Business Details</h1>
            <p className="text-gray-500 mt-2">Please provide your business information to start selling</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
              <span>✅</span> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Information */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input 
                    type="text" 
                    name="businessName" 
                    value={formData.businessName} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number *</label>
                  <input 
                    type="text" 
                    name="panNumber" 
                    value={formData.panNumber} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                    required 
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input 
                    type="text" 
                    name="gstNumber" 
                    value={formData.gstNumber} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                    placeholder="22AAAAA0000A1Z"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input 
                    type="tel" 
                    name="phoneNumber" 
                    value={formData.phoneNumber} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Bank Account Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name *</label>
                  <input 
                    type="text" 
                    name="bankAccountName" 
                    value={formData.bankAccountName} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                  <input 
                    type="text" 
                    name="bankAccountNumber" 
                    value={formData.bankAccountNumber} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code *</label>
                  <input 
                    type="text" 
                    name="bankIfsc" 
                    value={formData.bankIfsc} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input 
                    type="text" 
                    name="bankName" 
                    value={formData.bankName} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                    placeholder="e.g., HDFC Bank, SBI"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Business Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <textarea 
                    name="businessAddress" 
                    rows="2" 
                    value={formData.businessAddress} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input 
                    type="text" 
                    name="businessCity" 
                    value={formData.businessCity} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input 
                    type="text" 
                    name="businessState" 
                    value={formData.businessState} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                  <input 
                    type="text" 
                    name="businessPincode" 
                    value={formData.businessPincode} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                    required 
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? '⏳ Saving...' : '📤 Submit & Continue →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VendorBusinessDetails;
