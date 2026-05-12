import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    vendorId: '',
    category: 'skincare',
    price: '',
    originalPrice: '',
    stock: '',
    emoji: '🛍️',
    description: '',
  });
  const navigate = useNavigate();

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }

    // Mock products data
    setProducts([
      { id: 1, name: 'Glass Skin Serum', vendorName: 'Nykaa Beauty', category: 'skincare', price: 1299, stock: 45, status: 'active', emoji: '💧' },
      { id: 2, name: 'Rice Water Toner', vendorName: 'Nykaa Beauty', category: 'skincare', price: 899, stock: 60, status: 'active', emoji: '🌸' },
      { id: 3, name: 'Cherry Lip Tint', vendorName: 'Nykaa Beauty', category: 'makeup', price: 599, stock: 100, status: 'active', emoji: '🍒' },
    ]);

    // Mock vendors list
    setVendors([
      { id: 1, brandName: 'Nykaa Beauty' },
      { id: 2, brandName: 'Mamaearth' },
      { id: 3, brandName: 'Sugar Cosmetics' },
    ]);
    setLoading(false);
  }, [token, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedVendor = vendors.find(v => v.id == formData.vendorId);
    const newProduct = {
      id: Date.now(),
      ...formData,
      vendorName: selectedVendor?.brandName || 'Unknown',
      status: 'active',
    };
    setProducts([newProduct, ...products]);
    setShowModal(false);
    setFormData({ name: '', vendorId: '', category: 'skincare', price: '', originalPrice: '', stock: '', emoji: '🛍️', description: '' });
    alert('✅ Product added successfully!');
  };

  const deleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== productId));
      alert('🗑️ Product deleted!');
    }
  };

  const toggleProductStatus = (productId) => {
    setProducts(products.map(p => 
      p.id === productId ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p
    ));
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
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-pink-500">MyPinkShop Admin</h1>
          <button onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin/login'); }} className="text-red-500 text-sm">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
            <p className="text-gray-500 text-sm">Add, edit, or remove products from any vendor</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-pink-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-pink-600 transition flex items-center gap-2"
          >
            <span>➕</span> Add New Product
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b">
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-left">Vendor</th>
                <th className="px-5 py-3 text-left">Category</th>
                <th className="px-5 py-3 text-left">Price</th>
                <th className="px-5 py-3 text-left">Stock</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{product.emoji}</span>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">{product.vendorName}</td>
                  <td className="px-5 py-3 capitalize">{product.category}</td>
                  <td className="px-5 py-3">₹{product.price}</td>
                  <td className="px-5 py-3">{product.stock}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleProductStatus(product.id)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                    >
                      {product.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button className="text-blue-500 hover:bg-blue-50 p-1 rounded">✏️</button>
                      <button onClick={() => deleteProduct(product.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Add New Product</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Vendor *</label>
                <select name="vendorId" value={formData.vendorId} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select Vendor</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.brandName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg">
                  <option value="skincare">Skincare</option>
                  <option value="makeup">Makeup</option>
                  <option value="drip">The Drip</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Price</label>
                  <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                  <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                  <input type="text" name="emoji" value={formData.emoji} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg"></textarea>
              </div>
              <button type="submit" className="w-full bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition">
                Add Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
