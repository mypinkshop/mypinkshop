import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// 🔥 AMAZON IMPORTER - Multi-URL Support (Styled for your website)
const AmazonImporter = ({ onProductImported, setFormData, setVariations, setImages }) => {
  const [urls, setUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [importedProducts, setImportedProducts] = useState([]);

  const API_URL = 'https://api.mypinkshop.com';
  const token = localStorage.getItem('adminToken');

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
    let descriptionArray = [];
    if (typeof product.description === 'string') {
      descriptionArray = [product.description];
    } else if (Array.isArray(product.description)) {
      descriptionArray = product.description;
    } else if (product.description) {
      descriptionArray = [product.description];
    }
    
    setFormData(prev => ({
      ...prev,
      productName: product.name,
      brand: product.brand || prev.brand,
      sellingPrice: product.price,
      mrp: product.originalPrice || product.price * 1.2,
      fullDescription: descriptionArray,
      keyFeatures: product.keyFeatures || []
    }));
    
    if (product.images && product.images.length > 0) {
      setImages(product.images);
    }
    
    alert(`✅ "${product.name.substring(0, 50)}..." imported to form!`);
    if (onProductImported) onProductImported();
  };

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200 p-5 mb-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-2xl">📦</span> Import from Amazon
        <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full ml-2">Multi-URL Support</span>
      </h3>
      <p className="text-sm text-gray-500 mb-4">Paste Amazon product URLs to automatically fetch product details (Up to 20 URLs)</p>
      
      <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
        {urls.map((url, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              placeholder="https://www.amazon.in/dp/XXXXXXXXXX"
              value={url}
              onChange={(e) => updateUrl(idx, e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 bg-white text-sm"
            />
            {urls.length > 1 && (
              <button onClick={() => removeUrlField(idx)} className="px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition text-sm">
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-3 mb-4">
        <button onClick={addUrlField} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium text-sm flex items-center gap-1">
          ➕ Add Another URL ({urls.length}/20)
        </button>
        <button onClick={fetchAllProducts} disabled={loading} className="px-5 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition disabled:opacity-50 flex items-center gap-2 text-sm">
          {loading ? '⏳ Fetching...' : '🔍 Fetch All Products'}
        </button>
      </div>
      
      {importedProducts.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <h4 className="font-medium text-gray-700 mb-3 text-sm">📋 Fetched Products ({importedProducts.length})</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {importedProducts.map((product, idx) => (
              <div key={idx} className={`p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${product.error ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-200 hover:shadow-sm transition'}`}>
                <div className="flex-1 min-w-0">
                  {product.error ? (
                    <>
                      <p className="text-sm text-red-600 font-medium truncate">❌ Failed: {product.originalUrl}</p>
                      <p className="text-xs text-red-400">{product.error}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">₹{product.price} | {product.brand || 'No brand'}</p>
                    </>
                  )}
                </div>
                {!product.error && (
                  <button onClick={() => importToForm(product)} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition whitespace-nowrap">
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
      if (formData.keyFeatures.length >= 10) {
        alert('⚠️ Maximum 10 key features allowed!');
        return;
      }
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
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-4">
            <Link to="/admin/inventory" className="text-gray-500 hover:text-gray-700 transition">
              <IconBack />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Add New Product</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Create Amazon-style product listings</p>
            </div>
          </div>
          <button 
            onClick={submitProduct} 
            disabled={loading} 
            className="w-full sm:w-auto bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Progress Steps - Responsive */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 overflow-x-auto">
          <div className="flex justify-between min-w-[400px]">
            {['Basic Info', 'Images', 'Pricing', 'Details'].map((label, idx) => (
              <div key={idx} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= idx + 1 ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {step > idx + 1 ? '✓' : idx + 1}
                </div>
                <span className={`text-xs ml-2 hidden sm:inline ${step >= idx + 1 ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TABS - Manual vs Import */}
        <div className="mb-6">
          <div className="flex gap-2 sm:gap-3 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-t-lg transition-all ${
                activeTab === 'manual' 
                  ? 'bg-pink-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ✏️ Manual Entry
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-t-lg transition-all ${
                activeTab === 'import' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📦 Import from Amazon
            </button>
          </div>
        </div>

        {/* AMAZON IMPORTER */}
        {activeTab === 'import' && (
          <AmazonImporter 
            onProductImported={() => setActiveTab('manual')} 
            setFormData={setFormData}
            setVariations={setVariations}
            setImages={setImages}
          />
        )}

        {/* MANUAL ENTRY FORM */}
        {activeTab === 'manual' && (
          <>
            {/* Step 1 - Basic Information */}
            {step === 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-5">📋 Basic Information</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.productName} 
                      onChange={(e) => setFormData({...formData, productName: e.target.value})} 
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 text-sm"
                      placeholder="e.g., Vitamin C Serum with Hyaluronic Acid"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="Search or select brand..." 
                      value={brandSearch} 
                      onChange={(e) => setBrandSearch(e.target.value)} 
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm"
                    />
                    {brandSearch && (
                      <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto shadow-sm">
                        {filteredBrands.map(b => (
                          <button 
                            key={b} 
                            onClick={() => { setFormData({...formData, brand: b}); setBrandSearch(''); }} 
                            className="w-full text-left px-4 py-2 hover:bg-pink-50 text-sm transition"
                          >
                            {b}
                          </button>
                        ))}
                        <button 
                          onClick={() => setShowAddBrand(true)} 
                          className="w-full text-left px-4 py-2 text-pink-600 text-sm hover:bg-pink-50 transition border-t"
                        >
                          + Add new brand
                        </button>
                      </div>
                    )}
                    {formData.brand && !brandSearch && (
                      <div className="mt-2 bg-pink-50 px-4 py-2 rounded-lg flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{formData.brand}</span>
                        <button onClick={() => setFormData({...formData, brand: ''})} className="text-gray-400 hover:text-red-500">✕</button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                      <select 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value, subCategory: ''})} 
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm"
                      >
                        <option value="">Select Category</option>
                        {Object.keys(categories).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Sub Category <span className="text-red-500">*</span></label>
                      <select 
                        value={formData.subCategory} 
                        onChange={(e) => setFormData({...formData, subCategory: e.target.value})} 
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={!formData.category}
                      >
                        <option value="">Select Sub Category</option>
                        {formData.category && categories[formData.category]?.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU (Optional)</label>
                      <input 
                        type="text" 
                        value={formData.sku} 
                        onChange={(e) => setFormData({...formData, sku: e.target.value})} 
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm"
                        placeholder="Auto-generated"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight / Dimensions</label>
                      <input 
                        type="text" 
                        value={formData.weight} 
                        onChange={(e) => setFormData({...formData, weight: e.target.value})} 
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm"
                        placeholder="e.g., 250g, 10x5x2 cm"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button onClick={goToNextStep} className="bg-pink-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-pink-700 transition text-sm">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Add Brand Modal */}
            {showAddBrand && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddBrand(false)}>
                <div className="bg-white rounded-xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <div className="p-5 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">Add New Brand</h3>
                  </div>
                  <div className="p-5">
                    <input 
                      type="text" 
                      value={newBrand} 
                      onChange={(e) => setNewBrand(e.target.value)} 
                      placeholder="Enter brand name" 
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm"
                      autoFocus 
                    />
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => setShowAddBrand(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm">
                        Cancel
                      </button>
                      <button onClick={handleAddNewBrand} className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition text-sm">
                        Add Brand
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 - Images */}
            {step === 2 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-5">📸 Product Images</h2>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-400 transition">
                  <div className="flex flex-wrap gap-3 mb-4 justify-center">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                        <img src={img} className="w-full h-full object-cover" alt={`Product ${idx + 1}`} />
                        <button 
                          onClick={() => removeImage(idx)} 
                          className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="imageUpload" />
                  <label htmlFor="imageUpload" className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-pink-200 rounded-lg cursor-pointer text-pink-600 hover:bg-pink-50 transition text-sm font-medium">
                    <IconUpload /> {uploadingImages ? 'Uploading...' : 'Choose Images'}
                  </label>
                  <p className="text-xs text-gray-400 mt-3">Upload up to 5 images (max 5MB each, automatically compressed)</p>
                </div>
                <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                  <button onClick={() => setStep(1)} className="px-6 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm">
                    ← Back
                  </button>
                  <button onClick={goToNextStep} className="bg-pink-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-pink-700 transition text-sm">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 - Pricing */}
            {step === 3 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-5">💰 Pricing</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">MRP</label>
                    <input 
                      type="number" 
                      value={formData.mrp} 
                      onChange={(e) => setFormData({...formData, mrp: e.target.value})} 
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm"
                      placeholder="₹ 999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Selling Price <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      value={formData.sellingPrice} 
                      onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})} 
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm"
                      placeholder="₹ 499"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax (GST) %</label>
                    <input 
                      type="number" 
                      value={formData.tax} 
                      onChange={(e) => setFormData({...formData, tax: e.target.value})} 
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                  <button onClick={() => setStep(2)} className="px-6 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm">
                    ← Back
                  </button>
                  <button onClick={goToNextStep} className="bg-pink-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-pink-700 transition text-sm">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4 - Product Details (Amazon Style) */}
            {step === 4 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-5">✨ Product Details</h2>
                
                {/* About this item - Bullet Points (Amazon Style) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    About this item <span className="text-xs text-gray-400 ml-2">(Bullet points - Max 8)</span>
                  </label>
                  <div className="space-y-2 mb-3">
                    {formData.fullDescription.map((bullet, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span className="text-pink-500 font-bold mt-0.5">•</span>
                        <span className="flex-1 text-sm text-gray-700">{bullet}</span>
                        <button onClick={() => removeBulletPoint(idx)} className="text-red-400 hover:text-red-600 px-2 text-sm">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  {formData.fullDescription.length < 8 && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        value={currentBullet} 
                        onChange={(e) => setCurrentBullet(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addBulletPoint()}
                        placeholder="e.g., Dermatologically tested for sensitive skin"
                        className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm"
                      />
                      <button onClick={addBulletPoint} className="px-5 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition flex items-center justify-center gap-1 text-sm font-medium">
                        <IconPlus /> Add
                      </button>
                    </div>
                  )}
                </div>

                {/* Product Highlights - Key Features */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Highlights <span className="text-xs text-gray-400 ml-2">(Key features with ✓)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.keyFeatures.map((f, i) => (
                      <span key={i} className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 border border-green-200">
                        ✓ {f}
                        <button onClick={() => removeKeyFeature(i)} className="text-red-400 ml-1 hover:text-red-600">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text" 
                      value={keyFeature} 
                      onChange={(e) => setKeyFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyFeature()}
                      placeholder="e.g., 100% Vegan & Cruelty-free"
                      className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm"
                    />
                    <button onClick={addKeyFeature} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
                      Add Feature
                    </button>
                  </div>
                </div>

                {/* Variations Section */}
                <div className="border-t border-gray-200 pt-5 mb-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">Product Variations</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
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
                        className="bg-pink-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition shadow-sm"
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
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">{variationAttrs.type.charAt(0).toUpperCase() + variationAttrs.type.slice(1)}</th>
                            {variationAttrs.secondary && <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">{variationAttrs.secondary.charAt(0).toUpperCase() + variationAttrs.secondary.slice(1)}</th>}
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Price (₹)</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Stock</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">SKU</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {variations.map((variation) => (
                            <tr key={variation.id} className="hover:bg-pink-50/30">
                              <td className="px-3 py-2 font-medium text-gray-800">{variation.name}</td>
                              {variationAttrs.secondary && <td className="px-3 py-2 text-gray-600">{variation.secondaryName || '-'}</td>}
                              <td className="px-3 py-2 text-right font-medium text-pink-600">₹{variation.price}</td>
                              <td className="px-3 py-2 text-right text-gray-700">{variation.stock}</td>
                              <td className="px-3 py-2 text-xs text-gray-500 font-mono">{variation.sku}</td>
                              <td className="px-3 py-2 text-center">
                                <div className="flex justify-center gap-2">
                                  <button type="button" onClick={() => editVariation(variation)} className="text-blue-500 hover:text-blue-700 text-sm">✏️</button>
                                  <button type="button" onClick={() => deleteVariation(variation.id)} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t border-gray-200">
                          <tr>
                            <td className="px-3 py-2 font-medium text-gray-800">Total</td>
                            {variationAttrs.secondary && <td className="px-3 py-2"></td>}
                            <td className="px-3 py-2 text-right font-bold text-pink-600">₹{variations.reduce((sum, v) => sum + v.price, 0)}</td>
                            <td className="px-3 py-2 text-right font-bold text-gray-800">{variations.reduce((sum, v) => sum + v.stock, 0)}</td>
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
                    <div className="bg-white rounded-xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                      <div className="border-b border-gray-200 p-5 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">{editingVariation ? '✏️ Edit Variation' : `✨ Add New ${variationAttrs.type}`}</h3>
                        <button onClick={() => setVariationModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                      </div>
                      
                      <div className="p-5 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">{variationAttrs.type.charAt(0).toUpperCase() + variationAttrs.type.slice(1)} *</label>
                          <select 
                            value={variationForm.name} 
                            onChange={(e) => setVariationForm({...variationForm, name: e.target.value})} 
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400"
                          >
                            <option value="">Select {variationAttrs.type}</option>
                            {variationAttrs.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                        
                        {variationAttrs.secondary && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">{variationAttrs.secondary.charAt(0).toUpperCase() + variationAttrs.secondary.slice(1)}</label>
                            <select 
                              value={variationForm.attributes.secondary || ''} 
                              onChange={(e) => setVariationForm({...variationForm, attributes: {...variationForm.attributes, secondary: e.target.value}})} 
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400"
                            >
                              <option value="">Select {variationAttrs.secondary}</option>
                              {variationAttrs.secondaryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹) *</label>
                            <input 
                              type="number" 
                              value={variationForm.price} 
                              onChange={(e) => setVariationForm({...variationForm, price: e.target.value})} 
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" 
                              placeholder="499" 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock *</label>
                            <input 
                              type="number" 
                              value={variationForm.stock} 
                              onChange={(e) => setVariationForm({...variationForm, stock: e.target.value})} 
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" 
                              placeholder="10" 
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU (Optional)</label>
                          <input 
                            type="text" 
                            value={variationForm.sku} 
                            onChange={(e) => setVariationForm({...variationForm, sku: e.target.value})} 
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" 
                            placeholder="Auto-generated" 
                          />
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <button type="button" onClick={() => setVariationModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm">
                            Cancel
                          </button>
                          <button type="button" onClick={saveVariation} className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition text-sm">
                            {editingVariation ? 'Update Variation' : 'Add Variation'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Category Specific Fields */}
                {formData.category === 'Skincare' && (
                  <div className="space-y-4 border-t border-gray-200 pt-5 mt-4">
                    <h3 className="font-medium text-gray-800">Skincare Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Skin Type</label>
                        <select value={formData.skinType} onChange={(e) => setFormData({...formData, skinType: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm">
                          <option value="all">All Skin Types</option>
                          <option value="oily">Oily</option>
                          <option value="dry">Dry</option>
                          <option value="combination">Combination</option>
                          <option value="sensitive">Sensitive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Key Ingredients</label>
                        <input type="text" value={formData.ingredients} onChange={(e) => setFormData({...formData, ingredients: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm" placeholder="e.g., Vitamin C, Hyaluronic Acid" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Skin Concerns</label>
                      <div className="flex flex-wrap gap-3">
                        {skinConcerns.map(concern => (
                          <label key={concern} className="flex items-center gap-1.5">
                            <input type="checkbox" onChange={(e) => { const updated = e.target.checked ? [...formData.concerns, concern] : formData.concerns.filter(c => c !== concern); setFormData({...formData, concerns: updated}); }} />
                            <span className="text-sm text-gray-600">{concern}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {formData.category === 'Makeup' && (
                  <div className="space-y-4 border-t border-gray-200 pt-5 mt-4">
                    <h3 className="font-medium text-gray-800">Makeup Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Shade / Color</label>
                        <input type="text" value={formData.shade} onChange={(e) => setFormData({...formData, shade: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm" placeholder="e.g., Ruby Red" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Finish</label>
                        <select value={formData.finish} onChange={(e) => setFormData({...formData, finish: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm">
                          <option value="">Select Finish</option>
                          {makeupFinishes.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Coverage</label>
                      <select value={formData.coverage} onChange={(e) => setFormData({...formData, coverage: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm">
                        <option value="">Select Coverage</option>
                        {makeupCoverage.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {formData.category === 'Hair' && (
                  <div className="space-y-4 border-t border-gray-200 pt-5 mt-4">
                    <h3 className="font-medium text-gray-800">Hair Care Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Hair Type</label>
                        <select value={formData.hairType} onChange={(e) => setFormData({...formData, hairType: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm">
                          {hairTypes.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hair Concerns</label>
                        <div className="flex flex-wrap gap-3">
                          {hairConcernsList.map(concern => (
                            <label key={concern} className="flex items-center gap-1.5">
                              <input type="checkbox" onChange={(e) => { const updated = e.target.checked ? [...(formData.hairConcerns || []), concern] : (formData.hairConcerns || []).filter(c => c !== concern); setFormData({...formData, hairConcerns: updated}); }} />
                              <span className="text-sm text-gray-600">{concern}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formData.category === 'Clothing' && (
                  <div className="space-y-4 border-t border-gray-200 pt-5 mt-4">
                    <h3 className="font-medium text-gray-800">Clothing Details</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Fabric / Material</label>
                      <input type="text" value={formData.fabric} onChange={(e) => setFormData({...formData, fabric: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm" placeholder="e.g., Cotton, Silk, Polyester" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                      <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm">
                        <option value="unisex">Unisex</option>
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                        <option value="kids">Kids</option>
                      </select>
                    </div>
                  </div>
                )}

                {formData.category === 'Accessories' && (
                  <div className="space-y-4 border-t border-gray-200 pt-5 mt-4">
                    <h3 className="font-medium text-gray-800">Accessories Details</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Material</label>
                      <input type="text" value={formData.material} onChange={(e) => setFormData({...formData, material: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm" placeholder="e.g., Silver, Gold, Leather" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                      <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 text-sm">
                        <option value="unisex">Unisex</option>
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                        <option value="kids">Kids</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-4 border-t border-gray-200">
                  <button onClick={() => setStep(3)} className="px-6 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm">
                    ← Back
                  </button>
                  <button onClick={submitProduct} disabled={loading} className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 text-sm">
                    {loading ? 'Saving...' : '✓ Submit Product'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminAddProduct;
