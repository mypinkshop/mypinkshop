import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Demo admin credentials (hardcoded for now)
  const DEMO_ADMIN = {
    email: 'admin@mypinkshop.com',
    password: 'admin123',
    name: 'Super Admin',
    role: 'admin'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Demo login check
    if (email === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
      localStorage.setItem('adminToken', 'demo_admin_token_123');
      localStorage.setItem('admin', JSON.stringify(DEMO_ADMIN));
      navigate('/admin/dashboard');
    } else {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-pink-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg">
            👑
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Portal</h2>
          <p className="text-gray-500 mt-2">MyPinkShop Super Admin</p>
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
              placeholder="admin@mypinkshop.com"
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
            {loading ? 'Logging in...' : 'Admin Login →'}
          </button>
        </form>

        <div className="mt-6 p-3 bg-pink-50 rounded-lg">
          <p className="text-center text-xs text-gray-500">
            <strong>Demo Credentials:</strong><br />
            Email: admin@mypinkshop.com<br />
            Password: admin123
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
