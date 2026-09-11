import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';

function Cart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [imgErrors, setImgErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [eligibleCoupons, setEligibleCoupons] = useState([]);

  const [shippingCharge, setShippingCharge] = useState(49);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(499);

  const API_URL = `${import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com'}/api`;

  const subtotal = cartTotal();
  const FREE_SHIPPING_THRESHOLD = freeShippingThreshold;

  // Fetch coupons & shipping
  useEffect(() => {
    const fetchCouponsAndShipping = async () => {
      try {
        const cartItemsWithVendor = cart.map((item) => ({
          id: item.id,
          productId: item.id,
          vendorId: item.vendorId || null,
          price: item.price,
          quantity: item.quantity,
        }));

        const response = await fetch(
          `${API_URL}/coupons/active?cartItems=${encodeURIComponent(
            JSON.stringify(cartItemsWithVendor)
          )}`
        );
        const data = await response.json();

        if (data.success || data.data) {
          const coupons = data.data || data.coupons || [];
          setAvailableCoupons(coupons);

          const eligible = coupons.filter((coupon) => {
            if (!coupon.vendorId) return true;
            return cart.some((item) => item.vendorId === coupon.vendorId);
          });
          setEligibleCoupons(eligible);
        }
      } catch (error) {
        console.error('Failed to fetch coupons:', error);
      }

      try {
        const res = await fetch(`${API_URL}/shipping/settings`);
        const settingsData = await res.json();
        const settings = settingsData.data || settingsData.settings || settingsData;
        if (settings.freeShippingThreshold) {
          setFreeShippingThreshold(Number(settings.freeShippingThreshold));
        }
      } catch (err) {
        console.error('Failed to load shipping settings', err);
      }
    };

    fetchCouponsAndShipping();
  }, [cart, API_URL]);

  // Live shipping
  useEffect(() => {
    const fetchLiveShipping = async () => {
      try {
        const savedAddresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
        const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
        const targetPincode = defaultAddr?.pincode || '400072';

        const res = await fetch(`${API_URL}/shipping/check-delivery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pincode: targetPincode,
            cartTotal: subtotal,
            weight: 0.5,
          }),
        });
        const data = await res.json();
        const deliveryData = data.data || data;

        if (deliveryData.success !== false && deliveryData.shippingCharge !== undefined) {
          setShippingCharge(Number(deliveryData.shippingCharge));
        }
      } catch (err) {
        console.error('Live shipping calculation error:', err);
      }
    };

    if (subtotal > 0) fetchLiveShipping();
  }, [subtotal, API_URL]);

  const handleCheckout = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');

    if (!token) {
      toast.error('Please login to continue checkout');
      navigate('/login?redirect=/checkout');
      return;
    }

    setIsCheckingOut(true);
    setTimeout(() => navigate('/checkout'), 500);
  };

  const handleImageError = (itemId) => {
    setImgErrors((prev) => ({ ...prev, [itemId]: true }));
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleUpdateQuantity = (id, newQuantity, stock) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      toast.success('Item removed from cart');
      return;
    }
    if (stock && newQuantity > stock) {
      toast.error('Not enough stock available');
      return;
    }
    updateQuantity(id, newQuantity);
  };

  const handleRemoveItem = (id, name) => {
    if (window.confirm(`Remove "${name}" from cart?`)) {
      removeFromCart(id);
      toast.success('Item removed from cart');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);

    try {
      const cartItemsWithVendor = cart.map((item) => ({
        id: item.id,
        productId: item.id,
        price: item.price,
        quantity: item.quantity,
        vendorId: item.vendorId || null,
      }));

      const response = await fetch(`${API_URL}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && { Authorization: `Bearer ${localStorage.getItem('token')}` }),
        },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          cartTotal: subtotal,
          userId: user?._id || null,
          cartItems: cartItemsWithVendor,
        }),
      });

      const data = await response.json();
      const result = data.data || data;

      if (!result.valid) {
        toast.error(data.error || result.message || 'Invalid coupon');
        return;
      }

      setDiscount(result.discountAmount);
      setAppliedCoupon({ ...result.coupon, discountAmount: result.discountAmount });
      setCouponApplied(true);

      if (result.coupon?.isVendorCoupon && result.coupon?.vendorName) {
        toast.success(
          `🎉 ${result.coupon.code} applied! You saved ₹${result.discountAmount} on ${result.coupon.vendorName} products`
        );
      } else {
        toast.success(`🎉 ${result.coupon?.code} applied! You saved ₹${result.discountAmount}`);
      }

      setCouponCode('');
    } catch (error) {
      toast.error('Error applying coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponApplied(false);
    toast.success('Coupon removed');
  };

  const totalWithDiscount = subtotal - discount;
  const shipping =
    totalWithDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : Number(shippingCharge || 49);
  const finalTotal = totalWithDiscount + shipping;
  const remainingForFree = FREE_SHIPPING_THRESHOLD - totalWithDiscount;
  const freeShippingProgress = Math.min(
    100,
    (totalWithDiscount / FREE_SHIPPING_THRESHOLD) * 100
  );

  const generateBreadcrumbSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mypinkshop.com' },
      { '@type': 'ListItem', position: 2, name: 'Cart', item: 'https://www.mypinkshop.com/cart' },
    ],
  });

  // ============================================================
  // EMPTY CART
  // ============================================================
  if (cart.length === 0) {
    return (
      <>
        <Helmet>
          <title>Shopping Cart - MyPinkShop | Your cart is empty</title>
          <meta name="description" content="Your shopping cart is empty. Shop the latest skincare, makeup, hair care, clothing, and accessories at MyPinkShop." />
          <link rel="canonical" href="https://www.mypinkshop.com/cart" />
          <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema())}</script>
        </Helmet>

        <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-pink-100 flex flex-col">
          <OfferBanner />

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
                  <button
                    onClick={() => navigate('/wishlist')}
                    className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                        {wishlistCount}
                      </span>
                    )}
                  </button>

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

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
              <span className="text-gray-400">/</span>
              <span className="text-pink-600 font-medium">Cart</span>
            </div>
          </div>

          <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
            <div className="bg-white rounded-3xl p-8 sm:p-12 max-w-md mx-auto border border-pink-100 shadow-xl text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center">
                <span className="text-6xl animate-bounce">🛒</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
              <p className="text-gray-500 mb-8">
                Looks like you haven't added anything to your cart yet.
              </p>
              <Link
                to="/shop"
                className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3.5 rounded-full font-bold hover:shadow-lg transition-all transform hover:-translate-y-1"
              >
                Start Shopping →
              </Link>
            </div>
          </div>

          {/* Footer */}
          <footer className="bg-gray-900 text-gray-400 py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center pt-2">
                <p className="text-sm">© 2026 MyPinkShop. All rights reserved.</p>
                <p className="text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
              </div>
            </div>
          </footer>
        </div>
      </>
    );
  }

  // ============================================================
  // CART WITH ITEMS
  // ============================================================
  return (
    <>
      <Helmet>
        <title>Shopping Cart - MyPinkShop | Review Your Order</title>
        <meta name="description" content="Review your shopping cart at MyPinkShop. Checkout securely with free shipping on orders above ₹499." />
        <link rel="canonical" href="https://www.mypinkshop.com/cart" />
        <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema())}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-pink-100 flex flex-col">
        <OfferBanner />

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
                <button
                  onClick={() => navigate('/wishlist')}
                  className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </button>

                <Link to="/cart" className="relative p-1.5 sm:p-2 text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                    {cart.reduce((sum, i) => sum + i.quantity, 0)}
                  </span>
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
          <div className="flex items-center gap-2 text-sm overflow-x-auto pb-1">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition whitespace-nowrap">Home</Link>
            <span className="text-gray-400 whitespace-nowrap">/</span>
            <span className="text-pink-600 font-medium whitespace-nowrap">Cart</span>
          </div>
        </div>

        {/* FREE SHIPPING PROGRESS BAR */}
        {shipping > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  🚚 Add <span className="text-pink-600">₹{remainingForFree}</span> more for FREE shipping!
                </p>
                <p className="text-xs text-pink-600 font-semibold">Free shipping on ₹{FREE_SHIPPING_THRESHOLD}+</p>
              </div>
              <div className="w-full bg-pink-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {shipping === 0 && subtotal > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <p className="text-sm font-bold text-green-700">
                Yay! You've unlocked FREE shipping on this order.
              </p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex flex-wrap items-center gap-2">
            <span>🛒</span> Shopping Cart
            <span className="text-sm font-normal text-gray-500">
              ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)
            </span>
          </h1>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* CART ITEMS */}
            <div className="flex-1 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-pink-100 p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <Link to={`/product/${item.id}`} className="block flex-shrink-0">
                      {item.image && !imgErrors[item.id] ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-pink-100 bg-white hover:scale-105 transition-transform"
                          loading="lazy"
                          decoding="async"
                          onError={() => handleImageError(item.id)}
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl flex items-center justify-center text-3xl border border-pink-100">
                          {item.emoji || '✨'}
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.id}`}>
                        <h3 className="font-bold text-gray-900 hover:text-pink-600 transition line-clamp-2 text-sm sm:text-base">
                          {item.name}
                        </h3>
                      </Link>

                      {item.vendorId && (
                        <p className="text-[10px] text-purple-500 mt-0.5 font-medium">
                          🛍️ Vendor Product
                        </p>
                      )}

                      {item.variationName && (
                        <p className="text-xs text-gray-500 mt-1">
                          {item.variationName}
                          {item.variationSecondary && ` - ${item.variationSecondary}`}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-lg font-bold text-pink-600">₹{item.price}</span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{item.originalPrice}
                          </span>
                        )}
                      </div>

                      {/* Quantity + Remove */}
                      <div className="flex items-center justify-between mt-3 gap-2">
                        <div className="flex items-center gap-1 bg-pink-50 border border-pink-200 rounded-full p-1">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1, item.stock)
                            }
                            className="w-7 h-7 rounded-full hover:bg-pink-200 text-pink-600 font-bold transition flex items-center justify-center"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-bold text-sm text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1, item.stock)
                            }
                            className="w-7 h-7 rounded-full hover:bg-pink-200 text-pink-600 font-bold transition flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id, item.name)}
                          className="text-xs text-red-500 hover:text-red-700 transition flex items-center gap-1 font-medium"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Link
                to="/shop"
                className="inline-flex items-center gap-2 mt-4 text-pink-600 hover:text-pink-700 font-bold transition group"
              >
                <span className="group-hover:-translate-x-1 transition">←</span> Continue Shopping
              </Link>
            </div>

            {/* ORDER SUMMARY */}
            <div className="lg:w-96">
              <div className="bg-white rounded-3xl border border-pink-100 p-6 lg:sticky lg:top-24 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-pink-100 flex items-center gap-2">
                  <span>📋</span> Order Summary
                </h3>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{subtotal}</span>
                  </div>

                  {/* Coupon */}
                  {couponApplied ? (
                    <div className="flex flex-col gap-1 py-2 border-t border-pink-100">
                      <div className="flex justify-between text-green-600">
                        <div className="flex flex-col items-start">
                          <span className="font-bold">Discount ({appliedCoupon?.code})</span>
                          {appliedCoupon?.isVendorCoupon && appliedCoupon?.vendorName && (
                            <span className="text-[10px] text-purple-600 font-normal">
                              🛍️ On {appliedCoupon.vendorName} products only
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">-₹{discount}</span>
                          <button
                            onClick={removeCoupon}
                            className="text-xs text-red-400 hover:text-red-600 transition"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 px-3 py-2.5 border-2 border-pink-200 rounded-xl text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 bg-white font-mono"
                          disabled={validatingCoupon}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={validatingCoupon || !couponCode.trim()}
                          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                            validatingCoupon || !couponCode.trim()
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-md'
                          }`}
                        >
                          {validatingCoupon ? '...' : 'Apply'}
                        </button>
                      </div>

                      {!couponApplied && eligibleCoupons.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                            <span>🎫</span> Available Coupons
                          </p>
                          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                            {eligibleCoupons.map((c, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCouponCode(c.code)}
                                className="w-full text-left px-3 py-2 border border-dashed border-pink-300 rounded-xl hover:border-pink-500 hover:bg-pink-50 transition group flex flex-col"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-pink-600 text-sm">
                                      {c.code}
                                    </span>
                                    <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full font-bold">
                                      {c.discountType === 'percentage'
                                        ? `${c.discountValue}% OFF`
                                        : `₹${c.discountValue} OFF`}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-pink-500 group-hover:underline font-semibold">
                                    Apply →
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between text-gray-700 pt-2 border-t border-pink-100">
                    <span>Shipping</span>
                    <span
                      className={
                        shipping === 0 ? 'text-green-600 font-bold' : 'font-semibold'
                      }
                    >
                      {shipping === 0 ? 'FREE 🎉' : '₹' + shipping}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t-2 border-pink-100 mb-6">
                  <span>Total</span>
                  <span className="text-pink-600">₹{finalTotal}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className={`w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-2xl font-bold transition-all transform hover:-translate-y-0.5 ${
                    isCheckingOut ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-xl'
                  }`}
                >
                  {isCheckingOut ? 'Processing...' : 'Proceed to Checkout →'}
                </button>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center">
                    <div className="text-lg">🔒</div>
                    <p className="text-[10px] text-gray-500 font-medium">Secure</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg">💳</div>
                    <p className="text-[10px] text-gray-500 font-medium">UPI/Card/COD</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg">🚚</div>
                    <p className="text-[10px] text-gray-500 font-medium">Free ₹499+</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE STICKY CHECKOUT BAR */}
        <div className="lg:hidden sticky bottom-0 left-0 right-0 bg-white border-t-2 border-pink-200 shadow-2xl p-3 z-40">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-gray-500 font-medium">Total</p>
              <p className="text-xl font-bold text-pink-600">₹{finalTotal}</p>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-2xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isCheckingOut ? 'Processing...' : 'Checkout →'}
            </button>
          </div>
        </div>

        {/* FOOTER */}
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

export default Cart;
