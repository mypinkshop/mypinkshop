import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Profile() {
  const [userName, setUserName] = useState('Guest');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserName(parsed.name || 'Guest');
      setUserEmail(parsed.email || '');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-block hover:opacity-80 transition">
            <h1 className="text-2xl font-bold text-pink-600">MyPinkShop</h1>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-8">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <span className="text-white text-3xl font-bold">{userName.charAt(0)}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Hello, {userName}!</h1>
            <p className="text-gray-500">{userEmail}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <button className="p-4 bg-pink-50 rounded-xl text-center hover:bg-pink-100 transition">
              <div className="text-2xl mb-2">📦</div>
              <p className="font-medium">Your Orders</p>
            </button>
            <button className="p-4 bg-pink-50 rounded-xl text-center hover:bg-pink-100 transition">
              <div className="text-2xl mb-2">📍</div>
              <p className="font-medium">Your Addresses</p>
            </button>
            <button className="p-4 bg-pink-50 rounded-xl text-center hover:bg-pink-100 transition">
              <div className="text-2xl mb-2">🔐</div>
              <p className="font-medium">Login & Security</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
