import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await register(formData.name, formData.email, formData.password, 'buyer');
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      
      {/* Premium Top Bar */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
          <span>✨</span>
          <span>Free Shipping on ₹999+</span>
          <span className="hidden sm:inline">•</span>
          <span>Extra 10% off on first order</span>
          <span className="hidden sm:inline">•</span>
          <span>Cash on Delivery Available</span>
          <span>✨</span>
        </div>
      </div>

      {/* Premium Header */}
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
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-gray-50"
                  onKeyPress={(e) => e.key === 'Enter' && navigate(`/shop?search=${e.target.value}`)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
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
          <span className="text-pink-600 font-medium">Register</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 sm:py-16 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-pink-100 p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white text-2xl">✨</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Join the Pink Club!</h1>
              <p className="text-gray-500 text-sm mt-1">Create your account</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile number (optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                  placeholder="Enter your mobile number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition pr-10"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-500 transition"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M4 4l16 16" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Re-enter password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition pr-10"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-500 transition"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M4 4l16 16" />
                      </svg>
                    )}
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
                    Creating account...
                  </span>
                ) : (
                  'Create your account'
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

            <p className="text-center text-xs text-gray-400 mt-6">
              By creating an account, you agree to MyPinkShop's{' '}
              <Link to="/terms" className="text-pink-600 hover:underline">Terms of Service</Link> and{' '}
              <Link to="/privacy" className="text-pink-600 hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </main>

      {/* Premium Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6 text-xs mb-4">
            <Link to="/terms" className="hover:text-pink-500 transition">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-pink-500 transition">Privacy Policy</Link>
            <a href="#" className="hover:text-pink-500 transition">Help</a>
            <a href="#" className="hover:text-pink-500 transition">Contact Us</a>
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
  );
}

export default Register;
