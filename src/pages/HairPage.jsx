import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

// Ultra Premium Product Card Component
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
    window.location.href = '/cart';
  };

  const handleWishlistToggle = () => {
    const productId = product._id || product.id;
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 border border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product._id || product.id}`}>
        <div className="relative h-56 sm:h-64 md:h-72 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          {product.images && product.images[0] && !imgError ? (
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className={`w-full h-full object-contain p-4 transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-light text-gray-300">
              {product.name?.charAt(0) || 'P'}
            </div>
          )}
          {product.badge && (
            <span className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-light tracking-wide">
              {product.badge}
            </span>
          )}
          {product.isNew && (
            <span className="absolute top-4 right-4 bg-amber-600/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-light tracking-wide">
              NEW
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white text-sm font-light px-4 py-2 bg-black/50 rounded-full tracking-wide">Out of Stock</span>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-5">
        <Link to={`/product/${product._id || product.id}`}>
          <h3 className="font-medium text-gray-800 text-base mb-1 line-clamp-2 hover:text-gray-600 transition tracking-wide">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-400 mb-2 tracking-wide">{product.brand || 'MyPinkShop'}</p>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <div className="flex text-amber-400 text-xs">
              {'★'.repeat(Math.floor(product.rating || 4))}
              {'☆'.repeat(5 - Math.floor(product.rating || 4))}
            </div>
            <span className="text-xs text-gray-400">({product.rating || 4})</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold text-gray-800">₹{product.price}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
                <span className="text-xs text-emerald-600 font-medium">
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
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Go to Cart
            </button>
          ) : (
            <button 
              onClick={handleAddToCart} 
              disabled={product.stock === 0}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                product.stock > 0 
                  ? 'bg-black text-white hover:bg-gray-800 hover:shadow-lg' 
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
                ? 'border-rose-200 bg-rose-50 text-rose-500' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {isInWishlist(product._id || product.id) ? '❤︎' : '♡'}
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
        
        // Filter hair products
        const hairProducts = data.filter(p => 
          (p.mainCategory === 'Hair' || p.category === 'Hair' || p.category === 'hair') &&
          p.status === 'active'
        ).map(p => ({
          ...p,
          id: p._id,
          subcategory: p.subCategory || p.subcategory,
          hairConcerns: p.hairConcerns || [],
          hairType: p.hairType
        }));
        
        setProducts(hairProducts);
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

    // Subcategory filter
    if (selectedSubcategory !== 'all') {
      filtered = filtered.filter(p => p.subcategory === selectedSubcategory);
    }

    // Concern filter
    if (selectedConcern !== 'all') {
      filtered = filtered.filter(p => p.hairConcerns?.includes(selectedConcern));
    }

    // Brand filter
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(p => p.brand === selectedBrand);
    }

    // Hair type filter
    if (selectedHairType !== 'all') {
      filtered = filtered.filter(p => p.hairType === selectedHairType);
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

  // Get unique values for dropdowns
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.mainCategory || p.category).filter(Boolean))];
    return [{ id: 'all', name: 'All Categories' }, ...cats.map(c => ({ id: c, name: c }))];
  }, [products]);

  const subcategories = useMemo(() => {
    const subs = [...new Set(products.map(p => p.subcategory).filter(Boolean))];
    return [{ id: 'all', name: 'All Subcategories' }, ...subs.map(s => ({ id: s, name: s }))];
  }, [products]);

  const concerns = useMemo(() => {
    const allConcerns = products.flatMap(p => p.hairConcerns || []).filter(Boolean);
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm tracking-wide">Loading collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      
      {/* Top Bar - Minimal Luxury */}
      <div className="bg-black text-white py-2.5 text-center text-xs tracking-wider">
        <div className="max-w-7xl mx-auto px-4">
          <span>FREE SHIPPING ON ORDERS ABOVE ₹999 • EXTRA 10% OFF ON FIRST ORDER</span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="shrink-0">
              <h1 className="text-2xl font-light tracking-[0.3em] text-black">MY PINK SHOP</h1>
            </Link>

            <div className="flex-1 max-w-xl">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search hair care..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-5 py-3 border border-gray-200 rounded-full focus:outline-none focus:border-black transition-all bg-white text-sm tracking-wide"
                />
                <button 
                  onClick={() => setSearchTerm(searchTerm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button onClick={() => navigate('/wishlist')} className="relative text-gray-600 hover:text-black transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{wishlistCount}</span>}
              </button>
              
              <Link to="/cart" className="relative text-gray-600 hover:text-black transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
              </Link>
              
              {user ? <Avatar user={user} onLogout={logout} /> : 
                <Link to="/login" className="text-gray-600 hover:text-black transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              }
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-black mb-4">
            Hair Care
          </h1>
          <p className="text-gray-500 text-base max-w-2xl mx-auto font-light tracking-wide">
            Discover our curated collection of premium hair care products for healthy, beautiful hair.
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-xs">
          <Link to="/" className="text-gray-400 hover:text-black transition">Home</Link>
          <span className="text-gray-300">/</span>
          <span className="text-black font-medium">Hair Care</span>
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
                className="px-4 py-2 border border-gray-200 rounded-full text-sm bg-white focus:outline-none focus:border-black cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* Subcategory Dropdown */}
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm bg-white focus:outline-none focus:border-black cursor-pointer"
              >
                {subcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>

              {/* Concern Dropdown */}
              <select
                value={selectedConcern}
                onChange={(e) => setSelectedConcern(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm bg-white focus:outline-none focus:border-black cursor-pointer"
              >
                {concerns.map(concern => (
                  <option key={concern.id} value={concern.id}>{concern.name}</option>
                ))}
              </select>

              {/* Brand Dropdown */}
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm bg-white focus:outline-none focus:border-black cursor-pointer"
              >
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>

              {/* Hair Type Dropdown */}
              <select
                value={selectedHairType}
                onChange={(e) => setSelectedHairType(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm bg-white focus:outline-none focus:border-black cursor-pointer"
              >
                {hairTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>

              {/* Price Range Dropdown */}
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm bg-white focus:outline-none focus:border-black cursor-pointer"
              >
                {priceRanges.map(range => (
                  <option key={range.id} value={range.id}>{range.name}</option>
                ))}
              </select>
            </div>

            {/* Mobile Filter Button */}
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className="md:hidden px-5 py-2 border border-gray-200 rounded-full text-sm flex items-center gap-2"
            >
              <span>Filters</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-5 py-2 border border-gray-200 rounded-full text-sm bg-white focus:outline-none focus:border-black cursor-pointer"
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
                <span className="text-xs px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory('all')} className="text-gray-400 hover:text-black">×</button>
                </span>
              )}
              {selectedSubcategory !== 'all' && (
                <span className="text-xs px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">
                  {selectedSubcategory}
                  <button onClick={() => setSelectedSubcategory('all')} className="text-gray-400 hover:text-black">×</button>
                </span>
              )}
              {selectedConcern !== 'all' && (
                <span className="text-xs px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">
                  {selectedConcern}
                  <button onClick={() => setSelectedConcern('all')} className="text-gray-400 hover:text-black">×</button>
                </span>
              )}
              {selectedBrand !== 'all' && (
                <span className="text-xs px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">
                  {selectedBrand}
                  <button onClick={() => setSelectedBrand('all')} className="text-gray-400 hover:text-black">×</button>
                </span>
              )}
              {selectedHairType !== 'all' && (
                <span className="text-xs px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">
                  {hairTypes.find(t => t.id === selectedHairType)?.name}
                  <button onClick={() => setSelectedHairType('all')} className="text-gray-400 hover:text-black">×</button>
                </span>
              )}
              {priceRange !== 'all' && (
                <span className="text-xs px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">
                  {priceRanges.find(r => r.id === priceRange)?.name}
                  <button onClick={() => setPriceRange('all')} className="text-gray-400 hover:text-black">×</button>
                </span>
              )}
              {searchTerm && (
                <span className="text-xs px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-black">×</button>
                </span>
              )}
              <button onClick={clearFilters} className="text-xs px-3 py-1 text-black underline hover:no-underline">
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
                <h3 className="font-medium text-lg">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-400 text-2xl">×</button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-sm">
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subcategory</label>
                  <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-sm">
                    {subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Concern</label>
                  <select value={selectedConcern} onChange={(e) => setSelectedConcern(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-sm">
                    {concerns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Brand</label>
                  <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-sm">
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Hair Type</label>
                  <select value={selectedHairType} onChange={(e) => setSelectedHairType(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-sm">
                    {hairTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-sm">
                    {priceRanges.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <button onClick={clearFilters} className="w-full py-3 bg-black text-white rounded-xl text-sm">Clear All Filters</button>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 tracking-wide">
            Showing <span className="text-black font-medium">{filteredProducts.length}</span> of{' '}
            <span className="text-black font-medium">{products.length}</span> products
          </p>
        </div>
        
        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4 text-gray-300">∅</div>
            <h3 className="text-xl font-light text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-400 text-sm mb-6">Try adjusting your filters</p>
            <button onClick={clearFilters} className="px-6 py-2 bg-black text-white rounded-full text-sm hover:bg-gray-800 transition">
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

      {/* Footer */}
      <footer className="bg-black text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white text-lg font-light tracking-wide mb-4">MY PINK SHOP</h3>
              <p className="text-sm font-light">Luxury beauty and hair care for the modern woman.</p>
            </div>
            <div>
              <h4 className="text-white text-sm font-medium mb-4">SHOP</h4>
              <ul className="space-y-2 text-sm font-light">
                <li><Link to="/skincare" className="hover:text-white transition">Skincare</Link></li>
                <li><Link to="/makeup" className="hover:text-white transition">Makeup</Link></li>
                <li><Link to="/hair" className="hover:text-white transition">Hair Care</Link></li>
                <li><Link to="/clothing" className="hover:text-white transition">Clothing</Link></li>
                <li><Link to="/accessories" className="hover:text-white transition">Accessories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-medium mb-4">SUPPORT</h4>
              <ul className="space-y-2 text-sm font-light">
                <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><Link to="/faqs" className="hover:text-white transition">FAQs</Link></li>
                <li><Link to="/shipping" className="hover:text-white transition">Shipping</Link></li>
                <li><Link to="/returns" className="hover:text-white transition">Returns</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-medium mb-4">FOLLOW</h4>
              <ul className="space-y-2 text-sm font-light">
                <li><a href="#" className="hover:text-white transition">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition">TikTok</a></li>
                <li><a href="#" className="hover:text-white transition">Pinterest</a></li>
                <li><a href="#" className="hover:text-white transition">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-gray-800">
            <p className="text-xs font-light">© 2026 MyPinkShop. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HairPage;
