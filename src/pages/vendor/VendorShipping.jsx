import { useState } from 'react';
import VendorSidebar from './components/VendorSidebar';

function VendorShipping() {
  const [shippingZones, setShippingZones] = useState([
    { id: 1, zone: 'Local', cities: 'Mumbai, Delhi, Bangalore', rate: 49, days: '2-3 days' },
    { id: 2, zone: 'National', cities: 'Rest of India', rate: 99, days: '5-7 days' },
  ]);

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorSidebar />
      <div className="ml-64">
        <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-30">
          <h1 className="text-xl font-semibold text-gray-800">Shipping Settings</h1>
        </header>
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between">
              <h2 className="font-semibold">Shipping Zones</h2>
              <button className="bg-pink-500 text-white px-4 py-1 rounded-lg text-sm">+ Add Zone</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr className="border-b"><th className="px-4 py-3 text-left">Zone</th><th className="px-4 py-3 text-left">Cities</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-center">Delivery Time</th><th className="px-4 py-3 text-center">Action</th></tr></thead>
              <tbody className="divide-y">
                {shippingZones.map(z => (<tr key={z.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium">{z.zone}</td><td className="px-4 py-3">{z.cities}</td><td className="px-4 py-3 text-right">₹{z.rate}</td><td className="px-4 py-3 text-center">{z.days}</td><td className="px-4 py-3 text-center"><button className="text-blue-500">✏️</button></td></tr>))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorShipping;
