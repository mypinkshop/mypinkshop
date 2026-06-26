import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function VendorBrandApplication() {
  const [formData, setFormData] = useState({
    brandName: '',
    trademarkNumber: '',
    trademarkOffice: 'india',
    brandLogo: null,
    brandCertificate: null,
    brandWebsite: '',
    productCategories: [],
    manufacturingCountries: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [certificatePreview, setCertificatePreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);
  const [vendorInfo, setVendorInfo] = useState(null);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  const categories = ['Skincare', 'Makeup', 'Clothing', 'Accessories', 'Jewelry', 'Footwear', 'Hair', 'Fragrance'];
  const countries = ['India', 'USA', 'UK', 'China', 'Vietnam', 'Italy', 'France', 'Japan', 'Other'];

  // ✅ Check if vendor is logged in
  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendor');
    
    if (!token || !vendorData) {
      navigate('/vendor/login');
      return;
    }

    try {
      const vendor = JSON.parse(vendorData);
      setVendorInfo(vendor);
      
      // Auto-fill brand name from vendor profile
      if (vendor.brandName) {
        setFormData(prev => ({
          ...prev,
          brandName: vendor.brandName
        }));
      }
    } catch (err) {
      console.error('Error loading vendor data:', err);
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (field === 'logo') {
        setLogoPreview(reader.result);
        setLogoFile(file);
        setFormData({ ...formData, brandLogo: reader.result });
      } else {
        setCertificatePreview(reader.result);
        setCertificateFile(file);
        setFormData({ ...formData, brandCertificate: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMultiSelect = (e, field) => {
    const value = e.target.value;
    const current = formData[field];
    if (current.includes(value)) {
      setFormData({ ...formData, [field]: current.filter(v => v !== value) });
    } else {
      setFormData({ ...formData, [field]: [...current, value] });
    }
  };

  // ✅ Submit brand application to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.trademarkNumber) {
      setError('⚠️ Please enter trademark number');
      return;
    }
    if (!formData.brandName) {
      setError('⚠️ Please enter brand name');
      return;
    }
    if (!certificateFile && !formData.brandCertificate) {
      setError('⚠️ Please upload trademark certificate');
      return;
    }
    if (formData.productCategories.length === 0) {
      setError('⚠️ Please select at least one product category');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('vendorToken');
    const vendorData = JSON.parse(localStorage.getItem('vendor') || '{}');

    try {
      // First upload certificate if exists
      let certificateUrl = formData.brandCertificate;
      
      if (certificateFile) {
        const certFormData = new FormData();
        certFormData.append('images', certificateFile);
        
        const uploadRes = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: certFormData
        });
        
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          certificateUrl = uploadData.url;
        }
      }

      // Submit brand application
      const applicationData = {
        brandName: formData.brandName,
        trademarkNumber: formData.trademarkNumber,
        trademarkOffice: formData.trademarkOffice,
        brandWebsite: formData.brandWebsite || '',
        productCategories: formData.productCategories,
        manufacturingCountries: formData.manufacturingCountries,
        brandCertificate: certificateUrl || '',
        brandLogo: formData.brandLogo || '',
        vendorId: vendorData._id || vendorData.id,
        vendorEmail: vendorData.email,
        vendorName: vendorData.brandName || vendorData.name,
        status: 'pending'
      };

      const res = await fetch(`${API_URL}/api/vendor/brand-application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(applicationData)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('✅ Brand application submitted successfully! Admin will review and approve.');
        setFormData({
          brandName: vendorData.brandName || '',
          trademarkNumber: '',
          trademarkOffice: 'india',
          brandLogo: null,
          brandCertificate: null,
          brandWebsite: '',
          productCategories: [],
          manufacturingCountries: [],
        });
        setLogoPreview(null);
        setCertificatePreview(null);
        setLogoFile(null);
        setCertificateFile(null);

        setTimeout(() => {
          navigate('/vendor/dashboard');
        }, 3000);
      } else {
        setError(data.message || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Error submitting brand application:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-3 shadow-lg">
            ®️
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Brand Registry Application</h1>
          <p className="text-gray-500 text-sm">Submit your trademark details for brand approval</p>
          
          {vendorInfo && (
            <div className="mt-2 inline-block bg-green-50 px-4 py-1 rounded-full">
              <p className="text-xs text-green-600">👤 Applying as: <strong>{vendorInfo.brandName || vendorInfo.name}</strong></p>
            </div>
          )}
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
              <input 
                type="text" 
                name="brandName" 
                value={formData.brandName} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trademark Number *</label>
              <input 
                type="text" 
                name="trademarkNumber" 
                value={formData.trademarkNumber} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200" 
                required 
                placeholder="e.g., 4123456" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trademark Office</label>
              <select 
                name="trademarkOffice" 
                value={formData.trademarkOffice} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
              >
                <option value="india">India (IP India)</option>
                <option value="usa">USA (USPTO)</option>
                <option value="uk">UK (UKIPO)</option>
                <option value="eu">EU (EUIPO)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Website</label>
              <input 
                type="url" 
                name="brandWebsite" 
                value={formData.brandWebsite} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500" 
                placeholder="https://example.com" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Categories *</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleMultiSelect({ target: { value: cat } }, 'productCategories')}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    formData.productCategories.includes(cat) 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturing Countries</label>
            <div className="flex flex-wrap gap-2">
              {countries.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleMultiSelect({ target: { value: c } }, 'manufacturingCountries')}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    formData.manufacturingCountries.includes(c) 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Logo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-pink-400 transition">
                {logoPreview ? (
                  <div className="relative">
                    <img src={logoPreview} alt="Logo" className="w-24 h-24 mx-auto object-contain" />
                    <button 
                      type="button"
                      onClick={() => { setLogoPreview(null); setLogoFile(null); setFormData({...formData, brandLogo: null}); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">No logo uploaded</div>
                )}
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="hidden" id="logoUpload" />
                <label htmlFor="logoUpload" className="inline-block mt-2 text-pink-600 text-sm cursor-pointer hover:text-pink-700">
                  📸 Upload Logo
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trademark Certificate *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-pink-400 transition">
                {certificatePreview ? (
                  <div className="text-green-600">
                    <span className="text-2xl">✅</span>
                    <p className="text-sm mt-1">Certificate uploaded</p>
                    <button 
                      type="button"
                      onClick={() => { setCertificatePreview(null); setCertificateFile(null); setFormData({...formData, brandCertificate: null}); }}
                      className="text-red-500 text-xs hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">Upload PDF or Image</div>
                )}
                <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'certificate')} className="hidden" id="certUpload" />
                <label htmlFor="certUpload" className="inline-block mt-2 text-pink-600 text-sm cursor-pointer hover:text-pink-700">
                  📄 Upload Certificate
                </label>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 font-medium">ℹ️ Brand Registry Information</p>
            <p className="text-xs text-yellow-600 mt-1">
              Your brand will be verified by our team. Approval may take 3-5 business days. 
              A registered trademark is required for brand approval.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2.5 rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? '⏳ Submitting...' : '📤 Submit Brand Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default VendorBrandApplication;
