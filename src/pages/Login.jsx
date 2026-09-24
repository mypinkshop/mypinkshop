import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';

function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  // ========== FORGOT PASSWORD STATE ==========
  const [resetMethod, setResetMethod] = useState('email'); // 'email' | 'phone'
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetChannels, setResetChannels] = useState({ email: false, whatsapp: false });

  // ========== OTP FLOW STATE ==========
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const { login } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  const isEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isPhone = (val) => /^[0-9]{10}$/.test(val.replace(/\D/g, ''));
  const isPhoneInput = isPhone(identifier.replace(/\D/g, '')) && !isEmail(identifier);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // ========== EMAIL + PASSWORD LOGIN ==========
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setShowSuggestion(false);

    if (!identifier || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (!isEmail(identifier)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        login(data.token, data.user);
        toast.success('Welcome back!');
        redirectUser(data.user);
      } else {
        setError(data.error || data.message || 'Invalid email or password. Please try again.');
        setShowSuggestion(true);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ========== PHONE + OTP LOGIN ==========
  const handleSendOTP = async (e) => {
    e.preventDefault();

    const cleanPhone = identifier.replace(/\D/g, '');

    if (!isPhone(cleanPhone)) {
      setError('Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const dummyEmail = `${cleanPhone}@phone.mypinkshop.com`;

      const response = await fetch(`${API_URL}/api/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: dummyEmail,
          phone: cleanPhone,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpPhone(cleanPhone);
        setOtpEmail(dummyEmail);
        setShowOTP(true);
        setResendTimer(30);
        toast.success(data.message || 'OTP sent to your WhatsApp.');
      } else {
        setError(data.error || 'Unable to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('OTP send error:', err);
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        login(data.token, data.user);
        toast.success('Welcome back!');
        redirectUser(data.user);
      } else {
        setError(data.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('OTP verify error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/otp/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: otpEmail,
          phone: otpPhone,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResendTimer(30);
        toast.success(data.message || 'OTP resent to your WhatsApp.');
      } else {
        setError(data.error || 'Unable to resend OTP. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FORGOT PASSWORD — दोनों options (Email OR WhatsApp)
  // ============================================================
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    // Validation — method के हिसाब से input check करें
    if (resetMethod === 'email') {
      if (!resetEmail || !isEmail(resetEmail)) {
        setError('Please enter a valid email address.');
        return;
      }
    } else {
      const cleanPhone = resetPhone.replace(/\D/g, '');
      if (!isPhone(cleanPhone)) {
        setError('Please enter a valid 10-digit WhatsApp number.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      // दोनों methods के लिए same backend endpoint
      // Backend email से user ढूँढेगा, फिर email + WhatsApp भेजेगा
      const payload =
        resetMethod === 'email'
          ? { email: resetEmail.trim().toLowerCase() }
          : { phone: resetPhone.replace(/\D/g, '') };

      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setResetSent(true);
        setError('');

        const emailSent = data.channels?.email === true;
        const whatsappSent = data.channels?.whatsapp === true;
        setResetChannels({ email: emailSent, whatsapp: whatsappSent });

        // Dynamic toast message — कौन-कौन से channel पर भेजा
        let toastMsg = 'Reset link sent!';
        if (emailSent && whatsappSent) {
          toastMsg = 'Reset link sent to your email & WhatsApp 📧📱';
        } else if (whatsappSent) {
          toastMsg = 'Reset link sent to your WhatsApp 📱';
        } else if (emailSent) {
          toastMsg = 'Reset link sent to your email 📧';
        }
        toast.success(toastMsg);
      } else {
        setError(data.error || 'Unable to send reset link. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form को initial state में लाएँ
  const resetForgotPasswordForm = () => {
    setShowForgotPassword(false);
    setError('');
    setResetSent(false);
    setResetEmail('');
    setResetPhone('');
    setResetMethod('email');
    setResetChannels({ email: false, whatsapp: false });
  };

  const redirectUser = (user) => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (user?.role === 'vendor') {
      navigate('/vendor/dashboard');
    } else {
      navigate('/');
    }
  };

  const generateBreadcrumbSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mypinkshop.com' },
      { '@type': 'ListItem', position: 2, name: 'Login', item: 'https://www.mypinkshop.com/login' },
    ],
  });

  return (
    <>
      <Helmet>
        <title>Login - MyPinkShop</title>
        <meta name="description" content="Login to your MyPinkShop account." />
        <link rel="canonical" href="https://www.mypinkshop.com/login" />
        <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema())}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-pink-100">
        <OfferBanner />

        {/* ================= HEADER ================= */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
              <Link to="/" className="flex items-center gap-2 shrink-0 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg sm:text-xl">M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                    MyPinkShop
                  </h1>
                  <p className="text-[9px] sm:text-[10px] text-pink-500 font-semibold tracking-wider">FOR THE GIRLIES ✨</p>
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
                <Link to="/wishlist" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              </div>
            </div>
          </div>
        </header>

        {/* ================= BREADCRUMB ================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">Login</span>
          </div>
        </div>

        {/* ================= MAIN ================= */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* LEFT — BENEFITS */}
            <div className="hidden lg:block">
              <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 text-[300px] flex items-center justify-center pointer-events-none select-none">
                  💖
                </div>
                <div className="relative z-10">
                  <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                    ✨ MEMBER BENEFITS
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
                    Welcome to the <br />Pink Club 💕
                  </h2>
                  <p className="text-pink-100 mb-8 text-lg">
                    10,000+ happy customers trust us for their beauty needs
                  </p>
                  <div className="space-y-5">
                    {[
                      { icon: '🎁', title: 'Exclusive Offers', sub: 'Extra 10% off on first order' },
                      { icon: '🚚', title: 'Free Shipping', sub: 'On orders above ₹499' },
                      { icon: '💖', title: 'Save Wishlist', sub: 'Never lose your favorites' },
                      { icon: '📦', title: 'Track Orders', sub: 'Real-time delivery updates' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">{item.icon}</span>
                        </div>
                        <div>
                          <p className="font-bold text-white">{item.title}</p>
                          <p className="text-sm text-pink-100">{item.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — FORM */}
            <div className="w-full max-w-md mx-auto lg:mx-0">

              {/* ============================================================ */}
              {/* OTP SCREEN                                                    */}
              {/* ============================================================ */}
              {showOTP ? (
                <div className="bg-white rounded-3xl shadow-2xl border border-pink-100 p-6 sm:p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-white text-3xl">🔐</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Verify OTP</h1>
                    <p className="text-gray-500 text-sm mt-2">We've sent a 6-digit code to</p>
                    <p className="text-gray-800 font-semibold text-sm mt-1">+91 {otpPhone}</p>
                    <p className="text-xs text-pink-500 mt-2">Sent via WhatsApp</p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-start gap-2">
                      <span className="mt-0.5">⚠️</span> <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyOTP} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-center text-2xl tracking-[12px] font-bold"
                        placeholder="------"
                        maxLength={6}
                        autoFocus
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-3.5 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Verifying...
                        </span>
                      ) : (
                        'Verify and Sign In'
                      )}
                    </button>

                    <div className="flex items-center justify-between text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setShowOTP(false);
                          setOtp('');
                          setError('');
                        }}
                        className="text-gray-600 hover:text-pink-600 font-medium transition"
                      >
                        ← Change number
                      </button>

                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={resendTimer > 0 || loading}
                        className="text-pink-600 hover:text-pink-700 font-medium transition disabled:text-gray-400"
                      >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : !showForgotPassword ? (
                /* ============================================================ */
                /* MAIN LOGIN FORM                                              */
                /* ============================================================ */
                <div className="bg-white rounded-3xl shadow-2xl border border-pink-100 p-6 sm:p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-white text-3xl">✨</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500 text-sm mt-1">Sign in to continue shopping</p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-start gap-2">
                      <span className="mt-0.5">⚠️</span> <span>{error}</span>
                    </div>
                  )}

                  {showSuggestion && (
                    <div className="bg-pink-50 border border-pink-200 text-pink-700 p-4 rounded-xl mb-4 text-sm">
                      <p className="font-semibold mb-2">💡 Try another way to sign in:</p>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setShowSuggestion(false);
                            setError('');
                          }}
                          className="block w-full text-left text-pink-600 hover:text-pink-800 font-medium transition"
                        >
                          → Forgot Password? Reset via email or WhatsApp
                        </button>
                        <p className="text-gray-600 text-xs">
                          Or enter your WhatsApp number above to sign in with OTP.
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={isPhoneInput ? handleSendOTP : handlePasswordLogin} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email Address / WhatsApp Number
                      </label>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          setError('');
                          setShowSuggestion(false);
                        }}
                        className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm"
                        placeholder="you@example.com or 9876543210"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        Email → Sign in with password &nbsp;|&nbsp; WhatsApp Number → Get OTP
                      </p>
                    </div>

                    {!isPhoneInput && (
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-sm font-semibold text-gray-700">
                            Password
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-xs text-pink-600 hover:underline font-medium"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition pr-12 text-sm"
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-500 transition text-lg"
                          >
                            {showPassword ? '👁️' : '🔒'}
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-3.5 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {isPhoneInput ? 'Sending OTP...' : 'Signing in...'}
                        </span>
                      ) : isPhoneInput ? (
                        'Send OTP'
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-pink-100"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white text-gray-500 font-medium">New to MyPinkShop?</span>
                    </div>
                  </div>

                  <Link
                    to="/register"
                    className="block w-full text-center border-2 border-pink-500 bg-transparent text-pink-600 font-bold py-3.5 rounded-xl hover:bg-pink-50 transition-all"
                  >
                    Create your account
                  </Link>

                  <div className="mt-6 pt-6 border-t border-pink-100 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xl mb-1">🔒</div>
                      <p className="text-[10px] text-gray-500 font-medium">Secure</p>
                    </div>
                    <div>
                      <div className="text-xl mb-1">⚡</div>
                      <p className="text-[10px] text-gray-500 font-medium">Fast</p>
                    </div>
                    <div>
                      <div className="text-xl mb-1">💖</div>
                      <p className="text-[10px] text-gray-500 font-medium">Trusted</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* ============================================================ */
                /* FORGOT PASSWORD — EMAIL + WHATSAPP दोनों OPTIONS              */
                /* ============================================================ */
                <div className="bg-white rounded-3xl shadow-2xl border border-pink-100 p-6 sm:p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-white text-3xl">🔐</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reset Password</h1>
                    <p className="text-gray-500 text-sm mt-1">
                      Choose how you want to receive the reset link
                    </p>
                  </div>

                  {/* ============ SUCCESS STATE ============ */}
                  {resetSent ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm">
                        <p className="font-semibold mb-2 flex items-center gap-2">
                          <span>✓</span> Reset link sent successfully!
                        </p>
                        <ul className="text-xs space-y-1 ml-5 list-disc">
                          {resetChannels.email && <li>📧 Check your <strong>Email inbox</strong></li>}
                          {resetChannels.whatsapp && <li>📱 Check your <strong>WhatsApp messages</strong></li>}
                          <li>⏰ Link expires in <strong>30 minutes</strong></li>
                          <li>📁 Also check <strong>spam folder</strong> (email)</li>
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={resetForgotPasswordForm}
                        className="w-full text-center border-2 border-pink-500 bg-transparent text-pink-600 font-bold py-3 rounded-xl hover:bg-pink-50 transition-all"
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  ) : (
                    /* ============ INPUT STATE ============ */
                    <>
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-start gap-2">
                          <span className="mt-0.5">⚠️</span> <span>{error}</span>
                        </div>
                      )}

                      {/* ============ METHOD TOGGLE (Email / WhatsApp) ============ */}
                      <div className="flex gap-2 p-1 bg-pink-50 rounded-2xl mb-5">
                        <button
                          type="button"
                          onClick={() => {
                            setResetMethod('email');
                            setError('');
                          }}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            resetMethod === 'email'
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                              : 'text-gray-600 hover:text-pink-600'
                          }`}
                        >
                          📧 Email
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResetMethod('phone');
                            setError('');
                          }}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            resetMethod === 'phone'
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                              : 'text-gray-600 hover:text-pink-600'
                          }`}
                        >
                          📱 WhatsApp
                        </button>
                      </div>

                      <form onSubmit={handleForgotPassword} className="space-y-5">
                        {/* ============ EMAIL INPUT ============ */}
                        {resetMethod === 'email' ? (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={resetEmail}
                              onChange={(e) => {
                                setResetEmail(e.target.value);
                                setError('');
                              }}
                              className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm"
                              placeholder="Enter your registered email"
                              required
                              autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-1.5">
                              📧 Reset link will be sent to this email
                              <br />
                              📱 If your WhatsApp number is registered, you'll get it there too
                            </p>
                          </div>
                        ) : (
                          /* ============ PHONE INPUT ============ */
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                              WhatsApp Number
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                                +91
                              </span>
                              <input
                                type="tel"
                                inputMode="numeric"
                                value={resetPhone}
                                onChange={(e) => {
                                  setResetPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                                  setError('');
                                }}
                                className="w-full pl-14 pr-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm tracking-wide"
                                placeholder="9876543210"
                                maxLength={10}
                                required
                                autoFocus
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5">
                              📱 Reset link will be sent to this WhatsApp number
                              <br />
                              🔒 Make sure this number is registered with your account
                            </p>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-3.5 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                        >
                          {loading ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Sending...
                            </span>
                          ) : resetMethod === 'email' ? (
                            'Send Reset Link via Email 📧'
                          ) : (
                            'Send Reset Link via WhatsApp 📱'
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={resetForgotPasswordForm}
                          className="w-full text-center text-gray-600 hover:text-pink-600 text-sm font-medium transition"
                        >
                          ← Back to Sign In
                        </button>
                      </form>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ================= FOOTER ================= */}
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
                  <li><Link to="/shipping" className="hover:text-pink-500 transition">Shipping Info</Link></li>
                  <li><Link to="/returns" className="hover:text-pink-500 transition">Returns Policy</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Follow Us</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="https://www.instagram.com/mypinkshopofficial" className="hover:text-pink-500 transition">Instagram</a></li>
                  <li><a href="https://www.facebook.com/mypinkshopofficial" className="hover:text-pink-500 transition">Facebook</a></li>
                
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

export default Login;
