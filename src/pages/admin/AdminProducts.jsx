import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    vendorId: '',
    category: 'skincare',
    price: '',
    originalPrice: '',
    stock: '',
    emoji: '🛍️',
    images: [],
    description: '',
    shortDescription: '',
    benefits: [],
    specifications: {},
    sizes: [],
    colors: [],
    tags: [],
    seoTitle: '',
    seoDescription: '',
    status: 'active'
  });
  const [newVariant, setNewVariant] = useState({ type: 'size', value: '' });
  const [newBenefit, setNewBenefit] = useState('');
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [imagePreview, setImagePreview] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }

    // Mock products data
    setProducts([
      { 
        id: 1, 
        name: 'Glass Skin Serum', 
        vendorName: 'Nykaa Beauty', 
        category: 'skincare', 
        price: 1299, 
        originalPrice: 1999,
        stock: 45, 
        status: 'active', 
        emoji: '💧',
        images: ['💧', '✨', '💎'],
        rating: 4.8,
        totalSales: 234
      },
      { 
        id: 2, 
        name: 'Rice Water Toner', 
        vendorName: 'Nykaa Beauty', 
        category: 'skincare', 
        price: 899, 
        originalPrice: 1299,
        stock: 60, 
        status: 'active', 
        emoji: '🌸',
        images: ['🌸', '🌾'],
        rating: 4.6,
        totalSales: 189
      },
    ]);

    setVendors([
      { id: 1, brandName: 'Nykaa Beauty' },
      { id: 2, brandName: 'Mamaearth' },
      { id: 3, brandName: 'Sugar Cosmetics' },
    ]);
    setLoading(false);
  }, [token, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    // For demo, using emoji placeholders. In real app, upload to Cloudinary
    const newImages = files.map((file, idx) => {
      const emojis = ['📷', '🖼️', '🎨', '✨', '🌟', '💎'];
      return emojis[(formData.images.length + idx) % emojis.length];
    });
    setFormData({ ...formData, images: [...formData.images, ...newImages] });
  };

  const removeImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, newBenefit.trim()]
      });
      setNewBenefit('');
    }
  };

  const removeBenefit = (index) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index)
    });
  };

  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setFormData({
        ...formData,
        specifications: {
          ...formData.specifications,
          [newSpecKey.trim()]: newSpecValue.trim()
        }
      });
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const removeSpecification = (key) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[key];
    setFormData({ ...formData, specifications: newSpecs });
  };

  const addVariant = () => {
    if (newVariant.value.trim()) {
      setFormData({
        ...formData,
        [newVariant.type === 'size' ? 'sizes' : 'colors']: [...formData[newVariant.type === 'size' ? 'sizes' : 'colors'], newVariant.value.trim()]
      });
      setNewVariant({ type: 'size', value: '' });
    }
  };

  const removeVariant = (type, value) => {
    setFormData({
      ...formData,
      [type === 'size' ? 'sizes' : 'colors']: formData[type === 'size' ? 'sizes' : 'colors'].filter(v => v !== value)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedVendor = vendors.find(v => v.id == formData.vendorId);
    const newProduct = {
      id: Date.now(),
      ...formData,
      vendorName: selectedVendor?.brandName || 'Unknown',
      status: 'active',
      rating: 0,
      totalSales: 0,
      createdAt: new Date().toISOString()
    };
    setProducts([newProduct, ...products]);
    setShowModal(false);
    resetForm();
    alert('✅ Product added successfully!');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      vendorId: '',
      category: 'skincare',
      price: '',
      originalPrice: '',
      stock: '',
      emoji: '🛍️',
      images: [],
      description: '',
      shortDescription: '',
      benefits: [],
      specifications: {},
      sizes: [],
      colors: [],
      tags: [],
      seoTitle: '',
      seoDescription: '',
      status: 'active'
    });
    setNewVariant({ type: 'size', value: '' });
    setNewBenefit('');
    setNewSpecKey('');
    setNewSpecValue('');
  };

  const deleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== productId));
      alert('🗑️ Product deleted!');
    }
  };

  const toggleProductStatus = (productId) => {
    setProducts(products.map(p => 
      p.id === productId ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p
    ));
  };

  const filteredProducts = products.filter(p => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return p.status === 'active';
    if (activeTab === 'inactive') return p.status === 'inactive';
    if (activeTab === 'lowstock') return p.stock < 10;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-pink-500">MyPinkShop Admin</h1>
          <button onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin/login'); }} className="text-red-500 text-sm">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
            <p className="text-gray-500 text-sm">Add, edit, or remove products from any vendor</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-pink-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-pink-600 transition flex items-center gap-2"
          >
            <span>➕</span> Add New Product
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('all')} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'all' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>All Products ({products.length})</button>
          <button onClick={() => setActiveTab('active')} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'active' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Active</button>
          <button onClick={() => setActiveTab('inactive')} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'inactive' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Inactive</button>
          <button onClick={() => setActiveTab('lowstock')} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'lowstock' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Low Stock</button>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b">
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-left">Vendor</th>
                <th className="px-5 py-3 text-left">Category</th>
                <th className="px-5 py-3 text-left">Price</th>
                <th className="px-5 py-3 text-left">Stock</th>
                <th className="px-5 py-3 text-left">Sales</th>
                <th className="px-5 py-3 text-left">Rating</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center text-xl">{product.emoji || '📦'}</div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">{product.vendorName}</td>
                  <td className="px-5 py-3 capitalize">{product.category}</td>
                  <td className="px-5 py-3">₹{product.price}</td>
                  <td className={`px-5 py-3 ${product.stock < 10 ? 'text-red-500 font-semibold' : ''}`}>{product.stock}</td>
                  <td className="px-5 py-3">{product.totalSales || 0}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span>{product.rating || 0}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleProductStatus(product.id)} className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {product.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition" title="Edit">✏️</button>
                      <button onClick={() => deleteProduct(product.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="border rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">📝 Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Vendor *</label>
                    <select name="vendorId" value={formData.vendorId} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500" required>
                      <option value="">Select Vendor</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.brandName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg">
                      <option value="skincare">Skincare</option>
                      <option value="makeup">Makeup</option>
                      <option value="drip">The Drip</option>
                      <option value="accessories">Accessories</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emoji / Icon</label>
                    <input type="text" name="emoji" value={formData.emoji} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="💧" />
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="border rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">💰 Pricing & Stock</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Original Price</label>
                    <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required />
                  </div>
                </div>
              </div>

              {/* Product Images */}
              <div className="border rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">🖼️ Product Images</h4>
                <div className="flex flex-wrap gap-3 mb-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 bg-pink-50 rounded-lg flex items-center justify-center text-3xl">
                      {img}
                      <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">✕</button>
                    </div>
                  ))}
                  <label className="w-20 h-20 border-2 border-dashed border-pink-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50 transition">
                    <span className="text-2xl">+</span>
                    <span className="text-xs text-gray-500">Add</span>
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                <p className="text-xs text-gray-400">Tip: Add up to 5 images. First image will be the main product image.</p>
              </div>

              {/* Description */}
              <div className="border rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">📝 Description</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                    <textarea name="shortDescription" rows="2" value={formData.shortDescription} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Brief description (appears in search results)"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                    <textarea name="description" rows="5" value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Detailed product description..."></textarea>
                  </div>
                </div>
              </div>

              {/* Key Benefits */}
              <div className="border rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">✨ Key Benefits</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.benefits.map((benefit, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm">
                      {benefit}
                      <button type="button" onClick={() => removeBenefit(idx)} className="text-green-700 hover:text-red-500">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newBenefit} onChange={(e) => setNewBenefit(e.target.value)} placeholder="e.g., Deep hydration" className="flex-1 px-3 py-2 border rounded-lg" />
                  <button type="button" onClick={addBenefit} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600">Add</button>
                </div>
              </div>

              {/* Specifications Table */}
              <div className="border rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">📊 Specifications</h4>
                <div className="mb-3 space-y-2">
                  {Object.entries(formData.specifications).map(([key, value]) => (
                    <div key={key} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg">
                      <span className="w-1/3 font-medium">{key}</span>
                      <span className="flex-1">{value}</span>
                      <button type="button" onClick={() => removeSpecification(key)} className="text-red-500 hover:text-red-700">✕</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newSpecKey} onChange={(e) => setNewSpecKey(e.target.value)} placeholder="Key (e.g., Brand)" className="w-1/3 px-3 py-2 border rounded-lg" />
                  <input type="text" value={newSpecValue} onChange={(e) => setNewSpecValue(e.target.value)} placeholder="Value (e.g., Nykaa Beauty)" className="flex-1 px-3 py-2 border rounded-lg" />
                  <button type="button" onClick={addSpecification} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600">Add</button>
                </div>
              </div>

              {/* Variants (Sizes, Colors) */}
              <div className="border rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">🏷️ Variants</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sizes</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.sizes.map(size => (
                        <span key={size} className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
                          {size}
                          <button type="button" onClick={() => removeVariant('size', size)} className="text-gray-500 hover:text-red-500">✕</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" placeholder="S, M, L" className="flex-1 px-3 py-2 border rounded-lg" />
                      <button type="button" className="px-4 py-2 bg-gray-200 rounded-lg">Add</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Colors</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.colors.map(color => (
                        <span key={color} className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
                          {color}
                          <button type="button" onClick={() => removeVariant('color', color)} className="text-gray-500 hover:text-red-500">✕</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Pink, Black, White" className="flex-1 px-3 py-2 border rounded-lg" />
                      <button type="button" className="px-4 py-2 bg-gray-200 rounded-lg">Add</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO Meta */}
              <div className="border rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">🔍 SEO Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                    <input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Product Title for search engines" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                    <textarea name="seoDescription" rows="2" value={formData.seoDescription} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Brief description for search results"></textarea>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition">
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
