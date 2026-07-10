import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function AdminAdAnalytics() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    pendingCampaigns: 0,
    completedCampaigns: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalRevenue: 0,
    totalSpent: 0,
    totalBudget: 0
  });
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [topCampaigns, setTopCampaigns] = useState([]);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch admin stats
      const response = await fetch(`${API_URL}/api/ads/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setOverview(data.summary);
        setMonthlyTrend(data.monthlyTrend || []);
        
        // Fetch all campaigns for top performers
        const campaignsRes = await fetch(`${API_URL}/api/ads/admin/all?limit=50`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const campaignsData = await campaignsRes.json();
        if (campaignsData.success) {
          // Top 5 by revenue
          const sorted = [...campaignsData.campaigns].sort((a, b) => b.revenue - a.revenue);
          setTopCampaigns(sorted.slice(0, 5));
          setRecentCampaigns(campaignsData.campaigns.slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const calculateCTR = (impressions, clicks) => {
    if (impressions === 0) return 0;
    return ((clicks / impressions) * 100).toFixed(2);
  };

  const calculateConversionRate = (clicks, conversions) => {
    if (clicks === 0) return 0;
    return ((conversions / clicks) * 100).toFixed(2);
  };

  const calculateROI = (spent, revenue) => {
    if (spent === 0) return 0;
    return ((revenue - spent) / spent * 100).toFixed(1);
  };

  // Color palette for charts
  const colors = ['#EC4899', '#F43F5E', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">📊 Ad Analytics</h1>
            <p className="text-gray-500 text-sm">Overview of all advertising campaigns</p>
          </div>
          <button 
            onClick={fetchAnalytics} 
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition flex items-center gap-2"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Campaigns</p>
            <p className="text-2xl font-bold text-gray-800">{overview.totalCampaigns}</p>
            <div className="flex gap-2 text-xs mt-1">
              <span className="text-green-600">Active: {overview.activeCampaigns}</span>
              <span className="text-yellow-600">Pending: {overview.pendingCampaigns}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(overview.totalSpent)}</p>
            <p className="text-xs text-gray-400 mt-1">of {formatCurrency(overview.totalBudget)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(overview.totalRevenue)}</p>
            <p className={`text-xs font-medium mt-1 ${overview.totalRevenue > overview.totalSpent ? 'text-green-500' : 'text-red-500'}`}>
              ROI: {calculateROI(overview.totalSpent, overview.totalRevenue)}%
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Impressions</p>
            <p className="text-2xl font-bold text-purple-600">{overview.totalImpressions.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">CTR: {calculateCTR(overview.totalImpressions, overview.totalClicks)}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Clicks</p>
            <p className="text-2xl font-bold text-pink-600">{overview.totalClicks.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Conversion: {calculateConversionRate(overview.totalClicks, overview.totalConversions)}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Conversions</p>
            <p className="text-2xl font-bold text-blue-600">{overview.totalConversions.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Revenue/Conv: {overview.totalConversions > 0 ? formatCurrency(overview.totalRevenue / overview.totalConversions) : formatCurrency(0)}</p>
          </div>
        </div>

        {/* Top Campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top 5 Campaigns by Revenue */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>🏆</span> Top Campaigns by Revenue
            </h3>
            {topCampaigns.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No data available</p>
            ) : (
              <div className="space-y-3">
                {topCampaigns.map((campaign, index) => {
                  const maxRevenue = topCampaigns[0]?.revenue || 1;
                  const barWidth = maxRevenue > 0 ? (campaign.revenue / maxRevenue * 100) : 0;
                  
                  return (
                    <div key={campaign._id}>
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="font-medium text-gray-700 flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white`}
                            style={{ backgroundColor: colors[index % colors.length] }}
                          >
                            {index + 1}
                          </span>
                          {campaign.name}
                        </span>
                        <span className="font-semibold text-green-600">{formatCurrency(campaign.revenue)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.min(barWidth, 100)}%`,
                            backgroundColor: colors[index % colors.length]
                          }} 
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>Spent: {formatCurrency(campaign.spent)}</span>
                        <span>CTR: {calculateCTR(campaign.impressions, campaign.clicks)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Campaign Status Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📊</span> Campaign Status
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                <p className="text-2xl font-bold text-green-600">{overview.activeCampaigns}</p>
                <p className="text-sm text-green-600">Active</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-100">
                <p className="text-2xl font-bold text-yellow-600">{overview.pendingCampaigns}</p>
                <p className="text-sm text-yellow-600">Pending</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <p className="text-2xl font-bold text-gray-600">{overview.completedCampaigns}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                <p className="text-2xl font-bold text-blue-600">{overview.totalCampaigns}</p>
                <p className="text-sm text-blue-600">Total</p>
              </div>
            </div>

            {/* Overall Performance */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Overall CTR</span>
                <span className="font-semibold">{calculateCTR(overview.totalImpressions, overview.totalClicks)}%</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Overall Conversion Rate</span>
                <span className="font-semibold">{calculateConversionRate(overview.totalClicks, overview.totalConversions)}%</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Overall ROI</span>
                <span className={`font-semibold ${overview.totalRevenue > overview.totalSpent ? 'text-green-600' : 'text-red-500'}`}>
                  {calculateROI(overview.totalSpent, overview.totalRevenue)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <span>📈</span> Monthly Performance Trend
            </h3>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-500"
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
            </select>
          </div>
          
          {monthlyTrend.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No monthly data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-gray-500">Month</th>
                    <th className="text-right py-2 px-3 text-gray-500">Campaigns</th>
                    <th className="text-right py-2 px-3 text-gray-500">Spend</th>
                    <th className="text-right py-2 px-3 text-gray-500">Revenue</th>
                    <th className="text-right py-2 px-3 text-gray-500">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTrend.slice(0, selectedPeriod === '3months' ? 3 : selectedPeriod === '6months' ? 6 : 12).map((month, index) => {
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const roi = month.spend > 0 ? ((month.revenue - month.spend) / month.spend * 100).toFixed(1) : 0;
                    
                    return (
                      <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="py-2 px-3 font-medium text-gray-700">
                          {monthNames[month._id.month - 1]} {month._id.year}
                        </td>
                        <td className="text-right py-2 px-3">{month.count}</td>
                        <td className="text-right py-2 px-3 text-orange-600">{formatCurrency(month.spend)}</td>
                        <td className="text-right py-2 px-3 text-green-600">{formatCurrency(month.revenue)}</td>
                        <td className={`text-right py-2 px-3 font-medium ${roi > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {roi}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🕐</span> Recent Campaigns
          </h3>
          {recentCampaigns.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No recent campaigns</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-gray-500">Campaign</th>
                    <th className="text-left py-2 px-3 text-gray-500">Vendor</th>
                    <th className="text-right py-2 px-3 text-gray-500">Budget</th>
                    <th className="text-right py-2 px-3 text-gray-500">Spent</th>
                    <th className="text-right py-2 px-3 text-gray-500">Revenue</th>
                    <th className="text-right py-2 px-3 text-gray-500">ROI</th>
                    <th className="text-center py-2 px-3 text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCampaigns.map((campaign) => {
                    const roi = calculateROI(campaign.spent, campaign.revenue);
                    const statusColors = {
                      'active': 'bg-green-100 text-green-700',
                      'pending': 'bg-yellow-100 text-yellow-700',
                      'paused': 'bg-blue-100 text-blue-700',
                      'completed': 'bg-gray-100 text-gray-700',
                      'rejected': 'bg-red-100 text-red-700',
                      'ended': 'bg-gray-100 text-gray-700'
                    };
                    
                    return (
                      <tr key={campaign._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="py-2 px-3 font-medium text-gray-700">{campaign.name}</td>
                        <td className="py-2 px-3 text-gray-600">
                          {campaign.vendorId?.brandName || campaign.vendorId?.name || 'N/A'}
                        </td>
                        <td className="text-right py-2 px-3">{formatCurrency(campaign.budget)}</td>
                        <td className="text-right py-2 px-3">{formatCurrency(campaign.spent)}</td>
                        <td className="text-right py-2 px-3 text-green-600">{formatCurrency(campaign.revenue)}</td>
                        <td className={`text-right py-2 px-3 font-medium ${roi > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {roi}%
                        </td>
                        <td className="text-center py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[campaign.status] || 'bg-gray-100 text-gray-700'}`}>
                            {campaign.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default AdminAdAnalytics;
