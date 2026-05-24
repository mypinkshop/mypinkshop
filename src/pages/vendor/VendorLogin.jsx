import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function VendorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Clear error when typing
  useEffect(() => {
    if (error) setError('');
  }, [email, password]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    
    setLoading(true);
    setError('');

    // Use setTimeout with 100ms for instant feel
    setTimeout(() => {
      try {
        const vendors = JSON.parse(localStorage.getItem('registeredVendors') || '[]');
        const vendor = vendors.find(v => v.email === email);
        
        if (!vendor) {
          setError('No account found with this email');
          setLoading(false);
          return;
        }
        
        if (vendor.password !== password) {
          setError('Invalid password');
          setLoading(false);
          return;
        }
        
        if (vendor.vendorStatus !== 'approved') {
          setError('Your account is pending approval. Please wait for admin approval.');
          setLoading(false);
          return;
        }
        
        // Fast login - save to localStorage
        localStorage.setItem('vendorToken', 'vendor_' + Date.now());
        localStorage.setItem('vendor', JSON.stringify({
          id: vendor.id,
          name: vendor.brandName,
          email: vendor.email,
          brandName: vendor.brandName,
          role: 'vendor',
          status: vendor.vendorStatus
        }));
        
        // Immediate redirect
        navigate('/vendor/dashboard');
      } catch (err) {
        setError('Something went wrong');
        setLoading(false);
      }
    }, 50); // 50ms delay for smooth UX
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-pink-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg">
            🏪
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Vendor Login</h2>
          <p className="text-gray-500 mt-2">Login to your seller dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
              placeholder="vendor@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 pr-10"
                placeholder="••••••••"
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login →'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6 text-sm">
          Don't have a seller account?{' '}
          <Link to="/vendor/register" className="text-pink-500 hover:underline font-medium">
            Register as Vendor
          </Link>
        </p>
      </div>
    </div>
  );
}

export default VendorLogin;
