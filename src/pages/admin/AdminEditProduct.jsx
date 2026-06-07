import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

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

function AdminEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [showAddSubCategory, setShowAddSubCategory] = useState(false);
  const [newSubCategory, setNewSubCategory] = useState('');
  
  const [variations, setVariations] = useState([]);
  const [selectedVariationIds, setSelectedVariationIds] = useState([]);
  const [variationModalOpen, setVariationModalOpen] = useState(false);
  const [editingVariation, setEditingVariation] = useState(null);
  const [variationForm, setVariationForm] = useState({
    name: '', price: '', mrp: '', stock: '', sku: '', image: '', attributes: {}
  });
  
  const [brands, setBrands] = useState([
    'Nykaa Beauty', 'Mamaearth', 'Sugar Cosmetics', 'The Face Shop', 
    'Lakmé', 'MyGlamm', 'Plum', 'Wow Skin Science', 'Biotique', 
    'Forest Essentials', 'Kama Ayurveda', 'Mcaffeine', 'St.Botanica',
    'Loreal Paris', 'Maybelline', 'Clinique', 'Estee Lauder', 'Huda Beauty', 'MAC'
  ]);
  
  const [customSubCategories, setCustomSubCategories] = useState({
    Skincare: [], Makeup: [], Hair: [], Clothing: [], Accessories: []
  });

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    subCategory: '',
    price: '',
    originalPrice: '',
    stock: '',
    description: [],
    shortDescription: '',
    keyFeatures: [],
    specifications: {},
    images: [],
    sku: '',
    weight: '',
    dimensions: '',
    tax: 5,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    slug: '',
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
    gender: 'unisex'
  });
  
  const [keyFeatureInput, setKeyFeatureInput] = useState('');
  const [specKeyInput, setSpecKeyInput] = useState('');
  const [specValueInput, setSpecValueInput] = useState('');
  const [currentBullet, setCurrentBullet] = useState('');

  const API_URL = 'https://api.mypinkshop.com';

  const categories = {
    'Skincare': ['Face Wash', 'Cleanser', 'Serum', 'Moisturizer', 'Sunscreen', 'Face Mask', 'Eye Cream', 'Lip Balm', 'Toner', 'Face Scrub', 'Body Lotion', 'Body Wash'],
    'Makeup': ['Foundation', 'Lipstick', 'Kajal', 'Eyeshadow', 'Blush', 'Compact', 'Mascara', 'Highlighter', 'Lip Liner', 'Concealer', 'Primer', 'Setting Spray'],
    'Hair': ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Serum', 'Hair Mask', 'Hair Color', 'Hair Spray', 'Anti Dandruff', 'Hair Fall Control'],
    'Clothing': ['Dress', 'Top', 'Kurti', 'Saree', 'Jeans', 'T-Shirt', 'Shorts', 'Jacket', 'Sweater', 'Lehenga', 'Salwar Suit', 'Activewear'],
    'Accessories': ['Bag', 'Jewelry', 'Watch', 'Sunglasses', 'Hair Accessory', 'Belt', 'Scarf', 'Wallet', 'Cap', 'Gloves']
  };

  const skinConcerns = ['Acne', 'Aging', 'Pigmentation', 'Dryness', 'Dullness', 'Oil Control', 'Redness', 'Dark Spots'];

  const getVariationAttributes = () => {
    switch(formData.category) {
      case 'Skincare': 
        return { type: 'Size', options: ['15ml', '30ml', '50ml', '100ml', '150ml', '200ml', '250ml', '500ml'], secondary: 'Variant', secondaryOptions: ['Original', 'Herbal', 'Organic', 'Ayurvedic'] };
      case 'Makeup': 
        return { type: 'Shade', options: ['Fair', 'Light', 'Medium', 'Tan', 'Deep', 'Red', 'Pink', 'Nude', 'Coral', 'Berry'], secondary: 'Finish', secondaryOptions: ['Matte', 'Glossy', 'Satin', 'Shimmer', 'Dewy', 'Metallic'] };
      case 'Hair': 
        return { type: 'Size', options: ['100ml', '200ml', '300ml', '500ml', '1L'], secondary: 'Variant', secondaryOptions: ['Original', 'Herbal', 'Organic', 'Sulfate Free'] };
      case 'Clothing': 
        return { type: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'], secondary: 'Color', secondaryOptions: ['Red', 'Blue', 'Green', 'Black', 'White', 'Pink', 'Purple', 'Yellow', 'Navy', 'Grey'] };
      case 'Accessories': 
        return { type: 'Size', options: ['One Size', 'S', 'M', 'L', 'Free Size', 'Adjustable'], secondary: 'Color', secondaryOptions: ['Gold', 'Silver', 'Rose Gold', 'Black', 'White', 'Multicolor'] };
      default: 
        return { type: 'Variant', options: ['Default'], secondary: null, secondaryOptions: [] };
    }
  };

  const variationAttrs = getVariationAttributes();

  // Load product data from API
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        if (!token) {
          navigate('/admin/login');
          return;
        }

        const response = await fetch(`${API_URL}/api/products/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load product');

        const product = await response.json();

        let descriptionArray = [];
        if (Array.isArray(product.description)) {
          descriptionArray = product.description;
        } else if (typeof product.description === 'string' && product.description) {
          descriptionArray = product.description.split('\n').filter(b => b.trim());
        }

        setFormData({
          name: product.name || '',
          brand: product.brand || '',
          category: product.mainCategory || product.category || '',
          subCategory: product.category || '',
          price: product.price || '',
          originalPrice: product.originalPrice || '',
          stock: product.stock || '',
          description: descriptionArray,
          shortDescription: product.shortDescription || '',
          keyFeatures: product.keyFeatures || [],
          specifications: product.productDetails || product.specifications || {},
          images: product.images || [],
          sku: product.sku || '',
          weight: product.weight || '',
          dimensions: product.dimensions || '',
          tax: product.tax || 5,
          metaTitle: product.metaTitle || '',
          metaDescription: product.metaDescription || '',
          metaKeywords: product.metaKeywords || '',
          slug: product.slug || '',
          skinType: product.skinType || 'all',
          concerns: product.concerns || [],
          ingredients: product.ingredients || '',
          finish: product.finish || '',
          coverage: product.coverage || '',
          shade: product.shade || '',
          hairType: product.hairType || 'all',
          hairConcerns: product.hairConcerns || [],
          fabric: product.fabric || '',
          material: product.material || '',
          gender: product.gender || 'unisex'
        });

        if (product.variations && product.variations.length > 0) {
          setVariations(product.variations);
        } else if (product.variants && product.variants.length > 0) {
          setVariations(product.variants);
        }

      } catch (error) {
        console.error('Error loading product:', error);
        alert('Failed to load product. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) loadProduct();
  }, [id, navigate]);

  useEffect(() => {
    const savedBrands = localStorage.getItem('brandsList');
    if (savedBrands) setBrands(JSON.parse(savedBrands));
    const savedSubCategories = localStorage.getItem('customSubCategories');
    if (savedSubCategories) setCustomSubCategories(JSON.parse(savedSubCategories));
  }, []);

  const saveBrands = (updatedBrands) => {
    setBrands(updatedBrands);
    localStorage.setItem('brandsList', JSON.stringify(updatedBrands));
  };

  const saveCustomSubCategory = (category, newSubCat) => {
    const updated = { ...customSubCategories, [category]: [...(customSubCategories[category] || []), newSubCat] };
    setCustomSubCategories(updated);
    localStorage.setItem('customSubCategories', JSON.stringify(updated));
  };

  const getCurrentSubCategories = () => {
    const category = formData.category;
    if (!category) return [];
    const defaultOptions = categories[category] || [];
    const customOptions = customSubCategories[category] || [];
    return [...defaultOptions, ...customOptions];
  };

  const handleAddNewSubCategory = () => {
    if (newSubCategory.trim() && formData.category) {
      const currentOptions = getCurrentSubCategories();
      if (!currentOptions.includes(newSubCategory.trim())) {
        saveCustomSubCategory(formData.category, newSubCategory.trim());
        setFormData({ ...formData, subCategory: newSubCategory.trim() });
        setNewSubCategory('');
        setShowAddSubCategory(false);
        alert(`✅ Sub-category added!`);
      } else alert('⚠️ Already exists!');
    }
  };

  const handleAddNewBrand = () => {
    if (newBrand.trim() && !brands.includes(newBrand.trim())) {
      saveBrands([...brands, newBrand.trim()]);
      setFormData({ ...formData, brand: newBrand.trim() });
      setNewBrand('');
      setShowAddBrand(false);
      alert(`✅ Brand added!`);
    } else alert('Invalid or duplicate brand');
  };

  const filteredBrands = brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()));

  const generateSKU = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SKU-${timestamp}-${random}`;
  };

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
      sku: variationForm.sku || `VAR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      image: variationForm.image || '',
      attributes: variationForm.attributes || {}
    };
    
    if (editingVariation) {
      const updated = variations.map(v => 
        v.id === editingVariation.id ? newVariation : v
      );
      setVariations(updated);
      alert('✅ Variation updated successfully!');
    } else {
      const exists = variations.some(v => v.name === variationForm.name && v.secondaryName === variationForm.attributes.secondary);
      if (exists) return alert(`⚠️ This ${variationAttrs.type} combination already exists!`);
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
    if (confirm('Delete this variation?')) {
      setVariations(variations.filter(v => v.id !== variationId));
      setSelectedVariationIds(prev => prev.filter(id => id !== variationId));
    }
  };

  const uploadVariationImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formDataImg = new FormData();
    formDataImg.append('images', file);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataImg
      });
      const data = await response.json();
      if (data.url) {
        setVariationForm({ ...variationForm, image: data.url });
        alert('✅ Image uploaded!');
      }
    } catch (error) {
      alert('Upload failed');
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width, height = img.height;
          const maxWidth = 800;
          if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() })), 'image/jpeg', 0.7);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const uploadImageToBackend = async (file) => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('Session expired');
    try {
      const compressedFile = await compressImage(file);
      const formDataImg = new FormData();
      formDataImg.append('images', compressedFile);
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataImg
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      return data.url;
    } catch (error) { throw error; }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 5) return alert('Maximum 5 images');
    setUploadingImages(true);
    const uploadedUrls = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { alert(`${file.name} > 5MB`); continue; }
      try {
        const url = await uploadImageToBackend(file);
        uploadedUrls.push(url);
      } catch (error) { alert(`Failed: ${file.name}`); }
    }
    if (uploadedUrls.length) {
      setFormData({ ...formData, images: [...formData.images, ...uploadedUrls] });
      alert(`✅ ${uploadedUrls.length} image(s) uploaded!`);
    }
    setUploadingImages(false);
  };

  const removeImage = (index) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const addBulletPoint = () => {
    const text = currentBullet.trim();
    if (text) {
      if (formData.description.length >= 15) return alert('Max 15 bullet points');
      setFormData({ ...formData, description: [...formData.description, text] });
      setCurrentBullet('');
    }
  };

  const removeBulletPoint = (index) => {
    setFormData({ ...formData, description: formData.description.filter((_, i) => i !== index) });
  };

  const addKeyFeature = () => {
    if (keyFeatureInput.trim()) {
      if (formData.keyFeatures.length >= 10) return alert('Max 10 features');
      setFormData({ ...formData, keyFeatures: [...formData.keyFeatures, keyFeatureInput.trim()] });
      setKeyFeatureInput('');
    }
  };

  const removeKeyFeature = (index) => {
    setFormData({ ...formData, keyFeatures: formData.keyFeatures.filter((_, i) => i !== index) });
  };

  const addSpecification = () => {
    if (specKeyInput.trim() && specValueInput.trim()) {
      setFormData({
        ...formData,
        specifications: { ...formData.specifications, [specKeyInput.trim()]: specValueInput.trim() }
      });
      setSpecKeyInput('');
      setSpecValueInput('');
    }
  };

  const removeSpecification = (key) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[key];
    setFormData({ ...formData, specifications: newSpecs });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔥 FIXED: Strong submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) return alert('Enter product name');
    if (!formData.brand) return alert('Select brand');
    if (!formData.category) return alert('Select category');
    if (!formData.subCategory) return alert('Select sub category');

    setSaving(true);
    const token = localStorage.getItem('adminToken');
    if (!token) { 
      alert('Session expired. Please login again.');
      navigate('/admin/login');
      setSaving(false);
      return; 
    }

    const finalSku = formData.sku || generateSKU();

    // 🔥 CRITICAL: Make sure variations are properly structured
    const cleanVariations = variations.map(v => ({
      id: v.id,
      name: v.name,
      secondaryName: v.secondaryName || '',
      price: Number(v.price),
      mrp: Number(v.mrp) || Number(v.price) * 1.2,
      stock: Number(v.stock),
      sku: v.sku || `VAR-${v.id}`,
      image: v.image || '',
      attributes: v.attributes || {}
    }));

    const productData = {
      name: formData.name,
      brand: formData.brand,
      category: formData.subCategory,
      mainCategory: formData.category,
      price: parseFloat(formData.price),
      originalPrice: parseFloat(formData.originalPrice) || parseFloat(formData.price) * 1.2,
      tax: parseFloat(formData.tax) || 5,
      stock: parseInt(formData.stock) || 0,
      sku: finalSku,
      images: formData.images,
      description: formData.description,
      keyFeatures: formData.keyFeatures,
      productDetails: formData.specifications,
      weight: formData.weight,
      dimensions: formData.dimensions,
      metaTitle: formData.metaTitle,
      metaDescription: formData.metaDescription,
      metaKeywords: formData.metaKeywords,
      slug: formData.slug,
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
      variations: cleanVariations,
      status: 'active'
    };

    console.log('Saving product with variations:', cleanVariations.length);

    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Update failed');
      }
      
      alert(`✅ Product updated successfully! ${cleanVariations.length} variations saved.`);
      navigate('/admin/inventory');
    } catch (error) {
      console.error('Update error:', error);
      alert(`❌ Update failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const IconBack = () => (<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>);
  const IconUpload = () => (<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>);
  const IconPlus = () => (<svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50/30">
      <AdminSidebar />
      
      <div className="md:ml-64">
        <div className="bg-white/95 backdrop-blur-md border-b border-pink-100 sticky top-0 z-40 shadow-sm">
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <Link to="/admin/inventory" className="text-gray-500 hover:text-pink-600 transition p-1">
                  <IconBack />
                </Link>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Edit Product</h1>
                  <p className="text-xs text-gray-400 hidden sm:block">Update product details and variations</p>
                </div>
              </div>
              <button onClick={handleSubmit} disabled={saving} className="w-full sm:w-auto bg-gradient-to-r from-pink-600 to-rose-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm font-medium hover:shadow-md transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-4 sm:p-6">
            <form className="space-y-6">
              
              {/* Basic Information */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">📋 Basic Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand *</label>
                    <div className="relative">
                      <input type="text" placeholder="Type brand name..." value={formData.brand} onChange={(e) => { setFormData({...formData, brand: e.target.value}); setBrandSearch(e.target.value); }} className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" />
                      {brandSearch && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg max-h-48 overflow-y-auto shadow-lg">
                          {filteredBrands.slice(0, 10).map(b => (<button key={b} type="button" onClick={() => { setFormData({...formData, brand: b}); setBrandSearch(''); }} className="w-full text-left px-3 sm:px-4 py-2 hover:bg-pink-50 text-sm">{b}</button>))}
                          <button type="button" onClick={() => setShowAddBrand(true)} className="w-full text-left px-3 sm:px-4 py-2 text-pink-600 text-sm hover:bg-pink-50 border-t font-medium">+ Add new brand "{brandSearch}"</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm bg-white" required>
                      <option value="">Select Category</option>
                      {Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Sub Category *</label>
                    <div className="flex gap-2">
                      <select name="subCategory" value={formData.subCategory} onChange={handleChange} className="flex-1 border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm disabled:bg-gray-100 bg-white" disabled={!formData.category}>
                        <option value="">Select Sub Category</option>
                        {getCurrentSubCategories().map(sub => <option key={sub} value={sub}>{sub}</option>)}
                      </select>
                      {formData.category && (
                        <button type="button" onClick={() => setShowAddSubCategory(true)} className="px-3 py-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 text-sm whitespace-nowrap">+ Add</button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU (Editable)</label>
                    <div className="flex gap-2">
                      <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="flex-1 border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" placeholder="Auto-generated" />
                      <button type="button" onClick={() => setFormData({...formData, sku: generateSKU()})} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm whitespace-nowrap">🔄 Generate</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight / Dimensions</label>
                    <input type="text" name="weight" value={formData.weight} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" placeholder="e.g., 250g" />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">📸 Product Images</h2>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-pink-400 transition">
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 justify-center">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                        <img src={img} className="w-full h-full object-cover" alt="Product" />
                        <button type="button" onClick={() => removeImage(idx)} className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600">✕</button>
                      </div>
                    ))}
                  </div>
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="imageUpload" />
                  <label htmlFor="imageUpload" className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border-2 border-pink-200 rounded-lg cursor-pointer text-pink-600 hover:bg-pink-50 transition text-sm font-medium">
                    <IconUpload /> {uploadingImages ? 'Uploading...' : 'Choose Images'}
                  </label>
                  <p className="text-xs text-gray-400 mt-3">Upload up to 5 images (max 5MB each)</p>
                </div>
              </div>

              {/* Pricing */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">💰 Pricing</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">MRP</label><input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" placeholder="₹ 999" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Selling Price *</label><input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" placeholder="₹ 499" required /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Stock *</label><input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" placeholder="10" required /></div>
                </div>
              </div>

              {/* Variations Section */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800">🎨 Product Variations</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{!formData.category && 'Select a category first'}</p>
                  </div>
                  <div className="flex gap-2">
                    {variations.length > 0 && (
                      <>
                        <button type="button" onClick={selectAllVariations} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition">
                          {selectedVariationIds.length === variations.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <button type="button" onClick={deleteSelectedVariations} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition">
                          Delete Selected ({selectedVariationIds.length})
                        </button>
                      </>
                    )}
                    {formData.category && (
                      <button type="button" onClick={() => { setEditingVariation(null); setVariationForm({ name: '', price: '', mrp: '', stock: '', sku: '', image: '', attributes: {} }); setVariationModalOpen(true); }} 
                        className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-4 sm:px-5 py-1.5 rounded-lg text-sm font-medium hover:shadow-md transition">
                        + Add {variationAttrs.type}
                      </button>
                    )}
                  </div>
                </div>
                
                {!formData.category ? (
                  <div className="bg-yellow-50 rounded-lg p-4 text-center"><p className="text-yellow-700 text-sm">Select a category first</p></div>
                ) : variations.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 text-center"><p className="text-gray-400 text-sm">No variations added yet. Click "Add {variationAttrs.type}" to add.</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="px-3 py-2 text-center w-10">
                            <input type="checkbox" checked={selectedVariationIds.length === variations.length && variations.length > 0} onChange={selectAllVariations} />
                          </th>
                          <th className="px-3 py-2 text-left">{variationAttrs.type}</th>
                          {variationAttrs.secondary && <th className="px-3 py-2 text-left">{variationAttrs.secondary}</th>}
                          <th className="px-3 py-2 text-left">Image</th>
                          <th className="px-3 py-2 text-right">Price</th>
                          <th className="px-3 py-2 text-right">MRP</th>
                          <th className="px-3 py-2 text-right">Stock</th>
                          <th className="px-3 py-2 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {variations.map(v => (
                          <tr key={v.id} className="hover:bg-pink-50/30">
                            <td className="px-3 py-2 text-center">
                              <input type="checkbox" checked={selectedVariationIds.includes(v.id)} onChange={() => toggleSelectVariation(v.id)} />
                            </td>
                            <td className="px-3 py-2 font-medium">{v.name}</td>
                            {variationAttrs.secondary && <td className="px-3 py-2">{v.secondaryName || '-'}</td>}
                            <td className="px-3 py-2">
                              {v.image ? (
                                <img src={v.image} className="w-8 h-8 object-cover rounded" alt="variation" />
                              ) : (
                                <span className="text-gray-400 text-xs">No image</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right text-pink-600">₹{v.price}</td>
                            <td className="px-3 py-2 text-right text-gray-400 line-through">₹{v.mrp}</td>
                            <td className="px-3 py-2 text-right">{v.stock}</td>
                            <td className="px-3 py-2 text-center">
                              <div className="flex justify-center gap-2">
                                <button type="button" onClick={() => editVariation(v)} className="text-blue-500" title="Edit">✏️</button>
                                <button type="button" onClick={() => deleteVariation(v.id)} className="text-red-500" title="Delete">🗑️</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr className="border-t border-gray-200">
                          <td colSpan={variationAttrs.secondary ? 4 : 3} className="px-3 py-2 font-medium">Total</td>
                          <td className="px-3 py-2 text-right font-bold text-pink-600">₹{variations.reduce((s, v) => s + v.price, 0)}</td>
                          <td className="px-3 py-2 text-right"></td>
                          <td className="px-3 py-2 text-right font-bold">{variations.reduce((s, v) => s + v.stock, 0)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

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
                      
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Variation Image</label>
                        <div className="flex items-center gap-3">
                          {variationForm.image ? (
                            <div className="relative">
                              <img src={variationForm.image} className="w-16 h-16 object-cover rounded border" alt="variation" />
                              <button type="button" onClick={() => setVariationForm({...variationForm, image: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                            </div>
                          ) : (
                            <div className="flex-1">
                              <input type="file" accept="image/*" onChange={uploadVariationImage} className="hidden" id="variationImageUpload" />
                              <label htmlFor="variationImageUpload" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm cursor-pointer hover:bg-gray-200 transition">
                                📷 Upload Image
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                      
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
                        <button type="button" onClick={() => setVariationModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                        <button type="button" onClick={saveVariation} className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-medium hover:shadow-md transition">{editingVariation ? 'Update' : 'Add'}</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">📝 About this item</h2>
                <div className="space-y-2 mb-3">
                  {formData.description.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-100">
                      <span className="text-pink-500 font-bold mt-0.5">•</span>
                      <span className="flex-1 text-xs sm:text-sm text-gray-700">{bullet}</span>
                      <button type="button" onClick={() => removeBulletPoint(idx)} className="text-red-400 hover:text-red-600">✕</button>
                    </div>
                  ))}
                </div>
                {formData.description.length < 15 && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" value={currentBullet} onChange={(e) => setCurrentBullet(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addBulletPoint()} placeholder="e.g., Dermatologically tested" className="flex-1 border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" />
                    <button type="button" onClick={addBulletPoint} className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:shadow-md transition flex items-center justify-center gap-1 text-sm font-medium"><IconPlus /> Add</button>
                  </div>
                )}
              </div>

              {/* Key Features */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">✨ Product Highlights</h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.keyFeatures.map((f, i) => (
                    <span key={i} className="bg-green-50 text-green-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1 border border-green-200">✓ {f}<button type="button" onClick={() => removeKeyFeature(i)} className="text-red-400 ml-1">×</button></span>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" value={keyFeatureInput} onChange={(e) => setKeyFeatureInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addKeyFeature()} placeholder="e.g., 100% Vegan" className="flex-1 border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" />
                  <button type="button" onClick={addKeyFeature} className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">Add Feature</button>
                </div>
              </div>

              {/* Specifications */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">📊 Specifications</h2>
                <div className="space-y-2 mb-3">
                  {Object.entries(formData.specifications).map(([key, value]) => (
                    <div key={key} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg">
                      <span className="w-1/3 text-sm font-medium">{key}</span>
                      <span className="flex-1 text-sm">{value}</span>
                      <button type="button" onClick={() => removeSpecification(key)} className="text-red-400 hover:text-red-600">✕</button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" placeholder="Key (e.g., Material)" value={specKeyInput} onChange={(e) => setSpecKeyInput(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" />
                  <input type="text" placeholder="Value (e.g., Cotton)" value={specValueInput} onChange={(e) => setSpecValueInput(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" />
                  <button type="button" onClick={addSpecification} className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">Add</button>
                </div>
              </div>

              {/* SEO */}
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">🔍 SEO Settings</h2>
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Title</label><input type="text" name="metaTitle" value={formData.metaTitle} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Description</label><textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows="3" className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm"></textarea></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Keywords</label><input type="text" name="metaKeywords" value={formData.metaKeywords} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" placeholder="Comma separated" /></div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                <Link to="/admin/inventory" className="px-5 sm:px-6 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm text-center">Cancel</Link>
                <button type="button" onClick={handleSubmit} disabled={saving} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium hover:shadow-md transition disabled:opacity-50 text-sm">{saving ? 'Saving...' : '✓ Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddBrand && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddBrand(false)}>
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-5 border-b border-gray-200"><h3 className="font-semibold text-gray-800">Add New Brand</h3></div>
            <div className="p-4 sm:p-5"><input type="text" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="Enter brand name" className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" autoFocus />
              <div className="flex gap-3 mt-5"><button onClick={() => setShowAddBrand(false)} className="flex-1 px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Cancel</button><button onClick={handleAddNewBrand} className="flex-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:shadow-md text-sm">Add Brand</button></div>
            </div>
          </div>
        </div>
      )}

      {showAddSubCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddSubCategory(false)}>
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-5 border-b border-gray-200"><h3 className="font-semibold text-gray-800">Add New Sub-Category</h3><p className="text-xs text-gray-500 mt-1">For: {formData.category}</p></div>
            <div className="p-4 sm:p-5"><input type="text" value={newSubCategory} onChange={(e) => setNewSubCategory(e.target.value)} placeholder={`Enter ${formData.category} sub-category`} className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" autoFocus />
              <div className="flex gap-3 mt-5"><button onClick={() => setShowAddSubCategory(false)} className="flex-1 px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Cancel</button><button onClick={handleAddNewSubCategory} className="flex-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:shadow-md text-sm">Add</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEditProduct;
