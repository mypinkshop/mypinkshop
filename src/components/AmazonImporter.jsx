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

  // Garbage words to filter out
  const garbageWords = [
    'See more product details', 'Report an issue', 'Product Description',
    'To see our price', 'See more', 'Product details', 'Would you like to',
    'Tell us about', 'Brief content visible', 'double tap to read full content',
    'full content visible', 'double tap to read', 'Read more', 'Read less',
    'Loading...', 'Sorry, we couldn\'t load the review', 'Customer Reviews',
    'Top reviews', 'There was a problem', 'Filtered by', 'Sort by'
  ];

  // Helper function to clean text
  const cleanText = (text) => {
    if (!text) return '';
    return text
      .replace(/【.*?】/g, '')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .trim();
  };

  // Helper function to check if text is garbage
  const isGarbage = (text) => {
    if (!text || text.length < 15) return true;
    for (const word of garbageWords) {
      if (text.includes(word)) return true;
    }
    return false;
  };

  // Helper function to generate SEO fields
  const generateSeoFields = (productName, brand, keyFeatures = []) => {
    const slug = productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let metaTitle = `${productName}`;
    if (brand) metaTitle = `${productName} - ${brand}`;
    metaTitle = `${metaTitle} | MyPinkShop`;
    if (metaTitle.length > 60) {
      metaTitle = metaTitle.substring(0, 57) + '...';
    }
    
    let metaDescription = `Buy ${productName}`;
    if (brand) metaDescription += ` by ${brand}`;
    metaDescription += ` online at best price. Shop now at MyPinkShop with free shipping and easy returns.`;
    if (metaDescription.length > 160) {
      metaDescription = metaDescription.substring(0, 157) + '...';
    }
    
    const keywords = [brand, selectedCategory, ...(keyFeatures || [])].filter(Boolean);
    const metaKeywords = keywords.join(', ');
    
    return { slug, metaTitle, metaDescription, metaKeywords };
  };

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

  // Clean description array
  const cleanDescriptionArray = (description) => {
    let items = [];
    
    if (Array.isArray(description)) {
      items = [...description];
    } else if (typeof description === 'string') {
      // Split by common delimiters
      items = description.split(/\n|•|\*|\d+\.|●|○|▪|►|➤/);
    }
    
    const cleaned = items
      .map(item => cleanText(item))
      .filter(item => !isGarbage(item))
      .filter(item => item.length > 15 && item.length < 300);
    
    // Remove duplicates
    return [...new Set(cleaned)];
  };

  // Clean key features array
  const cleanFeaturesArray = (features) => {
    let items = [];
    
    if (Array.isArray(features)) {
      items = [...features];
    } else if (typeof features === 'string') {
      items = features.split(/\n|•|\*|●|○/);
    }
    
    const cleaned = items
      .map(item => cleanText(item))
      .filter(item => !isGarbage(item))
      .filter(item => item.length > 5 && item.length < 150);
    
    return [...new Set(cleaned)];
  };

  // ✅ Import to form with SEO fields and garbage filtering
  const importToForm = () => {
    if (!fetchedProduct?.scraped) return;

    const scraped = fetchedProduct.scraped;
    
    // 🔥 Clean description - remove garbage like "See more product details"
    let descriptionArray = cleanDescriptionArray(scraped.description);
    
    // 🔥 Clean key features
    let keyFeaturesArray = cleanFeaturesArray(scraped.keyFeatures);
    
    // 🔥 If description is still empty, try to extract from product details
    if (descriptionArray.length === 0 && scraped.description) {
      let text = typeof scraped.description === 'string' ? scraped.description : JSON.stringify(scraped.description);
      let sentences = text.split(/\.\s+|\n/);
      descriptionArray = sentences
        .map(s => cleanText(s))
        .filter(s => s.length > 20 && s.length < 200 && !isGarbage(s))
        .slice(0, 8);
    }
    
    // 🔥 Fallback: if still empty, add a default
    if (descriptionArray.length === 0) {
      descriptionArray = [`Premium ${scraped.name} - High quality product from ${scraped.brand || 'renowned brand'}`];
    }
    
    // 🔥 Limit to max 8 bullet points
    descriptionArray = descriptionArray.slice(0, 8);
    keyFeaturesArray = keyFeaturesArray.slice(0, 10);
    
    // Generate SEO fields
    const seoFields = generateSeoFields(scraped.name, scraped.brand, keyFeaturesArray);

    // Set form data with SEO fields
    setFormData(prev => ({
      ...prev,
      productName: scraped.name || '',
      brand: scraped.brand || '',
      mainCategory: selectedCategory,
      category: selectedCategory,
      sellingPrice: scraped.price || 0,
      mrp: scraped.originalPrice || scraped.price * 1.2 || 0,
      fullDescription: descriptionArray,
      keyFeatures: keyFeaturesArray,
      aboutThisItem: descriptionArray,
      productHighlights: keyFeaturesArray,
      images: scraped.images || [],
      metaTitle: seoFields.metaTitle,
      metaDescription: seoFields.metaDescription,
      metaKeywords: seoFields.metaKeywords,
      slug: seoFields.slug
    }));

    // Set images
    if (scraped.images && scraped.images.length > 0) {
      setImages(scraped.images);
    }

    // Set variations if any
    if (scraped.variations && scraped.variations.length > 0) {
      setVariations(scraped.variations);
    }

    alert(`✅ Imported ${descriptionArray.length} bullet points and ${keyFeaturesArray.length} features!`);
    
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
      const scraped = fetchedProduct.scraped;
      const keyFeaturesArray = cleanFeaturesArray(scraped.keyFeatures);
      const seoFields = generateSeoFields(scraped.name, scraped.brand, keyFeaturesArray);
      
      const productData = {
        name: scraped.name,
        brand: scraped.brand || '',
        mainCategory: selectedCategory,
        category: selectedCategory,
        price: scraped.price,
        originalPrice: scraped.originalPrice || scraped.price * 1.2,
        stock: 10,
        images: scraped.images || [],
        description: cleanDescriptionArray(scraped.description),
        keyFeatures: keyFeaturesArray,
        metaTitle: seoFields.metaTitle,
        metaDescription: seoFields.metaDescription,
        metaKeywords: seoFields.metaKeywords,
        slug: seoFields.slug,
        status: 'active',
        adminApproved: true
      };

      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Product imported successfully with SEO!');
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
          <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full">SEO Auto-Generated</span>
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
            Paste Amazon product URL to automatically fetch product details and SEO fields
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
              💡 Tip: Paste Amazon.in product URL. Product name, price, images, description, and <strong className="font-bold">SEO fields (meta title, description, keywords, slug)</strong> will be auto-generated!
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

          {/* 🔥 SEO Preview Section */}
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span>🔍</span> SEO Preview (Auto-generated)
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Slug:</span>
                <code className="ml-2 text-blue-600 text-xs">
                  {generateSeoFields(fetchedProduct.scraped.name, fetchedProduct.scraped.brand, fetchedProduct.scraped.keyFeatures).slug}
                </code>
              </div>
              <div>
                <span className="text-gray-500">Meta Title:</span>
                <p className="text-blue-600 text-xs mt-0.5 break-words">
                  {generateSeoFields(fetchedProduct.scraped.name, fetchedProduct.scraped.brand, fetchedProduct.scraped.keyFeatures).metaTitle}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Meta Description:</span>
                <p className="text-gray-600 text-xs mt-0.5 break-words">
                  {generateSeoFields(fetchedProduct.scraped.name, fetchedProduct.scraped.brand, fetchedProduct.scraped.keyFeatures).metaDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Preview fetched data */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium text-gray-700 mb-2">📋 Fetched Data:</p>
            <ul className="space-y-1 text-gray-600">
              <li>✅ Product Name: {fetchedProduct.scraped.name?.substring(0, 50)}...</li>
              <li>✅ Price: ₹{fetchedProduct.scraped.price}</li>
              <li>✅ Images: {fetchedProduct.scraped.images?.length || 0} images</li>
              <li>✅ SEO Fields: Auto-generated ✨</li>
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
              📥 Import to Form (with SEO)
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
