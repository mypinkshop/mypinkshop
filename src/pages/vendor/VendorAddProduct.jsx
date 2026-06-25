import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

// ============================================
// AMAZON IMPORTER COMPONENT (Vendor)
// ============================================
const AmazonImporter = ({ onProductImported, setFormData, setImages, setVariations }) => {
  const [urls, setUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [importedProducts, setImportedProducts] = useState([]);

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
      sellingPrice: product.price,
      mrp: product.originalPrice || product.price * 1.2,
      fullDescription: Array.isArray(product.description) ? product.description.join('\n') : product.description || '',
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

// ============================================
// VARIATION SELECT WITH SEARCH
// ============================================
const VariationSelectWithSearch = ({ 
  label, 
  options, 
  value, 
  onChange, 
  placeholder = "Select or type..." 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  
  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSelect = (selectedValue) => {
    if (selectedValue === '__CUSTOM__') {
      setIsCustomMode(true);
      setCustomValue('');
    } else {
      onChange(selectedValue);
      setSearchTerm('');
      setIsCustomMode(false);
    }
  };
  
  const handleSaveCustom = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
      setIsCustomMode(false);
      setCustomValue('');
      setSearchTerm('');
    }
  };
  
  if (isCustomMode) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5">{label}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Enter custom value..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400"
            autoFocus
          />
          <button onClick={handleSaveCustom} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Save</button>
          <button onClick={() => setIsCustomMode(false)} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">Cancel</button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400"
        />
        {searchTerm && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg max-h-48 overflow-y-auto shadow-lg">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <button key={opt} type="button" onClick={() => handleSelect(opt)} className="w-full text-left px-3 py-2 hover:bg-pink-50 text-sm transition">
                  {opt}
                  {value === opt && <span className="float-right text-green-500">✓</span>}
                </button>
              ))
            ) : (
              <button type="button" onClick={() => handleSelect('__CUSTOM__')} className="w-full text-left px-3 py-2 text-pink-600 hover:bg-pink-50 text-sm border-t">
                + Add custom "{searchTerm}"
              </button>
            )}
          </div>
        )}
        {value && !searchTerm && (
          <div className="mt-2 px-3 py-2 bg-pink-50 rounded-lg text-sm text-pink-600 border border-pink-200 flex justify-between items-center">
            <span>✓ Selected: {value}</span>
            <button onClick={() => setIsCustomMode(true)} className="text-xs text-blue-500 hover:text-blue-700">Change</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN VENDOR ADD PRODUCT
// ============================================
function VendorAddProduct() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('manual');
  const [brands, setBrands] = useState([]);
  
  // ✅ Vendor data from localStorage
  const vendorData = JSON.parse(localStorage.getItem('vendor') || '{}');
  const vendorBrand = vendorData.brandName || vendorData.name || '';
  const vendorId = vendorData._id || vendorData.id || '';

  // Variation states
  const [variations, setVariations] = useState([]);
  const [selectedVariationIds, setSelectedVariationIds] = useState([]);
  const [variationModalOpen, setVariationModalOpen] = useState(false);
  const [editingVariation, setEditingVariation] = useState(null);
  const [variationForm, setVariationForm] = useState({
    name: '', price: '', mrp: '', stock: '', sku: '', image: '', attributes: {}
  });

  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    subCategory: '',
    mrp: '',
    sellingPrice: '',
    tax: 18,
    sku: '',
    quantity: '',
    fullDescription: '',
    keyFeatures: [],
    weight: '',
    dimensions: '',
    shippingCharges: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    slug: ''
  });
  
  const [keyFeature, setKeyFeature] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  // Auto-generate SKU
  const generateSKU = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SKU-${timestamp}-${random}`;
  };

  // Auto-generate SEO
  useEffect(() => {
    if (formData.productName) {
      const slug = formData.productName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      let metaTitle = `${formData.productName}`;
      if (vendorBrand) metaTitle = `${formData.productName} - ${vendorBrand}`;
      metaTitle = `${metaTitle} | MyPinkShop`;
      if (metaTitle.length > 100) metaTitle = metaTitle.substring(0, 97) + '...';
      
      let metaDescription = `Buy ${formData.productName}`;
      if (vendorBrand) metaDescription += ` by ${vendorBrand}`;
      metaDescription += ` at best price. ✓ Free Shipping ✓ COD ✓ Best Quality. Shop now at MyPinkShop!`;
      if (metaDescription.length > 200) metaDescription = metaDescription.substring(0, 197) + '...';
      
      const autoKeywords = [
        vendorBrand,
        formData.category,
        formData.subCategory,
        ...formData.keyFeatures.slice(0, 5),
        'online shopping',
        'best price',
        'MyPinkShop'
      ].filter(Boolean);
      const metaKeywords = [...new Set(autoKeywords)].join(', ');
      
      setFormData(prev => ({
        ...prev,
        metaTitle,
        metaDescription,
        metaKeywords,
        slug
      }));
    }
  }, [formData.productName, vendorBrand, formData.category, formData.subCategory, formData.keyFeatures]);

  // Categories
  const subCategoriesOptions = {
    'Skincare': ['Face Wash', 'Cleanser', 'Serum', 'Moisturizer', 'Sunscreen', 'Face Mask', 'Eye Cream', 'Toner', 'Face Scrub', 'Lip Balm'],
    'Makeup': ['Lipstick', 'Foundation', 'Kajal', 'Eyeshadow', 'Blush', 'Mascara', 'Highlighter', 'Concealer', 'Primer', 'Compact'],
    'Hair': ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Serum', 'Hair Mask', 'Hair Color'],
    'Clothing': ['Dress', 'Top', 'Kurti', 'Saree', 'Jeans', 'T-Shirt', 'Jacket', 'Lehenga'],
    'Accessories': ['Bag', 'Jewelry', 'Watch', 'Sunglasses', 'Belt', 'Scarf', 'Wallet']
  };

  // Variation attributes based on category
  const getVariationAttributes = () => {
    switch(formData.category) {
      case 'Skincare': 
        return { type: 'Size', options: ['15ml', '30ml', '50ml', '100ml', '150ml', '200ml', '250ml', '500ml'], secondary: 'Variant', secondaryOptions: ['Original', 'Herbal', 'Organic'] };
      case 'Makeup': 
        return { type: 'Shade', options: ['Fair', 'Light', 'Medium', 'Tan', 'Deep', 'Red', 'Pink', 'Nude', 'Coral', 'Berry'], secondary: 'Finish', secondaryOptions: ['Matte', 'Glossy', 'Satin', 'Shimmer', 'Dewy'] };
      case 'Hair': 
        return { type: 'Size', options: ['100ml', '200ml', '300ml', '500ml', '1L'], secondary: 'Variant', secondaryOptions: ['Original', 'Herbal', 'Organic', 'Sulfate Free'] };
      case 'Clothing': 
        return { type: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'], secondary: 'Color', secondaryOptions: ['Red', 'Blue', 'Green', 'Black', 'White', 'Pink', 'Purple', 'Yellow'] };
      case 'Accessories': 
        return { type: 'Size', options: ['One Size', 'S', 'M', 'L', 'Free Size'], secondary: 'Color', secondaryOptions: ['Gold', 'Silver', 'Rose Gold', 'Black', 'White', 'Multicolor'] };
      default: 
        return { type: 'Variant', options: ['Default'], secondary: null, secondaryOptions: [] };
    }
  };

  const variationAttrs = getVariationAttributes();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      alert('You can upload maximum 5 images');
      return;
    }
    
    setUploadingImages(true);
    const uploadedUrls = [];
    const previews = [];
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image ${file.name} is larger than 5MB`);
        continue;
      }
      try {
        const preview = URL.createObjectURL(file);
        previews.push(preview);
        
        const formDataImg = new FormData();
        formDataImg.append('images', file);
        
        const response = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('vendorToken')}` },
          body: formDataImg
        });
        
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        uploadedUrls.push(data.url);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }
    
    setImages([...images, ...uploadedUrls]);
    setImagePreview([...imagePreview, ...previews]);
    setUploadingImages(false);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreview(imagePreview.filter((_, i) => i !== index));
  };

  const addKeyFeature = () => {
    if (keyFeature.trim()) {
      if (formData.keyFeatures.length >= 10) return alert('Max 10 features');
      setFormData({ ...formData, keyFeatures: [...formData.keyFeatures, keyFeature.trim()] });
      setKeyFeature('');
    }
  };

  const removeKeyFeature = (index) => {
    setFormData({ ...formData, keyFeatures: formData.keyFeatures.filter((_, i) => i !== index) });
  };

  // Variation functions
  const toggleSelectVariation = (id) => {
    setSelectedVariationIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAllVariations = () => {
    if (selectedVariationIds.length === variations.length) {
      setSelectedVariationIds([]);
    } else {
      setSelectedVariationIds(variations.map(v => v.id));
    }
  };

  const deleteSelectedVariations = () => {
    if (selectedVariationIds.length === 0) {
      alert('Please select variations to delete');
      return;
    }
    if (confirm(`Delete ${selectedVariationIds.length} variation(s)?`)) {
      setVariations(variations.filter(v => !selectedVariationIds.includes(v.id)));
      setSelectedVariationIds([]);
    }
  };

  const saveVariation = () => {
    if (!variationForm.name) return alert(`Please select ${variationAttrs.type}`);
    
    const newVariation = {
      id: editingVariation?.id || Date.now(),
      name: variationForm.name,
      secondaryName: variationForm.attributes.secondary || '',
      price: parseFloat(variationForm.price) || 0,
      mrp: parseFloat(variationForm.mrp) || parseFloat(variationForm.price) * 1.2 || 0,
      stock: parseInt(variationForm.stock) || 0,
      sku: variationForm.sku || `VAR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      image: variationForm.image || '',
      attributes: variationForm.attributes || {}
    };
    
    if (editingVariation) {
      const updated = [...variations];
      updated[variations.findIndex(v => v.id === editingVariation.id)] = newVariation;
      setVariations(updated);
      alert('✅ Variation updated successfully!');
    } else {
      setVariations([...variations, newVariation]);
      alert(`✅ ${variationAttrs.type} added successfully!`);
    }
    setVariationModalOpen(false);
    setEditingVariation(null);
    setVariationForm({ name: '', price: '', mrp: '', stock: '', sku: '', image: '', attributes: {} });
  };

  const editVariation = (variation) => {
    setEditingVariation(variation);
    setVariationForm({ 
      name: variation.name, 
      price: variation.price, 
      mrp: variation.mrp || variation.price * 1.2,
      stock: variation.stock, 
      sku: variation.sku, 
      image: variation.image || '',
      attributes: { secondary: variation.secondaryName || '' } 
    });
    setVariationModalOpen(true);
  };

  const deleteVariation = (variationId) => {
    if (confirm('Delete this variation?')) setVariations(variations.filter(v => v.id !== variationId));
  };

  // ✅ SUBMIT PRODUCT - Brand auto from vendor profile
  const submitProduct = async () => {
    if (!formData.productName) return alert('Enter product name');
    if (!formData.category) return alert('Select category');
    if (!formData.subCategory) return alert('Select sub category');
    if (!formData.sellingPrice) return alert('Enter selling price');
    if (!formData.quantity) return alert('Enter stock quantity');

    setLoading(true);
    const token = localStorage.getItem('vendorToken');
    if (!token) { alert('Session expired'); setLoading(false); return; }

    const totalStock = variations.reduce((sum, v) => sum + (v.stock || 0), 0);
    const finalSku = formData.sku || generateSKU();

    // ✅ Brand auto from vendor profile
    const productData = {
      name: formData.productName,
      brand: vendorBrand, // ✅ Auto from vendor profile
      category: formData.subCategory,
      mainCategory: formData.category,
      subCategory: formData.subCategory,
      subcategory: formData.subCategory,
      price: parseFloat(formData.sellingPrice),
      originalPrice: parseFloat(formData.mrp) || parseFloat(formData.sellingPrice) * 1.2,
      stock: totalStock > 0 ? totalStock : parseInt(formData.quantity),
      sku: finalSku,
      images: images,
      description: formData.fullDescription,
      keyFeatures: formData.keyFeatures,
      weight: formData.weight,
      dimensions: formData.dimensions,
      variations: variations,
      vendorId: vendorId,
      metaTitle: formData.metaTitle,
      metaDescription: formData.metaDescription,
      metaKeywords: formData.metaKeywords,
      slug: formData.slug,
      status: 'active',
      adminApproved: false,
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

      if (!response.ok) throw new Error('Failed to add product');
      
      alert('✅ Product submitted for admin approval!');
      navigate('/vendor/products');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToNextStep = () => {
    if (step === 1) {
      if (!formData.productName) return alert('Enter product name');
      if (!formData.category) return alert('Select category');
      if (!formData.subCategory) return alert('Select sub category');
    }
    if (step === 2 && !images.length) return alert('Upload at least one image');
    if (step === 3 && !formData.sellingPrice) return alert('Enter selling price');
    setStep(step + 1);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      <VendorSidebar activeTab="add-product" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Tabs */}
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

          {/* Amazon Importer */}
          {activeTab === 'import' && (
            <AmazonImporter 
              onProductImported={() => setActiveTab('manual')} 
              setFormData={setFormData}
              setImages={setImages}
              setVariations={setVariations}
            />
          )}

          {/* Manual Entry Form */}
          {activeTab === 'manual' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                <h1 className="text-xl font-semibold text-gray-800">Add New Product</h1>
                <p className="text-sm text-gray-500">List your product on MyPinkShop</p>
                <p className="text-xs text-pink-600 mt-1">🏷️ Your Brand: <strong>{vendorBrand}</strong></p>
              </div>
              
              <div className="flex border-b border-gray-200 bg-white px-6 py-3 overflow-x-auto">
                {['Basic', 'Images', 'Pricing', 'Stock', 'Variations', 'Description', 'SEO'].map((label, idx) => (
                  <div key={idx} className="flex items-center flex-shrink-0">
                    <button onClick={() => setStep(idx + 1)} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition ${step === idx + 1 ? 'bg-pink-600 text-white' : step > idx + 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{idx + 1}</button>
                    <span className={`text-xs ml-1 mr-3 ${step === idx + 1 ? 'text-pink-600 font-medium' : 'text-gray-500'}`}>{label}</span>
                    {idx < 6 && <div className="w-6 h-px bg-gray-300 mr-3"></div>}
                  </div>
                ))}
              </div>
              
              <div className="p-6">
                {/* Step 1 - Basic Information (No Brand Field) */}
                {step === 1 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                        <input type="text" name="productName" value={formData.productName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
                          <option value="">Select Category</option>
                          {Object.keys(subCategoriesOptions).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category *</label>
                        <select name="subCategory" value={formData.subCategory} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" disabled={!formData.category}>
                          <option value="">Select Sub Category</option>
                          {formData.category && subCategoriesOptions[formData.category]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                        <div className="flex gap-2">
                          <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" placeholder="Auto-generated" />
                          <button onClick={() => setFormData({...formData, sku: generateSKU()})} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm whitespace-nowrap">🔄 Generate</button>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <button onClick={goToNextStep} className="bg-pink-600 text-white px-5 py-2 rounded-lg hover:bg-pink-700 transition">Continue →</button>
                    </div>
                  </div>
                )}
                
                {/* Step 2 - Images */}
                {step === 2 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold">Product Images</h2>
                    <div className="border-2 border-dashed border-pink-200 rounded-lg p-6 text-center bg-pink-50/30">
                      <div className="flex flex-wrap gap-3 mb-4">
                        {imagePreview.map((img, idx) => (
                          <div key={idx} className="relative w-24 h-24 bg-white rounded-lg overflow-hidden shadow-md">
                            <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                            <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600">✕</button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => fileInputRef.current.click()} disabled={uploadingImages} className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50">
                        {uploadingImages ? '⏳ Uploading...' : '📸 Upload Images'}
                      </button>
                      <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <p className="text-xs text-gray-400 mt-2">Upload up to 5 images. Max 5MB each. First image will be the main product image.</p>
                    </div>
                    <div className="flex justify-between pt-4">
                      <button onClick={() => setStep(1)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">← Back</button>
                      <button onClick={goToNextStep} className="bg-pink-600 text-white px-5 py-2 rounded-lg hover:bg-pink-700 transition">Continue →</button>
                    </div>
                  </div>
                )}
                
                {/* Step 3 - Pricing */}
                {step === 3 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold">Pricing</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">MRP</label>
                        <input type="number" name="mrp" value={formData.mrp} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" placeholder="₹ 999" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                        <input type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" placeholder="₹ 499" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax (GST) %</label>
                        <input type="number" name="tax" value={formData.tax} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" placeholder="18" />
                      </div>
                    </div>
                    <div className="flex justify-between pt-4">
                      <button onClick={() => setStep(2)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">← Back</button>
                      <button onClick={goToNextStep} className="bg-pink-600 text-white px-5 py-2 rounded-lg hover:bg-pink-700 transition">Continue →</button>
                    </div>
                  </div>
                )}
                
                {/* Step 4 - Stock */}
                {step === 4 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold">Inventory</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity / Stock *</label>
                        <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" placeholder="10" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                        <input type="text" name="weight" value={formData.weight} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" placeholder="e.g., 250g" />
                      </div>
                    </div>
                    <div className="flex justify-between pt-4">
                      <button onClick={() => setStep(3)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">← Back</button>
                      <button onClick={goToNextStep} className="bg-pink-600 text-white px-5 py-2 rounded-lg hover:bg-pink-700 transition">Continue →</button>
                    </div>
                  </div>
                )}
                
                {/* Step 5 - Variations */}
                {step === 5 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold">Product Variations</h2>
                    
                    <div className="flex justify-between items-center">
                      <button 
                        onClick={() => { 
                          setEditingVariation(null); 
                          setVariationForm({ name: '', price: '', mrp: '', stock: '', sku: '', image: '', attributes: {} }); 
                          setVariationModalOpen(true); 
                        }} 
                        className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center gap-2"
                        disabled={!formData.category}
                      >
                        ➕ Add {variationAttrs.type}
                      </button>
                      {variations.length > 0 && (
                        <div className="flex gap-2">
                          <button onClick={selectAllVariations} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition">Select All</button>
                          <button onClick={deleteSelectedVariations} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition">🗑️ Delete Selected</button>
                        </div>
                      )}
                    </div>

                    {!formData.category ? (
                      <div className="bg-yellow-50 rounded-lg p-4 text-center"><p className="text-yellow-700 text-sm">Select a category first</p></div>
                    ) : variations.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-6 text-center"><p className="text-gray-400 text-sm">No variations added yet. Click "Add {variationAttrs.type}" to add.</p></div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr className="border-b border-gray-200">
                              <th className="px-3 py-2 text-center w-10"><input type="checkbox" checked={selectedVariationIds.length === variations.length && variations.length > 0} onChange={selectAllVariations} /></th>
                              <th className="px-3 py-2 text-left">{variationAttrs.type}</th>
                              {variationAttrs.secondary && <th className="px-3 py-2 text-left">{variationAttrs.secondary}</th>}
                              <th className="px-3 py-2 text-right">Price</th>
                              <th className="px-3 py-2 text-right">Stock</th>
                              <th className="px-3 py-2 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {variations.map(v => (
                              <tr key={v.id} className="hover:bg-pink-50/30 transition">
                                <td className="px-3 py-2 text-center">
                                  <input type="checkbox" checked={selectedVariationIds.includes(v.id)} onChange={() => toggleSelectVariation(v.id)} />
                                </td>
                                <td className="px-3 py-2 font-medium">{v.name}</td>
                                {variationAttrs.secondary && <td className="px-3 py-2">{v.secondaryName || '-'}</td>}
                                <td className="px-3 py-2 text-right text-pink-600 font-medium">₹{v.price}</td>
                                <td className="px-3 py-2 text-right">{v.stock}</td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button onClick={() => editVariation(v)} className="text-blue-500 hover:text-blue-700" title="Edit">✏️</button>
                                    <button onClick={() => deleteVariation(v.id)} className="text-red-500 hover:text-red-700" title="Delete">🗑️</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 border-t border-gray-200">
                            <tr>
                              <td colSpan={variationAttrs.secondary ? 3 : 2} className="px-3 py-2 font-medium">Total</td>
                              <td className="px-3 py-2 text-right font-bold text-pink-600">₹{variations.reduce((s, v) => s + v.price, 0)}</td>
                              <td className="px-3 py-2 text-right font-bold">{variations.reduce((s, v) => s + v.stock, 0)}</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <button onClick={() => setStep(4)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">← Back</button>
                      <button onClick={goToNextStep} className="bg-pink-600 text-white px-5 py-2 rounded-lg hover:bg-pink-700 transition">Continue →</button>
                    </div>
                  </div>
                )}
                
                {/* Step 6 - Description */}
                {step === 6 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold">Product Description</h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                      <textarea name="fullDescription" rows="5" value={formData.fullDescription} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" placeholder="Describe your product in detail..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Key Features</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.keyFeatures.map((f, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm">
                            ✓ {f}
                            <button onClick={() => removeKeyFeature(idx)} className="text-red-500 ml-1 hover:text-red-700">✕</button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" value={keyFeature} onChange={(e) => setKeyFeature(e.target.value)} placeholder="e.g., Dermatologically tested" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" onKeyPress={(e) => e.key === 'Enter' && addKeyFeature()} />
                        <button onClick={addKeyFeature} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Add</button>
                      </div>
                    </div>
                    <div className="flex justify-between pt-4">
                      <button onClick={() => setStep(5)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">← Back</button>
                      <button onClick={goToNextStep} className="bg-pink-600 text-white px-5 py-2 rounded-lg hover:bg-pink-700 transition">Continue →</button>
                    </div>
                  </div>
                )}
                
                {/* Step 7 - SEO */}
                {step === 7 && (
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold">Search Engine Optimization</h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product URL Slug</label>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500">mypinkshop.com/product/</span>
                        <code className="text-sm text-pink-600">{formData.slug || 'product-slug'}</code>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                      <input type="text" name="metaTitle" value={formData.metaTitle} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                      <textarea name="metaDescription" rows="2" value={formData.metaDescription} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                      <input type="text" name="metaKeywords" value={formData.metaKeywords} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
                    </div>
                    <div className="flex justify-between pt-4">
                      <button onClick={() => setStep(6)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">← Back</button>
                      <button onClick={submitProduct} disabled={loading} className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold">
                        {loading ? 'Submitting...' : '✓ Submit for Approval'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Variation Modal */}
      {variationModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setVariationModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingVariation ? 'Edit' : 'Add New'} {variationAttrs.type}</h3>
              <button onClick={() => setVariationModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            <div className="p-5 space-y-4">
              <VariationSelectWithSearch 
                label={`${variationAttrs.type} *`}
                options={variationAttrs.options}
                value={variationForm.name}
                onChange={(val) => setVariationForm({...variationForm, name: val})}
                placeholder={`Search or type custom ${variationAttrs.type.toLowerCase()}...`}
              />
              
              {variationAttrs.secondary && (
                <VariationSelectWithSearch 
                  label={variationAttrs.secondary}
                  options={variationAttrs.secondaryOptions}
                  value={variationForm.attributes.secondary || ''}
                  onChange={(val) => setVariationForm({...variationForm, attributes: {...variationForm.attributes, secondary: val}})}
                  placeholder={`Search or type custom ${variationAttrs.secondary.toLowerCase()}...`}
                />
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Selling Price *</label>
                  <input type="number" value={variationForm.price} onChange={(e) => setVariationForm({...variationForm, price: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="499" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">MRP</label>
                  <input type="number" value={variationForm.mrp} onChange={(e) => setVariationForm({...variationForm, mrp: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="599" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Stock *</label>
                  <input type="number" value={variationForm.stock} onChange={(e) => setVariationForm({...variationForm, stock: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="10" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">SKU</label>
                  <input type="text" value={variationForm.sku} onChange={(e) => setVariationForm({...variationForm, sku: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Auto-generated" />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button onClick={() => setVariationModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={saveVariation} className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition">
                  {editingVariation ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorAddProduct;
