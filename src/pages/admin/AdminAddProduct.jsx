import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// ============================================
// AMAZON IMPORTER COMPONENT
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
    
    descriptionArray = [...new Set(descriptionArray)];
    
    const keyFeaturesArray = (Array.isArray(product.keyFeatures) ? product.keyFeatures : [])
      .filter(item => !isGarbage(item));
    
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
    
    // Set variations if available
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
      category: product.detectedCategory || prev.category,
      subCategory: product.detectedSubCategory || prev.subCategory
    }));
    
    if (product.images && product.images.length > 0) setImages(product.images);
    
    alert(`✅ Imported ${descriptionArray.length} bullet points!`);
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
        <p className="text-xs text-blue-600">💡 Tip: Paste up to 20 Amazon URLs. All bullet points will be fetched!</p>
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
  const [brands, setBrands] = useState([
    'Nykaa Beauty', 'Mamaearth', 'Sugar Cosmetics', 'The Face Shop', 
    'Lakmé', 'MyGlamm', 'Plum', 'Wow Skin Science', 'Biotique', 
    'Forest Essentials', 'Kama Ayurveda', 'Mcaffeine', 'St.Botanica',
    'Loreal Paris', 'Maybelline', 'Clinique', 'Estee Lauder', 'Huda Beauty', 'MAC',
    'Nivea', 'Ponds', 'Garnier', 'Dove', 'Pantene', 'Head & Shoulders',
    'Cetaphil', 'The Ordinary', 'Minimalist', 'Aroma Magic', 'Just Herbs'
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
    skinType: 'all', concerns: [], ingredients: '', finish: '', coverage: '', shade: '',
    hairType: 'all', hairConcerns: [], fabric: '', material: '', gender: 'unisex',
    weight: '', dimensions: '', metaTitle: '', metaDescription: '', metaKeywords: '', slug: ''
  });
  
  const [variations, setVariations] = useState([]);
  const [variationModalOpen, setVariationModalOpen] = useState(false);
  const [editingVariation, setEditingVariation] = useState(null);
  const [variationForm, setVariationForm] = useState({
    name: '', price: '', mrp: '', stock: '', sku: '', attributes: {}
  });

  const generateSKU = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SKU-${timestamp}-${random}`;
  };

  useEffect(() => {
    if (formData.productName) {
      const slug = formData.productName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      let metaTitle = `${formData.productName}`;
      if (formData.brand) metaTitle = `${formData.productName} - ${formData.brand}`;
      metaTitle = `${metaTitle} | MyPinkShop`;
      if (metaTitle.length > 60) metaTitle = metaTitle.substring(0, 57) + '...';
      
      let metaDescription = `Buy ${formData.productName}`;
      if (formData.brand) metaDescription += ` by ${formData.brand}`;
      metaDescription += ` online at best price. Shop now at MyPinkShop.`;
      if (metaDescription.length > 160) metaDescription = metaDescription.substring(0, 157) + '...';
      
      const keywords = [formData.brand, formData.category, formData.subCategory, ...formData.keyFeatures].filter(Boolean);
      const metaKeywords = keywords.join(', ');
      
      setSeoData({ metaTitle, metaDescription, metaKeywords, slug });
    }
  }, [formData.productName, formData.brand, formData.category, formData.subCategory, formData.keyFeatures]);

  const skinConcerns = ['Acne', 'Aging', 'Pigmentation', 'Dryness', 'Dullness', 'Oil Control', 'Redness', 'Dark Spots', 'Uneven Texture', 'Large Pores'];
  const makeupFinishes = ['Matte', 'Glossy', 'Satin', 'Shimmer', 'Dewy', 'Metallic', 'Creamy', 'Powder', 'Liquid', 'Velvet'];
  const makeupCoverage = ['Light', 'Medium', 'Full', 'Sheer', 'Buildable'];
  const hairConcernsList = ['Hairfall', 'Dandruff', 'Dry Hair', 'Frizzy Hair', 'Split Ends', 'Damaged Hair', 'Hair Growth', 'Volume', 'Scalp Itching', 'Premature Greying'];
  const hairTypes = ['All', 'Oily', 'Dry', 'Normal', 'Curly', 'Wavy', 'Straight', 'Coily', 'Fine', 'Thick'];

  const subCategoriesOptions = {
    Skincare: [
      'Face Wash', 'Cleanser', 'Face Scrub', 'Toner', 'Serum', 'Moisturizer', 'Face Cream',
      'Sunscreen', 'Face Mask', 'Sheet Mask', 'Eye Cream', 'Under Eye Patch', 'Lip Balm',
      'Lip Scrub', 'Facial Oil', 'Facial Mist', 'Night Cream', 'Day Cream', 'Anti Aging Cream',
      'Acne Treatment', 'Spot Corrector', 'Pimple Patch', 'Face Mist', 'Facial Kit', 'Soap',
      'Face Wash Bar', 'Body Wash', 'Body Lotion', 'Body Scrub', 'Body Oil', 'Body Butter',
      'Hand Cream', 'Foot Cream', 'Cuticle Oil', 'Multani Mitti', 'Face Pack', 'Ubtan',
      'Charcoal Face Wash', 'Gel Cleanser', 'Foaming Cleanser', 'Retinol Serum', 'Vitamin C Serum',
      'Hyaluronic Acid Serum', 'Niacinamide Serum', 'SPF 30', 'SPF 50', 'Clay Mask', 'Peel Off Mask'
    ],
    Makeup: [
      'Foundation', 'Concealer', 'Compact Powder', 'Loose Powder', 'Setting Powder',
      'Primer', 'Color Corrector', 'Highlighter', 'Contour', 'Blush', 'Bronzer',
      'Lipstick', 'Lip Gloss', 'Lip Liner', 'Lip Stain', 'Lip Oil', 'Lip Plumper',
      'Eyeshadow', 'Eyeshadow Palette', 'Eyeliner', 'Kajal', 'Mascara', 'Eyebrow Pencil',
      'Eyebrow Gel', 'Eye Primer', 'False Eyelashes', 'Makeup Fixer', 'Setting Spray',
      'Makeup Remover', 'Micellar Water', 'Face Primer', 'Lip Primer', 'Eye Primer',
      'Liquid Foundation', 'Cream Foundation', 'Powder Foundation', 'Matte Lipstick',
      'Liquid Lipstick', 'Gel Eyeliner', 'Liquid Eyeliner', 'Pencil Eyeliner'
    ],
    Hair: [
      'Shampoo', 'Conditioner', 'Hair Mask', 'Hair Oil', 'Hair Serum', 'Hair Spray',
      'Hair Cream', 'Hair Butter', 'Hair Gel', 'Hair Wax', 'Dry Shampoo', 'Leave-in Conditioner',
      'Hair Color', 'Hair Dye', 'Hair Toner', 'Bleach', 'Hair Removal Cream',
      'Anti Dandruff', 'Hair Fall Control', 'Hair Growth Serum', 'Scalp Scrub',
      'Hair Mist', 'Hair Perfume', 'Heat Protectant', 'Sulfate Free Shampoo',
      'Curly Hair Products', 'Straightening Cream', 'Smoothening Serum', 'Keratin Treatment',
      'Purple Shampoo', 'Argan Oil', 'Coconut Oil', 'Castor Oil', 'Rosemary Oil'
    ],
    Clothing: [
      'T-Shirt', 'Top', 'Blouse', 'Shirt', 'Kurti', 'Kurta', 'Saree', 'Lehenga',
      'Salwar Suit', 'Anarkali', 'Gown', 'Dress', 'Skirt', 'Shorts', 'Jeans',
      'Trousers', 'Joggers', 'Leggings', 'Jeggings', 'Palazzos', 'Cargos',
      'Jacket', 'Blazer', 'Sweater', 'Sweatshirt', 'Hoodie', 'Cardigan',
      'Winter Coat', 'Puffer Jacket', 'Denim Jacket', 'Leather Jacket',
      'Night Suit', 'Pyjama', 'Lounge Wear', 'Activewear', 'Sports Bra',
      'Swimsuit', 'Bikini', 'Beach Wear', 'Ethnic Wear', 'Western Wear',
      'Crop Top', 'Tank Top', 'Mom Jeans', 'Skinny Jeans', 'Track Pants', 'Yoga Pants'
    ],
    Accessories: [
      'Bag', 'Handbag', 'Tote Bag', 'Sling Bag', 'Backpack', 'Clutch', 'Wallet',
      'Jewelry Set', 'Necklace', 'Earrings', 'Ring', 'Bracelet', 'Anklet',
      'Hair Accessory', 'Hair Clip', 'Hair Band', 'Scrunchie', 'Hair Tie',
      'Watch', 'Smart Watch', 'Sunglasses', 'Spectacles', 'Belt', 'Scarf',
      'Stole', 'Muffler', 'Cap', 'Hat', 'Gloves', 'Socks', 'Stockings',
      'Phone Case', 'Keychain', 'Lanyard', 'Face Mask', 'Hand Purse',
      'Crossover Bag', 'Bucket Bag', 'Stud Earrings', 'Hoop Earrings', 'Chain Necklace'
    ]
  };

  const getVariationAttributes = () => {
    switch(formData.category) {
      case 'Skincare': 
        return { type: 'size', options: ['15ml', '30ml', '50ml', '100ml', '150ml', '200ml', '250ml', '500ml', 'Custom'], secondary: 'variant', secondaryOptions: ['Original', 'Herbal', 'Organic', 'Ayurvedic', 'Custom'] };
      case 'Makeup': 
        return { type: 'shade', options: ['Fair', 'Light', 'Medium', 'Tan', 'Deep', 'Red', 'Pink', 'Nude', 'Coral', 'Berry', 'Custom'], secondary: 'finish', secondaryOptions: ['Matte', 'Glossy', 'Satin', 'Shimmer', 'Dewy', 'Metallic', 'Custom'] };
      case 'Hair': 
        return { type: 'size', options: ['100ml', '200ml', '300ml', '500ml', '1L', 'Custom'], secondary: 'variant', secondaryOptions: ['Original', 'Herbal', 'Organic', 'Sulfate Free', 'Custom'] };
      case 'Clothing': 
        return { type: 'size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size', 'Custom'], secondary: 'color', secondaryOptions: ['Red', 'Blue', 'Green', 'Black', 'White', 'Pink', 'Purple', 'Yellow', 'Navy', 'Grey', 'Custom'] };
      case 'Accessories': 
        return { type: 'size', options: ['One Size', 'S', 'M', 'L', 'Free Size', 'Adjustable', 'Custom'], secondary: 'color', secondaryOptions: ['Gold', 'Silver', 'Rose Gold', 'Black', 'White', 'Multicolor', 'Custom'] };
      default: 
        return { type: 'variant', options: ['Default', 'Custom'], secondary: null, secondaryOptions: [] };
    }
  };

  const variationAttrs = getVariationAttributes();

  useEffect(() => {
    const savedBrands = localStorage.getItem('brandsList');
    if (savedBrands) setBrands(JSON.parse(savedBrands));
    const savedSubCategories = localStorage.getItem('customSubCategories');
    if (savedSubCategories) setCustomSubCategories(JSON.parse(savedSubCategories));
  }, []);

  const saveBrands = (updatedBrands) => {
    setBrands(updatedBrands);
    localStorage.setItem('brandsList', JSON.stringify(updatedBrands));
  };

  const saveCustomSubCategory = (category, newSubCat) => {
    const updated = { ...customSubCategories, [category]: [...(customSubCategories[category] || []), newSubCat] };
    setCustomSubCategories(updated);
    localStorage.setItem('customSubCategories', JSON.stringify(updated));
  };

  const getCurrentSubCategories = () => {
    const category = formData.category;
    if (!category) return [];
    return [...(subCategoriesOptions[category] || []), ...(customSubCategories[category] || [])];
  };

  const handleAddNewSubCategory = () => {
    if (newSubCategory.trim() && formData.category) {
      const currentOptions = getCurrentSubCategories();
      if (!currentOptions.includes(newSubCategory.trim())) {
        saveCustomSubCategory(formData.category, newSubCategory.trim());
        setFormData({ ...formData, subCategory: newSubCategory.trim() });
        setNewSubCategory('');
        setShowAddSubCategory(false);
        alert(`✅ Sub-category "${newSubCategory.trim()}" added!`);
      } else alert('⚠️ Already exists!');
    } else {
      alert('Please select a category first');
    }
  };

  const saveVariation = () => {
    if (!variationForm.name) return alert(`Please select ${variationAttrs.type}`);
    
    const existingIndex = variations.findIndex(v => v.name === variationForm.name && v.secondaryName === variationForm.attributes.secondary);
    const newVariation = {
      id: editingVariation?.id || Date.now(),
      name: variationForm.name,
      secondaryName: variationForm.attributes.secondary || '',
      price: parseFloat(variationForm.price) || 0,
      mrp: parseFloat(variationForm.mrp) || parseFloat(variationForm.price) * 1.2 || 0,
      stock: parseInt(variationForm.stock) || 0,
      sku: variationForm.sku || `VAR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    };
    
    if (editingVariation) {
      const updated = [...variations];
      updated[variations.findIndex(v => v.id === editingVariation.id)] = newVariation;
      setVariations(updated);
      alert('✅ Variation updated successfully!');
    } else {
      if (existingIndex !== -1) return alert(`⚠️ This ${variationAttrs.type} combination already exists!`);
      setVariations([...variations, newVariation]);
      alert(`✅ ${variationAttrs.type} added successfully!`);
    }
    setVariationModalOpen(false);
    setEditingVariation(null);
    setVariationForm({ name: '', price: '', mrp: '', stock: '', sku: '', attributes: {} });
  };

  const editVariation = (variation) => {
    setEditingVariation(variation);
    setVariationForm({ 
      name: variation.name, 
      price: variation.price, 
      mrp: variation.mrp || variation.price * 1.2,
      stock: variation.stock, 
      sku: variation.sku, 
      attributes: { secondary: variation.secondaryName || '' } 
    });
    setVariationModalOpen(true);
  };

  const deleteVariation = (variationId) => {
    if (confirm('Delete this variation?')) setVariations(variations.filter(v => v.id !== variationId));
  };

  const setImages = (images) => setFormData(prev => ({ ...prev, images }));

  const [currentBullet, setCurrentBullet] = useState('');
  const [keyFeature, setKeyFeature] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const API_URL = 'https://api.mypinkshop.com';

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
    try {
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
      return data.url;
    } catch (error) { throw error; }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 5) return alert('Maximum 5 images');
    setUploadingImages(true);
    const uploadedUrls = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { alert(`${file.name} > 5MB`); continue; }
      try {
        const url = await uploadImageToBackend(file);
        uploadedUrls.push(url);
      } catch (error) { alert(`Failed: ${file.name}`); }
    }
    if (uploadedUrls.length) {
      setFormData({ ...formData, images: [...formData.images, ...uploadedUrls] });
      alert(`✅ ${uploadedUrls.length} image(s) uploaded successfully!`);
    }
    setUploadingImages(false);
  };

  const removeImage = (index) => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });

  const addBulletPoint = () => {
    const text = currentBullet.trim();
    const garbagePhrases = ['see more product details', 'report an issue', 'see more'];
    const isGarbage = garbagePhrases.some(p => text.toLowerCase().includes(p));
    if (text && !isGarbage) {
      setFormData({ ...formData, fullDescription: [...formData.fullDescription, text] });
      setCurrentBullet('');
    } else if (isGarbage) alert('That is garbage text. Please enter valid content.');
  };

  const removeBulletPoint = (index) => setFormData({ ...formData, fullDescription: formData.fullDescription.filter((_, i) => i !== index) });

  const addKeyFeature = () => {
    if (keyFeature.trim()) {
      if (formData.keyFeatures.length >= 10) return alert('Max 10 features');
      setFormData({ ...formData, keyFeatures: [...formData.keyFeatures, keyFeature.trim()] });
      setKeyFeature('');
    }
  };

  const removeKeyFeature = (index) => setFormData({ ...formData, keyFeatures: formData.keyFeatures.filter((_, i) => i !== index) });

  const handleAddNewBrand = () => {
    if (newBrand.trim() && !brands.includes(newBrand.trim())) {
      saveBrands([...brands, newBrand.trim()]);
      setFormData({ ...formData, brand: newBrand.trim() });
      setNewBrand('');
      setShowAddBrand(false);
      alert(`✅ Brand "${newBrand.trim()}" added!`);
    } else if (brands.includes(newBrand.trim())) {
      alert('⚠️ Brand already exists!');
    } else {
      alert('Please enter a valid brand name');
    }
  };

  const filteredBrands = brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()));

  const submitProduct = async () => {
    if (!formData.productName) return alert('Enter product name');
    if (!formData.brand) return alert('Select brand');
    if (!formData.category) return alert('Select category');
    if (!formData.subCategory) return alert('Select sub category');

    setLoading(true);
    const token = localStorage.getItem('adminToken');
    if (!token) { alert('Session expired'); setLoading(false); return; }

    const totalStock = variations.reduce((sum, v) => sum + (v.stock || 0), 0);
    const finalSku = formData.sku || generateSKU();

    const productData = {
      name: formData.productName, 
      brand: formData.brand, 
      category: formData.subCategory,
      mainCategory: formData.category, 
      price: parseFloat(formData.sellingPrice),
      originalPrice: parseFloat(formData.mrp) || parseFloat(formData.sellingPrice) * 1.2,
      tax: parseFloat(formData.tax) || 18, 
      stock: totalStock > 0 ? totalStock : (formData.stock || 10), 
      sku: finalSku,
      images: formData.images, 
      description: formData.fullDescription, 
      keyFeatures: formData.keyFeatures,
      skinType: formData.skinType, 
      concerns: formData.concerns, 
      ingredients: formData.ingredients,
      finish: formData.finish, 
      coverage: formData.coverage, 
      shade: formData.shade,
      hairType: formData.hairType, 
      hairConcerns: formData.hairConcerns, 
      fabric: formData.fabric,
      material: formData.material, 
      gender: formData.gender, 
      weight: formData.weight,
      dimensions: formData.dimensions, 
      variations: variations, 
      hasVariations: variations.length > 0,
      metaTitle: seoData.metaTitle, 
      metaDescription: seoData.metaDescription,
      metaKeywords: seoData.metaKeywords, 
      slug: seoData.slug,
      status: 'active', 
      adminApproved: true, 
      isNew: true, 
      rating: 4.0
    };

    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(productData)
      });
      if (!response.ok) throw new Error('Failed');
      alert('🎉 Product added successfully!');
      navigate('/admin/inventory');
    } catch (error) { alert(`❌ ${error.message}`); }
    finally { setLoading(false); }
  };

  const goToNextStep = () => {
    if (step === 1) {
      if (!formData.productName) return alert('Enter product name');
      if (!formData.brand) return alert('Select brand');
      if (!formData.category) return alert('Select category');
      if (!formData.subCategory) return alert('Select sub category');
    }
    if (step === 2 && !formData.images.length) return alert('Upload at least one image');
    if (step === 3 && !formData.sellingPrice) return alert('Enter selling price');
    setStep(step + 1);
    window.scrollTo({ top: 0 });
  };

  const IconBack = () => (<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>);
  const IconUpload = () => (<svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>);
  const IconPlus = () => (<svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);

  const currentSubCategories = getCurrentSubCategories();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50/30">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-pink-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link to="/admin/inventory" className="text-gray-500 hover:text-pink-600 transition p-1"><IconBack /></Link>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Add New Product</h1>
                <p className="text-xs text-gray-400 hidden sm:block">Amazon-style product listing with SEO</p>
              </div>
            </div>
            <button onClick={submitProduct} disabled={loading} className="w-full sm:w-auto bg-gradient-to-r from-pink-600 to-rose-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm font-medium hover:shadow-md transition disabled:opacity-50">
              {loading ? 'Saving...' : 'Save & Publish'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-3 sm:p-4 mb-6 overflow-x-auto">
          <div className="flex justify-between min-w-[300px] sm:min-w-[500px]">
            {['Basic', 'Images', 'Pricing', 'Details', 'SEO'].map((label, idx) => (
              <div key={idx} className="flex items-center">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${step >= idx + 1 ? 'bg-pink-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                  {step > idx + 1 ? '✓' : idx + 1}
                </div>
                <span className={`text-[10px] sm:text-xs ml-1.5 sm:ml-2 hidden xs:inline ${step >= idx + 1 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-1 sm:gap-2 border-b border-pink-100">
            <button onClick={() => setActiveTab('manual')} className={`px-3 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base font-medium rounded-t-lg transition-all ${activeTab === 'manual' ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>✏️ Manual Entry</button>
            <button onClick={() => setActiveTab('import')} className={`px-3 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base font-medium rounded-t-lg transition-all ${activeTab === 'import' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>📦 Import from Amazon</button>
          </div>
        </div>

        {/* Amazon Importer */}
        {activeTab === 'import' && <AmazonImporter onProductImported={() => setActiveTab('manual')} setFormData={setFormData} setVariations={setVariations} setImages={setImages} />}

        {/* ========== STEP 1 - BASIC INFORMATION ========== */}
        {activeTab === 'manual' && step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-5">📋 Basic Information</h2>
            <div className="space-y-4 sm:space-y-5">
              
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.productName} 
                  onChange={(e) => setFormData({...formData, productName: e.target.value})} 
                  className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" 
                  placeholder="e.g., Vitamin C Serum with Hyaluronic Acid"
                />
              </div>
              
              {/* Brand Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Type brand name..." 
                    value={formData.brand}
                    onChange={(e) => {
                      setFormData({...formData, brand: e.target.value});
                      setBrandSearch(e.target.value);
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm"
                  />
                  {brandSearch && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg max-h-48 overflow-y-auto shadow-lg">
                      {filteredBrands.slice(0, 10).map(b => (
                        <button 
                          key={b} 
                          type="button"
                          onClick={() => { 
                            setFormData({...formData, brand: b}); 
                            setBrandSearch(''); 
                          }} 
                          className="w-full text-left px-3 sm:px-4 py-2 hover:bg-pink-50 text-sm transition"
                        >
                          {b}
                        </button>
                      ))}
                      <button 
                        type="button"
                        onClick={() => setShowAddBrand(true)} 
                        className="w-full text-left px-3 sm:px-4 py-2 text-pink-600 text-sm hover:bg-pink-50 transition border-t font-medium"
                      >
                        + Add new brand "{brandSearch}"
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Category and Sub Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => { 
                      setFormData({...formData, category: e.target.value, subCategory: ''}); 
                      setShowAddSubCategory(false); 
                    }} 
                    className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm bg-white"
                  >
                    <option value="">Select Category</option>
                    {Object.keys(subCategoriesOptions).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sub Category <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <select 
                      value={formData.subCategory} 
                      onChange={(e) => setFormData({...formData, subCategory: e.target.value})} 
                      className="flex-1 border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm disabled:bg-gray-100 bg-white" 
                      disabled={!formData.category}
                    >
                      <option value="">Select Sub Category</option>
                      {currentSubCategories.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {formData.category && (
                      <button 
                        onClick={() => setShowAddSubCategory(true)} 
                        className="px-3 py-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition text-sm whitespace-nowrap"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SKU and Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={formData.sku} 
                      onChange={(e) => setFormData({...formData, sku: e.target.value})} 
                      className="flex-1 border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" 
                      placeholder="Auto-generated" 
                    />
                    <button 
                      onClick={() => setFormData({...formData, sku: generateSKU()})} 
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm whitespace-nowrap"
                    >
                      🔄 Generate
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight / Dimensions</label>
                  <input 
                    type="text" 
                    value={formData.weight} 
                    onChange={(e) => setFormData({...formData, weight: e.target.value})} 
                    className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" 
                    placeholder="e.g., 250g" 
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={goToNextStep} className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium hover:shadow-md transition text-sm">Continue →</button>
            </div>
          </div>
        )}

        {/* Add Brand Modal */}
        {showAddBrand && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddBrand(false)}>
            <div className="bg-white rounded-xl max-w-md w-full shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 sm:p-5 border-b border-gray-200"><h3 className="font-semibold text-gray-800">Add New Brand</h3></div>
              <div className="p-4 sm:p-5">
                <input type="text" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="Enter brand name" className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" autoFocus />
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowAddBrand(false)} className="flex-1 px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm">Cancel</button>
                  <button onClick={handleAddNewBrand} className="flex-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:shadow-md transition text-sm">Add Brand</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Sub Category Modal */}
        {showAddSubCategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddSubCategory(false)}>
            <div className="bg-white rounded-xl max-w-md w-full shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 sm:p-5 border-b border-gray-200"><h3 className="font-semibold text-gray-800">Add New Sub-Category</h3><p className="text-xs text-gray-500 mt-1">For: {formData.category}</p></div>
              <div className="p-4 sm:p-5">
                <input type="text" value={newSubCategory} onChange={(e) => setNewSubCategory(e.target.value)} placeholder={`Enter ${formData.category} sub-category`} className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" autoFocus />
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowAddSubCategory(false)} className="flex-1 px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm">Cancel</button>
                  <button onClick={handleAddNewSubCategory} className="flex-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:shadow-md transition text-sm">Add Sub-Category</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 - Images */}
        {activeTab === 'manual' && step === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-5">📸 Product Images</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-pink-400 transition">
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 justify-center">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                    <img src={img} className="w-full h-full object-cover" alt="Product" />
                    <button onClick={() => removeImage(idx)} className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600">✕</button>
                  </div>
                ))}
              </div>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="imageUpload" />
              <label htmlFor="imageUpload" className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border-2 border-pink-200 rounded-lg cursor-pointer text-pink-600 hover:bg-pink-50 transition text-sm font-medium"><IconUpload /> {uploadingImages ? 'Uploading...' : 'Choose Images'}</label>
              <p className="text-xs text-gray-400 mt-3">Upload up to 5 images (max 5MB each)</p>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
              <button onClick={() => setStep(1)} className="px-5 sm:px-6 py-2 sm:py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm">← Back</button>
              <button onClick={goToNextStep} className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium hover:shadow-md transition text-sm">Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3 - Pricing */}
        {activeTab === 'manual' && step === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-5">💰 Pricing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">MRP</label><input type="number" value={formData.mrp} onChange={(e) => setFormData({...formData, mrp: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" placeholder="₹ 999" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Selling Price <span className="text-red-500">*</span></label><input type="number" value={formData.sellingPrice} onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" placeholder="₹ 499" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Tax (GST) %</label><input type="number" value={formData.tax} onChange={(e) => setFormData({...formData, tax: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" /></div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
              <button onClick={() => setStep(2)} className="px-5 sm:px-6 py-2 sm:py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm">← Back</button>
              <button onClick={goToNextStep} className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium hover:shadow-md transition text-sm">Continue →</button>
            </div>
          </div>
        )}

        {/* Step 4 - Product Details */}
        {activeTab === 'manual' && step === 4 && (
          <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-5">✨ Product Details</h2>
            
            {/* About this item - Unlimited bullet points */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">About this item <span className="text-xs text-gray-400 ml-2">(Bullet points)</span></label>
              <div className="space-y-2 mb-3 max-h-96 overflow-y-auto">
                {formData.fullDescription.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-100">
                    <span className="text-pink-500 font-bold mt-0.5 text-base sm:text-lg">•</span>
                    <span className="flex-1 text-xs sm:text-sm text-gray-700 break-words">{bullet}</span>
                    <button onClick={() => removeBulletPoint(idx)} className="text-red-400 hover:text-red-600 px-2 text-sm">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" value={currentBullet} onChange={(e) => setCurrentBullet(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addBulletPoint()} placeholder="e.g., Dermatologically tested" className="flex-1 border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" />
                <button onClick={addBulletPoint} className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:shadow-md transition flex items-center justify-center gap-1 text-sm font-medium"><IconPlus /> Add</button>
              </div>
            </div>

            {/* Product Highlights */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Highlights <span className="text-xs text-gray-400 ml-2">(Max 10)</span></label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.keyFeatures.map((f, i) => <span key={i} className="bg-green-50 text-green-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1 border border-green-200">✓ {f}<button onClick={() => removeKeyFeature(i)} className="text-red-400 ml-1">×</button></span>)}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" value={keyFeature} onChange={(e) => setKeyFeature(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addKeyFeature()} placeholder="e.g., 100% Vegan" className="flex-1 border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-pink-400 text-sm" />
                <button onClick={addKeyFeature} className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">Add</button>
              </div>
            </div>

            {/* Variations Section - FIXED */}
            <div className="border-t border-gray-200 pt-4 sm:pt-5 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">Product Variations</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {!formData.category && 'Select a category first'}
                    {formData.category === 'Skincare' && 'Add different sizes (ml/gm) and variants'}
                    {formData.category === 'Makeup' && 'Add different shades and finishes'}
                    {formData.category === 'Hair' && 'Add different sizes and variants'}
                    {formData.category === 'Clothing' && 'Add different sizes and colors'}
                    {formData.category === 'Accessories' && 'Add different sizes and colors'}
                  </p>
                </div>
                {formData.category && (
                  <button
                    onClick={() => {
                      setEditingVariation(null);
                      setVariationForm({ name: '', price: '', mrp: '', stock: '', sku: '', attributes: {} });
                      setVariationModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg text-sm font-medium hover:shadow-md transition"
                  >
                    + Add {variationAttrs.type}
                  </button>
                )}
              </div>
              
              {!formData.category ? (
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-yellow-700 text-sm">Select a category first</p>
                </div>
              ) : variations.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-400 text-sm">No variations added yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-600">{variationAttrs.type}</th>
                        {variationAttrs.secondary && <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-600">{variationAttrs.secondary}</th>}
                        <th className="px-2 sm:px-3 py-2 text-right font-medium text-gray-600">Price</th>
                        <th className="px-2 sm:px-3 py-2 text-right font-medium text-gray-600">MRP</th>
                        <th className="px-2 sm:px-3 py-2 text-right font-medium text-gray-600">Stock</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium text-gray-600">SKU</th>
                        <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {variations.map((variation) => (
                        <tr key={variation.id} className="hover:bg-pink-50/30">
                          <td className="px-2 sm:px-3 py-2 font-medium text-gray-800">{variation.name}</td>
                          {variationAttrs.secondary && <td className="px-2 sm:px-3 py-2 text-gray-600">{variation.secondaryName || '-'}</td>}
                          <td className="px-2 sm:px-3 py-2 text-right font-medium text-pink-600">₹{variation.price}</td>
                          <td className="px-2 sm:px-3 py-2 text-right text-gray-500 line-through">₹{variation.mrp || variation.price * 1.2}</td>
                          <td className="px-2 sm:px-3 py-2 text-right text-gray-700">{variation.stock}</td>
                          <td className="px-2 sm:px-3 py-2 text-xs text-gray-500 font-mono">{variation.sku}</td>
                          <td className="px-2 sm:px-3 py-2 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => editVariation(variation)} className="text-blue-500 hover:text-blue-700 text-sm">✏️</button>
                              <button onClick={() => deleteVariation(variation.id)} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td className="px-2 sm:px-3 py-2 font-medium text-gray-800">Total</td>
                        {variationAttrs.secondary && <td className="px-2 sm:px-3 py-2"></td>}
                        <td className="px-2 sm:px-3 py-2 text-right font-bold text-pink-600">₹{variations.reduce((s, v) => s + v.price, 0)}</td>
                        <td className="px-2 sm:px-3 py-2 text-right"></td>
                        <td className="px-2 sm:px-3 py-2 text-right font-bold text-gray-800">{variations.reduce((s, v) => s + v.stock, 0)}</td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Variation Modal */}
            {variationModalOpen && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setVariationModalOpen(false)}>
                <div className="bg-white rounded-xl max-w-md w-full shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
                  <div className="border-b border-gray-200 p-4 sm:p-5 flex justify-between">
                    <h3 className="text-base sm:text-lg font-semibold">{editingVariation ? 'Edit' : 'Add New'} {variationAttrs.type}</h3>
                    <button onClick={() => setVariationModalOpen(false)} className="text-gray-400 text-2xl">×</button>
                  </div>
                  
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Primary Option with Custom */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">{variationAttrs.type} *</label>
                      <div className="flex gap-2">
                        <select 
                          value={variationForm.name} 
                          onChange={(e) => {
                            if (e.target.value === 'Custom') {
                              const customValue = prompt(`Enter custom ${variationAttrs.type}:`);
                              if (customValue) setVariationForm({...variationForm, name: customValue});
                            } else {
                              setVariationForm({...variationForm, name: e.target.value});
                            }
                          }} 
                          className="flex-1 border rounded-lg px-3 py-2 text-sm bg-white"
                        >
                          <option value="">Select {variationAttrs.type}</option>
                          {variationAttrs.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                    
                    {/* Secondary Option with Custom */}
                    {variationAttrs.secondary && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">{variationAttrs.secondary}</label>
                        <div className="flex gap-2">
                          <select 
                            value={variationForm.attributes.secondary || ''} 
                            onChange={(e) => {
                              if (e.target.value === 'Custom') {
                                const customValue = prompt(`Enter custom ${variationAttrs.secondary}:`);
                                if (customValue) setVariationForm({...variationForm, attributes: {...variationForm.attributes, secondary: customValue}});
                              } else {
                                setVariationForm({...variationForm, attributes: {...variationForm.attributes, secondary: e.target.value}});
                              }
                            }} 
                            className="flex-1 border rounded-lg px-3 py-2 text-sm bg-white"
                          >
                            <option value="">Select {variationAttrs.secondary}</option>
                            {variationAttrs.secondaryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                    
                    {/* Price, MRP, Stock, SKU */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Selling Price (₹) *</label>
                        <input type="number" value={variationForm.price} onChange={(e) => setVariationForm({...variationForm, price: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="499" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">MRP (₹)</label>
                        <input type="number" value={variationForm.mrp} onChange={(e) => setVariationForm({...variationForm, mrp: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="599" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Stock *</label>
                        <input type="number" value={variationForm.stock} onChange={(e) => setVariationForm({...variationForm, stock: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="10" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">SKU</label>
                        <input type="text" value={variationForm.sku} onChange={(e) => setVariationForm({...variationForm, sku: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Auto-generated" />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <button onClick={() => setVariationModalOpen(false)} className="flex-1 px-3 py-2 border rounded-lg text-gray-700">Cancel</button>
                      <button onClick={saveVariation} className="flex-1 px-3 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-medium">{editingVariation ? 'Update' : 'Add'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category Specific Fields */}
            {formData.category === 'Skincare' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">🧴 Skincare Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Skin Type</label>
                    <select value={formData.skinType} onChange={(e) => setFormData({...formData, skinType: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="all">All</option>
                      <option value="oily">Oily</option>
                      <option value="dry">Dry</option>
                      <option value="combination">Combination</option>
                      <option value="sensitive">Sensitive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Key Ingredients</label>
                    <input type="text" value={formData.ingredients} onChange={(e) => setFormData({...formData, ingredients: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Vitamin C, Hyaluronic Acid" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Concerns</label>
                  <div className="flex flex-wrap gap-2">
                    {skinConcerns.map(c => <label key={c} className="flex items-center gap-1"><input type="checkbox" onChange={(e) => { const updated = e.target.checked ? [...formData.concerns, c] : formData.concerns.filter(cn => cn !== c); setFormData({...formData, concerns: updated}); }} /><span className="text-sm">{c}</span></label>)}
                  </div>
                </div>
              </div>
            )}

            {formData.category === 'Makeup' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">💄 Makeup Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Shade</label>
                    <input type="text" value={formData.shade} onChange={(e) => setFormData({...formData, shade: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ruby Red" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Finish</label>
                    <select value={formData.finish} onChange={(e) => setFormData({...formData, finish: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="">Select</option>
                      {makeupFinishes.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Coverage</label>
                  <select value={formData.coverage} onChange={(e) => setFormData({...formData, coverage: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select</option>
                    {makeupCoverage.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            {formData.category === 'Hair' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">💇 Hair Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Hair Type</label>
                    <select value={formData.hairType} onChange={(e) => setFormData({...formData, hairType: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                      {hairTypes.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Concerns</label>
                    <div className="flex flex-wrap gap-2">
                      {hairConcernsList.map(c => <label key={c} className="flex items-center gap-1"><input type="checkbox" onChange={(e) => { const updated = e.target.checked ? [...(formData.hairConcerns || []), c] : (formData.hairConcerns || []).filter(cn => cn !== c); setFormData({...formData, hairConcerns: updated}); }} /><span className="text-sm">{c}</span></label>)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {formData.category === 'Clothing' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">👗 Clothing Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Fabric</label>
                    <input type="text" value={formData.fabric} onChange={(e) => setFormData({...formData, fabric: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Cotton, Silk" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Gender</label>
                    <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="unisex">Unisex</option>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="kids">Kids</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {formData.category === 'Accessories' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">💍 Accessories Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Material</label>
                    <input type="text" value={formData.material} onChange={(e) => setFormData({...formData, material: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Silver, Gold" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Gender</label>
                    <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="unisex">Unisex</option>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="kids">Kids</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6 sm:mt-8 pt-4 border-t">
              <button onClick={() => setStep(3)} className="px-5 sm:px-6 py-2 sm:py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm">← Back</button>
              <button onClick={() => setStep(5)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium hover:shadow-md transition text-sm">Continue to SEO →</button>
            </div>
          </div>
        )}

        {/* Step 5 - SEO Section */}
        {activeTab === 'manual' && step === 5 && (
          <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">🔍 SEO Optimization</h2>
            <p className="text-sm text-gray-500 mb-6">Optimize your product for search engines</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product URL Slug</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500">mypinkshop.com/product/</span>
                  <code className="text-sm text-pink-600">{seoData.slug || 'product-slug'}</code>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Title <span className="text-xs text-gray-400">(50-60 chars)</span></label>
                <input type="text" value={seoData.metaTitle} onChange={(e) => setSeoData({...seoData, metaTitle: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-400">Shows in Google search results</p>
                  <span className={`text-xs ${seoData.metaTitle.length > 60 ? 'text-red-500' : 'text-green-500'}`}>{seoData.metaTitle.length}/60</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Description <span className="text-xs text-gray-400">(150-160 chars)</span></label>
                <textarea value={seoData.metaDescription} onChange={(e) => setSeoData({...seoData, metaDescription: e.target.value})} rows="3" className="w-full border rounded-lg px-3 py-2 text-sm"></textarea>
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-400">Shows below title in Google</p>
                  <span className={`text-xs ${seoData.metaDescription.length > 160 ? 'text-red-500' : 'text-green-500'}`}>{seoData.metaDescription.length}/160</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Keywords</label>
                <input type="text" value={seoData.metaKeywords} onChange={(e) => setSeoData({...seoData, metaKeywords: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="skincare, vitamin c, anti-aging" />
                <p className="text-xs text-gray-400 mt-1">Comma separated keywords</p>
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">📱 Google Search Preview</h3>
                <div>
                  <p className="text-blue-600 text-base font-medium">{seoData.metaTitle || formData.productName || 'Product Title'}</p>
                  <p className="text-green-700 text-xs">https://mypinkshop.com/product/{seoData.slug || 'product-slug'}</p>
                  <p className="text-gray-600 text-sm mt-1">{seoData.metaDescription || 'Product description...'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-4 border-t">
              <button onClick={() => setStep(4)} className="px-5 sm:px-6 py-2 sm:py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm">← Back to Details</button>
              <button onClick={submitProduct} disabled={loading} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium hover:shadow-md disabled:opacity-50 text-sm">{loading ? 'Saving...' : '✓ Publish Product'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAddProduct;
