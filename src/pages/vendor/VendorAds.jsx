import { useState } from 'react';
import VendorSidebar from './components/VendorSidebar';

function VendorAds() {
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Summer Sale Campaign', budget: 5000, spent: 3240, status: 'active', impressions: 12500, clicks: 432 },
    { id: 2, name: 'Festival Special', budget: 3000, spent: 1200, status: 'paused', impressions: 4500, clicks: 123 },
  ]);

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorSidebar />
      <div className="ml-64">
        <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-30">
          <h1 className="text-xl font-semibold text-gray-800">Advertising</h1>
        </header>
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between">
              <h2 className="font-semibold">Your Campaigns</h2>
              <button className="bg-pink-500 text-white px-4 py-1 rounded-lg text-sm">+ Create Campaign</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b"><th className="px-4 py-3 text-left">Campaign</th><th className="px-4 py-3 text-right">Budget</th><th className="px-4 py-3 text-right">Spent</th><th className="px-4 py-3 text-right">Impressions</th><th className="px-4 py-3 text-right">Clicks</th><th className="px-4 py-3 text-center">Status</th></tr>
              </thead>
              <tbody className="divide-y">
                {campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium">{c.name}</td><td className="px-4 py-3 text-right">₹{c.budget}</td><td className="px-4 py-3 text-right">₹{c.spent}</td><td className="px-4 py-3 text-right">{c.impressions}</td><td className="px-4 py-3 text-right">{c.clicks}</td><td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{c.status}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorAds;
