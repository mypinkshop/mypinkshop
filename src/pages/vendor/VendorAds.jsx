import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const VendorAds = () => {
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCampaigns: 0
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    fetchCampaigns();
  }, [currentPage, filterStatus, filterType]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/ads?page=${currentPage}&limit=10`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      if (filterType !== 'all') url += `&type=${filterType}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id) => {
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
        fetchCampaigns();
      }
    } catch (error) {
      toast.error('Failed to pause campaign');
    }
  };

  const handleResume = async (id) => {
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
        fetchCampaigns();
      } else {
        toast.error(data.message || 'Failed to resume campaign');
      }
    } catch (error) {
      toast.error('Failed to resume campaign');
    }
  };

  const handleDelete = async () => {
    if (!selectedCampaign) return;
    try {
      const response = await fetch(`${API_URL}/api/ads/${selectedCampaign}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Campaign deleted');
        setShowDeleteModal(false);
        fetchCampaigns();
      }
    } catch (error) {
      toast.error('Failed to delete campaign');
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

  const getTypeIcon = (type) => {
    return type === 'product' ? '📦' : '🖼️';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📢 Advertising</h1>
            <p className="text-gray-500 text-sm">Manage your ad campaigns</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/vendor/create-ad"
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition"
            >
              + Create Campaign
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-4">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-500"
            >
              <option value="all">All Types</option>
              <option value="product">Product Ads</option>
              <option value="banner">Banner Ads</option>
            </select>

            <div className="ml-auto text-sm text-gray-500">
              Total: {pagination.totalCampaigns} campaigns
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No campaigns yet</h3>
            <p className="text-gray-500 mb-4">Create your first ad campaign to start advertising</p>
            <Link
              to="/vendor/create-ad"
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition inline-block"
            >
              Create Campaign
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const statusBadge = getStatusBadge(campaign.status);
              const progress = campaign.budget > 0 ? (campaign.spent / campaign.budget * 100) : 0;

              return (
                <div key={campaign._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{getTypeIcon(campaign.type)}</span>
                        <h3 className="font-semibold text-gray-800">{campaign.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        <span>Type: {campaign.type === 'product' ? 'Product Ad' : 'Banner Ad'}</span>
                        <span>•</span>
                        <span>Budget: {formatCurrency(campaign.budget)}</span>
                        <span>•</span>
                        <span>Spent: {formatCurrency(campaign.spent)}</span>
                        <span>•</span>
                        <span>Bid: {formatCurrency(campaign.bidAmount)}/{campaign.bidType === 'cpc' ? 'click' : '1000 views'}</span>
                        <span>•</span>
                        <span>{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</span>
                      </div>
                      {campaign.type === 'product' && campaign.productId && (
                        <div className="text-sm text-gray-600 mt-1">
                          Product: {campaign.productId.name}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/vendor/ads/${campaign._id}`}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition"
                      >
                        View
                      </Link>
                      {campaign.status === 'active' && (
                        <button
                          onClick={() => handlePause(campaign._id)}
                          className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm hover:bg-yellow-200 transition"
                        >
                          Pause
                        </button>
                      )}
                      {campaign.status === 'paused' && (
                        <button
                          onClick={() => handleResume(campaign._id)}
                          className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition"
                        >
                          Resume
                        </button>
                      )}
                      {(campaign.status === 'pending' || campaign.status === 'completed' || campaign.status === 'rejected') && (
                        <button
                          onClick={() => {
                            setSelectedCampaign(campaign._id);
                            setShowDeleteModal(true);
                          }}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Budget Used</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          progress >= 90 ? 'bg-red-500' :
                          progress >= 70 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                    <span>Impressions: {campaign.impressions || 0}</span>
                    <span>Clicks: {campaign.clicks || 0}</span>
                    <span>Conversions: {campaign.conversions || 0}</span>
                    {campaign.clicks > 0 && (
                      <span>CTR: {(campaign.clicks / campaign.impressions * 100).toFixed(1)}%</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
              disabled={currentPage === pagination.totalPages}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Campaign?</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this campaign? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorAds;
