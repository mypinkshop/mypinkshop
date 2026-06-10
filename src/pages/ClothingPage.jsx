import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';

// Product Card Component (optimized for SEO)
const ProductCard = ({ product, addToCart, isInWishlist, addToWishlist, removeFromWishlist }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-pink-100">
      <Link to={`/product/${product._id || product.id}`}>
        <div className="relative h-48 sm:h-52 md:h-60 overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
          {product.images && product.images[0] && !imgError ? (
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">
              👗
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
            {isInWishlist(product._id || product.id) ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
};

function ClothingPage() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);

  const API_URL = 'https://api.mypinkshop.com';

  // Fetch offer banner
  useEffect(() => {
    fetch(`${API_URL}/api/offers/active-offer`)
      .then(res => res.json())
      .then(data => setOffer(data))
      .catch(err => console.error('Offer fetch error:', err));
  }, []);

  // Load products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/products?category=Clothing&limit=100`);
        
        if (!response.ok) {
          throw new Error('Failed to load products');
        }
        
        let data = await response.json();
        let productList = Array.isArray(data) ? data : data.products || [];
        
        const clothingProducts = productList.filter(p => 
          (p.mainCategory === 'Clothing' || p.category === 'Clothing' || p.category === 'clothing') &&
          p.status === 'active'
        ).map(p => ({
          ...p,
          id: p._id,
          subcategory: p.subCategory || p.subcategory || p.category,
          sizes: p.sizes || [],
          gender: p.gender || 'unisex'
        }));
        
        setProducts(clothingProducts);
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

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.mainCategory === selectedCategory || p.category === selectedCategory);
    }

    if (selectedSubcategory !== 'all') {
      filtered = filtered.filter(p => {
        const productSub = (p.subCategory || p.subcategory || p.category || '').toLowerCase();
        const selected = selectedSubcategory.toLowerCase();
        return productSub === selected;
      });
    }

    if (selectedBrand !== 'all') {
      filtered = filtered.filter(p => p.brand === selectedBrand);
    }

    if (selectedSize !== 'all') {
      filtered = filtered.filter(p => p.sizes?.includes(selectedSize));
    }

    if (selectedGender !== 'all') {
      filtered = filtered.filter(p => p.gender?.toLowerCase() === selectedGender.toLowerCase());
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
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, selectedSubcategory, selectedBrand, selectedSize, selectedGender, sortBy, products, priceRange]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSelectedBrand('all');
    setSelectedSize('all');
    setSelectedGender('all');
    setPriceRange('all');
    setSortBy('default');
  };

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.mainCategory || p.category).filter(Boolean))];
    return [{ id: 'all', name: 'All Categories' }, ...cats.map(c => ({ id: c, name: c }))];
  }, [products]);

  const subcategories = useMemo(() => {
    const subs = [...new Set(products.map(p => p.subCategory || p.subcategory || p.category).filter(Boolean))];
    return [{ id: 'all', name: 'All Subcategories' }, ...subs.map(s => ({ id: s, name: s }))];
  }, [products]);

  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return [{ id: 'all', name: 'All Brands' }, ...uniqueBrands.map(b => ({ id: b, name: b }))];
  }, [products]);

  const sizesList = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const genderOptions = [
    { id: 'all', name: 'All Genders' },
    { id: 'women', name: "Women's" },
    { id: 'men', name: "Men's" },
    { id: 'kids', name: "Kids" },
    { id: 'unisex', name: "Unisex" }
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

  // ✅ SEO: Generate Category Schema
  const generateCategorySchema = () => {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Clothing Collection - MyPinkShop",
      "description": "Shop trendy clothing for women at MyPinkShop. Explore dresses, tops, kurtis, jeans, and ethnic wear. Free shipping available.",
      "numberOfItems": filteredProducts.length,
      "itemListElement": filteredProducts.slice(0, 10).map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://www.mypinkshop.com/product/${product._id}`
      }))
    };
  };

  // ✅ SEO: Generate Breadcrumb Schema
  const generateBreadcrumbSchema = () => {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.mypinkshop.com" },
        { "@type": "ListItem", "position": 2, "name": "Clothing", "item": "https://www.mypinkshop.com/clothing" }
      ]
    };
  };

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
    <>
      <Helmet>
        <title>Clothing for Women - Dresses, Tops, Kurtis & More | MyPinkShop</title>
        <meta name="description" content="Shop trendy clothing for women at MyPinkShop. Explore dresses, tops, kurtis, jeans, and ethnic wear. ✓Free Shipping ✓Easy Returns ✓Best Prices. Shop now!" />
        <meta name="keywords" content="clothing for women, dresses, tops, kurtis, jeans, ethnic wear, buy clothes online" />
        <link rel="canonical" href="https://www.mypinkshop.com/clothing" />
        <meta property="og:title" content="Clothing for Women - MyPinkShop" />
        <meta property="og:description" content="Shop trendy clothing for women. Dresses, tops, kurtis, jeans & more. Free shipping available." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mypinkshop.com/clothing" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Clothing for Women - MyPinkShop" />
        <meta name="twitter:description" content="Shop trendy clothing for women. Best prices, free shipping." />
        <script type="application/ld+json">{JSON.stringify(generateCategorySchema())}</script>
        <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema())}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        
        {/* Dynamic Offer Banner */}
        <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
          <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
            <span>✨</span>
            <span>{offer?.description || 'FREE SHIPPING ON ALL ORDERS'}</span>
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
                    placeholder="Search clothing..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
              Clothing Collection 👗
            </h1>
            <p className="text-gray-600 text-base max-w-2xl mx-auto">
              Fashion that speaks your style. Explore our latest collection of dresses, tops, kurtis, and more.
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">Clothing</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-16">
          
          {/* Category Description - SEO Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-pink-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Shop Trendy Clothing for Women</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Discover the latest fashion trends at MyPinkShop. From casual daily wear to stunning ethnic outfits, 
              our clothing collection has something for every occasion. Browse through our wide range of dresses, 
              tops, kurtis, jeans, skirts, and traditional wear. Premium quality fabrics, affordable prices, 
              and free shipping on orders above ₹999. Whether you're looking for office wear, party wear, 
              or comfortable home wear, find your perfect style at MyPinkShop.
            </p>
          </div>
          
          {/* Filter Bar */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              
              {/* Desktop Filters */}
              <div className="hidden md:flex flex-wrap gap-3">
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  {subcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>

                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>

                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  <option value="all">All Sizes</option>
                  {sizesList.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>

                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  {genderOptions.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>

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
            {(selectedCategory !== 'all' || selectedSubcategory !== 'all' || selectedBrand !== 'all' || selectedSize !== 'all' || selectedGender !== 'all' || priceRange !== 'all' || searchTerm) && (
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
                {selectedBrand !== 'all' && (
                  <span className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full flex items-center gap-2">
                    {selectedBrand}
                    <button onClick={() => setSelectedBrand('all')} className="text-pink-400 hover:text-pink-600">×</button>
                  </span>
                )}
                {selectedSize !== 'all' && (
                  <span className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full flex items-center gap-2">
                    Size: {selectedSize}
                    <button onClick={() => setSelectedSize('all')} className="text-pink-400 hover:text-pink-600">×</button>
                  </span>
                )}
                {selectedGender !== 'all' && (
                  <span className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full flex items-center gap-2">
                    {genderOptions.find(g => g.id === selectedGender)?.name}
                    <button onClick={() => setSelectedGender('all')} className="text-pink-400 hover:text-pink-600">×</button>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                    <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} className="w-full p-3 border border-pink-200 rounded-xl text-sm">
                      {subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                    <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full p-3 border border-pink-200 rounded-xl text-sm">
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                    <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="w-full p-3 border border-pink-200 rounded-xl text-sm">
                      <option value="all">All Sizes</option>
                      {sizesList.map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)} className="w-full p-3 border border-pink-200 rounded-xl text-sm">
                      {genderOptions.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                    <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full p-3 border border-pink-200 rounded-xl text-sm">
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
              <div className="text-6xl mb-4">👗</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No clothing products found</h3>
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

        {/* FAQ Section - SEO Rich Results */}
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-b border-pink-100 pb-3">
                <h3 className="font-semibold text-gray-800 text-sm mb-1">What is your return policy for clothing?</h3>
                <p className="text-gray-600 text-sm">We accept returns within 7 days of delivery for unused, unwashed items with original tags attached.</p>
              </div>
              <div className="border-b border-pink-100 pb-3">
                <h3 className="font-semibold text-gray-800 text-sm mb-1">How to choose the right size?</h3>
                <p className="text-gray-600 text-sm">Check our size guide on each product page. Measure yourself and compare with the size chart.</p>
              </div>
              <div className="border-b border-pink-100 pb-3">
                <h3 className="font-semibold text-gray-800 text-sm mb-1">Do you offer free shipping?</h3>
                <p className="text-gray-600 text-sm">Yes, we offer free shipping on all orders above ₹999.</p>
              </div>
              <div className="border-b border-pink-100 pb-3">
                <h3 className="font-semibold text-gray-800 text-sm mb-1">Are your clothes true to size?</h3>
                <p className="text-gray-600 text-sm">Most of our products run true to size. Please check individual product reviews for specific fit guidance.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12 sm:py-16 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm">© 2026 MyPinkShop. All rights reserved.</p>
            <p className="text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
          </div>
        </footer>
      </div>
    </>
  );
}

export default ClothingPage;
