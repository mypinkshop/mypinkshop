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
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessPincode: '',
    phoneNumber: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if business details already filled
    const detailsFilled = localStorage.getItem('vendorBusinessDetails');
    const vendor = JSON.parse(localStorage.getItem('vendor') || '{}');
    
    if (detailsFilled) {
      // Already filled, go to dashboard
      navigate('/vendor/dashboard');
      return;
    }
    
    // Pre-fill email and phone from vendor data
    if (vendor.email) {
      setFormData(prev => ({ ...prev, email: vendor.email }));
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Save business details
    localStorage.setItem('vendorBusinessDetails', JSON.stringify(formData));
    localStorage.setItem('vendorDetailsFilled', 'true');
    
    setTimeout(() => {
      setLoading(false);
      navigate('/vendor/dashboard');
    }, 500);
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Information */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number *</label>
                  <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Bank Account Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name *</label>
                  <input type="text" name="bankAccountName" value={formData.bankAccountName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                  <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code *</label>
                  <input type="text" name="bankIfsc" value={formData.bankIfsc} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Business Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <textarea name="businessAddress" rows="2" value={formData.businessAddress} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input type="text" name="businessCity" value={formData.businessCity} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input type="text" name="businessState" value={formData.businessState} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                  <input type="text" name="businessPincode" value={formData.businessPincode} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
              {loading ? 'Saving...' : 'Submit & Continue →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VendorBusinessDetails;
