import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = 'https://mypinkshop-backend.vercel.app/api';

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

      if (res.ok && data.role === 'admin') {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('admin', JSON.stringify(data));
        navigate('/admin/dashboard');
      } else {
        setError('Admin access only. Invalid credentials.');
      }
    } catch (err) {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Admin Portal</h2>
          <p className="text-gray-500 mt-2">MyPinkShop Super Admin</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-500 text-white py-2 rounded-lg font-semibold hover:bg-pink-600 transition"
          >
            {loading ? 'Logging in...' : 'Admin Login →'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6 text-xs">
          ⚡ Super Admin Access Only
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;
