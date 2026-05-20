import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    // Load from localStorage or use default
    const savedProducts = localStorage.getItem('adminProductsList');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      const defaultProducts = [
        { id: 1, name: 'Glass Skin Serum', sku: 'SKU-001', category: 'skincare', price: 1299, originalPrice: 1999, stock: 45, status: 'active', vendor: 'Nykaa Beauty', image: '💧', sales: 234, rating: 4.8 },
        { id: 2, name: 'Rice Water Toner', sku: 'SKU-002', category: 'skincare', price: 899, originalPrice: 1299, stock: 60, status: 'active', vendor: 'Nykaa Beauty', image: '🌸', sales: 189, rating: 4.6 },
        { id: 3, name: 'Cherry Lip Tint', sku: 'SKU-003', category: 'makeup', price: 599, originalPrice: 999, stock: 100, status: 'active', vendor: 'Nykaa Beauty', image: '🍒', sales: 567, rating: 4.7 },
        { id: 4, name: 'Satin Slip Dress', sku: 'SKU-004', category: 'clothing', price: 2499, originalPrice: 3999, stock: 25, status: 'active', vendor: 'Nykaa Fashion', image: '👗', sales: 89, rating: 4.9 },
        { id: 5, name: 'Vitamin C Face Wash', sku: 'SKU-005', category: 'skincare', price: 399, originalPrice: 599, stock: 8, status: 'lowstock', vendor: 'Mamaearth', image: '🍊', sales: 234, rating: 4.5 },
      ];
      setProducts(defaultProducts);
      localStorage.setItem('adminProductsList', JSON.stringify(defaultProducts));
    }
    setLoading(false);
  }, []);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>;
      case 'lowstock': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Low Stock</span>;
      case 'outofstock': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Out of Stock</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">Inactive</span>;
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(filteredProducts.map(p => p.id));
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

  const deleteProduct = (productId) => {
    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    localStorage.setItem('adminProductsList', JSON.stringify(updatedProducts));
    setShowDeleteModal(false);
    setProductToDelete(null);
    alert('Product deleted successfully');
  };

  const bulkDelete = () => {
    if (selectedProducts.length === 0) return;
    const updatedProducts = products.filter(p => !selectedProducts.includes(p.id));
    setProducts(updatedProducts);
    localStorage.setItem('adminProductsList', JSON.stringify(updatedProducts));
    setSelectedProducts([]);
    alert(`${selectedProducts.length} products deleted successfully`);
  };

  const toggleProductStatus = (productId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const updatedProducts = products.map(p => p.id === productId ? { ...p, status: newStatus } : p);
    setProducts(updatedProducts);
    localStorage.setItem('adminProductsList', JSON.stringify(updatedProducts));
    alert(`Product status updated to ${newStatus}`);
  };

  const filteredProducts = products.filter(p => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !p.sku.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="text-gray-600 hover:text-gray-800">←</button>
            <h1 className="text-xl font-semibold text-gray-800">Product Management</h1>
          </div>
          <Link to="/admin/add-product" className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-700 transition">
            + Add Product
          </Link>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Total Products</p><p className="text-2xl font-semibold">{products.length}</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Active</p><p className="text-2xl font-semibold text-green-600">{products.filter(p => p.status === 'active').length}</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Low Stock</p><p className="text-2xl font-semibold text-yellow-600">{products.filter(p => p.status === 'lowstock').length}</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Out of Stock</p><p className="text-2xl font-semibold text-red-600">{products.filter(p => p.status === 'outofstock').length}</p></div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <input type="text" placeholder="Search by name or SKU" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded text-sm">
                {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded text-sm">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="lowstock">Low Stock</option>
                <option value="outofstock">Out of Stock</option>
              </select>
            </div>
            {selectedProducts.length > 0 && (
              <button onClick={bulkDelete} className="bg-red-500 text-white px-3 py-1.5 rounded text-sm">Delete Selected ({selectedProducts.length})</button>
            )}
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 w-8"><input type="checkbox" onChange={handleSelectAll} checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0} className="rounded" /></th>
                  <th className="px-4 py-3 text-left">Product</th>
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
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => handleSelectProduct(product.id)} className="rounded" /></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xl">{product.image}</div><span className="font-medium">{product.name}</span></div></td>
                    <td className="px-4 py-3 text-gray-500">{product.sku}</td>
                    <td className="px-4 py-3 text-gray-500">{product.vendor}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{product.price}</td>
                    <td className={`px-4 py-3 text-center ${product.stock < 10 ? 'text-red-500 font-medium' : ''}`}>{product.stock}</td>
                    <td className="px-4 py-3 text-center">{product.sales}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(product.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <Link to={`/admin/edit-product/${product.id}`} className="text-blue-500 hover:text-blue-700">✏️</Link>
                        <button onClick={() => { setProductToDelete(product); setShowDeleteModal(true); }} className="text-red-500 hover:text-red-700">🗑️</button>
                        <button onClick={() => toggleProductStatus(product.id, product.status)} className="text-gray-500 hover:text-gray-700">🔄</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="p-8 text-center"><p className="text-gray-500">No products found</p></div>
          )}
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
