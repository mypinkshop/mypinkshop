import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendor');
    
    if (!token || !vendorData) {
      navigate('/vendor/login');
      return;
    }

    const vendor = JSON.parse(vendorData);
    const vendorName = vendor.brandName || vendor.name;
    
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const myProducts = allProducts.filter(p => p.vendor === vendorName);
    
    setProducts(myProducts);
    setLoading(false);
  }, [navigate]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'lowstock': return 'bg-amber-100 text-amber-700';
      case 'outofstock': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'active': return 'Active';
      case 'lowstock': return 'Low Stock';
      case 'outofstock': return 'Out of Stock';
      default: return status;
    }
  };

  const deleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
      const updatedProducts = allProducts.filter(p => p.id !== productId);
      localStorage.setItem('adminProductsList', JSON.stringify(updatedProducts));
      setProducts(products.filter(p => p.id !== productId));
      alert('Product deleted successfully!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">
      <VendorHeader />
      <VendorSidebar activeTab="products" />

      <main className="ml-64 pt-16 p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Products</h1>
              <p className="text-gray-500 mt-1">Manage your product catalog</p>
            </div>
            <Link to="/vendor/add-product" className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition flex items-center gap-2">
              <span>➕</span> Add New Product
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-pink-100">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No products yet</h3>
              <p className="text-gray-500 mb-4">Start adding your first product to sell on MyPinkShop</p>
              <Link to="/vendor/add-product" className="bg-pink-500 text-white px-6 py-2 rounded-lg inline-block">Add Product</Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-pink-100">
              <table className="w-full text-sm">
                <thead className="bg-pink-50">
                  <tr className="border-b border-pink-100">
                    <th className="px-6 py-3 text-left text-gray-600">Product</th>
                    <th className="px-6 py-3 text-left text-gray-600">Price</th>
                    <th className="px-6 py-3 text-left text-gray-600">Stock</th>
                    <th className="px-6 py-3 text-left text-gray-600">Sales</th>
                    <th className="px-6 py-3 text-left text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-pink-50/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-xl">{product.image || '📦'}</div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">₹{product.price}</td>
                      <td className="px-6 py-3">{product.stock}</td>
                      <td className="px-6 py-3">{product.sales || 0}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(product.status)}`}>
                          {getStatusText(product.status)}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <Link to={`/vendor/edit-product/${product.id}`} className="p-1 text-blue-500 hover:bg-blue-50 rounded">✏️</Link>
                          <button onClick={() => deleteProduct(product.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default VendorProducts;
