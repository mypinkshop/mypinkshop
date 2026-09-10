import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// ============================================
// AMAZON IMPORTER COMPONENT
// ============================================
const AmazonImporter = ({ onProductImported, setFormData, setVariations, setImages }) => {
  const [urls, setUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [importedProducts, setImportedProducts] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';
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

  const detectSubCategoryFromName = (productName, category) => {
    const name = productName.toLowerCase();
    const subCategoryMap = {
      'Skincare': ['Face Wash', 'Cleanser', 'Serum', 'Moisturizer', 'Sunscreen', 'Face Mask', 'Eye Cream', 'Toner', 'Face Scrub', 'Lip Balm'],
      'Makeup': ['Foundation', 'Lipstick', 'Kajal', 'Eyeshadow', 'Blush', 'Mascara', 'Highlighter', 'Concealer', 'Primer', 'Compact', 'Lip Gloss'],
      'Hair': ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Serum', 'Hair Mask', 'Hair Color'],
      'Clothing': ['Dress', 'Top', 'Kurti', 'Saree', 'Jeans', 'T-Shirt', 'Jacket', 'Lehenga'],
      'Accessories': ['Bag', 'Jewelry', 'Watch', 'Sunglasses', 'Belt', 'Scarf', 'Wallet']
    };
    const subCats = subCategoryMap[category] || [];
    for (const sub of subCats) {
      if (name.includes(sub.toLowerCase())) return sub;
    }
    return '';
  };

  const addUrlField = () => {
    if (urls.length < 20) {
      setUrls([...urls, '']);
    } else {
      toast.error('Maximum 20 URLs allowed');
    }
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
      toast.error('Please enter at least one Amazon URL');
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
          const detectedCat = detectCategoryFromName(data.scraped.name);
          const detectedSub = detectSubCategoryFromName(data.scraped.name, detectedCat);
          
          results.push({ 
            ...data.scraped, 
            originalUrl: url,
            detectedCategory: detectedCat,
            detectedSubCategory: detectedSub
          });
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
    
    const detectedCategory = product.detectedCategory || detectCategoryFromName(product.name);
    const detectedSubCategory = product.detectedSubCategory || detectSubCategoryFromName(product.name, detectedCategory);
    
    setFormData(prev => ({
      ...prev,
      productName: product.name,
      brand: product.brand || prev.brand,
      sellingPrice: product.price,
      mrp: product.originalPrice || product.price * 1.2,
      fullDescription: descriptionArray,
      keyFeatures: keyFeaturesArray,
      images: product.images || [],
      category: detectedCategory,
      subCategory: detectedSubCategory,
    }));
    
    if (product.images && product.images.length > 0) setImages(product.images);
    
    if (product.variations && product.variations.length > 0) {
      const formattedVariations = product.variations.map((v, idx) => ({
        id: Date.now() + idx,
        name: v.name,
        price: v.price || product.price,
        mrp: v.mrp || product.originalPrice || product.price * 1.2,
        stock: v.stock || 10,
        sku: v.sku || `VAR-${Date.now()}-${idx}`,
        image: v.image || '',
        attributes: v.attributes || {}
      }));
      setVariations(formattedVariations);
    }
    
    toast.success(`✅ Imported! Category: ${detectedCategory} ${detectedSubCategory ? '| Sub: ' + detectedSubCategory : ''}`);
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
                      <p className="text-xs text-gray-500">₹{product.price} | {product.brand || 'No brand'} | 🏷️ {product.detectedCategory}</p>
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
    </div>
  );
};

// ============================================
// FLIPKART IMPORTER COMPONENT
// ============================================
const FlipkartImporter = ({ onProductImported, setFormData, setVariations, setImages }) => {
  const [urls, setUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [importedProducts, setImportedProducts] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';
  const token = localStorage.getItem('adminToken');

  const garbageWords = [
    'See more product details', 'Report an issue', 'Product Description',
    'Flipkart', 'See more', 'Product details', 'Would you like to',
    'Buy now', 'Add to cart', 'Extra discount', 'Bank offer'
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

  const detectSubCategoryFromName = (productName, category) => {
    const name = productName.toLowerCase();
    const subCategoryMap = {
      'Skincare': ['Face Wash', 'Cleanser', 'Serum', 'Moisturizer', 'Sunscreen', 'Face Mask', 'Eye Cream', 'Toner', 'Face Scrub', 'Lip Balm'],
      'Makeup': ['Foundation', 'Lipstick', 'Kajal', 'Eyeshadow', 'Blush', 'Mascara', 'Highlighter', 'Concealer', 'Primer', 'Compact', 'Lip Gloss'],
      'Hair': ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Serum', 'Hair Mask', 'Hair Color'],
      'Clothing': ['Dress', 'Top', 'Kurti', 'Saree', 'Jeans', 'T-Shirt', 'Jacket', 'Lehenga'],
      'Accessories': ['Bag', 'Jewelry', 'Watch', 'Sunglasses', 'Belt', 'Scarf', 'Wallet']
    };
    const subCats = subCategoryMap[category] || [];
    for (const sub of subCats) {
      if (name.includes(sub.toLowerCase())) return sub;
    }
    return '';
  };

  const addUrlField = () => {
    if (urls.length < 20) {
      setUrls([...urls, '']);
    } else {
      toast.error('Maximum 20 URLs allowed');
    }
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
      toast.error('Please enter at least one Flipkart URL');
      return;
    }

    setLoading(true);
    const results = [];

    for (let i = 0; i < validUrls.length; i++) {
      const url = validUrls[i];
      try {
        const response = await fetch(`${API_URL}/api/import/flipkart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ url })
        });

        const data = await response.json();
        if (data.success) {
          const detectedCat = detectCategoryFromName(data.scraped.name);
          const detectedSub = detectSubCategoryFromName(data.scraped.name, detectedCat);
          
          results.push({ 
            ...data.scraped, 
            originalUrl: url,
            detectedCategory: detectedCat,
            detectedSubCategory: detectedSub
          });
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
    
    const detectedCategory = product.detectedCategory || detectCategoryFromName(product.name);
    const detectedSubCategory = product.detectedSubCategory || detectSubCategoryFromName(product.name, detectedCategory);
    
    setFormData(prev => ({
      ...prev,
      productName: product.name,
      brand: product.brand || prev.brand,
      sellingPrice: product.price,
      mrp: product.originalPrice || product.price * 1.2,
      fullDescription: descriptionArray,
      keyFeatures: keyFeaturesArray,
      images: product.images || [],
      category: detectedCategory,
      subCategory: detectedSubCategory,
    }));
    
    if (product.images && product.images.length > 0) setImages(product.images);
    
    if (product.variations && product.variations.length > 0) {
      const formattedVariations = product.variations.map((v, idx) => ({
        id: Date.now() + idx,
        name: v.name,
        price: v.price || product.price,
        mrp: v.mrp || product.originalPrice || product.price * 1.2,
        stock: v.stock || 10,
        sku: v.sku || `VAR-${Date.now()}-${idx}`,
        image: v.image || '',
        attributes: v.attributes || {}
      }));
      setVariations(formattedVariations);
    }
    
    toast.success(`✅ Imported! Category: ${detectedCategory} ${detectedSubCategory ? '| Sub: ' + detectedSubCategory : ''}`);
    if (onProductImported) onProductImported();
  };

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200 p-4 sm:p-5 mb-6 shadow-sm">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 flex flex-wrap items-center gap-2">
        <span className="text-2xl">🛒</span> Import from Flipkart
        <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">Multi-URL Support</span>
      </h3>
      <p className="text-xs sm:text-sm text-gray-500 mb-4">Paste Flipkart product URLs (Up to 20 URLs)</p>
      
      <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
        {urls.map((url, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              placeholder="https://www.flipkart.com/..."
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
        <button onClick={fetchAllProducts} disabled={loading} className="px-4 sm:px-5 py-1.5 sm:py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition disabled:opacity-50 text-xs sm:text-sm">
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
                      <p className="text-xs text-gray-500">₹{product.price} | {product.brand || 'No brand'} | 🏷️ {product.detectedCategory}</p>
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
    </div>
  );
};

// ============================================
// VARIATION SELECT WITH SEARCH AND CUSTOM INPUT
// ============================================
const VariationSelectWithSearch = ({ label, options, value, onChange, placeholder = "Select or type..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  
  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const handleSelect = (selectedValue) => {
    if (selectedValue === '__CUSTOM__') {
      setIsCustomMode(true);
      setCustomValue('');
    } else {
      onChange(selectedValue);
      setSearchTerm('');
      setIsCustomMode(false);
    }
  };
  
  const handleSaveCustom = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
      setIsCustomMode(false);
      setCustomValue('');
      setSearchTerm('');
    }
  };
  
  if (isCustomMode) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5">{label}</label>
        <div className="flex gap-2">
          <input type="text" value={customValue} onChange={(e) => setCustomValue(e.target.value)} placeholder="Enter custom value..." className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" autoFocus />
          <button onClick={handleSaveCustom} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Save</button>
          <button onClick={() => setIsCustomMode(false)} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">Cancel</button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <div className="relative">
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={placeholder} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
        {searchTerm && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg max-h-48 overflow-y-auto shadow-lg">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <button key={opt} type="button" onClick={() => handleSelect(opt)} className="w-full text-left px-3 py-2 hover:bg-pink-50 text-sm transition">
                  {opt} {value === opt && <span className="float-right text-green-500">✓</span>}
                </button>
              ))
            ) : (
              <button type="button" onClick={() => handleSelect('__CUSTOM__')} className="w-full text-left px-3 py-2 text-pink-600 hover:bg-pink-50 text-sm border-t">
                + Add custom "{searchTerm}"
              </button>
            )}
          </div>
        )}
        {value && !searchTerm && (
          <div className="mt-2 px-3 py-2 bg-pink-50 rounded-lg text-sm text-pink-600 border border-pink-200 flex justify-between items-center">
            <span>✓ Selected: {value}</span>
            <button onClick={() => setIsCustomMode(true)} className="text-xs text-blue-500 hover:text-blue-700">Change</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN ADMIN ADD PRODUCT COMPONENT
// ============================================
function AdminAddProduct() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [brandSearch, setBrandSearch] = useState('');
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [showAddSubCategory, setShowAddSubCategory] = useState(false);
  const [newSubCategory, setNewSubCategory] = useState('');
  
  // 🔥 Pre-generated permanent Product ID for exact Google SEO URL structure
  const [productId] = useState(() => `prod_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`);

  const [brands, setBrands] = useState([
    'Nykaa Beauty', 'Mamaearth', 'Sugar Cosmetics', 'The Face Shop', 
    'Lakmé', 'MyGlamm', 'Plum', 'Wow Skin Science', 'Biotique', 
    'Forest Essentials', 'Kama Ayurveda', 'Mcaffeine', 'St.Botanica',
    'Loreal Paris', 'Maybelline', 'Clinique', 'Estee Lauder', 'Huda Beauty', 'MAC', 'Richfem'
  ]);
  
  const [customSubCategories, setCustomSubCategories] = useState({
    Skincare: [], Makeup: [], Hair: [], Clothing: [], Accessories: []
  });
  
  const [activeTab, setActiveTab] = useState('manual');
  
  const [seoData, setSeoData] = useState({
    metaTitle: '', metaDescription: '', metaKeywords: '', slug: ''
  });
  
  const [formData, setFormData] = useState({
    productName: '', brand: '', category: '', subCategory: '', images: [],
    mrp: '', sellingPrice: '', tax: 18, sku: '', fullDescription: [], keyFeatures: [],
    weight: '', dimensions: '', skinType: 'all', concerns: [], ingredients: '',
    finish: '', coverage: '', shade: '', hairType: 'all', hairConcerns: [],
    fabric: '', material: '', gender: 'unisex'
  });
  
  const [variations, setVariations] = useState([]);
  const [variationModalOpen, setVariationModalOpen] = useState(false);
  const [editingVariation, setEditingVariation] = useState(null);
  const [variationForm, setVariationForm] = useState({
    name: '', price: '', mrp: '', stock: '', sku: '', image: '', attributes: {}
  });

  const generateSKU = () => `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // 🔥 SEO Meta Data Auto-generator - Includes Product ID in the URL for exact indexing
  useEffect(() => {
    if (formData.productName) {
      const titleSlug = formData.productName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const fullSlug = `${titleSlug}-${productId}`;
      
      let metaTitle = `${formData.productName}`;
      if (formData.brand) metaTitle = `${formData.productName} - ${formData.brand}`;
      metaTitle = `${metaTitle} | Lowest Price on MyPinkShop`;
      if (metaTitle.length > 100) metaTitle = metaTitle.substring(0, 97) + '...';
      
      let metaDescription = `Buy ${formData.productName}`;
      if (formData.brand) metaDescription += ` by ${formData.brand}`;
      metaDescription += ` online at lowest price. ✓ 100% Original ✓ Free Delivery ✓ COD. Shop now at MyPinkShop!`;
      if (metaDescription.length > 200) metaDescription = metaDescription.substring(0, 197) + '...';
      
      const autoKeywords = [
        formData.brand, formData.category, formData.subCategory,
        ...formData.keyFeatures.slice(0, 5), 'lowest price online', 'best deals', 'free shipping india', 'MyPinkShop'
      ].filter(Boolean);
      const metaKeywords = [...new Set(autoKeywords)].join(', ');
      
      setSeoData({ metaTitle, metaDescription, metaKeywords, slug: fullSlug });
    }
  }, [formData.productName, formData.brand, formData.category, formData.subCategory, formData.keyFeatures, productId]);

  const skinConcerns = ['Acne', 'Aging', 'Pigmentation', 'Dryness', 'Dullness', 'Oil Control', 'Redness', 'Dark Spots', 'Uneven Texture', 'Large Pores'];

  const subCategoriesOptions = {
    Skincare: ['Face Wash', 'Cleanser', 'Face Scrub', 'Toner', 'Serum', 'Moisturizer', 'Face Cream', 'Sunscreen', 'Face Mask', 'Lip Balm'],
    Makeup: ['Foundation', 'Concealer', 'Compact Powder', 'Primer', 'Highlighter', 'Blush', 'Lipstick', 'Lip Gloss', 'Eyeliner', 'Mascara'],
    Hair: ['Shampoo', 'Conditioner', 'Hair Mask', 'Hair Oil', 'Hair Serum', 'Hair Spray'],
    Clothing: ['T-Shirt', 'Top', 'Kurti', 'Saree', 'Lehenga', 'Jeans', 'Jacket'],
    Accessories: ['Bag', 'Handbag', 'Necklace', 'Earrings', 'Watch', 'Sunglasses', 'Wallet']
  };

  const getCurrentSubCategories = () => {
    const category = formData.category;
    if (!category) return [];
    return [...(subCategoriesOptions[category] || []), ...(customSubCategories[category] || [])];
  };

  const [currentBullet, setCurrentBullet] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  const compressImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        const maxWidth = 800;
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() })), 'image/jpeg', 0.7);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });

  const uploadImageToBackend = async (file) => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('Session expired');
    const compressedFile = await compressImage(file);
    const formDataImg = new FormData();
    formDataImg.append('images', compressedFile);
    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formDataImg
    });
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.data?.url || data.url;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      alert('Maximum 5 images allowed');
      return;
    }
    setUploadingImages(true);
    const uploadedUrls = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { 
        toast.error(`${file.name} is larger than 5MB`); 
        alert(`${file.name} is larger than 5MB`); 
        continue; 
      }
      try {
        const url = await uploadImageToBackend(file);
        if (url) uploadedUrls.push(url);
      } catch (error) { toast.error(`Failed to upload: ${file.name}`); }
    }
    if (uploadedUrls.length) {
      setFormData({ ...formData, images: [...formData.images, ...uploadedUrls] });
      toast.success(`✅ ${uploadedUrls.length} image(s) uploaded successfully!`);
    }
    setUploadingImages(false);
  };

  const removeImage = (index) => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });

  const addBulletPoint = () => {
    const text = currentBullet.trim();
    if (text) {
      setFormData({ ...formData, fullDescription: [...formData.fullDescription, text] });
      setCurrentBullet('');
    }
  };

  const removeBulletPoint = (index) => setFormData({ ...formData, fullDescription: formData.fullDescription.filter((_, i) => i !== index) });

  // 🔥 STRICT VALIDATION TOAST + ALERT (Foolproof logic)
  const validateAndProceed = (targetStep) => {
    if (targetStep > 1) {
      if (!formData.productName.trim()) {
        const msg = '⚠️ Mandatory Field Missing: Please enter Product Name';
        toast.error(msg);
        alert(msg);
        setStep(1);
        return;
      }
      if (!formData.brand.trim()) {
        const msg = '⚠️ Mandatory Field Missing: Please select or enter a Brand';
        toast.error(msg);
        alert(msg);
        setStep(1);
        return;
      }
      if (!formData.category) {
        const msg = '⚠️ Mandatory Field Missing: Please select a Main Category';
        toast.error(msg);
        alert(msg);
        setStep(1);
        return;
      }
      if (!formData.subCategory) {
        const msg = '⚠️ Mandatory Field Missing: Please select a Sub Category';
        toast.error(msg);
        alert(msg);
        setStep(1);
        return;
      }
    }

    if (targetStep > 2) {
      if (!formData.images || formData.images.length === 0) {
        const msg = '⚠️ Mandatory Field Missing: Please upload at least 1 Product Image in Step 2';
        toast.error(msg);
        alert(msg);
        setStep(2);
        return;
      }
    }

    if (targetStep > 3) {
      if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
        const msg = '⚠️ Mandatory Field Missing: Please enter a valid Selling Price in Step 3';
        toast.error(msg);
        alert(msg);
        setStep(3);
        return;
      }
    }

    setStep(targetStep);
    window.scrollTo({ top: 0 });
  };

  const submitProduct = async () => {
    if (!formData.productName.trim() || !formData.brand.trim() || !formData.category || !formData.subCategory || !formData.images.length || !formData.sellingPrice) {
      const msg = '❌ Please fill all mandatory fields across all steps before publishing!';
      toast.error(msg);
      alert(msg);
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('adminToken');
    if (!token) { 
      toast.error('❌ Session expired. Please log in again.'); 
      alert('❌ Session expired. Please log in again.');
      setLoading(false); 
      return; 
    }

    const totalStock = variations.reduce((sum, v) => sum + (v.stock || 0), 0);
    const finalSku = formData.sku || generateSKU();

    const productData = {
      id: productId, // ✅ Pre-locked ID so it matches the Google URL preview
      name: formData.productName, brand: formData.brand, category: formData.subCategory,
      mainCategory: formData.category, subCategory: formData.subCategory, subcategory: formData.subCategory, 
      price: parseFloat(formData.sellingPrice),
      originalPrice: parseFloat(formData.mrp) || parseFloat(formData.sellingPrice) * 1.2,
      tax: parseFloat(formData.tax) || 18, stock: totalStock > 0 ? totalStock : (formData.stock || 10), sku: finalSku,
      images: formData.images, description: formData.fullDescription, keyFeatures: formData.keyFeatures,
      weight: formData.weight, dimensions: formData.dimensions, skinType: formData.skinType, concerns: formData.concerns, 
      ingredients: formData.ingredients, finish: formData.finish, coverage: formData.coverage, shade: formData.shade,
      hairType: formData.hairType, hairConcerns: formData.hairConcerns, fabric: formData.fabric, material: formData.material, 
      gender: formData.gender, variations: variations, hasVariations: variations.length > 0,
      metaTitle: seoData.metaTitle, metaDescription: seoData.metaDescription, metaKeywords: seoData.metaKeywords, slug: seoData.slug,
      status: 'active', adminApproved: true, isNew: true, rating: 4.8
    };

    try {
      const response = await fetch(`${API_URL}/api/products/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(productData)
      });
      const resJson = await response.json();
      if (!response.ok || resJson.success === false) {
        throw new Error(resJson.error || resJson.message || 'Server rejected product creation');
      }
      toast.success('🎉 Product published successfully & optimized for Google SEO!');
      navigate('/admin/inventory');
    } catch (error) { 
      toast.error(`❌ Failed to save product: ${error.message}`);
      alert(`❌ Failed to save product: ${error.message}`);
    } finally { setLoading(false); }
  };

  const IconBack = () => (<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>);
  const IconUpload = () => (<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>);

  const currentSubCategories = getCurrentSubCategories();
  const filteredBrands = brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50/30">
      <div className="bg-white/95 backdrop-blur-md border-b border-pink-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/admin/inventory" className="text-gray-500 hover:text-pink-600 transition p-1"><IconBack /></Link>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Add New Product (SEO ID: {productId})</h1>
              <p className="text-xs text-gray-400">Google SEO & Shopping Optimized</p>
            </div>
          </div>
          <button onClick={submitProduct} disabled={loading} className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-5 py-2 rounded-lg text-sm font-medium">
            {loading ? 'Publishing...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6">
        <div className="flex gap-2 border-b border-pink-100 mb-6">
          <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === 'manual' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>✏️ Manual Entry</button>
          <button onClick={() => setActiveTab('import')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === 'import' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>📦 Amazon Importer</button>
          <button onClick={() => setActiveTab('flipkart')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === 'flipkart' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'}`}>🛒 Flipkart Importer</button>
        </div>

        {activeTab === 'import' && <AmazonImporter onProductImported={() => setActiveTab('manual')} setFormData={setFormData} setVariations={setVariations} setImages={(imgs) => setFormData(p => ({...p, images: imgs}))} />}
        {activeTab === 'flipkart' && <FlipkartImporter onProductImported={() => setActiveTab('manual')} setFormData={setFormData} setVariations={setVariations} setImages={(imgs) => setFormData(p => ({...p, images: imgs}))} />}

        {activeTab === 'manual' && (
          <>
            <div className="flex bg-white rounded-xl shadow-sm border p-3 mb-6 gap-2">
              {['1. Basic', '2. Images', '3. Pricing', '4. Details', '5. SEO'].map((lbl, idx) => (
                <button key={idx} onClick={() => validateAndProceed(idx + 1)} className={`px-3 py-1.5 rounded text-xs font-semibold ${step === idx + 1 ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {lbl}
                </button>
              ))}
            </div>

            {step === 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">📋 Basic Information</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input type="text" value={formData.productName} onChange={(e) => setFormData({...formData, productName: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., Vitamin C Serum" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                  <input type="text" value={formData.brand} onChange={(e) => { setFormData({...formData, brand: e.target.value}); setBrandSearch(e.target.value); }} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Brand name" />
                  {brandSearch && (
                    <div className="absolute z-10 w-64 bg-white border rounded shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {filteredBrands.map(b => <button key={b} type="button" onClick={() => { setFormData({...formData, brand: b}); setBrandSearch(''); }} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-pink-50">{b}</button>)}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value, subCategory: ''})} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                      <option value="">Select Category</option>
                      {Object.keys(subCategoriesOptions).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category *</label>
                    <select value={formData.subCategory} onChange={(e) => setFormData({...formData, subCategory: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm bg-white" disabled={!formData.category}>
                      <option value="">Select Sub Category</option>
                      {currentSubCategories.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-6"><button onClick={() => validateAndProceed(2)} className="bg-pink-600 text-white px-5 py-2 rounded-lg text-sm">Continue →</button></div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6 text-center space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">📸 Product Images</h2>
                <div className="flex flex-wrap gap-2 justify-center">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 rounded-full">✕</button>
                    </div>
                  ))}
                </div>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="imgUp" />
                <label htmlFor="imgUp" className="inline-block border-2 border-pink-200 rounded-lg px-5 py-2.5 text-pink-600 cursor-pointer text-sm font-medium"><IconUpload /> Choose Images</label>
                <div className="flex justify-between mt-6"><button onClick={() => validateAndProceed(1)} className="px-5 py-2 border rounded-lg text-sm">← Back</button><button onClick={() => validateAndProceed(3)} className="bg-pink-600 text-white px-5 py-2 rounded-lg text-sm">Continue →</button></div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">💰 Pricing</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium mb-1">MRP</label><input type="number" value={formData.mrp} onChange={(e) => setFormData({...formData, mrp: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-sm font-medium mb-1">Selling Price *</label><input type="number" value={formData.sellingPrice} onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-sm font-medium mb-1">Tax %</label><input type="number" value={formData.tax} onChange={(e) => setFormData({...formData, tax: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                </div>
                <div className="flex justify-between mt-6"><button onClick={() => validateAndProceed(2)} className="px-5 py-2 border rounded-lg text-sm">← Back</button><button onClick={() => validateAndProceed(4)} className="bg-pink-600 text-white px-5 py-2 rounded-lg text-sm">Continue →</button></div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">✨ Product Details</h2>
                <div>
                  <label className="block text-sm font-medium mb-1">About this item (Bullet Points)</label>
                  <div className="space-y-1 mb-2">
                    {formData.fullDescription.map((b, i) => (
                      <div key={i} className="flex justify-between bg-gray-50 p-2 rounded text-sm"><span>• {b}</span><button onClick={() => removeBulletPoint(i)} className="text-red-500">×</button></div>
                    ))}
                  </div>
                  <div className="flex gap-2"><input type="text" value={currentBullet} onChange={(e) => setCurrentBullet(e.target.value)} placeholder="Add point" className="flex-1 border rounded px-3 py-1.5 text-sm" /><button onClick={addBulletPoint} className="bg-pink-600 text-white px-4 py-1.5 rounded text-sm">Add</button></div>
                </div>
                <div className="flex justify-between mt-6"><button onClick={() => validateAndProceed(3)} className="px-5 py-2 border rounded-lg text-sm">← Back</button><button onClick={() => validateAndProceed(5)} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm">Continue to SEO →</button></div>
              </div>
            )}

            {step === 5 && (
              <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">🔍 Google SEO & Permanent URL Structure</h2>
                <div><label className="block text-sm font-medium mb-1">Meta Title</label><input type="text" value={seoData.metaTitle} onChange={(e) => setSeoData({...seoData, metaTitle: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Meta Description</label><textarea value={seoData.metaDescription} onChange={(e) => setSeoData({...seoData, metaDescription: e.target.value})} rows="3" className="w-full border rounded px-3 py-2 text-sm"></textarea></div>
                
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">📱 Google Search & URL Preview</h3>
                  <p className="text-blue-600 text-sm">{seoData.metaTitle}</p>
                  <p className="text-green-700 text-xs font-mono">https://www.mypinkshop.com/product/{productId}</p>
                  <p className="text-gray-600 text-xs mt-1">{seoData.metaDescription}</p>
                </div>

                <div className="flex justify-between mt-6"><button onClick={() => validateAndProceed(4)} className="px-5 py-2 border rounded-lg text-sm">← Back</button><button onClick={submitProduct} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium text-sm">{loading ? 'Publishing...' : '✓ Publish & Rank on Google'}</button></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminAddProduct;
