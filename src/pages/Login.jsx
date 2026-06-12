import { useState, useEffect } from 'react';
import { Link, useNavigate }react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import OfferBanner from '../components/OfferBanner';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();

  const API_URL = 'https://api.mypinkshop.com';

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

  // Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('❌ Please enter email and password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user?.role || 'buyer');
        localStorage.setItem('userEmail', data.user?.email || email);
        localStorage.setItem('userName', data.user?.name || email.split('@')[0]);
        localStorage.setItem('userId', data.user?._id || '');
        
        if (data.user?.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (data.user?.role === 'vendor') {
          navigate('/vendor/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError(data.error || data.message || '❌ Invalid email or password');
      }
    } catch (err) {
      console.error('Password login error:', err);
      setError('❌ Network issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('❌ Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setResetSent(true);
        setError('');
      } else {
        setError(data.error || 'Failed to send reset link');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // SEO Schema
  const generateBreadcrumbSchema = () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.mypinkshop.com" },
      { "@type": "ListItem", "position": 2, "name": "Login", "item": "https://www.mypinkshop.com/login" }
    ]
  });

  return (
    <>
      <Helmet>
        <title>Login to MyPinkShop - Your Beauty & Fashion Store</title>
        <meta name="description" content="Login to your MyPinkShop account to track orders, manage wishlist, and enjoy exclusive offers. New user? Sign up for 10% off your first order." />
        <meta name="keywords" content="login, sign in, my account, mypinkshop login, customer login" />
        <link rel="canonical" href="https://www.mypinkshop.com/login" />
        <meta property="og:title" content="Login to MyPinkShop" />
        <meta property="og:description" content="Login to your MyPinkShop account for exclusive offers and order tracking." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mypinkshop.com/login" />
        <meta property="og:image" content="https://www.mypinkshop.com/og-login.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Login to MyPinkShop" />
        <meta name="twitter:description" content="Login to your MyPinkShop account." />
        <meta name="twitter:image" content="https://www.mypinkshop.com/og-login.jpg" />
        <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema())}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        
        {/* Dynamic Offer Banner - Sirf Ek Baar */}
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
                <Link to="/wishlist" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{wishlistCount}</span>}
                </Link>
                
                <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{cartCount}</span>}
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">Login</span>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center py-12 sm:py-16 px-4">
          <div className="max-w-md w-full">
            {!showForgotPassword ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-pink-100 p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white text-2xl">✨</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Welcome Back!</h1>
                  <p className="text-gray-500 text-sm mt-1">Sign in to continue shopping</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <form onSubmit={handlePasswordLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-pink-600 hover:underline transition"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition pr-10"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-500 transition"
                      >
                        {showPassword ? '👁️' : '🔒'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium py-2.5 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Signing in...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-500">New to MyPinkShop?</span>
                  </div>
                </div>

                <Link
                  to="/register"
                  className="block w-full text-center border-2 border-pink-500 bg-transparent text-pink-600 font-medium py-2.5 rounded-xl hover:bg-pink-50 transition-all"
                >
                  Create your account
                </Link>

                <p className="text-center text-xs text-gray-400 mt-6">
                  By continuing, you agree to MyPinkShop's{' '}
                  <Link to="/terms" className="text-pink-600 hover:underline">Terms of Service</Link> and{' '}
                  <Link to="/privacy" className="text-pink-600 hover:underline">Privacy Policy</Link>.
                </p>
              </div>
            ) : (
              // Forgot Password Form
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-pink-100 p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white text-2xl">🔐</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Reset Password</h1>
                  <p className="text-gray-500 text-sm mt-1">We'll send you a link to reset your password</p>
                </div>

                {resetSent && (
                  <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                    <span>✓</span> Password reset link sent! Check your email.
                  </div>
                )}

                {error && !resetSent && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                      placeholder="Enter your registered email"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium py-2.5 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send reset link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError('');
                      setResetSent(false);
                    }}
                    className="w-full text-center text-gray-600 hover:text-pink-600 text-sm transition flex items-center justify-center gap-1"
                  >
                    <span>←</span> Back to Sign In
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-8 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-6 text-xs mb-4">
              <Link to="/terms" className="hover:text-pink-500 transition">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-pink-500 transition">Privacy Policy</Link>
              <Link to="/contact" className="hover:text-pink-500 transition">Help</Link>
              <Link to="/contact" className="hover:text-pink-500 transition">Contact Us</Link>
            </div>
            <p className="text-center text-xs text-gray-500">
              © 2026 MyPinkShop. All rights reserved.
            </p>
            <p className="text-center text-xs text-gray-600 mt-2">
              Made with 💖 for the girlies
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

export default Login;
