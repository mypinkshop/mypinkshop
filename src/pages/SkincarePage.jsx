import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';

// ============ PRODUCT CARD ============
const ProductCard = ({ product, addToCart, isInWishlist, addToWishlist, removeFromWishlist, user }) => {
  const navigate = useNavigate();
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

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

  const handleGoToCart = () => navigate('/cart');

  const handleWishlistToggle = () => {
    const productId = product._id || product.id;
    
    if (user) {
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
        wishlist.push({
          _id: productId,
          id: productId,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          images: product.images,
          rating: product.rating,
          brand: product.brand,
          stock: product.stock
        });
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

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-pink-100">
      <Link to={`/product/${product._id || product.id}`}>
        <div className="relative h-48 sm:h-52 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          {!imageLoaded && !imgError && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 to-gray-200" />
          )}
          
          {product.images && product.images[0] && !imgError ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className={`w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onError={() => setImgError(true)}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
              decoding="async"
              width="300"
              height="300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              ✨
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
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/product/${product._id || product.id}`}>
          <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-1 hover:text-pink-500 transition">
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
          {isAdded ? (
            <button onClick={handleGoToCart} className="flex-1 py-2 rounded-full text-sm bg-green-500 text-white">
              ✓ Go to Cart
            </button>
          ) : (
            <button onClick={handleAddToCart} className="flex-1 py-2 rounded-full text-sm bg-gradient-to-r from-pink-500 to-rose-500 text-white">
              Add to Cart
            </button>
          )}
          
          <button onClick={handleWishlistToggle} className="w-10 py-2 rounded-full border border-pink-200">
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ MAIN SKINCARE PAGE ============
function SkincarePage() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedSkinType, setSelectedSkinType] = useState('all');
  const [selectedConcern, setSelectedConcern] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);

  const API_URL = 'https://api.mypinkshop.com';

  // ===== GET SUBCATEGORY =====
  const getSubcategory = (product) => {
    const sub = product.subCategory || 
                product.subcategory || 
                product.category || 
                product.mainCategory || 
                '';
    
    if (['Skincare', 'skincare', 'General', 'general', ''].includes(sub)) {
      return '';
    }
    return sub;
  };

  // ===== LOAD PRODUCTS =====
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        
        const cached = sessionStorage.getItem('products_cache');
        const cacheTime = sessionStorage.getItem('products_cache_time');
        
        if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 60000) {
          const data = JSON.parse(cached);
          const productsArray = data.products || data;
          const skincareProducts = productsArray.filter(p => 
            (p.mainCategory === 'Skincare' || p.category === 'Skincare' || p.category === 'skincare') &&
            p.status === 'active'
          ).map(p => ({ 
            ...p, 
            id: p._id, 
            subcategory: getSubcategory(p),
            skinType: p.skinType || 'all',
            concerns: p.concerns || []
          }));
          setProducts(skincareProducts);
          setLoading(false);
          return;
        }
        
        const response = await fetch(`${API_URL}/api/products`);
        if (!response.ok) throw new Error('Failed to load products');
        
        let data = await response.json();
        const productsArray = data.products || data;
        
        sessionStorage.setItem('products_cache', JSON.stringify(data));
        sessionStorage.setItem('products_cache_time', Date.now().toString());
        
        const skincareProducts = productsArray.filter(p => 
          (p.mainCategory === 'Skincare' || p.category === 'Skincare' || p.category === 'skincare') &&
          p.status === 'active'
        ).map(p => ({ 
          ...p, 
          id: p._id, 
          subcategory: getSubcategory(p),
          skinType: p.skinType || 'all',
          concerns: p.concerns || []
        }));
        
        setProducts(skincareProducts);
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  // ===== FILTER AND SORT =====
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSubcategory !== 'all') {
      filtered = filtered.filter(p => {
        const productSub = (p.subcategory || '').toLowerCase();
        const selected = selectedSubcategory.toLowerCase();
        return productSub === selected || productSub.includes(selected);
      });
    }

    if (selectedBrand !== 'all') {
      filtered = filtered.filter(p => p.brand === selectedBrand);
    }

    if (selectedSkinType !== 'all') {
      filtered = filtered.filter(p => (p.skinType || 'all').toLowerCase() === selectedSkinType.toLowerCase());
    }

    if (selectedConcern !== 'all') {
      filtered = filtered.filter(p => {
        const concerns = p.concerns || [];
        return concerns.some(c => c.toLowerCase().includes(selectedConcern.toLowerCase()));
      });
    }

    let min = 0, max = Infinity;
    if (priceRange !== 'all') {
      switch(priceRange) {
        case 'under500': max = 500; break;
        case '500-1000': min = 500; max = 1000; break;
        case '1000-2000': min = 1000; max = 2000; break;
        case '2000-5000': min = 2000; max = 5000; break;
        case 'above5000': min = 5000; break;
        default: break;
      }
    }
    filtered = filtered.filter(p => p.price >= min && p.price <= max);

    switch(sortBy) {
      case 'price_low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price_high': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest': filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      default: break;
    }
    
    return filtered;
  }, [products, searchTerm, selectedSubcategory, selectedBrand, selectedSkinType, selectedConcern, priceRange, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSubcategory('all');
    setSelectedBrand('all');
    setSelectedSkinType('all');
    setSelectedConcern('all');
    setPriceRange('all');
    setSortBy('default');
  };

  const subcategories = useMemo(() => {
    const subs = [...new Set(products.map(p => p.subcategory).filter(Boolean))];
    return [{ id: 'all', name: 'All Subcategories' }, ...subs.map(s => ({ id: s, name: s }))];
  }, [products]);

  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return [{ id: 'all', name: 'All Brands' }, ...uniqueBrands.map(b => ({ id: b, name: b }))];
  }, [products]);

  const skinTypes = [
    { id: 'all', name: 'All Skin Types' },
    { id: 'oily', name: 'Oily' },
    { id: 'dry', name: 'Dry' },
    { id: 'combination', name: 'Combination' },
    { id: 'sensitive', name: 'Sensitive' },
    { id: 'normal', name: 'Normal' },
  ];

  const concerns = useMemo(() => {
    const allConcerns = products.flatMap(p => p.concerns || []).filter(Boolean);
    const uniqueConcerns = [...new Set(allConcerns)];
    return [{ id: 'all', name: 'All Concerns' }, ...uniqueConcerns.map(c => ({ id: c, name: c }))];
  }, [products]);

  const priceRanges = [
    { id: 'all', name: 'All Prices' },
    { id: 'under500', name: 'Under ₹500' },
    { id: '500-1000', name: '₹500 - ₹1000' },
    { id: '1000-2000', name: '₹1000 - ₹2000' },
    { id: '2000-5000', name: '₹2000 - ₹5000' },
    { id: 'above5000', name: 'Above ₹5000' },
  ];

  const sortOptions = [
    { id: 'default', name: 'Default Sorting' },
    { id: 'price_low', name: 'Price: Low to High' },
    { id: 'price_high', name: 'Price: High to Low' },
    { id: 'rating', name: 'Highest Rated' },
    { id: 'newest', name: 'Newest First' },
  ];

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
    <>
      <Helmet>
        <title>Skincare Products - Face Wash, Serum, Moisturizer & More | MyPinkShop</title>
        <meta name="description" content="Shop premium skincare products at MyPinkShop. Face washes, serums, moisturizers, sunscreens, and masks for glowing skin." />
        <link rel="canonical" href="https://www.mypinkshop.com/skincare" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        
        <OfferBanner />

        {/* ===== HEADER ===== */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
              <Link to="/" className="flex items-center gap-2 shrink-0 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-lg sm:text-xl">M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">MyPinkShop</h1>
                  <p className="text-[9px] text-gray-400">FOR THE GIRLIES ✨</p>
                </div>
              </Link>

              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search skincare..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 bg-gray-50"
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => navigate('/wishlist')} className="relative p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{wishlistCount}</span>}
                </button>
                
                <Link to="/cart" className="relative p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
                </Link>
                
                {user ? <Avatar user={user} onLogout={logout} /> : 
                  <Link to="/login" className="p-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                }
              </div>
            </div>
          </div>
        </header>

        {/* ===== HERO BANNER ===== */}
        <div className="relative bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16 text-center">
            <div className="animate-fade-in-up">
              <span className="inline-block text-white/90 text-sm font-medium tracking-wider mb-2 bg-white/20 px-4 py-1 rounded-full backdrop-blur-sm">
                ✨ GLOW UP COLLECTION
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-200 via-white to-pink-200 bg-clip-text text-transparent drop-shadow-lg">
                Skincare ✨
              </h1>
              <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto mb-6">
                Discover our curated collection of premium skincare products for glowing, radiant skin.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/shop" className="bg-white text-pink-600 px-6 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg transition-all hover:scale-105">
                  🔥 Shop Now
                </Link>
                <button 
                  onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}
                  className="bg-white/20 backdrop-blur-sm text-white px-6 py-2.5 rounded-full text-sm font-semibold border border-white/30 hover:bg-white/30 transition-all"
                >
                  Explore All →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== BREADCRUMB ===== */}
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">Skincare</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-12">
          
          {/* ===== FILTER BAR ===== */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              
              <div className="hidden md:flex flex-wrap gap-2">
                <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-full text-sm bg-white">
                  {subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                </select>
                <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-full text-sm bg-white">
                  {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
                <select value={selectedSkinType} onChange={(e) => setSelectedSkinType(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-full text-sm bg-white">
                  {skinTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>
                <select value={selectedConcern} onChange={(e) => setSelectedConcern(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-full text-sm bg-white">
                  {concerns.map(concern => <option key={concern.id} value={concern.id}>{concern.name}</option>)}
                </select>
                <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-full text-sm bg-white">
                  {priceRanges.map(range => <option key={range.id} value={range.id}>{range.name}</option>)}
                </select>
              </div>

              <button onClick={() => setShowFilters(!showFilters)} className="md:hidden px-4 py-2 border border-pink-200 rounded-full text-sm bg-white">
                Filters 🔽
              </button>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white">
                {sortOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </div>

            {(selectedSubcategory !== 'all' || selectedBrand !== 'all' || selectedSkinType !== 'all' || selectedConcern !== 'all' || priceRange !== 'all' || searchTerm) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedSubcategory !== 'all' && <span className="text-xs px-2 py-1 bg-pink-50 text-pink-600 rounded-full">{selectedSubcategory} <button onClick={() => setSelectedSubcategory('all')}>×</button></span>}
                {selectedBrand !== 'all' && <span className="text-xs px-2 py-1 bg-pink-50 text-pink-600 rounded-full">{selectedBrand} <button onClick={() => setSelectedBrand('all')}>×</button></span>}
                {selectedSkinType !== 'all' && <span className="text-xs px-2 py-1 bg-pink-50 text-pink-600 rounded-full">Skin: {selectedSkinType} <button onClick={() => setSelectedSkinType('all')}>×</button></span>}
                {selectedConcern !== 'all' && <span className="text-xs px-2 py-1 bg-pink-50 text-pink-600 rounded-full">Concern: {selectedConcern} <button onClick={() => setSelectedConcern('all')}>×</button></span>}
                {priceRange !== 'all' && <span className="text-xs px-2 py-1 bg-pink-50 text-pink-600 rounded-full">{priceRanges.find(r => r.id === priceRange)?.name} <button onClick={() => setPriceRange('all')}>×</button></span>}
                {searchTerm && <span className="text-xs px-2 py-1 bg-pink-50 text-pink-600 rounded-full">Search: {searchTerm} <button onClick={() => setSearchTerm('')}>×</button></span>}
                <button onClick={clearFilters} className="text-xs text-pink-500 underline">Clear All</button>
              </div>
            )}
          </div>

          {/* ===== MOBILE FILTERS MODAL ===== */}
          {showFilters && (
            <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilters(false)}>
              <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-semibold text-gray-800">Filters</h3>
                  <button onClick={() => setShowFilters(false)} className="text-gray-400 text-xl">✕</button>
                </div>
                <div className="space-y-4">
                  <div><label className="block text-sm mb-1">Subcategory</label><select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} className="w-full p-2 border rounded-lg">{subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                  <div><label className="block text-sm mb-1">Brand</label><select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full p-2 border rounded-lg">{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                  <div><label className="block text-sm mb-1">Skin Type</label><select value={selectedSkinType} onChange={(e) => setSelectedSkinType(e.target.value)} className="w-full p-2 border rounded-lg">{skinTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                  <div><label className="block text-sm mb-1">Concern</label><select value={selectedConcern} onChange={(e) => setSelectedConcern(e.target.value)} className="w-full p-2 border rounded-lg">{concerns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label className="block text-sm mb-1">Price</label><select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full p-2 border rounded-lg">{priceRanges.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                  <button onClick={clearFilters} className="w-full py-2 bg-pink-500 text-white rounded-lg mt-4">Clear All</button>
                </div>
              </div>
            </div>
          )}

          {/* ===== RESULTS COUNT ===== */}
          <div className="mb-4">
            <p className="text-sm text-gray-500">Showing <span className="font-semibold text-pink-600">{filteredProducts.length}</span> of <span className="font-semibold text-pink-600">{products.length}</span> products</p>
          </div>
          
          {/* ===== PRODUCTS GRID ===== */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white/80 rounded-2xl p-12 text-center border border-pink-100">
              <div className="text-6xl mb-3">🧴</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">No skincare products found</h3>
              <p className="text-gray-500 text-sm mb-4">Try adjusting your filters</p>
              <button onClick={clearFilters} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full text-sm">Clear All Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product._id} 
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

        {/* ===== FOOTER ===== */}
        <footer className="bg-gray-900 text-gray-400 py-12 mt-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">M</span>
                  </div>
                  <h3 className="font-bold text-white">MyPinkShop</h3>
                </div>
                <p className="text-xs">Luxury skincare for glowing skin.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Shop</h4>
                <ul className="space-y-1 text-xs">
                  <li><Link to="/skincare" className="hover:text-pink-500">Skincare</Link></li>
                  <li><Link to="/makeup" className="hover:text-pink-500">Makeup</Link></li>
                  <li><Link to="/hair" className="hover:text-pink-500">Hair Care</Link></li>
                  <li><Link to="/clothing" className="hover:text-pink-500">Clothing</Link></li>
                  <li><Link to="/accessories" className="hover:text-pink-500">Accessories</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Support</h4>
                <ul className="space-y-1 text-xs">
                  <li><Link to="/contact" className="hover:text-pink-500">Contact Us</Link></li>
                  <li><Link to="/faqs" className="hover:text-pink-500">FAQs</Link></li>
                  <li><Link to="/shipping-info" className="hover:text-pink-500">Shipping</Link></li>
                  <li><Link to="/returns-policy" className="hover:text-pink-500">Returns</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Follow Us</h4>
                <ul className="space-y-1 text-xs">
                  <li><a href="#" className="hover:text-pink-500">Instagram</a></li>
                  <li><a href="#" className="hover:text-pink-500">Pinterest</a></li>
                </ul>
              </div>
            </div>
            <div className="text-center pt-6 border-t border-gray-800">
              <p className="text-xs">© 2026 MyPinkShop. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default SkincarePage;
