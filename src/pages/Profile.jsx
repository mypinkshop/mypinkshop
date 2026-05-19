import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Profile() {
  const [userName, setUserName] = useState('Loading...');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    console.log('Profile useEffect running');
    try {
      const stored = localStorage.getItem('user');
      console.log('Stored user:', stored);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserName(parsed.name || 'Guest');
        setUserEmail(parsed.email || '');
      } else {
        setUserName('Guest User');
        setUserEmail('guest@example.com');
      }
    } catch (err) {
      console.error('Error:', err);
      setUserName('Guest User');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <Link to="/">
            <h1 className="text-2xl font-bold text-pink-600">MyPinkShop</h1>
          </Link>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
          <div className="w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            {userName.charAt(0)}
          </div>
          <h1 className="text-2xl font-bold">Hello, {userName}!</h1>
          <p className="text-gray-500 mt-1">{userEmail}</p>
          <div className="mt-6 grid gap-3">
            <Link to="/my-orders" className="block p-3 bg-pink-50 rounded-lg hover:bg-pink-100">📦 Your Orders</Link>
            <Link to="/wishlist" className="block p-3 bg-pink-50 rounded-lg hover:bg-pink-100">🤍 Your Wishlist</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
