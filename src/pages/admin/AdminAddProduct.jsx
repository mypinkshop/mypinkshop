import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function AdminAddProduct() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [brandSearch, setBrandSearch] = useState('');
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [brands, setBrands] = useState([
    'Nykaa Beauty', 'Mamaearth', 'Sugar Cosmetics', 'The Face Shop', 
    'Lakmé', 'MyGlamm', 'Plum', 'Wow Skin Science', 'Biotique', 
    'Forest Essentials', 'Kama Ayurveda', 'Mcaffeine', 'St.Botanica',
    'Loreal Paris', 'Maybelline', 'Clinique', 'Estee Lauder'
  ]);
  
  const [formData, setFormData] = useState({
    productName: '',
    brand: '',
    category: '',
    subCategory: '',
    images: [],
    mrp: '',
    sellingPrice: '',
    tax: 5,
    sku: '',
    quantity: '',
    lowStockThreshold: 10,
    shortDescription: '',
    fullDescription: '',
    keyFeatures: [],
    specifications: {},
    weight: '',
    dimensions: '',
    shippingCharges: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    warranty: '',
    returnPolicy: '7 days return',
  });
  
  const [keyFeature, setKeyFeature] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Load brands from localStorage
  useEffect(() => {
    const savedBrands = localStorage.getItem('brandsList');
    if (savedBrands) {
      setBrands(JSON.parse(savedBrands));
    }
  }, []);

  // Save brands to localStorage
  const saveBrands = (updatedBrands) => {
    setBrands(updatedBrands);
    localStorage.setItem('brandsList', JSON.stringify(updatedBrands));
  };

  // ✅ Base64 conversion function
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // ✅ FIXED: Image upload with Base64 conversion
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (formData.images.length + files.length > 5) {
      alert('You can upload maximum 5 images');
      return;
    }
    
    setUploadingImages(true);
    const newImages = [];
    
    for (const file of files) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert(`Image ${file.name} is larger than 2MB. Please compress and upload.`);
        continue;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image.`);
        continue;
      }
      
      try {
        const base64 = await convertToBase64(file);
        newImages.push(base64);
      } catch (error) {
        console.error('Error converting image:', error);
      }
    }
    
    setFormData({ ...formData, images: [...formData.images, ...newImages] });
    setUploadingImages(false);
  };

  const removeImage = (index) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const handleAddNewBrand = () => {
    if (newBrand.trim() && !brands.includes(newBrand.trim())) {
      const updatedBrands = [...brands, newBrand.trim()];
      saveBrands(updatedBrands);
      setFormData({ ...formData, brand: newBrand.trim() });
      setNewBrand('');
      setShowAddBrand(false);
      alert(`✓ Brand "${newBrand.trim()}" added successfully!`);
    } else if (brands.includes(newBrand.trim())) {
      alert('⚠ This brand already exists!');
    } else {
      alert('Please enter a valid brand name');
    }
  };

  const filteredBrands = brands.filter(brand => 
    brand.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const categories = {
    'Skincare': ['Face Wash', 'Serums', 'Moisturizers', 'Toners', 'Sunscreen', 'Masks', 'Eye Cream'],
    'Makeup': ['Lipsticks', 'Foundation', 'Kajal', 'Eyeshadow', 'Blush', 'Compact', 'Mascara', 'Highlighter'],
    'Clothing': ['Dresses', 'Tops', 'Jeans', 'Skirts', 'Ethnic Wear', 'Kurtis', 'Sarees', 'Jackets'],
    'Accessories': ['Bags', 'Jewelry', 'Hair Accessories', 'Watches', 'Sunglasses', 'Belts', 'Scarves'],
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
    if (!formData.productName || !formData.brand || !formData.category || !formData.sellingPrice || !formData.quantity) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);

    const newProduct = {
      id: Date.now(),
      name: formData.productName,
      brand: formData.brand,
      vendor: formData.brand,
      category: formData.subCategory || formData.category,
      mainCategory: formData.category,
      price: parseFloat(formData.sellingPrice),
      originalPrice: parseFloat(formData.mrp) || parseFloat(formData.sellingPrice) * 1.2,
      tax: parseFloat(formData.tax),
      stock: parseInt(formData.quantity),
      sku: formData.sku || `SKU-${Date.now()}`,
      lowStockThreshold: parseInt(formData.lowStockThreshold),
      images: formData.images, // ✅ Now stores Base64 strings
      shortDescription: formData.shortDescription,
      description: formData.fullDescription,
      keyFeatures: formData.keyFeatures,
      specifications: formData.specifications,
      weight: formData.weight,
      dimensions: formData.dimensions,
      shippingCharges: parseFloat(formData.shippingCharges) || 0,
      warranty: formData.warranty,
      returnPolicy: formData.returnPolicy,
      seoTitle: formData.seoTitle,
      seoDescription: formData.seoDescription,
      seoKeywords: formData.seoKeywords,
      rating: 0,
      reviewCount: 0,
      status: 'active',
      adminApproved: true,
      isNew: true,
      createdAt: new Date().toISOString(),
    };

    const existingProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    existingProducts.push(newProduct);
    localStorage.setItem('adminProductsList', JSON.stringify(existingProducts));

    setTimeout(() => {
      setLoading(false);
      alert('✓ Product listed successfully!');
      navigate('/admin/inventory');
    }, 500);
  };

  const goToNextStep = () => {
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

  // SVG Icons
  const IconBack = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );

  const IconUpload = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );

  const IconTrash = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  const IconPlus = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );

  const IconX = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link to="/admin/inventory" className="text-gray-500 hover:text-gray-700 transition">
                <IconBack />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">Add a Product</h1>
                <p className="text-xs text-gray-500">Complete all details to list your product</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={submitProduct}
                disabled={loading}
                className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save & Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Vital Info' },
              { num: 2, label: 'Images' },
              { num: 3, label: 'Pricing' },
              { num: 4, label: 'Inventory' },
              { num: 5, label: 'Description' },
              { num: 6, label: 'Shipping' },
              { num: 7, label: 'SEO' },
            ].map((s) => (
              <div key={s.num} className="flex items-center">
                <div className="text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step >= s.num 
                      ? 'bg-pink-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <p className={`text-xs mt-1 hidden sm:block ${step >= s.num ? 'text-gray-600' : 'text-gray-400'}`}>
                    {s.label}
                  </p>
                </div>
                {s.num < 7 && (
                  <div className="w-8 sm:w-12 h-px bg-gray-200 mx-1 sm:mx-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Vital Info */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Vital Information</h2>
              <p className="text-sm text-gray-500">Basic product details and categorization</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 transition"
                    placeholder="e.g., Glass Skin Vitamin C Serum"
                  />
                </div>
                
                {/* Brand Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand / Vendor <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search or select brand..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  
                  {brandSearch && (
                    <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg">
                      {filteredBrands.length > 0 ? (
                        filteredBrands.map(brand => (
                          <button
                            key={brand}
                            onClick={() => {
                              setFormData({ ...formData, brand });
                              setBrandSearch('');
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 transition text-sm"
                          >
                            {brand}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No brand found. 
                          <button
                            onClick={() => setShowAddBrand(true)}
                            className="ml-2 text-pink-600 hover:underline"
                          >
                            Add new brand
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {formData.brand && !brandSearch && (
                    <div className="mt-2 flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                      <span className="text-sm font-medium text-gray-700">{formData.brand}</span>
                      <button
                        onClick={() => setFormData({ ...formData, brand: '' })}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <IconX />
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowAddBrand(true)}
                    className="mt-2 text-sm text-pink-600 hover:underline flex items-center gap-1"
                  >
                    <IconPlus /> Add new brand
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '' })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                  >
                    <option value="">Select Category</option>
                    {Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                    disabled={!formData.category}
                  >
                    <option value="">Select Sub Category</option>
                    {formData.category && categories[formData.category]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button onClick={() => navigate('/admin/inventory')} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={goToNextStep} className="bg-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-pink-700 transition">
                  Continue →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Brand Modal */}
        {showAddBrand && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddBrand(false)}>
            <div className="bg-white rounded-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-gray-200 p-5 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Add New Brand</h3>
                <button onClick={() => setShowAddBrand(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="p-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="e.g., New Brand Name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2">This brand will be available for future product listings</p>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowAddBrand(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button onClick={handleAddNewBrand} className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition">
                    Add Brand
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Images - FIXED with Base64 */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Images</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50/50">
              <div className="flex flex-wrap gap-4 mb-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden group shadow-sm">
                    <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <IconX />
                    </button>
                  </div>
                ))}
                {formData.images.length === 0 && (
                  <div className="w-full text-center py-8 text-gray-400">
                    No images uploaded yet
                  </div>
                )}
              </div>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="imageUpload" />
              <label htmlFor="imageUpload" className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-pink-200 rounded-lg cursor-pointer hover:bg-pink-50 transition text-pink-600 font-medium">
                <IconUpload /> {uploadingImages ? 'Converting...' : 'Upload Images'}
              </label>
              <p className="text-xs text-gray-400 mt-3">Upload up to 5 images. Max 2MB each. First image will be the main product image.</p>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Back</button>
              <button onClick={goToNextStep} className="bg-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-pink-700 transition">Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MRP (Maximum Retail Price)</label>
                <input
                  type="number"
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  placeholder="₹"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                <input
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  placeholder="₹"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax (GST) %</label>
                <input
                  type="number"
                  value={formData.tax}
                  onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  placeholder="5"
                />
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(2)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Back</button>
              <button onClick={goToNextStep} className="bg-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-pink-700 transition">Continue →</button>
            </div>
          </div>
        )}

        {/* Step 4: Inventory */}
        {step === 4 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity / Stock *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert Threshold</label>
                <input
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(3)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Back</button>
              <button onClick={goToNextStep} className="bg-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-pink-700 transition">Continue →</button>
            </div>
          </div>
        )}

        {/* Step 5: Description */}
        {step === 5 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Product Description</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <textarea
                rows="2"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                placeholder="Brief description for search results"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
              <textarea
                rows="4"
                value={formData.fullDescription}
                onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                placeholder="Detailed product description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Features</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.keyFeatures.map((feature, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                    ✓ {feature}
                    <button onClick={() => removeKeyFeature(idx)} className="text-gray-400 hover:text-red-500">
                      <IconX />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keyFeature}
                  onChange={(e) => setKeyFeature(e.target.value)}
                  placeholder="e.g., Dermatologically tested"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg"
                />
                <button onClick={addKeyFeature} className="px-5 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Add</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
              <div className="space-y-2 mb-2">
                {Object.entries(formData.specifications).map(([key, value]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <span className="w-1/3 px-3 py-2 bg-gray-50 rounded-lg text-sm">{key}</span>
                    <span className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm">{value}</span>
                    <button onClick={() => removeSpecification(key)} className="text-red-500 hover:text-red-700">
                      <IconTrash />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g., Material)"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Value (e.g., Plastic)"
                  value={specValue}
                  onChange={(e) => setSpecValue(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg"
                />
                <button onClick={addSpecification} className="px-5 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Add</button>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(4)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Back</button>
              <button onClick={() => setStep(6)} className="bg-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-pink-700 transition">Continue →</button>
            </div>
          </div>
        )}

        {/* Step 6: Shipping */}
        {step === 6 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Shipping Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  placeholder="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (L x W x H in cm)</label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  placeholder="20 x 10 x 5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Charges</label>
                <input
                  type="number"
                  value={formData.shippingCharges}
                  onChange={(e) => setFormData({ ...formData, shippingCharges: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  placeholder="0 for free shipping"
                />
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(5)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Back</button>
              <button onClick={() => setStep(7)} className="bg-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-pink-700 transition">Continue →</button>
            </div>
          </div>
        )}

        {/* Step 7: SEO */}
        {step === 7 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Search Engine Optimization (SEO)</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                placeholder="Product title for search engines"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
              <textarea
                rows="2"
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Keywords</label>
              <input
                type="text"
                value={formData.seoKeywords}
                onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                placeholder="Comma separated keywords"
              />
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(6)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Back</button>
              <button onClick={submitProduct} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50">
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
