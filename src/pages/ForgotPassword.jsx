import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Password reset link sent to your email!');
        toast.success('Reset link sent! Check your inbox 📧');
        setEmail('');
      } else {
        setError(data.error || '❌ Something went wrong');
        toast.error(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('❌ Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateBreadcrumbSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mypinkshop.com' },
      { '@type': 'ListItem', position: 2, name: 'Login', item: 'https://www.mypinkshop.com/login' },
      { '@type': 'ListItem', position: 3, name: 'Forgot Password', item: 'https://www.mypinkshop.com/forgot-password' },
    ],
  });

  return (
    <>
      <Helmet>
        <title>Forgot Password - Reset Your Password | MyPinkShop</title>
        <meta name="description" content="Forgot your password? Enter your email address to receive a password reset link. Regain access to your MyPinkShop account and continue shopping." />
        <link rel="canonical" href="https://www.mypinkshop.com/forgot-password" />
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
                </Link>

                <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </Link>

                <Link to="/login" className="p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
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
            <Link to="/login" className="text-gray-500 hover:text-pink-500 transition">Login</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">Forgot Password</span>
          </div>
        </div>

        {/* MAIN */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* LEFT — BENEFITS (Desktop only) */}
            <div className="hidden lg:block">
              <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 text-[300px] flex items-center justify-center pointer-events-none select-none">
                  🔐
                </div>

                <div className="relative z-10">
                  <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                    ✨ ACCOUNT RECOVERY
                  </span>

                  <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
                    Don't Worry, <br />We Got You 💖
                  </h2>
                  <p className="text-pink-100 mb-8 text-lg">
                    Reset your password in seconds and get back to shopping
                  </p>

                  <div className="space-y-5">
                    {[
                      { icon: '📧', title: 'Email Reset Link', sub: 'Sent instantly to your inbox' },
                      { icon: '🔒', title: '100% Secure', sub: 'Encrypted & private process' },
                      { icon: '⚡', title: 'Quick Recovery', sub: 'Takes less than a minute' },
                      { icon: '💌', title: 'Spam-Free', sub: 'Check spam just in case' },
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
                    <span className="text-white text-3xl">🔐</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Forgot Password?</h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Enter your email to reset your password
                  </p>
                </div>

                {message && (
                  <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                    <span>✓</span> {message}
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      We'll send a password reset link to this email
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3.5 rounded-xl font-bold hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </span>
                    ) : (
                      'Send Reset Link ✨'
                    )}
                  </button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-pink-100"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-500 font-medium">
                      Remember your password?
                    </span>
                  </div>
                </div>

                <Link
                  to="/login"
                  className="block w-full text-center border-2 border-pink-500 bg-transparent text-pink-600 font-bold py-3.5 rounded-xl hover:bg-pink-50 transition-all"
                >
                  Back to Login
                </Link>

                <p className="text-center text-xs text-gray-500 mt-6">
                  Need help?{' '}
                  <Link to="/contact" className="text-pink-600 hover:underline font-semibold">
                    Contact Support
                  </Link>
                </p>

                {/* Trust badges mobile */}
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

export default ForgotPassword;
