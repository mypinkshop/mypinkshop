import { useState } from 'react';

function AmazonImporter({ onProductImported, setFormData, setVariations, setImages }) {
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

  // ✅ Import to form (for AdminAddProduct)
  const importToForm = () => {
    if (!fetchedProduct?.scraped) return;

    const scraped = fetchedProduct.scraped;
    
    // Convert description to array of bullet points
    let descriptionArray = [];
    if (typeof scraped.description === 'string') {
      if (scraped.description.includes('\n')) {
        descriptionArray = scraped.description.split('\n').filter(b => b.trim());
      } else if (scraped.description.includes('|')) {
        descriptionArray = scraped.description.split('|').filter(b => b.trim());
      } else {
        descriptionArray = [scraped.description];
      }
    } else if (Array.isArray(scraped.description)) {
      descriptionArray = scraped.description;
    }

    // Set form data
    setFormData(prev => ({
      ...prev,
      productName: scraped.name || '',
      brand: scraped.brand || '',
      mainCategory: selectedCategory,
      category: selectedCategory,
      sellingPrice: scraped.price || 0,
      mrp: scraped.originalPrice || scraped.price * 1.2 || 0,
      fullDescription: descriptionArray,
      keyFeatures: scraped.keyFeatures || [],
      aboutThisItem: descriptionArray,
      productHighlights: scraped.keyFeatures || [],
      images: scraped.images || [],
    }));

    // Set images
    if (scraped.images && scraped.images.length > 0) {
      setImages(scraped.images);
    }

    // Set variations if any
    if (scraped.variations && scraped.variations.length > 0) {
      setVariations(scraped.variations);
    }

    alert(`✅ "${scraped.name.substring(0, 50)}..." imported to form!`);
    
    // Close importer and go to manual form
    if (onProductImported) {
      onProductImported();
    }
    
    // Reset state
    setStep(1);
    setUrl('');
    setFetchedProduct(null);
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
        if (onProductImported) onProductImported();
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

  // Reset importer
  const resetImporter = () => {
    setStep(1);
    setUrl('');
    setFetchedProduct(null);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-6 mb-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">📦</span> Import from Amazon
          <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full">Multi-URL Support Coming Soon</span>
        </h2>
        {step === 2 && (
          <button onClick={resetImporter} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        )}
      </div>
      
      {step === 1 && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Paste Amazon product URL to automatically fetch product details
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 bg-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="https://www.amazon.in/dp/XXXXXXXXXX"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 bg-white"
              onKeyPress={(e) => e.key === 'Enter' && fetchProduct()}
            />
            <button
              onClick={fetchProduct}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? '⏳ Fetching...' : '🔍 Fetch Product'}
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
          <div className="border rounded-lg p-4 mb-4 bg-white">
            <div className="flex flex-col sm:flex-row gap-4">
              {fetchedProduct.scraped.images?.[0] && (
                <img 
                  src={fetchedProduct.scraped.images[0]} 
                  alt={fetchedProduct.scraped.name}
                  className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 line-clamp-2">{fetchedProduct.scraped.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Brand: {fetchedProduct.scraped.brand || 'N/A'}</p>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-xl font-bold text-pink-600">₹{fetchedProduct.scraped.price}</p>
                  {fetchedProduct.scraped.originalPrice && fetchedProduct.scraped.originalPrice > fetchedProduct.scraped.price && (
                    <p className="text-sm text-gray-400 line-through">₹{fetchedProduct.scraped.originalPrice}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400">⭐ {fetchedProduct.scraped.rating || 'N/A'} ({fetchedProduct.scraped.reviewCount || 0} reviews)</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 bg-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Preview fetched data */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium text-gray-700 mb-2">📋 Fetched Data:</p>
            <ul className="space-y-1 text-gray-600">
              <li>✅ Product Name: {fetchedProduct.scraped.name?.substring(0, 50)}...</li>
              <li>✅ Price: ₹{fetchedProduct.scraped.price}</li>
              <li>✅ Images: {fetchedProduct.scraped.images?.length || 0} images</li>
              <li>✅ Description: {fetchedProduct.scraped.description?.length || 0} characters</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={resetImporter}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={importToForm}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition"
            >
              📥 Import to Form
            </button>
            <button
              onClick={saveProduct}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Importing...' : '✅ Save Directly'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AmazonImporter;
