import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorSettings() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('store');
  const [vendor, setVendor] = useState(null);
  const [storeSettings, setStoreSettings] = useState({
    storeName: '',
    storeEmail: '',
    storePhone: '',
    storeAddress: '',
    storeCity: '',
    storeState: '',
    storePincode: '',
    storeLogo: '',
  });
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    upiId: '',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    orderEmail: true,
    returnEmail: true,
    payoutEmail: true,
    lowStockAlert: true,
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendor');
    
    if (!token || !vendorData) {
      navigate('/vendor/login');
      return;
    }

    const vendorInfo = JSON.parse(vendorData);
    setVendor(vendorInfo);
    
    // Load saved settings from localStorage
    const savedStore = JSON.parse(localStorage.getItem('vendorStoreSettings') || '{}');
    const savedBank = JSON.parse(localStorage.getItem('vendorBankDetails') || '{}');
    const savedNotifications = JSON.parse(localStorage.getItem('vendorNotificationSettings') || '{}');
    
    setStoreSettings({
      storeName: savedStore.storeName || vendorInfo.brandName || '',
      storeEmail: savedStore.storeEmail || vendorInfo.email || '',
      storePhone: savedStore.storePhone || '',
      storeAddress: savedStore.storeAddress || '',
      storeCity: savedStore.storeCity || '',
      storeState: savedStore.storeState || '',
      storePincode: savedStore.storePincode || '',
      storeLogo: savedStore.storeLogo || '',
    });
    
    if (savedStore.storeLogo) {
      setLogoPreview(savedStore.storeLogo);
    }
    
    setBankDetails({
      accountHolderName: savedBank.accountHolderName || '',
      accountNumber: savedBank.accountNumber || '',
      ifscCode: savedBank.ifscCode || '',
      bankName: savedBank.bankName || '',
      upiId: savedBank.upiId || '',
    });
    
    setNotificationSettings({
      orderEmail: savedNotifications.orderEmail !== undefined ? savedNotifications.orderEmail : true,
      returnEmail: savedNotifications.returnEmail !== undefined ? savedNotifications.returnEmail : true,
      payoutEmail: savedNotifications.payoutEmail !== undefined ? savedNotifications.payoutEmail : true,
      lowStockAlert: savedNotifications.lowStockAlert !== undefined ? savedNotifications.lowStockAlert : true,
    });
    
    setLoading(false);
  }, [navigate]);

  const handleStoreChange = (e) => {
    setStoreSettings({ ...storeSettings, [e.target.name]: e.target.value });
  };

  const handleBankChange = (e) => {
    setBankDetails({ ...bankDetails, [e.target.name]: e.target.value });
  };

  const handleNotificationChange = (e) => {
    setNotificationSettings({ ...notificationSettings, [e.target.name]: e.target.checked });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        setLogoPreview(imageData);
        setStoreSettings({ ...storeSettings, storeLogo: imageData });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveStoreSettings = () => {
    localStorage.setItem('vendorStoreSettings', JSON.stringify(storeSettings));
    alert('Store settings saved successfully!');
  };

  const saveBankDetails = () => {
    if (bankDetails.accountNumber && bankDetails.ifscCode) {
      localStorage.setItem('vendorBankDetails', JSON.stringify(bankDetails));
      alert('Bank details saved successfully!');
    } else {
      alert('Please fill required bank details');
    }
  };

  const saveNotificationSettings = () => {
    localStorage.setItem('vendorNotificationSettings', JSON.stringify(notificationSettings));
    alert('Notification settings saved successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      <VendorSidebar activeTab="settings" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            <p className="text-gray-500 text-sm">Manage your store and account preferences</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200 mb-6">
            <button onClick={() => setActiveTab('store')} className={`px-5 py-2.5 text-sm font-medium transition ${activeTab === 'store' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Store Settings</button>
            <button onClick={() => setActiveTab('payment')} className={`px-5 py-2.5 text-sm font-medium transition ${activeTab === 'payment' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Payment & Bank</button>
            <button onClick={() => setActiveTab('notifications')} className={`px-5 py-2.5 text-sm font-medium transition ${activeTab === 'notifications' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Notifications</button>
          </div>

          {/* Store Settings Tab */}
          {activeTab === 'store' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">Store Information</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Store Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">🏪</span>
                    )}
                  </div>
                  <div>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logoUpload" />
                    <label htmlFor="logoUpload" className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-pink-700 transition">Upload Logo</label>
                    <p className="text-xs text-gray-400 mt-2">Recommended size: 200x200px</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label><input type="text" name="storeName" value={storeSettings.storeName} onChange={handleStoreChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Store Email</label><input type="email" name="storeEmail" value={storeSettings.storeEmail} onChange={handleStoreChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label><input type="tel" name="storePhone" value={storeSettings.storePhone} onChange={handleStoreChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label><input type="text" name="storeAddress" value={storeSettings.storeAddress} onChange={handleStoreChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input type="text" name="storeCity" value={storeSettings.storeCity} onChange={handleStoreChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><input type="text" name="storeState" value={storeSettings.storeState} onChange={handleStoreChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label><input type="text" name="storePincode" value={storeSettings.storePincode} onChange={handleStoreChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                </div>
                <button onClick={saveStoreSettings} className="bg-pink-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-pink-700 transition">Save Store Settings</button>
              </div>
            </div>
          )}

          {/* Payment & Bank Tab */}
          {activeTab === 'payment' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">Bank & Payment Details</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label><input type="text" name="accountHolderName" value={bankDetails.accountHolderName} onChange={handleBankChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label><input type="text" name="accountNumber" value={bankDetails.accountNumber} onChange={handleBankChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label><input type="text" name="ifscCode" value={bankDetails.ifscCode} onChange={handleBankChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label><input type="text" name="bankName" value={bankDetails.bankName} onChange={handleBankChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">UPI ID (Optional)</label><input type="text" name="upiId" value={bankDetails.upiId} onChange={handleBankChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="example@okhdfcbank" /></div>
                </div>
                <button onClick={saveBankDetails} className="bg-pink-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-pink-700 transition">Save Bank Details</button>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2"><p className="text-xs text-yellow-700">Your earnings will be transferred to this bank account. Please ensure details are correct.</p></div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">Notification Preferences</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100"><div><p className="font-medium">Order Confirmation</p><p className="text-sm text-gray-500">Receive email when a new order is placed</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" name="orderEmail" checked={notificationSettings.orderEmail} onChange={handleNotificationChange} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div></label></div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100"><div><p className="font-medium">Return Requests</p><p className="text-sm text-gray-500">Get notified when a customer requests a return</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" name="returnEmail" checked={notificationSettings.returnEmail} onChange={handleNotificationChange} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div></label></div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100"><div><p className="font-medium">Payout Alerts</p><p className="text-sm text-gray-500">Receive notification when payout is processed</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" name="payoutEmail" checked={notificationSettings.payoutEmail} onChange={handleNotificationChange} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div></label></div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100"><div><p className="font-medium">Low Stock Alert</p><p className="text-sm text-gray-500">Get notified when product stock is running low</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" name="lowStockAlert" checked={notificationSettings.lowStockAlert} onChange={handleNotificationChange} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div></label></div>
                <button onClick={saveNotificationSettings} className="bg-pink-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-pink-700 transition mt-2">Save Notification Settings</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default VendorSettings;
