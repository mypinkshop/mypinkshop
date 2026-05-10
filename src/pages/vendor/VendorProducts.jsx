import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('vendorToken');

  useEffect(() => {
    if (!token) {
      navigate('/vendor/login');
      return;
    }

    // Mock products data
    setProducts([
      { id: 1, name: 'Glass Skin Serum', price: 1299, stock: 45, status: 'active', image: '💧', sales: 234 },
      { id: 2, name: 'Rice Water Toner', price: 899, stock: 12, status: 'lowstock', image: '🌸', sales: 189 },
      { id: 3, name: 'Cherry Lip Tint', price: 599, stock: 0, status: 'outofstock', image: '🍒', sales: 567 },
      { id: 4, name: 'Satin Slip Dress', price: 2499, stock: 25, status: 'active', image: '👗', sales: 89 },
    ]);
    setLoading(false);
  }, [token, navigate]);

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      lowstock: 'bg-amber-100 text-amber-700',
      outofstock: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status) => {
    const texts = {
      active: 'Active',
      lowstock: 'Low Stock',
      outofstock: 'Out of Stock',
    };
    return texts[status] || status;
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
                        <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-xl">{product.image}</div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">₹{product.price}</td>
                    <td className="px-6 py-3">{product.stock}</td>
                    <td className="px-6 py-3">{product.sales}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(product.status)}`}>
                        {getStatusText(product.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button className="p-1 text-blue-500 hover:bg-blue-50 rounded">✏️</button>
                        <button className="p-1 text-red-500 hover:bg-red-50 rounded">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorProducts;
