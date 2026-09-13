import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';

function Wishlist() {
  const navigate = useNavigate();
  const location = useLocation();
  const { wishlist, removeFromWishlist, fetchWishlist, clearWishlist } = useWishlist();
  const { addToCart, cartCount } = useCart();
  const { user, logout, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [movingProduct, setMovingProduct] = useState(null);
  const [removingProduct, setRemovingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayWishlist, setDisplayWishlist] = useState([]);
  const [isGuest, setIsGuest] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // ============ GUEST: Get from localStorage ============
  const getGuestWishlist = useCallback(() => {
    try {
      const saved = localStorage.getItem('guestWishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.items && Array.isArray(parsed.items)) return parsed.items;
        if (parsed.wishlist && Array.isArray(parsed.wishlist)) return parsed.wishlist;
      }
    } catch (e) {
      console.error('Error parsing wishlist:', e);
    }
    return [];
  }, []);

  // ============ GUEST: Save to localStorage ============
  const saveGuestWishlist = useCallback((data) => {
    localStorage.setItem('guestWishlist', JSON.stringify(data));
  }, []);

  // ============ LOAD WISHLIST ============
  const loadWishlist = useCallback(async () => {
    if (user && token) {
      if (fetchWishlist) {
        const data = await fetchWishlist();
        setDisplayWishlist(data || []);
      }
    } else {
      const data = getGuestWishlist();
      setDisplayWishlist(data);
    }
    setLoading(false);
  }, [user, token, fetchWishlist, getGuestWishlist]);

  // ============ MOUNT ============
  useEffect(() => {
    setIsGuest(!user || !token);
    loadWishlist();
  }, []);

  // ============ UPDATE ON CONTEXT CHANGE (ONLY FOR LOGGED IN) ============
  useEffect(() => {
    if (user && token && !loading) {
      const data = Array.isArray(wishlist) ? [...wishlist] : [];
      setDisplayWishlist(data);
    }
  }, [wishlist, user, token, loading]);

  // ============ HANDLE: Remove Single Item ============
  const handleRemoveItem = async (productId) => {
    if (!productId) return;

    setRemovingProduct(productId);

    try {
      if (user && token) {
        await removeFromWishlist(productId);
        const data = await fetchWishlist();
        setDisplayWishlist(data || []);
        toast.success('Removed from wishlist ❌');
      } else {
        const currentList = getGuestWishlist();
        const updatedList = currentList.filter(
          (p) => p._id !== productId && p.id !== productId
        );
        setDisplayWishlist(updatedList);
        saveGuestWishlist(updatedList);
        toast.success('Removed from wishlist ❌');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to remove from wishlist');
    }

    setTimeout(() => setRemovingProduct(null), 300);
  };

  // ============ HANDLE: Move to Cart ============
  const handleMoveToCart = async (product) => {
    const productId = product._id || product.id;
    if (!productId) return;

    setMovingProduct(productId);

    addToCart({
      id: productId,
      name: product.name || 'Product',
      price: product.price || 0,
      quantity: 1,
      image: product.images?.[0] || product.image || '',
      stock: product.stock || 10,
    });

    toast.success('Added to cart! 🛒');

    try {
      if (user && token) {
        await removeFromWishlist(productId);
        const data = await fetchWishlist();
        setDisplayWishlist(data || []);
      } else {
        const currentList = getGuestWishlist();
        const updatedList = currentList.filter(
          (p) => p._id !== productId && p.id !== productId
        );
        setDisplayWishlist(updatedList);
        saveGuestWishlist(updatedList);
      }
    } catch (error) {
      console.error('Error:', error);
    }

    setTimeout(() => setMovingProduct(null), 500);
  };

  // ============ HANDLE: Clear All ============
  const handleClearAll = async () => {
    if (displayWishlist.length === 0) {
      toast.error('Wishlist is already empty');
      return;
    }

    if (!confirm('Are you sure you want to clear your entire wishlist?')) {
      return;
    }

    setIsClearing(true);

    try {
      if (user && token) {
        await clearWishlist();
        const data = await fetchWishlist();
        setDisplayWishlist(data || []);
        toast.success('Wishlist cleared 🗑️');
      } else {
        setDisplayWishlist([]);
        saveGuestWishlist([]);
        toast.success('Wishlist cleared 🗑️');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to clear wishlist');
    }

    setIsClearing(false);
  };

  // ============ HANDLE: Share ============
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Wishlist 💖',
          text: `Check out my wishlist on MyPinkShop! ${displayWishlist.length} items ✨`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard! 📋');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
      }
    }
  };

  // ============ HANDLE: Search ============
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

  // ============ SKELETON LOADER ============
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border-2 border-pink-100 p-4 animate-pulse">
      <div className="aspect-square bg-gray-200 rounded-xl mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
      <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
      <div className="h-10 bg-gray-200 rounded-xl w-full"></div>
    </div>
  );

  // ============ SEO ============
  const generateBreadcrumbSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mypinkshop.com' },
      { '@type': 'ListItem', position: 2, name: 'Wishlist', item: 'https://www.mypinkshop.com/wishlist' },
    ],
  });

  const wishlistCount = displayWishlist.length;
  const pageTitle = `My Wishlist (${wishlistCount || 0}) - MyPinkShop`;

  // ============ RENDER ============
  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading Wishlist - MyPinkShop</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-pink-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={`View and manage your wishlist at MyPinkShop. ${wishlistCount || 0} items saved.`} />
        <link rel="canonical" href="https://www.mypinkshop.com/wishlist" />
        <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema())}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-pink-100">
        <OfferBanner />

        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
              <Link to="/" className="flex items-center gap-2 shrink-0 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-lg sm:text-xl">M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                    MyPinkShop
                  </h1>
                  <p className="text-[9px] sm:text-[10px] text-pink-500 font-semibold tracking-wider">
                    FOR THE GIRLIES ✨
                  </p>
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
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border-2 border-pink-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-white"
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 sm:px-6 py-1.5 rounded-full text-sm font-medium hover:shadow-lg transition-all"
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
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {user ? (
                  <Avatar user={user} onLogout={logout} />
                ) : (
                  <Link to="/login" className="p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* BREADCRUMB */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-bold">Wishlist</span>
          </div>
        </div>

        {/* EMPTY STATE */}
        {wishlistCount === 0 ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="bg-white rounded-3xl p-12 sm:p-16 max-w-md mx-auto border-2 border-pink-100 shadow-lg text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center">
                <span className="text-6xl">🤍</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Your wishlist is empty
              </h2>
              <p className="text-gray-500 mb-6">
                Save your favorite items here and shop them later!
              </p>
              {isGuest && (
                <p className="text-sm text-gray-600 mb-4 bg-pink-50 rounded-xl p-3 font-medium">
                  💡 Your wishlist is saved locally.{' '}
                  <Link to="/login" className="text-pink-600 font-bold hover:underline">
                    Login
                  </Link>{' '}
                  to save it permanently!
                </p>
              )}
              <Link
                to="/shop"
                className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3.5 rounded-full font-bold hover:shadow-lg transition-all transform hover:-translate-y-1"
              >
                Start Shopping →
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* HEADER WITH ACTIONS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  My Wishlist 🤍
                  <span className="text-sm font-normal text-gray-500 bg-pink-100 px-3 py-1 rounded-full">
                    {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
                  </span>
                </h1>
                {isGuest && (
                  <p className="text-sm text-gray-600 mt-2 bg-pink-50 rounded-xl p-3 font-medium inline-block">
                    💡 Saved locally.{' '}
                    <Link to="/login" className="text-pink-600 font-bold hover:underline">
                      Login
                    </Link>{' '}
                    to save permanently!
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleShare}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-bold shadow-md hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>

                {wishlistCount > 1 && (
                  <button
                    onClick={handleClearAll}
                    disabled={isClearing}
                    className="px-5 py-2.5 bg-white border-2 border-rose-200 text-rose-600 rounded-full text-sm font-bold hover:bg-rose-50 hover:border-rose-400 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    {isClearing ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Clearing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear All
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* PRODUCT GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {displayWishlist.map((product, index) => {
                const productId = product._id || product.id;
                const isMoving = movingProduct === productId;
                const isRemoving = removingProduct === productId;
                const mrp = product.originalPrice || product.mrp || product.original_price;
                const price = product.price || 0;
                const discountPercent =
                  mrp && mrp > price
                    ? Math.round(((mrp - price) / mrp) * 100)
                    : 0;

                return (
                  <div
                    key={productId || index}
                    className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-pink-100 flex flex-col ${
                      isRemoving ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    <Link to={`/product/${productId}`} className="block">
                      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50">
                        {product.images?.[0] || product.image ? (
                          <img
                            src={product.images?.[0] || product.image}
                            alt={product.name || 'Product'}
                            className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/400x400/pink/white?text=Product';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl">
                            🛍️
                          </div>
                        )}

                        {/* Discount badge */}
                        {discountPercent > 0 && (
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                            {discountPercent}% OFF
                          </div>
                        )}

                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveItem(productId);
                          }}
                          disabled={isRemoving || isMoving}
                          className="absolute top-3 right-3 w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-red-50 hover:scale-110 transition-all border border-pink-100 disabled:opacity-50 z-10"
                          aria-label="Remove from wishlist"
                        >
                          {isRemoving ? (
                            <span className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <span className="text-base">❤️</span>
                          )}
                        </button>
                      </div>
                    </Link>

                    <div className="p-3 sm:p-4 flex flex-col flex-1">
                      {product.brand && (
                        <p className="text-[10px] sm:text-xs font-semibold text-pink-600 uppercase tracking-wider mb-1">
                          {product.brand}
                        </p>
                      )}

                      <Link to={`/product/${productId}`}>
                        <h3 className="font-semibold text-gray-800 text-xs sm:text-sm line-clamp-2 hover:text-pink-600 transition min-h-[2.5rem]">
                          {product.name || 'Product'}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-1.5 mt-2 mb-2">
                        <span className="bg-green-50 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          {product.rating || 4.5} <span className="text-yellow-500">★</span>
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 mb-3 flex-wrap">
                        <span className="text-base sm:text-lg font-bold text-pink-600">
                          ₹{price.toLocaleString()}
                        </span>
                        {mrp && mrp > price && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{mrp.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleMoveToCart(product)}
                        disabled={isMoving || isRemoving}
                        className={`w-full mt-auto py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1 ${
                          isMoving
                            ? 'bg-green-500 text-white'
                            : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg hover:scale-[1.02]'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isMoving ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Adding...
                          </>
                        ) : (
                          <>🛒 Move to Cart</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-bold transition group"
              >
                <span className="group-hover:-translate-x-1 transition">←</span> Continue Shopping
              </Link>
            </div>
          </div>
        )}

        {/* TRUST BADGES */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-gradient-to-r from-pink-100 via-rose-100 to-pink-100 border-2 border-pink-200 rounded-3xl p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: '🚚', title: 'Free Shipping', sub: 'On orders ₹499+' },
                { icon: '💵', title: 'COD Available', sub: 'Pay on delivery' },
                { icon: '↩️', title: 'Easy Returns', sub: '7-day return' },
                { icon: '🔒', title: 'Secure', sub: '100% trusted' },
              ].map((badge, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-center sm:items-start gap-2 text-center sm:text-left bg-white rounded-2xl p-3 shadow-sm"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-lg">{badge.icon}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-xs">{badge.title}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{badge.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
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
