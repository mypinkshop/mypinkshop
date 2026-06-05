import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// 🔥 Amazon Importer Component
const AmazonImporter = ({ onProductImported, setFormData, setVariations, setImages }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);
  const [step, setStep] = useState(1);

  const API_URL = 'https://api.mypinkshop.com';
  const token = localStorage.getItem('adminToken');

  const fetchProduct = async () => {
    if (!url.trim()) {
      alert('Please enter Amazon product URL');
      return;
    }

    setLoading(true);
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
        setFetchedData(data);
        setStep(2);
      } else {
        alert(data.error || 'Failed to fetch product');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import product. Please check the URL.');
    } finally {
      setLoading(false);
    }
  };

  const importProduct = () => {
    if (fetchedData) {
      // Auto-fill form data
      setFormData(prev => ({
        ...prev,
        productName: fetchedData.scraped.name,
        brand: fetchedData.scraped.brand || prev.brand,
        sellingPrice: fetchedData.scraped.price,
        mrp: fetchedData.scraped.originalPrice || fetchedData.scraped.price * 1.2,
        fullDescription: fetchedData.scraped.description ? [fetchedData.scraped.description] : [],
        keyFeatures: fetchedData.scraped.keyFeatures || []
      }));
      
      // Auto-fill images
      if (fetchedData.scraped.images && fetchedData.scraped.images.length > 0) {
        setImages(fetchedData.scraped.images);
      }
      
      alert('✅ Product details imported! Please review and continue.');
      onProductImported();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        📦 Import from Amazon
      </h3>
      
      {step === 1 && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Paste Amazon product URL to automatically fetch product details
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="https://www.amazon.in/dp/XXXXXXXXXX"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-pink-500"
            />
            <button
              onClick={fetchProduct}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Fetching...' : '🔍 Fetch Product'}
            </button>
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600">
              💡 Tip: Paste Amazon.in product URL. Product name, price, images, and description will be auto-filled.
            </p>
          </div>
        </>
      )}

      {step === 2 && fetchedData && (
        <div className="border-t pt-4">
          <div className="flex gap-4 mb-4">
            {fetchedData.scraped.images?.[0] && (
              <img 
                src={fetchedData.scraped.images[0]} 
                alt={fetchedData.scraped.name}
                className="w-20 h-20 object-cover rounded-lg border"
              />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">{fetchedData.scraped.name}</h4>
              <p className="text-sm text-gray-500">Brand: {fetchedData.scraped.brand || 'N/A'}</p>
              <p className="text-lg font-bold text-pink-600">₹{fetchedData.scraped.price}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={importProduct}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-lg transition"
            >
              📥 Import to Form
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

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
  
  const [activeTab, setActiveTab] = useState('manual');
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
    fullDescription: [],
    keyFeatures: [],
    skinType: 'all',
    concerns: [],
    ingredients: '',
    finish: '',
    coverage: '',
    shade: '',
    hairType: 'all',
    hairConcerns: [],
    fabric: '',
    material: '',
    gender: 'unisex',
    weight: '',
    dimensions: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });
  
  // Variations System
  const [variations, setVariations] = useState([]);
  const [variationModalOpen, setVariationModalOpen] = useState(false);
  const [editingVariation, setEditingVariation] = useState(null);
  const [variationForm, setVariationForm] = useState({
    name: '',
    price: '',
    stock: '',
    sku: '',
    attributes: {}
  });
  
  const getVariationAttributes = () => {
    switch(formData.category) {
      case 'Skincare':
        return {
          type: 'size',
          options: ['15ml', '30ml', '50ml', '100ml', '200ml', '50g', '100g', '200g'],
          secondary: 'fragrance',
          secondaryOptions: ['Unscented', 'Lavender', 'Rose', 'Citrus', 'Vanilla', 'Mint', 'Cucumber']
        };
      case 'Makeup':
        return {
          type: 'shade',
          options: ['Fair', 'Light', 'Medium', 'Tan', 'Deep', 'Red', 'Pink', 'Nude', 'Coral', 'Berry', 'Mauve', 'Brown', 'Black'],
          secondary: 'finish',
          secondaryOptions: ['Matte', 'Glossy', 'Satin', 'Shimmer', 'Dewy', 'Metallic']
        };
      case 'Hair':
        return {
          type: 'size',
          options: ['100ml', '200ml', '300ml', '500ml', '1L'],
          secondary: 'fragrance',
          secondaryOptions: ['Unscented', 'Coconut', 'Argan', 'Aloe Vera', 'Tea Tree', 'Rose', 'Lavender']
        };
      case 'Clothing':
        return {
          type: 'size',
          options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'],
          secondary: 'color',
          secondaryOptions: ['Red', 'Blue', 'Green', 'Black', 'White', 'Pink', 'Purple', 'Yellow', 'Navy', 'Grey', 'Beige', 'Maroon', 'Teal']
        };
      case 'Accessories':
        return {
          type: 'size',
          options: ['One Size', 'S', 'M', 'L', 'Free Size'],
          secondary: 'color',
          secondaryOptions: ['Red', 'Blue', 'Green', 'Black', 'White', 'Pink', 'Purple', 'Yellow', 'Gold', 'Silver', 'Rose Gold']
        };
      default:
        return { type: 'variant', options: ['Default'], secondary: null, secondaryOptions: [] };
    }
  };

  const variationAttrs = getVariationAttributes();

  const saveVariation = () => {
    if (!variationForm.name) {
      alert(`Please select ${variationAttrs.type}`);
      return;
    }
    
    const existingIndex = variations.findIndex(v => v.name === variationForm.name);
    
    const newVariation = {
      id: editingVariation?.id || Date.now(),
      name: variationForm.name,
      secondaryName: variationForm.attributes.secondary || '',
      price: parseFloat(variationForm.price) || 0,
      stock: parseInt(variationForm.stock) || 0,
      sku: variationForm.sku || `VAR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    };
    
    if (editingVariation) {
      const updatedVariations = [...variations];
      const idx = variations.findIndex(v => v.id === editingVariation.id);
      updatedVariations[idx] = newVariation;
      setVariations(updatedVariations);
      alert('✅ Variation updated successfully!');
    } else {
      if (existingIndex !== -1) {
        alert(`⚠️ This ${variationAttrs.type} already exists!`);
        return;
      }
      setVariations([...variations, newVariation]);
      alert(`✅ ${variationAttrs.type} added successfully!`);
    }
    
    setVariationModalOpen(false);
    setEditingVariation(null);
    setVariationForm({ name: '', price: '', stock: '', sku: '', attributes: {} });
  };

  const editVariation = (variation) => {
    setEditingVariation(variation);
    setVariationForm({
      name: variation.name,
      price: variation.price,
      stock: variation.stock,
      sku: variation.sku,
      attributes: { secondary: variation.secondaryName || '' }
    });
    setVariationModalOpen(true);
  };

  const deleteVariation = (variationId) => {
    if (confirm('Are you sure you want to delete this variation?')) {
      setVariations(variations.filter(v => v.id !== variationId));
    }
  };

  const setImages = (images) => {
    setFormData(prev => ({ ...prev, images }));
  };

  const [currentBullet, setCurrentBullet] = useState('');
  const [keyFeature, setKeyFeature] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const API_URL = 'https://api.mypinkshop.com';

  useEffect(() => {
    const savedBrands = localStorage.getItem('brandsList');
    if (savedBrands) setBrands(JSON.parse(savedBrands));
  }, []);

  const saveBrands = (updatedBrands) => {
    setBrands(updatedBrands);
    localStorage.setItem('brandsList', JSON.stringify(updatedBrands));
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxWidth = 800;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.7);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const uploadImageToBackend = async (file) => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('Session expired. Please login again.');
    
    try {
      const compressedFile = await compressImage(file);
      const formDataImg = new FormData();
      formDataImg.append('images', compressedFile);
      
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataImg
      });
      
      if (!response.ok) {
        if (response.status === 401) throw new Error('Session expired. Please login again.');
        const error = await response.text();
        throw new Error(error || 'Upload failed');
      }
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 5) {
      alert('📸 You can upload maximum 5 images per product');
      return;
    }
    setUploadingImages(true);
    const uploadedUrls = [];
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`📸 ${file.name} is larger than 5MB.`);
        continue;
      }
      try {
        const imageUrl = await uploadImageToBackend(file);
        uploadedUrls.push(imageUrl);
      } catch (error) {
        alert(`❌ Failed to upload ${file.name}: ${error.message}`);
      }
    }
    
    if (uploadedUrls.length > 0) {
      setFormData({ ...formData, images: [...formData.images, ...uploadedUrls] });
      alert(`✅ ${uploadedUrls.length} image(s) uploaded successfully!`);
    }
    setUploadingImages(false);
  };

  const removeImage = (index) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const addBulletPoint = () => {
    if (currentBullet.trim()) {
      if (formData.fullDescription.length >= 8) {
        alert('⚠️ Maximum 8 bullet points allowed!');
        return;
      }
      setFormData({
        ...formData,
        fullDescription: [...formData.fullDescription, currentBullet.trim()]
      });
      setCurrentBullet('');
    }
  };

  const removeBulletPoint = (index) => {
    setFormData({
      ...formData,
      fullDescription: formData.fullDescription.filter((_, i) => i !== index)
    });
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

  const handleAddNewBrand = () => {
    if (newBrand.trim() && !brands.includes(newBrand.trim())) {
      const updatedBrands = [...brands, newBrand.trim()];
      saveBrands(updatedBrands);
      setFormData({ ...formData, brand: newBrand.trim() });
      setNewBrand('');
      setShowAddBrand(false);
      alert(`✅ Brand "${newBrand.trim()}" added successfully!`);
    } else if (brands.includes(newBrand.trim())) {
      alert('⚠️ This brand already exists!');
    } else {
      alert('Please enter a valid brand name');
    }
  };

  const filteredBrands = brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()));

  const categories = {
    'Skincare': ['Face Wash', 'Serums', 'Moisturizers', 'Toners', 'Sunscreen', 'Masks', 'Eye Cream', 'Cleanser'],
    'Makeup': ['Lipstick', 'Foundation', 'Kajal', 'Eyeshadow', 'Blush', 'Compact', 'Mascara', 'Highlighter', 'Lip Liner', 'Concealer'],
    'Hair': ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Serum', 'Hair Mask', 'Hair Color', 'Styling Products', 'Hair Spray'],
    'Clothing': ['Dresses', 'Tops', 'Jeans', 'Skirts', 'Ethnic Wear', 'Kurtis', 'Sarees', 'Jackets', 'T-Shirts', 'Shorts', 'Winter Wear'],
    'Accessories': ['Bags', 'Jewelry', 'Hair Accessories', 'Watches', 'Sunglasses', 'Belts', 'Scarves', 'Hats', 'Wallet']
  };

  const skinConcerns = ['Acne', 'Aging', 'Pigmentation', 'Dryness', 'Dullness', 'Oil Control', 'Redness', 'Dark Spots'];
  const makeupFinishes = ['Matte', 'Glossy', 'Satin', 'Shimmer', 'Dewy', 'Metallic'];
  const makeupCoverage = ['Light', 'Medium', 'Full', 'Sheer'];
  const hairConcernsList = ['Hairfall', 'Dandruff', 'Dry Hair', 'Frizzy Hair', 'Split Ends', 'Damaged Hair', 'Hair Growth', 'Volume'];
  const hairTypes = ['All', 'Oily', 'Dry', 'Normal', 'Curly', 'Wavy', 'Straight'];

  const submitProduct = async () => {
    if (!formData.productName) {
      alert('⚠️ Please enter product name');
      return;
    }
    if (!formData.brand) {
      alert('⚠️ Please select or add a brand');
      return;
    }
    if (!formData.category) {
      alert('⚠️ Please select a category');
      return;
    }
    if (!formData.subCategory) {
      alert('⚠️ Please select a sub category');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      alert('❌ Session expired. Please login again.');
      setLoading(false);
      return;
    }
    
    const totalStock = variations.reduce((sum, v) => sum + v.stock, 0);
    
    const productData = {
      name: formData.productName,
      brand: formData.brand,
      category: formData.subCategory || formData.category,
      mainCategory: formData.category,
      price: parseFloat(formData.sellingPrice),
      originalPrice: parseFloat(formData.mrp) || parseFloat(formData.sellingPrice) * 1.2,
      tax: parseFloat(formData.tax),
      stock: totalStock || 10,
      sku: formData.sku || `SKU-${Date.now()}`,
      images: formData.images,
      description: formData.fullDescription,
      keyFeatures: formData.keyFeatures,
      skinType: formData.skinType,
      concerns: formData.concerns,
      ingredients: formData.ingredients,
      finish: formData.finish,
      coverage: formData.coverage,
      shade: formData.shade,
      hairType: formData.hairType,
      hairConcerns: formData.hairConcerns,
      fabric: formData.fabric,
      material: formData.material,
      gender: formData.gender,
      weight: formData.weight,
      dimensions: formData.dimensions,
      variations: variations,
      hasVariations: variations.length > 0,
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
      
      if (!response.ok) {
        if (response.status === 401) throw new Error('Session expired. Please login again.');
        const error = await response.text();
        throw new Error(error || 'Failed to add product');
      }
      
      alert('🎉 Product added successfully! Redirecting to inventory...');
      navigate('/admin/inventory');
    } catch (error) {
      console.error('Submit error:', error);
      alert(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const goToNextStep = () => {
    if (step === 1) {
      if (!formData.productName) {
        alert('⚠️ Please enter product name');
        return;
      }
      if (!formData.brand) {
        alert('⚠️ Please select or add a brand');
        return;
      }
      if (!formData.category) {
        alert('⚠️ Please select a category');
        return;
      }
      if (!formData.subCategory) {
        alert('⚠️ Please select a sub category');
        return;
      }
    }
    if (step === 2 && formData.images.length === 0) {
      alert('📸 Please upload at least one product image');
      return;
    }
    if (step === 3 && !formData.sellingPrice) {
      alert('💰 Please enter selling price');
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const IconBack = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>);
  const IconUpload = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>);
  const IconPlus = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin/inventory" className="text-gray-500 hover:text-gray-700"><IconBack /></Link>
            <div>
              <h1 className="text-xl font-semibold">Add Product</h1>
              <p className="text-xs text-gray-500">Professional Product Management</p>
            </div>
          </div>
          <button onClick={submitProduct} disabled={loading} className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-5 py-2 rounded-lg text-sm font-medium">
            {loading ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-8 overflow-x-auto">
          <div className="flex justify-between min-w-[500px]">
            {['Basic', 'Images', 'Pricing', 'Details', 'SEO'].map((label, idx) => (
              <div key={idx} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= idx + 1 ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {step > idx + 1 ? '✓' : idx + 1}
                </div>
                <span className={`text-xs ml-2 ${step >= idx + 1 ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
                {idx < 4 && <div className="w-8 h-px bg-gray-200 mx-2"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* 🔥 Amazon Import Tab - Added */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'manual' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-pink-600'}`}
            >
              ✏️ Manual Entry
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'import' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-pink-600'}`}
            >
              📦 Import from Amazon
            </button>
          </div>
        </div>

        {activeTab === 'import' && (
          <AmazonImporter 
            onProductImported={() => setActiveTab('manual')} 
            setFormData={setFormData}
            setVariations={setVariations}
            setImages={setImages}
          />
        )}

        {activeTab === 'manual' && (
          <>
            {/* Step 1 - Basic Information */}
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
                  <div>
                    <label className="block text-sm font-medium mb-1">SKU (Optional)</label>
                    <input type="text" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="Auto Generated" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Weight / Dimensions</label>
                    <input type="text" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="e.g., 250g, 10x5x2 cm" />
                  </div>
                </div>
                <div className="flex justify-end mt-6"><button onClick={goToNextStep} className="bg-pink-600 text-white px-6 py-2 rounded-lg">Continue →</button></div>
              </div>
            )}

            {/* Add Brand Modal */}
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

            {/* Step 2 - Images */}
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
                    <IconUpload /> {uploadingImages ? 'Uploading...' : 'Choose Images'}
                  </label>
                  <p className="text-xs text-gray-400 mt-2">Upload up to 5 images (max 5MB each, automatically compressed)</p>
                </div>
                <div className="flex justify-between mt-6"><button onClick={() => setStep(1)} className="px-6 py-2 border rounded-lg">Back</button><button onClick={goToNextStep} className="bg-pink-600 text-white px-6 py-2 rounded-lg">Continue →</button></div>
              </div>
            )}

            {/* Step 3 - Pricing */}
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

            {/* Step 4 - Product Details with Variations */}
            {step === 4 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">✨ Product Details</h2>
                
                {/* Bullet Points Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Product Description (Bullet Points) <span className="text-xs text-gray-400 ml-2">Max 8 points</span></label>
                  <div className="space-y-2 mb-3">
                    {formData.fullDescription.map((bullet, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                        <span className="text-pink-500 font-bold ml-2">•</span>
                        <span className="flex-1 text-sm">{bullet}</span>
                        <button onClick={() => removeBulletPoint(idx)} className="text-red-400 hover:text-red-600 px-2">✕</button>
                      </div>
                    ))}
                  </div>
                  {formData.fullDescription.length < 8 && (
                    <div className="flex gap-2">
                      <input type="text" value={currentBullet} onChange={(e) => setCurrentBullet(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addBulletPoint()} placeholder="e.g., Dermatologically tested" className="flex-1 border rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500" />
                      <button onClick={addBulletPoint} className="px-5 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition flex items-center gap-1"><IconPlus /> Add</button>
                    </div>
                  )}
                </div>

                {/* Key Features */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Key Features (Highlights)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.keyFeatures.map((f, i) => (
                      <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">⭐ {f}<button onClick={() => removeKeyFeature(i)} className="text-red-400 ml-1">×</button></span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={keyFeature} onChange={(e) => setKeyFeature(e.target.value)} placeholder="e.g., 100% Vegan" className="flex-1 border rounded-lg px-4 py-2" />
                    <button onClick={addKeyFeature} className="px-4 py-2 bg-gray-100 rounded-lg">Add</button>
                  </div>
                </div>

                {/* Variations Section */}
                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-medium text-gray-800 text-lg">🎨 Product Variations</h3>
                      <p className="text-xs text-gray-500">
                        {formData.category === 'Skincare' && 'Add different sizes (ml/gm) and fragrances'}
                        {formData.category === 'Makeup' && 'Add different shades and finishes'}
                        {formData.category === 'Hair' && 'Add different sizes and fragrances'}
                        {formData.category === 'Clothing' && 'Add different sizes and colors'}
                        {formData.category === 'Accessories' && 'Add different sizes and colors'}
                        {!formData.category && 'Select a category first'}
                      </p>
                    </div>
                    {formData.category && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingVariation(null);
                          setVariationForm({ name: '', price: '', stock: '', sku: '', attributes: {} });
                          setVariationModalOpen(true);
                        }}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition"
                      >
                        + Add {variationAttrs.type}
                      </button>
                    )}
                  </div>
                  
                  {!formData.category ? (
                    <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
                      <p className="text-yellow-700 text-sm">Please select a category first to add variations</p>
                    </div>
                  ) : variations.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-6 text-center border border-dashed border-gray-300">
                      <p className="text-gray-400 text-sm">No variations added yet. Click "Add {variationAttrs.type}" to create product variations.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">{variationAttrs.type.charAt(0).toUpperCase() + variationAttrs.type.slice(1)}</th>
                            {variationAttrs.secondary && <th className="px-4 py-2 text-left">{variationAttrs.secondary.charAt(0).toUpperCase() + variationAttrs.secondary.slice(1)}</th>}
                            <th className="px-4 py-2 text-right">Price (₹)</th>
                            <th className="px-4 py-2 text-right">Stock</th>
                            <th className="px-4 py-2 text-left">SKU</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {variations.map((variation) => (
                            <tr key={variation.id} className="hover:bg-pink-50/30">
                              <td className="px-4 py-2 font-medium">{variation.name}</td>
                              {variationAttrs.secondary && <td className="px-4 py-2">{variation.secondaryName || '-'}</td>}
                              <td className="px-4 py-2 text-right font-medium text-pink-600">₹{variation.price}</td>
                              <td className="px-4 py-2 text-right">{variation.stock}</td>
                              <td className="px-4 py-2 text-xs text-gray-500">{variation.sku}</td>
                              <td className="px-4 py-2 text-center">
                                <div className="flex justify-center gap-2">
                                  <button type="button" onClick={() => editVariation(variation)} className="text-blue-500 hover:text-blue-700">✏️</button>
                                  <button type="button" onClick={() => deleteVariation(variation.id)} className="text-red-500 hover:text-red-700">🗑️</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td className="px-4 py-2 font-medium">Total</td>
                            {variationAttrs.secondary && <td></td>}
                            <td className="px-4 py-2 text-right font-bold text-pink-600">₹{variations.reduce((sum, v) => sum + v.price, 0)}</td>
                            <td className="px-4 py-2 text-right font-bold">{variations.reduce((sum, v) => sum + v.stock, 0)}</td>
                            <td colSpan="2"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                {/* Variation Modal */}
                {variationModalOpen && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setVariationModalOpen(false)}>
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                      <div className="border-b border-pink-100 p-5 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">{editingVariation ? '✏️ Edit Variation' : `✨ Add New ${variationAttrs.type}`}</h3>
                        <button onClick={() => setVariationModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                      </div>
                      
                      <div className="p-5 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{variationAttrs.type.charAt(0).toUpperCase() + variationAttrs.type.slice(1)} *</label>
                          <select value={variationForm.name} onChange={(e) => setVariationForm({...variationForm, name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500">
                            <option value="">Select {variationAttrs.type}</option>
                            {variationAttrs.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                        
                        {variationAttrs.secondary && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{variationAttrs.secondary.charAt(0).toUpperCase() + variationAttrs.secondary.slice(1)}</label>
                            <select value={variationForm.attributes.secondary || ''} onChange={(e) => setVariationForm({...variationForm, attributes: {...variationForm.attributes, secondary: e.target.value}})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500">
                              <option value="">Select {variationAttrs.secondary}</option>
                              {variationAttrs.secondaryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                            <input type="number" value={variationForm.price} onChange={(e) => setVariationForm({...variationForm, price: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500" placeholder="499" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                            <input type="number" value={variationForm.stock} onChange={(e) => setVariationForm({...variationForm, stock: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500" placeholder="10" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Optional)</label>
                          <input type="text" value={variationForm.sku} onChange={(e) => setVariationForm({...variationForm, sku: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500" placeholder="Auto-generated" />
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <button type="button" onClick={() => setVariationModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                          <button type="button" onClick={saveVariation} className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition">{editingVariation ? 'Update Variation' : 'Add Variation'}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Category Specific Fields */}
                {formData.category === 'Skincare' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-medium">🧴 Skincare Specific</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium mb-1">Skin Type</label><select value={formData.skinType} onChange={(e) => setFormData({...formData, skinType: e.target.value})} className="w-full border rounded-lg px-4 py-2.5"><option value="all">All Skin Types</option><option value="oily">Oily</option><option value="dry">Dry</option><option value="combination">Combination</option><option value="sensitive">Sensitive</option></select></div>
                      <div><label className="block text-sm font-medium mb-1">Key Ingredients</label><input type="text" value={formData.ingredients} onChange={(e) => setFormData({...formData, ingredients: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="e.g., Vitamin C, Hyaluronic Acid" /></div>
                    </div>
                    <div><label className="block text-sm font-medium mb-1">Skin Concerns</label><div className="flex flex-wrap gap-3">{skinConcerns.map(concern => (<label key={concern} className="flex items-center gap-1"><input type="checkbox" onChange={(e) => { const updated = e.target.checked ? [...formData.concerns, concern] : formData.concerns.filter(c => c !== concern); setFormData({...formData, concerns: updated}); }} /><span className="text-sm">{concern}</span></label>))}</div></div>
                  </div>
                )}

                {formData.category === 'Makeup' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-medium">💄 Makeup Specific</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium mb-1">Shade / Color</label><input type="text" value={formData.shade} onChange={(e) => setFormData({...formData, shade: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="e.g., Ruby Red" /></div>
                      <div><label className="block text-sm font-medium mb-1">Finish</label><select value={formData.finish} onChange={(e) => setFormData({...formData, finish: e.target.value})} className="w-full border rounded-lg px-4 py-2.5"><option value="">Select Finish</option>{makeupFinishes.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                    </div>
                    <div><label className="block text-sm font-medium mb-1">Coverage</label><select value={formData.coverage} onChange={(e) => setFormData({...formData, coverage: e.target.value})} className="w-full border rounded-lg px-4 py-2.5"><option value="">Select Coverage</option>{makeupCoverage.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  </div>
                )}

                {formData.category === 'Hair' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-medium">💇‍♀️ Hair Specific</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium mb-1">Hair Type</label><select value={formData.hairType} onChange={(e) => setFormData({...formData, hairType: e.target.value})} className="w-full border rounded-lg px-4 py-2.5">{hairTypes.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}</select></div>
                      <div><label className="block text-sm font-medium mb-1">Hair Concerns</label><div className="flex flex-wrap gap-3">{hairConcernsList.map(concern => (<label key={concern} className="flex items-center gap-1"><input type="checkbox" onChange={(e) => { const updated = e.target.checked ? [...(formData.hairConcerns || []), concern] : (formData.hairConcerns || []).filter(c => c !== concern); setFormData({...formData, hairConcerns: updated}); }} /><span className="text-sm">{concern}</span></label>))}</div></div>
                    </div>
                  </div>
                )}

                {formData.category === 'Clothing' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-medium">👗 Clothing Specific</h3>
                    <div><label className="block text-sm font-medium mb-1">Fabric / Material</label><input type="text" value={formData.fabric} onChange={(e) => setFormData({...formData, fabric: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="e.g., Cotton, Silk, Polyester" /></div>
                    <div><label className="block text-sm font-medium mb-1">Gender</label><select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full border rounded-lg px-4 py-2.5"><option value="unisex">Unisex</option><option value="men">Men</option><option value="women">Women</option><option value="kids">Kids</option></select></div>
                  </div>
                )}

                {formData.category === 'Accessories' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-medium">💍 Accessories Specific</h3>
                    <div><label className="block text-sm font-medium mb-1">Material</label><input type="text" value={formData.material} onChange={(e) => setFormData({...formData, material: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="e.g., Silver, Gold, Leather" /></div>
                    <div><label className="block text-sm font-medium mb-1">Gender</label><select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full border rounded-lg px-4 py-2.5"><option value="unisex">Unisex</option><option value="men">Men</option><option value="women">Women</option><option value="kids">Kids</option></select></div>
                  </div>
                )}

                <div className="flex justify-between mt-6"><button onClick={() => setStep(3)} className="px-6 py-2 border rounded-lg">Back</button><button onClick={() => setStep(5)} className="bg-pink-600 text-white px-6 py-2 rounded-lg">Continue →</button></div>
              </div>
            )}

            {/* Step 5 - SEO */}
            {step === 5 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">🔍 SEO (Optional)</h2>
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">SEO Title</label><input type="text" value={formData.seoTitle} onChange={(e) => setFormData({...formData, seoTitle: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="Leave empty for auto" /></div>
                  <div><label className="block text-sm font-medium mb-1">SEO Description</label><textarea rows="2" value={formData.seoDescription} onChange={(e) => setFormData({...formData, seoDescription: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="Leave empty for auto" /></div>
                  <div><label className="block text-sm font-medium mb-1">SEO Keywords</label><input type="text" value={formData.seoKeywords} onChange={(e) => setFormData({...formData, seoKeywords: e.target.value})} className="w-full border rounded-lg px-4 py-2.5" placeholder="comma, separated, keywords" /></div>
                </div>
                <div className="flex justify-between mt-6"><button onClick={() => setStep(4)} className="px-6 py-2 border rounded-lg">Back</button><button onClick={submitProduct} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded-lg">{loading ? 'Submitting...' : '✓ Submit Product'}</button></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminAddProduct;
