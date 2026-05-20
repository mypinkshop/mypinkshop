import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    siteName: 'MyPinkShop',
    siteEmail: 'contact@mypinkshop.com',
    sitePhone: '+91 9876543210',
    siteAddress: 'Mumbai, India',
    commissionRate: 15,
    freeShippingThreshold: 999,
    codAvailable: true,
    codCharge: 0,
    razorpayKey: '',
    razorpaySecret: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('adminSettings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({ ...settings, [name]: type === 'checkbox' ? checked : value });
  };

  const saveSettings = () => {
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  const tabs = [
    { id: 'general', name: 'General', icon: '🏢' },
    { id: 'commission', name: 'Commission', icon: '💰' },
    { id: 'shipping', name: 'Shipping', icon: '🚚' },
    { id: 'payment', name: 'Payment', icon: '💳' },
    { id: 'email', name: 'Email', icon: '📧' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/dashboard')} className="text-gray-600 hover:text-gray-800">←</button>
          <h1 className="text-xl font-semibold text-gray-800">Settings</h1>
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
              <h2 className="text-lg font-semibold text-gray-800">General Settings</h2>
              <p className="text-sm text-gray-500">Basic store information and contact details</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label><input type="text" name="siteName" value={settings.siteName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label><input type="email" name="siteEmail" value={settings.siteEmail} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label><input type="tel" name="sitePhone" value={settings.sitePhone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label><input type="text" name="siteAddress" value={settings.siteAddress} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
              </div>
            </div>
          </div>
        )}

        {/* Commission Settings */}
        {activeTab === 'commission' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Commission Settings</h2>
              <p className="text-sm text-gray-500">Admin commission from vendor sales</p>
            </div>
            <div className="p-6 space-y-5">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label><input type="number" name="commissionRate" value={settings.commissionRate} onChange={handleChange} className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg" /><p className="text-xs text-gray-400 mt-1">Commission deducted from each vendor sale</p></div>
            </div>
          </div>
        )}

        {/* Shipping Settings */}
        {activeTab === 'shipping' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Shipping Settings</h2>
              <p className="text-sm text-gray-500">Configure shipping thresholds and charges</p>
            </div>
            <div className="p-6 space-y-5">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping Threshold (₹)</label><input type="number" name="freeShippingThreshold" value={settings.freeShippingThreshold} onChange={handleChange} className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg" /><p className="text-xs text-gray-400 mt-1">Orders above this amount get free shipping</p></div>
            </div>
          </div>
        )}

        {/* Payment Settings */}
        {activeTab === 'payment' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Payment Settings</h2>
              <p className="text-sm text-gray-500">Configure payment methods and gateways</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3"><input type="checkbox" name="codAvailable" checked={settings.codAvailable} onChange={handleChange} className="w-4 h-4 text-pink-600" /><label className="text-sm font-medium">Cash on Delivery Available</label></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">COD Additional Charges (₹)</label><input type="number" name="codCharge" value={settings.codCharge} onChange={handleChange} className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg" /></div>
              <div className="border-t pt-4"><h3 className="font-medium mb-3">Razorpay (Coming Soon)</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="text" placeholder="Razorpay Key ID" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" /><input type="text" placeholder="Razorpay Secret" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" /></div></div>
            </div>
          </div>
        )}

        {/* Email Settings */}
        {activeTab === 'email' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Email Settings</h2>
              <p className="text-sm text-gray-500">Configure SMTP for order emails</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">SMTP Host</label><input type="text" placeholder="smtp.gmail.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" /></div>
                <div><label className="block text-sm font-medium mb-1">SMTP Port</label><input type="text" placeholder="587" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" /></div>
                <div><label className="block text-sm font-medium mb-1">SMTP Username</label><input type="text" placeholder="your@email.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" /></div>
                <div><label className="block text-sm font-medium mb-1">SMTP Password</label><input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" /></div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button onClick={saveSettings} className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg font-medium transition">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
