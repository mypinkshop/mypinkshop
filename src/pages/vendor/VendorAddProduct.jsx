import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

// 🔥 AMAZON IMPORTER COMPONENT (Vendor ke liye)
const AmazonImporter = ({ onProductImported, setFormData, setImages, setVariations }) => {
  const [urls, setUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [importedProducts, setImportedProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const API_URL = 'https://api.mypinkshop.com';
  const token = localStorage.getItem('vendorToken');

  const addUrlField = () => {
    if (urls.length < 20) {
      setUrls([...urls, '']);
    } else {
      alert('Maximum 20 URLs allowed');
    }
  };

  const removeUrlField = (index) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
  };

  const updateUrl = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const fetchAllProducts = async () => {
    const validUrls = urls.filter(url => url.trim());
    if (validUrls.length === 0) {
      alert('Please enter at least one Amazon URL');
      return;
    }

    setLoading(true);
    const results = [];

    for (let i = 0; i < validUrls.length; i++) {
      const url = validUrls[i];
      try {
        const response = await fetch(`${API_URL}/api/import/amazon`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ url })
        });

        const data = await response.json();
        if (data.success) {
          results.push({ ...data.scraped, originalUrl: url });
        } else {
          results.push({ error: data.error, originalUrl: url });
        }
      } catch (error) {
        results.push({ error: error.message, originalUrl: url });
      }
    }

    setImportedProducts(results);
    setLoading(false);
  };

  const importToForm = (product) => {
    setFormData(prev => ({
      ...prev,
      productName: product.name,
      brand: product.brand || prev.brand,
      sellingPrice: product.price,
      mrp: product.originalPrice || product.price * 1.2,
      fullDescription: product.description,
      keyFeatures: product.keyFeatures || []
    }));
    
    if (product.images && product.images.length > 0) {
      setImages(product.images);
    }
    
    alert(`✅ "${product.name}" imported to form!`);
    if (onProductImported) onProductImported();
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-6 mb-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-3xl">📦</span> Import from Amazon
        <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full ml-2">Vendor Feature</span>
      </h3>
      <p className="text-sm text-gray-600 mb-4">Paste Amazon product URLs to automatically fetch product details</p>
      
      <div className="space-y-3 mb-4">
        {urls.map((url, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              placeholder="https://www.amazon.in/dp/XXXXXXXXXX"
              value={url}
              onChange={(e) => updateUrl(idx, e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 bg-white"
            />
            {urls.length > 1 && (
              <button onClick={() => removeUrlField(idx)} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex gap-3 mb-4">
        <button onClick={addUrlField} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium flex items-center gap-1">
          ➕ Add Another URL ({urls.length}/20)
        </button>
        <button onClick={fetchAllProducts} disabled={loading} className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2">
          {loading ? '⏳ Fetching...' : '🔍 Fetch All Products'}
        </button>
      </div>
      
      {importedProducts.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="font-semibold text-gray-700 mb-3">📋 Fetched Products ({importedProducts.length})</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {importedProducts.map((product, idx) => (
              <div key={idx} className={`p-3 rounded-lg flex justify-between items-center ${product.error ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-200 hover:shadow-md transition'}`}>
                <div className="flex-1">
                  {product.error ? (
                    <>
                      <p className="text-sm text-red-600 font-medium">❌ Failed: {product.originalUrl}</p>
                      <p className="text-xs text-red-400">{product.error}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-gray-800 text-sm">{product.name.substring(0, 60)}...</p>
                      <p className="text-xs text-gray-500">₹{product.price} | {product.brand || 'No brand'}</p>
                    </>
                  )}
                </div>
                {!product.error && (
                  <button onClick={() => importToForm(product)} className="ml-3 px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:shadow-md transition whitespace-nowrap">
                    📥 Import
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-600">💡 Tip: You can paste up to 20 Amazon URLs at once. Products will be fetched and you can import them one by one.</p>
      </div>
    </div>
  );
};

// 🔥 VENDOR COUPON COMPONENT
const VendorCouponManager = ({ vendorId, vendorName }) => {
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 0,
    maxDiscount: 0,
    usageLimit: 100,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });
  const [loading, setLoading] = useState(false);

  const API_URL = 'https://api.mypinkshop.com';
  const token = localStorage.getItem('vendorToken');

  const loadCoupons = async () => {
    try {
      const response = await fetch(`${API_URL}/api/coupons/vendor/${vendorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCoupons(data);
    } catch (error) {
      console.error('Error loading coupons:', error);
    }
  };

  const createCoupon = async () => {
    if (!formData.code.trim()) {
      alert('Please enter coupon code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/coupons/vendor/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          vendorId,
          vendorName,
          code: formData.code.toUpperCase()
        })
      });

      if (response.ok) {
        alert('✅ Coupon created successfully!');
        setShowModal(false);
        setFormData({
          code: '',
          description: '',
          discountType: 'percentage',
          discountValue: 10,
          minOrderValue: 0,
          maxDiscount: 0,
          usageLimit: 100,
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
        });
        loadCoupons();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create coupon');
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const deleteCoupon = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      const response = await fetch(`${API_URL}/api/coupons/vendor/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        loadCoupons();
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-6 mb-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-3xl">🎫</span> Vendor Coupons
            <span className="text-xs bg-amber-200 text-amber-700 px-2 py-1 rounded-full ml-2">Offer your customers</span>
          </h3>
          <p className="text-sm text-gray-600">Create discount coupons for your brand</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:shadow-lg transition flex items-center gap-2">
          ➕ Create Coupon
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-6 bg-white/50 rounded-lg">
          <p className="text-gray-400">No coupons created yet. Click "Create Coupon" to offer discounts to your customers.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-amber-100">
              <tr>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-center">Discount</th>
                <th className="px-4 py-2 text-center">Min Order</th>
                <th className="px-4 py-2 text-center">Used/Total</th>
                <th className="px-4 py-2 text-center">Valid Till</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {coupons.map(coupon => (
                <tr key={coupon._id} className="hover:bg-amber-50/30">
                  <td className="px-4 py-2 font-mono font-bold text-amber-600">{coupon.code}</td>
                  <td className="px-4 py-2 text-gray-600">{coupon.description || '-'}</td>
                  <td className="px-4 py-2 text-center font-medium">
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                  </td>
                  <td className="px-4 py-2 text-center">₹{coupon.minOrderValue}</td>
                  <td className="px-4 py-2 text-center">{coupon.usedCount || 0} / {coupon.usageLimit}</td>
                  <td className="px-4 py-2 text-center text-xs">{coupon.endDate ? new Date(coupon.endDate).toLocaleDateString() : 'No expiry'}</td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => deleteCoupon(coupon._id)} className="text-red-500 hover:text-red-700">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-amber-100 p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">✨ Create Vendor Coupon</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full border border-gray-200 rounded-lg px-4 py-2 uppercase font-mono" placeholder="SUMMER10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2" placeholder="10% off on all products" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select value={formData.discountType} onChange={(e) => setFormData({...formData, discountType: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                  <input type="number" value={formData.discountValue} onChange={(e) => setFormData({...formData, discountValue: parseInt(e.target.value)})} className="w-full border border-gray-200 rounded-lg px-4 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
                  <input type="number" value={formData.minOrderValue} onChange={(e) => setFormData({...formData, minOrderValue: parseInt(e.target.value)})} className="w-full border border-gray-200 rounded-lg px-4 py-2" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                  <input type="number" value={formData.maxDiscount} onChange={(e) => setFormData({...formData, maxDiscount: parseInt(e.target.value)})} className="w-full border border-gray-200 rounded-lg px-4 py-2" placeholder="0 = no limit" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                  <input type="number" value={formData.usageLimit} onChange={(e) => setFormData({...formData, usageLimit: parseInt(e.target.value)})} className="w-full border border-gray-200 rounded-lg px-4 py-2" placeholder="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={createCoupon} disabled={loading} className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function VendorAddProduct() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('manual');
  
  const [formData, setFormData] = useState({
    productName: '',
    brand: '',
    category: '',
    subCategory: '',
    mrp: '',
    sellingPrice: '',
    tax: 5,
    sku: '',
    quantity: '',
    lowStockThreshold: 10,
    hasVariations: false,
    variations: [],
    shortDescription: '',
    fullDescription: '',
    keyFeatures: [],
    specifications: {},
    weight: '',
    dimensions: '',
    shippingCharges: '',
    seoTitle: '',
    seoDescription: '',
  });
  
  const [keyFeature, setKeyFeature] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [variationType, setVariationType] = useState('size');
  const [variationValue, setVariationValue] = useState('');

  const API_URL = 'https://api.mypinkshop.com';
  const vendorData = JSON.parse(localStorage.getItem('vendor') || '{}');
  const vendorId = vendorData._id || vendorData.id;

  const categories = {
    'Skincare': ['Face Wash', 'Serums', 'Moisturizers', 'Toners', 'Sunscreen', 'Masks', 'Eye Cream', 'Cleanser'],
    'Makeup': ['Lipsticks', 'Foundation', 'Kajal', 'Eyeshadow', 'Blush', 'Compact', 'Mascara', 'Highlighter'],
    'Hair': ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Serum', 'Hair Mask', 'Hair Color', 'Styling Products'],
    'Clothing': ['Dresses', 'Tops', 'Jeans', 'Skirts', 'Ethnic Wear', 'Kurtis', 'Sarees', 'Jackets', 'T-Shirts'],
    'Accessories': ['Bags', 'Jewelry', 'Hair Accessories', 'Watches', 'Sunglasses', 'Belts', 'Scarves']
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const uploadImageToBackend = async (file) => {
    const formDataImg = new FormData();
    formDataImg.append('images', file);
    
    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('vendorToken')}` },
      body: formDataImg
    });
    
    if (!response.ok) throw new Error('Image upload failed');
    const data = await response.json();
    return data.url;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      alert('You can upload maximum 5 images');
      return;
    }
    
    setLoading(true);
    const uploadedUrls = [];
    const previews = [];
    
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        alert(`Image ${file.name} is larger than 2MB`);
        continue;
      }
      try {
        const preview = URL.createObjectURL(file);
        previews.push(preview);
        const imageUrl = await uploadImageToBackend(file);
        uploadedUrls.push(imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }
    
    setImages([...images, ...uploadedUrls]);
    setImagePreview([...imagePreview, ...previews]);
    setLoading(false);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreview(imagePreview.filter((_, i) => i !== index));
  };

  const addKeyFeature = () => {
    if (keyFeature.trim()) {
      setFormData({ ...formData, keyFeatures: [...formData.keyFeatures, keyFeature.trim()] });
      setKeyFeature('');
    }
  };

  const removeKeyFeature = (index) => {
    setFormData({ ...formData, keyFeatures: formData.keyFeatures.filter((_, i) => i !== index) });
  };

  const addSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setFormData({
        ...formData,
        specifications: { ...formData.specifications, [specKey.trim()]: specValue.trim() }
      });
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpecification = (key) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[key];
    setFormData({ ...formData, specifications: newSpecs });
  };

  const addVariation = () => {
    if (variationValue.trim()) {
      const newVariation = { type: variationType, value: variationValue.trim(), price: '', stock: '' };
      setFormData({ ...formData, variations: [...formData.variations, newVariation] });
      setVariationValue('');
    }
  };

  const removeVariation = (index) => {
    setFormData({ ...formData, variations: formData.variations.filter((_, i) => i !== index) });
  };

  const submitProduct = async () => {
    if (!formData.productName || !formData.sellingPrice || !formData.quantity) {
      alert('Please fill all required fields');
      return;
    }
    
    setLoading(true);
    
    const productData = {
      name: formData.productName,
      brand: formData.brand || vendorData.brandName,
      vendorName: vendorData.brandName || vendorData.name,
      vendorId: vendorId,
      category: formData.subCategory || formData.category,
      mainCategory: formData.category,
      price: parseFloat(formData.sellingPrice),
      originalPrice: parseFloat(formData.mrp) || parseFloat(formData.sellingPrice) * 1.2,
      stock: parseInt(formData.quantity),
      sku: formData.sku || `SKU-${Date.now()}`,
      images: images,
      shortDescription: formData.shortDescription,
      description: formData.fullDescription,
      keyFeatures: formData.keyFeatures,
      specifications: formData.specifications,
      variations: formData.variations,
      weight: formData.weight,
      dimensions: formData.dimensions,
      shippingCharges: parseFloat(formData.shippingCharges) || 0,
      seoTitle: formData.seoTitle,
      seoDescription: formData.seoDescription,
      status: 'active',
      adminApproved: false,
      isNew: true,
      rating: 0
    };
    
    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('vendorToken')}`
        },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) throw new Error('Failed to add product');
      
      alert('✓ Product submitted for admin approval!');
      navigate('/vendor/products');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      <VendorSidebar activeTab="add-product" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-6xl mx-auto">
          {/* 🔥 TABS - Manual vs Import */}
          <div className="mb-6">
            <div className="flex gap-3 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('manual')}
                className={`px-6 py-3 text-base font-medium rounded-t-lg transition-all ${
                  activeTab === 'manual' 
                    ? 'bg-pink-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ✏️ Manual Entry
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`px-6 py-3 text-base font-medium rounded-t-lg transition-all ${
                  activeTab === 'import' 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📦 Import from Amazon
              </button>
            </div>
          </div>

          {/* 🔥 AMAZON IMPORTER */}
          {activeTab === 'import' && (
            <AmazonImporter 
              onProductImported={() => setActiveTab('manual')} 
              setFormData={setFormData}
              setImages={setImages}
              setVariations={() => {}}
            />
          )}

          {/* 🔥 VENDOR COUPON MANAGER */}
          {vendorId && (
            <VendorCouponManager vendorId={vendorId} vendorName={vendorData.brandName || vendorData.name} />
          )}

          {/* MANUAL ENTRY FORM */}
          {activeTab === 'manual' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                <h1 className="text-xl font-semibold text-gray-800">Add New Product</h1>
                <p className="text-sm text-gray-500">List your product on MyPinkShop</p>
              </div>
              
              <div className="flex border-b border-gray-200 bg-white px-6 py-3 overflow-x-auto">
                {['Basic', 'Images', 'Pricing', 'Stock', 'Variations', 'Description', 'Shipping', 'SEO'].map((label, idx) => (
                  <div key={idx} className="flex items-center flex-shrink-0">
                    <button onClick={() => setStep(idx + 1)} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition ${step === idx + 1 ? 'bg-pink-600 text-white' : step > idx + 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{idx + 1}</button>
                    <span className={`text-xs ml-1 mr-3 ${step === idx + 1 ? 'text-pink-600 font-medium' : 'text-gray-500'}`}>{label}</span>
                    {idx < 7 && <div className="w-6 h-px bg-gray-300 mr-3"></div>}
                  </div>
                ))}
              </div>
              
              <div className="p-6">
                {/* Step 1 - Basic Information */}
                {step === 1 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label><input type="text" name="productName" value={formData.productName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" required /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label><input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" required /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"><option value="">Select Category</option>{Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label><select name="subCategory" value={formData.subCategory} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={!formData.category}><option value="">Select Sub Category</option>{formData.category && categories[formData.category]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}</select></div>
                    </div>
                    <div className="flex justify-end pt-4"><button onClick={() => setStep(2)} className="bg-pink-600 text-white px-5 py-2 rounded-lg hover:bg-pink-700 transition">Continue →</button></div>
                  </div>
                )}
                
                {/* Step 2 - Images */}
                {step === 2 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold">Product Images</h2>
                    <div className="border-2 border-dashed border-pink-200 rounded-lg p-6 text-center bg-pink-50/30">
                      <div className="flex flex-wrap gap-3 mb-4">{imagePreview.map((img, idx) => (<div key={idx} className="relative w-24 h-24 bg-white rounded-lg overflow-hidden shadow-md"><img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" /><button onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600">✕</button></div>))}</div>
                      <button type="button" onClick={() => fileInputRef.current.click()} disabled={loading} className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50">{loading ? 'Uploading...' : '📸 Upload Images'}</button>
                      <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <p className="text-xs text-gray-400 mt-2">Upload up to 5 images. Max 2MB each. First image will be the main product image.</p>
                    </div>
                    <div className="flex justify-between pt-4"><button onClick={() => setStep(1)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">← Back</button><button onClick={() => setStep(3)} className="bg-pink-600 text-white px-5 py-2 rounded-lg hover:bg-pink-700 transition">Continue →</button></div>
                  </div>
                )}
                
                {/* Step 3 - Pricing */}
                {step === 3 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold">Pricing</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">MRP</label><input type="number" name="mrp" value={formData.mrp} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label><input type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" required /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Tax (GST) %</label><input type="number" name="tax" value={formData.tax} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                    </div>
                    <div className="flex justify-between pt-4"><button onClick={() => setStep(2)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">← Back</button><button onClick={() => setStep(4)} className="bg-pink-600 text-white px-5 py-2 rounded-lg hover:bg-pink-700">Continue →</button></div>
                  </div>
                )}
                
                {/* Step 4 - Stock */}
                {step === 4 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold">Inventory</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">SKU</label><input type="text" name="sku" value={formData.sku} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Auto-generated if empty" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity / Stock *</label><input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" required /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label><input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                    </div>
                    <div className="flex justify-between pt-4"><button onClick={() => setStep(3)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">← Back</button><button onClick={() => setStep(5)} className="bg-pink-600 text-white px-5 py-2 rounded-lg hover:bg-pink-700">Continue →</button></div>
                  </div>
                )}
                
                {/* Step 5 - Variations */}
                {step === 5 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold">Product Variations</h2>
                    <div className="flex items-center gap-3 mb-4"><input type="checkbox" checked={formData.hasVariations} onChange={(e) => setFormData({ ...formData, hasVariations: e.target.checked })} className="w-4 h-4 text-pink-600 rounded" /><label>This product has variations (Size, Color, etc.)</label></div>
                    {formData.hasVariations && (<div className="border rounded-lg p-4 space-y-4 bg-gray-50"><div className="flex gap-3"><select value={variationType} onChange={(e) => setVariationType(e.target.value)} className="px-3 py-2 border rounded-lg"><option value="size">Size</option><option value="color">Color</option><option value="weight">Weight</option></select><input type="text" placeholder="Value (e.g., S, M, L)" value={variationValue} onChange={(e) => setVariationValue(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" /><button onClick={addVariation} className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition">Add</button></div><div className="flex flex-wrap gap-2">{formData.variations.map((v, idx) => (<span key={idx} className="inline-flex items-center gap-1 bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-sm">{v.type}: {v.value}<button onClick={() => removeVariation(idx)} className="text-red-500 ml-1 hover:text-red-700">✕</button></span>))}</div></div>)}
                    <div className="flex justify-between pt-4"><button onClick={() => setStep(4)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">← Back</button><button onClick={() => setStep(6)} className="bg-pink-600 text-white px-5 py-2 rounded-lg hover:bg-pink-700">Continue →</button></div>
                  </div>
                )}
                
                {/* Step 6 - Description */}
                {step === 6 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold">Product Description</h2>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label><textarea name="fullDescription" rows="5" value={formData.fullDescription} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"></textarea></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Key Features</label><div className="flex flex-wrap gap-2 mb-2">{formData.keyFeatures.map((f, idx) => (<span key={idx} className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm">✓ {f}<button onClick={() => removeKeyFeature(idx)} className="text-red-500 ml-1">✕</button></span>))}</div><div className="flex gap-2"><input type="text" value={keyFeature} onChange={(e) => setKeyFeature(e.target.value)} placeholder="e.g., Dermatologically tested" className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500" /><button onClick={addKeyFeature} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Add</button></div></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label><div className="space-y-2 mb-2">{Object.entries(formData.specifications).map(([key, value]) => (<div key={key} className="flex gap-2"><span className="w-1/3 px-3 py-1 bg-gray-50 rounded text-sm">{key}</span><span className="flex-1 px-3 py-1 bg-gray-50 rounded text-sm">{value}</span><button onClick={() => removeSpecification(key)} className="text-red-500 hover:text-red-700">✕</button></div>))}</div><div className="flex gap-2"><input type="text" placeholder="Key (e.g., Material)" value={specKey} onChange={(e) => setSpecKey(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500" /><input type="text" placeholder="Value (e.g., Plastic)" value={specValue} onChange={(e) => setSpecValue(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500" /><button onClick={addSpecification} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Add</button></div></div>
                    <div className="flex justify-between pt-4"><button onClick={() => setStep(5)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">← Back</button><button onClick={() => setStep(7)} className="bg-pink-600 text-white px-5 py-2 rounded-lg hover:bg-pink-700">Continue →</button></div>
                  </div>
                )}
                
                {/* Step 7 - Shipping */}
                {step === 7 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold">Shipping Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label><input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (L x W x H cm)</label><input type="text" name="dimensions" value={formData.dimensions} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="20 x 10 x 5" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Shipping Charges</label><input type="number" name="shippingCharges" value={formData.shippingCharges} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="0 for free shipping" /></div>
                    </div>
                    <div className="flex justify-between pt-4"><button onClick={() => setStep(6)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">← Back</button><button onClick={() => setStep(8)} className="bg-pink-600 text-white px-5 py-2 rounded-lg hover:bg-pink-700">Continue →</button></div>
                  </div>
                )}
                
                {/* Step 8 - SEO */}
                {step === 8 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold">Search Engine Optimization</h2>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label><input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label><textarea name="seoDescription" rows="2" value={formData.seoDescription} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                    <div className="flex justify-between pt-4"><button onClick={() => setStep(7)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">← Back</button><button onClick={submitProduct} disabled={loading} className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold">{loading ? 'Submitting...' : '✓ Submit for Approval'}</button></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default VendorAddProduct;
