import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

function VendorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const API_URL = 'https://api.mypinkshop.com';

  // ✅ Check if already logged in
  useEffect(() => {
    const vendorToken = localStorage.getItem('vendorToken');
    if (vendorToken) {
      navigate('/vendor/dashboard');
    }
  }, [navigate]);

  // ✅ Clear error when typing
  useEffect(() => {
    if (error) setError('');
  }, [email, password]);

  // ✅ BACKEND API INTEGRATION
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('❌ Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/vendor/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email, 
          password,
          rememberMe 
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // ✅ Store vendor data
        localStorage.setItem('vendorToken', data.token);
        localStorage.setItem('vendor', JSON.stringify({
          id: data.vendor.id,
          name: data.vendor.name,
          email: data.vendor.email,
          brandName: data.vendor.brandName,
          role: 'vendor',
          status: data.vendor.status,
          storeId: data.vendor.storeId,
          permissions: data.vendor.permissions || [],
          expiresAt: rememberMe ? Date.now() + 30 * 24 * 60 * 60 * 1000 : Date.now() + 24 * 60 * 60 * 1000
        }));

        // ✅ Show success message
        toast.success('Welcome back! 🏪');

        // ✅ Redirect to dashboard
        navigate('/vendor/dashboard');
        
      } else {
        // ✅ Handle different error cases
        const errorMessage = data.message || data.error || 'Login failed';
        setError(`❌ ${errorMessage}`);
        
        // ✅ Track failed attempts
        if (data.attempts && data.attempts >= 3) {
          toast.error('Too many failed attempts. Account temporarily locked.');
        }
      }
    } catch (err) {
      console.error('Vendor login error:', err);
      setError('❌ Network error. Please check your connection.');
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Forgot Password
  const handleForgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/vendor/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Password reset link sent to your email! 📧');
      } else {
        toast.error(data.message || 'Failed to send reset link');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Vendor Login - MyPinkShop Seller Dashboard</title>
        <meta name="description" content="Login to your MyPinkShop vendor dashboard. Manage products, track orders, and grow your business." />
        <link rel="canonical" href="https://www.mypinkshop.com/vendor/login" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-pink-100 p-8 max-w-md w-full">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg">
              🏪
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Vendor Login</h2>
            <p className="text-gray-500 mt-2">Login to your seller dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                placeholder="vendor@example.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => {
                  if (email) {
                    handleForgotPassword(email);
                  } else {
                    toast.error('Please enter your email first');
                  }
                }}
                className="text-sm text-pink-600 hover:underline transition"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Logging in...
                </span>
              ) : (
                'Login →'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">New vendor?</span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            to="/vendor/register"
            className="block w-full text-center border-2 border-pink-500 bg-transparent text-pink-600 font-medium py-2.5 rounded-xl hover:bg-pink-50 transition-all"
          >
            Register as Vendor
          </Link>

          {/* Footer Links */}
          <div className="mt-4 flex justify-center gap-4 text-xs text-gray-400">
            <Link to="/" className="hover:text-pink-500 transition">Home</Link>
            <Link to="/contact" className="hover:text-pink-500 transition">Support</Link>
            <Link to="/terms" className="hover:text-pink-500 transition">Terms</Link>
          </div>

          {/* Vendor Tips */}
          <div className="mt-6 p-3 bg-pink-50 rounded-xl border border-pink-100">
            <p className="text-xs text-gray-600">
              💡 <strong>Vendor Tips:</strong>
            </p>
            <ul className="text-xs text-gray-500 mt-1 space-y-1">
              <li>• Keep your product catalog updated</li>
              <li>• Respond to customer queries quickly</li>
              <li>• Monitor your sales dashboard daily</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default VendorLogin;
