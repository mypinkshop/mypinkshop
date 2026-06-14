import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';

function Wishlist() {
  const navigate = useNavigate();
  const { wishlist, removeFromWishlist, fetchWishlist } = useWishlist();
  const { addToCart, cartCount } = useCart();
  const { user, logout, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [movingProduct, setMovingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayWishlist, setDisplayWishlist] = useState([]);
  const [isGuest, setIsGuest] = useState(false);

  // Main function to get wishlist data
  const getWishlistData = () => {
    if (user && token) {
      // Logged in user - get from context
      const data = Array.isArray(wishlist) ? wishlist : [];
      console.log('Logged in wishlist:', data);
      return data;
    } else {
      // Guest user - get from localStorage
      try {
        const saved = localStorage.getItem('guestWishlist');
        console.log('Raw guest wishlist from localStorage:', saved);
        
        if (saved) {
          let parsed = JSON.parse(saved);
          // Handle different data structures
          if (Array.isArray(parsed)) {
            return parsed;
          } else if (parsed.items && Array.isArray(parsed.items)) {
            return parsed.items;
          } else if (parsed.wishlist && Array.isArray(parsed.wishlist)) {
            return parsed.wishlist;
          } else {
            return [];
          }
        }
      } catch (e) {
        console.error('Error parsing wishlist:', e);
      }
      return [];
    }
  };

  // Load wishlist on mount and when dependencies change
  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      const data = getWishlistData();
      console.log('Setting displayWishlist:', data);
      setDisplayWishlist(data);
      setIsGuest(!user || !token);
      setLoading(false);
    };
    
    loadData();
  }, [user, token, wishlist]);

  // Listen for storage events (when product added from other tabs/pages)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'guestWishlist' || e.key === 'wishlist') {
        console.log('Storage changed, reloading...');
        const data = getWishlistData();
        setDisplayWishlist(data);
      }
    };
    
    const handleCustomEvent = () => {
      console.log('Custom wishlist event received');
      const data = getWishlistData();
      setDisplayWishlist(data);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('wishlistUpdated', handleCustomEvent);
    window.addEventListener('forceWishlistUpdate', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wishlistUpdated', handleCustomEvent);
      window.removeEventListener('forceWishlistUpdate', handleCustomEvent);
    };
  }, [user, token]);

  // Save to localStorage whenever guest wishlist changes
  useEffect(() => {
    if (!user && !token && displayWishlist.length >= 0) {
      localStorage.setItem('guestWishlist', JSON.stringify(displayWishlist));
      // Broadcast update to other components
      window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: { count: displayWishlist.length } }));
    }
  }, [displayWishlist, user, token]);

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

  const handleMoveToCart = async (product) => {
    const productId = product._id || product.id;
    setMovingProduct(productId);
    
    addToCart({
      id: productId,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images?.[0] || product.image,
      stock: product.stock
    });
    
    toast.success('Added to cart!');
    
    if (user && token) {
      await removeFromWishlist(productId);
      // Refresh after removal
      const updated = getWishlistData();
      setDisplayWishlist(updated);
    } else {
      setDisplayWishlist(prev => prev.filter(p => (p._id || p.id) !== productId));
    }
    
    setTimeout(() => setMovingProduct(null), 500);
  };

  const handleRemoveItem = async (productId) => {
    if (user && token) {
      await removeFromWishlist(productId);
      const updated = getWishlistData();
      setDisplayWishlist(updated);
      toast.success('Removed from wishlist');
    } else {
      setDisplayWishlist(prev => prev.filter(p => (p._id || p.id) !== productId));
      toast.success('Removed from wishlist');
    }
  };

  const wishlistCount = displayWishlist.length;

  console.log('RENDER - displayWishlist:', displayWishlist);
  console.log('RENDER - count:', wishlistCount);

  const generateBreadcrumbSchema = () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.mypinkshop.com" },
      { "@type": "ListItem", "position": 2, "name": "Wishlist", "item": "https://www.mypinkshop.com/wishlist" }
    ]
  });

  const generateOrganizationSchema = () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MyPinkShop",
    "url": "https://www.mypinkshop.com",
    "logo": "https://www.mypinkshop.com/logo.png"
  });

  if (loading) {
    return (
      <>
        <Helmet><title>My Wishlist - MyPinkShop</title></Helmet>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your wishlist...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Wishlist - MyPinkShop | Save Your Favorite Items</title>
        <meta name="description" content="View and manage your wishlist at MyPinkShop. Save your favorite skincare, makeup, clothing, and accessories for later." />
        <link rel="canonical" href="https://www.mypinkshop.com/wishlist" />
        <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema())}</script>
        <script type="application/ld+json">{JSON.stringify(generateOrganizationSchema())}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        
        <OfferBanner />

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
                <Link to="/wishlist" className="relative p-1.5 sm:p-2 text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                
                <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
                
                {user ? (
                  <Avatar user={user} onLogout={logout} />
                ) : (
                  <Link to="/login" className="p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a7 7 0 11-14 0 7 7 0 0114 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">Wishlist</span>
          </div>
        </div>

        {displayWishlist.length === 0 ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto border border-pink-100 shadow-sm">
              <div className="text-6xl mb-6">🤍</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Your wishlist is empty</h2>
              <p className="text-gray-500 mb-6">Save your favorite items here!</p>
              {isGuest && (
                <p className="text-sm text-gray-500 mb-4">
                  💡 Your wishlist is saved locally. 
                  <Link to="/login" className="text-pink-500 ml-1 hover:underline">Login</Link> to save it permanently!
                </p>
              )}
              <button
                onClick={() => {
                  // Emergency fix - clear and reload
                  localStorage.removeItem('guestWishlist');
                  setDisplayWishlist([]);
                  window.dispatchEvent(new Event('storage'));
                  window.location.reload();
                }}
                className="text-xs text-gray-400 underline mb-4 block mx-auto"
              >
                Reset Wishlist
              </button>
              <Link 
                to="/shop" 
                className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Start Shopping →
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                My Wishlist 🤍 ({displayWishlist.length} {displayWishlist.length === 1 ? 'item' : 'items'})
              </h1>
              {isGuest && (
                <p className="text-sm text-gray-500 mt-1">
                  💡 Your wishlist is saved locally. 
                  <Link to="/login" className="text-pink-500 ml-1 hover:underline">Login</Link> to save it permanently!
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayWishlist.map((product, index) => (
                <div key={product._id || product.id || index} className="group bg-white/80 backdrop-blur-sm rounded-xl border border-pink-100 overflow-hidden hover:shadow-lg transition hover:-translate-y-1">
                  <Link to={`/product/${product._id || product.id}`}>
                    <div className="relative h-52 overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50">
                      {(product.images?.[0] || product.image) ? (
                        <img 
                          src={product.images?.[0] || product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          loading="lazy"
                          decoding="async"
                          width="400"
                          height="400"
                          style={{ aspectRatio: '1/1' }}
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/400x400/pink/white?text=Image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300 bg-pink-100">
                          🛍️
                        </div>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemoveItem(product._id || product.id);
                        }}
                        className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition z-10"
                        aria-label="Remove from wishlist"
                      >
                        <span className="text-red-500 text-lg">✕</span>
                      </button>
                    </div>
                  </Link>
                  
                  <div className="p-4">
                    <Link to={`/product/${product._id || product.id}`}>
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base line-clamp-2 hover:text-pink-500 transition min-h-[48px]">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex text-yellow-500 text-xs">
                        {'★'.repeat(Math.floor(product.rating || 4))}
                        {'☆'.repeat(5 - Math.floor(product.rating || 4))}
                      </div>
                      <span className="text-xs text-gray-400">({product.rating || 4})</span>
                    </div>
                    
                    <div className="mt-2">
                      <span className="text-lg font-bold text-pink-600">₹{product.price}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-gray-400 line-through ml-2">₹{product.originalPrice}</span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleMoveToCart(product)}
                      disabled={movingProduct === (product._id || product.id)}
                      className={`w-full mt-3 py-2 rounded-full text-sm font-medium transition ${
                        movingProduct === (product._id || product.id)
                          ? 'bg-green-500 text-white'
                          : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg'
                      }`}
                    >
                      {movingProduct === (product._id || product.id) ? '✓ Added to Cart!' : 'Move to Cart 🛒'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link 
                to="/shop" 
                className="inline-flex items-center gap-2 text-pink-500 hover:text-pink-600 font-medium transition group"
              >
                <span className="group-hover:-translate-x-1 transition">←</span> Continue Shopping
              </Link>
            </div>
          </div>
        )}

        <footer className="bg-gray-900 text-gray-400 py-12 mt-8">
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
      </div>
    </>
  );
}

export default Wishlist;
