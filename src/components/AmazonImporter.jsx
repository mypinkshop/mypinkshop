// ============================================
// AMAZON IMPORTER COMPONENT (FIXED)
// ============================================
const AmazonImporter = ({ onProductImported, setFormData, setVariations, setImages }) => {
  const [urls, setUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [importedProducts, setImportedProducts] = useState([]);

  const API_URL = 'https://api.mypinkshop.com';
  const token = localStorage.getItem('adminToken');

  const garbageWords = [
    'See more product details', 'Report an issue', 'Product Description',
    'To see our price', 'See more', 'Product details', 'Would you like to',
    'Tell us about', 'Brief content visible', 'double tap to read full content',
    'full content visible', 'double tap to read', 'Read more', 'Read less'
  ];

  const cleanText = (text) => {
    if (!text) return '';
    return text.replace(/【.*?】/g, '').replace(/\s+/g, ' ').trim();
  };

  const isGarbage = (text) => {
    if (!text || text.length < 15) return true;
    for (const word of garbageWords) {
      if (text.toLowerCase().includes(word.toLowerCase())) return true;
    }
    return false;
  };

  const addUrlField = () => {
    if (urls.length < 20) setUrls([...urls, '']);
    else alert('Maximum 20 URLs allowed');
  };

  const removeUrlField = (index) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const updateUrl = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const fetchAllProducts = async () => {
    const validUrls = urls.filter(url => url.trim());
    if (validUrls.length === 0) {
      alert('Please enter at least one Amazon URL');
      return;
    }

    setLoading(true);
    const results = [];

    for (let i = 0; i < validUrls.length; i++) {
      const url = validUrls[i];
      try {
        const response = await fetch(`${API_URL}/api/import/amazon`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ url })
        });

        const data = await response.json();
        if (data.success) {
          results.push({ ...data.scraped, originalUrl: url });
        } else {
          results.push({ error: data.error, originalUrl: url });
        }
      } catch (error) {
        results.push({ error: error.message, originalUrl: url });
      }
    }

    setImportedProducts(results);
    setLoading(false);
  };

  // 🔥 Detect category from product name
  const detectCategoryFromName = (productName) => {
    const name = productName.toLowerCase();
    const categoryKeywords = {
      'Skincare': ['face wash', 'cleanser', 'serum', 'moisturizer', 'sunscreen', 'cream', 'lotion', 'toner', 'mask', 'eye cream', 'scrub'],
      'Makeup': ['lipstick', 'foundation', 'kajal', 'eyeshadow', 'blush', 'mascara', 'highlighter', 'concealer', 'primer', 'compact', 'lip gloss'],
      'Hair': ['shampoo', 'conditioner', 'hair oil', 'hair serum', 'hair mask', 'hair color', 'hair spray', 'dandruff', 'hair fall'],
      'Clothing': ['dress', 'top', 'kurti', 'saree', 'jeans', 't-shirt', 'shirt', 'jacket', 'lehenga'],
      'Accessories': ['bag', 'jewelry', 'watch', 'sunglasses', 'belt', 'scarf', 'wallet', 'earrings']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (name.includes(keyword)) return category;
      }
    }
    return 'Skincare';
  };

  const importToForm = (product) => {
    let descriptionArray = [];
    
    if (Array.isArray(product.description)) {
      descriptionArray = product.description.filter(item => !isGarbage(item));
    } else if (typeof product.description === 'string') {
      descriptionArray = product.description
        .split(/\n|•|\*|\d+\./)
        .map(item => cleanText(item))
        .filter(item => !isGarbage(item));
    }
    
    descriptionArray = [...new Set(descriptionArray)].slice(0, 15);
    
    const keyFeaturesArray = (Array.isArray(product.keyFeatures) ? product.keyFeatures : [])
      .filter(item => !isGarbage(item))
      .slice(0, 10);
    
    const slug = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let metaTitle = `${product.name}`;
    if (product.brand) metaTitle = `${product.name} - ${product.brand}`;
    metaTitle = `${metaTitle} | MyPinkShop`;
    if (metaTitle.length > 60) metaTitle = metaTitle.substring(0, 57) + '...';
    
    let metaDescription = `Buy ${product.name}`;
    if (product.brand) metaDescription += ` by ${product.brand}`;
    metaDescription += ` online at best price. Shop now at MyPinkShop.`;
    if (metaDescription.length > 160) metaDescription = metaDescription.substring(0, 157) + '...';
    
    const keywords = [product.brand, ...keyFeaturesArray].filter(Boolean);
    const metaKeywords = keywords.join(', ');
    
    // 🔥 Detect category if not provided
    const detectedCategory = product.detectedCategory || detectCategoryFromName(product.name);
    
    setFormData(prev => ({
      ...prev,
      productName: product.name,
      brand: product.brand || prev.brand,
      sellingPrice: product.price,
      mrp: product.originalPrice || product.price * 1.2,
      fullDescription: descriptionArray,
      keyFeatures: keyFeaturesArray,
      aboutThisItem: descriptionArray,
      productHighlights: keyFeaturesArray,
      images: product.images || [],
      metaTitle: metaTitle,
      metaDescription: metaDescription,
      metaKeywords: metaKeywords,
      slug: slug,
      category: detectedCategory,
      skinType: product.skinType || 'all',
      concerns: product.concerns || [],
      ingredients: product.ingredients || '',
      finish: product.finish || '',
      coverage: product.coverage || '',
      shade: product.shade || '',
      hairType: product.hairType || 'all',
      hairConcerns: product.hairConcerns || [],
      fabric: product.fabric || '',
      material: product.material || '',
      weight: product.weight || ''
    }));
    
    if (product.images && product.images.length > 0) setImages(product.images);
    
    if (product.variations && product.variations.length > 0) {
      const formattedVariations = product.variations.map((v, idx) => ({
        id: Date.now() + idx,
        name: v.name,
        price: v.price || product.price,
        mrp: v.mrp || product.originalPrice || product.price * 1.2,
        stock: v.stock || 10,
        sku: v.sku || `VAR-${Date.now()}-${idx}`
      }));
      setVariations(formattedVariations);
    }
    
    alert(`✅ Imported ${descriptionArray.length} bullet points | Category: ${detectedCategory}`);
    if (onProductImported) onProductImported();
  };

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border-2 border-pink-200 p-4 sm:p-5 mb-6 shadow-sm">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 flex flex-wrap items-center gap-2">
        <span className="text-2xl">📦</span> Import from Amazon
        <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full">Multi-URL Support</span>
      </h3>
      <p className="text-xs sm:text-sm text-gray-500 mb-4">Paste Amazon product URLs (Up to 20 URLs)</p>
      
      <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
        {urls.map((url, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              placeholder="https://www.amazon.in/dp/XXXXXXXXXX"
              value={url}
              onChange={(e) => updateUrl(idx, e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 bg-white text-sm"
            />
            {urls.length > 1 && (
              <button onClick={() => removeUrlField(idx)} className="px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition text-sm">
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-3 mb-4">
        <button onClick={addUrlField} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium text-xs sm:text-sm">
          ➕ Add Another ({urls.length}/20)
        </button>
        <button onClick={fetchAllProducts} disabled={loading} className="px-4 sm:px-5 py-1.5 sm:py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition disabled:opacity-50 text-xs sm:text-sm">
          {loading ? '⏳ Fetching...' : '🔍 Fetch All'}
        </button>
      </div>
      
      {importedProducts.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <h4 className="font-medium text-gray-700 mb-3 text-xs sm:text-sm">📋 Fetched Products ({importedProducts.length})</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {importedProducts.map((product, idx) => (
              <div key={idx} className={`p-2 sm:p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${product.error ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-200 hover:shadow-sm'}`}>
                <div className="flex-1 min-w-0">
                  {product.error ? (
                    <>
                      <p className="text-xs sm:text-sm text-red-600 font-medium truncate">❌ Failed: {product.originalUrl}</p>
                      <p className="text-xs text-red-400">{product.error}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-gray-800 text-xs sm:text-sm truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">₹{product.price} | {product.brand || 'No brand'}</p>
                    </>
                  )}
                </div>
                {!product.error && (
                  <button onClick={() => importToForm(product)} className="px-3 sm:px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition whitespace-nowrap">
                    📥 Import
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-600">💡 Tip: Category will be auto-detected! Custom variations will show properly.</p>
      </div>
    </div>
  );
};
