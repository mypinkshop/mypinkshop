import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Check if identifier is email or mobile
    const isEmail = identifier.includes('@');
    const email = isEmail ? identifier : `${identifier}@phone.com`; // For demo
    
    const result = await login(email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError('Invalid email/mobile or password');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    // Simulate sending reset link
    setTimeout(() => {
      setResetSent(true);
      setLoading(false);
      alert(`Password reset link sent to ${resetEmail}`);
      setShowForgotPassword(false);
      setResetEmail('');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 flex flex-col">
      
      {/* Header */}
      <header className="bg-white border-b border-pink-100 py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-block hover:opacity-80 transition">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">MyPinkShop</h1>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          {!showForgotPassword ? (
            /* Login Form */
            <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <span className="text-white text-2xl">✨</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Sign In</h1>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address or Mobile Number
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder=""
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
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
                      className="text-xs text-pink-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 pr-10"
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
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 shadow-md"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to MyPinkShop?</span>
                </div>
              </div>

              <Link
                to="/register"
                className="block w-full text-center border border-pink-500 bg-white text-pink-600 font-medium py-2 rounded-lg hover:bg-pink-50 transition"
              >
                Create your account
              </Link>

              <p className="text-center text-xs text-gray-400 mt-6">
                By continuing, you agree to MyPinkShop's{' '}
                <a href="#" className="text-pink-600 hover:underline">Conditions of Use</a> and{' '}
                <a href="#" className="text-pink-600 hover:underline">Privacy Notice</a>.
              </p>
            </div>
          ) : (
            /* Forgot Password Form */
            <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <span className="text-white text-2xl">🔐</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
                <p className="text-gray-500 text-sm mt-1">We'll send you a link to reset your password</p>
              </div>

              {resetSent && (
                <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-lg mb-4 text-sm">
                  Password reset link sent! Check your email.
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Enter the email address associated with your account.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 shadow-md"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full text-center text-gray-600 hover:text-pink-600 text-sm transition"
                >
                  ← Back to Sign In
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-pink-100 py-6 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500 mb-4">
            <a href="#" className="hover:text-pink-500 transition">Conditions of Use</a>
            <a href="#" className="hover:text-pink-500 transition">Privacy Notice</a>
            <a href="#" className="hover:text-pink-500 transition">Help</a>
          </div>
          <p className="text-center text-xs text-gray-400">
            © 2026 MyPinkShop. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Login;
