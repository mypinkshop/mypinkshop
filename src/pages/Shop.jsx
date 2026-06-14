import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';

// OPTIMIZED Product Card Component WITH FIXED WISHLIST
const ProductCard = ({ product, addToCart, isInWishlist, addToWishlist, removeFromWishlist, user }) => {
  const navigate = useNavigate(); // ✅ FIXED - Added missing navigate
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Check if product is in wishlist on mount
  useEffect(() => {
    const checkWishlist = () => {
      if (user) {
        setIsWishlisted(isInWishlist(product._id || product.id));
      } else {
        const saved = localStorage.getItem('guestWishlist');
        if (saved) {
          try {
            const wishlist = JSON.parse(saved);
            const exists = wishlist.some(item => (item._id === product._id || item.id === product._id));
            setIsWishlisted(exists);
          } catch(e) {}
        }
      }
    };
    checkWishlist();
    
    // Listen for wishlist updates
    const handleUpdate = () => {
      if (!user) {
        const saved = localStorage.getItem('guestWishlist');
        if (saved) {
          try {
            const wishlist = JSON.parse(saved);
            const exists = wishlist.some(item => (item._id === product._id || item.id === product._id));
            setIsWishlisted(exists);
          } catch(e) {}
        }
      } else {
        setIsWishlisted(isInWishlist(product._id || product.id));
      }
    };
    
    window.addEventListener('wishlistUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      window.removeEventListener('wishlistUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [product, user, isInWishlist]);

  const handleAddToCart = () => {
    addToCart({
      id: product._id || product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images?.[0],
      stock: product.stock
    });
    setIsAdded(true);
    toast.success('Added to cart!');
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleGoToCart = () => {
    navigate('/cart');
  };

  const handleWishlistToggle = () => {
    const productId = product._id || product.id;
    
    if (user) {
      // Logged in user - use context
      if (isWishlisted) {
        removeFromWishlist(productId);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        addToWishlist(product);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } else {
      // Guest user - DIRECT localStorage save
      const productData = {
        _id: productId,
        id: productId,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        images: product.images,
        rating: product.rating,
        brand: product.brand,
        badge: product.badge,
        isNew: product.isNew,
        stock: product.stock,
        emoji: product.emoji
      };
      
      // Get existing wishlist
      let wishlist = [];
      const saved = localStorage.getItem('guestWishlist');
      if (saved) {
        try {
          wishlist = JSON.parse(saved);
          if (!Array.isArray(wishlist)) wishlist = [];
        } catch(e) { wishlist = []; }
      }
      
      // Check if exists
      const exists = wishlist.some(item => (item._id === productId || item.id === productId));
      
      if (!exists) {
        wishlist.push(productData);
        localStorage.setItem('guestWishlist', JSON.stringify(wishlist));
        setIsWishlisted(true);
        toast.success('Added to wishlist! 🤍');
        console.log('✅ Added to guest wishlist:', wishlist);
      } else {
        wishlist = wishlist.filter(item => (item._id !== productId && item.id !== productId));
        localStorage.setItem('guestWishlist', JSON.stringify(wishlist));
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
        console.log('❌ Removed from guest wishlist:', wishlist);
      }
      
      // Dispatch events to update header and wishlist page
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
    }
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-pink-100">
      <Link to={`/product/${product._id || product.id}`}>
        <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          {!imageLoaded && !imgError && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 to-gray-200" />
          )}
          
          {product.images && product.images[0] && !imgError ? (
            <img 
              src={product.images[0]} 
              alt={product.name || 'Product image'}
              className={`w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onError={() => setImgError(true)}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
              decoding="async"
              width="400"
              height="400"
              style={{ aspectRatio: '1/1' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl sm:text-6xl group-hover:scale-110 transition-transform duration-500">
              {product.emoji || '✨'}
            </div>
          )}
          {product.badge && (
            <span className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-2 py-1 rounded-full shadow-md z-10">
              {product.badge}
            </span>
          )}
          {product.isNew && (
            <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs px-2 py-1 rounded-full shadow-md z-10">
              NEW
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <span className="text-white text-sm font-medium px-3 py-1 bg-black/50 rounded-full">Out of Stock</span>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/product/${product._id || product.id}`}>
          <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-1 line-clamp-2 hover:text-pink-500 transition min-h-[48px]">
            {product.name}
          </h3>
        </Link>
        
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
          {isAdded ? (
            <button 
              onClick={handleGoToCart}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-all bg-green-500 text-white hover:bg-green-600 transform hover:-translate-y-0.5"
            >
              ✓ Go to Cart
            </button>
          ) : (
            <button 
              onClick={handleAddToCart} 
              disabled={product.stock === 0}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all transform hover:-translate-y-0.5 ${
                product.stock > 0 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Add to Cart
            </button>
          )}
          
          <button 
            onClick={handleWishlistToggle}
            className="w-10 py-2 rounded-xl text-center transition transform hover:-translate-y-0.5 border border-pink-200 hover:bg-pink-50"
          >
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
};

function Shop() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);

  const API_URL = 'https://api.mypinkshop.com';

  // Load products - FIXED for pagination
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    const search = params.get('search');
    const offer = params.get('offer');
    const sort = params.get('sort');
    
    if (search) {
      setSearchTerm(search);
    }
    if (category && category !== 'all') {
      setSelectedCategory(category);
    }
    if (sort === 'newest') {
      setSortBy('newest');
    } else if (sort === 'bestseller') {
      setSortBy('rating');
    }
    
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/products`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        let data = await response.json();
        
        // ✅ FIX: Handle both paginated and non-paginated response
        const productsArray = data.products || data;
        
        let allProducts = productsArray;
        
        if (offer === 'sale') {
          allProducts = allProducts.filter(p => p.badge === 'Sale');
        }
        
        const transformedData = allProducts.map(p => ({
          ...p,
          id: p._id,
          category: p.mainCategory || p.category
        }));
        
        setProducts(transformedData);
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [location]);

  // Handle search with autocomplete
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length > 1) {
      const suggestions = products
        .filter(p => p.name?.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5)
        .map(p => p.name);
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate('/shop');
    }
  };

  // Filters
  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => {
        const productCategory = (p.mainCategory || p.category || '').toLowerCase();
        return productCategory === selectedCategory.toLowerCase();
      });
    }
    
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;
    filtered = filtered.filter(p => p.price >= min && p.price <= max);
    
    if (selectedRating > 0) {
      filtered = filtered.filter(p => Math.floor(p.rating || 4) >= selectedRating);
    }
    
    switch(sortBy) {
      case 'price_low': 
        filtered.sort((a, b) => a.price - b.price); 
        break;
      case 'price_high': 
        filtered.sort((a, b) => b.price - a.price); 
        break;
      case 'rating': 
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); 
        break;
      case 'newest': 
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 
        break;
      default: 
        break;
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, minPrice, maxPrice, selectedRating, sortBy, products]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setSelectedRating(0);
    setSortBy('default');
    navigate('/shop');
  };

  const categoryChips = [
    { id: 'all', name: 'All', icon: '✨' },
    { id: 'skincare', name: 'Skincare', icon: '🧴' },
    { id: 'makeup', name: 'Makeup', icon: '💄' },
    { id: 'hair', name: 'Hair', icon: '💇‍♀️' },
    { id: 'clothing', name: 'Clothing', icon: '👗' },
    { id: 'accessories', name: 'Accessories', icon: '👜' },
  ];

  const categories = useMemo(() => [
    { id: 'all', name: 'All Products', count: products.length },
    { id: 'skincare', name: 'Skincare', count: products.filter(p => (p.mainCategory || p.category || '').toLowerCase() === 'skincare').length },
    { id: 'makeup', name: 'Makeup', count: products.filter(p => (p.mainCategory || p.category || '').toLowerCase() === 'makeup').length },
    { id: 'hair', name: 'Hair', count: products.filter(p => (p.mainCategory || p.category || '').toLowerCase() === 'hair').length },
    { id: 'clothing', name: 'Clothing', count: products.filter(p => (p.mainCategory || p.category || '').toLowerCase() === 'clothing').length },
    { id: 'accessories', name: 'Accessories', count: products.filter(p => (p.mainCategory || p.category || '').toLowerCase() === 'accessories').length },
  ], [products]);

  // Hidden SEO Schema
  const generateItemListSchema = () => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "All Products - MyPinkShop",
    "description": "Shop all products including skincare, makeup, hair care, clothing, and accessories at MyPinkShop.",
    "numberOfItems": filteredProducts.length,
    "itemListElement": filteredProducts.slice(0, 10).map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://www.mypinkshop.com/product/${product._id}`
    }))
  });

  const generateBreadcrumbSchema = () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.mypinkshop.com" },
      { "@type": "ListItem", "position": 2, "name": "Shop", "item": "https://www.mypinkshop.com/shop" }
    ]
  });

  const generateOrganizationSchema = () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MyPinkShop",
    "url": "https://www.mypinkshop.com",
    "logo": "https://www.mypinkshop.com/logo.png"
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Shop All Products - Skincare, Makeup, Hair Care & More | MyPinkShop</title>
        <meta name="description" content="Shop all products at MyPinkShop. Wide range of skincare, makeup, hair care, clothing, and accessories. ✓ Free shipping ✓ COD ✓ Best prices." />
        <meta name="keywords" content="shop online, buy products, skincare, makeup, hair care, clothing, accessories, beauty products, fashion" />
        <link rel="canonical" href="https://www.mypinkshop.com/shop" />
        <meta property="og:title" content="Shop All Products - MyPinkShop" />
        <meta property="og:description" content="Shop all products including skincare, makeup, hair care, clothing, and accessories. Free shipping on orders above ₹499." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mypinkshop.com/shop" />
        <meta property="og:image" content="https://www.mypinkshop.com/og-shop.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Shop All Products - MyPinkShop" />
        <meta name="twitter:description" content="Shop all products. Free shipping available." />
        <meta name="twitter:image" content="https://www.mypinkshop.com/og-shop.jpg" />
        <script type="application/ld+json">{JSON.stringify(generateItemListSchema())}</script>
        <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema())}</script>
        <script type="application/ld+json">{JSON.stringify(generateOrganizationSchema())}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        
        {/* Offer Banner */}
        <OfferBanner />

        {/* Premium Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
              <Link to="/" className="flex items-center gap-2 shrink-0 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-lg sm:text-xl">M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">MyPinkShop</h1>
                  <p className="text-[9px] sm:text-[10px] text-gray-400 tracking-wider">FOR THE GIRLIES ✨</p>
                </div>
              </Link>

              {/* Search Bar with Autocomplete */}
              <div className="flex-1 max-w-md lg:max-w-2xl">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search for products..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => searchTerm.length > 1 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-gray-50"
                  />
                  
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                      {searchSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSearchTerm(suggestion);
                            setShowSuggestions(false);
                            handleSearch();
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-pink-50 text-sm transition first:rounded-t-xl last:rounded-b-xl"
                        >
                          🔍 {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <button 
                    onClick={handleSearch}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 sm:px-6 py-1.5 sm:py-1.5 rounded-full text-sm font-medium hover:shadow-lg transition-all"
                  >
                    <span className="hidden sm:inline">Search</span>
                    <span className="sm:hidden">🔍</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
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

        {/* Category Chips */}
        <div className="sticky top-[61px] sm:top-[73px] z-40 bg-white border-b border-pink-100 shadow-sm overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
              {categoryChips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => {
                    setSelectedCategory(chip.id);
                    navigate(`/shop?category=${chip.id === 'all' ? '' : chip.id}`);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === chip.id
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-base">{chip.icon}</span>
                  <span>{chip.name}</span>
                  {chip.id !== 'all' && (
                    <span className={`text-xs ${selectedCategory === chip.id ? 'text-white/80' : 'text-gray-400'}`}>
                      ({categories.find(c => c.id === chip.id)?.count || 0})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">Shop</span>
            {selectedCategory !== 'all' && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600 capitalize">{selectedCategory}</span>
              </>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="md:hidden w-full bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl py-3 mb-4 flex items-center justify-center gap-2 text-gray-700 font-medium shadow-sm"
          >
            <span>🔽</span> Filters & Sorting
          </button>

          <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
            
            {/* Left Sidebar - Filters */}
            <div className={`${showFilters ? 'block' : 'hidden'} md:block md:w-80 lg:w-96 space-y-5`}>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-pink-100 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-pink-500">✨</span> Categories
                </h3>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-pink-50 transition">
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="category" 
                          checked={selectedCategory === cat.id} 
                          onChange={() => {
                            setSelectedCategory(cat.id);
                            navigate(`/shop?category=${cat.id === 'all' ? '' : cat.id}`);
                          }}
                          className="w-4 h-4 text-pink-500 focus:ring-pink-400"
                        />
                        <span className="text-sm text-gray-700">{cat.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">{cat.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-pink-100 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-pink-500">💰</span> Price Range
                </h3>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input 
                      type="number" 
                      placeholder="Min ₹" 
                      value={minPrice} 
                      onChange={(e) => setMinPrice(e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="number" 
                      placeholder="Max ₹" 
                      value={maxPrice} 
                      onChange={(e) => setMaxPrice(e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-pink-100 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-pink-500">⭐</span> Rating
                </h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(r => (
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
                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-pink-50 transition">
                    <input 
                      type="radio" 
                      name="rating" 
                      checked={selectedRating === 0} 
                      onChange={() => setSelectedRating(0)} 
                      className="w-4 h-4 text-pink-500"
                    />
                    <span className="text-sm text-gray-600">All ratings</span>
                  </label>
                </div>
              </div>

              <button 
                onClick={clearFilters} 
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-2xl text-sm font-medium hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Clear All Filters ✨
              </button>
            </div>

            {/* Right Section - Products */}
            <div className="flex-1">
              
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
              
              {filteredProducts.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-pink-100">
                  <div className="text-7xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your filters or search term</p>
                  <button onClick={clearFilters} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition">Clear Filters</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {filteredProducts.map(product => (
                    <ProductCard 
                      key={product._id || product.id} 
                      product={product} 
                      addToCart={addToCart}
                      isInWishlist={isInWishlist}
                      addToWishlist={addToWishlist}
                      removeFromWishlist={removeFromWishlist}
                      user={user}
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
                <p className="text-sm">Luxury beauty and fashion for the modern woman.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Shop</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/skincare" className="hover:text-pink-500 transition">Skincare</Link></li>
                  <li><Link to="/makeup" className="hover:text-pink-500 transition">Makeup</Link></li>
                  <li><Link to="/hair" className="hover:text-pink-500 transition">Hair</Link></li>
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
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </>
  );
}

export default Shop;
