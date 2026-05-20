import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Mock notifications
  useEffect(() => {
    const mockNotifications = [
      { id: 1, title: 'New Vendor Registration', message: 'Sugar Cosmetics has requested to become a vendor', time: '5 minutes ago', type: 'vendor', read: false },
      { id: 2, title: 'Low Stock Alert', message: 'Glass Skin Serum stock is below 10 units', time: '1 hour ago', type: 'stock', read: false },
      { id: 3, title: 'New Order Received', message: 'Order #MPS-1005 has been placed', time: '3 hours ago', type: 'order', read: true },
      { id: 4, title: 'Product Approved', message: 'New product "Vitamin C Drops" has been added', time: '1 day ago', type: 'product', read: true },
    ];
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    setShowNotifications(false);
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'vendor': return '🏪';
      case 'stock': return '⚠️';
      case 'order': return '📦';
      case 'product': return '📝';
      default: return '🔔';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    navigate('/admin/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-80 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Notification Button - Working */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  <div className="flex gap-2">
                    <button onClick={markAllAsRead} className="text-xs text-pink-500 hover:text-pink-600 transition">
                      Mark all read
                    </button>
                    {notifications.length > 0 && (
                      <button onClick={clearNotifications} className="text-xs text-gray-500 hover:text-red-500 transition">
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-4xl mb-2">🔔</div>
                      <p className="text-gray-500 text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${!notification.read ? 'bg-pink-50' : ''}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-gray-800 text-sm">{notification.title}</p>
                              {!notification.read && <span className="w-2 h-2 bg-pink-500 rounded-full"></span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center">
                    <button className="text-xs text-pink-500 hover:text-pink-600">View all notifications</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">Super Admin</p>
              <p className="text-xs text-gray-500">admin@mypinkshop.com</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">SA</div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition" title="Logout">
              🚪
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
