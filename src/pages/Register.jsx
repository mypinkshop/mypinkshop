import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';

function Register() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    if (e.target.name === 'mobile') {
      setOtpSent(false);
      setOtpVerified(false);
      setOtp('');
    }
  };

  const handleSendOTP = async () => {
    const cleanMobile = formData.mobile.replace(/\D/g, '');

    if (!cleanMobile || cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `${cleanMobile}@phone.mypinkshop.com`,
          phone: cleanMobile,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpSent(true);
        setResendTimer(30);
        toast.success(data.message || 'OTP sent to your WhatsApp.');
      } else {
        setError(data.error || 'Unable to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');

    setVerifying(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `${cleanMobile}@phone.mypinkshop.com`,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpVerified(true);
        toast.success('WhatsApp number verified successfully.');
      } else {
        setError(data.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setError('');
    await handleSendOTP();
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!otpVerified) {
      setError('Please verify your WhatsApp number first.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    const cleanEmail = formData.email.toLowerCase().trim();

    setLoading(true);
    setError('');

    try {
      const registerRes = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: cleanEmail,
          phone: cleanMobile,
          password: formData.password,
          role: 'customer',
        }),
      });

      const registerData = await registerRes.json();

      if (registerRes.ok && registerData.success) {
        toast.success('Account created successfully! Please sign in.');
        navigate('/login');
      } else if (registerData.error?.toLowerCase().includes('exist')) {
        setError('An account with this email or WhatsApp number already exists. Please login.');
      } else {
        setError(registerData.error || 'Unable to create account. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateBreadcrumbSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mypinkshop.com' },
      { '@type': 'ListItem', position: 2, name: 'Register', item: 'https://www.mypinkshop.com/register' },
    ],
  });

  if (user) {
    navigate('/');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Create Account - Register at MyPinkShop | Join the Pink Club</title>
        <meta name="description" content="Create a free account at MyPinkShop. Get 10% off on your first order, track orders, save wishlist items. Sign up with WhatsApp OTP verification." />
        <link rel="canonical" href="https://www.mypinkshop.com/register" />
        <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema())}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-pink-100 flex flex-col">
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

        {/* BREADCRUMB */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-bold">Register</span>
          </div>
        </div>

        {/* MAIN */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* LEFT — BENEFITS (Desktop only) */}
            <div className="hidden lg:block">
              <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 text-[300px] flex items-center justify-center pointer-events-none select-none">
                  ✨
                </div>

                <div className="relative z-10">
                  <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                    ✨ JOIN THE PINK CLUB
                  </span>

                  <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
                    Get <span className="text-white">10% off</span> on your first order! 💕
                  </h2>
                  <p className="text-pink-100 mb-8 text-lg">
                    Create your free account in seconds
                  </p>

                  <div className="space-y-5">
                    {[
                      { icon: '🎁', title: '10% Off First Order', sub: 'Instant discount on signup' },
                      { icon: '💖', title: 'Save Wishlist', sub: 'Never lose your favorites' },
                      { icon: '📦', title: 'Track Orders', sub: 'Real-time delivery updates' },
                      { icon: '🎉', title: 'Exclusive Offers', sub: 'Early access to sales' },
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
              <div className="bg-white rounded-3xl shadow-2xl border border-pink-100 p-6 sm:p-8">

                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white text-3xl">✨</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Join the Pink Club!</h1>
                  <p className="text-gray-500 text-sm mt-1">Get 10% off on your first order 🎉</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-start gap-2">
                    <span className="mt-0.5">⚠️</span> <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm bg-white"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm bg-white"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Order updates ke liye use hoga.</p>
                  </div>

                  {/* WhatsApp Number + Send OTP inline */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">WhatsApp Number *</label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="10-digit WhatsApp number"
                        disabled={otpVerified}
                        maxLength="10"
                        className="flex-1 px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500"
                        required
                      />
                      {!otpVerified ? (
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={loading || !formData.mobile || formData.mobile.replace(/\D/g, '').length < 10}
                          className="px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {loading ? (
                            <span className="flex items-center gap-1">
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Sending...
                            </span>
                          ) : otpSent ? (
                            'Resend'
                          ) : (
                            'Send OTP'
                          )}
                        </button>
                      ) : (
                        <div className="px-4 py-3 bg-green-50 text-green-700 text-sm font-bold rounded-xl flex items-center gap-1 whitespace-nowrap border-2 border-green-200">
                          <span>✓</span> Verified
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                      {otpVerified
                        ? '✅ WhatsApp number verified'
                        : otpSent
                        ? 'OTP sent to WhatsApp. Enter below.'
                        : 'OTP will be sent to this WhatsApp number'}
                    </p>
                  </div>

                  {/* OTP Input */}
                  {otpSent && !otpVerified && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Enter OTP *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                          maxLength="6"
                          placeholder="6-digit OTP"
                          className="flex-1 px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 text-center text-xl tracking-[0.3em] font-mono bg-white"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOTP}
                          disabled={verifying || otp.length !== 6}
                          className="px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 whitespace-nowrap"
                        >
                          {verifying ? 'Verifying...' : 'Verify'}
                        </button>
                      </div>
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          disabled={resendTimer > 0}
                          className={`text-xs font-medium transition ${
                            resendTimer > 0
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-pink-600 hover:underline'
                          }`}
                        >
                          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 6 characters"
                        className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition pr-12 text-sm bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-500 transition text-lg"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition pr-12 text-sm bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-500 transition text-lg"
                      >
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || !otpVerified}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-3.5 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating Account...
                      </span>
                    ) : !otpVerified ? (
                      '🔒 Verify WhatsApp First'
                    ) : (
                      'Create Account 🚀'
                    )}
                  </button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-pink-100"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-500 font-medium">
                      Already have an account?
                    </span>
                  </div>
                </div>

                <Link
                  to="/login"
                  className="block w-full text-center border-2 border-pink-500 bg-transparent text-pink-600 font-bold py-3.5 rounded-xl hover:bg-pink-50 transition-all"
                >
                  Sign In
                </Link>

                <p className="text-center text-xs text-gray-500 mt-6">
                  By creating an account, you agree to MyPinkShop's{' '}
                  <Link to="/terms" className="text-pink-600 hover:underline font-medium">Terms</Link> and{' '}
                  <Link to="/privacy" className="text-pink-600 hover:underline font-medium">Privacy Policy</Link>.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* FOOTER */}
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

export default Register;
