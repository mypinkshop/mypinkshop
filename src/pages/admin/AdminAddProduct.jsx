import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminAddProduct() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Vital Info
    productName: '',
    brand: '',
    category: '',
    subCategory: '',
    // Images
    images: [],
    // Pricing
    mrp: '',
    sellingPrice: '',
    tax: 5,
    // Inventory
    sku: '',
    quantity: '',
    lowStockThreshold: 10,
    // Variations
    hasVariations: false,
    variations: [],
    // Description
    shortDescription: '',
    fullDescription: '',
    keyFeatures: [],
    // Specifications
    specifications: {},
    // Shipping
    weight: '',
    dimensions: '',
    shippingCharges: '',
    // SEO
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });
  const [keyFeature, setKeyFeature] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = {
    'Skincare': ['Face Wash', 'Serums', 'Moisturizers', 'Toners', 'Sunscreen'],
    'Makeup': ['Lipsticks', 'Foundation', 'Kajal', 'Eyeshadow', 'Blush'],
    'Clothing': ['Dresses', 'Tops', 'Jeans', 'Skirts', 'Ethnic Wear'],
    'Accessories': ['Bags', 'Jewelry', 'Hair Accessories', 'Watches'],
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => URL.createObjectURL(file));
    setFormData({ ...formData, images: [...formData.images, ...newImages] });
  };

  const removeImage = (index) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
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

  const submitProduct = () => {
    // Validate required fields
    if (!formData.productName || !formData.brand || !formData.category || !formData.sellingPrice || !formData.quantity) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);

    // Create product object
    const newProduct = {
      id: Date.now(),
      name: formData.productName,
      brand: formData.brand,
      category: formData.subCategory || formData.category,
      mainCategory: formData.category,
      price: parseFloat(formData.sellingPrice),
      originalPrice: parseFloat(formData.mrp) || parseFloat(formData.sellingPrice) * 1.2,
      tax: parseFloat(formData.tax),
      stock: parseInt(formData.quantity),
      sku: formData.sku || `SKU-${Date.now()}`,
      lowStockThreshold: parseInt(formData.lowStockThreshold),
      images: formData.images,
      shortDescription: formData.shortDescription,
      description: formData.fullDescription,
      keyFeatures: formData.keyFeatures,
      specifications: formData.specifications,
      weight: formData.weight,
      dimensions: formData.dimensions,
      shippingCharges: parseFloat(formData.shippingCharges) || 0,
      seoTitle: formData.seoTitle,
      seoDescription: formData.seoDescription,
      seoKeywords: formData.seoKeywords,
      rating: 0,
      reviewCount: 0,
      status: 'active',
      adminApproved: true,
      isNew: true,
      createdAt: new Date().toISOString(),
      emoji: getEmojiForCategory(formData.category),
    };

    // Save to localStorage
    const existingProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    existingProducts.push(newProduct);
    localStorage.setItem('adminProductsList', JSON.stringify(existingProducts));

    setTimeout(() => {
      setLoading(false);
      alert('✅ Product listed successfully!');
      navigate('/admin/inventory');
    }, 500);
  };

  const getEmojiForCategory = (category) => {
    const emojis = {
      'Skincare': '🧴',
      'Makeup': '💄',
      'Clothing': '👗',
      'Accessories': '👜'
    };
    return emojis[category] || '✨';
  };

  const goToNextStep = () => {
    // Validate current step before proceeding
    if (step === 1 && (!formData.productName || !formData.brand || !formData.category || !formData.subCategory)) {
      alert('Please fill all vital information fields');
      return;
    }
    if (step === 2 && formData.images.length === 0) {
      alert('Please upload at least one product image');
      return;
    }
    if (step === 3 && (!formData.sellingPrice)) {
      alert('Please enter selling price');
      return;
    }
    if (step === 4 && (!formData.quantity)) {
      alert('Please enter stock quantity');
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Add a Product</h1>
            <p className="text-xs text-gray-500 mt-0.5">List a new product on MyPinkShop</p>
          </div>
          <button onClick={() => navigate('/admin/inventory')} className="text-gray-500 hover:text-gray-700 transition">Cancel</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Progress Steps - Responsive */}
        <div className="flex flex-wrap justify-between mb-8 gap-2">
          {[
            { num: 1, label: 'Vital Info' },
            { num: 2, label: 'Images' },
            { num: 3, label: 'Pricing' },
            { num: 4, label: 'Inventory' },
            { num: 5, label: 'Description' },
            { num: 6, label: 'Shipping' },
            { num: 7, label: 'SEO' },
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all ${
                step >= s.num ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'bg-gray-200 text-gray-500'
              }`}>
                {s.num}
              </div>
              <span className={`text-[10px] sm:text-xs mt-1 hidden sm:block ${step >= s.num ? 'text-gray-700' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Vital Info */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-sm">1</span>
              Vital Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                  placeholder="e.g., Glass Skin Serum"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                  placeholder="e.g., Nykaa Beauty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '' })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                >
                  <option value="">Select Category</option>
                  {Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category *</label>
                <select
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                  disabled={!formData.category}
                >
                  <option value="">Select Sub Category</option>
                  {formData.category && categories[formData.category]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={goToNextStep} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Images */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-sm">2</span>
              Product Images
            </h2>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 sm:p-8 text-center bg-gray-50/50">
              <div className="flex flex-wrap gap-3 mb-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-xl overflow-hidden group">
                    <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="imageUpload" />
              <label htmlFor="imageUpload" className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-pink-200 rounded-xl cursor-pointer hover:bg-pink-50 transition text-pink-600 font-medium">
                📸 Upload Images
              </label>
              <p className="text-xs text-gray-400 mt-3">Upload up to 5 images. First image will be the main product image.</p>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">Back</button>
              <button onClick={goToNextStep} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-sm">3</span>
              Pricing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MRP (Maximum Retail Price)</label>
                <input
                  type="number"
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                  placeholder="₹"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                <input
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                  placeholder="₹"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax (GST) %</label>
                <input
                  type="number"
                  value={formData.tax}
                  onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  placeholder="5"
                />
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(2)} className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">Back</button>
              <button onClick={goToNextStep} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Inventory */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-sm">4</span>
              Inventory
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Stock Keeping Unit)</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity / Stock *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert Threshold</label>
                <input
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(3)} className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">Back</button>
              <button onClick={goToNextStep} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Description */}
        {step === 5 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-sm">5</span>
              Product Description
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <textarea
                rows="2"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                placeholder="Brief description for search results"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
              <textarea
                rows="4"
                value={formData.fullDescription}
                onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                placeholder="Detailed product description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Features</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.keyFeatures.map((feature, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 bg-pink-50 text-pink-700 px-2 py-1 rounded-full text-sm">
                    ✓ {feature}
                    <button onClick={() => removeKeyFeature(idx)} className="text-gray-400 hover:text-red-500">✕</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keyFeature}
                  onChange={(e) => setKeyFeature(e.target.value)}
                  placeholder="e.g., Dermatologically tested"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl"
                />
                <button onClick={addKeyFeature} className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition">Add</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
              <div className="space-y-2 mb-2">
                {Object.entries(formData.specifications).map(([key, value]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <span className="w-1/3 px-3 py-1 bg-gray-50 rounded-lg text-sm">{key}</span>
                    <span className="flex-1 px-3 py-1 bg-gray-50 rounded-lg text-sm">{value}</span>
                    <button onClick={() => removeSpecification(key)} className="text-red-500 hover:text-red-700">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g., Material)"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Value (e.g., Plastic)"
                  value={specValue}
                  onChange={(e) => setSpecValue(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl"
                />
                <button onClick={addSpecification} className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition">Add</button>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(4)} className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">Back</button>
              <button onClick={() => setStep(6)} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Shipping */}
        {step === 6 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-sm">6</span>
              Shipping Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  placeholder="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (L x W x H in cm)</label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  placeholder="20 x 10 x 5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Charges</label>
                <input
                  type="number"
                  value={formData.shippingCharges}
                  onChange={(e) => setFormData({ ...formData, shippingCharges: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  placeholder="0 for free shipping"
                />
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(5)} className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">Back</button>
              <button onClick={() => setStep(7)} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 7: SEO */}
        {step === 7 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-sm">7</span>
              Search Engine Optimization (SEO)
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                placeholder="Product title for search engines"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
              <textarea
                rows="2"
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Keywords</label>
              <input
                type="text"
                value={formData.seoKeywords}
                onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                placeholder="Comma separated keywords"
              />
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(6)} className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">Back</button>
              <button onClick={submitProduct} disabled={loading} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50">
                {loading ? 'Submitting...' : '✓ Submit Product'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAddProduct;
