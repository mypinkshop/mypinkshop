import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminInventory() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const products = [
    { id: 1, name: 'Glass Skin Serum', sku: 'SKU-001', category: 'Skincare', price: 1299, stock: 45, status: 'active', image: '💧' },
    { id: 2, name: 'Rice Water Toner', sku: 'SKU-002', category: 'Skincare', price: 899, stock: 8, status: 'lowstock', image: '🌸' },
    { id: 3, name: 'Cherry Lip Tint', sku: 'SKU-003', category: 'Makeup', price: 599, stock: 0, status: 'outofstock', image: '🍒' },
    { id: 4, name: 'Satin Slip Dress', sku: 'SKU-004', category: 'Clothing', price: 2499, stock: 25, status: 'active', image: '👗' },
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>;
      case 'lowstock': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Low Stock</span>;
      case 'outofstock': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Out of Stock</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">Inactive</span>;
    }
  };

  const filteredProducts = products.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !p.sku.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/dashboard')} className="text-gray-600 hover:text-gray-800">←</button>
          <h1 className="text-xl font-semibold text-gray-800">Manage Inventory</h1>
        </div>
        <button onClick={() => navigate('/admin/add-product')} className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm">Add Product</button>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">Total Products</p><p className="text-2xl font-semibold">45</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-semibold text-green-600">32</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">Low Stock</p><p className="text-2xl font-semibold text-yellow-600">8</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">Out of Stock</p><p className="text-2xl font-semibold text-red-600">5</p></div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
            <div className="flex gap-2">
              <button onClick={() => setFilterStatus('all')} className={`px-3 py-1 rounded text-sm ${filterStatus === 'all' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>All</button>
              <button onClick={() => setFilterStatus('active')} className={`px-3 py-1 rounded text-sm ${filterStatus === 'active' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Active</button>
              <button onClick={() => setFilterStatus('lowstock')} className={`px-3 py-1 rounded text-sm ${filterStatus === 'lowstock' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Low Stock</button>
              <button onClick={() => setFilterStatus('outofstock')} className={`px-3 py-1 rounded text-sm ${filterStatus === 'outofstock' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Out of Stock</button>
            </div>
            <div className="relative"><input type="text" placeholder="Search by name or SKU" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm" /><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span></div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr><th className="px-4 py-3 text-left">Product</th><th className="px-4 py-3 text-left">SKU</th><th className="px-4 py-3 text-left">Category</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3 text-right">Stock</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Actions</th></tr>
              </thead>
              <tbody className="divide-y">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xl">{product.image}</div><span className="font-medium">{product.name}</span></div></td>
                    <td className="px-4 py-3 text-gray-500">{product.sku}</td>
                    <td className="px-4 py-3 text-gray-500">{product.category}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{product.price}</td>
                    <td className={`px-4 py-3 text-right ${product.stock < 10 ? 'text-red-500 font-medium' : ''}`}>{product.stock}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(product.status)}</td>
                    <td className="px-4 py-3 text-center"><div className="flex justify-center gap-2"><button className="text-blue-500 hover:text-blue-700">✏️</button><button className="text-red-500 hover:text-red-700">🗑️</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminInventory;
