import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function AdminSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // General
    siteName: 'MyPinkShop',
    siteEmail: 'contact@mypinkshop.com',
    sitePhone: '+91 9876543210',
    siteAddress: 'Mumbai, India',
    
    // SEO
    metaTitle: 'MyPinkShop - Shop for Girlies ✨',
    metaDescription: 'Discover the latest in beauty, fashion, and accessories at MyPinkShop. Shop now for the best prices!',
    metaKeywords: 'beauty, fashion, skincare, makeup, accessories, online shopping',
    
    // Social Media
    instagram: 'https://instagram.com/mypinkshop',
    facebook: 'https://facebook.com/mypinkshop',
    youtube: '',
    pinterest: '',
    twitter: '',
    
    // Commission
    commissionRate: 15,
    
    // Shipping
    freeShippingThreshold: 999,
    defaultShippingCharge: 49,
    expressShippingCharge: 99,
    
    // Payment
    codAvailable: true,
    codCharge: 0,
    razorpayKey: '',
    razorpaySecret: '',
    razorpayEnabled: false,
    
    // Email
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    senderEmail: '',
    senderName: '',
    
    // Legal
    termsContent: '',
    privacyContent: '',
    returnPolicyContent: '',
    
    // Analytics
    googleAnalyticsId: '',
    facebookPixelId: '',
    
    // Currency
    currencySymbol: '₹',
    currencyCode: 'INR',
    decimalPlaces: 2,
    
    // Theme
    primaryColor: '#ec4899',
    secondaryColor: '#f43f5e',
    logo: '',
    favicon: '',
  });

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadSettings(token);
  }, [navigate]);

  // ✅ Load settings from backend
  const loadSettings = async (token) => {
    try {
      setLoading(true);
      
      // Try to load from API first
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem('adminSettings');
        if (saved) {
          setSettings(JSON.parse(saved));
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      const saved = localStorage.getItem('adminSettings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save settings to backend
  const saveSettings = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      toast.error('Session expired. Please login again.');
      navigate('/admin/login');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          toast.success('✅ Settings saved successfully!');
          localStorage.setItem('adminSettings', JSON.stringify(settings));
        } else {
          toast.error(data.message || 'Failed to save settings');
        }
      } else {
        // Fallback to localStorage
        localStorage.setItem('adminSettings', JSON.stringify(settings));
        toast.success('✅ Settings saved locally!');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      toast.success('✅ Settings saved locally!');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({ ...settings, [name]: type === 'checkbox' ? checked : value });
  };

  const tabs = [
    { id: 'general', name: 'General', icon: '🏢' },
    { id: 'seo', name: 'SEO', icon: '🔍' },
    { id: 'social', name: 'Social Media', icon: '📱' },
    { id: 'commission', name: 'Commission', icon: '💰' },
    { id: 'shipping', name: 'Shipping', icon: '🚚' },
    { id: 'payment', name: 'Payment', icon: '💳' },
    { id: 'email', name: 'Email', icon: '📧' },
    { id: 'legal', name: 'Legal Pages', icon: '📜' },
    { id: 'analytics', name: 'Analytics', icon: '📊' },
    { id: 'theme', name: 'Theme', icon: '🎨' },
  ];

  // ✅ Loading Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/dashboard')} className="text-gray-600 hover:text-gray-800 transition">
            ←
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">⚙️ Settings</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage store configuration and preferences</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg font-medium transition ${
                activeTab === tab.id
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">🏢 General Settings</h2>
              <p className="text-sm text-gray-500">Basic store information and contact details</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Name *</label>
                  <input 
                    type="text" 
                    name="siteName" 
                    value={settings.siteName} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                  <input 
                    type="email" 
                    name="siteEmail" 
                    value={settings.siteEmail} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    name="sitePhone" 
                    value={settings.sitePhone} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
                  <input 
                    type="text" 
                    name="siteAddress" 
                    value={settings.siteAddress} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEO Settings */}
        {activeTab === 'seo' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">🔍 SEO Settings</h2>
              <p className="text-sm text-gray-500">Meta tags for better search engine ranking</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                <input 
                  type="text" 
                  name="metaTitle" 
                  value={settings.metaTitle} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                  placeholder="MyPinkShop - Shop for Girlies ✨"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: 50-60 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea 
                  name="metaDescription" 
                  value={settings.metaDescription} 
                  onChange={handleChange} 
                  rows="3" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                  placeholder="Discover the latest in beauty, fashion, and accessories..."
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: 150-160 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                <input 
                  type="text" 
                  name="metaKeywords" 
                  value={settings.metaKeywords} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                  placeholder="beauty, fashion, skincare, makeup..."
                />
                <p className="text-xs text-gray-400 mt-1">Comma separated keywords</p>
              </div>
            </div>
          </div>
        )}

        {/* Social Media Settings */}
        {activeTab === 'social' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">📱 Social Media Links</h2>
              <p className="text-sm text-gray-500">Connect your store with social platforms</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <span className="text-2xl">📸</span> Instagram
                  </label>
                  <input 
                    type="url" 
                    name="instagram" 
                    value={settings.instagram} 
                    onChange={handleChange} 
                    placeholder="https://instagram.com/mypinkshop" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <span className="text-2xl">👍</span> Facebook
                  </label>
                  <input 
                    type="url" 
                    name="facebook" 
                    value={settings.facebook} 
                    onChange={handleChange} 
                    placeholder="https://facebook.com/mypinkshop" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <span className="text-2xl">📺</span> YouTube
                  </label>
                  <input 
                    type="url" 
                    name="youtube" 
                    value={settings.youtube} 
                    onChange={handleChange} 
                    placeholder="https://youtube.com/@mypinkshop" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <span className="text-2xl">📌</span> Pinterest
                  </label>
                  <input 
                    type="url" 
                    name="pinterest" 
                    value={settings.pinterest} 
                    onChange={handleChange} 
                    placeholder="https://pinterest.com/mypinkshop" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commission Settings */}
        {activeTab === 'commission' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">💰 Commission Settings</h2>
              <p className="text-sm text-gray-500">Admin commission from vendor sales</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                <input 
                  type="number" 
                  name="commissionRate" 
                  value={settings.commissionRate} 
                  onChange={handleChange} 
                  className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                />
                <p className="text-xs text-gray-400 mt-1">Commission deducted from each vendor sale</p>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Settings */}
        {activeTab === 'shipping' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">🚚 Shipping Settings</h2>
              <p className="text-sm text-gray-500">Configure shipping thresholds and charges</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping Threshold (₹)</label>
                  <input 
                    type="number" 
                    name="freeShippingThreshold" 
                    value={settings.freeShippingThreshold} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                  />
                  <p className="text-xs text-gray-400 mt-1">Orders above this get free shipping</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Standard Shipping (₹)</label>
                  <input 
                    type="number" 
                    name="defaultShippingCharge" 
                    value={settings.defaultShippingCharge} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Express Shipping (₹)</label>
                  <input 
                    type="number" 
                    name="expressShippingCharge" 
                    value={settings.expressShippingCharge} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Settings */}
        {activeTab === 'payment' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">💳 Payment Settings</h2>
              <p className="text-sm text-gray-500">Configure payment methods and gateways</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  name="codAvailable" 
                  checked={settings.codAvailable} 
                  onChange={handleChange} 
                  className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500" 
                />
                <label className="text-sm font-medium text-gray-700">Cash on Delivery Available</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">COD Additional Charges (₹)</label>
                <input 
                  type="number" 
                  name="codCharge" 
                  value={settings.codCharge} 
                  onChange={handleChange} 
                  className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                />
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    name="razorpayEnabled" 
                    checked={settings.razorpayEnabled} 
                    onChange={handleChange} 
                    className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500" 
                  />
                  <label className="text-sm font-medium text-gray-700">Enable Razorpay</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Key ID</label>
                    <input 
                      type="text" 
                      name="razorpayKey" 
                      value={settings.razorpayKey} 
                      onChange={handleChange} 
                      placeholder="rzp_live_xxxxxxxxxx" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Secret</label>
                    <input 
                      type="password" 
                      name="razorpaySecret" 
                      value={settings.razorpaySecret} 
                      onChange={handleChange} 
                      placeholder="••••••••" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Settings */}
        {activeTab === 'email' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">📧 Email Settings</h2>
              <p className="text-sm text-gray-500">Configure SMTP for order emails</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                  <input 
                    type="text" 
                    name="smtpHost" 
                    value={settings.smtpHost} 
                    onChange={handleChange} 
                    placeholder="smtp.gmail.com" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                  <input 
                    type="text" 
                    name="smtpPort" 
                    value={settings.smtpPort} 
                    onChange={handleChange} 
                    placeholder="587" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender Email</label>
                  <input 
                    type="email" 
                    name="senderEmail" 
                    value={settings.senderEmail} 
                    onChange={handleChange} 
                    placeholder="noreply@mypinkshop.com" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
                  <input 
                    type="text" 
                    name="senderName" 
                    value={settings.senderName} 
                    onChange={handleChange} 
                    placeholder="MyPinkShop" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
                  <input 
                    type="text" 
                    name="smtpUser" 
                    value={settings.smtpUser} 
                    onChange={handleChange} 
                    placeholder="your@email.com" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                  <input 
                    type="password" 
                    name="smtpPass" 
                    value={settings.smtpPass} 
                    onChange={handleChange} 
                    placeholder="••••••••" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legal Pages */}
        {activeTab === 'legal' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">📜 Legal Pages</h2>
              <p className="text-sm text-gray-500">Manage terms, privacy, and return policy</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms of Service</label>
                <textarea 
                  name="termsContent" 
                  value={settings.termsContent} 
                  onChange={handleChange} 
                  rows="4" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                  placeholder="Terms of service content..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Privacy Policy</label>
                <textarea 
                  name="privacyContent" 
                  value={settings.privacyContent} 
                  onChange={handleChange} 
                  rows="4" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                  placeholder="Privacy policy content..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Policy</label>
                <textarea 
                  name="returnPolicyContent" 
                  value={settings.returnPolicyContent} 
                  onChange={handleChange} 
                  rows="4" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                  placeholder="Return policy content..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Analytics Settings */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">📊 Analytics & Tracking</h2>
              <p className="text-sm text-gray-500">Google Analytics and Facebook Pixel integration</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
                <input 
                  type="text" 
                  name="googleAnalyticsId" 
                  value={settings.googleAnalyticsId} 
                  onChange={handleChange} 
                  placeholder="G-XXXXXXXXXX" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Pixel ID</label>
                <input 
                  type="text" 
                  name="facebookPixelId" 
                  value={settings.facebookPixelId} 
                  onChange={handleChange} 
                  placeholder="123456789012345" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                />
              </div>
            </div>
          </div>
        )}

        {/* Theme Settings */}
        {activeTab === 'theme' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">🎨 Theme Customization</h2>
              <p className="text-sm text-gray-500">Customize your store appearance</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <div className="flex gap-3">
                    <input 
                      type="color" 
                      name="primaryColor" 
                      value={settings.primaryColor} 
                      onChange={handleChange} 
                      className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer" 
                    />
                    <input 
                      type="text" 
                      name="primaryColor" 
                      value={settings.primaryColor} 
                      onChange={handleChange} 
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                  <div className="flex gap-3">
                    <input 
                      type="color" 
                      name="secondaryColor" 
                      value={settings.secondaryColor} 
                      onChange={handleChange} 
                      className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer" 
                    />
                    <input 
                      type="text" 
                      name="secondaryColor" 
                      value={settings.secondaryColor} 
                      onChange={handleChange} 
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                    />
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                    <input 
                      type="text" 
                      name="currencySymbol" 
                      value={settings.currencySymbol} 
                      onChange={handleChange} 
                      className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency Code</label>
                    <input 
                      type="text" 
                      name="currencyCode" 
                      value={settings.currencyCode} 
                      onChange={handleChange} 
                      className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={() => loadSettings(localStorage.getItem('adminToken'))} 
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            🔄 Reset
          </button>
          <button 
            onClick={saveSettings} 
            disabled={saving}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
          >
            {saving ? '⏳ Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
