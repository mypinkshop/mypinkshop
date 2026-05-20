import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function AdminProducts() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [brandFormData, setBrandFormData] = useState({ name: '', logo: null, logoPreview: null });
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', category: 'skincare' });
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  const logoInputRef = useRef(null);

  // Load data from localStorage first, then fallback to mock
  useEffect(() => {
    if (!token) { navigate('/admin/login'); return; }
    
    const savedBrands = localStorage.getItem('adminBrands');
    const savedProducts = localStorage.getItem('adminProducts');
    
    if (savedBrands && savedProducts) {
      setBrands(JSON.parse(savedBrands));
      setProducts(JSON.parse(savedProducts));
    } else {
      const mockBrands = [
        { id: 1, name: 'Nykaa Beauty', logo: 'https://placehold.co/40x40/pink/white?text=N', productCount: 3 },
        { id: 2, name: 'Mamaearth', logo: 'https://placehold.co/40x40/green/white?text=M', productCount: 2 },
        { id: 3, name: 'Sugar Cosmetics', logo: 'https://placehold.co/40x40/red/white?text=S', productCount: 1 },
        { id: 4, name: 'Plum Beauty', logo: 'https://placehold.co/40x40/purple/white?text=P', productCount: 1 },
      ];
      const mockProducts = {
        1: [
          { id: 1, name: 'Glass Skin Serum', price: 1299, stock: 45, category: 'skincare', status: 'active', badge: 'Bestseller', isNew: true, rating: 4.8, originalPrice: 1999 },
          { id: 2, name: 'Rice Water Toner', price: 899, stock: 60, category: 'skincare', status: 'active', badge: 'Trending', isNew: false, rating: 4.6, originalPrice: 1299 },
          { id: 3, name: 'Cherry Lip Tint', price: 599, stock: 100, category: 'makeup', status: 'active', badge: 'Viral', isNew: true, rating: 4.7, originalPrice: 999 },
        ],
        2: [
          { id: 4, name: 'Vitamin C Face Wash', price: 399, stock: 80, category: 'skincare', status: 'active', badge: 'Natural', isNew: false, rating: 4.5, originalPrice: 599 },
          { id: 5, name: 'Ubtan Face Mask', price: 499, stock: 55, category: 'skincare', status: 'active', badge: 'Glow', isNew: true, rating: 4.6, originalPrice: 799 },
        ],
        3: [
          { id: 6, name: 'Matte Lipstick', price: 599, stock: 120, category: 'makeup', status: 'active', badge: 'Trending', isNew: true, rating: 4.7, originalPrice: 999 },
        ],
        4: [
          { id: 7, name: 'Plum Body Oil', price: 799, stock: 30, category: 'bodycare', status: 'active', badge: 'Natural', isNew: false, rating: 4.5, originalPrice: 1199 },
        ],
      };
      setBrands(mockBrands);
      setProducts(mockProducts);
      localStorage.setItem('adminBrands', JSON.stringify(mockBrands));
      localStorage.setItem('adminProducts', JSON.stringify(mockProducts));
    }
    setLoading(false);
  }, [token, navigate]);

  // Save all data to localStorage
  const saveAllData = (updatedBrands, updatedProducts) => {
    localStorage.setItem('adminBrands', JSON.stringify(updatedBrands));
    localStorage.setItem('adminProducts', JSON.stringify(updatedProducts));
    // Also sync to homepage
    syncToHomepage(updatedProducts, updatedBrands);
  };

  // Sync all products to homepage localStorage
  const syncToHomepage = (currentProducts, currentBrands) => {
    const allProducts = [];
    Object.keys(currentProducts).forEach(brandId => {
      const brandProducts = currentProducts[brandId] || [];
      const brand = currentBrands.find(b => b.id === parseInt(brandId));
      brandProducts.forEach(product => {
        allProducts.push({
          ...product,
          brandId: parseInt(brandId),
          brandName: brand?.name || 'Unknown',
        });
      });
    });
    localStorage.setItem('homepageProducts', JSON.stringify(allProducts));
    console.log('✅ Products synced to homepage:', allProducts.length);
  };

  const handleBrandClick = (brand) => {
    setSelectedBrand(brand);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandFormData({ ...brandFormData, logo: reader.result, logoPreview: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const addBrand = () => {
    if (!brandFormData.name) {
      alert('Please enter brand name');
      return;
    }
    const newBrand = {
      id: Date.now(),
      name: brandFormData.name,
      logo: brandFormData.logo || 'https://placehold.co/40x40/gray/white?text=' + brandFormData.name.charAt(0),
      productCount: 0,
    };
    const updatedBrands = [...brands, newBrand];
    const updatedProducts = { ...products, [newBrand.id]: [] };
    setBrands(updatedBrands);
    setProducts(updatedProducts);
    saveAllData(updatedBrands, updatedProducts);
    setShowBrandModal(false);
    setBrandFormData({ name: '', logo: null, logoPreview: null });
    alert('Brand added successfully!');
  };

  const deleteBrand = (brandId) => {
    if (confirm('Delete this brand? All products under this brand will also be deleted.')) {
      const updatedBrands = brands.filter(b => b.id !== brandId);
      const updatedProducts = { ...products };
      delete updatedProducts[brandId];
      setBrands(updatedBrands);
      setProducts(updatedProducts);
      if (selectedBrand?.id === brandId) setSelectedBrand(null);
      saveAllData(updatedBrands, updatedProducts);
      alert('Brand deleted!');
    }
  };

  const deleteProduct = (productId) => {
    if (confirm('Delete this product?')) {
      const updatedProducts = { ...products };
      updatedProducts[selectedBrand.id] = updatedProducts[selectedBrand.id].filter(p => p.id !== productId);
      const updatedBrands = brands.map(b => 
        b.id === selectedBrand.id ? { ...b, productCount: b.productCount - 1 } : b
      );
      setProducts(updatedProducts);
      setBrands(updatedBrands);
      saveAllData(updatedBrands, updatedProducts);
      alert('Product deleted!');
    }
  };

  const toggleProductStatus = (productId) => {
    const updatedProducts = { ...products };
    updatedProducts[selectedBrand.id] = updatedProducts[selectedBrand.id].map(p => 
      p.id === productId ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p
    );
    setProducts(updatedProducts);
    saveAllData(brands, updatedProducts);
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    const newProduct = {
      id: Date.now(),
      ...formData,
      status: 'active',
      badge: 'New',
      isNew: true,
      rating: 4.5,
      originalPrice: Math.round(formData.price * 1.5),
    };
    const updatedProducts = { ...products };
    updatedProducts[selectedBrand.id] = [...(updatedProducts[selectedBrand.id] || []), newProduct];
    const updatedBrands = brands.map(b => 
      b.id === selectedBrand.id ? { ...b, productCount: b.productCount + 1 } : b
    );
    setProducts(updatedProducts);
    setBrands(updatedBrands);
    saveAllData(updatedBrands, updatedProducts);
    setShowAddModal(false);
    setFormData({ name: '', price: '', stock: '', category: 'skincare' });
    alert('Product added!');
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
    });
    setShowAddModal(true);
  };

  const updateProduct = (e) => {
    e.preventDefault();
    const updatedProducts = { ...products };
    updatedProducts[selectedBrand.id] = updatedProducts[selectedBrand.id].map(p => 
      p.id === editingProduct.id ? { ...p, ...formData } : p
    );
    setProducts(updatedProducts);
    saveAllData(brands, updatedProducts);
    setShowAddModal(false);
    setEditingProduct(null);
    setFormData({ name: '', price: '', stock: '', category: 'skincare' });
    alert('Product updated!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
              <p className="text-gray-500 text-sm">Select a brand to view and manage products</p>
            </div>
            <button
              onClick={() => { setShowBrandModal(true); setBrandFormData({ name: '', logo: null, logoPreview: null }); }}
              className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-600 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Brand
            </button>
          </div>

          {/* Brand Cards */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">BRANDS</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {brands.map(brand => (
                <div key={brand.id} className="relative group">
                  <button
                    onClick={() => handleBrandClick(brand)}
                    className={`w-full bg-white rounded-xl p-4 text-center border-2 transition-all hover:shadow-md ${
                      selectedBrand?.id === brand.id ? 'border-pink-500 bg-pink-50' : 'border-gray-100 hover:border-pink-200'
                    }`}
                  >
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {brand.logo ? <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" /> : <span className="text-3xl">🏢</span>}
                    </div>
                    <p className="font-medium text-gray-800 text-sm">{brand.name}</p>
                    <p className="text-xs text-gray-400">{brand.productCount} products</p>
                  </button>
                  <button
                    onClick={() => deleteBrand(brand.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                    title="Delete Brand"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Products Section */}
          {selectedBrand ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    {selectedBrand.logo ? <img src={selectedBrand.logo} alt={selectedBrand.name} className="w-full h-full object-cover" /> : <span className="text-xl">🏢</span>}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{selectedBrand.name}</h2>
                    <p className="text-sm text-gray-500">Manage products for this brand</p>
                  </div>
                </div>
                <button
                  onClick={() => { setEditingProduct(null); setFormData({ name: '', price: '', stock: '', category: 'skincare' }); setShowAddModal(true); }}
                  className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-600 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Product
                </button>
              </div>

              {products[selectedBrand.id]?.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-5xl mb-3">📦</div>
                  <p className="text-gray-500">No products yet</p>
                  <button onClick={() => { setEditingProduct(null); setShowAddModal(true); }} className="mt-3 text-pink-500 text-sm">Add your first product →</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="border-b"><th className="px-6 py-3 text-left">Product Name</th><th className="px-6 py-3 text-left">Category</th><th className="px-6 py-3 text-right">Price</th><th className="px-6 py-3 text-right">Stock</th><th className="px-6 py-3 text-center">Status</th><th className="px-6 py-3 text-center">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {products[selectedBrand.id]?.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium text-gray-800">{product.name}</td>
                          <td className="px-6 py-3 capitalize text-gray-500">{product.category}<td>
                          <td className="px-6 py-3 text-right font-semibold text-gray-800">₹{product.price}</td>
                          <td className="px-6 py-3 text-right text-gray-500">{product.stock} units</td>
                          <td className="px-6 py-3 text-center"><button onClick={() => toggleProductStatus(product.id)} className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{product.status === 'active' ? 'Active' : 'Inactive'}</button></td>
                          <td className="px-6 py-3 text-center"><div className="flex justify-center gap-2"><button onClick={() => handleEditProduct(product)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition" title="Edit">✏️</button><button onClick={() => deleteProduct(product.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition" title="Delete">🗑️</button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
              <div className="text-5xl mb-3">🏢</div>
              <p className="text-gray-500">Select a brand from above to view products</p>
            </div>
          )}
        </main>
      </div>

      {/* Add Brand Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowBrandModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between items-center sticky top-0 bg-white"><h3 className="text-xl font-bold">Add New Brand</h3><button onClick={() => setShowBrandModal(false)} className="text-gray-400 hover:text-gray-600">✕</button></div>
            <form onSubmit={(e) => { e.preventDefault(); addBrand(); }} className="p-5 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Brand Name *</label><input type="text" value={brandFormData.name} onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Brand Logo</label><div className="flex items-center gap-4">{brandFormData.logoPreview && (<div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100"><img src={brandFormData.logoPreview} alt="Preview" className="w-full h-full object-cover" /></div>)}<button type="button" onClick={() => logoInputRef.current.click()} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">Upload Logo</button><input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" /></div><p className="text-xs text-gray-400 mt-1">Upload a square image (recommended size: 64x64px)</p></div>
              <button type="submit" className="w-full bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition">Add Brand</button>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between items-center"><h3 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3><button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button></div>
            <form onSubmit={editingProduct ? updateProduct : handleAddProduct} className="p-5 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Product Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium mb-1">Price (₹)</label><input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div><div><label className="block text-sm font-medium mb-1">Stock</label><input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div></div>
              <div><label className="block text-sm font-medium mb-1">Category</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="skincare">Skincare</option><option value="makeup">Makeup</option><option value="clothing">Clothing</option><option value="accessories">Accessories</option></select></div>
              <button type="submit" className="w-full bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition">{editingProduct ? 'Update Product' : 'Add Product'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
