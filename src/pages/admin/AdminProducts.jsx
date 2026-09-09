import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AdminSidebar from './components/AdminSidebar';
import toast from 'react-hot-toast';

function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
  const [processingId, setProcessingId] = useState(null);
  
  // Direct stock input state tracking: { [productId]: stringValue }
  const [stockInputs, setStockInputs] = useState({});

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadProducts();
  }, [navigate]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_URL}/api/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      
      if (!response.ok) throw new Error('Failed to load products');
      
      let data = await response.json();
      const rawProducts = data.products || data.data || data;
      const allProducts = Array.isArray(rawProducts) ? rawProducts : [];
      
      const approved = allProducts.filter(p => p.adminApproved === true && p.status === 'active');
      const pending = allProducts.filter(p => p.adminApproved !== true);
      
      const mappedApproved = approved.map(p => ({ ...p, _id: p._id || p.id }));
      const mappedPending = pending.map(p => ({ ...p, _id: p._id || p.id }));

      setProducts(mappedApproved);
      setPendingProducts(mappedPending);

      // Initialize stock inputs map
      const initialStock = {};
      [...mappedApproved, ...mappedPending].forEach(p => {
        initialStock[p._id] = String(p.stock || 0);
      });
      setStockInputs(initialStock);

    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products');
      toast.error('Failed to load products');
      setProducts([]);
      setPendingProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId, newStock) => {
    const parsedStock = parseInt(newStock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) return;
    
    setProcessingId(productId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stock: parsedStock })
      });
      
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      
      if (!response.ok) throw new Error('Update failed');
      
      toast.success(`✅ Stock updated to ${parsedStock}`);
      
      // Update local state directly for instant UI reflection
      setProducts(prev => prev.map(p => p._id === productId ? { ...p, stock: parsedStock } : p));
      setPendingProducts(prev => prev.map(p => p._id === productId ? { ...p, stock: parsedStock } : p));
      setStockInputs(prev => ({ ...prev, [productId]: String(parsedStock) }));
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    } finally {
      setProcessingId(null);
    }
  };

  const approveProduct = async (productId) => {
    setProcessingId(productId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminApproved: true, status: 'active' })
      });
      
      if (!response.ok) throw new Error('Approval failed');
      toast.success('✅ Product approved');
      await loadProducts();
    } catch (error) {
      toast.error('Failed to approve product');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectProduct = async (productId) => {
    if (!window.confirm('Reject and delete this product?')) return;
    setProcessingId(productId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Rejection failed');
      toast.success('❌ Product rejected and removed');
      await loadProducts();
    } catch (error) {
      toast.error('Failed to reject product');
    } finally {
      setProcessingId(null);
    }
  };

  const deleteProduct = async (productId) => {
    setProcessingId(productId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Delete failed');
      toast.success('🗑 Product deleted');
      await loadProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
      setSelectedProducts([]);
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setProcessingId(null);
    }
  };

  const bulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Select products to delete');
      return;
    }
    if (!window.confirm(`Delete ${selectedProducts.length} products?`)) return;
    
    const token = localStorage.getItem('adminToken');
    let deleted = 0;

    for (const productId of selectedProducts) {
      try {
        const res = await fetch(`${API_URL}/api/products/${productId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) deleted++;
      } catch (err) {}
    }
    
    toast.success(`✅ ${deleted} products deleted successfully`);
    await loadProducts();
    setSelectedProducts([]);
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setProcessingId(productId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Status update failed');
      toast.success(`✅ Status updated to ${newStatus}`);
      await loadProducts();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

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

  const uniqueBrands = [...new Set((Array.isArray(products) ? products : []).map(p => p.brand).filter(Boolean))].sort();

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>;
      case 'inactive': return <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold">Inactive</span>;
      default: return <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold">{status || 'Draft'}</span>;
    }
  };

  const getStockBadge = (stock) => {
    if (stock === 0) return <span className="text-xs text-red-600 font-medium">Out of Stock</span>;
    if (stock < 10) return <span className="text-xs text-amber-600 font-medium">Low Stock</span>;
    return <span className="text-xs text-green-600 font-medium">In Stock</span>;
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'skincare', label: 'Skincare' },
    { value: 'makeup', label: 'Makeup' },
    { value: 'hair', label: 'Hair' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'accessories', label: 'Accessories' },
  ];

  const filteredApproved = (Array.isArray(products) ? products : []).filter(p => {
    if (searchTerm && !p.name?.toLowerCase().includes(searchTerm.toLowerCase()) && !p.sku?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterCategory !== 'all' && p.mainCategory?.toLowerCase() !== filterCategory && p.category?.toLowerCase() !== filterCategory) return false;
    if (filterBrand !== 'all' && p.brand !== filterBrand) return false;
    if (filterStockStatus !== 'all') {
      if (filterStockStatus === 'instock' && (p.stock === 0 || p.stock < 10)) return false;
      if (filterStockStatus === 'lowstock' && (p.stock >= 10 || p.stock === 0)) return false;
      if (filterStockStatus === 'outofstock' && p.stock > 0) return false;
    }
    return true;
  });

  const totalProducts = (Array.isArray(products) ? products.length : 0) + (Array.isArray(pendingProducts) ? pendingProducts.length : 0);
  const activeCount = (Array.isArray(products) ? products : []).filter(p => p.status === 'active').length;
  const pendingCount = Array.isArray(pendingProducts) ? pendingProducts.length : 0;
  const lowStockCount = (Array.isArray(products) ? products : []).filter(p => p.stock < 10 && p.stock > 0).length;
  const outOfStockCount = (Array.isArray(products) ? products : []).filter(p => p.stock === 0).length;

  const currentProducts = activeTab === 'approved' ? filteredApproved : pendingProducts;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50/30">
      <Helmet><title>Product Management - Admin Dashboard</title></Helmet>
      <AdminSidebar />
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-pink-100 px-4 sm:px-6 py-3 sm:py-4 fixed top-0 right-0 left-0 md:left-64 z-40 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">📦 Product Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage your product catalog</p>
          </div>
          <Link to="/admin/add-product" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all">
            + Add Product
          </Link>
        </div>
      </div>

      <div className="md:ml-64">
        <div className="pt-20 sm:pt-24 px-3 sm:px-4 md:px-6 pb-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div onClick={() => { setActiveTab('approved'); setSearchTerm(''); setFilterBrand('all'); setFilterStockStatus('all'); }} className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 cursor-pointer hover:shadow-md transition">
              <p className="text-xs text-gray-500 mb-1">Total Products</p>
              <p className="text-2xl font-bold text-gray-800">{totalProducts}</p>
            </div>
            <div onClick={() => { setActiveTab('approved'); setFilterStockStatus('all'); }} className="bg-white rounded-2xl shadow-sm border border-green-100 p-4 cursor-pointer hover:shadow-md transition">
              <p className="text-xs text-gray-500 mb-1">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            </div>
            <div onClick={() => setActiveTab('pending')} className="bg-white rounded-2xl shadow-sm border border-amber-100 p-4 cursor-pointer hover:shadow-md transition">
              <p className="text-xs text-gray-500 mb-1">Pending Approval</p>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </div>
            <div onClick={() => { setActiveTab('approved'); setFilterStockStatus('lowstock'); }} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 cursor-pointer hover:shadow-md transition">
              <p className="text-xs text-gray-500 mb-1">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
            </div>
            <div onClick={() => { setActiveTab('approved'); setFilterStockStatus('outofstock'); }} className="bg-white rounded-2xl shadow-sm border border-red-100 p-4 cursor-pointer hover:shadow-md transition">
              <p className="text-xs text-gray-500 mb-1">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-6 border-b border-pink-100 mb-6">
            <button onClick={() => { setActiveTab('approved'); setSelectedProducts([]); }} className={`pb-2 text-sm font-medium transition-all ${activeTab === 'approved' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>
              ✅ Approved Products ({products.length})
            </button>
            <button onClick={() => { setActiveTab('pending'); setSelectedProducts([]); }} className={`pb-2 text-sm font-medium transition-all ${activeTab === 'pending' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>
              ⏳ Pending Approval ({pendingProducts.length})
            </button>
          </div>

          {/* Filters Bar */}
          {activeTab === 'approved' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 mb-6 p-4 flex flex-wrap justify-between items-center gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <input type="text" placeholder="Search by name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-48 sm:w-56 px-3 py-2 border border-pink-200 rounded-xl text-sm bg-white outline-none focus:border-pink-500" />
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-xl text-sm bg-white outline-none focus:border-pink-500">
                  {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
                <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-xl text-sm bg-white outline-none focus:border-pink-500">
                  <option value="all">All Brands</option>
                  {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={filterStockStatus} onChange={(e) => setFilterStockStatus(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-xl text-sm bg-white outline-none focus:border-pink-500">
                  <option value="all">All Stock Status</option>
                  <option value="instock">In Stock (&gt;10)</option>
                  <option value="lowstock">Low Stock (1-10)</option>
                  <option value="outofstock">Out of Stock (0)</option>
                </select>
              </div>
              {selectedProducts.length > 0 && (
                <button onClick={bulkDelete} className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition">
                  🗑️ Delete Selected ({selectedProducts.length})
                </button>
              )}
            </div>
          )}

          {/* Products Table with Direct Stock Input & Action Buttons */}
          <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-pink-50/70 border-b border-pink-100">
                  <tr>
                    {activeTab === 'approved' && <th className="px-4 py-3 w-8"><input type="checkbox" onChange={handleSelectAll} checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0} className="rounded border-pink-300" /></th>}
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Brand</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">SKU</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Price</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Stock Management</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {currentProducts.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'approved' ? 8 : 7} className="px-4 py-16 text-center text-gray-400">
                        <div className="text-5xl mb-2">📦</div>
                        <p>{activeTab === 'pending' ? 'No products pending approval' : 'No products found'}</p>
                      </td>
                    </tr>
                  ) : (
                    currentProducts.map(product => (
                      <tr key={product._id} className="hover:bg-pink-50/20 transition">
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
                              <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-lg">✨</div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800 line-clamp-1">{product.name}</p>
                              <p className="text-xs text-gray-400 capitalize">{product.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">{product.brand || 'N/A'}</span></td>
                        <td className="px-4 py-3 text-gray-500 text-xs font-mono">{product.sku?.slice(-8) || 'N/A'}</td>
                        <td className="px-4 py-3 text-right font-bold text-pink-600">₹{product.price}</td>
                        
                        {/* ✅ STOCK MANAGEMENT: Direct Input Field + Plus/Minus Buttons */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => updateStock(product._id, (product.stock || 0) - 1)} 
                              disabled={processingId === product._id || (product.stock || 0) <= 0}
                              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-600 font-bold transition disabled:opacity-40"
                            >-</button>
                            
                            <input 
                              type="number"
                              min="0"
                              value={stockInputs[product._id] !== undefined ? stockInputs[product._id] : (product.stock || 0)}
                              onChange={(e) => setStockInputs({ ...stockInputs, [product._id]: e.target.value })}
                              onBlur={(e) => updateStock(product._id, e.target.value)}
                              className="w-16 px-2 py-1 text-center border border-pink-200 rounded-lg text-sm font-semibold outline-none focus:border-pink-500 bg-white"
                            />
                            
                            <button 
                              onClick={() => updateStock(product._id, (product.stock || 0) + 1)} 
                              disabled={processingId === product._id}
                              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-600 font-bold transition disabled:opacity-40"
                            >+</button>
                          </div>
                          <div className="text-center mt-1">{getStockBadge(product.stock || 0)}</div>
                        </td>

                        <td className="px-4 py-3 text-center">{getStatusBadge(product.status)}</td>
                        
                        {/* ✅ RESTORED FULL ACTION BUTTONS (Edit, Toggle Status, Delete) */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            {activeTab === 'pending' ? (
                              <>
                                <button onClick={() => approveProduct(product._id)} disabled={processingId === product._id} className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition">Approve</button>
                                <button onClick={() => rejectProduct(product._id)} disabled={processingId === product._id} className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition">Reject</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => editProduct(product._id)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition" title="Edit Product">✏️ Edit</button>
                                <button onClick={() => toggleProductStatus(product._id, product.status)} disabled={processingId === product._id} className={`p-2 rounded-xl transition ${product.status === 'active' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`} title={product.status === 'active' ? 'Disable Product' : 'Enable Product'}>
                                  {product.status === 'active' ? '🔒 Disable' : '🔓 Enable'}
                                </button>
                                <button onClick={() => { setProductToDelete(product); setShowDeleteModal(true); }} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition" title="Delete Product">🗑️</button>
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

        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-2">🗑️ Delete Product</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete "{productToDelete.name}"? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 border rounded-xl text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteProduct(productToDelete._id)} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
