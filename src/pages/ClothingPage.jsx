import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

// Product Card Component
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
            <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">👗</div>
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
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs font-medium px-2 py-1 bg-black/50 rounded-full">Out of Stock</span>
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
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-all bg-green-500 text-white hover:bg-green-600"
            >
              ✓ Go to Cart
            </button>
          ) : (
            <button 
              onClick={handleAddToCart} 
              disabled={product.stock === 0}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
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
            className="w-10 py-2 rounded-xl text-center transition border border-pink-200 hover:bg-pink-50"
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
  
  const [searchTerm, setSearchTerm] = useState('');
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

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/products`);
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

  // Filter and sort
  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
  }, [searchTerm, selectedSubcategory, selectedBrand, selectedSize, selectedGender, sortBy, products, priceRange]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSubcategory('all');
    setSelectedBrand('all');
    setSelectedSize('all');
    setSelectedGender('all');
    setPriceRange('all');
    setSortBy('default');
  };

  const subcategories = useMemo(() => {
    const subs = [...new Set(products.map(p => p.subCategory || p.subcategory || p.category).filter(Boolean))];
    return [{ id: 'all', name: 'All Subcategories' }, ...subs.map(s => ({ id: s, name: s }))];
  }, [products]);

  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return [{ id: 'all', name: 'All Brands' }, ...uniqueBrands.map(b => ({ id: b, name: b }))];
  }, [products]);

  const sizesList = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
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

  // ✅ Complete SEO Schema Collection
  const generateOrganizationSchema = () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MyPinkShop",
    "url": "https://www.mypinkshop.com",
    "logo": "https://www.mypinkshop.com/logo.png",
    "sameAs": [
      "https://www.instagram.com/mypinkshop",
      "https://www.facebook.com/mypinkshop",
      "https://www.pinterest.com/mypinkshop"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-1800-123-4567",
      "contactType": "customer service",
      "availableLanguage": ["English", "Hindi"]
    }
  });

  const generateWebsiteSchema = () => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MyPinkShop",
    "url": "https://www.mypinkshop.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.mypinkshop.com/shop?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  });

  const generateBreadcrumbSchema = () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.mypinkshop.com" },
      { "@type": "ListItem", "position": 2, "name": "Clothing", "item": "https://www.mypinkshop.com/clothing" }
    ]
  });

  const generateCategorySchema = () => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Clothing Collection - MyPinkShop",
    "description": "Shop trendy clothing for women including dresses, tops, kurtis, jeans, and ethnic wear.",
    "numberOfItems": filteredProducts.length,
    "itemListElement": filteredProducts.slice(0, 10).map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://www.mypinkshop.com/product/${product._id}`,
      "name": product.name
    }))
  });

  const generateFAQSchema = () => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is your return policy for clothing?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We accept returns within 7 days of delivery for unused, unwashed items with original tags attached."
        }
      },
      {
        "@type": "Question",
        "name": "How to choose the right size?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Check our size guide on each product page. Measure yourself and compare with the size chart."
        }
      },
      {
        "@type": "Question",
        "name": "Do you offer free shipping?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we offer free shipping on all orders above ₹999."
        }
      },
      {
        "@type": "Question",
        "name": "Are your clothes true to size?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Most of our products run true to size. Please check individual product reviews for specific fit guidance."
        }
      }
    ]
  });

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
        {/* Primary Meta Tags */}
        <title>Clothing for Women - Shop Dresses, Tops, Kurtis & Jeans | MyPinkShop</title>
        <meta name="title" content="Clothing for Women - Shop Dresses, Tops, Kurtis & Jeans | MyPinkShop" />
        <meta name="description" content="Shop trendy clothing for women at MyPinkShop. Explore dresses, tops, kurtis, jeans, skirts, and ethnic wear. ✓Free Shipping ✓Easy Returns ✓Best Prices. Shop now!" />
        <meta name="keywords" content="clothing for women, women's clothing, dresses, tops, kurtis, jeans, ethnic wear, buy clothes online, fashion online, MyPinkShop clothing" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <link rel="canonical" href="https://www.mypinkshop.com/clothing" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mypinkshop.com/clothing" />
        <meta property="og:title" content="Clothing for Women - Shop Dresses, Tops & Kurtis | MyPinkShop" />
        <meta property="og:description" content="Shop trendy clothing for women. Dresses, tops, kurtis, jeans & more. Free shipping on ₹999+" />
        <meta property="og:image" content="https://www.mypinkshop.com/og-image-clothing.jpg" />
        <meta property="og:site_name" content="MyPinkShop" />
        <meta property="og:locale" content="en_IN" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.mypinkshop.com/clothing" />
        <meta property="twitter:title" content="Clothing for Women - MyPinkShop" />
        <meta property="twitter:description" content="Shop trendy clothing for women. Best prices, free shipping." />
        <meta property="twitter:image" content="https://www.mypinkshop.com/og-image-clothing.jpg" />
        
        {/* Schema Scripts */}
        <script type="application/ld+json">{JSON.stringify(generateOrganizationSchema())}</script>
        <script type="application/ld+json">{JSON.stringify(generateWebsiteSchema())}</script>
        <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema())}</script>
        <script type="application/ld+json">{JSON.stringify(generateCategorySchema())}</script>
        <script type="application/ld+json">{JSON.stringify(generateFAQSchema())}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        
        {/* Offer Banner */}
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
                    aria-label="Search clothing products"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
                <button onClick={() => navigate('/wishlist')} className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition" aria-label="Wishlist">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{wishlistCount}</span>}
                </button>
                
                <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition" aria-label="Cart">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{cartCount}</span>}
                </Link>
                
                {user ? <Avatar user={user} onLogout={logout} /> : 
                  <Link to="/login" className="p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition" aria-label="Login">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                }
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">Clothing</span>
          </div>
        </div>

        {/* Title Section */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Clothing Collection for Women 👗</h1>
          <p className="text-gray-500 mt-2">Discover the latest fashion trends. Shop dresses, tops, kurtis, jeans & more.</p>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-16">
          
          {/* SEO Description - Visible but subtle */}
          <div className="text-center mb-8">
            <div className="text-gray-400 text-xs max-w-3xl mx-auto leading-relaxed">
              <p>Discover the latest fashion trends at MyPinkShop, India's premier online destination for women's clothing. From casual daily wear to stunning ethnic outfits, our collection has something for every occasion. Browse through our wide range of dresses, tops, kurtis, jeans, skirts, and traditional wear.</p>
              <p className="mt-2">Premium quality fabrics, affordable prices, and free shipping on orders above ₹999. Whether you're looking for office wear, party wear, or comfortable home wear, find your perfect style at MyPinkShop.</p>
            </div>
          </div>
          
          {/* Filter Bar */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="hidden md:flex flex-wrap gap-3">
                <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white focus:outline-none focus:border-pink-500" aria-label="Filter by subcategory">
                  {subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                </select>
                <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white" aria-label="Filter by brand">
                  {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
                <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white" aria-label="Filter by size">
                  <option value="all">All Sizes</option>
                  {sizesList.map(size => <option key={size} value={size}>{size}</option>)}
                </select>
                <select value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)} className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white" aria-label="Filter by gender">
                  {genderOptions.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white" aria-label="Filter by price">
                  {priceRanges.map(range => <option key={range.id} value={range.id}>{range.name}</option>)}
                </select>
              </div>

              <button onClick={() => setShowFilters(!showFilters)} className="md:hidden px-5 py-2 border border-pink-200 rounded-full text-sm flex items-center gap-2 bg-white">
                Filters 🔽
              </button>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-5 py-2 border border-pink-200 rounded-full text-sm bg-white" aria-label="Sort products">
                {sortOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </div>

            {/* Active Filters */}
            {(selectedSubcategory !== 'all' || selectedBrand !== 'all' || selectedSize !== 'all' || selectedGender !== 'all' || priceRange !== 'all' || searchTerm) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedSubcategory !== 'all' && <span className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full">Subcategory: {selectedSubcategory} <button onClick={() => setSelectedSubcategory('all')} className="ml-1">×</button></span>}
                {selectedBrand !== 'all' && <span className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full">Brand: {selectedBrand} <button onClick={() => setSelectedBrand('all')}>×</button></span>}
                {selectedSize !== 'all' && <span className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full">Size: {selectedSize} <button onClick={() => setSelectedSize('all')}>×</button></span>}
                {selectedGender !== 'all' && <span className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full">Gender: {genderOptions.find(g => g.id === selectedGender)?.name} <button onClick={() => setSelectedGender('all')}>×</button></span>}
                {priceRange !== 'all' && <span className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full">Price: {priceRanges.find(r => r.id === priceRange)?.name} <button onClick={() => setPriceRange('all')}>×</button></span>}
                {searchTerm && <span className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-full">Search: {searchTerm} <button onClick={() => setSearchTerm('')}>×</button></span>}
                <button onClick={clearFilters} className="text-xs px-3 py-1 text-pink-500 underline">Clear All</button>
              </div>
            )}
          </div>

          {/* Mobile Filters Modal */}
          {showFilters && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)}>
              <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-gray-800">Filters</h3>
                  <button onClick={() => setShowFilters(false)} className="text-gray-400 text-2xl">✕</button>
                </div>
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Subcategory</label><select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} className="w-full p-2 border border-pink-200 rounded-lg">{subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Brand</label><select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full p-2 border border-pink-200 rounded-lg">{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Size</label><select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="w-full p-2 border border-pink-200 rounded-lg"><option value="all">All Sizes</option>{sizesList.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Gender</label><select value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)} className="w-full p-2 border border-pink-200 rounded-lg">{genderOptions.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Price</label><select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full p-2 border border-pink-200 rounded-lg">{priceRanges.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                  <button onClick={clearFilters} className="w-full py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg mt-4">Clear All</button>
                </div>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-sm text-gray-500">Showing <span className="font-semibold text-pink-600">{filteredProducts.length}</span> of <span className="font-semibold text-pink-600">{products.length}</span> products</p>
          </div>
          
          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-16 text-center border border-pink-100">
              <div className="text-6xl mb-4">👗</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search term</p>
              <button onClick={clearFilters} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full text-sm font-medium hover:shadow-lg transition">Clear All Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product._id} 
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

        {/* FAQ Section - Rich Snippet */}
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
        <footer className="bg-gray-900 text-gray-400 py-12 mt-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm">© 2026 MyPinkShop. All rights reserved.</p>
            <p className="text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
          </div>
        </footer>
      </div>
    </>
  );
}

export default ClothingPage;
