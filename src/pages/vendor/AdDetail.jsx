import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AdDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    fetchCampaignDetail();
  }, [id]);

  const fetchCampaignDetail = async () => {
    try {
      setLoading(true);
      
      // Fetch campaign details
      const response = await fetch(`${API_URL}/api/ads/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setCampaign(data.campaign);
        
        // Fetch campaign stats
        const statsResponse = await fetch(`${API_URL}/api/ads/${id}/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }
      } else {
        toast.error('Campaign not found');
        navigate('/vendor/ads');
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast.error('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ads/${id}/pause`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Campaign paused');
        fetchCampaignDetail();
      }
    } catch (error) {
      toast.error('Failed to pause campaign');
    }
  };

  const handleResume = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ads/${id}/resume`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Campaign resumed');
        fetchCampaignDetail();
      } else {
        toast.error(data.message || 'Failed to resume campaign');
      }
    } catch (error) {
      toast.error('Failed to resume campaign');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      'active': { color: 'bg-green-100 text-green-700', label: 'Active' },
      'paused': { color: 'bg-blue-100 text-blue-700', label: 'Paused' },
      'completed': { color: 'bg-gray-100 text-gray-700', label: 'Completed' },
      'rejected': { color: 'bg-red-100 text-red-700', label: 'Rejected' },
      'ended': { color: 'bg-gray-100 text-gray-700', label: 'Ended' }
    };
    return statusMap[status] || { color: 'bg-gray-100 text-gray-700', label: status };
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Campaign not found</h3>
          <Link to="/vendor/ads" className="text-pink-500 hover:underline">
            Back to Ads
          </Link>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(campaign.status);
  const progress = campaign.budget > 0 ? (campaign.spent / campaign.budget * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <Link to="/vendor/ads" className="text-pink-500 text-sm hover:underline mb-2 inline-block">
              ← Back to Ads
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
              <span className="text-sm text-gray-500">
                {campaign.type === 'product' ? '📦 Product Ad' : '🖼️ Banner Ad'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {campaign.status === 'active' && (
              <button
                onClick={handlePause}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
              >
                ⏸️ Pause
              </button>
            )}
            {campaign.status === 'paused' && (
              <button
                onClick={handleResume}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                ▶️ Resume
              </button>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Budget</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(campaign.budget)}</p>
            <p className="text-xs text-gray-400">Spent: {formatCurrency(campaign.spent)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Impressions</p>
            <p className="text-xl font-bold text-purple-600">{campaign.impressions?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Clicks</p>
            <p className="text-xl font-bold text-pink-600">{campaign.clicks?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(campaign.revenue || 0)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Budget Usage</span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                progress >= 90 ? 'bg-red-500' :
                progress >= 70 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Remaining: {formatCurrency(campaign.budget - campaign.spent)}</span>
            <span>Daily Budget: {formatCurrency(campaign.dailyBudget)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 text-sm font-medium transition ${
                activeTab === 'overview'
                  ? 'text-pink-600 border-b-2 border-pink-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 text-sm font-medium transition ${
                activeTab === 'details'
                  ? 'text-pink-600 border-b-2 border-pink-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 Details
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-3 text-sm font-medium transition ${
                activeTab === 'analytics'
                  ? 'text-pink-600 border-b-2 border-pink-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📈 Analytics
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">CTR</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {campaign.impressions > 0 
                        ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) 
                        : 0}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {campaign.clicks > 0 
                        ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2) 
                        : 0}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Cost Per Click (CPC)</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {campaign.clicks > 0 
                        ? formatCurrency(campaign.spent / campaign.clicks) 
                        : formatCurrency(0)}
                    </p>
                  </div>
                </div>

                {campaign.revenue > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-600">ROI</p>
                    <p className="text-2xl font-bold text-green-700">
                      {((campaign.revenue - campaign.spent) / campaign.spent * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-green-500 mt-1">
                      Revenue: {formatCurrency(campaign.revenue)} | Cost: {formatCurrency(campaign.spent)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Campaign Name</p>
                    <p className="font-medium">{campaign.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium">{campaign.type === 'product' ? 'Product Ad' : 'Banner Ad'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-medium">{formatDate(campaign.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="font-medium">{formatDate(campaign.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Budget</p>
                    <p className="font-medium">{formatCurrency(campaign.budget)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Daily Budget</p>
                    <p className="font-medium">{formatCurrency(campaign.dailyBudget)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bid Type</p>
                    <p className="font-medium">{campaign.bidType.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bid Amount</p>
                    <p className="font-medium">{formatCurrency(campaign.bidAmount)} / {campaign.bidType === 'cpc' ? 'click' : '1000 impressions'}</p>
                  </div>
                </div>

                {campaign.type === 'product' && campaign.productId && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-500 mb-2">Product</p>
                    <Link 
                      to={`/product/${campaign.productId._id}`}
                      className="text-pink-600 hover:underline"
                    >
                      {campaign.productId.name}
                    </Link>
                  </div>
                )}

                {campaign.type === 'banner' && campaign.banner && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-500 mb-2">Banner</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <img 
                        src={campaign.banner.imageUrl} 
                        alt={campaign.name}
                        className="w-full sm:w-64 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <div>
                        <p className="text-sm">Position: {campaign.banner.position}</p>
                        <p className="text-sm">CTA: {campaign.banner.ctaText || 'Shop Now'}</p>
                        <a 
                          href={campaign.banner.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:underline text-sm"
                        >
                          Visit Link →
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-4">
                {stats?.dailyStats && stats.dailyStats.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 text-gray-500">Date</th>
                          <th className="text-right py-2 px-3 text-gray-500">Impressions</th>
                          <th className="text-right py-2 px-3 text-gray-500">Clicks</th>
                          <th className="text-right py-2 px-3 text-gray-500">Spend</th>
                          <th className="text-right py-2 px-3 text-gray-500">Conversions</th>
                          <th className="text-right py-2 px-3 text-gray-500">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.dailyStats.map((day, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-2 px-3 text-gray-600">{formatDate(day.date)}</td>
                            <td className="text-right py-2 px-3">{day.impressions}</td>
                            <td className="text-right py-2 px-3">{day.clicks}</td>
                            <td className="text-right py-2 px-3">{formatCurrency(day.spend)}</td>
                            <td className="text-right py-2 px-3">{day.conversions}</td>
                            <td className="text-right py-2 px-3">{formatCurrency(day.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No daily stats available yet</p>
                  </div>
                )}

                {/* Summary Stats */}
                {stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Total Impressions</p>
                      <p className="font-semibold">{stats.impressions?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Total Clicks</p>
                      <p className="font-semibold">{stats.clicks?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">CTR</p>
                      <p className="font-semibold">{stats.ctr || 0}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Conversion Rate</p>
                      <p className="font-semibold">{stats.conversionRate || 0}%</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdDetail;
