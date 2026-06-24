// AdminNotifications.jsx - Full page for notifications management

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedTab, setSelectedTab] = useState('sent'); // 'sent' | 'send'
  const [form, setForm] = useState({
    title: '',
    message: '',
    userType: 'all',
    userId: '',
    type: 'system'
  });

  const API_URL = 'https://api.mypinkshop.com/api';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchSentNotifications();
  }, []);

  const fetchSentNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/notifications/admin/sent`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setNotifications(data || []);
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      alert('Please fill title and message');
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_URL}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: form.title,
          message: form.message,
          userType: form.userType,
          userId: form.userId || null,
          type: form.type
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ Notification sent to ${data.count} users!`);
        setForm({ title: '', message: '', userType: 'all', userId: '', type: 'system' });
        fetchSentNotifications();
        setSelectedTab('sent');
      } else {
        alert('❌ Failed: ' + data.message);
      }
    } catch (error) {
      console.error('Send notification error:', error);
      alert('❌ Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const deleteNotification = async (id) => {
    if (!confirm('Delete this notification?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_URL}/api/notifications/admin/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/20">
      <AdminSidebar />
      
      <div className="lg:ml-64">
        <div className="bg-white/80 backdrop-blur-md border-b border-pink-100 px-6 py-5 sticky top-0 z-40 shadow-sm">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            🔔 Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">Send and manage push notifications</p>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-white/80 rounded-xl p-1 border border-pink-100">
            <button
              onClick={() => setSelectedTab('sent')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedTab === 'sent' 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-pink-50'
              }`}
            >
              📋 Sent ({notifications.length})
            </button>
            <button
              onClick={() => setSelectedTab('send')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedTab === 'send' 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-pink-50'
              }`}
            >
              ✉️ Send New
            </button>
          </div>

          {selectedTab === 'send' ? (
            // Send Notification Form
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Send Notification</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                    placeholder="Notification title..."
                    className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 bg-white shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notification Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value})}
                    className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 bg-white shadow-sm"
                  >
                    <option value="system">⚙️ System</option>
                    <option value="order">🛒 Order</option>
                    <option value="promo">🏷️ Promo</option>
                    <option value="offer">🎉 Offer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                  <select
                    value={form.userType}
                    onChange={(e) => setForm({...form, userType: e.target.value})}
                    className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 bg-white shadow-sm"
                  >
                    <option value="all">📢 All Users</option>
                    <option value="specific">👤 Specific User</option>
                  </select>
                </div>
                {form.userType === 'specific' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID *</label>
                    <input
                      type="text"
                      value={form.userId}
                      onChange={(e) => setForm({...form, userId: e.target.value})}
                      placeholder="Enter user ID..."
                      className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 bg-white shadow-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">Send to specific user only</p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({...form, message: e.target.value})}
                  placeholder="Write notification message..."
                  rows="4"
                  className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 bg-white shadow-sm resize-none"
                />
              </div>

              <button
                onClick={sendNotification}
                disabled={sending}
                className="mt-6 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? '⏳ Sending...' : '📤 Send Notification'}
              </button>
            </div>
          ) : (
            // Sent Notifications List
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Sent Notifications</h3>
                <button 
                  onClick={fetchSentNotifications}
                  className="text-pink-600 hover:text-pink-700 text-sm"
                >
                  🔄 Refresh
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📭</div>
                  <p className="text-gray-400">No notifications sent yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif._id} className="bg-white border border-pink-100 rounded-xl p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{notif.type === 'order' ? '🛒' : notif.type === 'promo' ? '🏷️' : notif.type === 'offer' ? '🎉' : '⚙️'}</span>
                            <h4 className="font-semibold text-gray-800">{notif.title}</h4>
                            <span className="text-xs text-gray-400 ml-2">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-full">
                              {notif.userType === 'all' ? '📢 All Users' : `👤 ${notif.userCount || 1} users`}
                            </span>
                            <span className="text-xs text-gray-400">
                              Sent by: {notif.sentBy?.name || 'Admin'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteNotification(notif._id)}
                          className="text-red-400 hover:text-red-600 transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminNotifications;
