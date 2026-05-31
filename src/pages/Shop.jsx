import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

// ✅ Memoized Product Card to prevent unnecessary re-renders
const ProductCard = React.memo(({ product, addToCart, isInWishlist, addToWishlist, removeFromWishlist }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const handleCartClick = useCallback(() => {
    if (isAdded) {
      navigate('/cart');
    } else {
      addToCart(product);
      setIsAdded(true);
    }
  }, [isAdded, addToCart, product, navigate]);

  const handleBuyNow = useCallback(() => {
    addToCart(product);
    navigate('/cart');
  }, [addToCart, product, navigate]);

  const handleWishlistToggle = useCallback(() => {
    const productId = product._id || product.id;
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(product);
    }
  }, [product, isInWishlist, addToWishlist, removeFromWishlist]);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-pink-100">
      <Link to={`/product/${product._id || product.id}`}>
        <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          {product.images && product.images[0] && !imgError ? (
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
              loading="lazy"
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
          <button 
            onClick={handleCartClick}
            disabled={product.stock === 0}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all transform hover:-translate-y-0.5 ${
              product.stock > 0 
                ? isAdded
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isAdded ? '✓ Go to Cart' : 'Add to Cart'}
          </button>
          
          <button 
            onClick={handleWishlistToggle}
            disabled={product.stock === 0}
            className={`w-10 py-2 rounded-xl text-center transition transform hover:-translate-y-0.5 ${
              product.stock > 0 
                ? 'border border-pink-200 hover:bg-pink-50' 
                : 'border border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isInWishlist(product._id || product.id) ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
});

function Shop() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [allProducts, setAllProducts] = useState([]); // Store all products once
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 🔥 PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  
  // Debounce timeout ref
  const debounceTimeout = useRef(null);

  const API_URL = 'https://mypinkshop-dr93.vercel.app';
  
  // Cache key for products
  const CACHE_KEY = 'shop_products_cache';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Load products with caching
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            console.log("✅ Using cached products:", data.length);
            setAllProducts(data);
            setLoading(false);
            return;
          }
        }
        
        // Fetch from API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(`${API_URL}/api/products`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        let data = await response.json();
        
        // Apply offer filter from URL if needed
        const params = new URLSearchParams(location.search);
        const offer = params.get('offer');
        if (offer === 'sale') {
          data = data.filter(p => p.badge === 'Sale');
        }
        
        // Save to cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
        
        setAllProducts(data);
        console.log("✅ Loaded fresh products:", data.length);
        
      } catch (error) {
        console.error("Error loading products:", error);
        setError(error.message === 'AbortError' ? 'Request timeout' : 'Failed to load products');
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [location.search]);

  // 🔥 OPTIMIZED FILTERING with useMemo (only recalculates when dependencies change)
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];
    
    // Search filter (case insensitive)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(term) || 
        p.description?.toLowerCase().includes(term)
      );
    }
    
    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => 
        p.mainCategory?.toLowerCase() === selectedCategory || 
        p.category?.toLowerCase() === selectedCategory
      );
    }
    
    // Price filter
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;
    filtered = filtered.filter(p => p.price >= min && p.price <= max);
    
    // Rating filter
    if (selectedRating > 0) {
      filtered = filtered.filter(p => (p.rating || 4) >= selectedRating);
    }
    
    // Sorting
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
    
    return filtered;
  }, [allProducts, searchTerm, selectedCategory, minPrice, maxPrice, selectedRating, sortBy]);

  // 🔥 PAGINATION CALCULATION
  const paginatedData = useMemo(() => {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);
    
    return {
      currentProducts,
      totalPages,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, filteredProducts.length),
      totalItems: filteredProducts.length
    };
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, minPrice, maxPrice, selectedRating, sortBy]);

  // Debounced search handler
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      setSearchTerm(value);
    }, 300);
  }, []);

  // Pagination handlers
  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, paginatedData.totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [paginatedData.totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < paginatedData.totalPages) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, paginatedData.totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  // Generate page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    const total = paginatedData.totalPages;
    const current = currentPage;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  }, [currentPage, paginatedData.totalPages]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setSelectedRating(0);
    setSortBy('default');
    setCurrentPage(1);
  }, []);

  // Get category from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    const sort = params.get('sort');
    
    if (category && category !== 'all') {
      setSelectedCategory(category);
    }
    if (sort === 'newest') {
      setSortBy('newest');
    } else if (sort === 'bestseller') {
      setSortBy('rating');
    }
  }, [location.search]);

  // Category data with counts
  const categories = useMemo(() => [
    { id: 'all', name: 'All Products', count: allProducts.length },
    { id: 'skincare', name: 'Skincare', count: allProducts.filter(p => p.mainCategory === 'Skincare' || p.category === 'skincare').length },
    { id: 'makeup', name: 'Makeup', count: allProducts.filter(p => p.mainCategory === 'Makeup' || p.category === 'makeup').length },
    { id: 'hair', name: 'Hair', count: allProducts.filter(p => p.mainCategory === 'Hair' || p.category === 'hair').length },
    { id: 'clothing', name: 'Clothing', count: allProducts.filter(p => p.mainCategory === 'Clothing' || p.category === 'clothing').length },
    { id: 'accessories', name: 'Accessories', count: allProducts.filter(p => p.mainCategory === 'Accessories' || p.category === 'accessories').length },
  ], [allProducts]);

  // Category chips
  const categoryChips = [
    { id: 'all', name: 'All', icon: '✨' },
    { id: 'skincare', name: 'Skincare', icon: '🧴' },
    { id: 'makeup', name: 'Makeup', icon: '💄' },
    { id: 'hair', name: 'Hair', icon: '💇‍♀️' },
    { id: 'clothing', name: 'Clothing', icon: '👗' },
    { id: 'accessories', name: 'Accessories', icon: '👜' },
  ];

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Failed to load products</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-pink-100 animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3 w-2/3"></div>
                  <div className="h-6 bg-gray-200 rounded mb-3 w-1/2"></div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-10 bg-gray-200 rounded-xl"></div>
                    <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      
      {/* Premium Top Bar - Same as before */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
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

      {/* Premium Header - Same as before */}
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

            <div className="flex-1 max-w-md lg:max-w-2xl">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search for products..."
                  onChange={handleSearchChange}
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-gray-50"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
              <button onClick={() => navigate('/wishlist')} className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5">{wishlistCount}</span>}
              </button>
              
              <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5">{cartCount}</span>}
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
        
        {/* Mobile Filter Button */}
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className="md:hidden w-full bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl py-3 mb-4 flex items-center justify-center gap-2 text-gray-700 font-medium shadow-sm"
        >
          <span>🔽</span> Filters & Sorting
        </button>

        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
          
          {/* Left Sidebar - Filters (same as before) */}
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
                        onChange={() => setSelectedCategory(cat.id)} 
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

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-pink-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-pink-500">⭐</span> Rating
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

          {/* Right Section - Products with Pagination */}
          <div className="flex-1">
            
            {/* Sort and Count Bar with Items Per Page */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-6 flex flex-wrap justify-between items-center gap-3 border border-pink-100 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Showing</span>
                <span className="font-semibold text-pink-600">{paginatedData.startIndex}-{paginatedData.endIndex}</span>
                <span className="text-sm text-gray-500">of {paginatedData.totalItems} products</span>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Items Per Page Selector */}
                <select 
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-white"
                >
                  <option value={12}>12 per page</option>
                  <option value={24}>24 per page</option>
                  <option value={48}>48 per page</option>
                </select>
                
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
            </div>
            
            {/* Products Grid */}
            {paginatedData.currentProducts.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-pink-100">
                <div className="text-7xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters or search term</p>
                <button onClick={clearFilters} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {paginatedData.currentProducts.map(product => (
                    <ProductCard 
                      key={product._id || product.id} 
                      product={product} 
                      addToCart={addToCart}
                      isInWishlist={isInWishlist}
                      addToWishlist={addToWishlist}
                      removeFromWishlist={removeFromWishlist}
                    />
                  ))}
                </div>
                
                {/* 🔥 PAGINATION COMPONENT */}
                {paginatedData.totalPages > 1 && (
                  <div className="mt-12 flex justify-center items-center space-x-2">
                    {/* Previous Button */}
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-pink-500'
                      }`}
                    >
                      ← Previous
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex space-x-1">
                      {pageNumbers.map((page, index) => (
                        <button
                          key={index}
                          onClick={() => typeof page === 'number' && goToPage(page)}
                          disabled={page === '...'}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            page === currentPage
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                              : page === '...'
                              ? 'bg-transparent cursor-default'
                              : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-pink-500 border'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    {/* Next Button */}
                    <button
                      onClick={nextPage}
                      disabled={currentPage === paginatedData.totalPages}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        currentPage === paginatedData.totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-pink-500'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Same as before */}
      <footer className="bg-gray-900 text-gray-400 py-12 sm:py-16 mt-8">
        {/* ... footer content ... */}
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

export default Shop;
