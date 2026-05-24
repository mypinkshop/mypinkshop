import { useState } from 'react';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorAds() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Summer Sale Campaign', budget: 5000, spent: 3240, status: 'active', impressions: 12500, clicks: 432, ctr: 3.46, sales: 12499, acos: 25.9 },
    { id: 2, name: 'Festival Special', budget: 3000, spent: 1200, status: 'paused', impressions: 4500, clicks: 123, ctr: 2.73, sales: 5670, acos: 21.2 },
    { id: 3, name: 'New Launch Promotion', budget: 2000, spent: 2000, status: 'ended', impressions: 8900, clicks: 234, ctr: 2.63, sales: 8900, acos: 22.5 },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', budget: '', dailyBudget: '', startDate: '', endDate: '' });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>;
      case 'paused': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Paused</span>;
      case 'ended': return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">Ended</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>;
    }
  };

  const toggleCampaignStatus = (id) => {
    setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c));
  };

  const deleteCampaign = (id) => {
    if (window.confirm('Delete this campaign?')) {
      setCampaigns(campaigns.filter(c => c.id !== id));
    }
  };

  const createCampaign = () => {
    if (!newCampaign.name || !newCampaign.budget) {
      alert('Please fill campaign name and budget');
      return;
    }
    const newId = campaigns.length + 1;
    setCampaigns([...campaigns, {
      id: newId,
      name: newCampaign.name,
      budget: parseInt(newCampaign.budget),
      spent: 0,
      status: 'paused',
      impressions: 0,
      clicks: 0,
      ctr: 0,
      sales: 0,
      acos: 0,
    }]);
    setShowCreateModal(false);
    setNewCampaign({ name: '', budget: '', dailyBudget: '', startDate: '', endDate: '' });
    alert('Campaign created successfully!');
  };

  const totalStats = {
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalBudget: campaigns.reduce((sum, c) => sum + c.budget, 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
    totalImpressions: campaigns.reduce((sum, c) => sum + c.impressions, 0),
    totalClicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
    totalSales: campaigns.reduce((sum, c) => sum + c.sales, 0),
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      <VendorSidebar activeTab="ads" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Advertising</h1>
              <p className="text-gray-500 text-sm">Create and manage your ad campaigns</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition">
              + Create Campaign
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Active Campaigns</p><p className="text-2xl font-bold text-green-600">{totalStats.activeCampaigns}</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Budget</p><p className="text-2xl font-bold">₹{totalStats.totalBudget.toLocaleString()}</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Spent</p><p className="text-2xl font-bold text-orange-600">₹{totalStats.totalSpent.toLocaleString()}</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Impressions</p><p className="text-2xl font-bold">{totalStats.totalImpressions.toLocaleString()}</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Clicks</p><p className="text-2xl font-bold">{totalStats.totalClicks.toLocaleString()}</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Sales Generated</p><p className="text-2xl font-bold text-green-600">₹{totalStats.totalSales.toLocaleString()}</p></div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            <button onClick={() => setActiveTab('campaigns')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'campaigns' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Campaigns</button>
            <button onClick={() => setActiveTab('performance')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'performance' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Performance</button>
            <button onClick={() => setActiveTab('recommendations')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'recommendations' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Recommendations</button>
          </div>

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">Campaign Name</th>
                      <th className="px-4 py-3 text-right">Budget</th>
                      <th className="px-4 py-3 text-right">Spent</th>
                      <th className="px-4 py-3 text-right">Impressions</th>
                      <th className="px-4 py-3 text-right">Clicks</th>
                      <th className="px-4 py-3 text-right">CTR</th>
                      <th className="px-4 py-3 text-right">Sales</th>
                      <th className="px-4 py-3 text-right">ACOS</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.map(campaign => (
                      <tr key={campaign.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{campaign.name}</td>
                        <td className="px-4 py-3 text-right">₹{campaign.budget.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">₹{campaign.spent.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{campaign.impressions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{campaign.clicks.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{campaign.ctr}%</td>
                        <td className="px-4 py-3 text-right text-green-600">₹{campaign.sales.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{campaign.acos}%</td>
                        <td className="px-4 py-3 text-center">{getStatusBadge(campaign.status)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => toggleCampaignStatus(campaign.id)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title={campaign.status === 'active' ? 'Pause' : 'Activate'}>⏯️</button>
                            <button onClick={() => deleteCampaign(campaign.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Delete">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Performance Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4"><h3 className="font-medium mb-2">Top Performing Campaign</h3><p className="text-2xl font-bold text-green-600">Summer Sale Campaign</p><p className="text-sm text-gray-500 mt-1">₹12,499 sales • 3.46% CTR</p></div>
                <div className="border rounded-lg p-4"><h3 className="font-medium mb-2">Best CTR</h3><p className="text-2xl font-bold">3.46%</p><p className="text-sm text-gray-500">Summer Sale Campaign</p></div>
                <div className="border rounded-lg p-4"><h3 className="font-medium mb-2">Lowest ACOS</h3><p className="text-2xl font-bold">21.2%</p><p className="text-sm text-gray-500">Festival Special</p></div>
                <div className="border rounded-lg p-4"><h3 className="font-medium mb-2">Total ROI</h3><p className="text-2xl font-bold text-green-600">{(totalStats.totalSales / totalStats.totalSpent * 100).toFixed(1)}%</p><p className="text-sm text-gray-500">Return on ad spend</p></div>
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Ad Recommendations</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"><p className="font-medium text-blue-800">📈 Increase Budget for Summer Sale Campaign</p><p className="text-sm text-blue-600 mt-1">This campaign has high CTR (3.46%). Increasing budget could boost sales.</p></div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"><p className="font-medium text-yellow-800">⚠️ Festival Special Campaign is Paused</p><p className="text-sm text-yellow-600 mt-1">Your campaign has been paused for 5 days. Consider reactivating.</p></div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4"><p className="font-medium text-green-800">✨ New Keyword Suggestions</p><p className="text-sm text-green-600 mt-1">Add "glass skin", "organic skincare" to improve reach.</p></div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold">Create Campaign</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Campaign Name *</label><input type="text" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Summer Sale" /></div>
              <div><label className="block text-sm font-medium mb-1">Total Budget (₹) *</label><input type="number" value={newCampaign.budget} onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="5000" /></div>
              <div><label className="block text-sm font-medium mb-1">Daily Budget (₹)</label><input type="number" value={newCampaign.dailyBudget} onChange={(e) => setNewCampaign({ ...newCampaign, dailyBudget: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="500" /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium mb-1">Start Date</label><input type="date" value={newCampaign.startDate} onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm font-medium mb-1">End Date</label><input type="date" value={newCampaign.endDate} onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div></div>
              <button onClick={createCampaign} className="w-full bg-pink-600 text-white py-2 rounded-lg font-medium hover:bg-pink-700 transition">Create Campaign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorAds;
