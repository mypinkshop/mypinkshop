import { useState } from 'react';
import VendorSidebar from './components/VendorSidebar';

function VendorTax() {
  const [taxSettings, setTaxSettings] = useState({ gst: 18, cgst: 9, sgst: 9 });

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorSidebar />
      <div className="ml-64">
        <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-30">
          <h1 className="text-xl font-semibold text-gray-800">Tax & GST Settings</h1>
        </header>
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold mb-4">GST Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm text-gray-600 mb-1">GST Rate (%)</label><input type="number" value={taxSettings.gst} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm text-gray-600 mb-1">CGST (%)</label><input type="number" value={taxSettings.cgst} className="w-full px-3 py-2 border rounded-lg bg-gray-50" readOnly /></div>
              <div><label className="block text-sm text-gray-600 mb-1">SGST (%)</label><input type="number" value={taxSettings.sgst} className="w-full px-3 py-2 border rounded-lg bg-gray-50" readOnly /></div>
            </div>
            <button className="mt-4 bg-pink-500 text-white px-4 py-2 rounded-lg">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorTax;
