import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
        setProducts(data);
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

      {/* Hero Carousel */}
      {banners.length > 0 ? (
        <div className="relative overflow-hidden group">
          <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${currentBanner * 100}%)` }}>
            {banners.map((banner) => (
              <Link key={banner.id} to={banner.link} className="w-full flex-shrink-0">
                <div className="relative">
                  {banner.images && banner.images[0] ? (
                    <img 
                      src={banner.images[0]} 
                      alt={banner.title}
                      className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] object-cover"
                    />
                  ) : banner.image ? (
                    <img 
                      src={banner.image} 
                      alt={banner.title}
                      className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] object-cover"
                    />
                  ) : (
                    <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center">
                      <div className="text-center text-white">
                        <span className="text-6xl mb-4 block">🌸</span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">{banner.title}</h2>
                        {banner.subtitle && <p className="text-lg mt-2">{banner.subtitle}</p>}
                      </div>
                    </div>
                  )}
                  {banner.showTextOverlay !== false && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center">
                      <div className="text-center text-white px-4 animate-fade-in-up">
                        {banner.title && <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4 drop-shadow-lg">{banner.title}</h2>}
                        {banner.subtitle && <p className="text-base sm:text-lg md:text-xl mb-4 sm:mb-6 drop-shadow">{banner.subtitle}</p>}
                        {banner.buttonText && (
                          <button className="bg-white text-pink-600 px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold hover:bg-gray-100 hover:scale-105 transition-all shadow-lg">
                            {banner.buttonText}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
          
          {/* Navigation Arrows */}
          {banners.length > 1 && (
            <>
              <button 
                onClick={() => setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length)}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={() => setCurrentBanner(prev => (prev + 1) % banners.length)}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          {/* Carousel Dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBanner(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${currentBanner === idx ? 'w-6 bg-white' : 'w-3 bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="relative bg-gradient-to-r from-pink-200 via-rose-200 to-pink-200 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 text-7xl">🎀</div>
            <div className="absolute bottom-10 right-10 text-7xl">✨</div>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16 md:py-20 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="text-center lg:text-left">
                <span className="inline-block bg-white/80 backdrop-blur-sm text-pink-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">✨ Summer Sale ✨</span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">Glow Up <span className="text-pink-500">This Summer</span></h1>
                <p className="text-gray-600 text-base sm:text-lg mb-6">Discover our premium skincare, makeup, and fashion collection. Up to 40% off + free gift with purchase.</p>
                <Link to="/shop" className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 sm:px-8 py-3 rounded-full font-semibold hover:shadow-xl transition-all transform hover:-translate-y-1">Shop Now →</Link>
              </div>
              <div className="hidden lg:block text-center">
                <div className="text-8xl animate-bounce">🛍️</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Shop by Category</h2>
            <p className="text-gray-500 text-sm sm:text-base">Discover your favorite products</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
            {categories.map((cat, idx) => (
              <Link key={idx} to={cat.link} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 p-6 text-center hover:shadow-xl transition-all hover:-translate-y-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl sm:text-4xl mb-3 group-hover:scale-110 transition shadow-md">
                  {cat.image}
                </div>
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{cat.name}</h3>
                <p className="text-xs text-gray-500 mt-1">Shop Now →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Deals of the Day Section - REAL DATA with persistent timer */}
      {dealsOfDay.length > 0 && (
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">⏰ Deals of the Day</h2>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">Ends in:</span>
                <div className="flex gap-1">
                  <div className="bg-gray-900 text-white px-2 sm:px-3 py-1 rounded-lg text-center">
                    <span className="text-lg sm:text-xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-xs block">Hours</span>
                  </div>
                  <span className="text-gray-800 text-xl">:</span>
                  <div className="bg-gray-900 text-white px-2 sm:px-3 py-1 rounded-lg text-center">
                    <span className="text-lg sm:text-xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-xs block">Mins</span>
                  </div>
                  <span className="text-gray-800 text-xl">:</span>
                  <div className="bg-gray-900 text-white px-2 sm:px-3 py-1 rounded-lg text-center">
                    <span className="text-lg sm:text-xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="text-xs block">Secs</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {dealsOfDay.map(product => (
                <ProductCard key={product._id} product={product} addToCart={addToCart} isInWishlist={isInWishlist(product._id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bestsellers Section - REAL DATA */}
      {bestsellers.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">⭐ Bestsellers</h2>
              <Link to="/shop?sort=bestseller" className="text-pink-500 text-sm hover:underline">View All →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {bestsellers.map(product => (
                <ProductCard key={product._id} product={product} addToCart={addToCart} isInWishlist={isInWishlist(product._id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals - REAL DATA */}
      {newArrivals.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">🆕 New Arrivals</h2>
              <Link to="/shop?sort=newest" className="text-pink-500 text-sm hover:underline">View All →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {newArrivals.map(product => (
                <ProductCard key={product._id} product={product} addToCart={addToCart} isInWishlist={isInWishlist(product._id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Wise Products Sections */}
      {categorySections.map((section, idx) => (
        section.products.length > 0 && (
          <section key={idx} className={`py-12 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{section.icon}</span>
                  <h2 className="text-2xl font-bold text-gray-800">{section.name}</h2>
                </div>
                <Link to={section.viewAllLink} className="text-pink-500 text-sm hover:underline">View All →</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {section.products.map(product => (
                  <ProductCard key={product._id} product={product} addToCart={addToCart} isInWishlist={isInWishlist(product._id)} />
                ))}
              </div>
            </div>
          </section>
        )
      ))}

      {/* Newsletter */}
      <section className="py-16 bg-gradient-to-r from-pink-600 to-rose-600 text-white">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-2">Join the Pink Club</h2>
          <p className="text-white/80 mb-6">Subscribe to get 15% off on your first order + exclusive updates</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" placeholder="Your email address" className="flex-1 px-5 py-3 rounded-full text-gray-900 focus:outline-none" />
            <button className="bg-white text-pink-600 px-6 py-3 rounded-full font-semibold hover:shadow-lg transition">Subscribe</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
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
                <li><a href="#" className="hover:text-pink-500 transition">TikTok</a></li>
                <li><a href="#" className="hover:text-pink-500 transition">Pinterest</a></li>
                <li><a href="#" className="hover:text-pink-500 transition">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-gray-800">
            <p className="text-sm text-gray-500">© 2026 MyPinkShop. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default Home;
