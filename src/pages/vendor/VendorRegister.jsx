import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function VendorRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    brandName: '',
    phone: '',
    gstNumber: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = 'https://mypinkshop-dr93.vercel.app/api';

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

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'vendor',
          brandName: formData.brandName,
          phone: formData.phone,
          gstNumber: formData.gstNumber,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Registration successful! Please wait for admin approval.');
        navigate('/vendor/login');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-pink-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg">
            🏪
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Become a Seller</h2>
          <p className="text-gray-500 mt-2">Join MyPinkShop marketplace</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">Brand Name</label>
              <input
                type="text"
                name="brandName"
                value={formData.brandName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">GST Number</label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">Business Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-pink-100 rounded-lg focus:outline-none focus:border-pink-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all mt-4"
          >
            {loading ? 'Registering...' : 'Register as Seller →'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6 text-sm">
          Already have a seller account?{' '}
          <Link to="/vendor/login" className="text-pink-500 hover:underline font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default VendorRegister;
