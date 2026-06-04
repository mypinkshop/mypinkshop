import { useState, useEffect } from 'react';
import AdminSidebar from './components/AdminSidebar';

function AdminShipping() {
  const [shippingRules, setShippingRules] = useState({
    defaultDays: [3, 7], // min 3 days, max 7 days
    expressDays: [1, 3],
    freeShippingThreshold: 999,
    shippingCharges: 50,
    codCharges: 30,
    deliverablePincodes: [],
    blacklistedPincodes: [],
    cutOffTime: '16:00', // 4 PM
    sundayDelivery: false,
    warehouseAddress: {
      pincode: '110001',
      city: 'New Delhi',
      state: 'Delhi'
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  
  const API_URL = 'https://api.mypinkshop.com';
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    loadShippingSettings();
  }, []);

  const loadShippingSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/shipping-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setShippingRules(data.settings);
      }
    } catch (error) {
      console.error('Error loading shipping settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/shipping-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(shippingRules)
      });
      
      if (response.ok) {
        alert('✅ Shipping settings saved successfully!');
      }
    } catch (error) {
      alert('❌ Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const addPincode = () => {
    if (pincodeInput && pincodeInput.length === 6 && !shippingRules.deliverablePincodes.includes(pincodeInput)) {
      setShippingRules({
        ...shippingRules,
        deliverablePincodes: [...shippingRules.deliverablePincodes, pincodeInput]
      });
      setPincodeInput('');
    } else {
      alert('Please enter a valid 6-digit pincode');
    }
  };

  const removePincode = (pincode) => {
    setShippingRules({
      ...shippingRules,
      deliverablePincodes: shippingRules.deliverablePincodes.filter(p => p !== pincode)
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="md:ml-64 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🚚 Shipping Settings</h1>
            <p className="text-gray-500 text-sm">Manage delivery rules and shipping charges</p>
          </div>
          <button
            onClick={saveSettings}
            disabled={loading}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition"
          >
            {loading ? 'Saving...' : '💾 Save Settings'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Standard Shipping */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
            <h2 className="text-lg font-semibold mb-4">📦 Standard Shipping</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Timeline (Days)</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={shippingRules.defaultDays[0]}
                      onChange={(e) => setShippingRules({
                        ...shippingRules,
                        defaultDays: [parseInt(e.target.value), shippingRules.defaultDays[1]]
                      })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2"
                      placeholder="Min Days"
                    />
                    <p className="text-xs text-gray-400 mt-1">Minimum days</p>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={shippingRules.defaultDays[1]}
                      onChange={(e) => setShippingRules({
                        ...shippingRules,
                        defaultDays: [shippingRules.defaultDays[0], parseInt(e.target.value)]
                      })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2"
                      placeholder="Max Days"
                    />
                    <p className="text-xs text-gray-400 mt-1">Maximum days</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping Threshold (₹)</label>
                <input
                  type="number"
                  value={shippingRules.freeShippingThreshold}
                  onChange={(e) => setShippingRules({...shippingRules, freeShippingThreshold: parseInt(e.target.value)})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2"
                />
                <p className="text-xs text-gray-400 mt-1">Orders above this amount get free shipping</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Standard Shipping Charges (₹)</label>
                <input
                  type="number"
                  value={shippingRules.shippingCharges}
                  onChange={(e) => setShippingRules({...shippingRules, shippingCharges: parseInt(e.target.value)})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2"
                />
              </div>
            </div>
          </div>

          {/* Express Shipping */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
            <h2 className="text-lg font-semibold mb-4">⚡ Express Shipping</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Express Delivery Timeline (Days)</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={shippingRules.expressDays[0]}
                      onChange={(e) => setShippingRules({
                        ...shippingRules,
                        expressDays: [parseInt(e.target.value), shippingRules.expressDays[1]]
                      })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2"
                      placeholder="Min Days"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={shippingRules.expressDays[1]}
                      onChange={(e) => setShippingRules({
                        ...shippingRules,
                        expressDays: [shippingRules.expressDays[0], parseInt(e.target.value)]
                      })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2"
                      placeholder="Max Days"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Express Shipping Charges (₹)</label>
                <input
                  type="number"
                  value={shippingRules.expressCharges || 99}
                  onChange={(e) => setShippingRules({...shippingRules, expressCharges: parseInt(e.target.value)})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2"
                />
              </div>
            </div>
          </div>

          {/* Delivery Rules */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
            <h2 className="text-lg font-semibold mb-4">⏰ Delivery Rules</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Cut-off Time</label>
                <input
                  type="time"
                  value={shippingRules.cutOffTime}
                  onChange={(e) => setShippingRules({...shippingRules, cutOffTime: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2"
                />
                <p className="text-xs text-gray-400 mt-1">Orders after this time will be processed next day</p>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Sunday Delivery Available</label>
                <button
                  onClick={() => setShippingRules({...shippingRules, sundayDelivery: !shippingRules.sundayDelivery})}
                  className={`w-12 h-6 rounded-full transition ${shippingRules.sundayDelivery ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition ${shippingRules.sundayDelivery ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">COD Charges (₹)</label>
                <input
                  type="number"
                  value={shippingRules.codCharges}
                  onChange={(e) => setShippingRules({...shippingRules, codCharges: parseInt(e.target.value)})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2"
                />
              </div>
            </div>
          </div>

          {/* Serviceable Pincodes */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
            <h2 className="text-lg font-semibold mb-4">📍 Serviceable Pincodes</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter pincode"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength="6"
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2"
                />
                <button
                  onClick={addPincode}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  + Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {shippingRules.deliverablePincodes.map(pincode => (
                  <span key={pincode} className="bg-pink-50 text-pink-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {pincode}
                    <button onClick={() => removePincode(pincode)} className="text-pink-400 hover:text-pink-600">×</button>
                  </span>
                ))}
                {shippingRules.deliverablePincodes.length === 0 && (
                  <p className="text-gray-400 text-sm">No pincodes added. Add pincodes to enable delivery.</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Pincode</label>
                <input
                  type="text"
                  value={shippingRules.warehouseAddress.pincode}
                  onChange={(e) => setShippingRules({
                    ...shippingRules,
                    warehouseAddress: { ...shippingRules.warehouseAddress, pincode: e.target.value }
                  })}
                  maxLength="6"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminShipping;
