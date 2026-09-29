import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function AdminSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Keys jo backend settings table me hain (shipping + payment)
  const [settings, setSettings] = useState({
    // Shipping / Payment (BACKEND — settings table)
    freeShippingThreshold: 499,
    shippingCharge: 49,
    expressShippingCharge: 99,
    taxPercent: 5,
    codCharge: 0,
    codAvailable: true,
    minOrderValue: 0,

    // General (LOCAL only)
    siteName: 'MyPinkShop',
    siteEmail: 'contact@mypinkshop.com',
    sitePhone: '+91 9876543210',
    siteAddress: 'Mumbai, India',

    // SEO (LOCAL)
    metaTitle: 'MyPinkShop - Shop for Girlies ✨',
    metaDescription: 'Discover the latest in beauty, fashion, and accessories at MyPinkShop.',
    metaKeywords: 'beauty, fashion, skincare, makeup, accessories',

    // Social (LOCAL)
    instagram: 'https://instagram.com/mypinkshop',
    facebook: 'https://facebook.com/mypinkshop',
    youtube: '',
    pinterest: '',
    twitter: '',

    // Commission (LOCAL)
    commissionRate: 15,

    // Payment (LOCAL extras)
    razorpayKey: '',
    razorpaySecret: '',
    razorpayEnabled: false,

    // Email (LOCAL)
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    senderEmail: '',
    senderName: '',

    // Legal (LOCAL)
    termsContent: '',
    privacyContent: '',
    returnPolicyContent: '',

    // Analytics (LOCAL)
    googleAnalyticsId: '',
    facebookPixelId: '',

    // Currency (LOCAL)
    currencySymbol: '₹',
    currencyCode: 'INR',
    decimalPlaces: 2,

    // Theme (LOCAL)
    primaryColor: '#ec4899',
    secondaryColor: '#f43f5e',
    logo: '',
    favicon: '',
  });

  // ✅ FIX 1: Vite env variable
  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadSettings(token);
  }, [navigate]);

  // ✅ FIX 2: Response shape — backend {success, data}
  const loadSettings = async (token) => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/settings/admin`, {
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
        const json = await res.json();
        // Backend returns: { success: true, data: { free_shipping_threshold, ... } }
        const raw = json.data || json;

        // Merge backend values (snake_case) into state (camelCase)
        setSettings(prev => ({
          ...prev,
          freeShippingThreshold: Number(raw.free_shipping_threshold ?? prev.freeShippingThreshold),
          shippingCharge:        Number(raw.shipping_charge ?? prev.shippingCharge),
          expressShippingCharge: Number(raw.express_shipping_charge ?? prev.expressShippingCharge),
          taxPercent:            Number(raw.tax_percent ?? prev.taxPercent),
          codCharge:             Number(raw.cod_charge ?? prev.codCharge),
          codAvailable:          raw.cod_available === true || raw.cod_available === 'true' || raw.cod_available === '1',
          minOrderValue:         Number(raw.min_order_value ?? prev.minOrderValue),

          // Local-only fields fallback
          ...(JSON.parse(localStorage.getItem('adminSettingsLocal') || '{}')),
        }));
      } else {
        const saved = localStorage.getItem('adminSettingsLocal');
        if (saved) setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      const saved = localStorage.getItem('adminSettingsLocal');
      if (saved) setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX 3: Sirf backend-supported keys bhejo
  const saveSettings = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      toast.error('Session expired. Please login again.');
      navigate('/admin/login');
      return;
    }

    setSaving(true);

    try {
      // ✅ Only send keys backend understands
      const payload = {
        freeShippingThreshold: Number(settings.freeShippingThreshold) || 0,
        shippingCharge:        Number(settings.shippingCharge) || 0,
        expressShippingCharge: Number(settings.expressShippingCharge) || 0,
        taxPercent:            Number(settings.taxPercent) || 0,
        codCharge:             Number(settings.codCharge) || 0,
        codAvailable:          !!settings.codAvailable,
        minOrderValue:         Number(settings.minOrderValue) || 0,
      };

      const res = await fetch(`${API_URL}/api/settings/admin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          toast.success('✅ Settings saved successfully!');

          // Save local-only fields separately
          const localOnly = {
            siteName: settings.siteName,
            siteEmail: settings.siteEmail,
            sitePhone: settings.sitePhone,
            siteAddress: settings.siteAddress,
            metaTitle: settings.metaTitle,
            metaDescription: settings.metaDescription,
            metaKeywords: settings.metaKeywords,
            instagram: settings.instagram,
            facebook: settings.facebook,
            youtube: settings.youtube,
            pinterest: settings.pinterest,
            twitter: settings.twitter,
            commissionRate: settings.commissionRate,
            razorpayKey: settings.razorpayKey,
            razorpaySecret: settings.razorpaySecret,
            razorpayEnabled: settings.razorpayEnabled,
            smtpHost: settings.smtpHost,
            smtpPort: settings.smtpPort,
            smtpUser: settings.smtpUser,
            smtpPass: settings.smtpPass,
            senderEmail: settings.senderEmail,
            senderName: settings.senderName,
            termsContent: settings.termsContent,
            privacyContent: settings.privacyContent,
            returnPolicyContent: settings.returnPolicyContent,
            googleAnalyticsId: settings.googleAnalyticsId,
            facebookPixelId: settings.facebookPixelId,
            currencySymbol: settings.currencySymbol,
            currencyCode: settings.currencyCode,
            decimalPlaces: settings.decimalPlaces,
            primaryColor: settings.primaryColor,
            secondaryColor: settings.secondaryColor,
            logo: settings.logo,
            favicon: settings.favicon,
          };
          localStorage.setItem('adminSettingsLocal', JSON.stringify(localOnly));
        } else {
          toast.error(json.error || json.message || 'Failed to save settings');
        }
      } else {
        toast.error('Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Network error');
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
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/dashboard')} className="text-gray-600 hover:text-gray-800 transition">←</button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">⚙️ Settings</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage store configuration and preferences</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg font-medium transition ${
                activeTab === tab.id ? 'bg-pink-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* ================= GENERAL ================= */}
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
                  <input type="text" name="siteName" value={settings.siteName} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                  <input type="email" name="siteEmail" value={settings.siteEmail} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" name="sitePhone" value={settings.sitePhone} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
                  <input type="text" name="siteAddress" value={settings.siteAddress} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SEO ================= */}
        {activeTab === 'seo' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">🔍 SEO Settings</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                <input type="text" name="metaTitle" value={settings.metaTitle} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea name="metaDescription" value={settings.metaDescription} onChange={handleChange} rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                <input type="text" name="metaKeywords" value={settings.metaKeywords} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>
        )}

        {/* ================= SOCIAL ================= */}
        {activeTab === 'social' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">📱 Social Media Links</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { name: 'instagram', label: '📸 Instagram' },
                  { name: 'facebook', label: '👍 Facebook' },
                  { name: 'youtube', label: '📺 YouTube' },
                  { name: 'pinterest', label: '📌 Pinterest' },
                ].map(s => (
                  <div key={s.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{s.label}</label>
                    <input type="url" name={s.name} value={settings[s.name]} onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= COMMISSION ================= */}
        {activeTab === 'commission' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">💰 Commission Settings</h2>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
              <input type="number" name="commissionRate" value={settings.commissionRate} onChange={handleChange}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        )}

        {/* ================= SHIPPING (BACKEND) ================= */}
        {activeTab === 'shipping' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">🚚 Shipping Settings</h2>
              <p className="text-sm text-gray-500">Ye values orders me real-time use hoti hain</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping Threshold (₹)</label>
                  <input type="number" name="freeShippingThreshold" value={settings.freeShippingThreshold}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
                  <p className="text-xs text-gray-400 mt-1">Orders above this get free shipping</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Standard Shipping (₹)</label>
                  <input type="number" name="shippingCharge" value={settings.shippingCharge}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Express Shipping (₹)</label>
                  <input type="number" name="expressShippingCharge" value={settings.expressShippingCharge}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax / GST (%)</label>
                  <input type="number" name="taxPercent" value={settings.taxPercent}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
                  <p className="text-xs text-gray-400 mt-1">Order subtotal pe lagega</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PAYMENT (BACKEND) ================= */}
        {activeTab === 'payment' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">💳 Payment Settings</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <input type="checkbox" name="codAvailable" checked={settings.codAvailable}
                  onChange={handleChange}
                  className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500" />
                <label className="text-sm font-medium text-gray-700">Cash on Delivery Available</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">COD Additional Charges (₹)</label>
                <input type="number" name="codCharge" value={settings.codCharge}
                  onChange={handleChange}
                  className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Value (₹)</label>
                <input type="number" name="minOrderValue" value={settings.minOrderValue}
                  onChange={handleChange}
                  className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg" />
                <p className="text-xs text-gray-400 mt-1">0 = no minimum</p>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" name="razorpayEnabled" checked={settings.razorpayEnabled}
                    onChange={handleChange}
                    className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500" />
                  <label className="text-sm font-medium text-gray-700">Enable Razorpay (coming soon)</label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= EMAIL ================= */}
        {activeTab === 'email' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">📧 Email Settings</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'smtpHost', label: 'SMTP Host', type: 'text' },
                  { name: 'smtpPort', label: 'SMTP Port', type: 'text' },
                  { name: 'senderEmail', label: 'Sender Email', type: 'email' },
                  { name: 'senderName', label: 'Sender Name', type: 'text' },
                  { name: 'smtpUser', label: 'SMTP Username', type: 'text' },
                  { name: 'smtpPass', label: 'SMTP Password', type: 'password' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    <input type={f.type} name={f.name} value={settings[f.name]} onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= LEGAL ================= */}
        {activeTab === 'legal' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">📜 Legal Pages</h2>
            </div>
            <div className="p-6 space-y-5">
              {[
                { name: 'termsContent', label: 'Terms of Service' },
                { name: 'privacyContent', label: 'Privacy Policy' },
                { name: 'returnPolicyContent', label: 'Return Policy' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <textarea name={f.name} value={settings[f.name]} onChange={handleChange} rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= ANALYTICS ================= */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">📊 Analytics</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
                <input type="text" name="googleAnalyticsId" value={settings.googleAnalyticsId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Pixel ID</label>
                <input type="text" name="facebookPixelId" value={settings.facebookPixelId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>
        )}

        {/* ================= THEME ================= */}
        {activeTab === 'theme' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">🎨 Theme</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { name: 'primaryColor', label: 'Primary Color' },
                  { name: 'secondaryColor', label: 'Secondary Color' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    <div className="flex gap-3">
                      <input type="color" name={f.name} value={settings[f.name]}
                        onChange={handleChange}
                        className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer" />
                      <input type="text" name={f.name} value={settings[f.name]}
                        onChange={handleChange}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                  <input type="text" name="currencySymbol" value={settings.currencySymbol}
                    onChange={handleChange}
                    className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency Code</label>
                  <input type="text" name="currencyCode" value={settings.currencyCode}
                    onChange={handleChange}
                    className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save */}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => loadSettings(localStorage.getItem('adminToken'))}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
            🔄 Reset
          </button>
          <button onClick={saveSettings} disabled={saving}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50">
            {saving ? '⏳ Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
