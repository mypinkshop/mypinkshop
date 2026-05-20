import { useState } from 'react';

function AdminAdvertising() {
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Summer Sale Campaign', budget: 5000, spent: 3240, status: 'active', impressions: 12500, clicks: 432, sales: 12499 },
    { id: 2, name: 'Diwali Special', budget: 10000, spent: 8920, status: 'active', impressions: 28700, clicks: 892, sales: 28750 },
    { id: 3, name: 'New Year Offer', budget: 3000, spent: 3000, status: 'ended', impressions: 8900, clicks: 234, sales: 5670 },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4"><button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-800">←</button><h1 className="text-xl font-semibold text-gray-800">Advertising</h1></div>
          <button className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm">+ Create Campaign</button>
        </div>
      </div>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">Active Campaigns</p><p className="text-2xl font-semibold">2</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">Total Spend</p><p className="text-2xl font-semibold">₹15,160</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">Total Impressions</p><p className="text-2xl font-semibold">50,100</p></div>
          <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-500">Sales Generated</p><p className="text-2xl font-semibold">₹46,919</p></div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left">Campaign Name</th><th className="px-4 py-3 text-right">Budget</th><th className="px-4 py-3 text-right">Spent</th><th className="px-4 py-3 text-right">Impressions</th><th className="px-4 py-3 text-right">Clicks</th><th className="px-4 py-3 text-right">Sales</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Actions</th></tr></thead>
            <tbody className="divide-y">
              {campaigns.map(campaign => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{campaign.name}</td>
                  <td className="px-4 py-3 text-right">₹{campaign.budget.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">₹{campaign.spent.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{campaign.impressions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{campaign.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-green-600">₹{campaign.sales.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs ${campaign.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{campaign.status}</span></td>
                  <td className="px-4 py-3 text-center"><div className="flex justify-center gap-2"><button className="text-blue-500">✏️</button><button className="text-red-500">🗑️</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminAdvertising;
