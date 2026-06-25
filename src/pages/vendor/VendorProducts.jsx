import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vendorInfo, setVendorInfo] = useState(null);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      navigate('/vendor/login');
      return;
    }
    fetchProducts(token);
    fetchVendorProfile(token);
  }, [navigate]);

  // ✅ Fetch vendor profile
  const fetchVendorProfile = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/vendor/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVendorInfo(data.vendor);
      }
    } catch (err) {
      console.error('Error fetching vendor:', err);
    }
  };

  // ✅ Fetch vendor products from backend
  const fetchProducts = async (token) => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`${API_URL}/api/vendor/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (data.success) {
        setProducts(data.products || []);
      } else {
        setError(data.message || 'Failed to load products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete product
  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    const token = localStorage.getItem('vendorToken');
    try {
      const res = await fetch(`${API_URL}/api/vendor/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (data.success) {
        setProducts(products.filter(p => p._id !== productId));
        alert('Product deleted successfully! ✅');
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Network error. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    if (!status || status === 'active') return 'bg-green-100 text-green-700';
    if (status === 'lowstock') return 'bg-amber-100 text-amber-700';
    if (status === 'outofstock') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status) => {
    if (!status || status === 'active') return 'Active';
    if (status === 'lowstock') return 'Low Stock';
    if (status === 'outofstock') return 'Out of Stock';
    return status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">
      <VendorHeader />
      <VendorSidebar activeTab="products" />

      <main className="ml-64 pt-16 p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">📦 My Products</h1>
              <p className="text-gray-500 mt-1">Manage your product catalog</p>
            </div>
            <Link 
              to="/vendor/products/add" 
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2.5 rounded-lg font-medium hover:shadow-lg transition flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <span>➕</span> Add New Product
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-pink-100">
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-gray-800">{products.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-pink-100">
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{products.filter(p => p.status === 'active').length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-pink-100">
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-amber-600">{products.filter(p => p.stock < 10 && p.stock > 0).length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-pink-100">
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{products.filter(p => p.stock === 0).length}</p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-pink-100">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No products yet</h3>
              <p className="text-gray-500 mb-4">Start adding your first product to sell on MyPinkShop</p>
              <Link to="/vendor/products/add" className="bg-pink-500 text-white px-6 py-2.5 rounded-lg inline-block hover:bg-pink-600 transition">
                Add Product
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-pink-100">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-pink-50">
                    <tr className="border-b border-pink-100">
                      <th className="px-6 py-3 text-left text-gray-600 font-semibold">Product</th>
                      <th className="px-6 py-3 text-left text-gray-600 font-semibold">Price</th>
                      <th className="px-6 py-3 text-left text-gray-600 font-semibold">Stock</th>
                      <th className="px-6 py-3 text-left text-gray-600 font-semibold">Status</th>
                      <th className="px-6 py-3 text-left text-gray-600 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-50">
                    {products.map(product => (
                      <tr key={product._id} className="hover:bg-pink-50/50 transition">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            {product.images && product.images.length > 0 ? (
                              <img 
                                src={product.images[0]} 
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover bg-pink-100"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-xl">📦</div>
                            )}
                            <span className="font-medium text-gray-800">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 font-semibold text-gray-800">₹{product.price}</td>
                        <td className="px-6 py-3">
                          <span className={product.stock < 10 ? 'text-red-500 font-semibold' : 'text-gray-600'}>
                            {product.stock || 0}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(product.status)}`}>
                            {getStatusText(product.status)}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex gap-2">
                            <Link 
                              to={`/vendor/products/edit/${product._id}`} 
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              ✏️
                            </Link>
                            <button 
                              onClick={() => deleteProduct(product._id)} 
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default VendorProducts;
