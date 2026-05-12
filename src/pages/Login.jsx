import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Header */}
      <header className="border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-block">
            <h1 className="text-2xl font-bold text-pink-600">MyPinkShop</h1>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">Sign In</h1>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs text-pink-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-medium py-2 rounded-lg transition disabled:opacity-50"
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
              className="block w-full text-center border border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 rounded-lg transition"
            >
              Create your account
            </Link>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            By continuing, you agree to MyPinkShop's{' '}
            <a href="#" className="text-pink-600 hover:underline">Conditions of Use</a> and{' '}
            <a href="#" className="text-pink-600 hover:underline">Privacy Notice</a>.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500 mb-4">
            <a href="#" className="hover:underline">Conditions of Use</a>
            <a href="#" className="hover:underline">Privacy Notice</a>
            <a href="#" className="hover:underline">Help</a>
          </div>
          <p className="text-center text-xs text-gray-400">
            © 2025 MyPinkShop. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Login;
