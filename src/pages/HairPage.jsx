import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

// Premium Product Card Component
const ProductCard = ({ product, addToCart, isInWishlist, addToWishlist, removeFromWishlist }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleGoToCart = () => {
    navigate('/cart');
  };

  const handleWishlistToggle = () => {
    const productId = product._id || product.id;
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(product);
    }
  };

  const navigate = useNavigate();

  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-pink-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product._id || product.id}`}>
        <div className="relative h-56 sm:h-64 md:h-72 overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
          {product.images && product.images[0] && !imgError ? (
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className={`w-full h-full object-contain p-4 transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl font-light text-pink-300">
              ✨
            </div>
          )}
          {product.badge && (
            <span className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-3 py-1 rounded-full shadow-md">
              {product.badge}
            </span>
          )}
          {product.isNew && (
            <span className="absolute top-4 right-4 bg-amber-500 text-white text-xs px-3 py-1 rounded-full shadow-md">
              NEW
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white text-sm px-4 py-2 bg-black/50 rounded-full">Out of Stock</span>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-5">
        <Link to={`/product/${product._id || product.id}`}>
          <h3 className="font-semibold text-gray-800 text-base mb-1 line-clamp-2 hover:text-pink-500 transition">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-400 mb-2">{product.brand || 'MyPinkShop'}</p>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <div className="flex text-amber-400 text-sm">
              {'★'.repeat(Math.floor(product.rating || 4))}
              {'☆'.repeat(5 - Math.floor(product.rating || 4))}
            </div>
            <span className="text-xs text-gray-400">({product.rating || 4})</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-pink-600">₹{product.price}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
                <span className="text-xs text-green-500 font-medium">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex gap-3">
          {isAdded ? (
            <button 
              onClick={handleGoToCart}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all bg-green-500 text-white hover:bg-green-600"
            >
              Go to Cart
            </button>
          ) : (
            <button 
              onClick={handleAddToCart} 
              disabled={product.stock === 0}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                product.stock > 0 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Add to Cart
            </button>
          )}
          
          <button 
            onClick={handleWishlistToggle}
            className={`w-11 py-2.5 rounded-xl text-center transition-all border ${
              isInWishlist(product._id || product.id) 
                ? 'border-pink-200 bg-pink-50 text-pink-500' 
                : 'border-pink-100 hover:border-pink-200 hover:bg-pink-50'
            }`}
          >
            {isInWishlist(product._id || product.id) ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
};

function HairPage() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [selectedConcern, setSelectedConcern] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedHairType, setSelectedHairType] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState('all');

  const API_URL = 'https://mypinkshop-dr93.vercel.app';

  // Load products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/products`);
        
        if (!response.ok) {
          throw new Error('Failed to load products');
        }
        
        let data = await response.json();
        
        // Filter hair products - check both mainCategory and category
        const hairProducts = data.filter(p => 
          (p.mainCategory === 'Hair' || p.category === 'Hair' || p.category === 'hair' || p.mainCategory === 'HAIR') &&
          p.status === 'active'
        ).map(p => ({
          ...p,
          id: p._id,
          subcategory: p.subCategory || p.subcategory || p.category,
          hairConcerns: p.hairConcerns || p.concerns || [],
          hairType: p.hairType || p.skinType
        }));
        
        setProducts(hairProducts);
        console.log('Hair products loaded:', hairProducts.length);
        console.log('Subcategories found:', [...new Set(hairProducts.map(p => p.subcategory))]);
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.mainCategory === selectedCategory || p.category === selectedCategory);
    }

    // Subcategory filter - FIXED
    if (selectedSubcategory !== 'all') {
      filtered = filtered.filter(p => {
        const productSub = (p.subCategory || p.subcategory || p.category || '').toLowerCase();
        const selected = selectedSubcategory.toLowerCase();
        return productSub === selected;
      });
    }

    // Concern filter
    if (selectedConcern !== 'all') {
      filtered = filtered.filter(p => {
        const concerns = p.hairConcerns || p.concerns || [];
        return concerns.includes(selectedConcern);
      });
    }

    // Brand filter
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(p => p.brand === selectedBrand);
    }

    // Hair type filter
    if (selectedHairType !== 'all') {
      filtered = filtered.filter(p => (p.hairType || p.skinType) === selectedHairType);
    }

    // Price filter
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
    if (minPrice) min = parseFloat(minPrice);
    if (maxPrice) max = parseFloat(maxPrice);
    filtered = filtered.filter(p => p.price >= min && p.price <= max);

    // Sorting
    switch(sortBy) {
      case 'price_low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price_high': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest': filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      default: break;
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, selectedSubcategory, selectedConcern, selectedBrand, selectedHairType, minPrice, maxPrice, sortBy, products, priceRange]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSelectedConcern('all');
    setSelectedBrand('all');
    setSelectedHairType('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('default');
    setPriceRange('all');
  };

  // Get unique values for dropdowns - FIXED
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.mainCategory || p.category).filter(Boolean))];
    return [{ id: 'all', name: 'All Categories' }, ...cats.map(c => ({ id: c, name: c }))];
  }, [products]);

  // FIXED: Subcategories - properly extract from products
  const subcategories = useMemo(() => {
    const subs = [...new Set(products.map(p => {
      return p.subCategory || p.subcategory || p.category;
    }).filter(Boolean))];
    console.log('Available subcategories:', subs);
    return [{ id: 'all', name: 'All Subcategories' }, ...subs.map(s => ({ id: s, name: s }))];
  }, [products]);

  const concerns = useMemo(() => {
    const allConcerns = products.flatMap(p => p.hairConcerns || p.concerns || []).filter(Boolean);
    const uniqueConcerns = [...new Set(allConcerns)];
    return [{ id: 'all', name: 'All Concerns' }, ...uniqueConcerns.map(c => ({ id: c, name: c }))];
  }, [products]);

  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return [{ id: 'all', name: 'All Brands' }, ...uniqueBrands.map(b => ({ id: b, name: b }))];
  }, [products]);

  const hairTypes = [
    { id: 'all', name: 'All Hair Types' },
    { id: 'dry', name: 'Dry Hair' },
    { id: 'oily', name: 'Oily Hair' },
    { id: 'normal', name: 'Normal Hair' },
    { id: 'curly', name: 'Curly Hair' },
    { id: 'wavy', name: 'Wavy Hair' },
    { id: 'straight', name: 'Straight Hair' },
    { id: 'damaged', name: 'Damaged Hair' },
    { id: 'colored', name: 'Color Treated' },
  ];

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
          <p className="text-gray-500">Loading collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      
      {/* Premium Top Bar - ₹499 Free Shipping */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
          <span>✨</span>
          <span>FREE SHIPPING ON ORDERS ABOVE ₹499</span>
          <span className="hidden sm:inline">•</span>
          <span>EXTRA 10% OFF ON FIRST ORDER</span>
          <span className="hidden sm:inline">•</span>
          <span>CASH ON DELIVERY AVAILABLE</span>
          <span>✨</span>
        </div>
      </div>

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

            <div className="flex-1 max-w-md lg:max-w-2xl">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search hair care products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-gray-50"
                />
                <button 
                  onClick={() => setSearchTerm(searchTerm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 transition"
                >
                  🔍
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

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-pink-100 via-rose-100 to-pink-100">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4">
            Hair Care Collection
          </h1>
          <p className="text-gray-600 text-base max-w-2xl mx-auto">
            Discover our curated collection of premium hair care products for healthy, beautiful hair.
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
          <span className="text-gray-400">/</span>
          <span className="text-pink-600 font-medium">Hair Care</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        
        {/* Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Desktop Filters */}
            <div className="hidden md:flex flex-wrap gap-3">
              {/* Category Dropdown */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* Subcategory Dropdown - FIXED */}
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                {subcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>

              {/* Concern Dropdown */}
              <select
                value={selectedConcern}
                onChange={(e) => setSelectedConcern(e.target.value)}
                className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                {concerns.map(concern => (
                  <option key={concern.id} value={concern.id}>{concern.name}</option>
                ))}
              </select>

              {/* Brand Dropdown */}
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>

              {/* Hair Type Dropdown */}
              <select
                value={selectedHairType}
                onChange={(e) => setSelectedHairType(e.target.value)}
                className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                {hairTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>

              {/* Price Range Dropdown */}
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                {priceRanges.map(range => (
                  <option key={range.id} value={range.id}>{range.name}</option>
                ))}
              </select>
            </div>

            {/* Mobile Filter Button */}
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className="md:hidden px-5 py-2 border border-pink-200 rounded-full text-sm flex items-center gap-2 bg-white"
            >
              <span>Filters</span>
              <span>🔽</span>
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-5 py-2 border border-pink-200 rounded-full text-sm bg-white focus:outline-none focus:border-pink-500 cursor-pointer"
            >
              {sortOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </div>

          {/* Active Filters Display */}
          {(selectedCategory !== 'all' || selectedSubcategory !== 'all' || selectedConcern !== 'all' || selectedBrand !== 'all' || selectedHairType !== 'all' || priceRange !== 'all' || searchTerm) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedCategory !== 'all' && (
                <span className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full flex items-center gap-2">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory('all')} className="text-pink-400 hover:text-pink-600">×</button>
                </span>
              )}
              {selectedSubcategory !== 'all' && (
                <span className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full flex items-center gap-2">
                  {selectedSubcategory}
                  <button onClick={() => setSelectedSubcategory('all')} className="text-pink-400 hover:text-pink-600">×</button>
                </span>
              )}
              {selectedConcern !== 'all' && (
                <span className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full flex items-center gap-2">
                  {selectedConcern}
                  <button onClick={() => setSelectedConcern('all')} className="text-pink-400 hover:text-pink-600">×</button>
                </span>
              )}
              {selectedBrand !== 'all' && (
                <span className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full flex items-center gap-2">
                  {selectedBrand}
                  <button onClick={() => setSelectedBrand('all')} className="text-pink-400 hover:text-pink-600">×</button>
                </span>
              )}
              {selectedHairType !== 'all' && (
                <span className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full flex items-center gap-2">
                  {hairTypes.find(t => t.id === selectedHairType)?.name}
                  <button onClick={() => setSelectedHairType('all')} className="text-pink-400 hover:text-pink-600">×</button>
                </span>
              )}
              {priceRange !== 'all' && (
                <span className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full flex items-center gap-2">
                  {priceRanges.find(r => r.id === priceRange)?.name}
                  <button onClick={() => setPriceRange('all')} className="text-pink-400 hover:text-pink-600">×</button>
                </span>
              )}
              {searchTerm && (
                <span className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full flex items-center gap-2">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm('')} className="text-pink-400 hover:text-pink-600">×</button>
                </span>
              )}
              <button onClick={clearFilters} className="text-xs px-3 py-1 text-pink-500 underline hover:no-underline">
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Mobile Filters Modal */}
        {showFilters && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)}>
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-800 text-lg">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-400 text-2xl">✕</button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full p-3 border border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500">
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                  <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} className="w-full p-3 border border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500">
                    {subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Concern</label>
                  <select value={selectedConcern} onChange={(e) => setSelectedConcern(e.target.value)} className="w-full p-3 border border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500">
                    {concerns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                  <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full p-3 border border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500">
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hair Type</label>
                  <select value={selectedHairType} onChange={(e) => setSelectedHairType(e.target.value)} className="w-full p-3 border border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500">
                    {hairTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full p-3 border border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500">
                    {priceRanges.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <button onClick={clearFilters} className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition">
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-pink-600">{filteredProducts.length}</span> of{' '}
            <span className="font-semibold text-pink-600">{products.length}</span> products
          </p>
        </div>
        
        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-16 text-center border border-pink-100">
            <div className="text-6xl mb-4">💇‍♀️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No hair care products found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search term</p>
            <button onClick={clearFilters} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full text-sm font-medium hover:shadow-lg transition">
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map(product => (
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
        )}
      </div>

      {/* Premium Footer */}
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
              <p className="text-sm">Luxury beauty and hair care for the modern woman.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/skincare" className="hover:text-pink-500 transition">Skincare</Link></li>
                <li><Link to="/makeup" className="hover:text-pink-500 transition">Makeup</Link></li>
                <li><Link to="/hair" className="hover:text-pink-500 transition">Hair Care</Link></li>
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
    </div>
  );
}

export default HairPage;
