import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';
import SkeletonCard from '../components/SkeletonCard';
import SkeletonBanner from '../components/SkeletonBanner';

// ============ ProductCard - Guest Wishlist ============
const ProductCard = ({ 
  product, 
  addToCart, 
  isInWishlist, 
  addToWishlist, 
  removeFromWishlist, 
  user,
  wishlistContext 
}) => {
  const navigate = useNavigate();
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const contextWishlist = wishlistContext || [];

  const getOptimizedImage = (url) => {
    if (!url) return null;
    if (url.includes('amazon') || url.includes('media-amazon')) {
      return url.replace('_SL1500_.jpg', '_SL500_.jpg').replace('_SL1500_', '_SL500_');
    }
    return url;
  };

  const checkWishlistStatus = useCallback(() => {
    const productId = product._id || product.id;
    
    if (user) {
      setIsWishlisted(isInWishlist(productId));
    } else {
      const exists = contextWishlist.some(item => (item._id === productId || item.id === productId));
      setIsWishlisted(exists);
    }
  }, [product, user, isInWishlist, contextWishlist]);

  useEffect(() => {
    checkWishlistStatus();
    
    const handleUpdate = () => {
      checkWishlistStatus();
    };
    
    window.addEventListener('wishlistUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      window.removeEventListener('wishlistUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [checkWishlistStatus]);

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

  const handleGoToCart = () => {
    navigate('/cart');
  };

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
      if (isWishlisted) {
        removeFromWishlist(productId);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
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
        addToWishlist(productData);
        setIsWishlisted(true);
        toast.success('Added to wishlist! 🤍');
      }
    }
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-pink-100">
      <Link to={`/product/${product._id || product.id}`}>
        <div className="relative h-48 sm:h-52 md:h-60 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          {!imageLoaded && !imgError && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 to-gray-200" />
          )}
          
          {product.images && product.images[0] && !imgError ? (
            <img 
              src={getOptimizedImage(product.images[0])} 
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
            <div className="w-full h-full flex items-center justify-center text-5xl sm:text-6xl">
              {product.emoji || '✨'}
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
              className="flex-1 py-2 rounded-full text-sm font-medium transition-all bg-green-500 text-white hover:bg-green-600"
            >
              ✓ Go to Cart
            </button>
          ) : (
            <button 
              onClick={handleAddToCart}
              className="flex-1 py-2 rounded-full text-sm font-medium transition-all bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg"
            >
              Add to Cart
            </button>
          )}
          
          <button 
            onClick={handleWishlistToggle}
            className="w-10 py-2 rounded-full text-center transition border border-pink-200 hover:bg-pink-50"
          >
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ Newsletter Section ============
const NewsletterSection = () => (
  <section className="py-16 bg-gradient-to-r from-pink-600 to-rose-600 text-white">
    <div className="max-w-2xl mx-auto text-center px-4">
      <h2 className="text-3xl font-bold mb-2">Join the Pink Club</h2>
      <p className="text-white/80 mb-6">Subscribe to get 15% off on your first order + exclusive updates</p>
      <form onSubmit={(e) => { e.preventDefault(); const email = e.target.email.value; if (email) { toast.success('Thanks for subscribing!'); e.target.reset(); } }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input type="email" name="email" placeholder="Your email address" className="flex-1 px-5 py-3 rounded-full text-gray-900 focus:outline-none" required />
        <button type="submit" className="bg-white text-pink-600 px-6 py-3 rounded-full font-semibold hover:shadow-lg transition hover:scale-105">Subscribe</button>
      </form>
    </div>
  </section>
);

// ============ Footer Section ============
const FooterSection = () => (
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
            <li><Link to="/shipping-info" className="hover:text-pink-500 transition">Shipping Info</Link></li>
            <li><Link to="/returns-policy" className="hover:text-pink-500 transition">Returns Policy</Link></li>
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
);

// ============ HOME COMPONENT ============
function Home() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlist, wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [visibleSections, setVisibleSections] = useState({
    skincare: false,
    makeup: false,
    hair: false,
    clothing: false,
    accessories: false
  });
  
  const sectionRefs = {
    skincare: useRef(null),
    makeup: useRef(null),
    hair: useRef(null),
    clothing: useRef(null),
    accessories: useRef(null)
  };

  const API_URL = 'https://api.mypinkshop.com';

  // Load products with caching
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        
        const cached = sessionStorage.getItem('products_cache');
        const cacheTime = sessionStorage.getItem('products_cache_time');
        
        if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 60000) {
          const data = JSON.parse(cached);
          const productsArray = data.products || data;
          setProducts(productsArray);
          setLoading(false);
          return;
        }
        
        const response = await fetch(`${API_URL}/api/products`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        let data = await response.json();
        const productsArray = data.products || data;
        
        sessionStorage.setItem('products_cache', JSON.stringify(data));
        sessionStorage.setItem('products_cache_time', Date.now().toString());
        
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

  // Load banners with caching
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const cached = sessionStorage.getItem('banners_cache');
        const cacheTime = sessionStorage.getItem('banners_cache_time');
        
        if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 120000) {
          setBanners(JSON.parse(cached));
          return;
        }
        
        const response = await fetch(`${API_URL}/api/banners/active`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        setBanners(data);
        sessionStorage.setItem('banners_cache', JSON.stringify(data));
        sessionStorage.setItem('banners_cache_time', Date.now().toString());
      } catch (error) {
        console.error("Error loading banners:", error);
        setBanners([]);
      }
    };
    loadBanners();
  }, []);

  // Preload first banner image
  useEffect(() => {
    if (banners.length > 0 && banners[0].images?.[0]) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = banners[0].images[0];
      document.head.appendChild(link);
    }
  }, [banners]);

  // Auto slide for carousel
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Intersection Observer setup
  useEffect(() => {
    const observers = [];
    Object.keys(sectionRefs).forEach((key) => {
      if (sectionRefs[key].current) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              setVisibleSections(prev => ({ ...prev, [key]: true }));
              observer.disconnect();
            }
          },
          { threshold: 0.1, rootMargin: '100px' }
        );
        observer.observe(sectionRefs[key].current);
        observers.push(observer);
      }
    });
    return () => observers.forEach(obs => obs.disconnect());
  }, [products.length]);

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

  // Optimized data slices using useMemo
  const newArrivals = useMemo(() => 
    products.filter(p => p.isNew).length > 0 
      ? products.filter(p => p.isNew).slice(0, 4)
      : [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4), 
    [products]
  );
  
  const skincareProducts = useMemo(() => 
    products.filter(p => p.mainCategory === 'Skincare' || p.category === 'Skincare').slice(0, 4), 
    [products]
  );
  
  const makeupProducts = useMemo(() => 
    products.filter(p => p.mainCategory === 'Makeup' || p.category === 'Makeup').slice(0, 4), 
    [products]
  );
  
  const hairProducts = useMemo(() => 
    products.filter(p => p.mainCategory === 'Hair' || p.category === 'Hair').slice(0, 4), 
    [products]
  );
  
  const clothingProducts = useMemo(() => 
    products.filter(p => p.mainCategory === 'Clothing' || p.category === 'Clothing').slice(0, 4), 
    [products]
  );
  
  const accessoriesProducts = useMemo(() => 
    products.filter(p => p.mainCategory === 'Accessories' || p.category === 'Accessories').slice(0, 4), 
    [products]
  );

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

  const categories = [
    { name: 'Skincare', image: '🧴', link: '/skincare' },
    { name: 'Makeup', image: '💄', link: '/makeup' },
    { name: 'Hair', image: '💇‍♀️', link: '/hair' },
    { name: 'Clothing', image: '👗', link: '/clothing' },
    { name: 'Accessories', image: '👜', link: '/accessories' },
  ];

  // ✅ SKELETON LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <OfferBanner />

        {/* Header Skeleton */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="hidden sm:block">
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse mt-1"></div>
                </div>
              </div>
              <div className="flex-1 max-w-md lg:max-w-2xl">
                <div className="h-10 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
                <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Category Nav Skeleton */}
        <div className="sticky top-[61px] sm:top-[73px] z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto py-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                <div key={i} className="h-5 bg-gray-200 rounded w-16 sm:w-20 animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Banner Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SkeletonBanner />
        </div>

        {/* Categories Skeleton */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 mx-auto mt-2 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-gray-200 rounded-2xl h-32 animate-pulse"></div>
              ))}
            </div>
          </div>
        </section>

        {/* New Arrivals Skeleton */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </section>

        {/* Skincare Skeleton */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </section>

        {/* Makeup Skeleton */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>MyPinkShop - Best Online Shopping for Skincare, Makeup & Fashion</title>
        <meta name="description" content="Shop the latest skincare, makeup, hair care, clothing, and accessories at MyPinkShop. Best prices, free shipping on orders above ₹499, COD available." />
        <link rel="canonical" href="https://www.mypinkshop.com" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        
        <OfferBanner />

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
                    placeholder="Search for products..."
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

        {/* Category Navigation */}
        <div className="sticky top-[61px] sm:top-[73px] z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto py-3 scrollbar-hide">
              {navLinks.map((item, idx) => (
                <Link key={idx} to={item.link} className="text-sm font-medium text-gray-600 hover:text-pink-500 whitespace-nowrap transition-colors">
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Hero Carousel */}
        {banners.length > 0 ? (
          <div className="relative overflow-hidden group">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentBanner * 100}%)` }}>
              {banners.map((banner, idx) => (
                <Link key={banner.id} to={banner.link} className="w-full flex-shrink-0">
                  <div className="relative">
                    {banner.images && banner.images[0] ? (
                      <img 
                        src={banner.images[0]} 
                        alt={banner.title}
                        loading={idx === 0 ? "eager" : "lazy"}
                        decoding="async"
                        className="w-full h-[250px] sm:h-[350px] md:h-[450px] object-cover"
                      />
                    ) : (
                      <div className="w-full h-[250px] sm:h-[350px] md:h-[450px] bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center">
                        <div className="text-center text-white">
                          <span className="text-6xl mb-4 block">🌸</span>
                          <h2 className="text-3xl sm:text-4xl font-bold">{banner.title}</h2>
                        </div>
                      </div>
                    )}
                    {banner.showTextOverlay !== false && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center">
                        <div className="text-center text-white px-4">
                          {banner.title && <h2 className="text-2xl sm:text-4xl font-bold mb-2 drop-shadow-lg">{banner.title}</h2>}
                          {banner.subtitle && <p className="text-sm sm:text-lg mb-4 drop-shadow">{banner.subtitle}</p>}
                          {banner.buttonText && (
                            <button className="bg-white text-pink-600 px-6 py-2 rounded-full font-semibold hover:scale-105 transition-all shadow-lg">
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
            
            {banners.length > 1 && (
              <>
                <button onClick={() => setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length)} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={() => setCurrentBanner(prev => (prev + 1) % banners.length)} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}
            
            {banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentBanner(idx)} className={`h-1.5 rounded-full transition-all duration-300 ${currentBanner === idx ? 'w-6 bg-white' : 'w-3 bg-white/50'}`} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-pink-200 via-rose-200 to-pink-200">
            <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
              <div className="text-center">
                <span className="inline-block bg-white/80 backdrop-blur-sm text-pink-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">✨ Summer Sale ✨</span>
                <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">Glow Up <span className="text-pink-500">This Summer</span></h1>
                <p className="text-gray-600 text-base sm:text-lg mb-6">Discover our premium skincare, makeup, and fashion collection.</p>
                <Link to="/shop" className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-xl transition-all">Shop Now →</Link>
              </div>
            </div>
          </div>
        )}

        {/* Categories Section */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Shop by Category</h2>
              <p className="text-gray-500">Discover your favorite products</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
              {categories.map((cat, idx) => (
                <Link key={idx} to={cat.link} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-16 h-16 mx-auto bg-white/80 rounded-full flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition shadow-md">
                    {cat.image}
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm">{cat.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">Shop Now →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* New Arrivals */}
        {newArrivals.length > 0 && (
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">🆕 New Arrivals</h2>
                <Link to="/shop?sort=newest" className="text-pink-500 text-sm hover:underline">View All →</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {newArrivals.map(product => (
                  <ProductCard 
                    key={product._id} 
                    product={product} 
                    addToCart={addToCart}
                    isInWishlist={isInWishlist}
                    addToWishlist={addToWishlist}
                    removeFromWishlist={removeFromWishlist}
                    user={user}
                    wishlistContext={wishlist}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Skincare Section - Lazy Load */}
        {skincareProducts.length > 0 && (
          <section ref={sectionRefs.skincare} className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🧴</span>
                  <h2 className="text-2xl font-bold text-gray-800">Skincare</h2>
                </div>
                <Link to="/skincare" className="text-pink-500 text-sm hover:underline">View All →</Link>
              </div>
              {visibleSections.skincare ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {skincareProducts.map(product => (
                    <ProductCard 
                      key={product._id} 
                      product={product} 
                      addToCart={addToCart}
                      isInWishlist={isInWishlist}
                      addToWishlist={addToWishlist}
                      removeFromWishlist={removeFromWishlist}
                      user={user}
                      wishlistContext={wishlist}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-white rounded-2xl h-64 animate-pulse"></div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Makeup Section - Lazy Load */}
        {makeupProducts.length > 0 && (
          <section ref={sectionRefs.makeup} className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💄</span>
                  <h2 className="text-2xl font-bold text-gray-800">Makeup</h2>
                </div>
                <Link to="/makeup" className="text-pink-500 text-sm hover:underline">View All →</Link>
              </div>
              {visibleSections.makeup ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {makeupProducts.map(product => (
                    <ProductCard 
                      key={product._id} 
                      product={product} 
                      addToCart={addToCart}
                      isInWishlist={isInWishlist}
                      addToWishlist={addToWishlist}
                      removeFromWishlist={removeFromWishlist}
                      user={user}
                      wishlistContext={wishlist}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse"></div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Hair Section - Lazy Load */}
        {hairProducts.length > 0 && (
          <section ref={sectionRefs.hair} className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💇‍♀️</span>
                  <h2 className="text-2xl font-bold text-gray-800">Hair Care</h2>
                </div>
                <Link to="/hair" className="text-pink-500 text-sm hover:underline">View All →</Link>
              </div>
              {visibleSections.hair ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {hairProducts.map(product => (
                    <ProductCard 
                      key={product._id} 
                      product={product} 
                      addToCart={addToCart}
                      isInWishlist={isInWishlist}
                      addToWishlist={addToWishlist}
                      removeFromWishlist={removeFromWishlist}
                      user={user}
                      wishlistContext={wishlist}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-white rounded-2xl h-64 animate-pulse"></div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Clothing Section - Lazy Load */}
        {clothingProducts.length > 0 && (
          <section ref={sectionRefs.clothing} className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">👗</span>
                  <h2 className="text-2xl font-bold text-gray-800">Clothing</h2>
                </div>
                <Link to="/clothing" className="text-pink-500 text-sm hover:underline">View All →</Link>
              </div>
              {visibleSections.clothing ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {clothingProducts.map(product => (
                    <ProductCard 
                      key={product._id} 
                      product={product} 
                      addToCart={addToCart}
                      isInWishlist={isInWishlist}
                      addToWishlist={addToWishlist}
                      removeFromWishlist={removeFromWishlist}
                      user={user}
                      wishlistContext={wishlist}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse"></div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Accessories Section - Lazy Load */}
        {accessoriesProducts.length > 0 && (
          <section ref={sectionRefs.accessories} className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">👜</span>
                  <h2 className="text-2xl font-bold text-gray-800">Accessories</h2>
                </div>
                <Link to="/accessories" className="text-pink-500 text-sm hover:underline">View All →</Link>
              </div>
              {visibleSections.accessories ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {accessoriesProducts.map(product => (
                    <ProductCard 
                      key={product._id} 
                      product={product} 
                      addToCart={addToCart}
                      isInWishlist={isInWishlist}
                      addToWishlist={addToWishlist}
                      removeFromWishlist={removeFromWishlist}
                      user={user}
                      wishlistContext={wishlist}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-white rounded-2xl h-64 animate-pulse"></div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Newsletter - Lazy Load */}
        <Suspense fallback={<div className="h-64 bg-pink-600" />}>
          <NewsletterSection />
        </Suspense>

        {/* Footer - Lazy Load */}
        <Suspense fallback={<div className="h-80 bg-gray-900" />}>
          <FooterSection />
        </Suspense>

        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    </>
  );
}

export default Home;
