import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';

// Product Card Component
const ProductCard = ({ product, addToCart, isInWishlist }) => {
  const [imgError, setImgError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const navigate = useNavigate();

  const handleButtonClick = () => {
    if (addedToCart) {
      navigate('/cart');
    } else {
      addToCart(product);
      setAddedToCart(true);
    }
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-pink-100">
      <Link to={`/product/${product._id}`}>
        <div className="relative h-48 sm:h-52 md:h-60 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          {product.images && product.images[0] && !imgError ? (
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
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
          {product.badge && <span className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-2 py-1 rounded-full shadow-md z-10">{product.badge}</span>}
          {product.isNew && <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs px-2 py-1 rounded-full shadow-md z-10">NEW</span>}
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/product/${product._id}`}>
          <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1 hover:text-pink-500 transition">{product.name}</h3>
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
            <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
          )}
        </div>
        <button 
          onClick={handleButtonClick}
          className={`w-full py-2 rounded-full text-sm font-medium transition-all transform hover:-translate-y-0.5 ${
            addedToCart 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg'
          }`}
        >
          {addedToCart ? '✓ Go to Cart' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

function Home() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, isInWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Fixed target end time - 11:59 PM today (won't reset on refresh)
  const getTargetEndTime = () => {
    const endTime = localStorage.getItem('dealEndTime');
    const now = new Date();
    
    if (endTime) {
      const parsedEndTime = new Date(parseInt(endTime));
      if (parsedEndTime > now) {
        return parsedEndTime;
      }
    }
    
    // Set to 11:59 PM today
    const newEndTime = new Date();
    newEndTime.setHours(23, 59, 59, 999);
    localStorage.setItem('dealEndTime', newEndTime.getTime());
    return newEndTime;
  };

  const [targetEndTime] = useState(getTargetEndTime());
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Countdown timer - REAL, doesn't reset on refresh
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetEndTime - now;
      
      if (difference <= 0) {
        // Deal expired, set new end time for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);
        localStorage.setItem('dealEndTime', tomorrow.getTime());
        window.location.reload();
        return { hours: 0, minutes: 0, seconds: 0 };
      }
      
      return {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      };
    };
    
    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [targetEndTime]);

  // Load products from backend API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const API_URL = 'https://api.mypinkshop.com';
        const response = await fetch(`${API_URL}/api/products`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const productsArray = data.products || data;
        setProducts(productsArray);
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Load banners from backend API
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const API_URL = 'https://api.mypinkshop.com';
        const response = await fetch(`${API_URL}/api/banners/active`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        setBanners(data);
      } catch (error) {
        console.error("Error loading banners:", error);
        setBanners([]);
      }
    };
    loadBanners();
  }, []);

  // Auto slide for carousel
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // REAL DATA - Deals of the Day (products with discount)
  const dealsOfDay = products.filter(p => p.originalPrice && p.originalPrice > p.price).slice(0, 4);
  
  // REAL DATA - Bestsellers (products with highest rating)
  const bestsellers = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);
  
  // REAL DATA - New Arrivals (products with isNew flag or newest created)
  const newArrivals = products.filter(p => p.isNew).length > 0 
    ? products.filter(p => p.isNew).slice(0, 4)
    : [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
  
  // Category wise products
  const skincareProducts = products.filter(p => p.mainCategory === 'Skincare' || p.category === 'Skincare').slice(0, 4);
  const makeupProducts = products.filter(p => p.mainCategory === 'Makeup' || p.category === 'Makeup').slice(0, 4);
  const hairProducts = products.filter(p => p.mainCategory === 'Hair' || p.category === 'Hair').slice(0, 4);
  const clothingProducts = products.filter(p => p.mainCategory === 'Clothing' || p.category === 'Clothing').slice(0, 4);
  const accessoriesProducts = products.filter(p => p.mainCategory === 'Accessories' || p.category === 'Accessories').slice(0, 4);

  // Categories for display
  const categorySections = [
    { name: 'Skincare', products: skincareProducts, viewAllLink: '/skincare', icon: '🧴', color: 'from-pink-100 to-rose-100' },
    { name: 'Makeup', products: makeupProducts, viewAllLink: '/makeup', icon: '💄', color: 'from-purple-100 to-pink-100' },
    { name: 'Hair Care', products: hairProducts, viewAllLink: '/hair', icon: '💇‍♀️', color: 'from-blue-100 to-indigo-100' },
    { name: 'Clothing', products: clothingProducts, viewAllLink: '/clothing', icon: '👗', color: 'from-emerald-100 to-teal-100' },
    { name: 'Accessories', products: accessoriesProducts, viewAllLink: '/accessories', icon: '👜', color: 'from-amber-100 to-orange-100' },
  ];

  const categories = [
    { name: 'Skincare', image: '🧴', link: '/skincare' },
    { name: 'Makeup', image: '💄', link: '/makeup' },
    { name: 'Hair', image: '💇‍♀️', link: '/hair' },
    { name: 'Clothing', image: '👗', link: '/clothing' },
    { name: 'Accessories', image: '👜', link: '/accessories' },
  ];

  const navLinks = [
    { name: 'All', link: '/shop' },
    { name: 'Skincare', link: '/skincare' },
    { name: 'Makeup', link: '/makeup' },
    { name: 'Hair', link: '/hair' },
    { name: 'Clothing', link: '/clothing' },
    { name: 'Accessories', link: '/accessories' },
    { name: 'Sale 🔥', link: '/shop?offer=sale' },
    { name: 'New Arrivals', link: '/shop?sort=newest' },
    { name: 'Bestsellers', link: '/shop?sort=bestseller' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your paradise...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>MyPinkShop - Best Online Shopping for Skincare, Makeup & Fashion</title>
        <meta name="description" content="Shop the latest skincare, makeup, hair care, clothing, and accessories at MyPinkShop. Best prices, free shipping on orders above ₹499, COD available. Join the Pink Club!" />
        <meta name="keywords" content="online shopping, skincare, makeup, hair care, clothing, accessories, beauty products, fashion, MyPinkShop, buy cosmetics online" />
        <link rel="canonical" href="https://www.mypinkshop.com" />
        
        {/* Open Graph / Facebook / WhatsApp */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mypinkshop.com" />
        <meta property="og:title" content="MyPinkShop - Best Online Shopping for Skincare, Makeup & Fashion" />
        <meta property="og:description" content="Shop the latest skincare, makeup, hair care, clothing, and accessories. Best prices, free shipping, COD available." />
        <meta property="og:image" content="https://www.mypinkshop.com/og-image.jpg" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MyPinkShop - Best Online Shopping for Beauty & Fashion" />
        <meta name="twitter:description" content="Shop skincare, makeup, clothing & accessories. Free shipping on orders above ₹499." />
        <meta name="twitter:image" content="https://www.mypinkshop.com/og-image.jpg" />
        
        {/* JSON-LD Schema for SEO - Hidden from users */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "MyPinkShop",
            "url": "https://www.mypinkshop.com",
            "description": "Best online shopping destination for skincare, makeup, hair care, clothing, and accessories.",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://www.mypinkshop.com/shop?search={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "MyPinkShop",
            "url": "https://www.mypinkshop.com",
            "logo": "https://www.mypinkshop.com/logo.png",
            "sameAs": [
              "https://www.instagram.com/mypinkshop",
              "https://www.facebook.com/mypinkshop"
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.mypinkshop.com" }
            ]
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        
        {/* 🔥 DYNAMIC OFFER BANNER - FROM ADMIN PANEL */}
        <OfferBanner />

        {/* Premium Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 shrink-0 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-lg sm:text-xl">M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">MyPinkShop</h1>
                  <p className="text-[9px] sm:text-[10px] text-gray-400 tracking-wider">FOR THE GIRLIES ✨</p>
                </div>
              </Link>

              {/* Search Bar - WORKING */}
              <div className="flex-1 max-w-md lg:max-w-2xl">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search for products, brands and more..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-gray-50"
                  />
                  <button 
                    onClick={handleSearch}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 sm:px-6 py-1.5 sm:py-1.5 rounded-full text-sm font-medium hover:shadow-lg transition-all"
                  >
                    <span className="hidden sm:inline">Search</span>
                    <span className="sm:hidden">🔍</span>
                  </button>
                </div>
              </div>

              {/* Right Icons */}
              <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
                <button onClick={() => navigate('/wishlist')} className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">{wishlistCount}</span>}
                </button>
                
                <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">{cartCount}</span>}
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

        {/* Premium Category Navigation */}
        <div className="sticky top-[61px] sm:top-[73px] z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto py-3 scrollbar-hide">
              {navLinks.map((item, idx) => (
                <Link 
                  key={idx} 
                  to={item.link}
                  className="text-sm font-medium text-gray-600 hover:text-pink-500 whitespace-nowrap transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Hero Carousel - Rest of your code remains same */}
        {/* ... (rest of your existing JSX from hero carousel to footer remains unchanged) ... */}
        
        {/* NOTE: The rest of your JSX (carousel, categories, products grid, newsletter, footer) 
             remains exactly the same as before. Only Helmet added at top. */}
      </div>
    </>
  );
}

export default Home;
