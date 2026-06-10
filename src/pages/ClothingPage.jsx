import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

// Product Card Component (same as before)
const ProductCard = ({ product, addToCart, isInWishlist, addToWishlist, removeFromWishlist }) => {
  // ... your existing ProductCard code (unchanged)
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
            <div className="w-full h-full flex items-center justify-center text-5xl font-light text-pink-300">👗</div>
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
            <button onClick={handleGoToCart} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all bg-green-500 text-white hover:bg-green-600">Go to Cart</button>
          ) : (
            <button onClick={handleAddToCart} disabled={product.stock === 0} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${product.stock > 0 ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Add to Cart</button>
          )}
          <button onClick={handleWishlistToggle} className={`w-11 py-2.5 rounded-xl text-center transition-all border ${isInWishlist(product._id || product.id) ? 'border-pink-200 bg-pink-50 text-pink-500' : 'border-pink-100 hover:border-pink-200 hover:bg-pink-50'}`}>
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
  const [offer, setOffer] = useState(null); // ✅ ADD THIS
  
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

  // ✅ ADD THIS useEffect for offer banner
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
        const response = await fetch(`${API_URL}/api/products`);
        
        if (!response.ok) {
          throw new Error('Failed to load products');
        }
        
        let data = await response.json();
        
        const clothingProducts = data.filter(p => 
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

  // Filter and sort products (rest of your existing code)
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

  const sizesList = [
    { id: 'all', name: 'All Sizes' },
    { id: 'XS', name: 'XS' }, { id: 'S', name: 'S' }, { id: 'M', name: 'M' },
    { id: 'L', name: 'L' }, { id: 'XL', name: 'XL' }, { id: 'XXL', name: 'XXL' }, { id: '3XL', name: '3XL' },
  ];

  const genderOptions = [
    { id: 'all', name: 'All Genders' }, { id: 'women', name: "Women's" }, { id: 'men', name: "Men's" },
    { id: 'kids', name: "Kids" }, { id: 'unisex', name: "Unisex" },
  ];

  const priceRanges = [
    { id: 'all', name: 'All Prices' }, { id: 'under500', name: 'Under ₹500' },
    { id: '500-1000', name: '₹500 - ₹1000' }, { id: '1000-2000', name: '₹1000 - ₹2000' },
    { id: '2000-5000', name: '₹2000 - ₹5000' }, { id: 'above5000', name: 'Above ₹5000' },
  ];

  const sortOptions = [
    { id: 'default', name: 'Default Sorting' }, { id: 'price_low', name: 'Price: Low to High' },
    { id: 'price_high', name: 'Price: High to Low' }, { id: 'rating', name: 'Highest Rated' },
    { id: 'newest', name: 'Newest First' },
  ];

  // SEO Schema Functions
  const generateCategorySchema = () => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Clothing Collection - MyPinkShop",
    "description": "Shop trendy clothing for women at MyPinkShop. Explore dresses, tops, kurtis, jeans, and ethnic wear.",
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
      { "@type": "ListItem", "position": 2, "name": "Clothing", "item": "https://www.mypinkshop.com/clothing" }
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
        <title>Clothing for Women - Dresses, Tops, Kurtis & Jeans | MyPinkShop</title>
        <meta name="description" content="Shop trendy clothing for women at MyPinkShop. Explore dresses, tops, kurtis, jeans, skirts, and ethnic wear. Free shipping available. Shop now!" />
        <meta name="keywords" content="clothing for women, women's clothing, dresses, tops, kurtis, jeans, ethnic wear, buy clothes online" />
        <link rel="canonical" href="https://www.mypinkshop.com/clothing" />
        <meta property="og:title" content="Clothing for Women - MyPinkShop" />
        <meta property="og:description" content="Shop trendy clothing for women. Dresses, tops, kurtis, jeans & more. Free shipping available." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mypinkshop.com/clothing" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Clothing for Women - MyPinkShop" />
        <meta name="twitter:description" content="Shop trendy clothing for women. Free shipping available." />
        <script type="application/ld+json">{JSON.stringify(generateCategorySchema())}</script>
        <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema())}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        
        {/* Premium Top Bar - Dynamic Offer Banner */}
        <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
          <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
            <span>✨</span>
            <span>{offer?.description || 'FREE SHIPPING ON ALL ORDERS'}</span>
            <span>✨</span>
          </div>
        </div>
        
        {/* Rest of your header, hero, filters, products grid, footer - same as before */}
        {/* ... */}
        
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100">
          {/* ... header content unchanged ... */}
        </header>

        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-pink-100 via-rose-100 to-pink-100">
          <div className="max-w-7xl mx-auto px-4 py-16 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4">
              Clothing Collection 👗
            </h1>
            <p className="text-gray-600 text-base max-w-2xl mx-auto">
              Fashion that speaks your style
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

        {/* Rest of your code (filters, products grid, footer) remains unchanged */}
        {/* ... */}
      </div>
    </>
  );
}

export default ClothingPage;
