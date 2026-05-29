import { useState, useEffect } from 'react';
import { Link, useNavigate }react-router-dom';
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
              {product.emoji || '🧴'}
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
          {product.discount && (
            <span className="absolute bottom-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {product.discount}% OFF
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

// ✅ REAL SUBCATEGORIES - From your screenshot
const skincareSubcategories = [
  { id: 'moisturizers', name: 'Moisturizers', icon: '💧', subItems: ['Face Moisturizer & Day Cream', 'Night Cream', 'Face Oils', 'All Purpose Gels/Creams'] },
  { id: 'serums', name: 'Serums', icon: '✨', subItems: ['Serums & Essence'] },
  { id: 'cleansers', name: 'Cleansers', icon: '🧼', subItems: ['Face Wash', 'Cleanser', 'Micellar Water', 'Face Wipes', 'Makeup Remover', 'Scrubs & Exfoliators'] },
  { id: 'masks', name: 'Masks', icon: '🎭', subItems: ['Sheet Masks', 'Sleeping Masks', 'Masks & Peels', 'Face Packs', 'Face Bleach'] },
  { id: 'toners', name: 'Toners & Mists', icon: '💨', subItems: ['Toners & Mists', 'Rose Water'] },
  { id: 'bodyCare', name: 'Body Care', icon: '🧴', subItems: ['Lotions & Creams', 'Body Butter', 'Massage Oils', 'Shower Gels & Body Wash', 'Soaps', 'Scrubs & Loofahs', 'Bath Salts'] },
  { id: 'handsFeet', name: 'Hands & Feet', icon: '🖐️', subItems: ['Hand Creams', 'Foot Creams', 'Hand & Foot Masks'] },
  { id: 'specialised', name: 'Specialised Skincare', icon: '🔬', subItems: ['Acne Spot Correctors', 'Nose Strips', 'Facial Peels'] },
  { id: 'eyeCare', name: 'Eye Care', icon: '👁️', subItems: ['Under Eye Cream & Serums', 'Eye Masks'] },
  { id: 'lipCare', name: 'Lip Care', icon: '💋', subItems: ['Lip Balm', 'Lip Scrubs', 'Lip Masks'] },
  { id: 'sunCare', name: 'Sun Care', icon: '☀️', subItems: ['Face Sunscreen', 'Body Sunscreen'] },
  { id: 'kits', name: 'Kits & Combos', icon: '🎁', subItems: ['Facial Kits', 'Combos @ Nykaa', 'Gift Sets'] },
  { id: 'skinTools', name: 'Skin Tools', icon: '🔧', subItems: ['Face Massagers', 'Cleansing Brushes', 'Blackhead Remover', 'Dermarollers'] },
  { id: 'supplements', name: 'Skin Supplements', icon: '💊', subItems: ['Vitamins & Minerals', 'Ayurvedic Herbs'] },
  { id: 'korean', name: 'Korean Beauty', icon: '🇰🇷', subItems: ['K-Beauty Essence', 'Snail Mucin', 'Rice Toners'] },
  { id: 'neckCare', name: 'Neck Creams', icon: '🦒', subItems: ['Firming Neck Creams', 'Anti-Aging Neck Serums'] },
];

// Shop by Concerns - From your screenshot
const skinConcerns = [
  { id: 'acne', name: 'Acne', icon: '🔴' },
  { id: 'dullSkin', name: 'Dull Skin', icon: '😴' },
  { id: 'pigmentation', name: 'Pigmentation', icon: '🎨' },
  { id: 'wrinkles', name: 'Wrinkles & Fine Lines', icon: '📉' },
  { id: 'pores', name: 'Pores', icon: '🔘' },
  { id: 'darkSpots', name: 'Dark Spots', icon: '⚫' },
  { id: 'faceTan', name: 'Face Tan', icon: '☀️' },
  { id: 'oilControl', name: 'Oil Control', icon: '💧' },
];

// Trending Searches - From your screenshot
const trendingSearches = [
  'Toners Under 1000',
  'Face Wash For Oily Skin',
  'Moisturizers',
  'Lip Balm Under 500',
  'Vitamin C Serum',
];

function SkincarePage() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcat, setSelectedSubcat] = useState('all');
  const [selectedConcern, setSelectedConcern] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedSkinType, setSelectedSkinType] = useState('all');
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' or 'concerns'

  // Load real products from localStorage or initialize with sample data
  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    
    // Filter only skincare products that are approved
    const skincareProducts = storedProducts.filter(p => 
      p.adminApproved === true && 
      p.status === 'active' && 
      p.category === 'skincare'
    );
    
    setProducts(skincareProducts);
    setLoading(false);
  }, []);

  // Apply all filters
  useEffect(() => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Subcategory filter
    if (selectedSubcat !== 'all') {
      filtered = filtered.filter(p => p.subcategory === selectedSubcat);
    }

    // Concern filter
    if (selectedConcern !== 'all') {
      filtered = filtered.filter(p => p.skinConcerns?.includes(selectedConcern));
    }

    // Price filter
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : Infinity;
    filtered = filtered.filter(p => p.price >= min && p.price <= max);

    // Skin type filter
    if (selectedSkinType !== 'all') {
      filtered = filtered.filter(p => p.skinType === selectedSkinType || p.skinType === 'all');
    }

    // Rating filter
    if (selectedRating > 0) {
      filtered = filtered.filter(p => (p.rating || 4) >= selectedRating);
    }

    // Sorting
    switch(sortBy) {
      case 'price_low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price_high': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest': filtered.sort((a, b) => (b.id || 0) - (a.id || 0)); break;
      case 'discount': filtered.sort((a, b) => (b.discount || 0) - (a.discount || 0)); break;
      default: break;
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedSubcat, selectedConcern, minPrice, maxPrice, selectedSkinType, selectedRating, sortBy, products]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSubcat('all');
    setSelectedConcern('all');
    setMinPrice('');
    setMaxPrice('');
    setSelectedSkinType('all');
    setSelectedRating(0);
    setSortBy('default');
  };

  // Get category display name
  const getCategoryDisplayName = (catId) => {
    const cat = skincareSubcategories.find(c => c.id === catId);
    return cat ? cat.name : catId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading skincare products...</p>
        </div>
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
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg sm:text-xl">M</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">MyPinkShop</h1>
                <p className="text-[9px] sm:text-[10px] text-gray-400 tracking-wider">FOR THE GIRLIES ✨</p>
              </div>
            </Link>

            <div className="flex-1 max-w-md lg:max-w-2xl">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search skincare products, brands, or concerns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-gray-50"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => navigate('/wishlist')} className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{wishlistCount}</span>}
              </button>
              
              <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{cartCount}</span>}
              </Link>
              
              {user ? <Avatar user={user} onLogout={logout} /> : 
                <Link to="/login" className="p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              }
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-pink-100 via-rose-100 to-pink-100 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-7xl">🎀</div>
          <div className="absolute bottom-10 right-10 text-7xl">✨</div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pink-800 mb-3">Skincare ✨</h1>
          <p className="text-pink-600 text-base sm:text-lg max-w-2xl mx-auto">Glow up with our curated skincare collection. Clean, cruelty-free, and effective formulas for every skin type.</p>
        </div>
      </div>

      {/* Trending Searches Bar */}
      <div className="bg-white border-b border-pink-100 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">🔥 Trending:</span>
            {trendingSearches.map((trend, idx) => (
              <button
                key={idx}
                onClick={() => setSearchTerm(trend)}
                className="text-sm text-gray-600 hover:text-pink-500 whitespace-nowrap transition-colors"
              >
                {trend}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs for Categories vs Concerns */}
      <div className="border-b border-pink-100 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'categories' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-pink-500'}`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('concerns')}
              className={`py-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'concerns' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-pink-500'}`}
            >
              Shop by Concern
            </button>
          </div>
        </div>
      </div>

      {/* Subcategories Grid or Concerns Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'categories' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <button
              onClick={() => setSelectedSubcat('all')}
              className={`border rounded-xl p-3 text-center transition-all ${selectedSubcat === 'all' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'bg-white hover:shadow-md border-pink-100'}`}
            >
              <div className="text-2xl mb-1">📦</div>
              <div className="font-semibold text-sm">All Products</div>
              <div className="text-xs opacity-75">{products.length}</div>
            </button>
            {skincareSubcategories.map(cat => {
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
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {skinConcerns.map(concern => (
              <button
                key={concern.id}
                onClick={() => setSelectedConcern(selectedConcern === concern.name ? 'all' : concern.name)}
                className={`border rounded-xl p-3 text-center transition-all ${selectedConcern === concern.name ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'bg-white hover:shadow-md border-pink-100'}`}
              >
                <div className="text-2xl mb-1">{concern.icon}</div>
                <div className="font-semibold text-xs">{concern.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-500 hover:text-pink-500">Home</Link>
          <span className="text-gray-400">/</span>
          <span className="text-pink-600 font-medium">Skincare</span>
          {selectedSubcat !== 'all' && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600 capitalize">{getCategoryDisplayName(selectedSubcat)}</span>
            </>
          )}
          {selectedConcern !== 'all' && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{selectedConcern}</span>
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
            
            {/* Skin Type Filter */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-pink-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-pink-500">✨</span> Skin Type
              </h3>
              <div className="space-y-2">
                {['all', 'oily', 'dry', 'combination', 'sensitive'].map(type => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-pink-50 transition">
                    <input 
                      type="radio" 
                      name="skinType" 
                      checked={selectedSkinType === type} 
                      onChange={() => setSelectedSkinType(type)} 
                      className="w-4 h-4 text-pink-500 focus:ring-pink-400"
                    />
                    <span className="text-sm capitalize">{type === 'all' ? 'All Skin Types' : type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
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
              <div className="flex gap-2 mt-3">
                {['500', '1000', '2000'].map(price => (
                  <button 
                    key={price}
                    onClick={() => { setMinPrice('0'); setMaxPrice(price); }}
                    className="text-xs px-3 py-1 bg-gray-100 rounded-full hover:bg-pink-100 transition"
                  >
                    Under ₹{price}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-pink-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-pink-500">⭐</span> Customer Rating
              </h3>
              <div className="space-y-2">
                {[4, 3].map(r => (
                  <label key={r} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-pink-50 transition">
                    <input 
                      type="radio" 
                      name="rating" 
                      checked={selectedRating === r} 
                      onChange={() => setSelectedRating(selectedRating === r ? 0 : r)} 
                      className="w-4 h-4 text-pink-500"
                    />
                    <div className="flex text-yellow-400 text-sm">
                      {'★'.repeat(r)}{'☆'.repeat(5 - r)}
                    </div>
                    <span className="text-xs text-gray-500">& above</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Free From Filter */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-pink-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-pink-500">🌱</span> Free From
              </h3>
              <div className="space-y-2">
                {['Parabens', 'Sulphates', 'Alcohol', 'Fragrance', 'Silicones', 'Dyes'].map(ff => (
                  <label key={ff} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-pink-50">
                    <input type="checkbox" className="w-4 h-4 text-pink-500 rounded" />
                    <span className="text-sm">{ff}</span>
                  </label>
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
                <option value="discount">Discount: High to Low</option>
              </select>
            </div>
            
            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-pink-100">
                <div className="text-7xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No skincare products found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters or search term</p>
                <button onClick={clearFilters} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition">Clear Filters</button>
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
              <p className="text-sm">Luxury beauty and skincare for the modern woman.</p>
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

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default SkincarePage;
