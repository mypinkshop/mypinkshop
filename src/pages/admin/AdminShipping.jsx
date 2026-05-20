import { useState } from 'react';

function AdminShipping() {
  const [zones, setZones] = useState([
    { id: 1, name: 'Zone A (Metro Cities)', regions: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'], rate: 49, freeShippingAbove: 999 },
    { id: 2, name: 'Zone B (Tier 2 Cities)', regions: ['Pune', 'Jaipur', 'Lucknow', 'Ahmedabad'], rate: 79, freeShippingAbove: 1499 },
    { id: 3, name: 'Zone C (Other Cities)', regions: ['Rest of India'], rate: 99, freeShippingAbove: 1999 },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4"><button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-800">←</button><h1 className="text-xl font-semibold text-gray-800">Shipping Zones & Rates</h1></div>
      </div>

      <div className="p-6">
        <div className="flex justify-end mb-4"><button className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm">+ Add Shipping Zone</button></div>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left">Zone Name</th><th className="px-4 py-3 text-left">Regions / Cities</th><th className="px-4 py-3 text-right">Shipping Rate</th><th className="px-4 py-3 text-right">Free Shipping Above</th><th className="px-4 py-3 text-center">Actions</th></tr></thead>
            <tbody className="divide-y">
              {zones.map(zone => (
                <tr key={zone.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{zone.name}</td>
                  <td className="px-4 py-3 text-gray-500">{zone.regions.join(', ')}</td>
                  <td className="px-4 py-3 text-right">₹{zone.rate}</td>
                  <td className="px-4 py-3 text-right">₹{zone.freeShippingAbove}</td>
                  <td className="px-4 py-3 text-center"><div className="flex justify-center gap-2"><button className="text-blue-500">✏️</button><button className="text-red-500">🗑️</button></div></td>
                </table>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4"><p className="text-sm text-yellow-800">💡 Tip: Free shipping applies when order total exceeds the threshold. Default shipping rate applies for orders below threshold.</p></div>
      </div>
    </div>
  );
}

export default AdminShipping;
