import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = 'https://api.mypinkshop.com';

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('❌ Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('❌ Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || '❌ Invalid or expired reset link');
      }
    } catch (err) {
      setError('❌ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-pink-100 p-5 sm:p-6 md:p-8">
          
          {/* Header */}
          <div className="text-center mb-5 sm:mb-6 md:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
              <span className="text-white text-xl sm:text-2xl md:text-3xl">🔑</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Reset Password</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1 md:mt-2">Enter your new password</p>
          </div>

          {/* Messages */}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-600 p-2.5 sm:p-3 rounded-xl mb-3 sm:mb-4 text-xs sm:text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-2.5 sm:p-3 rounded-xl mb-3 sm:mb-4 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">
            {/* New Password */}
            <div>
              <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm sm:text-base pr-10"
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
              <p className="text-gray-400 text-xs mt-1">Minimum 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition text-sm sm:text-base pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-500 transition"
                >
                  {showConfirmPassword ? '👁️' : '🔒'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium py-2 sm:py-2.5 md:py-3 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none text-sm sm:text-base mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Resetting...
                </span>
              ) : (
                'Reset Password →'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="text-center mt-5 sm:mt-6 md:mt-8">
            <Link to="/login" className="text-pink-500 hover:text-pink-600 text-xs sm:text-sm transition flex items-center justify-center gap-1">
              <span>←</span> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
