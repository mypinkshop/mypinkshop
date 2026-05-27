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

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadInventory();
  }, [navigate]);

  const loadInventory = () => {
    // Load REAL products from localStorage
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    
    // Calculate status based on stock
    const productsWithStatus = allProducts.map(product => {
      let status = 'active';
      if (product.stock === 0) status = 'outofstock';
      else if (product.stock < 10) status = 'lowstock';
      else status = 'active';
      
      return {
        ...product,
        status: product.status === 'active' ? status : 'inactive',
        emoji: product.emoji || '✨'
      };
    });
    
    setProducts(productsWithStatus);
    setLoading(false);
  };

  const updateStock = (productId, newStock) => {
    const updatedProducts = products.map(product => {
      if (product.id === productId) {
        let status = 'active';
        if (newStock === 0) status = 'outofstock';
        else if (newStock < 10) status = 'lowstock';
        else status = 'active';
        
        return { ...product, stock: newStock, status: status };
      }
      return product;
    });
    setProducts(updatedProducts);
    
    // Update in localStorage
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const updatedAllProducts = allProducts.map(product => {
      if (product.id === productId) {
        return { ...product, stock: newStock };
      }
      return product;
    });
    localStorage.setItem('adminProductsList', JSON.stringify(updatedAllProducts));
    
    alert(`✅ Stock updated to ${newStock}`);
  };

  const deleteProduct = (productId) => {
    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const updatedAllProducts = allProducts.filter(p => p.id !== productId);
    localStorage.setItem('adminProductsList', JSON.stringify(updatedAllProducts));
    
    setShowDeleteModal(false);
    setProductToDelete(null);
    alert('🗑️ Product deleted successfully');
  };

  const getStatusBadge = (status, stock) => {
    if (status === 'inactive') return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Inactive</span>;
    if (stock === 0) return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Out of Stock</span>;
    if (stock < 10) return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Low Stock</span>;
    return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">In Stock</span>;
  };

  const categories = [
    { value: 'all', label: 'All Categories', icon: '✨' },
    { value: 'skincare', label: 'Skincare', icon: '🧴' },
    { value: 'makeup', label: 'Makeup', icon: '💄' },
    { value: 'clothing', label: 'Clothing', icon: '👗' },
    { value: 'accessories', label: 'Accessories', icon: '👜' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All', icon: '📋' },
    { value: 'active', label: 'In Stock', icon: '✅' },
    { value: 'lowstock', label: 'Low Stock', icon: '⚠️' },
    { value: 'outofstock', label: 'Out of Stock', icon: '❌' },
  ];

  const filteredProducts = products.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !p.sku?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const totalProducts = products.length;
  const activeCount = products.filter(p => p.status === 'active' && p.stock > 10).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock < 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminSidebar />
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 fixed top-0 right-0 left-0 md:left-64 z-40 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Inventory Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">Track and manage product stock levels</p>
          </div>
          <Link to="/admin/add-product" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all transform hover:-translate-y-0.5">
            + Add Product
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64">
        <div className="pt-20 sm:pt-24 md:pt-24 px-3 sm:px-4 md:px-6 pb-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Total Products</p>
                <span className="text-lg">📦</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{totalProducts}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">In Stock</p>
                <span className="text-lg">✅</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Low Stock</p>
                <span className="text-lg">⚠️</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Out of Stock</p>
                <span className="text-lg">❌</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterStatus(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterStatus === opt.value
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)} 
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-500 bg-white"
                >
                  {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>)}
                </select>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search by name or SKU..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-500 bg-white"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                </div>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.length === 0 ? (
                    <tr className="hover:bg-pink-50/30">
                      <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                        <div className="text-5xl mb-3">📦</div>
                        <p>No products found</p>
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
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center text-xl shadow-sm">
                              {product.emoji || '✨'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{product.name}</p>
                              <p className="text-xs text-gray-400 capitalize">{product.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs font-mono">{product.sku || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full capitalize">{product.category || 'General'}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-pink-600">₹{product.price}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => updateStock(product.id, Math.max(0, product.stock - 1))}
                              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 transition font-bold"
                            >
                              -
                            </button>
                            <span className={`w-12 text-center font-medium ${product.stock < 10 ? 'text-red-500' : 'text-gray-800'}`}>
                              {product.stock}
                            </span>
                            <button 
                              onClick={() => updateStock(product.id, product.stock + 1)}
                              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 transition font-bold"
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-100 p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Delete Product</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-2xl">⚠️</div>
                <div>
                  <p className="font-semibold text-gray-800">{productToDelete.name}</p>
                  <p className="text-xs text-gray-500">SKU: {productToDelete.sku || 'N/A'}</p>
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={() => deleteProduct(productToDelete.id)} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInventory;
