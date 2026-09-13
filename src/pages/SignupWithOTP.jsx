import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';

function SignupWithOTP() {
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
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // ========== SEND OTP ==========
  const sendOTP = async () => {
    const cleanMobile = formData.mobile.replace(/\D/g, '');
    const cleanEmail = formData.email.toLowerCase().trim();

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return false;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (!cleanMobile || cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit WhatsApp number.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          phone: cleanMobile,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResendTimer(30);
        toast.success(data.message || 'OTP sent successfully');
        return true;
      } else {
        setError(data.error || 'Unable to send OTP. Please try again.');
        return false;
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setError('Something went wrong. Please check your connection and try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ========== VERIFY OTP AND CREATE ACCOUNT ==========
  const verifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    const cleanEmail = formData.email.toLowerCase().trim();
    const cleanMobile = formData.mobile.replace(/\D/g, '');

    setLoading(true);
    setError('');

    try {
      // Step 1: Verify OTP
      const verifyRes = await fetch(`${API_URL}/api/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: otp,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        setError(verifyData.error || 'Invalid OTP. Please try again.');
        setLoading(false);
        return;
      }

      // Step 2: Register user with password
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
        setError('An account with this email already exists. Please login.');
        setLoading(false);
      } else {
        // OTP verified but register failed — still redirect to login
        toast.success('Account verified! Please sign in.');
        navigate('/login');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    const sent = await sendOTP();
    if (sent) setStep(2);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    await verifyOTP();
  };

  const resendOTP = async () => {
    if (resendTimer > 0) return;
    setError('');
    const sent = await sendOTP();
    if (sent) {
      toast.success('OTP resent successfully');
    }
  };

  const generateBreadcrumbSchema = () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.mypinkshop.com" },
      { "@type": "ListItem", "position": 2, "name": "Sign Up", "item": "https://www.mypinkshop.com/signup" }
    ]
  });

  if (user) {
    navigate('/');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Create Customer Account - Sign Up | MyPinkShop</title>
        <meta name="description" content="Create your MyPinkShop customer account to enjoy exclusive offers, track orders, save wishlist items. Sign up with WhatsApp OTP verification." />
        <meta name="keywords" content="sign up, create account, customer registration, mypinkshop signup, new account, register" />
        <link rel="canonical" href="https://www.mypinkshop.com/signup" />
        <meta property="og:title" content="Create Customer Account - Sign Up | MyPinkShop" />
        <meta property="og:description" content="Join MyPinkShop today and get 10% off on your first order. Fast checkout, order tracking, and exclusive offers." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mypinkshop.com/signup" />
        <meta property="og:image" content="https://www.mypinkshop.com/og-signup.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Create Customer Account - Sign Up | MyPinkShop" />
        <meta name="twitter:description" content="Join MyPinkShop for exclusive offers and benefits." />
        <meta name="twitter:image" content="https://www.mypinkshop.com/og-signup.jpg" />
        <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema())}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">

        <OfferBanner />

        {/* HEADER */}
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

        {/* BREADCRUMB */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">Sign Up</span>
          </div>
        </div>

        <main className="flex-1 flex items-center justify-center py-12 sm:py-16 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-pink-100 p-6 sm:p-8">

              {step === 1 ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-white text-2xl">📝</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Join the Pink Club! 🎀</h1>
                    <p className="text-gray-500 text-sm mt-1">Create your customer account with WhatsApp verification</p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-start gap-2">
                      <span className="mt-0.5">⚠️</span> <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                        required
                      />
                      <p className="text-xs text-gray-400 mt-1">OTP will be sent to this email</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number *</label>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="10-digit WhatsApp number"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                        required
                      />
                      <p className="text-xs text-gray-400 mt-1">OTP will be sent to this WhatsApp number</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create a password (min 6 characters)"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-500 transition"
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Re-enter your password"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-500 transition"
                        >
                          {showConfirmPassword ? '🙈' : '👁️'}
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
                          Sending OTP...
                        </span>
                      ) : (
                        'Continue with WhatsApp OTP →'
                      )}
                    </button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white text-gray-500">Already have an account?</span>
                    </div>
                  </div>

                  <Link
                    to="/login"
                    className="block w-full text-center border-2 border-pink-500 bg-transparent text-pink-600 font-medium py-2.5 rounded-xl hover:bg-pink-50 transition-all"
                  >
                    Sign In
                  </Link>

                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400">
                      Want to sell with us?{' '}
                      <Link to="/vendor/register" className="text-pink-600 hover:underline font-medium">
                        Register as Vendor →
                      </Link>
                    </p>
                  </div>

                  <p className="text-center text-xs text-gray-400 mt-4">
                    By creating an account, you agree to MyPinkShop's{' '}
                    <Link to="/terms" className="text-pink-600 hover:underline">Terms</Link> and{' '}
                    <Link to="/privacy" className="text-pink-600 hover:underline">Privacy</Link>.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-white text-2xl">🔐</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Verify Your WhatsApp Number</h1>
                    <p className="text-gray-500 text-sm mt-2">
                      We've sent a 6-digit OTP to WhatsApp number
                    </p>
                    <p className="font-semibold text-pink-600 text-sm mt-1">
                      +91 {formData.mobile}
                    </p>
                    <p className="text-xs text-pink-500 mt-2">
                      Sent via WhatsApp and Email
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-start gap-2">
                      <span className="mt-0.5">⚠️</span> <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyOTP} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        maxLength="6"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 text-center text-2xl tracking-[0.5em] font-mono"
                        placeholder="000000"
                        autoFocus
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium py-2.5 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating Account...
                        </span>
                      ) : (
                        'Verify & Create Account'
                      )}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={resendOTP}
                        disabled={resendTimer > 0}
                        className={`text-sm transition ${
                          resendTimer > 0
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-pink-600 hover:underline'
                        }`}
                      >
                        {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setOtp('');
                        setError('');
                      }}
                      className="w-full text-center text-gray-500 hover:text-pink-600 text-sm transition flex items-center justify-center gap-1 mt-2"
                    >
                      <span>←</span> Back to signup
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </main>

        <footer className="bg-gray-900 text-gray-400 py-8 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-6 text-xs mb-4">
              <Link to="/terms" className="hover:text-pink-500 transition">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-pink-500 transition">Privacy Policy</Link>
              <Link to="/contact" className="hover:text-pink-500 transition">Contact Us</Link>
              <Link to="/faqs" className="hover:text-pink-500 transition">FAQs</Link>
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

export default SignupWithOTP;
