import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Avatar({ user, onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Get initials from name
  const getInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return '👤';
  };

  // ✅ Get avatar color based on name
  const getAvatarColor = (name) => {
    if (!name) return 'from-pink-500 to-rose-500';
    const colors = [
      'from-pink-500 to-rose-500',
      'from-purple-500 to-pink-500',
      'from-blue-500 to-indigo-500',
      'from-green-500 to-teal-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-purple-500',
      'from-teal-500 to-emerald-500',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  // ✅ FIX: sessionStorage se image lo (aur user object se bhi)
  const getProfileImage = () => {
    // Pehle user object se check karo
    if (user?.profileImage) {
      return user.profileImage;
    }
    // Phir sessionStorage se check karo
    const storedImage = sessionStorage.getItem('user_profile_image');
    if (storedImage && storedImage !== 'undefined' && storedImage !== 'null') {
      return storedImage;
    }
    // Phir localStorage se check karo (backward compatibility)
    const oldImage = localStorage.getItem('profileImage');
    if (oldImage && oldImage !== 'undefined' && oldImage !== 'null') {
      return oldImage;
    }
    return null;
  };

  const profileImage = getProfileImage();

  // ✅ Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ If no user, show login icon
  if (!user) {
    return (
      <Link to="/login" className="p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a7 7 0 11-14 0 7 7 0 0114 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </Link>
    );
  }

  const menuItems = [
    { label: 'Your Profile', icon: '👤', path: '/profile' },
    { label: 'Your Orders', icon: '📦', path: '/my-orders' },
    { label: 'Your Wishlist', icon: '🤍', path: '/wishlist' },
    { label: 'Your Addresses', icon: '📍', path: '/profile?tab=addresses' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 text-gray-600 hover:text-pink-500 transition focus:outline-none group"
        aria-label="User menu"
      >
        {profileImage && !imageError ? (
          <img
            src={profileImage}
            alt={user?.name || 'Profile'}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-pink-200 group-hover:border-pink-400 transition"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r ${getAvatarColor(user?.name)} flex items-center justify-center text-white text-sm font-bold border-2 border-pink-200 group-hover:border-pink-400 transition`}>
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
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden animate-fadeIn">
            {/* User Info */}
            <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-pink-50 to-rose-50">
              <p className="font-medium text-gray-800 truncate">{user?.name || 'Guest'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
            </div>
            
            {/* Menu Items */}
            <div className="py-1">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition"
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onLogout?.();
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition w-full"
              >
                <span className="text-base">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Avatar;
