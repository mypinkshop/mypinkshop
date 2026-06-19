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

// ============ SUBCATEGORY BANNER ============
const SubcategoryBanner = ({ category, count }) => {
  // Dynamic gradient based on category name
  const getGradient = (name) => {
    const gradients = {
      'cleanser': 'from-pink-200 to-pink-400',
      'toner': 'from-blue-200 to-blue-400',
      'serum': 'from-purple-200 to-purple-400',
      'moisturizer': 'from-green-200 to-green-400',
      'night': 'from-indigo-200 to-indigo-400',
      'sun': 'from-yellow-200 to-yellow-400',
      'mask': 'from-red-200 to-red-400',
      'face': 'from-rose-200 to-rose-400',
      'eye': 'from-teal-200 to-teal-400',
      'lip': 'from-pink-200 to-pink-400',
    };
    
    const lower = name.toLowerCase();
    for (const [key, gradient] of Object.entries(gradients)) {
      if (lower.includes(key)) return gradient;
    }
    return 'from-pink-200 to-pink-400';
  };

  // Dynamic icon based on category name
  const getIcon = (name) => {
    const icons = {
      'cleanser': '🧴',
      'toner': '💧',
      'serum': '🧪',
      'moisturizer': '✨',
      'night': '🌙',
      'sun': '☀️',
      'mask': '🎭',
      'face': '🧖',
      'eye': '👁️',
      'lip': '💋',
    };
    
    const lower = name.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
      if (lower.includes(key)) return icon;
    }
    return '✨';
  };

  return (
    <div className={`bg-gradient-to-r ${getGradient(category)} rounded-2xl p-6 mb-6 shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl">{getIcon(category)}</span>
            <h2 className="text-2xl font-bold text-gray-800">{category}</h2>
          </div>
          <p className="text-gray-600 text-sm mt-1">{count} products available</p>
        </div>
        <button className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-white transition">
          View All →
        </button>
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
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState(null);

  const API_URL = 'https://api.mypinkshop.com';

  // ===== LOAD REAL PRODUCTS FROM API =====
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_URL}/api/products`);
        if (!response.ok) {
          throw new Error(`Failed to load products: ${response.status}`);
        }
        
        const data = await response.json();
        const productsArray = data.products || data;
        
        if (!Array.isArray(productsArray) || productsArray.length === 0) {
          throw new Error('No products found');
        }
        
        // Filter skincare products and normalize fields
        const skincareProducts = productsArray
          .filter(p => {
            const category = (p.mainCategory || p.category || '').toLowerCase();
            return category === 'skincare' || category.includes('skincare') || p.category === 'Skincare';
          })
          .filter(p => p.status === 'active' || p.status === undefined)
          .map(p => ({
            ...p,
            id: p._id || p.id,
            subcategory: p.subCategory || p.subcategory || p.category || 'General',
            images: p.images || (p.image ? [p.image] : []),
            price: Number(p.price) || 0,
            originalPrice: Number(p.originalPrice) || Number(p.price) * 1.2 || 0,
            rating: Number(p.rating) || 4,
            brand: p.brand || 'MyPinkShop',
          }));
        
        if (skincareProducts.length === 0) {
          throw new Error('No skincare products found');
        }
        
        console.log(`✅ Loaded ${skincareProducts.length} skincare products`);
        console.log('📊 Subcategories:', [...new Set(skincareProducts.map(p => p.subcategory))]);
        
        setProducts(skincareProducts);
      } catch (err) {
        console.error('❌ Error loading products:', err);
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  // ===== GET ICON =====
  const getCategoryIcon = (name) => {
    if (!name) return '✨';
    const lower = name.toLowerCase();
    if (lower.includes('cleanser')) return '🧴';
    if (lower.includes('toner')) return '💧';
    if (lower.includes('serum')) return '🧪';
    if (lower.includes('moisturizer')) return '✨';
    if (lower.includes('night')) return '🌙';
    if (lower.includes('sun')) return '☀️';
    if (lower.includes('mask')) return '🎭';
    if (lower.includes('face')) return '🧖';
    if (lower.includes('eye')) return '👁️';
    if (lower.includes('lip')) return '💋';
    return '✨';
  };

  // ===== DYNAMIC SUBCATEGORIES (Auto-detect from products) =====
  const subCategories = useMemo(() => {
    if (!products || products.length === 0) {
      return [{ id: 'all', name: 'All', icon: '✨' }];
    }
    
    const subs = [...new Set(products.map(p => p.subcategory || 'General'))].filter(Boolean);
    
    return [
      { id: 'all', name: 'All', icon: '✨' },
      ...subs.map(s => ({
        id: s.toLowerCase().replace(/ /g, '_'),
        name: s,
        icon: getCategoryIcon(s)
      }))
    ];
  }, [products]);

  // ===== FILTER =====
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
  }, [products, searchTerm, selectedSubcategory, selectedBrand, priceRange, sortBy]);

  // ===== GROUP PRODUCTS BY SUBCATEGORY =====
  const groupedProducts = useMemo(() => {
    if (!products || products.length === 0) return {};
    
    const groups = {};
    products.forEach(product => {
      const key = product.subcategory || 'General';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(product);
    });
    return groups;
  }, [products]);

  // ===== BEST SELLERS =====
  const bestSellers = useMemo(() => {
    return [...filteredProducts]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  }, [filteredProducts]);

  // ===== SCROLL TO CATEGORY =====
  const scrollToCategory = (categoryId) => {
    setActiveTab(categoryId);
    const element = document.getElementById(`section-${categoryId}`);
    if (element) {
      const headerOffset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  // ===== CLEAR FILTERS =====
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSubcategory('all');
    setSelectedBrand('all');
    setPriceRange('all');
    setSortBy('default');
    setActiveTab('all');
  };

  // ===== OPTIONS =====
  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return [{ id: 'all', name: 'All Brands' }, ...uniqueBrands.map(b => ({ id: b, name: b }))];
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

  // ===== LOADING =====
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

  // ===== ERROR =====
  if (error || products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🧴</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Products Found</h2>
          <p className="text-gray-500 mb-4">{error || 'No skincare products available right now.'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full text-sm"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // ===== RENDER =====
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
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                Skincare ✨
              </h1>
              <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto mb-6">
                Discover our curated collection of premium skincare products for glowing, radiant skin.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button 
                  onClick={() => {
                    const firstCat = subCategories.find(c => c.id !== 'all');
                    if (firstCat) scrollToCategory(firstCat.id);
                  }}
                  className="bg-white text-pink-600 px-6 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg transition-all hover:scale-105"
                >
                  🔥 Shop Now
                </button>
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

        {/* ===== MAIN CONTENT ===== */}
        <div className="max-w-7xl mx-auto px-4 pb-12">
          
          {/* ===== CATEGORY TABS (Dynamic) ===== */}
          {subCategories.length > 1 && (
            <div className="mb-6">
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                {subCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm transition-all duration-300 flex-shrink-0 ${
                      activeTab === cat.id 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30' 
                        : 'bg-white border border-pink-200 text-gray-600 hover:border-pink-400'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ===== FILTER BAR ===== */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {subCategories.length > 1 && (
                  <select 
                    value={selectedSubcategory} 
                    onChange={(e) => {
                      setSelectedSubcategory(e.target.value);
                      setActiveTab(e.target.value === 'all' ? 'all' : e.target.value);
                    }} 
                    className="px-3 py-2 border border-pink-200 rounded-full text-sm bg-white"
                  >
                    <option value="all">All Subcategories</option>
                    {subCategories.filter(c => c.id !== 'all').map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.icon} {sub.name}</option>
                    ))}
                  </select>
                )}
                {brands.length > 1 && (
                  <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-full text-sm bg-white">
                    {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                  </select>
                )}
                <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-full text-sm bg-white">
                  {priceRanges.map(range => <option key={range.id} value={range.id}>{range.name}</option>)}
                </select>
              </div>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white">
                {sortOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </div>

            {/* Active Filters */}
            {(selectedSubcategory !== 'all' || selectedBrand !== 'all' || priceRange !== 'all' || searchTerm) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedSubcategory !== 'all' && (
                  <span className="text-xs px-2 py-1 bg-pink-50 text-pink-600 rounded-full">
                    {subCategories.find(c => c.id === selectedSubcategory)?.name} 
                    <button onClick={() => { setSelectedSubcategory('all'); setActiveTab('all'); }} className="ml-1">×</button>
                  </span>
                )}
                {selectedBrand !== 'all' && (
                  <span className="text-xs px-2 py-1 bg-pink-50 text-pink-600 rounded-full">
                    {selectedBrand} <button onClick={() => setSelectedBrand('all')} className="ml-1">×</button>
                  </span>
                )}
                {priceRange !== 'all' && (
                  <span className="text-xs px-2 py-1 bg-pink-50 text-pink-600 rounded-full">
                    {priceRanges.find(r => r.id === priceRange)?.name} <button onClick={() => setPriceRange('all')} className="ml-1">×</button>
                  </span>
                )}
                {searchTerm && (
                  <span className="text-xs px-2 py-1 bg-pink-50 text-pink-600 rounded-full">
                    Search: {searchTerm} <button onClick={() => setSearchTerm('')} className="ml-1">×</button>
                  </span>
                )}
                <button onClick={clearFilters} className="text-xs text-pink-500 underline">Clear All</button>
              </div>
            )}
          </div>

          {/* ===== RESULTS COUNT ===== */}
          <div className="mb-4">
            <p className="text-sm text-gray-500">Showing <span className="font-semibold text-pink-600">{filteredProducts.length}</span> products</p>
          </div>
          
          {/* ===== BEST SELLERS ===== */}
          {bestSellers.length > 0 && selectedSubcategory === 'all' && (
            <div id="section-best-sellers" className="mb-10 scroll-mt-28">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">🔥 Best Sellers</h2>
                <button className="text-sm text-pink-500 hover:text-pink-600">See All →</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {bestSellers.slice(0, 6).map(product => (
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
            </div>
          )}

          {/* ===== PROMO BANNER ===== */}
          {selectedSubcategory === 'all' && (
            <div className="my-8 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 rounded-2xl p-6 text-center shadow-lg shadow-pink-500/20">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-white text-sm font-semibold tracking-wider">🎯 SPECIAL OFFER</p>
                  <p className="text-white text-2xl font-bold">Up to 50% OFF on Skincare</p>
                  <p className="text-white/80 text-sm">Use code: <span className="font-mono bg-white/20 px-3 py-1 rounded-full">GLOWUP</span></p>
                </div>
                <button className="bg-white text-pink-600 px-6 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg transition-all hover:scale-105">
                  Shop Now →
                </button>
              </div>
            </div>
          )}

          {/* ===== SUBCATEGORY SECTIONS WITH BANNERS (Dynamic) ===== */}
          {Object.keys(groupedProducts).length > 0 ? (
            Object.keys(groupedProducts).map((categoryName) => {
              const productsInCategory = groupedProducts[categoryName] || [];
              if (productsInCategory.length === 0) return null;
              
              // If filter is applied, show only selected
              if (selectedSubcategory !== 'all') {
                const selectedName = subCategories.find(c => c.id === selectedSubcategory)?.name;
                if (selectedName && categoryName !== selectedName) return null;
              }
              
              const categoryId = categoryName.toLowerCase().replace(/ /g, '_');
              
              return (
                <div key={categoryName} id={`section-${categoryId}`} className="mb-12 scroll-mt-28">
                  {/* ✅ SUBCATEGORY BANNER */}
                  <SubcategoryBanner 
                    category={categoryName} 
                    count={productsInCategory.length}
                  />
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {productsInCategory.slice(0, 4).map(product => (
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
                </div>
              );
            })
          ) : (
            <div className="bg-white/80 rounded-2xl p-12 text-center border border-pink-100">
              <div className="text-6xl mb-3">🧴</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">No skincare products found</h3>
              <p className="text-gray-500 text-sm mb-4">Try adjusting your filters</p>
              <button onClick={clearFilters} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full text-sm">Clear All Filters</button>
            </div>
          )}

          {/* ===== LOAD MORE ===== */}
          {filteredProducts.length > 12 && selectedSubcategory === 'all' && (
            <div className="text-center mt-6">
              <button className="bg-white border border-pink-200 text-gray-700 px-8 py-3 rounded-full hover:bg-pink-50 transition-all text-sm font-medium">
                Load More Products ↓
              </button>
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

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}

export default SkincarePage;
