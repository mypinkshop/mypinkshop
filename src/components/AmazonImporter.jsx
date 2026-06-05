import { useState } from 'react';

function AmazonImporter({ onProductImported, setFormData, setVariations, setImages }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchedProduct, setFetchedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Skincare');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [step, setStep] = useState(1);
  const [availableSubCategories, setAvailableSubCategories] = useState([]);

  const API_URL = 'https://api.mypinkshop.com';
  const token = localStorage.getItem('adminToken');

  const categories = ['Skincare', 'Makeup', 'Hair', 'Clothing', 'Accessories'];

  const subCategoriesMap = {
    Skincare: [
      'Face Wash', 'Cleanser', 'Face Scrub', 'Toner', 'Serum', 'Moisturizer', 'Face Cream',
      'Sunscreen', 'Face Mask', 'Sheet Mask', 'Eye Cream', 'Lip Balm', 'Lip Scrub',
      'Facial Oil', 'Night Cream', 'Day Cream', 'Anti Aging Cream', 'Acne Treatment',
      'Spot Corrector', 'Face Mist', 'Soap', 'Body Wash', 'Body Lotion', 'Body Scrub',
      'Body Oil', 'Body Butter', 'Hand Cream', 'Face Pack', 'Ubtan'
    ],
    Makeup: [
      'Foundation', 'Concealer', 'Compact Powder', 'Primer', 'Highlighter', 'Contour',
      'Blush', 'Bronzer', 'Lipstick', 'Lip Gloss', 'Lip Liner', 'Eyeshadow',
      'Eyeshadow Palette', 'Eyeliner', 'Kajal', 'Mascara', 'Eyebrow Pencil',
      'Makeup Fixer', 'Setting Spray', 'Makeup Remover'
    ],
    Hair: [
      'Shampoo', 'Conditioner', 'Hair Mask', 'Hair Oil', 'Hair Serum', 'Hair Spray',
      'Hair Cream', 'Hair Gel', 'Dry Shampoo', 'Hair Color', 'Hair Dye',
      'Anti Dandruff', 'Hair Fall Control', 'Hair Growth Serum', 'Scalp Scrub',
      'Heat Protectant', 'Sulfate Free Shampoo'
    ],
    Clothing: [
      'T-Shirt', 'Top', 'Kurti', 'Saree', 'Lehenga', 'Salwar Suit', 'Anarkali',
      'Gown', 'Dress', 'Skirt', 'Jeans', 'Trousers', 'Leggings', 'Palazzos',
      'Jacket', 'Sweater', 'Sweatshirt', 'Hoodie', 'Winter Coat', 'Night Suit',
      'Activewear', 'Sports Bra', 'Swimsuit', 'Ethnic Wear', 'Western Wear'
    ],
    Accessories: [
      'Bag', 'Handbag', 'Sling Bag', 'Backpack', 'Clutch', 'Wallet', 'Jewelry Set',
      'Necklace', 'Earrings', 'Ring', 'Bracelet', 'Hair Accessory', 'Watch',
      'Sunglasses', 'Belt', 'Scarf', 'Cap', 'Hat', 'Gloves', 'Phone Case'
    ]
  };

  const garbageWords = [
    'See more product details', 'Report an issue', 'Product Description',
    'To see our price', 'See more', 'Product details', 'Would you like to',
    'Tell us about', 'Brief content visible', 'double tap to read full content',
    'full content visible', 'double tap to read', 'Read more', 'Read less',
    'Loading...', 'Sorry, we couldn\'t load the review', 'Customer Reviews',
    'Top reviews', 'There was a problem', 'Filtered by', 'Sort by',
    'Visit the', 'Store', 'Shop', 'Brand:'
  ];

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setAvailableSubCategories(subCategoriesMap[category] || []);
    setSelectedSubCategory('');
  };

  const cleanText = (text) => {
    if (!text) return '';
    return text
      .replace(/【.*?】/g, '')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/Visit the|Store|Shop|Brand:/gi, '')
      .trim();
  };

  const isGarbage = (text) => {
    if (!text || text.length < 15) return true;
    for (const word of garbageWords) {
      if (text.toLowerCase().includes(word.toLowerCase())) return true;
    }
    return false;
  };

  const extractBrand = (scraped) => {
    let brand = '';
    
    if (scraped.brand && !scraped.brand.includes('Visit')) {
      brand = scraped.brand;
    }
    
    if (brand) {
      brand = brand.replace(/Visit the|Store|Shop|by|Brand:/gi, '').trim();
    }
    
    if (!brand && scraped.name && scraped.name.includes('-')) {
      brand = scraped.name.split('-')[0].trim();
    }
    
    return brand;
  };

  const extractSubCategory = (name, description, category) => {
    const subCats = subCategoriesMap[category] || [];
    const searchText = (name + ' ' + (Array.isArray(description) ? description.join(' ') : description)).toLowerCase();
    
    for (const sub of subCats) {
      if (searchText.includes(sub.toLowerCase())) {
        return sub;
      }
    }
    return '';
  };

  const generateSeoFields = (productName, brand, keyFeatures = []) => {
    const slug = productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let metaTitle = `${productName}`;
    if (brand && !brand.includes('Visit')) metaTitle = `${productName} - ${brand}`;
    metaTitle = `${metaTitle} | MyPinkShop`;
    if (metaTitle.length > 60) metaTitle = metaTitle.substring(0, 57) + '...';
    
    let metaDescription = `Buy ${productName}`;
    if (brand && !brand.includes('Visit')) metaDescription += ` by ${brand}`;
    metaDescription += ` online at best price. Shop now at MyPinkShop.`;
    if (metaDescription.length > 160) metaDescription = metaDescription.substring(0, 157) + '...';
    
    const keywords = [brand, selectedCategory, selectedSubCategory, ...(keyFeatures || [])].filter(Boolean);
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
        const cleanBrand = extractBrand(data.scraped);
        const autoSubCategory = extractSubCategory(
          data.scraped.name, 
          data.scraped.description, 
          selectedCategory
        );
        
        setSelectedSubCategory(autoSubCategory);
        setFetchedProduct({
          ...data,
          cleanBrand,
          autoSubCategory
        });
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

  const cleanDescriptionArray = (description) => {
    let items = [];
    
    if (Array.isArray(description)) {
      items = [...description];
    } else if (typeof description === 'string') {
      items = description.split(/\n|•|\*|\d+\.|●|○|▪|►|➤/);
    }
    
    const cleaned = items
      .map(item => cleanText(item))
      .filter(item => !isGarbage(item))
      .filter(item => item.length > 15 && item.length < 300);
    
    return [...new Set(cleaned)];
  };

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

  // 🔥 FIXED: Import to form with all new fields from backend
  const importToForm = () => {
    if (!fetchedProduct?.scraped) return;

    const scraped = fetchedProduct.scraped;
    const cleanBrand = fetchedProduct.cleanBrand || scraped.brand || '';
    const finalSubCategory = selectedSubCategory || fetchedProduct.autoSubCategory || '';
    
    // Clean description
    let descriptionArray = cleanDescriptionArray(scraped.description);
    if (descriptionArray.length === 0 && scraped.description) {
      let text = typeof scraped.description === 'string' ? scraped.description : JSON.stringify(scraped.description);
      let sentences = text.split(/\.\s+|\n/);
      descriptionArray = sentences
        .map(s => cleanText(s))
        .filter(s => s.length > 20 && s.length < 200 && !isGarbage(s));
    }
    
    if (descriptionArray.length === 0) {
      descriptionArray = [`Premium ${scraped.name} - High quality product`];
    }
    
    // Clean key features
    let keyFeaturesArray = cleanFeaturesArray(scraped.keyFeatures);
    
    // Generate SEO fields
    const seoFields = generateSeoFields(scraped.name, cleanBrand, keyFeaturesArray);

    // 🔥 Set form data with ALL fields including new ones
    setFormData(prev => ({
      ...prev,
      productName: scraped.name || '',
      brand: cleanBrand,
      category: selectedCategory,
      subCategory: finalSubCategory,
      mainCategory: selectedCategory,
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
      slug: seoFields.slug,
      // 🔥 New fields from backend
      ingredients: scraped.ingredients || '',
      skinType: scraped.skinType || 'all',
      concerns: scraped.concerns || [],
      finish: scraped.finish || '',
      coverage: scraped.coverage || '',
      hairType: scraped.hairType || 'all',
      hairConcerns: scraped.hairConcerns || []
    }));

    // Set images
    if (scraped.images && scraped.images.length > 0) {
      setImages(scraped.images);
    }

    // 🔥 Set variations with MRP
    if (scraped.variations && scraped.variations.length > 0) {
      const formattedVariations = scraped.variations.map((v, idx) => ({
        id: Date.now() + idx,
        name: v.name,
        price: v.price || scraped.price,
        mrp: v.mrp || scraped.originalPrice || scraped.price * 1.2,
        stock: v.stock || 10,
        sku: v.sku || `VAR-${Date.now()}-${idx}`
      }));
      setVariations(formattedVariations);
    }

    alert(`✅ Imported: ${descriptionArray.length} bullet points | Category: ${selectedCategory} | SubCategory: ${finalSubCategory || 'Auto-detected'}`);
    
    if (onProductImported) onProductImported();
    setStep(1);
    setUrl('');
    setFetchedProduct(null);
  };

  const saveProduct = async () => {
    setLoading(true);
    try {
      const scraped = fetchedProduct.scraped;
      const cleanBrand = fetchedProduct.cleanBrand || scraped.brand || '';
      const finalSubCategory = selectedSubCategory || fetchedProduct.autoSubCategory || '';
      const keyFeaturesArray = cleanFeaturesArray(scraped.keyFeatures);
      const seoFields = generateSeoFields(scraped.name, cleanBrand, keyFeaturesArray);
      
      const productData = {
        name: scraped.name,
        brand: cleanBrand,
        mainCategory: selectedCategory,
        category: finalSubCategory,
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
        // 🔥 New fields
        ingredients: scraped.ingredients || '',
        skinType: scraped.skinType || 'all',
        concerns: scraped.concerns || [],
        finish: scraped.finish || '',
        coverage: scraped.coverage || '',
        hairType: scraped.hairType || 'all',
        hairConcerns: scraped.hairConcerns || [],
        variations: scraped.variations || [],
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
        alert('✅ Product imported successfully with all details!');
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

  const resetImporter = () => {
    setStep(1);
    setUrl('');
    setFetchedProduct(null);
    setSelectedSubCategory('');
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-6 mb-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">📦</span> Import from Amazon
          <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full">Auto Brand, Category & Variations</span>
        </h2>
        {step === 2 && (
          <button onClick={resetImporter} className="text-gray-400 hover:text-gray-600">✕</button>
        )}
      </div>
      
      {step === 1 && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Paste Amazon product URL - Product details, variations, ingredients, skin type will be auto-detected!
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
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
            <p className="text-xs text-blue-600">💡 Tip: Product name, price, images, full description, variations, ingredients, skin type, concerns will be auto-detected!</p>
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
                <p className="text-sm text-green-600 mt-1">✨ Brand: {fetchedProduct.cleanBrand || fetchedProduct.scraped.brand || 'Auto-detected'}</p>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-xl font-bold text-pink-600">₹{fetchedProduct.scraped.price}</p>
                  {fetchedProduct.scraped.originalPrice && fetchedProduct.scraped.originalPrice > fetchedProduct.scraped.price && (
                    <p className="text-sm text-gray-400 line-through">₹{fetchedProduct.scraped.originalPrice}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400">⭐ {fetchedProduct.scraped.rating || 'N/A'} reviews</p>
                {fetchedProduct.scraped.ingredients && (
                  <p className="text-xs text-purple-600 mt-1">✨ Ingredients: {fetchedProduct.scraped.ingredients.substring(0, 100)}...</p>
                )}
                {fetchedProduct.scraped.skinType && fetchedProduct.scraped.skinType !== 'all' && (
                  <p className="text-xs text-blue-600 mt-1">🧴 Skin Type: {fetchedProduct.scraped.skinType}</p>
                )}
                {fetchedProduct.scraped.concerns && fetchedProduct.scraped.concerns.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1">🎯 Concerns: {fetchedProduct.scraped.concerns.join(', ')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Category & SubCategory Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 bg-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
              <select
                value={selectedSubCategory || fetchedProduct.autoSubCategory || ''}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 bg-white"
              >
                <option value="">Auto-detect or select</option>
                {availableSubCategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              {fetchedProduct.autoSubCategory && !selectedSubCategory && (
                <p className="text-xs text-green-600 mt-1">🔍 Auto-detected: {fetchedProduct.autoSubCategory}</p>
              )}
            </div>
          </div>

          {/* Variations Preview */}
          {fetchedProduct.scraped.variations && fetchedProduct.scraped.variations.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-700 mb-2">📦 Variations Detected ({fetchedProduct.scraped.variations.length})</p>
              <div className="flex flex-wrap gap-2">
                {fetchedProduct.scraped.variations.slice(0, 5).map((v, idx) => (
                  <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                    {v.name} - ₹{v.price}
                  </span>
                ))}
                {fetchedProduct.scraped.variations.length > 5 && (
                  <span className="text-xs text-gray-500">+{fetchedProduct.scraped.variations.length - 5} more</span>
                )}
              </div>
            </div>
          )}

          {/* SEO Preview */}
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <p className="font-medium text-gray-700 mb-2">🔍 SEO Preview</p>
            <div className="space-y-1 text-xs">
              <p><span className="text-gray-500">Slug:</span> <code className="text-blue-600">{generateSeoFields(fetchedProduct.scraped.name, fetchedProduct.cleanBrand, []).slug}</code></p>
              <p><span className="text-gray-500">Meta Title:</span> <span className="text-blue-600 break-words">{generateSeoFields(fetchedProduct.scraped.name, fetchedProduct.cleanBrand, []).metaTitle}</span></p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={resetImporter} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button onClick={importToForm} className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition">📥 Import to Form</button>
            <button onClick={saveProduct} disabled={loading} className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50">
              {loading ? 'Importing...' : '✅ Save Directly'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AmazonImporter;
