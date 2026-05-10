import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorAddProduct() {
  const [formData, setFormData] = useState({
    name: '',
    category: 'skincare',
    price: '',
    originalPrice: '',
    stock: '',
    description: '',
    emoji: '🛍️',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Mock API call
    setTimeout(() => {
      alert('Product added successfully!');
      navigate('/vendor/products');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">
      <VendorHeader />
      <VendorSidebar activeTab="add-product" />

      <main className="ml-64 pt-16 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-pink-100">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Add New Product</h1>
              <p className="text-gray-500 mt-1">List your product on MyPinkShop</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-medium">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500"
                  >
                    <option value="skincare">Skincare</option>
                    <option value="makeup">Makeup</option>
                    <option value="drip">The Drip</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-medium">Product Emoji</label>
                  <input
                    type="text"
                    name="emoji"
                    value={formData.emoji}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500"
                    placeholder="💧"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-medium">Selling Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-medium">Original Price</label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-medium">Stock Quantity *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                {loading ? 'Adding Product...' : 'Add Product →'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorAddProduct;
