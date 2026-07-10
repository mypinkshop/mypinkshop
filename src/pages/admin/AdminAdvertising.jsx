import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function AdminAdvertising() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSpent: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalRevenue: 0
  });
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    budget: '',
    dailyBudget: '',
    bidAmount: '',
    bidType: 'cpc',
    startDate: '',
    endDate: '',
  });

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  // Fetch campaigns on load
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/ads/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
        // Calculate stats from campaigns
        const activeCampaigns = data.campaigns.filter(c => c.status === 'active').length;
        const totalSpent = data.campaigns.reduce((sum, c) => sum + c.spent, 0);
        const totalImpressions = data.campaigns.reduce((sum, c) => sum + c.impressions, 0);
        const totalClicks = data.campaigns.reduce((sum, c) => sum + c.clicks, 0);
        const totalRevenue = data.campaigns.reduce((sum, c) => sum + c.revenue, 0);

        setStats({
          totalCampaigns: data.campaigns.length,
          activeCampaigns,
          totalSpent,
          totalImpressions,
          totalClicks,
          totalRevenue
        });
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.budget) {
      toast.error('Please fill campaign name and budget');
      return;
    }

    try {
      const payload = {
        name: newCampaign.name,
        budget: parseFloat(newCampaign.budget),
        dailyBudget: parseFloat(newCampaign.dailyBudget) || parseFloat(newCampaign.budget) / 30,
        bidAmount: parseFloat(newCampaign.bidAmount) || 5,
        bidType: newCampaign.bidType || 'cpc',
        startDate: newCampaign.startDate || new Date().toISOString().split('T')[0],
        endDate: newCampaign.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'product'
      };

      const response = await fetch(`${API_URL}/api/ads/product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Campaign created successfully!');
        setShowCreateModal(false);
        setNewCampaign({ name: '', budget: '', dailyBudget: '', bidAmount: '', bidType: 'cpc', startDate: '', endDate: '' });
        fetchCampaigns();
      } else {
        toast.error(data.message || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Something went wrong');
    }
  };

  const handleDeleteCampaign = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/ads/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Campaign deleted successfully!');
        setShowDeleteConfirm(null);
        fetchCampaigns();
      } else {
        toast.error(data.message || 'Failed to delete campaign');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Something went wrong');
    }
  };

  const toggleCampaignStatus = async (id, currentStatus) => {
    try {
      const action = currentStatus === 'active' ? 'pause' : 'resume';
      const response = await fetch(`${API_URL}/api/ads/${id}/${action}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Campaign ${action}ed successfully!`);
        fetchCampaigns();
      } else {
        toast.error(data.message || `Failed to ${action} campaign`);
      }
    } catch (error) {
      console.error('Error toggling campaign status:', error);
      toast.error('Something went wrong');
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/ads/admin/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Campaign approved!');
        fetchCampaigns();
      }
    } catch (error) {
      toast.error('Failed to approve campaign');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return;
    try {
      const response = await fetch(`${API_URL}/api/ads/admin/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Campaign rejected!');
        fetchCampaigns();
      }
    } catch (error) {
      toast.error('Failed to reject campaign');
    }
  };

  const calculateROI = (spent, sales) => {
    if (spent === 0) return 0;
    return ((sales - spent) / spent * 100).toFixed(1);
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading campaigns...</p>
        </div>
      </div>
    );
  }

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
              <p className="text-xs text-gray-500 mt-0.5">Manage all ad campaigns</p>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Total Campaigns</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalCampaigns}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.activeCampaigns}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Total Spend</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalSpent)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Impressions</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalImpressions.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Clicks</p>
            <p className="text-2xl font-bold text-pink-600">{stats.totalClicks.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">All Campaigns</h2>
            <span className="text-sm text-gray-500">{campaigns.length} campaigns</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Campaign</th>
                  <th className="px-4 py-3 text-right">Budget</th>
                  <th className="px-4 py-3 text-right">Spent</th>
                  <th className="px-4 py-3 text-right">Impressions</th>
                  <th className="px-4 py-3 text-right">Clicks</th>
                  <th className="px-4 py-3 text-right">CTR</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">ROI</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {campaigns.map(campaign => {
                  const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions * 100).toFixed(2) : 0;
                  const roi = calculateROI(campaign.spent, campaign.revenue);
                  
                  return (
                    <tr key={campaign._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{campaign.name}</div>
                        <div className="text-xs text-gray-400 flex gap-2">
                          <span className="capitalize">{campaign.type}</span>
                          {campaign.vendorId && (
                            <span className="text-pink-500">
                              {campaign.vendorId.brandName || campaign.vendorId.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(campaign.budget)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(campaign.spent)}</td>
                      <td className="px-4 py-3 text-right">{campaign.impressions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{campaign.clicks.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={ctr > 3 ? 'text-green-600' : 'text-gray-600'}>
                          {ctr}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">{formatCurrency(campaign.revenue)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={roi > 50 ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                          {roi}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleCampaignStatus(campaign._id, campaign.status)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition ${
                            campaign.status === 'active' 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : campaign.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : campaign.status === 'paused'
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {campaign.status}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          {campaign.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleApprove(campaign._id)} 
                                className="p-1 text-green-500 hover:bg-green-50 rounded-lg transition"
                                title="Approve"
                              >
                                ✅
                              </button>
                              <button 
                                onClick={() => handleReject(campaign._id)} 
                                className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition"
                                title="Reject"
                              >
                                ❌
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => setShowDeleteConfirm(campaign._id)} 
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>📊</span> Campaign Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Total Budget</span>
                <span className="font-medium">{formatCurrency(campaigns.reduce((sum, c) => sum + c.budget, 0))}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Total Spent</span>
                <span className="font-medium text-orange-600">{formatCurrency(stats.totalSpent)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Total Revenue</span>
                <span className="font-medium text-green-600">{formatCurrency(stats.totalRevenue)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Overall ROI</span>
                <span className={`font-medium ${stats.totalSpent > 0 && stats.totalRevenue > stats.totalSpent ? 'text-green-600' : 'text-red-500'}`}>
                  {stats.totalSpent > 0 ? ((stats.totalRevenue - stats.totalSpent) / stats.totalSpent * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-5 border border-pink-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>🚀</span> Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="px-4 py-2 bg-white rounded-xl text-sm text-pink-600 border border-pink-200 hover:shadow-md transition"
              >
                + New Campaign
              </button>
              <button className="px-4 py-2 bg-white rounded-xl text-sm text-pink-600 border border-pink-200 hover:shadow-md transition">
                📥 Download Report
              </button>
              <button 
                onClick={() => fetchCampaigns()} 
                className="px-4 py-2 bg-white rounded-xl text-sm text-pink-600 border border-pink-200 hover:shadow-md transition"
              >
                🔄 Refresh
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
                  min="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Budget (₹)</label>
                <input
                  type="number"
                  value={newCampaign.dailyBudget}
                  onChange={(e) => setNewCampaign({ ...newCampaign, dailyBudget: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                  placeholder="Auto-calculated"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bid Amount (₹)</label>
                <input
                  type="number"
                  value={newCampaign.bidAmount}
                  onChange={(e) => setNewCampaign({ ...newCampaign, bidAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                  placeholder="5"
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
