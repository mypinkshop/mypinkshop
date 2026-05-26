import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminAdvertising() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Summer Sale Campaign', budget: 5000, spent: 3240, status: 'active', impressions: 12500, clicks: 432, sales: 12499, startDate: '2024-05-01', endDate: '2024-06-30', ctr: 3.46, conversion: 2.8 },
    { id: 2, name: 'Diwali Special', budget: 10000, spent: 8920, status: 'active', impressions: 28700, clicks: 892, sales: 28750, startDate: '2024-10-15', endDate: '2024-11-15', ctr: 3.11, conversion: 3.1 },
    { id: 3, name: 'New Year Offer', budget: 3000, spent: 3000, status: 'ended', impressions: 8900, clicks: 234, sales: 5670, startDate: '2024-12-20', endDate: '2025-01-05', ctr: 2.63, conversion: 2.4 },
  ]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    budget: '',
    startDate: '',
    endDate: '',
  });

  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.budget) {
      alert('Please fill campaign name and budget');
      return;
    }

    const campaign = {
      id: Date.now(),
      name: newCampaign.name,
      budget: parseInt(newCampaign.budget),
      spent: 0,
      status: 'active',
      impressions: 0,
      clicks: 0,
      sales: 0,
      startDate: newCampaign.startDate || new Date().toISOString().split('T')[0],
      endDate: newCampaign.endDate || '',
      ctr: 0,
      conversion: 0,
    };

    setCampaigns([campaign, ...campaigns]);
    setShowCreateModal(false);
    setNewCampaign({ name: '', budget: '', startDate: '', endDate: '' });
    alert('Campaign created successfully!');
  };

  const handleDeleteCampaign = (id) => {
    setCampaigns(campaigns.filter(c => c.id !== id));
    setShowDeleteConfirm(null);
    alert('Campaign deleted successfully!');
  };

  const toggleCampaignStatus = (id) => {
    setCampaigns(campaigns.map(c => 
      c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c
    ));
  };

  const calculateROI = (spent, sales) => {
    if (spent === 0) return 0;
    return ((sales - spent) / spent * 100).toFixed(1);
  };

  const totalStats = {
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalSpend: campaigns.reduce((sum, c) => sum + c.spent, 0),
    totalImpressions: campaigns.reduce((sum, c) => sum + c.impressions, 0),
    totalSales: campaigns.reduce((sum, c) => sum + c.sales, 0),
    totalClicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="text-gray-600 hover:text-gray-800 transition">
              ←
            </button>
            <div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Advertising</h1>
              <p className="text-xs text-gray-500 mt-0.5">Manage your ad campaigns</p>
            </div>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition"
          >
            + Create Campaign
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Active Campaigns</p>
              <span className="text-2xl">📢</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalStats.activeCampaigns}</p>
            <p className="text-xs text-gray-400 mt-1">Total campaigns: {campaigns.length}</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Spend</p>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">₹{totalStats.totalSpend.toLocaleString()}</p>
            <p className="text-xs text-green-600 mt-1">ROI: {calculateROI(totalStats.totalSpend, totalStats.totalSales)}%</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Impressions</p>
              <span className="text-2xl">👁️</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalStats.totalImpressions.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">CTR: {((totalStats.totalClicks / totalStats.totalImpressions) * 100).toFixed(2)}%</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Sales Generated</p>
              <span className="text-2xl">🛍️</span>
            </div>
            <p className="text-2xl font-bold text-green-600">₹{totalStats.totalSales.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Total clicks: {totalStats.totalClicks.toLocaleString()}</p>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800">All Campaigns</h2>
          </div>
          
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
                  <th className="px-4 py-3 text-right">ROI</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {campaigns.map(campaign => (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {campaign.name}
                      <div className="text-xs text-gray-400 mt-0.5">
                        {campaign.startDate} → {campaign.endDate || 'Ongoing'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">₹{campaign.budget.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">₹{campaign.spent.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{campaign.impressions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{campaign.clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={campaign.ctr > 3 ? 'text-green-600' : 'text-gray-600'}>
                        {campaign.ctr}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">₹{campaign.sales.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={calculateROI(campaign.spent, campaign.sales) > 50 ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                        {calculateROI(campaign.spent, campaign.sales)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleCampaignStatus(campaign.id)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition ${
                          campaign.status === 'active' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {campaign.status === 'active' ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Edit">
                          ✏️
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(campaign.id)} 
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {campaigns.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📢</div>
              <p className="text-gray-500">No campaigns yet</p>
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="mt-3 text-pink-500 hover:underline"
              >
                Create your first campaign →
              </button>
            </div>
          )}
        </div>

        {/* Insights Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>📊</span> Performance Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">• Campaigns with ₹5k+ budget perform 40% better</li>
              <li className="flex items-center gap-2">• Optimal CTR range: 2-5%</li>
              <li className="flex items-center gap-2">• Weekend campaigns get 25% more impressions</li>
              <li className="flex items-center gap-2">• Video ads have 3x higher engagement</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-5 border border-pink-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>🚀</span> Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-white rounded-xl text-sm text-pink-600 border border-pink-200 hover:shadow-md transition">
                Boost Best Campaign
              </button>
              <button className="px-4 py-2 bg-white rounded-xl text-sm text-pink-600 border border-pink-200 hover:shadow-md transition">
                Download Report
              </button>
              <button className="px-4 py-2 bg-white rounded-xl text-sm text-pink-600 border border-pink-200 hover:shadow-md transition">
                Schedule Campaign
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-100 p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Create New Campaign</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                  placeholder="e.g., Summer Flash Sale"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget (₹) *</label>
                <input
                  type="number"
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                  placeholder="5000"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newCampaign.endDate}
                    onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 p-5 flex gap-3 justify-end">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleCreateCampaign} className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition">
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 text-center">
              <div className="text-5xl mb-3">🗑️</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Campaign?</h3>
              <p className="text-gray-500 text-sm">This action cannot be undone.</p>
            </div>
            <div className="border-t border-gray-100 p-5 flex gap-3 justify-center">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={() => handleDeleteCampaign(showDeleteConfirm)} className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAdvertising;
