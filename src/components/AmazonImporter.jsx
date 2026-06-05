import { useState } from 'react';

function AmazonImporter({ onProductImported }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchedProduct, setFetchedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Skincare');
  const [step, setStep] = useState(1);

  const API_URL = 'https://api.mypinkshop.com';
  const token = localStorage.getItem('adminToken');

  const categories = ['Skincare', 'Makeup', 'Hair', 'Clothing', 'Accessories'];

  const fetchProduct = async () => {
    if (!url.trim()) {
      alert('Please enter Amazon product URL');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/import/amazon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url, category: selectedCategory })
      });

      const data = await response.json();

      if (data.success) {
        setFetchedProduct(data);
        setStep(2);
      } else {
        alert(data.error || 'Failed to fetch product');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import product. Please check the URL.');
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/import/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...fetchedProduct.productData,
          mainCategory: selectedCategory,
          category: selectedCategory
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Product imported successfully!');
        onProductImported?.();
        setStep(1);
        setUrl('');
        setFetchedProduct(null);
      } else {
        alert(data.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">📦 Import from Amazon</h2>
      
      {step === 1 && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Paste Amazon product URL to automatically fetch product details
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="https://www.amazon.in/dp/XXXXXXXXXX"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-pink-500"
            />
            <button
              onClick={fetchProduct}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Fetching...' : '🔍 Fetch Product'}
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600">
              💡 Tip: Paste Amazon.in product URL. Product name, price, images, and description will be auto-filled.
            </p>
          </div>
        </>
      )}

      {step === 2 && fetchedProduct && (
        <>
          <div className="border rounded-lg p-4 mb-4">
            <div className="flex gap-4">
              {fetchedProduct.scraped.images?.[0] && (
                <img 
                  src={fetchedProduct.scraped.images[0]} 
                  alt={fetchedProduct.scraped.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{fetchedProduct.scraped.name}</h3>
                <p className="text-sm text-gray-500">Brand: {fetchedProduct.scraped.brand || 'N/A'}</p>
                <p className="text-lg font-bold text-pink-600 mt-1">₹{fetchedProduct.scraped.price}</p>
                <p className="text-xs text-gray-400">⭐ {fetchedProduct.scraped.rating} ({fetchedProduct.scraped.reviewCount} reviews)</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={saveProduct}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Importing...' : '✅ Import Product'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AmazonImporter;
