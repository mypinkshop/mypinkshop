import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function AdminProducts() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', category: 'skincare' });
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return; }
    
    const mockBrands = [
      { id: 1, name: 'Nykaa Beauty', productCount: 24 },
      { id: 2, name: 'Mamaearth', productCount: 18 },
      { id: 3, name: 'Sugar Cosmetics', productCount: 12 },
      { id: 4, name: 'Plum Beauty', productCount: 8 },
    ];
    setBrands(mockBrands);
    
    const mockProducts = {
      1: [
        { id: 1, name: 'Glass Skin Serum', price: 1299, stock: 45, category: 'skincare', status: 'active' },
        { id: 2, name: 'Rice Water Toner', price: 899, stock: 60, category: 'skincare', status: 'active' },
        { id: 3, name: 'Cherry Lip Tint', price: 599, stock: 100, category: 'makeup', status: 'active' },
      ],
      2: [
        { id: 4, name: 'Vitamin C Face Wash', price: 399, stock: 80, category: 'skincare', status: 'active' },
        { id: 5, name: 'Ubtan Face Mask', price: 499, stock: 55, category: 'skincare', status: 'active' },
      ],
      3: [
        { id: 6, name: 'Matte Lipstick', price: 599, stock: 120, category: 'makeup', status: 'active' },
      ],
      4: [
        { id: 7, name: 'Plum Body Oil', price: 799, stock: 30, category: 'bodycare', status: 'active' },
      ],
    };
    setProducts(mockProducts);
    setLoading(false);
  }, [token, navigate]);

  const handleBrandClick = (brand) => {
    setSelectedBrand(brand);
  };

  const deleteProduct = (productId) => {
    if (confirm('Delete this product?')) {
      const updatedProducts = { ...products };
      updatedProducts[selectedBrand.id] = updatedProducts[selectedBrand.id].filter(p => p.id !== productId);
      setProducts(updatedProducts);
      alert('Product deleted!');
    }
  };

  const toggleProductStatus = (productId) => {
    const updatedProducts = { ...products };
    updatedProducts[selectedBrand.id] = updatedProducts[selectedBrand.id].map(p => 
      p.id === productId ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p
    );
    setProducts(updatedProducts);
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    const newProduct = {
      id: Date.now(),
      ...formData,
      status: 'active',
    };
    const updatedProducts = { ...products };
    updatedProducts[selectedBrand.id] = [...(updatedProducts[selectedBrand.id] || []), newProduct];
    setProducts(updatedProducts);
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
            <p className="text-gray-500 text-sm">Select a brand to view and manage products</p>
          </div>

          {/* Brand Cards */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">BRANDS</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {brands.map(brand => (
                <button
                  key={brand.id}
                  onClick={() => handleBrandClick(brand)}
                  className={`bg-white rounded-xl p-4 text-center border-2 transition-all hover:shadow-md ${
                    selectedBrand?.id === brand.id ? 'border-pink-500 bg-pink-50' : 'border-gray-100 hover:border-pink-200'
                  }`}
                >
                  <div className="text-4xl mb-2">🏢</div>
                  <p className="font-medium text-gray-800">{brand.name}</p>
                  <p className="text-xs text-gray-400">{brand.productCount} products</p>
                </button>
              ))}
            </div>
          </div>

          {/* Products Section */}
          {selectedBrand ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selectedBrand.name}
                  </h2>
                  <p className="text-sm text-gray-500">Manage products for this brand</p>
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
                      <tr className="border-b">
                        <th className="px-6 py-3 text-left">Product Name</th>
                        <th className="px-6 py-3 text-left">Category</th>
                        <th className="px-6 py-3 text-right">Price</th>
                        <th className="px-6 py-3 text-right">Stock</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {products[selectedBrand.id]?.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium text-gray-800">{product.name}</td>
                          <td className="px-6 py-3 capitalize text-gray-500">{product.category}</td>
                          <td className="px-6 py-3 text-right font-semibold text-gray-800">₹{product.price}</td>
                          <td className="px-6 py-3 text-right text-gray-500">{product.stock} units</td>
                          <td className="px-6 py-3 text-center">
                            <button
                              onClick={() => toggleProductStatus(product.id)}
                              className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                            >
                              {product.status === 'active' ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleEditProduct(product)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition" title="Edit">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button onClick={() => deleteProduct(product.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition" title="Delete">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
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

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={editingProduct ? updateProduct : handleAddProduct} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500">
                  <option value="skincare">Skincare</option>
                  <option value="makeup">Makeup</option>
                  <option value="drip">The Drip</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition">
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
