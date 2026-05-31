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
    'Loreal Paris', 'Maybelline', 'Clinique', 'Estee Lauder', 'Huda Beauty', 'MAC'
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
    // Skincare specific
    skinType: 'all',
    concerns: [],
    ingredients: '',
    // Makeup specific
    shade: '',
    finish: '',
    coverage: '',
    // Clothing specific
    sizes: [],
    colors: [],
    fabric: '',
    // Hair specific
    hairType: 'all',
    hairConcerns: [],
    // Accessories specific
    material: '',
    gender: 'unisex',
    // SEO
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });
  
  const [keyFeature, setKeyFeature] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [sizeValue, setSizeValue] = useState('');
  const [colorValue, setColorValue] = useState('');

  const API_URL = 'https://mypinkshop-dr93.vercel.app';

  useEffect(() => {
    const savedBrands = localStorage.getItem('brandsList');
    if (savedBrands) setBrands(JSON.parse(savedBrands));
  }, []);

  const saveBrands = (updatedBrands) => {
    setBrands(updatedBrands);
    localStorage.setItem('brandsList', JSON.stringify(updatedBrands));
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  };

  const uploadImageToBackend = async (file) => {
    const token = localStorage.getItem('adminToken');
    const formDataImg = new FormData();
    formDataImg.append('images', file);
    
    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formDataImg
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Upload failed');
    }
    const data = await response.json();
    return data.url;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 5) {
      alert('Maximum 5 images');
      return;
    }
    setUploadingImages(true);
    const uploadedUrls = [];
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        alert(`${file.name} is larger than 2MB`);
        continue;
      }
      try {
        const imageUrl = await uploadImageToBackend(file);
        uploadedUrls.push(imageUrl);
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Failed to upload ${file.name}: ${error.message}`);
      }
    }
    setFormData({ ...formData, images: [...formData.images, ...uploadedUrls] });
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
      alert(`✓ Brand "${newBrand.trim()}" added!`);
    } else if (brands.includes(newBrand.trim())) {
      alert('Brand already exists');
    } else {
      alert('Enter a valid brand name');
    }
  };

  const filteredBrands = brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()));

  // ✅ All 5 categories with subcategories
  const categories = {
    'Skincare': ['Face Wash', 'Serums', 'Moisturizers', 'Toners', 'Sunscreen', 'Masks', 'Eye Cream', 'Cleanser'],
    'Makeup': ['Lipstick', 'Foundation', 'Kajal', 'Eyeshadow', 'Blush', 'Compact', 'Mascara', 'Highlighter', 'Lip Liner', 'Concealer'],
    'Hair': ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Serum', 'Hair Mask', 'Hair Color', 'Styling Products', 'Hair Spray'],
    'Clothing': ['Dresses', 'Tops', 'Jeans', 'Skirts', 'Ethnic Wear', 'Kurtis', 'Sarees', 'Jackets', 'T-Shirts', 'Shorts', 'Winter Wear'],
    'Accessories': ['Bags', 'Jewelry', 'Hair Accessories', 'Watches', 'Sunglasses', 'Belts', 'Scarves', 'Hats', 'Wallet']
  };

  // Category specific options
  const skinConcerns = ['Acne', 'Aging', 'Pigmentation', 'Dryness', 'Dullness', 'Oil Control', 'Redness', 'Dark Spots'];
  const makeupFinishes = ['Matte', 'Glossy', 'Satin', 'Shimmer', 'Dewy', 'Metallic'];
  const makeupCoverage = ['Light', 'Medium', 'Full', 'Sheer'];
  const hairConcernsList = ['Hairfall', 'Dandruff', 'Dry Hair', 'Frizzy Hair', 'Split Ends', 'Damaged Hair', 'Hair Growth', 'Volume'];
  const hairTypes = ['All', 'Oily', 'Dry', 'Normal', 'Curly', 'Wavy', 'Straight'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const colors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Pink', 'Purple', 'Yellow', 'Brown', 'Navy', 'Grey'];

  // Size management
  const addSize = () => {
    if (sizeValue.trim() && !formData.sizes.includes(sizeValue.trim())) {
      setFormData({ ...formData, sizes: [...formData.sizes, sizeValue.trim()] });
      setSizeValue('');
    }
  };
  const removeSize = (size) => {
    setFormData({ ...formData, sizes: formData.sizes.filter(s => s !== size) });
  };

  // Color management
  const addColor = () => {
    if (colorValue.trim() && !formData.colors.includes(colorValue.trim())) {
      setFormData({ ...formData, colors: [...formData.colors, colorValue.trim()] });
      setColorValue('');
    }
  };
  const removeColor = (color) => {
    setFormData({ ...formData, colors: formData.colors.filter(c => c !== color) });
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

  const submitProduct = async () => {
    if (!formData.productName || !formData.brand || !formData.category || !formData.sellingPrice || !formData.quantity) {
      alert('Please fill required fields: Product Name, Brand, Category, Selling Price, Quantity');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('adminToken');
    const productData = {
      name: formData.productName,
      brand: formData.brand,
      category: formData.subCategory || formData.category,
      mainCategory: formData.category,
      price: parseFloat(formData.sellingPrice),
      originalPrice: parseFloat(formData.mrp) || parseFloat(formData.sellingPrice) * 1.2,
      tax: parseFloat(formData.tax),
      stock: parseInt(formData.quantity),
      sku: formData.sku || `SKU-${Date.now()}`,
      images: formData.images,
      shortDescription: formData.shortDescription,
      description: formData.fullDescription,
      keyFeatures: formData.keyFeatures,
      // Skincare
      skinType: formData.skinType,
      concerns: formData.concerns,
      ingredients: formData.ingredients,
      // Makeup
      shade: formData.shade,
      finish: formData.finish,
      coverage: formData.coverage,
      // Clothing
      sizes: formData.sizes,
      colors: formData.colors,
      fabric: formData.fabric,
      // Hair
      hairType: formData.hairType,
      hairConcerns: formData.hairConcerns,
      // Accessories
      material: formData.material,
      gender: formData.gender,
      // SEO
      seoTitle: formData.seoTitle,
      seoDescription: formData.seoDescription,
      seoKeywords: formData.seoKeywords,
      status: 'active',
      adminApproved: true,
      isNew: true,
      rating: 4.0
    };

    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      if (!response.ok) throw new Error(await response.text());
      alert('✓ Product listed successfully!');
      navigate('/admin/inventory');
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to add product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const goToNextStep = () => {
    if (step === 1 && (!formData.productName || !formData.brand || !formData.category || !formData.subCategory)) {
      alert('Please fill all vital information');
      return;
    }
    if (step === 2 && formData.images.length === 0) {
      alert('Please upload at least one image');
      return;
    }
    if (step === 3 && !formData.sellingPrice) {
      alert('Please enter selling price');
      return;
    }
    if (step === 4 && !formData.quantity) {
      alert('Please enter stock quantity');
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const IconBack = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>);
  const IconUpload = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>);
  const IconPlus = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);
  const IconX = () => (<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin/inventory" className="text-gray-500 hover:text-gray-700"><IconBack /></Link>
            <div>
              <h1 className="text-xl font-semibold">Add Product</h1>
              <p className="text-xs text-gray-500">All Categories</p>
            </div>
          </div>
          <button onClick={submitProduct} disabled={loading} className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-5 py-2 rounded-lg text-sm font-medium">
            {loading ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-8 overflow-x-auto">
          <div className="flex justify-between min-w-[500px]">
            {['Basic', 'Images', 'Pricing', 'Stock', 'Details', 'SEO'].map((label, idx) => (
              <div key={idx} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= idx + 1 ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {step > idx + 1 ? '✓' : idx + 1}
                </div>
                <span className={`text-xs ml-2 ${step >= idx + 1 ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
                {idx < 5 && <div className="w-8 h-px bg-gray-200 mx-2"></div>}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">📋 Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Product Name <span className="text-red-500">*</span></label>
                <input type="text" value={formData.productName} onChange={(e) => setFormData({...formData, productName: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="e.g., Vitamin C Serum" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Brand <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Search brand..." value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)} className="w-full border rounded-lg px-4 py-2.5" />
                {brandSearch && (
                  <div className="mt-1 border rounded-lg max-h-40 overflow-y-auto">
                    {filteredBrands.map(b => (
                      <button key={b} onClick={() => { setFormData({...formData, brand: b}); setBrandSearch(''); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">{b}</button>
                    ))}
                    <button onClick={() => setShowAddBrand(true)} className="w-full text-left px-4 py-2 text-pink-600 text-sm">+ Add new brand</button>
                  </div>
                )}
                {formData.brand && !brandSearch && (
                  <div className="mt-2 bg-gray-50 px-4 py-2 rounded-lg flex justify-between">
                    <span>{formData.brand}</span>
                    <button onClick={() => setFormData({...formData, brand: ''})} className="text-gray-400">✕</button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category <span className="text-red-500">*</span></label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value, subCategory: ''})} className="w-full border rounded-lg px-4 py-2.5">
                  <option value="">Select Category</option>
                  {Object.keys(categories).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sub Category <span className="text-red-500">*</span></label>
                <select value={formData.subCategory} onChange={(e) => setFormData({...formData, subCategory: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" disabled={!formData.category}>
                  <option value="">Select Sub Category</option>
                  {formData.category && categories[formData.category]?.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-6"><button onClick={goToNextStep} className="bg-pink-600 text-white px-6 py-2 rounded-lg">Continue →</button></div>
          </div>
        )}

        {showAddBrand && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddBrand(false)}>
            <div className="bg-white rounded-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b"><h3 className="font-semibold">Add New Brand</h3></div>
              <div className="p-5">
                <input type="text" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="Brand name" className="w-full border rounded-lg px-4 py-2" autoFocus />
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowAddBrand(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                  <button onClick={handleAddNewBrand} className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg">Add</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">📸 Product Images</h2>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <div className="flex flex-wrap gap-3 mb-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                    <img src={img} className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(idx)} className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full text-xs">✕</button>
                  </div>
                ))}
              </div>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="imageUpload" />
              <label htmlFor="imageUpload" className="inline-flex items-center gap-2 px-5 py-2 border-2 border-pink-200 rounded-lg cursor-pointer text-pink-600">
                <IconUpload /> {uploadingImages ? 'Uploading...' : 'Upload Images'}
              </label>
              <p className="text-xs text-gray-400 mt-2">Up to 5 images, max 2MB each</p>
            </div>
            <div className="flex justify-between mt-6"><button onClick={() => setStep(1)} className="px-6 py-2 border rounded-lg">Back</button><button onClick={goToNextStep} className="bg-pink-600 text-white px-6 py-2 rounded-lg">Continue →</button></div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">💰 Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div><label className="block text-sm font-medium mb-1">MRP</label><input type="number" value={formData.mrp} onChange={(e) => setFormData({...formData, mrp: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="₹" /></div>
              <div><label className="block text-sm font-medium mb-1">Selling Price <span className="text-red-500">*</span></label><input type="number" value={formData.sellingPrice} onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="₹" /></div>
              <div><label className="block text-sm font-medium mb-1">Tax (GST) %</label><input type="number" value={formData.tax} onChange={(e) => setFormData({...formData, tax: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" /></div>
            </div>
            <div className="flex justify-between mt-6"><button onClick={() => setStep(2)} className="px-6 py-2 border rounded-lg">Back</button><button onClick={goToNextStep} className="bg-pink-600 text-white px-6 py-2 rounded-lg">Continue →</button></div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">📦 Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-sm font-medium mb-1">SKU</label><input type="text" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="Auto" /></div>
              <div><label className="block text-sm font-medium mb-1">Quantity/Stock <span className="text-red-500">*</span></label><input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" /></div>
            </div>
            <div className="flex justify-between mt-6"><button onClick={() => setStep(3)} className="px-6 py-2 border rounded-lg">Back</button><button onClick={goToNextStep} className="bg-pink-600 text-white px-6 py-2 rounded-lg">Continue →</button></div>
          </div>
        )}

        {step === 5 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">✨ Product Details</h2>
            
            <div className="mb-5">
              <label className="block text-sm font-medium mb-1">Short Description</label>
              <textarea rows="2" value={formData.shortDescription} onChange={(e) => setFormData({...formData, shortDescription: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="Brief description" />
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium mb-1">Full Description</label>
              <textarea rows="4" value={formData.fullDescription} onChange={(e) => setFormData({...formData, fullDescription: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="Detailed description" />
            </div>
            
            <div className="mb-5">
              <label className="block text-sm font-medium mb-1">Key Features</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.keyFeatures.map((f, i) => (
                  <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">✓ {f}<button onClick={() => removeKeyFeature(i)} className="text-red-400">×</button></span>
                ))}
              </div>
              <div className="flex gap-2"><input type="text" value={keyFeature} onChange={(e) => setKeyFeature(e.target.value)} placeholder="e.g., Dermatologically tested" className="flex-1 border rounded-lg px-4 py-2" /><button onClick={addKeyFeature} className="px-4 py-2 bg-gray-100 rounded-lg">Add</button></div>
            </div>

            {/* Category Specific Fields */}
            {formData.category === 'Skincare' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">🧴 Skincare Specific</h3>
                <div><label className="block text-sm font-medium mb-1">Skin Type</label><select value={formData.skinType} onChange={(e) => setFormData({...formData, skinType: e.target.value})} className="w-full border rounded-lg px-4 py-2.5"><option value="all">All Skin Types</option><option value="oily">Oily</option><option value="dry">Dry</option><option value="combination">Combination</option><option value="sensitive">Sensitive</option></select></div>
                <div><label className="block text-sm font-medium mb-1">Skin Concerns</label><div className="flex flex-wrap gap-2">{skinConcerns.map(concern => (<label key={concern} className="flex items-center gap-1"><input type="checkbox" onChange={(e) => { const updated = e.target.checked ? [...formData.concerns, concern] : formData.concerns.filter(c => c !== concern); setFormData({...formData, concerns: updated}); }} /><span className="text-sm">{concern}</span></label>))}</div></div>
                <div><label className="block text-sm font-medium mb-1">Key Ingredients</label><input type="text" value={formData.ingredients} onChange={(e) => setFormData({...formData, ingredients: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="e.g., Vitamin C, Hyaluronic Acid" /></div>
              </div>
            )}

            {formData.category === 'Makeup' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">💄 Makeup Specific</h3>
                <div><label className="block text-sm font-medium mb-1">Shade / Color</label><input type="text" value={formData.shade} onChange={(e) => setFormData({...formData, shade: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="e.g., Ruby Red" /></div>
                <div><label className="block text-sm font-medium mb-1">Finish</label><select value={formData.finish} onChange={(e) => setFormData({...formData, finish: e.target.value})} className="w-full border rounded-lg px-4 py-2.5"><option value="">Select Finish</option>{makeupFinishes.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Coverage</label><select value={formData.coverage} onChange={(e) => setFormData({...formData, coverage: e.target.value})} className="w-full border rounded-lg px-4 py-2.5"><option value="">Select Coverage</option>{makeupCoverage.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
            )}

            {formData.category === 'Hair' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">💇‍♀️ Hair Specific</h3>
                <div><label className="block text-sm font-medium mb-1">Hair Type</label><select value={formData.hairType} onChange={(e) => setFormData({...formData, hairType: e.target.value})} className="w-full border rounded-lg px-4 py-2.5">{hairTypes.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Hair Concerns</label><div className="flex flex-wrap gap-2">{hairConcernsList.map(concern => (<label key={concern} className="flex items-center gap-1"><input type="checkbox" onChange={(e) => { const updated = e.target.checked ? [...(formData.hairConcerns || []), concern] : (formData.hairConcerns || []).filter(c => c !== concern); setFormData({...formData, hairConcerns: updated}); }} /><span className="text-sm">{concern}</span></label>))}</div></div>
              </div>
            )}

            {formData.category === 'Clothing' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">👗 Clothing Specific</h3>
                <div><label className="block text-sm font-medium mb-1">Sizes Available</label><div className="flex flex-wrap gap-2 mb-2">{formData.sizes.map(size => (<span key={size} className="bg-gray-100 px-2 py-1 rounded-full text-sm flex items-center gap-1">{size}<button onClick={() => removeSize(size)} className="text-red-400">×</button></span>))}</div><div className="flex gap-2"><select value={sizeValue} onChange={(e) => setSizeValue(e.target.value)} className="border rounded-lg px-4 py-2"><option value="">Select Size</option>{sizes.map(s => <option key={s} value={s}>{s}</option>)}</select><button onClick={addSize} className="px-4 py-2 bg-gray-100 rounded-lg">Add</button></div></div>
                <div><label className="block text-sm font-medium mb-1">Colors Available</label><div className="flex flex-wrap gap-2 mb-2">{formData.colors.map(color => (<span key={color} className="bg-gray-100 px-2 py-1 rounded-full text-sm flex items-center gap-1">{color}<button onClick={() => removeColor(color)} className="text-red-400">×</button></span>))}</div><div className="flex gap-2"><select value={colorValue} onChange={(e) => setColorValue(e.target.value)} className="border rounded-lg px-4 py-2"><option value="">Select Color</option>{colors.map(c => <option key={c} value={c}>{c}</option>)}</select><button onClick={addColor} className="px-4 py-2 bg-gray-100 rounded-lg">Add</button></div></div>
                <div><label className="block text-sm font-medium mb-1">Fabric / Material</label><input type="text" value={formData.fabric} onChange={(e) => setFormData({...formData, fabric: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="e.g., Cotton, Silk, Polyester" /></div>
              </div>
            )}

            {formData.category === 'Accessories' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">💍 Accessories Specific</h3>
                <div><label className="block text-sm font-medium mb-1">Material</label><input type="text" value={formData.material} onChange={(e) => setFormData({...formData, material: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="e.g., Silver, Gold, Leather" /></div>
                <div><label className="block text-sm font-medium mb-1">Gender</label><select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full border rounded-lg px-4 py-2.5"><option value="unisex">Unisex</option><option value="men">Men</option><option value="women">Women</option><option value="kids">Kids</option></select></div>
              </div>
            )}

            <div className="flex justify-between mt-6"><button onClick={() => setStep(4)} className="px-6 py-2 border rounded-lg">Back</button><button onClick={() => setStep(6)} className="bg-pink-600 text-white px-6 py-2 rounded-lg">Continue →</button></div>
          </div>
        )}

        {step === 6 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">🔍 SEO</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">SEO Title</label><input type="text" value={formData.seoTitle} onChange={(e) => setFormData({...formData, seoTitle: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" /></div>
              <div><label className="block text-sm font-medium mb-1">SEO Description</label><textarea rows="2" value={formData.seoDescription} onChange={(e) => setFormData({...formData, seoDescription: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" /></div>
              <div><label className="block text-sm font-medium mb-1">SEO Keywords</label><input type="text" value={formData.seoKeywords} onChange={(e) => setFormData({...formData, seoKeywords: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="comma, separated, keywords" /></div>
            </div>
            <div className="flex justify-between mt-6"><button onClick={() => setStep(5)} className="px-6 py-2 border rounded-lg">Back</button><button onClick={submitProduct} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded-lg">{loading ? 'Submitting...' : '✓ Submit Product'}</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAddProduct;
