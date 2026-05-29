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

// Skincare Subcategories (from screenshot)
const skincareSubcategories = [
  { id: 'moisturizers', name: 'Moisturizers', icon: '💧', count: 89 },
  { id: 'serums', name: 'Serums', icon: '✨', count: 67 },
  { id: 'cleansers', name: 'Cleansers', icon: '🧼', count: 124 },
  { id: 'masks', name: 'Masks', icon: '🎭', count: 45 },
  { id: 'toners', name: 'Toners & Mists', icon: '💨', count: 38 },
  { id: 'bodyCare', name: 'Body Care', icon: '🧴', count: 73 },
  { id: 'handsFeet', name: 'Hands & Feet', icon: '🖐️', count: 29 },
  { id: 'specialised', name: 'Specialised Skincare', icon: '🔬', count: 33 },
  { id: 'eyeCare', name: 'Eye Care', icon: '👁️', count: 29 },
  { id: 'lipCare', name: 'Lip Care', icon: '💋', count: 52 },
  { id: 'sunCare', name: 'Sun Care', icon: '☀️', count: 41 },
  { id: 'kits', name: 'Kits & Combos', icon: '🎁', count: 27 },
  { id: 'skinTools', name: 'Skin Tools', icon: '🔧', count: 19 },
  { id: 'supplements', name: 'Skin Supplements', icon: '💊', count: 15 },
  { id: 'korean', name: 'Korean Beauty', icon: '🇰🇷', count: 42 },
  { id: 'neckCare', name: 'Neck Creams', icon: '🦒', count: 12 },
];

// Skin Concerns
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

// Trending Searches
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
  const [activeTab, setActiveTab] = useState('categories');

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const skincareProducts = storedProducts.filter(p => 
      p.adminApproved === true && 
      p.status === 'active' && 
      p.category === 'skincare'
    );
    setProducts(skincareProducts);
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

    if (selectedConcern !== 'all') {
      filtered = filtered.filter(p => p.skinConcerns?.includes(selectedConcern));
    }

    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : Infinity;
    filtered = filtered.filter(p => p.price >= min && p.price <= max);

    if (selectedSkinType !== 'all') {
      filtered = filtered.filter(p => p.skinType === selectedSkinType || p.skinType === 'all');
    }

    if (selectedRating > 0) {
      filtered = filtered.filter(p => (p.rating || 4) >= selectedRating);
    }

    switch(sortBy) {
      case 'price_low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price_high': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest': filtered.sort((a, b) => (b.id || 0) - (a.id || 0)); break;
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

  const getCategoryDisplayName = (catId) => {
    const cat = skincareSubcategories.find(c => c.id === catId);
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
          <span>✨</span><span>Free Shipping on ₹999+</span>
          <span className="hidden sm:inline">•</span><span>Extra 10% off on first order</span>
          <span className="hidden sm:inline">•</span><span>Cash on Delivery Available</span><span>✨</span>
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
                  placeholder="Search skincare..."
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
      <div className="bg-gradient-to-r from-pink-100 via-rose-100 to-pink-100 py-12 text-center">
        <h1 className="text-4xl font-bold text-pink-800 mb-2">Skincare ✨</h1>
        <p className="text-pink-600">Glow up with our curated skincare collection</p>
      </div>

      {/* Trending Searches */}
      <div className="bg-white border-b border-pink-100 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <span className="text-xs font-medium text-gray-500">🔥 Trending:</span>
            {trendingSearches.map((trend, idx) => (
              <button key={idx} onClick={() => setSearchTerm(trend)} className="text-sm text-gray-600 hover:text-pink-500 whitespace-nowrap">
                {trend}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-pink-100 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            <button onClick={() => setActiveTab('categories')} className={`py-3 px-1 text-sm font-medium ${activeTab === 'categories' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>
              Categories
            </button>
            <button onClick={() => setActiveTab('concerns')} className={`py-3 px-1 text-sm font-medium ${activeTab === 'concerns' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>
              Shop by Concern
            </button>
          </div>
        </div>
      </div>

      {/* Subcategories Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'categories' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <button onClick={() => setSelectedSubcat('all')} className={`border rounded-xl p-3 text-center ${selectedSubcat === 'all' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'bg-white hover:shadow-md'}`}>
              <div className="text-2xl mb-1">📦</div>
              <div className="font-semibold text-sm">All</div>
              <div className="text-xs opacity-75">{products.length}</div>
            </button>
            {skincareSubcategories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedSubcat(cat.id)} className={`border rounded-xl p-3 text-center ${selectedSubcat === cat.id ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'bg-white hover:shadow-md'}`}>
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="font-semibold text-sm">{cat.name}</div>
                <div className="text-xs opacity-75">{cat.count}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {skinConcerns.map(concern => (
              <button key={concern.id} onClick={() => setSelectedConcern(selectedConcern === concern.name ? 'all' : concern.name)} className={`border rounded-xl p-3 text-center ${selectedConcern === concern.name ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'bg-white hover:shadow-md'}`}>
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
          {selectedSubcat !== 'all' && <><span className="text-gray-400">/</span><span className="text-gray-600">{getCategoryDisplayName(selectedSubcat)}</span></>}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <button onClick={() => setShowFilters(!showFilters)} className="md:hidden w-full bg-white/80 border border-pink-100 rounded-2xl py-3 mb-4 flex justify-center gap-2">
          🔽 Filters & Sorting
        </button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block md:w-80 space-y-5`}>
            <div className="bg-white/80 rounded-2xl p-5 border border-pink-100">
              <h3 className="font-semibold mb-3">✨ Skin Type</h3>
              <div className="space-y-2">
                {['all', 'oily', 'dry', 'combination', 'sensitive'].map(type => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-pink-50">
                    <input type="radio" name="skinType" checked={selectedSkinType === type} onChange={() => setSelectedSkinType(type)} className="w-4 h-4 text-pink-500" />
                    <span className="text-sm capitalize">{type === 'all' ? 'All Skin Types' : type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white/80 rounded-2xl p-5 border border-pink-100">
              <h3 className="font-semibold mb-3">💰 Price</h3>
              <div className="flex gap-3">
                <input type="number" placeholder="Min ₹" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
                <input type="number" placeholder="Max ₹" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
            </div>

            <div className="bg-white/80 rounded-2xl p-5 border border-pink-100">
              <h3 className="font-semibold mb-3">⭐ Rating</h3>
              <div className="space-y-2">
                {[4, 3].map(r => (
                  <label key={r} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-pink-50">
                    <input type="radio" name="rating" checked={selectedRating === r} onChange={() => setSelectedRating(selectedRating === r ? 0 : r)} className="w-4 h-4 text-pink-500" />
                    <div className="flex text-yellow-400 text-sm">{'★'.repeat(r)}{'☆'.repeat(5 - r)}</div>
                  </label>
                ))}
              </div>
            </div>

            <button onClick={clearFilters} className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-2xl text-sm font-medium hover:shadow-lg">
              Clear All ✨
            </button>
          </div>

          {/* Products */}
          <div className="flex-1">
            <div className="bg-white/80 rounded-2xl p-4 mb-6 flex justify-between items-center">
              <span className="text-sm text-gray-500">Showing <span className="font-semibold text-pink-600">{filteredProducts.length}</span> products</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border rounded-xl text-sm">
                <option value="default">Default</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white/80 rounded-2xl p-12 text-center">
                <div className="text-7xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <button onClick={clearFilters} className="bg-pink-500 text-white px-6 py-2 rounded-full">Clear Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} addToCart={addToCart} isInWishlist={isInWishlist} addToWishlist={addToWishlist} removeFromWishlist={removeFromWishlist} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-8 text-center">
        <p>© 2026 MyPinkShop. All rights reserved.</p>
      </footer>

      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

export default SkincarePage;
