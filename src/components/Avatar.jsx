import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Avatar({ user, onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const getInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getProfileImage = () => {
    const storedImage = localStorage.getItem('profileImage');
    if (storedImage) {
      return storedImage;
    }
    return null;
  };

  const profileImage = getProfileImage();

  const menuItems = [
    { label: 'Your Profile', icon: '👤', path: '/profile' },
    { label: 'Your Orders', icon: '📦', path: '/my-orders' },
    { label: 'Your Wishlist', icon: '🤍', path: '/wishlist' },
    { label: 'Your Addresses', icon: '📍', path: '/profile?tab=addresses' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 text-gray-600 hover:text-pink-500 transition focus:outline-none"
      >
        {profileImage ? (
          <img
            src={profileImage}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover border-2 border-pink-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white text-sm font-bold">
            {getInitial()}
          </div>
        )}
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <p className="font-medium text-gray-800">{user?.name || 'Guest'}</p>
              <p className="text-xs text-gray-500">{user?.email || ''}</p>
            </div>
            <div className="py-1">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              <hr className="my-1" />
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onLogout();
                }}
                className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition w-full"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Avatar;
