import { useState } from 'react';
import VendorSidebar from './components/VendorSidebar';

function VendorSettings() {
  const [settings, setSettings] = useState({ storeName: '', email: '', phone: '' });

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorSidebar />
      <div className="ml-64">
        <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-30">
          <h1 className="text-xl font-semibold text-gray-800">Store Settings</h1>
        </header>
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-1 gap-4"><div><label className="block text-sm font-medium mb-1">Store Name</label><input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Your brand name" /></div><div><label className="block text-sm font-medium mb-1">Contact Email</label><input type="email" className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm font-medium mb-1">Phone Number</label><input type="tel" className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm font-medium mb-1">Store Address</label><textarea rows="2" className="w-full px-3 py-2 border rounded-lg"></textarea></div><button className="bg-pink-500 text-white px-4 py-2 rounded-lg">Save Settings</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorSettings;
