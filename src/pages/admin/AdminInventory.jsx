import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

function AdminInventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [productToDelete, setProductToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const API_URL = 'https://api.mypinkshop.com';

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadInventory();
  }, [navigate]);

  // ✅ Load products from BACKEND API
  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/products`);
      
      if (!response.ok) {
        throw new Error('Failed to load products');
      }
      
      const data = await response.json();
      
      const productsWithStatus = data.map(product => {
        let status = 'active';
        if (product.stock === 0) status = 'outofstock';
        else if (product.stock < 10) status = 'lowstock';
        else status = 'active';
        
        return {
          ...product,
          id: product._id,
          status: product.status === 'active' ? status : 'inactive'
        };
      });
      
      setProducts(productsWithStatus);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update stock in backend
  const updateStock = async (productId, newStock) => {
    if (newStock < 0) return;
    
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });
      
      if (!response.ok) throw new Error('Update failed');
      
      await loadInventory();
      alert(`✓ Stock updated to ${newStock}`);
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock');
    }
  };

  // ✅ Delete product from backend
  const deleteProduct = async (productId) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Delete failed');
      
      await loadInventory();
      setShowDeleteModal(false);
      setProductToDelete(null);
      alert('🗑 Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const getStatusBadge = (status, stock) => {
    if (status === 'inactive') 
      return <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">Inactive</span>;
    if (stock === 0) 
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Out of Stock</span>;
    if (stock < 10) 
      return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium animate-pulse">Low Stock</span>;
    return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">In Stock</span>;
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'skincare', label: 'Skincare' },
    { value: 'makeup', label: 'Makeup' },
    { value: 'hair', label: 'Hair' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'accessories', label: 'Accessories' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All', icon: '📊' },
    { value: 'active', label: 'In Stock', icon: '✅' },
    { value: 'lowstock', label: 'Low Stock', icon: '⚠️' },
    { value: 'outofstock', label: 'Out of Stock', icon: '❌' },
  ];

  const filteredProducts = products.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterCategory !== 'all' && p.mainCategory?.toLowerCase() !== filterCategory && p.category?.toLowerCase() !== filterCategory) return false;
    if (searchTerm && !p.name?.toLowerCase().includes(searchTerm.toLowerCase()) && !p.sku?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const totalProducts = products.length;
  const activeCount = products.filter(p => p.status === 'active' && p.stock > 10).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock < 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50/30">
      <AdminSidebar />
      
      {/* Premium Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-pink-100 px-4 sm:px-6 py-3 sm:py-4 fixed top-0 right-0 left-0 md:left-64 z-40 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Inventory Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">Track and manage your product stock levels</p>
          </div>
          
          {/* 🔥 BUTTONS - ADDED BULK UPLOAD */}
          <div className="flex gap-3">
            <Link 
              to="/admin/add-product" 
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:shadow-lg hover:scale-105 transition-all"
            >
              + Add Product
            </Link>
            <Link 
              to="/admin/bulk-upload" 
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              📊 Bulk Upload
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content - Baki ka code same hai */}
      <div className="md:ml-64">
        <div className="pt-20 sm:pt-24 px-3 sm:px-4 md:px-6 pb-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Total Products</p>
                <span className="text-xl text-gray-400 group-hover:scale-110 transition">📦</span>
              </div>
              <p className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{totalProducts}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-4 hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">In Stock</p>
                <span className="text-xl text-green-500 group-hover:scale-110 transition">✅</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-4 hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Low Stock</p>
                <span className="text-xl text-amber-500 group-hover:scale-110 transition">⚠️</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-4 hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Out of Stock</p>
                <span className="text-xl text-red-500 group-hover:scale-110 transition">❌</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-pink-100 mb-6 overflow-hidden">
            <div className="p-4 border-b border-pink-100 flex flex-wrap justify-between items-center gap-3">
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterStatus(opt.value)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${
                      filterStatus === opt.value
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{opt.icon}</span> {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)} 
                  className="px-3 py-1.5 border border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-200 bg-white"
                >
                  {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search by name or SKU..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48 sm:w-64 pl-9 pr-3 py-1.5 border border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-200 bg-white"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Product</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">SKU</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Category</th>
                    <th className="px-4 py-3 text-right text-gray-700 font-semibold">Price</th>
                    <th className="px-4 py-3 text-right text-gray-700 font-semibold">Stock</th>
                    <th className="px-4 py-3 text-center text-gray-700 font-semibold">Status</th>
                    <th className="px-4 py-3 text-center text-gray-700 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-16 text-center">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-gray-400">No products found</p>
                        <Link to="/admin/add-product" className="mt-3 inline-block text-pink-500 text-sm hover:underline">
                          Add your first product →
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-pink-50/30 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.images && product.images[0] ? (
                              <img 
                                src={product.images[0]} 
                                alt={product.name} 
                                className="w-10 h-10 rounded-xl object-cover border border-pink-100 shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl flex items-center justify-center text-lg">
                                ✨
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800 line-clamp-1">{product.name}</p>
                              <p className="text-xs text-gray-400 capitalize">{product.mainCategory || product.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs font-mono">{product.sku?.slice(-8) || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-full capitalize">
                            {product.mainCategory || product.category || 'General'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-pink-600">₹{product.price}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => updateStock(product.id, product.stock - 1)}
                              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-pink-100 transition font-bold text-gray-600 hover:text-pink-600"
                            >
                              -
                            </button>
                            <span className={`w-12 text-center font-medium ${product.stock < 10 ? 'text-amber-600 font-bold' : 'text-gray-800'}`}>
                              {product.stock}
                            </span>
                            <button 
                              onClick={() => updateStock(product.id, product.stock + 1)}
                              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-pink-100 transition font-bold text-gray-600 hover:text-pink-600"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(product.status, product.stock)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <Link to={`/admin/edit-product/${product.id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Edit">
                              ✏️
                            </Link>
                            <button 
                              onClick={() => { setProductToDelete(product); setShowDeleteModal(true); }} 
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" 
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-pink-100 p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Delete Product</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                {productToDelete.images && productToDelete.images[0] ? (
                  <img src={productToDelete.images[0]} alt={productToDelete.name} className="w-12 h-12 rounded-xl object-cover border border-pink-100" />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl flex items-center justify-center text-xl">✨</div>
                )}
                <div>
                  <p className="font-semibold text-gray-800">{productToDelete.name}</p>
                  <p className="text-xs text-gray-400">SKU: {productToDelete.sku?.slice(-8) || 'N/A'}</p>
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={() => deleteProduct(productToDelete.id)} className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default AdminInventory;
