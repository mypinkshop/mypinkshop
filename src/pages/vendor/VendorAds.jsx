import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorAds() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', budget: '', dailyBudget: '', startDate: '', endDate: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendor');
    
    if (!token || !vendorData) {
      navigate('/vendor/login');
      return;
    }

    // Load campaigns from localStorage
    const savedCampaigns = JSON.parse(localStorage.getItem('vendorCampaigns') || '[]');
    setCampaigns(savedCampaigns);
    setLoading(false);
  }, [navigate]);

  const saveCampaigns = (updatedCampaigns) => {
    localStorage.setItem('vendorCampaigns', JSON.stringify(updatedCampaigns));
    setCampaigns(updatedCampaigns);
  };

  const createCampaign = () => {
    if (!newCampaign.name || !newCampaign.budget) {
      alert('Please fill campaign name and budget');
      return;
    }
    const newId = Date.now();
    const campaign = {
      id: newId,
      name: newCampaign.name,
      budget: parseInt(newCampaign.budget),
      dailyBudget: newCampaign.dailyBudget ? parseInt(newCampaign.dailyBudget) : 0,
      spent: 0,
      status: 'paused',
      impressions: 0,
      clicks: 0,
      ctr: 0,
      sales: 0,
      acos: 0,
      startDate: newCampaign.startDate || new Date().toISOString().split('T')[0],
      endDate: newCampaign.endDate || '',
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updatedCampaigns = [...campaigns, campaign];
    saveCampaigns(updatedCampaigns);
    setShowCreateModal(false);
    setNewCampaign({ name: '', budget: '', dailyBudget: '', startDate: '', endDate: '' });
    alert('Campaign created successfully!');
  };

  const toggleCampaignStatus = (id) => {
    const updatedCampaigns = campaigns.map(c => 
      c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c
    );
    saveCampaigns(updatedCampaigns);
    alert(`Campaign ${campaigns.find(c => c.id === id)?.status === 'active' ? 'paused' : 'activated'}`);
  };

  const deleteCampaign = (id) => {
    if (window.confirm('Delete this campaign?')) {
      const updatedCampaigns = campaigns.filter(c => c.id !== id);
      saveCampaigns(updatedCampaigns);
      alert('Campaign deleted');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totalStats = {
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalBudget: campaigns.reduce((sum, c) => sum + c.budget, 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
    totalImpressions: campaigns.reduce((sum, c) => sum + c.impressions, 0),
    totalClicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
    totalSales: campaigns.reduce((sum, c) => sum + c.sales, 0),
    avgCtr: campaigns.length > 0 ? (campaigns.reduce((sum, c) => sum + c.ctr, 0) / campaigns.length).toFixed(2) : 0,
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
      <VendorSidebar activeTab="ads" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Advertising</h1>
              <p className="text-gray-500 text-sm">Create and manage your ad campaigns</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition">
              + Create Campaign
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Active Campaigns</p>
              <p className="text-2xl font-bold text-green-600">{totalStats.activeCampaigns}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Total Budget</p>
              <p className="text-2xl font-bold">₹{totalStats.totalBudget.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-orange-600">₹{totalStats.totalSpent.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Impressions</p>
              <p className="text-2xl font-bold">{totalStats.totalImpressions.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Clicks</p>
              <p className="text-2xl font-bold">{totalStats.totalClicks.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Avg CTR</p>
              <p className="text-2xl font-bold">{totalStats.avgCtr}%</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Sales Generated</p>
              <p className="text-2xl font-bold text-green-600">₹{totalStats.totalSales.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex gap-4 border-b border-gray-200 mb-6">
            <button onClick={() => setActiveTab('campaigns')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'campaigns' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Campaigns</button>
            <button onClick={() => setActiveTab('performance')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'performance' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Performance</button>
            <button onClick={() => setActiveTab('recommendations')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'recommendations' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Recommendations</button>
          </div>

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
                    {campaigns.length === 0 ? (
                      <tr className="hover:bg-gray-50">
                        <td colSpan="10" className="px-4 py-8 text-center text-gray-500">No campaigns yet. Create your first campaign!</td>
                      </tr>
                    ) : (
                      campaigns.map(campaign => (
                        <tr key={campaign.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{campaign.name}</td>
                          <td className="px-4 py-3 text-right">₹{campaign.budget.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">₹{campaign.spent.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{campaign.impressions.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{campaign.clicks.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{campaign.ctr}%</td>
                          <td className="px-4 py-3 text-right text-green-600">₹{campaign.sales.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{campaign.acos}%</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(campaign.status)}`}>{campaign.status}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => toggleCampaignStatus(campaign.id)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title={campaign.status === 'active' ? 'Pause' : 'Activate'}>⏯️</button>
                              <button onClick={() => deleteCampaign(campaign.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Delete">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Performance Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Top Performing Campaign</h3>
                  {campaigns.length > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-green-600">{campaigns.sort((a,b) => b.sales - a.sales)[0]?.name}</p>
                      <p className="text-sm text-gray-500 mt-1">₹{campaigns.sort((a,b) => b.sales - a.sales)[0]?.sales} sales • {campaigns.sort((a,b) => b.ctr - a.ctr)[0]?.ctr}% CTR</p>
                    </>
                  ) : <p className="text-gray-500">No campaigns yet</p>}
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Best CTR</h3>
                  {campaigns.length > 0 ? (
                    <>
                      <p className="text-2xl font-bold">{Math.max(...campaigns.map(c => c.ctr), 0)}%</p>
                      <p className="text-sm text-gray-500 mt-1">{campaigns.find(c => c.ctr === Math.max(...campaigns.map(c => c.ctr)))?.name}</p>
                    </>
                  ) : <p className="text-gray-500">No campaigns yet</p>}
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Lowest ACOS</h3>
                  {campaigns.length > 0 ? (
                    <>
                      <p className="text-2xl font-bold">{Math.min(...campaigns.map(c => c.acos), 0)}%</p>
                      <p className="text-sm text-gray-500 mt-1">{campaigns.find(c => c.acos === Math.min(...campaigns.map(c => c.acos)))?.name}</p>
                    </>
                  ) : <p className="text-gray-500">No campaigns yet</p>}
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Total ROI</h3>
                  <p className="text-2xl font-bold text-green-600">{totalStats.totalSpent > 0 ? ((totalStats.totalSales / totalStats.totalSpent) * 100).toFixed(1) : 0}%</p>
                  <p className="text-sm text-gray-500 mt-1">Return on ad spend</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Ad Recommendations</h2>
              <div className="space-y-4">
                {campaigns.filter(c => c.ctr > 3).length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-medium text-blue-800">📈 Increase Budget for High CTR Campaigns</p>
                    <p className="text-sm text-blue-600 mt-1">Your campaigns with CTR above 3% are performing well. Consider increasing budget to boost sales.</p>
                  </div>
                )}
                {campaigns.filter(c => c.status === 'paused').length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-medium text-yellow-800">⚠️ {campaigns.filter(c => c.status === 'paused').length} Campaign(s) are Paused</p>
                    <p className="text-sm text-yellow-600 mt-1">Your campaigns have been paused. Activate them to start getting sales.</p>
                  </div>
                )}
                {campaigns.filter(c => c.spent === 0).length === campaigns.length && campaigns.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="font-medium text-purple-800">✨ New Campaigns Created</p>
                    <p className="text-sm text-purple-600 mt-1">Your campaigns are ready to launch. Activate them to start advertising.</p>
                  </div>
                )}
                {campaigns.length === 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="font-medium text-gray-800">📢 Create Your First Campaign</p>
                    <p className="text-sm text-gray-600 mt-1">Start advertising your products to reach more customers.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

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
