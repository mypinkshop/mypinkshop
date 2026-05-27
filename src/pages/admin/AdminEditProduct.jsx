import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

function AdminEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    subCategory: '',
    price: '',
    originalPrice: '',
    stock: '',
    description: '',
    shortDescription: '',
    keyFeatures: [],
    specifications: {},
    images: [],
    sku: '',
    weight: '',
    dimensions: '',
    shippingCharges: '',
    tax: 5,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: ''
  });
  
  const [keyFeatureInput, setKeyFeatureInput] = useState('');
  const [specKeyInput, setSpecKeyInput] = useState('');
  const [specValueInput, setSpecValueInput] = useState('');

  // Categories
  const categories = {
    'Skincare': ['Face Wash', 'Serums', 'Moisturizers', 'Toners', 'Sunscreen', 'Masks', 'Eye Cream'],
    'Makeup': ['Lipsticks', 'Foundation', 'Kajal', 'Eyeshadow', 'Blush', 'Compact', 'Mascara', 'Highlighter'],
    'Clothing': ['Dresses', 'Tops', 'Jeans', 'Skirts', 'Ethnic Wear', 'Kurtis', 'Sarees', 'Jackets'],
    'Accessories': ['Bags', 'Jewelry', 'Hair Accessories', 'Watches', 'Sunglasses', 'Belts', 'Scarves'],
  };

  useEffect(() => {
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const product = allProducts.find(p => p.id == id);
    
    if (product) {
      setFormData({
        name: product.name || '',
        brand: product.brand || '',
        category: product.mainCategory || product.category || '',
        subCategory: product.category || '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        stock: product.stock || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        keyFeatures: product.keyFeatures || [],
        specifications: product.specifications || {},
        images: product.images || [],
        sku: product.sku || '',
        weight: product.weight || '',
        dimensions: product.dimensions || '',
        shippingCharges: product.shippingCharges || '',
        tax: product.tax || 5,
        seoTitle: product.seoTitle || '',
        seoDescription: product.seoDescription || '',
        seoKeywords: product.seoKeywords || ''
      });
    }
    setLoading(false);
  }, [id]);

  // ✅ Image upload with Base64 conversion
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (formData.images.length + files.length > 5) {
      alert('You can upload maximum 5 images');
      return;
    }
    
    setUploadingImages(true);
    const newImages = [];
    
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        alert(`Image ${file.name} is larger than 2MB`);
        continue;
      }
      
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image`);
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

  const addKeyFeature = () => {
    if (keyFeatureInput.trim()) {
      setFormData({ 
        ...formData, 
        keyFeatures: [...formData.keyFeatures, keyFeatureInput.trim()] 
      });
      setKeyFeatureInput('');
    }
  };

  const removeKeyFeature = (index) => {
    setFormData({ 
      ...formData, 
      keyFeatures: formData.keyFeatures.filter((_, i) => i !== index) 
    });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const updatedProducts = allProducts.map(p => 
      p.id == id ? { 
        ...p, 
        ...formData,
        category: formData.subCategory || formData.category,
        mainCategory: formData.category,
        price: parseFloat(formData.price),
        originalPrice: parseFloat(formData.originalPrice),
        stock: parseInt(formData.stock),
        tax: parseFloat(formData.tax),
        shippingCharges: parseFloat(formData.shippingCharges) || 0
      } : p
    );
    
    localStorage.setItem('adminProductsList', JSON.stringify(updatedProducts));
    alert('✅ Product updated successfully!');
    navigate('/admin/products');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Icons
  const IconX = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const IconPlus = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );

  const IconUpload = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="ml-64 p-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Edit Product</h1>
            <Link to="/admin/products" className="text-gray-500 hover:text-gray-700">← Back</Link>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Information */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Category</option>
                    {Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                  <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={!formData.category}
                  >
                    <option value="">Select Sub Category</option>
                    {formData.category && categories[formData.category]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Images</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                <div className="flex flex-wrap gap-3 mb-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden group">
                      <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <IconX />
                      </button>
                    </div>
                  ))}
                </div>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="imageUpload" />
                <label htmlFor="imageUpload" className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-pink-200 rounded-lg cursor-pointer hover:bg-pink-50 transition text-pink-600 font-medium">
                  <IconUpload /> {uploadingImages ? 'Uploading...' : 'Upload Images'}
                </label>
                <p className="text-xs text-gray-400 mt-3">Upload up to 5 images. Max 2MB each.</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Pricing</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Price</label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax (GST) %</label>
                  <input
                    type="number"
                    name="tax"
                    value={formData.tax}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Inventory</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Description</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Brief description for search results"
                />
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Detailed product description"
                />
              </div>
            </div>

            {/* Key Features */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Key Features</h2>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.keyFeatures.map((feature, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                    ✓ {feature}
                    <button type="button" onClick={() => removeKeyFeature(idx)} className="text-gray-400 hover:text-red-500">
                      <IconX />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keyFeatureInput}
                  onChange={(e) => setKeyFeatureInput(e.target.value)}
                  placeholder="e.g., Dermatologically tested"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyFeature())}
                />
                <button type="button" onClick={addKeyFeature} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                  <IconPlus /> Add
                </button>
              </div>
            </div>

            {/* Specifications */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Specifications</h2>
              <div className="space-y-2 mb-2">
                {Object.entries(formData.specifications).map(([key, value]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <span className="w-1/3 px-3 py-2 bg-gray-50 rounded-lg text-sm">{key}</span>
                    <span className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm">{value}</span>
                    <button type="button" onClick={() => removeSpecification(key)} className="text-red-500 hover:text-red-700">
                      <IconX />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g., Material)"
                  value={specKeyInput}
                  onChange={(e) => setSpecKeyInput(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Value (e.g., Plastic)"
                  value={specValueInput}
                  onChange={(e) => setSpecValueInput(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                />
                <button type="button" onClick={addSpecification} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                  <IconPlus /> Add
                </button>
              </div>
            </div>

            {/* Shipping */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Shipping Details</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (cm)</label>
                  <input
                    type="text"
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="20 x 10 x 5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Charges</label>
                  <input
                    type="number"
                    name="shippingCharges"
                    value={formData.shippingCharges}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0 for free"
                  />
                </div>
              </div>
            </div>

            {/* SEO */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">SEO Settings</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
                  <input
                    type="text"
                    name="seoTitle"
                    value={formData.seoTitle}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
                  <textarea
                    name="seoDescription"
                    value={formData.seoDescription}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SEO Keywords</label>
                  <input
                    type="text"
                    name="seoKeywords"
                    value={formData.seoKeywords}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Comma separated keywords"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button type="submit" className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition">
                Save Changes
              </button>
              <Link to="/admin/products" className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminEditProduct;
