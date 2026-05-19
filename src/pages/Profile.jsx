import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Profile() {
  const [user, setUser] = useState({ name: '', email: '' });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser({ name: 'Guest User', email: 'guest@example.com' });
      }
    } catch (err) {
      console.log('Error loading user:', err);
      setUser({ name: 'Guest User', email: 'guest@example.com' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b py-4 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-block">
            <h1 className="text-2xl font-bold text-pink-600">MyPinkShop</h1>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <span className="text-white text-3xl font-bold">{user.name?.charAt(0) || 'U'}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Hello, {user.name || 'User'}!</h1>
            <p className="text-gray-500 mt-1">{user.email}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Link to="/my-orders" className="block p-4 bg-pink-50 rounded-xl text-center hover:bg-pink-100 transition">
              <div className="text-2xl mb-2">📦</div>
              <p className="font-medium text-gray-800">Your Orders</p>
            </Link>
            <Link to="/wishlist" className="block p-4 bg-pink-50 rounded-xl text-center hover:bg-pink-100 transition">
              <div className="text-2xl mb-2">🤍</div>
              <p className="font-medium text-gray-800">Your Wishlist</p>
            </Link>
            <button className="p-4 bg-pink-50 rounded-xl text-center hover:bg-pink-100 transition">
              <div className="text-2xl mb-2">📍</div>
              <p className="font-medium text-gray-800">Your Addresses</p>
            </button>
            <button className="p-4 bg-pink-50 rounded-xl text-center hover:bg-pink-100 transition">
              <div className="text-2xl mb-2">🔐</div>
              <p className="font-medium text-gray-800">Login & Security</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
