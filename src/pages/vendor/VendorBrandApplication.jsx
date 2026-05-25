import { useState } from 'react';
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
  const [logoPreview, setLogoPreview] = useState(null);
  const [certificatePreview, setCertificatePreview] = useState(null);
  const navigate = useNavigate();

  const categories = ['Skincare', 'Makeup', 'Clothing', 'Accessories', 'Jewelry', 'Footwear'];
  const countries = ['India', 'USA', 'UK', 'China', 'Vietnam', 'Other'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'logo') {
          setLogoPreview(reader.result);
          setFormData({ ...formData, brandLogo: reader.result });
        } else {
          setCertificatePreview(reader.result);
          setFormData({ ...formData, brandCertificate: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.trademarkNumber || !formData.brandName) {
      alert('Please fill trademark number and brand name');
      return;
    }
    if (!formData.brandCertificate) {
      alert('Please upload trademark certificate');
      return;
    }

    setLoading(true);
    
    const tempVendor = JSON.parse(localStorage.getItem('tempVendor') || '{}');
    const pendingBrands = JSON.parse(localStorage.getItem('pendingBrandApplications') || '[]');
    
    const brandApplication = {
      id: Date.now(),
      vendorId: tempVendor.id,
      vendorEmail: tempVendor.email,
      vendorName: tempVendor.brandName,
      ...formData,
      status: 'pending',
      submittedDate: new Date().toISOString().split('T')[0],
      adminRemarks: '',
    };
    
    pendingBrands.push(brandApplication);
    localStorage.setItem('pendingBrandApplications', JSON.stringify(pendingBrands));
    localStorage.setItem('tempVendorBrand', JSON.stringify(brandApplication));
    
    setTimeout(() => {
      setLoading(false);
      alert('Brand application submitted! Admin will review and approve.');
      navigate('/vendor/login');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-3">®️</div>
          <h1 className="text-2xl font-bold">Brand Registry Application</h1>
          <p className="text-gray-500 text-sm">Submit your trademark details for brand approval</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Brand Name *</label>
              <input type="text" name="brandName" value={formData.brandName} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trademark Number *</label>
              <input type="text" name="trademarkNumber" value={formData.trademarkNumber} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required placeholder="e.g., 4123456" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trademark Office</label>
              <select name="trademarkOffice" value={formData.trademarkOffice} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                <option value="india">India (IP India)</option>
                <option value="usa">USA (USPTO)</option>
                <option value="uk">UK (UKIPO)</option>
                <option value="eu">EU (EUIPO)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Brand Website</label>
              <input type="url" name="brandWebsite" value={formData.brandWebsite} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="https://example.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Product Categories *</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleMultiSelect({ target: { value: cat } }, 'productCategories')}
                  className={`px-3 py-1 rounded-full text-sm ${formData.productCategories.includes(cat) ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Manufacturing Countries</label>
            <div className="flex flex-wrap gap-2">
              {countries.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleMultiSelect({ target: { value: c } }, 'manufacturingCountries')}
                  className={`px-3 py-1 rounded-full text-sm ${formData.manufacturingCountries.includes(c) ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Brand Logo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-24 h-24 mx-auto object-contain" />
                ) : (
                  <div className="text-gray-400">No logo uploaded</div>
                )}
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="hidden" id="logoUpload" />
                <label htmlFor="logoUpload" className="inline-block mt-2 text-pink-600 text-sm cursor-pointer">Upload Logo</label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trademark Certificate *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {certificatePreview ? (
                  <div className="text-green-600">✓ Certificate uploaded</div>
                ) : (
                  <div className="text-gray-400">Upload PDF or Image</div>
                )}
                <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'certificate')} className="hidden" id="certUpload" />
                <label htmlFor="certUpload" className="inline-block mt-2 text-pink-600 text-sm cursor-pointer">Upload Certificate</label>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 font-medium">ℹ️ Brand Registry Information</p>
            <p className="text-xs text-yellow-600 mt-1">Your brand will be verified by Amazon. Approval may take 3-5 business days. A registered trademark is required for brand approval.</p>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-pink-600 text-white py-2 rounded-lg font-medium">
            {loading ? 'Submitting...' : 'Submit Brand Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default VendorBrandApplication;
