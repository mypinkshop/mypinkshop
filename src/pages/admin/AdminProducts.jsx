import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', vendorId: '', category: 'skincare', price: '', originalPrice: '', stock: '', emoji: '🛍️', description: '' });
  const [vendors, setVendors] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return; }
    setProducts([
      { id: 1, name: 'Glass Skin Serum', vendorName: 'Nykaa Beauty', category: 'skincare', price: 1299, originalPrice: 1999, stock: 45, status: 'active', emoji: '💧', totalSales: 234, rating: 4.8 },
      { id: 2, name: 'Rice Water Toner', vendorName: 'Nykaa Beauty', category: 'skincare', price: 899, originalPrice: 1299, stock: 60, status: 'active', emoji: '🌸', totalSales: 189, rating: 4.6 },
    ]);
    setVendors([{ id: 1, brandName: 'Nykaa Beauty' }, { id: 2, brandName: 'Mamaearth' }, { id: 3, brandName: 'Sugar Cosmetics' }]);
    setLoading(false);
  }, [token, navigate]);

  const deleteProduct = (productId) => { if (confirm('Delete this product?')) { setProducts(products.filter(p => p.id !== productId)); alert('Product deleted!'); } };
  const toggleStatus = (productId) => { setProducts(products.map(p => p.id === productId ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p)); };
  const handleSubmit = (e) => { e.preventDefault(); const vendor = vendors.find(v => v.id == formData.vendorId); const newProduct = { id: Date.now(), ...formData, vendorName: vendor?.brandName, status: 'active', totalSales: 0, rating: 0 }; setProducts([newProduct, ...products]); setShowModal(false); setFormData({ name: '', vendorId: '', category: 'skincare', price: '', originalPrice: '', stock: '', emoji: '🛍️', description: '' }); alert('Product added!'); };
  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const filtered = products.filter(p => activeTab === 'all' ? true : activeTab === 'active' ? p.status === 'active' : p.status === 'inactive');
  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-pink-500"><span className="text-xl">←</span><span className="text-sm">Back</span></button>
            <Link to="/admin/dashboard" className="flex items-center gap-2 hover:opacity-80"><div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">M</div><h1 className="text-xl font-bold text-pink-500">MyPinkShop Admin</h1></Link>
          </div>
          <button onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin/login'); }} className="text-red-500">Logout</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6"><div><h1 className="text-2xl font-bold">Product Management</h1><p className="text-gray-500">Add, edit, or remove products</p></div><button onClick={() => setShowModal(true)} className="bg-pink-500 text-white px-5 py-2 rounded-lg hover:bg-pink-600">➕ Add Product</button></div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'all' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600'}`}>All ({products.length})</button>
          <button onClick={() => setActiveTab('active')} className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'active' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600'}`}>Active</button>
          <button onClick={() => setActiveTab('inactive')} className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'inactive' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600'}`}>Inactive</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="px-5 py-3">Product</th><th>Vendor</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody className="divide-y">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3"><div className="flex items-center gap-2"><span className="text-2xl">{p.emoji}</span><span className="font-medium">{p.name}</span></div></td>
                  <td>{p.vendorName}</td>
                  <td className="capitalize">{p.category}</td>
                  <td>₹{p.price}</td>
                  <td className={p.stock < 10 ? 'text-red-500' : ''}>{p.stock}</td>
                  <td><button onClick={() => toggleStatus(p.id)} className={`px-2 py-1 rounded-full text-xs ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{p.status}</button></td>
                  <td><button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between"><h3 className="text-xl font-bold">Add Product</h3><button onClick={() => setShowModal(false)} className="text-gray-400">✕</button></div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <input type="text" name="name" placeholder="Product Name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
              <select name="vendorId" value={formData.vendorId} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required><option value="">Select Vendor</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.brandName}</option>)}</select>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg"><option value="skincare">Skincare</option><option value="makeup">Makeup</option><option value="drip">Drip</option><option value="accessories">Accessories</option></select>
              <div className="flex gap-3"><input type="number" name="price" placeholder="Price" value={formData.price} onChange={handleChange} className="w-1/2 px-3 py-2 border rounded-lg" required /><input type="number" name="stock" placeholder="Stock" value={formData.stock} onChange={handleChange} className="w-1/2 px-3 py-2 border rounded-lg" required /></div>
              <input type="text" name="emoji" placeholder="Emoji" value={formData.emoji} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
              <textarea name="description" rows="3" placeholder="Description" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg"></textarea>
              <button type="submit" className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600">Add Product</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
