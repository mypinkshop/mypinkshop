import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';
import { setCacheWithTTL, getCacheWithTTL } from '../lib/utils';

// ============================================================
// ✅ PREMIUM PRODUCT CARD
// ============================================================
const ProductCard = ({ product, addToCart, isInWishlist, addToWishlist, removeFromWishlist, user }) => {
  const navigate = useNavigate();
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const getOptimizedImage = (url) => {
    if (!url) return null;
    if (url.includes('amazon') || url.includes('media-amazon')) {
      return url.replace('_SL1500_.jpg', '_SL500_.jpg').replace('_SL1500_', '_SL500_');
    }
    return url;
  };

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

    const handleUpdate = () => checkWishlist();

    window.addEventListener('wishlistUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('wishlistUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [product, user, isInWishlist]);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;

    addToCart({
      id: product._id || product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images?.[0],
      stock: product.stock
    });
    setIsAdded(true);
    toast.success('Added to cart! 🛒');
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleGoToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/cart');
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const productId = product._id || product.id;

    if (user) {
      if (isWishlisted) {
        removeFromWishlist(productId);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        addToWishlist(product);
        setIsWishlisted(true);
        toast.success('Added to wishlist ❤️');
      }
    } else {
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

      let wishlist = [];
      const saved = localStorage.getItem('guestWishlist');
      if (saved) {
        try {
          wishlist = JSON.parse(saved);
          if (!Array.isArray(wishlist)) wishlist = [];
        } catch(e) { wishlist = []; }
      }

      const exists = wishlist.some(item => (item._id === productId || item.id === productId));

      if (!exists) {
        wishlist.push(productData);
        localStorage.setItem('guestWishlist', JSON.stringify(wishlist));
        setIsWishlisted(true);
        toast.success('Added to wishlist! 🤍');
      } else {
        wishlist = wishlist.filter(item => (item._id !== productId && item.id !== productId));
        localStorage.setItem('guestWishlist', JSON.stringify(wishlist));
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      }

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
    }
  };

  // ✅ Discount calculation — multiple field names support
  const mrp = product.originalPrice || product.mrp || product.original_price || product.comparePrice;
  const price = product.price || product.sellingPrice || 0;
  const discountPercent = mrp && mrp > price
    ? Math.round(((mrp - price) / mrp) * 100)
    : 0;

  const rating = product.rating || 4.5;
  const isOutOfStock = product.stock === 0;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-pink-50 relative flex flex-col">

      {/* Discount Badge */}
      {discountPercent > 0 && (
        <div className="absolute top-3 left-3 z-20 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
          {discountPercent}% OFF
        </div>
      )}

      {/* Wishlist Heart */}
      <button
        onClick={handleWishlistToggle}
        className="absolute top-3 right-3 z-20 w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform border border-pink-100"
      >
        <span className="text-base">{isWishlisted ? '❤️' : '🤍'}</span>
      </button>

      <Link to={`/product/${product._id || product.id}`} className="block">
        <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
          {!imageLoaded && !imgError && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-pink-50 via-white to-rose-50" />
          )}

          {product.images && product.images[0] && !imgError ? (
            <img
              src={getOptimizedImage(product.images[0])}
              alt={product.name || 'Product'}
              className={`w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onError={() => setImgError(true)}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {product.emoji || '✨'}
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
              <span className="bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-full">
                Out of Stock
              </span>
            </div>
          )}

          {product.isNew && !isOutOfStock && (
            <span className="absolute bottom-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
              ✨ NEW
            </span>
          )}
        </div>
      </Link>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {product.brand && (
          <p className="text-[10px] sm:text-xs font-semibold text-pink-600 uppercase tracking-wider mb-1">
            {product.brand}
          </p>
        )}

        <Link to={`/product/${product._id || product.id}`}>
          <h3 className="font-semibold text-gray-800 text-xs sm:text-sm mb-2 line-clamp-2 hover:text-pink-600 transition min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 mb-2">
          <span className="bg-green-50 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
            {rating.toFixed(1)} <span className="text-yellow-500">★</span>
          </span>
          <span className="text-[10px] text-gray-400">(50+)</span>
        </div>

        <div className="flex items-baseline gap-2 mb-3 flex-wrap">
          <span className="text-base sm:text-lg font-bold text-pink-600">₹{price.toLocaleString()}</span>
          {mrp && mrp > price && (
            <span className="text-xs text-gray-400 line-through">₹{mrp.toLocaleString()}</span>
          )}
        </div>

        <div className="mt-auto flex gap-2">
          {isAdded ? (
            <button
              onClick={handleGoToCart}
              className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all bg-green-500 text-white hover:bg-green-600 shadow-sm"
            >
              ✓ Go to Cart
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                !isOutOfStock
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg hover:scale-[1.02]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {!isOutOfStock ? '🛒 Add to Cart' : 'Out of Stock'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ✅ MAIN SHOP COMPONENT
// ============================================================
function Shop() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedDiscount, setSelectedDiscount] = useState(0);
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  // Read URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearch = params.get('search');
    const urlCategory = params.get('category');
    if (urlSearch) setSearchTerm(urlSearch);
    if (urlCategory) setSelectedCategory(urlCategory.toLowerCase());
  }, [location.search]);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        const cached = getCacheWithTTL(sessionStorage, 'products_cache');

        if (cached) {
          const productsArray = Array.isArray(cached) ? cached : (cached.data || []);
          setProducts(productsArray.map(p => ({ ...p, id: p._id })));
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/api/products`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        let data = await response.json();
        const productsArray = Array.isArray(data) ? data : (data.data || []);

        setCacheWithTTL(sessionStorage, 'products_cache', data, 5 * 60 * 1000);

        setProducts(productsArray.map(p => ({ ...p, id: p._id })));
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // ✅ Filter + sort
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => {
        const productCategory = (p.mainCategory || p.category || '').toLowerCase();
        return productCategory === selectedCategory.toLowerCase();
      });
    }

    if (selectedBrand !== 'all') {
      filtered = filtered.filter(p => p.brand === selectedBrand);
    }

    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;
    filtered = filtered.filter(p => {
      const price = p.price || p.sellingPrice || 0;
      return price >= min && price <= max;
    });

    // ✅ Discount filter — multiple field names support
    if (selectedDiscount > 0) {
      filtered = filtered.filter(p => {
        const mrp = p.originalPrice || p.mrp || p.original_price || p.comparePrice;
        const price = p.price || p.sellingPrice || 0;

        if (!mrp || mrp <= price) return false;

        const disc = Math.round(((mrp - price) / mrp) * 100);
        return disc >= selectedDiscount;
      });
    }

    switch (sortBy) {
      case 'price_low': filtered.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price_high': filtered.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest': filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      default: break;
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedBrand, minPrice, maxPrice, selectedDiscount, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setMinPrice('');
    setMaxPrice('');
    setSelectedDiscount(0);
    setSortBy('default');
    navigate('/shop');
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
    }
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

  const brands = useMemo(() => {
    const unique = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
    return [{ id: 'all', name: 'All Brands', count: products.length }, ...unique.map(b => ({ id: b, name: b, count: products.filter(p => p.brand === b).length }))];
  }, [products]);

  const activeFilterCount = [
    selectedCategory !== 'all',
    selectedBrand !== 'all',
    minPrice,
    maxPrice,
    selectedDiscount > 0,
  ].filter(Boolean).length;

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
        <link rel="canonical" href="https://www.mypinkshop.com/shop" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <OfferBanner />

        {/* HEADER */}
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-gray-50"
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 sm:px-6 py-1.5 rounded-full text-sm font-medium hover:shadow-lg transition-all"
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

        {/* HERO */}
        <div className="relative bg-gradient-to-r from-pink-200 via-rose-200 to-pink-200 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-center relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 text-[200px] pointer-events-none select-none">
              🛍️
            </div>
            <div className="relative z-10">
              <span className="inline-block bg-white/80 backdrop-blur-sm text-pink-600 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
                ✨ SHOP THE COLLECTION ✨
              </span>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">
                Find Your <span className="text-pink-600">Perfect</span> Pick
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {products.length}+ products • Free shipping above ₹499
              </p>
            </div>
          </div>
        </div>

        {/* CATEGORY CHIPS */}
        <div className="sticky top-[61px] sm:top-[73px] z-40 bg-white border-b border-pink-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 sm:gap-3 overflow-x-auto py-3 scrollbar-hide">
              {categoryChips.map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setSelectedCategory(chip.id)}
                  className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === chip.id
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200'
                      : 'bg-pink-50 text-gray-700 hover:bg-pink-100 border border-pink-100'
                  }`}
                >
                  <span>{chip.icon}</span>
                  <span>{chip.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BREADCRUMB */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">Shop</span>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">

          {/* Top Bar */}
          <div className="mb-6 flex flex-wrap justify-between items-center gap-3 bg-white rounded-2xl p-3 sm:p-4 border border-pink-100 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 border border-pink-200 rounded-full text-sm font-semibold hover:bg-pink-100 transition"
              >
                <span>🎛️</span> Filters
                {activeFilterCount > 0 && (
                  <span className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <p className="text-sm text-gray-500">
                Showing <span className="font-bold text-pink-600">{filteredProducts.length}</span> of <span className="font-semibold text-gray-800">{products.length}</span> products
              </p>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-white cursor-pointer"
            >
              <option value="default">Sort: Recommended</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCategory !== 'all' && (
                <span className="flex items-center gap-1.5 bg-pink-100 text-pink-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  {selectedCategory} <button onClick={() => setSelectedCategory('all')} className="hover:text-pink-900">×</button>
                </span>
              )}
              {selectedBrand !== 'all' && (
                <span className="flex items-center gap-1.5 bg-pink-100 text-pink-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  {selectedBrand} <button onClick={() => setSelectedBrand('all')} className="hover:text-pink-900">×</button>
                </span>
              )}
              {selectedDiscount > 0 && (
                <span className="flex items-center gap-1.5 bg-pink-100 text-pink-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  {selectedDiscount}%+ off <button onClick={() => setSelectedDiscount(0)} className="hover:text-pink-900">×</button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="flex items-center gap-1.5 bg-pink-100 text-pink-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  ₹{minPrice || 0} - ₹{maxPrice || '∞'} <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="hover:text-pink-900">×</button>
                </span>
              )}
              <button onClick={clearFilters} className="text-xs text-pink-600 underline hover:text-pink-800 font-semibold">
                Clear all
              </button>
            </div>
          )}

          <div className="flex gap-6 lg:gap-8">

            {/* SIDEBAR FILTERS */}
            <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-black/50 lg:static lg:bg-transparent lg:z-auto' : 'hidden lg:block'} lg:w-72 xl:w-80 flex-shrink-0`} onClick={() => setShowFilters(false)}>

              <div
                className={`${showFilters ? 'absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto p-5 lg:static lg:p-0 lg:w-full lg:bg-transparent' : ''} space-y-4`}
                onClick={(e) => e.stopPropagation()}
              >

                {showFilters && (
                  <div className="flex justify-between items-center mb-4 lg:hidden">
                    <h3 className="text-lg font-bold text-gray-800">Filters</h3>
                    <button onClick={() => setShowFilters(false)} className="text-2xl text-gray-400">✕</button>
                  </div>
                )}

                {/* Category */}
                <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                    <span>📂</span> Categories
                  </h3>
                  <div className="space-y-1.5">
                    {categories.map(cat => (
                      <label key={cat.id} className={`flex items-center justify-between cursor-pointer px-3 py-2 rounded-xl transition ${selectedCategory === cat.id ? 'bg-pink-50 border border-pink-200' : 'hover:bg-pink-50'}`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="category"
                            checked={selectedCategory === cat.id}
                            onChange={() => setSelectedCategory(cat.id)}
                            className="w-4 h-4 text-pink-500 focus:ring-pink-400"
                          />
                          <span className={`text-sm ${selectedCategory === cat.id ? 'font-semibold text-pink-700' : 'text-gray-700'}`}>{cat.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">{cat.count}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Brand */}
                {brands.length > 1 && (
                  <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                      <span>🏷️</span> Brands
                    </h3>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 bg-white cursor-pointer"
                    >
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.count})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Price */}
                <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                    <span>💰</span> Price Range
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500"
                    />
                    <span className="text-gray-400 self-center">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* Discount Filter */}
                <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                    <span>🎁</span> Discount
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[10, 25, 50, 70].map(d => (
                      <button
                        key={d}
                        onClick={() => setSelectedDiscount(selectedDiscount === d ? 0 : d)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                          selectedDiscount === d
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                            : 'bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100'
                        }`}
                      >
                        {d}% or more
                      </button>
                    ))}
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-2xl text-sm font-bold hover:shadow-lg transition-all"
                  >
                    Clear All Filters ✨
                  </button>
                )}

              </div>
            </aside>

            {/* PRODUCTS GRID */}
            <div className="flex-1 min-w-0">

              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-pink-100 shadow-sm">
                  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center">
                    <span className="text-6xl">🔍</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">No products found</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">Try adjusting your filters or search term to find what you're looking for</p>
                  <button
                    onClick={clearFilters}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition"
                  >
                    Clear Filters ✨
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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

        {/* FOOTER */}
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
                  <li><a href="#" className="hover:text-pink-500 transition">Facebook</a></li>
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
    </>
  );
}

export default Shop;
