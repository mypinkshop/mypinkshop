import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorShipping() {
  const [loading, setLoading] = useState(true);
  const [shippingZones, setShippingZones] = useState([]);
  const [defaultShipping, setDefaultShipping] = useState({
    standardRate: 49,
    expressRate: 99,
    freeShippingThreshold: 999,
    processingTime: '1-2 days',
  });
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [zoneForm, setZoneForm] = useState({
    zone: '',
    cities: '',
    rate: '',
    days: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendor');
    
    if (!token || !vendorData) {
      navigate('/vendor/login');
      return;
    }

    const savedZones = JSON.parse(localStorage.getItem('vendorShippingZones') || '[]');
    if (savedZones.length === 0) {
      const defaultZones = [
        { id: 1, zone: 'Local (Metro Cities)', cities: 'Mumbai, Delhi, Bangalore, Chennai, Kolkata', rate: 49, days: '2-3 days' },
        { id: 2, zone: 'Zone A (Tier 2 Cities)', cities: 'Jaipur, Lucknow, Nagpur, Indore, Bhopal', rate: 79, days: '3-5 days' },
        { id: 3, zone: 'Zone B (Rest of India)', cities: 'All other cities and towns', rate: 99, days: '5-7 days' },
      ];
      setShippingZones(defaultZones);
      localStorage.setItem('vendorShippingZones', JSON.stringify(defaultZones));
    } else {
      setShippingZones(savedZones);
    }

    const savedSettings = JSON.parse(localStorage.getItem('vendorShippingSettings') || '{}');
    setDefaultShipping({
      standardRate: savedSettings.standardRate || 49,
      expressRate: savedSettings.expressRate || 99,
      freeShippingThreshold: savedSettings.freeShippingThreshold || 999,
      processingTime: savedSettings.processingTime || '1-2 days',
    });
    
    setLoading(false);
  }, [navigate]);

  const saveShippingSettings = () => {
    localStorage.setItem('vendorShippingSettings', JSON.stringify(defaultShipping));
    alert('Shipping settings saved successfully!');
  };

  const addZone = () => {
    if (!zoneForm.zone || !zoneForm.rate) {
      alert('Please fill zone name and rate');
      return;
    }
    const newZone = {
      id: Date.now(),
      zone: zoneForm.zone,
      cities: zoneForm.cities || '',
      rate: zoneForm.rate,
      days: zoneForm.days || '3-5 days',
    };
    const updatedZones = [...shippingZones, newZone];
    setShippingZones(updatedZones);
    localStorage.setItem('vendorShippingZones', JSON.stringify(updatedZones));
    setShowZoneModal(false);
    setZoneForm({ zone: '', cities: '', rate: '', days: '' });
    alert('Shipping zone added successfully!');
  };

  const editZone = () => {
    if (!zoneForm.zone || !zoneForm.rate) {
      alert('Please fill zone name and rate');
      return;
    }
    const updatedZones = shippingZones.map(z => 
      z.id === editingZone.id ? { ...z, zone: zoneForm.zone, cities: zoneForm.cities || '', rate: zoneForm.rate, days: zoneForm.days || '3-5 days' } : z
    );
    setShippingZones(updatedZones);
    localStorage.setItem('vendorShippingZones', JSON.stringify(updatedZones));
    setShowZoneModal(false);
    setEditingZone(null);
    setZoneForm({ zone: '', cities: '', rate: '', days: '' });
    alert('Shipping zone updated successfully!');
  };

  const deleteZone = (id) => {
    if (window.confirm('Delete this shipping zone?')) {
      const updatedZones = shippingZones.filter(z => z.id !== id);
      setShippingZones(updatedZones);
      localStorage.setItem('vendorShippingZones', JSON.stringify(updatedZones));
      alert('Shipping zone deleted');
    }
  };

  const handleSettingChange = (e) => {
    setDefaultShipping({ ...defaultShipping, [e.target.name]: e.target.value });
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
      <VendorSidebar activeTab="shipping" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Shipping Settings</h1>
            <p className="text-gray-500 text-sm">Configure your shipping zones and rates</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Default Shipping Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">Default Shipping Settings</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Standard Delivery Rate (₹)</label>
                    <input type="number" name="standardRate" value={defaultShipping.standardRate} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Express Delivery Rate (₹)</label>
                    <input type="number" name="expressRate" value={defaultShipping.expressRate} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping Threshold (₹)</label>
                    <input type="number" name="freeShippingThreshold" value={defaultShipping.freeShippingThreshold} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Processing Time</label>
                    <select name="processingTime" value={defaultShipping.processingTime} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="1-2 days">1-2 days</option>
                      <option value="2-3 days">2-3 days</option>
                      <option value="3-5 days">3-5 days</option>
                    </select>
                  </div>
                </div>
                <button onClick={saveShippingSettings} className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-700 transition">
                  Save Settings
                </button>
              </div>
            </div>

            {/* Shipping Zones */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-semibold text-gray-800">Shipping Zones</h2>
                <button onClick={() => { setEditingZone(null); setZoneForm({ zone: '', cities: '', rate: '', days: '' }); setShowZoneModal(true); }} className="bg-pink-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-pink-700 transition">
                  Add Zone
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left">Zone Name</th>
                      <th className="px-4 py-3 text-left">Cities / Regions</th>
                      <th className="px-4 py-3 text-right">Rate</th>
                      <th className="px-4 py-3 text-center">Delivery Time</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {shippingZones.map(zone => (
                      <tr key={zone.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{zone.zone}</td>
                        <td className="px-4 py-3 text-gray-500">{zone.cities}</td>
                        <td className="px-4 py-3 text-right">₹{zone.rate}</td>
                        <td className="px-4 py-3 text-center">{zone.days}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => { setEditingZone(zone); setZoneForm({ zone: zone.zone, cities: zone.cities, rate: zone.rate, days: zone.days }); setShowZoneModal(true); }} className="text-blue-500 hover:text-blue-700">Edit</button>
                            <button onClick={() => deleteZone(zone.id)} className="text-red-500 hover:text-red-700">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">Shipping Information</p>
            <p className="text-xs text-blue-600 mt-1">Free shipping applies automatically when order total exceeds ₹{defaultShipping.freeShippingThreshold}. Express delivery available at extra cost.</p>
          </div>
        </div>
      </main>

      {showZoneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowZoneModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingZone ? 'Edit Zone' : 'Add Shipping Zone'}</h3>
              <button onClick={() => setShowZoneModal(false)} className="text-gray-400 hover:text-gray-600">Close</button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Zone Name</label><input type="text" value={zoneForm.zone} onChange={(e) => setZoneForm({ ...zoneForm, zone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., North India" /></div>
              <div><label className="block text-sm font-medium mb-1">Cities / Regions</label><input type="text" value={zoneForm.cities} onChange={(e) => setZoneForm({ ...zoneForm, cities: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Delhi, Chandigarh, Jaipur" /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium mb-1">Shipping Rate (₹)</label><input type="number" value={zoneForm.rate} onChange={(e) => setZoneForm({ ...zoneForm, rate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm font-medium mb-1">Delivery Time</label><input type="text" value={zoneForm.days} onChange={(e) => setZoneForm({ ...zoneForm, days: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., 3-5 days" /></div></div>
              <button onClick={editingZone ? editZone : addZone} className="w-full bg-pink-600 text-white py-2 rounded-lg font-medium hover:bg-pink-700 transition">{editingZone ? 'Update Zone' : 'Add Zone'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorShipping;
