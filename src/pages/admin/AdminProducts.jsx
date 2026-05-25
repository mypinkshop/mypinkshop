import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('approved');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const savedProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    
    const approved = savedProducts.filter(p => p.adminApproved === true && p.status === 'active');
    const pending = savedProducts.filter(p => p.adminApproved !== true);
    
    setProducts(approved);
    setPendingProducts(pending);
    setLoading(false);
  }, []);

  const saveProducts = (updatedProducts) => {
    localStorage.setItem('adminProductsList', JSON.stringify(updatedProducts));
    const approved = updatedProducts.filter(p => p.adminApproved === true && p.status === 'active');
    const pending = updatedProducts.filter(p => p.adminApproved !== true);
    setProducts(approved);
    setPendingProducts(pending);
  };

  const approveProduct = (productId) => {
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const updated = allProducts.map(p => 
      p.id === productId ? { ...p, adminApproved: true, status: 'active', approvedDate: new Date().toISOString().split('T')[0] } : p
    );
    saveProducts(updated);
    alert('Product approved and now visible on website');
  };

  const rejectProduct = (productId) => {
    if (window.confirm('Reject and delete this product?')) {
      const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
      const updated = allProducts.filter(p => p.id !== productId);
      saveProducts(updated);
      alert('Product rejected and removed');
    }
  };

  const deleteProduct = (productId) => {
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const updated = allProducts.filter(p => p.id !== productId);
    saveProducts(updated);
    setShowDeleteModal(false);
    setProductToDelete(null);
    alert('Product deleted successfully');
  };

  const bulkDelete = () => {
    if (selectedProducts.length === 0) return;
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const updated = allProducts.filter(p => !selectedProducts.includes(p.id));
    saveProducts(updated);
    setSelectedProducts([]);
    alert(`${selectedProducts.length} products deleted successfully`);
  };

  const toggleProductStatus = (productId, currentStatus) => {
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const updated = allProducts.map(p => p.id === productId ? { ...p, status: newStatus } : p);
    saveProducts(updated);
    alert(`Product status updated to ${newStatus}`);
  };

  const handleSelectAll = (e) => {
    const currentProducts = activeTab === 'approved' ? products : pendingProducts;
    if (e.target.checked) {
      setSelectedProducts(currentProducts.map(p => p.id));
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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>;
      case 'lowstock': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Low Stock</span>;
      case 'outofstock': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Out of Stock</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">Inactive</span>;
    }
  };

  const filteredApproved = products.filter(p => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !p.sku?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    return true;
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'skincare', label: 'Skincare' },
    { value: 'makeup', label: 'Makeup' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'accessories', label: 'Accessories' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const currentProducts = activeTab === 'approved' ? filteredApproved : pendingProducts;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="text-gray-600 hover:text-gray-800">Back</button>
            <h1 className="text-xl font-semibold text-gray-800">Product Management</h1>
          </div>
          <Link to="/admin/add-product" className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-700 transition">
            Add Product
          </Link>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Total Products</p>
            <p className="text-2xl font-semibold">{products.length + pendingProducts.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-2xl font-semibold text-green-600">{products.filter(p => p.status === 'active').length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Pending Approval</p>
            <p className="text-2xl font-semibold text-yellow-600">{pendingProducts.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Out of Stock</p>
            <p className="text-2xl font-semibold text-red-600">{products.filter(p => p.stock < 1).length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <button onClick={() => { setActiveTab('approved'); setSelectedProducts([]); }} className={`px-4 py-2 text-sm font-medium ${activeTab === 'approved' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>
            Approved Products ({products.length})
          </button>
          <button onClick={() => { setActiveTab('pending'); setSelectedProducts([]); }} className={`px-4 py-2 text-sm font-medium ${activeTab === 'pending' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>
            Pending Approval ({pendingProducts.length})
          </button>
        </div>

        {/* Filters (only for approved tab) */}
        {activeTab === 'approved' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <input type="text" placeholder="Search by name or SKU" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm" />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                </div>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded text-sm">
                  {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
              </div>
              {selectedProducts.length > 0 && (
                <button onClick={bulkDelete} className="bg-red-500 text-white px-3 py-1.5 rounded text-sm">Delete Selected ({selectedProducts.length})</button>
              )}
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="border-b">
                  {activeTab === 'approved' && <th className="px-4 py-3 w-8"><input type="checkbox" onChange={handleSelectAll} checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0} className="rounded" /></th>}
                  <th className="px-4 py-3 text-left">Product Name</th>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Vendor</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3 text-center">Sales</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentProducts.length === 0 ? (
                  <tr className="hover:bg-gray-50">
                    <td colSpan={activeTab === 'approved' ? 9 : 8} className="px-4 py-8 text-center text-gray-500">
                      {activeTab === 'pending' ? 'No products pending approval' : 'No products found'}
                    </td>
                  </tr>
                ) : (
                  currentProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      {activeTab === 'approved' && (
                        <td className="px-4 py-3"><input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => handleSelectProduct(product.id)} className="rounded" /></td>
                      )}
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-gray-500">{product.sku || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{product.vendor}</td>
                      <td className="px-4 py-3 text-right font-semibold">₹{product.price}</td>
                      <td className={`px-4 py-3 text-center ${product.stock < 10 ? 'text-red-500 font-medium' : ''}`}>{product.stock}</td>
                      <td className="px-4 py-3 text-center">{product.sales || 0}</td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(product.status)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          {activeTab === 'pending' ? (
                            <>
                              <button onClick={() => approveProduct(product.id)} className="text-green-500 hover:text-green-700">Approve</button>
                              <button onClick={() => rejectProduct(product.id)} className="text-red-500 hover:text-red-700">Reject</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => toggleProductStatus(product.id, product.status)} className="text-blue-500 hover:text-blue-700">{product.status === 'active' ? 'Disable' : 'Enable'}</button>
                              <button onClick={() => { setProductToDelete(product); setShowDeleteModal(true); }} className="text-red-500 hover:text-red-700">Delete</button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Delete Product</h3>
            <p className="text-gray-500 mb-4">Are you sure you want to delete "{productToDelete.name}"? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={() => deleteProduct(productToDelete.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
