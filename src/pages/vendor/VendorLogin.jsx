import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function VendorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = 'https://mypinkshop-dr93.vercel.app/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && (data.role === 'vendor' || data.role === 'admin')) {
        localStorage.setItem('vendorToken', data.token);
        localStorage.setItem('vendor', JSON.stringify(data));
        navigate('/vendor/dashboard');
      } else {
        setError('Vendor access only. Please register as a vendor first.');
      }
    } catch (err) {
      setError('Something went wrong');
    }
    setLoading(false);
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

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 text-sm font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
              placeholder="vendor@example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
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
