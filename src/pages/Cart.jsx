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

  // ✅ Coupon States
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [eligibleCoupons, setEligibleCoupons] = useState([]);

  const API_URL = 'https://api.mypinkshop.com/api';

  // ✅ Fetch available coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await fetch(`${API_URL}/coupons/active`);
        const data = await response.json();
        if (data.success) {
          setAvailableCoupons(data.coupons || []);
        }
      } catch (error) {
        console.error('Failed to fetch coupons:', error);
      }
    };
    fetchCoupons();
  }, []);

  // ✅ Filter eligible coupons based on cart
  useEffect(() => {
    if (!availableCoupons.length || !cart.length) {
      setEligibleCoupons([]);
      return;
    }

    const eligible = availableCoupons.filter(coupon => {
      // ✅ Admin coupon (vendorId: null) - Always eligible
      if (!coupon.vendorId) {
        return true;
      }

      // ✅ Vendor coupon - Check if cart has vendor's products
      return cart.some(item => item.vendorId === coupon.vendorId);
    });

    setEligibleCoupons(eligible);
  }, [availableCoupons, cart]);

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      navigate('/checkout');
    }, 500);
  };

  const handleImageError = (itemId) => {
    setImgErrors(prev => ({ ...prev, [itemId]: true }));
  };

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

  // ✅ Apply Coupon - With vendor support
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);

    try {
      // ✅ Send cart items with vendorId for vendor coupon validation
      const cartItemsWithVendor = cart.map(item => ({
        id: item.id,
        productId: item.id,
        price: item.price,
        quantity: item.quantity,
        vendorId: item.vendorId || null
      }));

      const response = await fetch(`${API_URL}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          cartTotal: subtotal,
          userId: user?._id || null,
          cartItems: cartItemsWithVendor // ✅ Send cart items
        })
      });

      const data = await response.json();

      if (!data.valid) {
        toast.error(data.message || 'Invalid coupon');
        return;
      }

      // ✅ Coupon valid
      setDiscount(data.coupon.discountAmount);
      setAppliedCoupon(data.coupon);
      setCouponApplied(true);
      
      // ✅ Show vendor-specific message if vendor coupon
      if (data.coupon.isVendorCoupon && data.coupon.vendorName) {
        toast.success(`🎉 ${data.coupon.code} applied! You saved ₹${data.coupon.discountAmount} on ${data.coupon.vendorName} products`);
      } else {
        toast.success(`🎉 ${data.coupon.code} applied! You saved ₹${data.coupon.discountAmount}`);
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

  const subtotal = cartTotal();
  const FREE_SHIPPING_THRESHOLD = 499;
  const totalWithDiscount = subtotal - discount;
  const shipping = totalWithDiscount > FREE_SHIPPING_THRESHOLD ? 0 : 49;
  const finalTotal = totalWithDiscount + shipping;
  const remainingForFree = FREE_SHIPPING_THRESHOLD - totalWithDiscount;

  // SEO Schema
  const generateBreadcrumbSchema = () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.mypinkshop.com" },
      { "@type": "ListItem", "position": 2, "name": "Cart", "item": "https://www.mypinkshop.com/cart" }
    ]
  });

  const generateOrganizationSchema = () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MyPinkShop",
    "url": "https://www.mypinkshop.com",
    "logo": "https://www.mypinkshop.com/logo.png"
  });

  if (cart.length === 0) {
    return (
      <>
        <Helmet>
          <title>Shopping Cart - MyPinkShop | Your cart is empty</title>
          <meta name="description" content="Your shopping cart is empty. Shop the latest skincare, makeup, hair care, clothing, and accessories at MyPinkShop. Free shipping on orders above ₹499." />
          <meta name="keywords" content="shopping cart, empty cart, buy products, skincare, makeup, clothing, accessories" />
          <link rel="canonical" href="https://www.mypinkshop.com/cart" />
          <meta property="og:title" content="Shopping Cart - MyPinkShop" />
          <meta property="og:description" content="Your shopping cart is empty. Start shopping now!" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://www.mypinkshop.com/cart" />
          <meta property="og:image" content="https://www.mypinkshop.com/og-cart.jpg" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Shopping Cart - MyPinkShop" />
          <meta name="twitter:description" content="Your shopping cart is empty. Start shopping now!" />
          <meta name="twitter:image" content="https://www.mypinkshop.com/og-cart.jpg" />
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
                  <button onClick={() => navigate('/wishlist')} className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{wishlistCount}</span>}
                  </button>
                  
                  <Link to="/cart" className="relative p-1.5 sm:p-2 text-pink-500 transition">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
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

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto border border-pink-100 shadow-sm">
              <div className="text-8xl mb-6 animate-bounce">🛒</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
              <Link to="/shop" className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-xl transition-all transform hover:-translate-y-1">
                Start Shopping →
              </Link>
            </div>
          </div>

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
                    <li><a href="#" className="hover:text-pink-500 transition">TikTok</a></li>
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

  return (
    <>
      <Helmet>
        <title>Shopping Cart - MyPinkShop | Review Your Order</title>
        <meta name="description" content="Review your shopping cart at MyPinkShop. Checkout securely with free shipping on orders above ₹499. Cash on delivery available." />
        <meta name="keywords" content="shopping cart, checkout, buy products, cart items, mypinkshop cart" />
        <link rel="canonical" href="https://www.mypinkshop.com/cart" />
        <meta property="og:title" content="Shopping Cart - MyPinkShop" />
        <meta property="og:description" content="Review your cart and checkout securely. Free shipping on orders above ₹499." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mypinkshop.com/cart" />
        <meta property="og:image" content="https://www.mypinkshop.com/og-cart.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Shopping Cart - MyPinkShop" />
        <meta name="twitter:description" content="Review your cart and checkout securely." />
        <meta name="twitter:image" content="https://www.mypinkshop.com/og-cart.jpg" />
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
                <button onClick={() => navigate('/wishlist')} className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{wishlistCount}</span>}
                </button>
                
                <Link to="/cart" className="relative p-1.5 sm:p-2 text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    {cart.reduce((sum, i) => sum + i.quantity, 0)}
                  </span>
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm overflow-x-auto pb-1">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition whitespace-nowrap">Home</Link>
            <span className="text-gray-400 whitespace-nowrap">/</span>
            <span className="text-pink-600 font-medium whitespace-nowrap">Cart</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 flex flex-wrap items-center gap-2">
            <span>🛒</span> Shopping Cart
            <span className="text-sm font-normal text-gray-400">({cart.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
          </h1>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1 overflow-x-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 overflow-hidden shadow-sm min-w-[280px]">
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-pink-50 to-rose-50 text-sm font-semibold text-gray-600 border-b border-pink-100">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-center">Total</div>
                </div>

                {cart.map((item) => (
                  <div key={item.id} className="group grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-4 md:px-6 py-5 border-b border-pink-100 hover:bg-pink-50/30 transition">
                    <div className="md:col-span-6 flex gap-4">
                      <Link to={`/product/${item.id}`} className="block flex-shrink-0">
                        {item.image && !imgErrors[item.id] ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-16 h-16 rounded-xl object-cover border border-pink-100 hover:scale-105 transition-transform cursor-pointer bg-white"
                            loading="lazy"
                            decoding="async"
                            width="64"
                            height="64"
                            style={{ aspectRatio: '1/1' }}
                            onError={() => handleImageError(item.id)}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl flex items-center justify-center text-2xl shadow-sm hover:scale-105 transition-transform cursor-pointer">
                            {item.emoji || '✨'}
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${item.id}`}>
                          <h3 className="font-semibold text-gray-800 hover:text-pink-500 transition line-clamp-1">{item.name}</h3>
                        </Link>
                        {item.vendorId && (
                          <p className="text-[10px] text-purple-500 mt-0.5">🛍️ Vendor Product</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5 capitalize">{item.category || 'Product'}</p>
                        <button 
                          onClick={() => handleRemoveItem(item.id, item.name)}
                          className="text-xs text-red-400 mt-2 hover:text-red-600 transition flex items-center gap-1"
                        >
                          <span>🗑️</span> Remove
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-2 text-left md:text-center">
                      <span className="md:hidden text-gray-500 text-sm mr-2 inline-block">Price:</span>
                      <span className="font-semibold text-gray-800">₹{item.price}</span>
                    </div>

                    <div className="md:col-span-2 flex justify-start md:justify-center">
                      <div className="flex items-center gap-3 border border-pink-200 rounded-full px-3 py-1 bg-white shadow-sm">
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.stock)}
                          className="w-7 h-7 rounded-full hover:bg-pink-100 text-pink-500 font-bold transition flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.stock)}
                          className="w-7 h-7 rounded-full hover:bg-pink-100 text-pink-500 font-bold transition flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-2 text-left md:text-center">
                      <span className="md:hidden text-gray-500 text-sm mr-2 inline-block">Total:</span>
                      <span className="font-bold text-pink-600 text-lg">₹{item.price * item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/shop" className="inline-flex items-center gap-2 mt-6 text-pink-500 hover:text-pink-600 font-medium transition group">
                <span className="group-hover:-translate-x-1 transition">←</span> Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:w-96">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-6 sticky top-24 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-pink-100 flex items-center gap-2">
                  <span>📋</span> Order Summary
                </h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>

                  {/* ✅ COUPON SECTION WITH VENDOR SUPPORT */}
                  {couponApplied ? (
                    <div className="flex flex-col gap-1 py-2 border-t border-pink-100">
                      <div className="flex justify-between text-green-600">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Discount ({appliedCoupon?.code})</span>
                          {appliedCoupon?.isVendorCoupon && appliedCoupon?.vendorName && (
                            <span className="text-[10px] text-purple-600 font-normal">
                              🛍️ Applicable on {appliedCoupon.vendorName} products only
                            </span>
                          )}
                          {appliedCoupon?.description && (
                            <span className="text-[10px] text-gray-500 font-normal">
                              {appliedCoupon.description}
                            </span>
                          )}
                          {!appliedCoupon?.description && appliedCoupon?.discountValue && (
                            <span className="text-[10px] text-gray-500 font-normal">
                              {appliedCoupon.discountType === 'percentage' 
                                ? `${appliedCoupon.discountValue}% off` 
                                : `₹${appliedCoupon.discountValue} off`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">-₹{discount}</span>
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
                          placeholder="Enter coupon code" 
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-200"
                          disabled={validatingCoupon}
                        />
                        <button 
                          onClick={handleApplyCoupon}
                          disabled={validatingCoupon || !couponCode.trim()}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            validatingCoupon || !couponCode.trim()
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-pink-500 text-white hover:bg-pink-600 hover:shadow-md'
                          }`}
                        >
                          {validatingCoupon ? '...' : 'Apply'}
                        </button>
                      </div>
                      
                      {/* ✅ BEAUTIFUL AVAILABLE COUPONS - WITH VENDOR INFO */}
                      {!couponApplied && eligibleCoupons.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                            <span>🎫</span> Available Coupons
                            <span className="text-[10px] text-gray-400 font-normal">
                              ({eligibleCoupons.length} eligible)
                            </span>
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {eligibleCoupons.map((c, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCouponCode(c.code)}
                                className="w-full text-left px-3 py-2 border border-dashed border-pink-200 rounded-lg hover:border-pink-400 hover:bg-pink-50/50 transition group flex flex-col"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-pink-600 text-sm group-hover:text-pink-700">
                                      {c.code}
                                    </span>
                                    <span className="text-[10px] bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full">
                                      {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                                    </span>
                                    {c.vendorId && (
                                      <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                                        🛍️ {c.vendorName || 'Vendor'}
                                      </span>
                                    )}
                                    {!c.vendorId && (
                                      <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">
                                        🌐 All Products
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-pink-500 group-hover:text-pink-700 group-hover:underline">
                                    Apply →
                                  </span>
                                </div>
                                {c.description && (
                                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                                    {c.description}
                                  </p>
                                )}
                                {!c.description && (
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    Min. Order ₹{c.minOrderValue}
                                  </p>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* ✅ Show ineligible coupons message */}
                      {!couponApplied && availableCoupons.length > 0 && eligibleCoupons.length === 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <span>🔒</span> No coupons available for your cart
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {availableCoupons.some(c => c.vendorId) && 
                              'Vendor coupons require products from that vendor in your cart'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between text-gray-600 pt-1 border-t border-pink-100">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-green-500 font-medium' : ''}>
                      {shipping === 0 ? 'FREE' : '₹' + shipping}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t border-pink-100 mb-6">
                  <span>Total</span>
                  <span className="text-pink-500">₹{finalTotal}</span>
                </div>

                {shipping > 0 && (
                  <div className="mb-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700 text-center">
                    ✨ Add ₹{remainingForFree} more for FREE shipping!
                  </div>
                )}

                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className={`w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-semibold transition-all transform hover:-translate-y-0.5 ${
                    isCheckingOut ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-lg'
                  }`}
                >
                  {isCheckingOut ? 'Processing...' : 'Proceed to Checkout →'}
                </button>

                <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">🔒 Secure</span>
                  <span className="flex items-center gap-1">💳 Card/UPI/COD</span>
                  <span className="flex items-center gap-1">🚚 Free on ₹499+</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
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
                  <li><a href="#" className="hover:text-pink-500 transition">TikTok</a></li>
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
