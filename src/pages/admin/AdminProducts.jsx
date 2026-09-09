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
  const [filterStockStatus, setFilterStockStatus] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);
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
      
      const normalizedProducts = allProducts.map(p => ({
        ...p,
        _id: p._id || p.id
      }));

      const approved = normalizedProducts.filter(p => p.adminApproved === true && p.status === 'active');
      const pending = normalizedProducts.filter(p => p.adminApproved !== true);
      
      setProducts(approved);
      setPendingProducts(pending);

      const initialStock = {};
      normalizedProducts.forEach(p => {
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
      
      if (!response.ok) throw new Error('Update failed');
      toast.success(`✅ Stock updated to ${parsedStock}`);
      
      setProducts(prev => prev.map(p => p._id === productId ? { ...p, stock: parsedStock } : p));
      setPendingProducts(prev => prev.map(p => p._id === productId ? { ...p, stock: parsedStock } : p));
      setStockInputs(prev => ({ ...prev, [productId]: String(parsedStock) }));
    } catch (error) {
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
      toast.success('✅ Product approved successfully');
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
      case 'active': return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium border border-emerald-200">Active</span>;
      case 'inactive': return <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium border border-gray-200">Inactive</span>;
      default: return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-medium border border-amber-200">Pending</span>;
    }
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm font-medium">Loading Inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70">
      <Helmet><title>Inventory Catalog - Amazon Seller Style</title></Helmet>
      <AdminSidebar />
      
      {/* Amazon Seller Central Style Top Header */}
      <div className="bg-[#232f3e] text-white px-4 sm:px-6 py-3.5 fixed top-0 right-0 left-0 md:left-64 z-40 shadow-md flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <span>📦</span> Manage Inventory
          </h1>
          <p className="text-[11px] text-slate-300">Catalog Dashboard • MyPinkShop Central</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/add-product" className="bg-[#ff9900] hover:bg-[#fa9400] text-slate-900 px-4 py-1.5 rounded-lg text-xs font-bold shadow transition">
            Add a Product
          </Link>
        </div>
      </div>

      <div className="md:ml-64">
        <div className="pt-20 sm:pt-24 px-3 sm:px-4 md:px-6 pb-8">
          
          {/* Metrics Bar (Amazon Seller Style KPI Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
            <div onClick={() => { setActiveTab('approved'); setSearchTerm(''); setFilterBrand('all'); setFilterStockStatus('all'); }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-3.5 cursor-pointer hover:border-amber-400 transition">
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Total Catalog</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{totalProducts}</p>
            </div>
            <div onClick={() => { setActiveTab('approved'); setFilterStockStatus('all'); }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-3.5 cursor-pointer hover:border-amber-400 transition">
              <p className="text-[11px] text-emerald-600 uppercase font-semibold">Active Listings</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{activeCount}</p>
            </div>
            <div onClick={() => setActiveTab('pending')} className="bg-white rounded-xl shadow-sm border border-slate-200 p-3.5 cursor-pointer hover:border-amber-400 transition">
              <p className="text-[11px] text-amber-600 uppercase font-semibold">Pending Review</p>
              <p className="text-xl font-bold text-amber-700 mt-1">{pendingCount}</p>
            </div>
            <div onClick={() => { setActiveTab('approved'); setFilterStockStatus('lowstock'); }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-3.5 cursor-pointer hover:border-amber-400 transition">
              <p className="text-[11px] text-orange-600 uppercase font-semibold">Low Stock Alert</p>
              <p className="text-xl font-bold text-orange-700 mt-1">{lowStockCount}</p>
            </div>
            <div onClick={() => { setActiveTab('approved'); setFilterStockStatus('outofstock'); }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-3.5 cursor-pointer hover:border-amber-400 transition">
              <p className="text-[11px] text-red-600 uppercase font-semibold">Out of Stock</p>
              <p className="text-xl font-bold text-red-700 mt-1">{outOfStockCount}</p>
            </div>
          </div>

          {/* Catalog Tab Switcher */}
          <div className="flex bg-white rounded-t-xl border-x border-t border-slate-200 px-4 pt-3 gap-6">
            <button onClick={() => { setActiveTab('approved'); setSelectedProducts([]); }} className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'approved' ? 'text-[#ff9900] border-[#ff9900]' : 'text-slate-600 border-transparent hover:text-slate-900'}`}>
              Approved Inventory ({products.length})
            </button>
            <button onClick={() => { setActiveTab('pending'); setSelectedProducts([]); }} className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'pending' ? 'text-[#ff9900] border-[#ff9900]' : 'text-slate-600 border-transparent hover:text-slate-900'}`}>
              Pending Approval Queue ({pendingProducts.length})
            </button>
          </div>

          {/* Amazon Filter Bar */}
          {activeTab === 'approved' && (
            <div className="bg-white border-x border-b border-slate-200 p-3.5 flex flex-wrap justify-between items-center gap-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2.5">
                <input type="text" placeholder="Search SKU, Product Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-52 px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#ff9900]" />
                
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:border-[#ff9900]">
                  {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>

                <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:border-[#ff9900]">
                  <option value="all">All Brands</option>
                  {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>

                <select value={filterStockStatus} onChange={(e) => setFilterStockStatus(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:border-[#ff9900]">
                  <option value="all">All Stock Status</option>
                  <option value="instock">In Stock</option>
                  <option value="lowstock">Low Stock</option>
                  <option value="outofstock">Out of Stock</option>
                </select>
              </div>

              {selectedProducts.length > 0 && (
                <button onClick={bulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow transition">
                  Delete Selected ({selectedProducts.length})
                </button>
              )}
            </div>
          )}

          {/* Amazon Seller Central Data Table */}
          <div className="bg-white rounded-b-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#eaeded] text-slate-700 text-xs uppercase font-bold border-b border-slate-300">
                  <tr>
                    {activeTab === 'approved' && <th className="p-3 w-8 text-center"><input type="checkbox" onChange={handleSelectAll} checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0} className="rounded" /></th>}
                    <th className="p-3">Product Details</th>
                    <th className="p-3">Brand</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3 text-right">Price (INR)</th>
                    <th className="p-3 text-center">Available Stock</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {currentProducts.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'approved' ? 8 : 7} className="p-12 text-center text-slate-400">
                        <p className="text-base font-semibold">No inventory records found</p>
                      </td>
                    </tr>
                  ) : (
                    currentProducts.map(product => (
                      <tr key={product._id} className="hover:bg-slate-50 transition">
                        {activeTab === 'approved' && (
                          <td className="p-3 text-center">
                            <input type="checkbox" checked={selectedProducts.includes(product._id)} onChange={() => handleSelectProduct(product._id)} className="rounded" />
                          </td>
                        )}
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {product.images && product.images[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded object-cover border border-slate-200" />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-400">IMG</div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900 line-clamp-1">{product.name}</p>
                              <p className="text-[11px] text-slate-500 capitalize">{product.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3"><span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">{product.brand || 'N/A'}</span></td>
                        <td className="p-3 font-mono text-slate-600 text-[11px]">{product.sku || 'N/A'}</td>
                        <td className="p-3 text-right font-bold text-slate-900">₹{product.price}</td>
                        
                        {/* Inline Stock Input Control */}
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-slate-50 p-1 border border-slate-200 rounded-lg">
                            <button onClick={() => updateStock(product._id, (product.stock || 0) - 1)} disabled={processingId === product._id || (product.stock || 0) <= 0} className="w-5 h-5 bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-100">-</button>
                            <input 
                              type="number"
                              min="0"
                              value={stockInputs[product._id] !== undefined ? stockInputs[product._id] : (product.stock || 0)}
                              onChange={(e) => setStockInputs({ ...stockInputs, [product._id]: e.target.value })}
                              onBlur={(e) => updateStock(product._id, e.target.value)}
                              className="w-12 text-center font-semibold bg-transparent text-xs outline-none"
                            />
                            <button onClick={() => updateStock(product._id, (product.stock || 0) + 1)} disabled={processingId === product._id} className="w-5 h-5 bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-100">+</button>
                          </div>
                        </td>

                        <td className="p-3 text-center">{getStatusBadge(product.status)}</td>
                        
                        {/* Action Buttons */}
                        <td className="p-3 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            <button onClick={() => editProduct(product._id)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium transition">Edit</button>
                            
                            {activeTab === 'pending' ? (
                              <>
                                <button onClick={() => approveProduct(product._id)} disabled={processingId === product._id} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition">Approve</button>
                                <button onClick={() => rejectProduct(product._id)} disabled={processingId === product._id} className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition">Reject</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => toggleProductStatus(product._id, product.status)} disabled={processingId === product._id} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition">
                                  {product.status === 'active' ? 'Disable' : 'Enable'}
                                </button>
                                <button onClick={() => { setProductToDelete(product); setShowDeleteModal(true); }} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded font-medium transition">Delete</button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-900 mb-2">Confirm Deletion</h3>
            <p className="text-slate-600 text-xs mb-5">Are you sure you want to delete "{productToDelete.name}" from catalog?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={() => deleteProduct(productToDelete._id)} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
