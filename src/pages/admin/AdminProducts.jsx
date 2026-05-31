import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('approved');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [brandSearch, setBrandSearch] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  const API_URL = 'https://mypinkshop-dr93.vercel.app';

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadProducts();
  }, [navigate]);

  // Load products from backend API
  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/products`);
      
      if (!response.ok) {
        throw new Error('Failed to load products');
      }
      
      const data = await response.json();
      
      const approved = data.filter(p => p.adminApproved === true && p.status === 'active');
      const pending = data.filter(p => p.adminApproved !== true);
      
      setProducts(approved);
      setPendingProducts(pending);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      setPendingProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Update stock in backend
  const updateStock = async (productId, newStock) => {
    if (newStock < 0) return;
    
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });
      
      if (!response.ok) throw new Error('Update failed');
      
      await loadProducts();
      alert(`✓ Stock updated to ${newStock}`);
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock');
    }
  };

  // Approve product
  const approveProduct = async (productId) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminApproved: true, status: 'active' })
      });
      
      if (!response.ok) throw new Error('Approval failed');
      
      await loadProducts();
      alert('✓ Product approved');
    } catch (error) {
      console.error('Error approving product:', error);
      alert('Failed to approve product');
    }
  };

  // Reject product
  const rejectProduct = async (productId) => {
    if (!window.confirm('Reject and delete this product?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Rejection failed');
      
      await loadProducts();
      alert('✗ Product rejected and removed');
    } catch (error) {
      console.error('Error rejecting product:', error);
      alert('Failed to reject product');
    }
  };

  // Delete product
  const deleteProduct = async (productId) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Delete failed');
      
      await loadProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
      setSelectedProducts([]);
      alert('🗑 Product deleted');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  // Bulk delete
  const bulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!window.confirm(`Delete ${selectedProducts.length} products?`)) return;
    
    try {
      for (const productId of selectedProducts) {
        await fetch(`${API_URL}/api/products/${productId}`, { method: 'DELETE' });
      }
      await loadProducts();
      setSelectedProducts([]);
      alert(`${selectedProducts.length} products deleted`);
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('Failed to delete some products');
    }
  };

  // Toggle product status
  const toggleProductStatus = async (productId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Status update failed');
      
      await loadProducts();
      alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  // Edit product
  const editProduct = (productId) => {
    navigate(`/admin/edit-product/${productId}`);
  };

  const handleSelectAll = (e) => {
    const currentProducts = activeTab === 'approved' ? filteredApproved : pendingProducts;
    if (e.target.checked) {
      setSelectedProducts(currentProducts.map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  // Get unique brands
  const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>;
      case 'inactive': return <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">Inactive</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">Inactive</span>;
    }
  };

  const getStockBadge = (stock) => {
    if (stock === 0) return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Out of Stock</span>;
    if (stock < 10) return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium animate-pulse">Low Stock</span>;
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

  // Filter products
  const filteredApproved = products.filter(p => {
    if (searchTerm && !p.name?.toLowerCase().includes(searchTerm.toLowerCase()) && !p.sku?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterCategory !== 'all' && p.mainCategory?.toLowerCase() !== filterCategory && p.category?.toLowerCase() !== filterCategory) return false;
    if (filterBrand !== 'all' && p.brand !== filterBrand) return false;
    if (filterStockStatus !== 'all') {
      if (filterStockStatus === 'instock' && p.stock === 0) return false;
      if (filterStockStatus === 'lowstock' && (p.stock >= 10 || p.stock === 0)) return false;
      if (filterStockStatus === 'outofstock' && p.stock > 0) return false;
    }
    return true;
  });

  // Stats
  const totalProducts = products.length + pendingProducts.length;
  const activeCount = products.filter(p => p.status === 'active').length;
  const pendingCount = pendingProducts.length;
  const lowStockCount = products.filter(p => p.stock < 10 && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const handleStatsClick = (type) => {
    setActiveTab('approved');
    setSearchTerm('');
    setFilterBrand('all');
    setBrandSearch('');
    if (type === 'pending') {
      setActiveTab('pending');
    } else if (type === 'active') {
      setFilterStockStatus('all');
      setFilterCategory('all');
    } else if (type === 'lowstock') {
      setFilterStockStatus('lowstock');
      setFilterCategory('all');
    } else if (type === 'outofstock') {
      setFilterStockStatus('outofstock');
      setFilterCategory('all');
    } else if (type === 'all') {
      setFilterStockStatus('all');
      setFilterCategory('all');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  const currentProducts = activeTab === 'approved' ? filteredApproved : pendingProducts;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50/30">
      <AdminSidebar />
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-pink-100 px-4 sm:px-6 py-3 sm:py-4 fixed top-0 right-0 left-0 md:left-64 z-40 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Product Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage your product catalog</p>
          </div>
          <Link to="/admin/add-product" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:shadow-lg hover:scale-105 transition-all">
            + Add Product
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64">
        <div className="pt-20 sm:pt-24 px-3 sm:px-4 md:px-6 pb-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div onClick={() => handleStatsClick('all')} className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 cursor-pointer hover:shadow-md hover:border-pink-300 transition group">
              <div className="flex items-center justify-between mb-2"><p className="text-xs text-gray-500">Total Products</p><span className="text-xl text-gray-400 group-hover:scale-110 transition">📦</span></div>
              <p className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{totalProducts}</p>
            </div>
            <div onClick={() => handleStatsClick('active')} className="bg-white rounded-2xl shadow-sm border border-green-100 p-4 cursor-pointer hover:shadow-md hover:border-green-300 transition group">
              <div className="flex items-center justify-between mb-2"><p className="text-xs text-gray-500">Active</p><span className="text-xl text-green-500 group-hover:scale-110 transition">✅</span></div>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            </div>
            <div onClick={() => handleStatsClick('pending')} className="bg-white rounded-2xl shadow-sm border border-amber-100 p-4 cursor-pointer hover:shadow-md hover:border-amber-300 transition group">
              <div className="flex items-center justify-between mb-2"><p className="text-xs text-gray-500">Pending</p><span className="text-xl text-amber-500 group-hover:scale-110 transition">⏳</span></div>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </div>
            <div onClick={() => handleStatsClick('lowstock')} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 cursor-pointer hover:shadow-md hover:border-orange-300 transition group">
              <div className="flex items-center justify-between mb-2"><p className="text-xs text-gray-500">Low Stock</p><span className="text-xl text-orange-500 group-hover:scale-110 transition">⚠️</span></div>
              <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
            </div>
            <div onClick={() => handleStatsClick('outofstock')} className="bg-white rounded-2xl shadow-sm border border-red-100 p-4 cursor-pointer hover:shadow-md hover:border-red-300 transition group">
              <div className="flex items-center justify-between mb-2"><p className="text-xs text-gray-500">Out of Stock</p><span className="text-xl text-red-500 group-hover:scale-110 transition">❌</span></div>
              <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-6 border-b border-pink-100 mb-6">
            <button onClick={() => { setActiveTab('approved'); setSelectedProducts([]); setSearchTerm(''); setFilterBrand('all'); setFilterStockStatus('all'); setBrandSearch(''); }} className={`pb-2 text-sm font-medium transition-all ${activeTab === 'approved' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>
              Approved ({products.length})
            </button>
            <button onClick={() => { setActiveTab('pending'); setSelectedProducts([]); setSearchTerm(''); setFilterBrand('all'); setFilterStockStatus('all'); setBrandSearch(''); }} className={`pb-2 text-sm font-medium transition-all ${activeTab === 'pending' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>
              Pending ({pendingProducts.length})
            </button>
          </div>

          {/* Filters */}
          {activeTab === 'approved' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 mb-6 overflow-hidden">
              <div className="p-4 border-b border-pink-100 flex flex-wrap justify-between items-center gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search by name */}
                  <div className="relative">
                    <input type="text" placeholder="Search by name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-48 sm:w-56 pl-9 pr-3 py-2 border border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-white" />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                  </div>
                  
                  {/* Category filter */}
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-white">
                    {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                  
                  {/* ✅ Brand Filter - Fixed Z-Index (No Overlap) */}
                  <div className="relative" style={{ zIndex: 60 }}>
                    <div className="flex items-center border border-pink-200 rounded-xl bg-white overflow-hidden">
                      <input
                        type="text"
                        placeholder="Search by brand..."
                        value={brandSearch}
                        onChange={(e) => {
                          setBrandSearch(e.target.value);
                          setShowBrandDropdown(true);
                        }}
                        onFocus={() => setShowBrandDropdown(true)}
                        className="px-3 py-2 text-sm focus:outline-none flex-1 min-w-[140px]"
                      />
                      <button
                        onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                        className="px-2 py-2 border-l border-pink-200 text-gray-400 hover:text-pink-500"
                      >
                        <span className="text-sm">▼</span>
                      </button>
                    </div>
                    
                    {showBrandDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-white border border-pink-200 rounded-xl shadow-lg max-h-60 overflow-y-auto" style={{ zIndex: 9999 }}>
                        <button
                          onClick={() => {
                            setFilterBrand('all');
                            setBrandSearch('');
                            setShowBrandDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-pink-50 transition ${filterBrand === 'all' ? 'bg-pink-100 text-pink-600 font-medium' : 'text-gray-700'}`}
                        >
                          All Brands
                        </button>
                        {uniqueBrands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase())).map(brand => (
                          <button
                            key={brand}
                            onClick={() => {
                              setFilterBrand(brand);
                              setBrandSearch('');
                              setShowBrandDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-pink-50 transition"
                          >
                            {brand}
                          </button>
                        ))}
                        {uniqueBrands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase())).length === 0 && brandSearch && (
                          <div className="px-3 py-2 text-sm text-gray-400">No brands found</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Stock status filter */}
                  <select value={filterStockStatus} onChange={(e) => setFilterStockStatus(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-white">
                    <option value="all">All Stock</option>
                    <option value="instock">In Stock (&gt;10)</option>
                    <option value="lowstock">Low Stock (1-10)</option>
                    <option value="outofstock">Out of Stock (0)</option>
                  </select>
                  
                  {/* Clear all button */}
                  {(filterBrand !== 'all' || searchTerm || filterCategory !== 'all' || filterStockStatus !== 'all') && (
                    <button onClick={() => { setSearchTerm(''); setFilterCategory('all'); setFilterBrand('all'); setFilterStockStatus('all'); setBrandSearch(''); }} className="px-3 py-2 text-sm text-pink-600 hover:bg-pink-50 rounded-xl transition">
                      Clear All ✕
                    </button>
                  )}
                </div>
                
                {selectedProducts.length > 0 && (
                  <button onClick={bulkDelete} className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
                    Delete Selected ({selectedProducts.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
                  <tr>
                    {activeTab === 'approved' && <th className="px-4 py-3 w-8"><input type="checkbox" onChange={handleSelectAll} checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0} className="rounded border-pink-300" /></th>}
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Product</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Brand</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">SKU</th>
                    <th className="px-4 py-3 text-right text-gray-700 font-semibold">Price</th>
                    <th className="px-4 py-3 text-center text-gray-700 font-semibold">Stock</th>
                    <th className="px-4 py-3 text-center text-gray-700 font-semibold">Status</th>
                    <th className="px-4 py-3 text-center text-gray-700 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {currentProducts.length === 0 ? (
                    <tr className="hover:bg-pink-50/30">
                      <td colSpan={activeTab === 'approved' ? 8 : 7} className="px-4 py-16 text-center">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-gray-400">{activeTab === 'pending' ? 'No products pending' : 'No products found'}</p>
                        {activeTab === 'approved' && <Link to="/admin/add-product" className="mt-3 inline-block text-pink-500 text-sm hover:underline">Add your first product →</Link>}
                       </td>
                    </tr>
                  ) : (
                    currentProducts.map(product => (
                      <tr key={product._id} className="hover:bg-pink-50/30 transition">
                        {activeTab === 'approved' && (
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selectedProducts.includes(product._id)} onChange={() => handleSelectProduct(product._id)} className="rounded border-pink-300" />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.images && product.images[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-xl object-cover border border-pink-100 shadow-sm" />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl flex items-center justify-center text-lg">✨</div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800 line-clamp-1">{product.name}</p>
                              <p className="text-xs text-gray-400 capitalize">{product.mainCategory || product.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-full">
                            {product.brand || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs font-mono">{product.sku?.slice(-8) || 'N/A'}</td>
                        <td className="px-4 py-3 text-right font-bold text-pink-600">₹{product.price}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => updateStock(product._id, product.stock - 1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-pink-100 transition font-bold text-gray-600 hover:text-pink-600">-</button>
                            <div className="flex flex-col items-center">
                              {getStockBadge(product.stock)}
                              <span className="text-xs text-gray-500 mt-1">{product.stock} units</span>
                            </div>
                            <button onClick={() => updateStock(product._id, product.stock + 1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-pink-100 transition font-bold text-gray-600 hover:text-pink-600">+</button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">{getStatusBadge(product.status)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            {activeTab === 'pending' ? (
                              <>
                                <button onClick={() => approveProduct(product._id)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition" title="Approve">✅</button>
                                <button onClick={() => rejectProduct(product._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Reject">❌</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => editProduct(product._id)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Edit">✏️</button>
                                <button onClick={() => toggleProductStatus(product._id, product.status)} className={`p-1.5 rounded-lg transition ${product.status === 'active' ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`} title={product.status === 'active' ? 'Disable' : 'Enable'}>
                                  {product.status === 'active' ? '🔒' : '🔓'}
                                </button>
                                <button onClick={() => { setProductToDelete(product); setShowDeleteModal(true); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">🗑️</button>
                              </>
                            )}
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
            <p className="text-xs text-gray-400">Showing {currentProducts.length} of {activeTab === 'approved' ? products.length : pendingProducts.length} products</p>
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
                  <p className="text-xs text-gray-400">Brand: {productToDelete.brand || 'N/A'}</p>
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={() => deleteProduct(productToDelete._id)} className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition">Delete</button>
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

export default AdminProducts;
