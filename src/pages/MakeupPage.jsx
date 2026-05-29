import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

// Product Card Component
const ProductCard = ({ product, addToCart, isInWishlist, addToWishlist, removeFromWishlist }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-pink-100">
      <Link to={`/product/${product.id}`}>
        <div className="relative h-48 sm:h-52 md:h-60 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {product.images && product.images[0] && !imgError ? (
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl sm:text-6xl">
              {product.emoji || '💄'}
            </div>
          )}
          {product.badge && (
            <span className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-2 py-1 rounded-full shadow-md">
              {product.badge}
            </span>
          )}
          {product.isNew && (
            <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs px-2 py-1 rounded-full shadow-md">
              NEW
            </span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1 hover:text-pink-500 transition">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-400 mb-2">{product.brand || 'MyPinkShop'}</p>
        <div className="flex items-center gap-1 mb-2">
          <div className="flex text-yellow-400 text-sm">
            {'★'.repeat(Math.floor(product.rating || 4))}
            {'☆'.repeat(5 - Math.floor(product.rating || 4))}
          </div>
          <span className="text-xs text-gray-400">({product.rating || 4})</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-pink-600">₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <>
              <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
              <span className="text-xs text-green-500">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
              </span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleAddToCart} 
            className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            {isAdded ? 'Added! ✓' : 'Add to Cart'}
          </button>
          <button 
            onClick={handleWishlistToggle} 
            className="w-10 py-2 border border-pink-200 rounded-full text-center hover:bg-pink-50 transition"
          >
            {isInWishlist(product.id) ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ MAKEUP SUBCATEGORIES - As requested
const makeupCategories = [
  // Face
  { id: 'facePrimer', name: 'Face Primer', icon: '🧴', mainCat: 'Face' },
  { id: 'concealer', name: 'Concealer', icon: '🎨', mainCat: 'Face' },
  { id: 'foundation', name: 'Foundation', icon: '🧴', mainCat: 'Face' },
  { id: 'compact', name: 'Compact', icon: '🔘', mainCat: 'Face' },
  { id: 'contour', name: 'Contour', icon: '📐', mainCat: 'Face' },
  { id: 'loosePowder', name: 'Loose Powder', icon: '⚪', mainCat: 'Face' },
  { id: 'tintedMoisturizer', name: 'Tinted Moisturizer', icon: '💧', mainCat: 'Face' },
  { id: 'blush', name: 'Blush', icon: '🌸', mainCat: 'Face' },
  { id: 'bronzer', name: 'Bronzer', icon: '☀️', mainCat: 'Face' },
  { id: 'bbCcCream', name: 'BB & CC Cream', icon: '🧴', mainCat: 'Face' },
  { id: 'highlighter', name: 'Highlighter', icon: '✨', mainCat: 'Face' },
  { id: 'settingSpray', name: 'Setting Spray', icon: '💨', mainCat: 'Face' },
  { id: 'makeupRemover', name: 'Makeup Remover', icon: '🧼', mainCat: 'Face' },
  { id: 'sindoor', name: 'Sindoor', icon: '🔴', mainCat: 'Face' },
  
  // Eyes
  { id: 'kajal', name: 'Kajal', icon: '✏️', mainCat: 'Eyes' },
  { id: 'eyeliner', name: 'Eyeliner', icon: '📏', mainCat: 'Eyes' },
  { id: 'mascara', name: 'Mascara', icon: '👁️‍🗨️', mainCat: 'Eyes' },
  { id: 'eyeshadow', name: 'Eye Shadow', icon: '🎨', mainCat: 'Eyes' },
  { id: 'eyebrowEnhancer', name: 'Eye Brow Enhancers', icon: '✏️', mainCat: 'Eyes' },
  { id: 'eyePrimer', name: 'Eye Primer', icon: '🧴', mainCat: 'Eyes' },
  { id: 'falseLashes', name: 'False Eyelashes', icon: '👁️', mainCat: 'Eyes' },
  { id: 'eyeMakeupRemover', name: 'Eye Makeup Remover', icon: '💧', mainCat: 'Eyes' },
  { id: 'underEyeConcealer', name: 'Under Eye Concealer', icon: '👁️', mainCat: 'Eyes' },
  { id: 'contactLenses', name: 'Contact Lenses', icon: '👀', mainCat: 'Eyes' },
  
  // Lips
  { id: 'lipstick', name: 'Lipstick', icon: '💄', mainCat: 'Lips' },
  { id: 'liquidLipstick', name: 'Liquid Lipstick', icon: '💧', mainCat: 'Lips' },
  { id: 'lipCrayon', name: 'Lip Crayon', icon: '🖍️', mainCat: 'Lips' },
  { id: 'lipGloss', name: 'Lip Gloss', icon: '✨', mainCat: 'Lips' },
  { id: 'lipLiner', name: 'Lip Liner', icon: '📏', mainCat: 'Lips' },
  { id: 'lipPlumper', name: 'Lip Plumper', icon: '👄', mainCat: 'Lips' },
  { id: 'lipTint', name: 'Lip Tint', icon: '🎨', mainCat: 'Lips' },
  
  // Nails
  { id: 'nailPolish', name: 'Nail Polish', icon: '💅', mainCat: 'Nails' },
  { id: 'nailArtKits', name: 'Nail Art Kits', icon: '🎨', mainCat: 'Nails' },
  { id: 'nailCare', name: 'Nail Care', icon: '💅', mainCat: 'Nails' },
  { id: 'nailPolishRemover', name: 'Nail Polish Remover', icon: '💧', mainCat: 'Nails' },
  
  // Makeup Kits & Combos
  { id: 'makeupKits', name: 'Makeup Kits', icon: '🎁', mainCat: 'Kits & Combos' },
  { id: 'makeupCombos', name: 'Makeup Combos', icon: '📦', mainCat: 'Kits & Combos' },
  
  // Tools & Brushes
  { id: 'faceBrush', name: 'Face Brush', icon: '🖌️', mainCat: 'Tools & Brushes' },
  { id: 'eyeBrush', name: 'Eye Brush', icon: '🖌️', mainCat: 'Tools & Brushes' },
  { id: 'lipBrush', name: 'Lip Brush', icon: '🖌️', mainCat: 'Tools & Brushes' },
  { id: 'brushSets', name: 'Brush Sets', icon: '🎨', mainCat: 'Tools & Brushes' },
  { id: 'brushCleaners', name: 'Brush Cleaners', icon: '🧼', mainCat: 'Tools & Brushes' },
  { id: 'sponges', name: 'Sponges & Applicators', icon: '🧽', mainCat: 'Tools & Brushes' },
  { id: 'eyelashCurlers', name: 'Eyelash Curlers', icon: '🔧', mainCat: 'Tools & Brushes' },
  { id: 'tweezers', name: 'Tweezers', icon: '🔧', mainCat: 'Tools & Brushes' },
  { id: 'sharpeners', name: 'Sharpeners', icon: '✏️', mainCat: 'Tools & Brushes' },
  { id: 'mirrors', name: 'Mirrors', icon: '🪞', mainCat: 'Tools & Brushes' },
  { id: 'makeupPouches', name: 'Makeup Pouches', icon: '👜', mainCat: 'Tools & Brushes' },
  { id: 'multiPalettes', name: 'Multi-Functional Palettes', icon: '🎨', mainCat: 'Tools & Brushes' },
];

// Top Brands
const topBrands = [
  { id: 'kayBeauty', name: 'Kay Beauty', icon: 'K', color: 'from-pink-400 to-rose-400' },
  { id: 'hudaBeauty', name: 'Huda Beauty', icon: 'H', color: 'from-purple-400 to-pink-400' },
  { id: 'charlotteTilbury', name: 'Charlotte Tilbury', icon: 'C', color: 'from-gold-400 to-amber-400' },
  { id: 'mac', name: 'M.A.C', icon: 'M', color: 'from-gray-700 to-gray-900' },
  { id: 'maybelline', name: 'Maybelline New York', icon: 'M', color: 'from-yellow-400 to-orange-400' },
  { id: 'loreal', name: 'L\'Oreal Paris', icon: 'L', color: 'from-red-500 to-pink-500' },
  { id: 'lakme', name: 'Lakme', icon: 'L', color: 'from-blue-400 to-purple-400' },
  { id: 'nykaa', name: 'Nykaa Cosmetics', icon: 'N', color: 'from-pink-500 to-rose-500' },
  { id: 'nyx', name: 'Nyx Pro.Makeup', icon: 'N', color: 'from-black to-gray-700' },
];

// Finish Types
const finishTypes = ['Matte', 'Glossy', 'Shimmer', 'Satin', 'Dewy', 'Metallic'];

// Coverage Types
const coverageTypes = ['Light', 'Medium', 'Full', 'Sheer'];

function MakeupPage() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcat, setSelectedSubcat] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedFinish, setSelectedFinish] = useState('all');
  const [selectedCoverage, setSelectedCoverage] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [activeMainCat, setActiveMainCat] = useState('all');
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' or 'brands'

  // Get unique main categories for grouping
  const mainCategories = ['all', ...new Set(makeupCategories.map(c => c.mainCat))];

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const makeupProducts = storedProducts.filter(p => 
      p.adminApproved === true && 
      p.status === 'active' && 
      p.category === 'makeup'
    );
    setProducts(makeupProducts);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSubcat !== 'all') {
      filtered = filtered.filter(p => p.subcategory === selectedSubcat);
    }

    if (selectedBrand !== 'all') {
      filtered = filtered.filter(p => p.brand === selectedBrand);
    }

    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : Infinity;
    filtered = filtered.filter(p => p.price >= min && p.price <= max);

    if (selectedFinish !== 'all') {
      filtered = filtered.filter(p => p.finish === selectedFinish);
    }

    if (selectedCoverage !== 'all') {
      filtered = filtered.filter(p => p.coverage === selectedCoverage);
    }

    switch(sortBy) {
      case 'price_low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price_high': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest': filtered.sort((a, b) => (b.id || 0) - (a.id || 0)); break;
      default: break;
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedSubcat, selectedBrand, minPrice, maxPrice, selectedFinish, selectedCoverage, sortBy, products]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSubcat('all');
    setSelectedBrand('all');
    setMinPrice('');
    setMaxPrice('');
    setSelectedFinish('all');
    setSelectedCoverage('all');
    setSortBy('default');
    setActiveMainCat('all');
  };

  // Get filtered subcategories by main category
  const getFilteredSubcategories = () => {
    if (activeMainCat === 'all') return makeupCategories;
    return makeupCategories.filter(c => c.mainCat === activeMainCat);
  };

  const getCategoryDisplayName = (catId) => {
    const cat = makeupCategories.find(c => c.id === catId);
    return cat ? cat.name : catId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium">
        <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
          <span>✨</span>
          <span>Free Shipping on ₹999+</span>
          <span className="hidden sm:inline">•</span>
          <span>Extra 10% off on first order</span>
          <span className="hidden sm:inline">•</span>
          <span>Cash on Delivery Available</span>
          <span>✨</span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg sm:text-xl">M</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">MyPinkShop</h1>
                <p className="text-[10px] text-gray-400">FOR THE GIRLIES ✨</p>
              </div>
            </Link>

            <div className="flex-1 max-w-md lg:max-w-2xl">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search makeup products, brands, or shades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-5 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 bg-gray-50 text-sm"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => navigate('/wishlist')} className="relative p-2 text-gray-700 hover:text-pink-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4">{wishlistCount}</span>}
              </button>
              <Link to="/cart" className="relative p-2 text-gray-700 hover:text-pink-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4">{cartCount}</span>}
              </Link>
              {user ? <Avatar user={user} onLogout={logout} /> : <Link to="/login" className="p-2 text-gray-700">👤</Link>}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-purple-100 via-pink-100 to-rose-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent mb-3">
            Makeup 💄
          </h1>
          <p className="text-purple-600 text-base sm:text-lg max-w-2xl mx-auto">
            Unleash your inner glam with our premium makeup collection
          </p>
        </div>
      </div>

      {/* Tabs: Categories vs Brands */}
      <div className="border-b border-pink-100 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            <button 
              onClick={() => setActiveTab('categories')} 
              className={`py-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'categories' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-pink-500'}`}
            >
              Categories ✨
            </button>
            <button 
              onClick={() => setActiveTab('brands')} 
              className={`py-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'brands' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-pink-500'}`}
            >
              Top Brands 👑
            </button>
          </div>
        </div>
      </div>

      {/* Categories View */}
      {activeTab === 'categories' && (
        <>
          {/* Main Category Tabs (Face, Eyes, Lips, Nails, etc.) */}
          <div className="bg-white border-b border-pink-100">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex gap-4 overflow-x-auto py-2 scrollbar-hide">
                {mainCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveMainCat(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeMainCat === cat 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' 
                        : 'text-gray-600 hover:text-pink-500'
                    }`}
                  >
                    {cat === 'all' ? 'All Categories' : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subcategories Grid */}
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <button
                onClick={() => setSelectedSubcat('all')}
                className={`border rounded-xl p-3 text-center transition-all ${selectedSubcat === 'all' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'bg-white hover:shadow-md border-pink-100'}`}
              >
                <div className="text-2xl mb-1">📦</div>
                <div className="font-semibold text-sm">All Products</div>
                <div className="text-xs opacity-75">{products.length}</div>
              </button>
              {getFilteredSubcategories().map(cat => {
                const productCount = products.filter(p => p.subcategory === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedSubcat(cat.id)}
                    className={`border rounded-xl p-3 text-center transition-all ${selectedSubcat === cat.id ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'bg-white hover:shadow-md border-pink-100'}`}
                  >
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <div className="font-semibold text-sm">{cat.name}</div>
                    <div className="text-xs opacity-75">{productCount} items</div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Brands View */}
      {activeTab === 'brands' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topBrands.map(brand => {
              const productCount = products.filter(p => p.brand === brand.name).length;
              return (
                <button
                  key={brand.id}
                  onClick={() => setSelectedBrand(selectedBrand === brand.name ? 'all' : brand.name)}
                  className={`border rounded-2xl p-4 text-center transition-all ${selectedBrand === brand.name ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'bg-white hover:shadow-md border-pink-100'}`}
                >
                  <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-r ${brand.color} flex items-center justify-center text-white font-bold text-lg mb-2 shadow-md`}>
                    {brand.icon}
                  </div>
                  <div className="font-semibold text-sm">{brand.name}</div>
                  <div className="text-xs opacity-75">{productCount} products</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-500 hover:text-pink-500">Home</Link>
          <span className="text-gray-400">/</span>
          <span className="text-pink-600 font-medium">Makeup</span>
          {selectedSubcat !== 'all' && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{getCategoryDisplayName(selectedSubcat)}</span>
            </>
          )}
          {selectedBrand !== 'all' && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{selectedBrand}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        
        {/* Mobile Filter Button */}
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className="md:hidden w-full bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl py-3 mb-4 flex items-center justify-center gap-2 text-gray-700 font-medium shadow-sm"
        >
          <span>🔽</span> Filters & Sorting
        </button>

        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Left Sidebar - Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block md:w-80 space-y-5`}>
            
            {/* Price Range */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-pink-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-pink-500">💰</span> Price Range
              </h3>
              <div className="flex gap-3">
                <input 
                  type="number" 
                  placeholder="Min ₹" 
                  value={minPrice} 
                  onChange={(e) => setMinPrice(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500"
                />
                <input 
                  type="number" 
                  placeholder="Max ₹" 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Finish Type */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-pink-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-pink-500">✨</span> Finish
              </h3>
              <div className="flex flex-wrap gap-2">
                {finishTypes.map(finish => (
                  <button
                    key={finish}
                    onClick={() => setSelectedFinish(selectedFinish === finish ? 'all' : finish)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedFinish === finish 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-pink-100'
                    }`}
                  >
                    {finish}
                  </button>
                ))}
              </div>
            </div>

            {/* Coverage */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-pink-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-pink-500">🎨</span> Coverage
              </h3>
              <div className="flex flex-wrap gap-2">
                {coverageTypes.map(coverage => (
                  <button
                    key={coverage}
                    onClick={() => setSelectedCoverage(selectedCoverage === coverage ? 'all' : coverage)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedCoverage === coverage 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-pink-100'
                    }`}
                  >
                    {coverage}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters Button */}
            <button 
              onClick={clearFilters} 
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-2xl text-sm font-medium hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              Clear All Filters ✨
            </button>
          </div>

          {/* Right Section - Products */}
          <div className="flex-1">
            
            {/* Sort and Count Bar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-6 flex flex-wrap justify-between items-center gap-3 border border-pink-100 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Showing</span>
                <span className="font-semibold text-pink-600">{filteredProducts.length}</span>
                <span className="text-sm text-gray-500">of {products.length} products</span>
              </div>
              
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-white"
              >
                <option value="default">Sort by: Default</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Rating: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
            
            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-pink-100">
                <div className="text-7xl mb-4">💄</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No makeup products found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters or search term</p>
                <button onClick={clearFilters} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    addToCart={addToCart}
                    isInWishlist={isInWishlist}
                    addToWishlist={addToWishlist}
                    removeFromWishlist={removeFromWishlist}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 sm:py-16 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <h3 className="font-bold text-white text-lg">MyPinkShop</h3>
              </div>
              <p className="text-sm">Luxury beauty and makeup for the modern woman.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/skincare" className="hover:text-pink-500 transition">Skincare</Link></li>
                <li><Link to="/makeup" className="hover:text-pink-500 transition">Makeup</Link></li>
                <li><Link to="/clothing" className="hover:text-pink-500 transition">Clothing</Link></li>
                <li><Link to="/accessories" className="hover:text-pink-500 transition">Accessories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-pink-500 transition">Contact Us</Link></li>
                <li><Link to="/faqs" className="hover:text-pink-500 transition">FAQs</Link></li>
                <li><Link to="/shipping" className="hover:text-pink-500 transition">Shipping Info</Link></li>
                <li><Link to="/returns" className="hover:text-pink-500 transition">Returns Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Follow Us</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-pink-500 transition">Instagram</a></li>
                <li><a href="#" className="hover:text-pink-500 transition">TikTok</a></li>
                <li><a href="#" className="hover:text-pink-500 transition">Pinterest</a></li>
                <li><a href="#" className="hover:text-pink-500 transition">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-gray-800">
            <p className="text-sm">© 2026 MyPinkShop. All rights reserved.</p>
            <p className="text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
          </div>
        </div>
      </footer>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default MakeupPage;
