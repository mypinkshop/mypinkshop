import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorAds() {
  const [campaigns, setCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'sponsoredProducts',
    budget: '',
    dailyBudget: '',
    startDate: '',
    endDate: '',
    targeting: 'automatic',
    bidAmount: '',
    selectedProducts: [],
    keywords: [],
    negativeKeywords: [],
  });
  const [keyword, setKeyword] = useState('');
  const [negativeKeyword, setNegativeKeyword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendor');
    
    if (!token || !vendorData) {
      navigate('/vendor/login');
      return;
    }

    const vendor = JSON.parse(vendorData);
    const vendorName = vendor.brandName || vendor.name;
    
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const myProducts = allProducts.filter(p => p.vendor === vendorName);
    setProducts(myProducts);
    
    const savedCampaigns = JSON.parse(localStorage.getItem('vendorCampaigns') || '[]');
    setCampaigns(savedCampaigns);
    setLoading(false);
  }, [navigate]);

  const saveCampaigns = (updatedCampaigns) => {
    localStorage.setItem('vendorCampaigns', JSON.stringify(updatedCampaigns));
    setCampaigns(updatedCampaigns);
  };

  const toggleProductSelection = (productId) => {
    if (newCampaign.selectedProducts.includes(productId)) {
      setNewCampaign({ ...newCampaign, selectedProducts: newCampaign.selectedProducts.filter(id => id !== productId) });
    } else {
      setNewCampaign({ ...newCampaign, selectedProducts: [...newCampaign.selectedProducts, productId] });
    }
  };

  const addKeyword = () => {
    if (keyword.trim() && !newCampaign.keywords.includes(keyword.trim())) {
      setNewCampaign({ ...newCampaign, keywords: [...newCampaign.keywords, keyword.trim()] });
      setKeyword('');
    }
  };

  const removeKeyword = (kw) => {
    setNewCampaign({ ...newCampaign, keywords: newCampaign.keywords.filter(k => k !== kw) });
  };

  const addNegativeKeyword = () => {
    if (negativeKeyword.trim() && !newCampaign.negativeKeywords.includes(negativeKeyword.trim())) {
      setNewCampaign({ ...newCampaign, negativeKeywords: [...newCampaign.negativeKeywords, negativeKeyword.trim()] });
      setNegativeKeyword('');
    }
  };

  const removeNegativeKeyword = (kw) => {
    setNewCampaign({ ...newCampaign, negativeKeywords: newCampaign.negativeKeywords.filter(k => k !== kw) });
  };

  const createCampaign = () => {
    if (!newCampaign.name || !newCampaign.budget) {
      alert('Please fill campaign name and budget');
      return;
    }
    if (newCampaign.selectedProducts.length === 0) {
      alert('Please select at least one product to advertise');
      return;
    }
    
    const campaign = {
      id: Date.now(),
      ...newCampaign,
      spent: 0,
      status: 'paused',
      impressions: 0,
      clicks: 0,
      ctr: 0,
      sales: 0,
      acos: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    const updatedCampaigns = [...campaigns, campaign];
    saveCampaigns(updatedCampaigns);
    setShowCreateModal(false);
    setCurrentStep(1);
    setNewCampaign({
      name: '',
      type: 'sponsoredProducts',
      budget: '',
      dailyBudget: '',
      startDate: '',
      endDate: '',
      targeting: 'automatic',
      bidAmount: '',
      selectedProducts: [],
      keywords: [],
      negativeKeywords: [],
    });
    alert('Campaign created successfully!');
  };

  const toggleCampaignStatus = (id) => {
    const updatedCampaigns = campaigns.map(c => 
      c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c
    );
    saveCampaigns(updatedCampaigns);
  };

  const deleteCampaign = (id) => {
    if (window.confirm('Delete this campaign?')) {
      const updatedCampaigns = campaigns.filter(c => c.id !== id);
      saveCampaigns(updatedCampaigns);
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
              Create Campaign
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Active Campaigns</p><p className="text-2xl font-bold text-green-600">{totalStats.activeCampaigns}</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Budget</p><p className="text-2xl font-bold">₹{totalStats.totalBudget.toLocaleString()}</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Spent</p><p className="text-2xl font-bold text-orange-600">₹{totalStats.totalSpent.toLocaleString()}</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Impressions</p><p className="text-2xl font-bold">{totalStats.totalImpressions.toLocaleString()}</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Clicks</p><p className="text-2xl font-bold">{totalStats.totalClicks.toLocaleString()}</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"><p className="text-xs text-gray-500">Sales Generated</p><p className="text-2xl font-bold text-green-600">₹{totalStats.totalSales.toLocaleString()}</p></div>
          </div>

          <div className="flex gap-4 border-b border-gray-200 mb-6">
            <button onClick={() => setActiveTab('campaigns')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'campaigns' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Campaigns</button>
            <button onClick={() => setActiveTab('performance')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'performance' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Performance</button>
          </div>

          {activeTab === 'campaigns' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left">Campaign Name</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-right">Budget</th>
                      <th className="px-4 py-3 text-right">Spent</th>
                      <th className="px-4 py-3 text-right">Impressions</th>
                      <th className="px-4 py-3 text-right">Clicks</th>
                      <th className="px-4 py-3 text-right">Sales</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.length === 0 ? (
                      <tr className="hover:bg-gray-50">
                        <td colSpan="9" className="px-4 py-8 text-center text-gray-500">No campaigns yet. Create your first campaign.</td>
                      </tr>
                    ) : (
                      campaigns.map(campaign => (
                        <tr key={campaign.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{campaign.name}</td>
                          <td className="px-4 py-3 capitalize">{campaign.type === 'sponsoredProducts' ? 'Sponsored Products' : 'Sponsored Brands'}</td>
                          <td className="px-4 py-3 text-right">₹{campaign.budget.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">₹{campaign.spent.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{campaign.impressions.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{campaign.clicks.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-green-600">₹{campaign.sales.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(campaign.status)}`}>{campaign.status}</span></td>
                          <td className="px-4 py-3 text-center"><div className="flex justify-center gap-2"><button onClick={() => toggleCampaignStatus(campaign.id)} className="p-1 text-blue-500 hover:bg-blue-50 rounded">{campaign.status === 'active' ? 'Pause' : 'Activate'}</button><button onClick={() => deleteCampaign(campaign.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">Delete</button></div></td>
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
                <div className="border rounded-lg p-4"><h3 className="font-medium mb-2">Top Performing Campaign</h3>{campaigns.length > 0 ? <><p className="text-2xl font-bold text-green-600">{campaigns.sort((a,b) => b.sales - a.sales)[0]?.name}</p><p className="text-sm text-gray-500">₹{campaigns.sort((a,b) => b.sales - a.sales)[0]?.sales} sales</p></> : <p className="text-gray-500">No campaigns yet</p>}</div>
                <div className="border rounded-lg p-4"><h3 className="font-medium mb-2">Best CTR</h3>{campaigns.length > 0 ? <><p className="text-2xl font-bold">{Math.max(...campaigns.map(c => c.ctr), 0)}%</p><p className="text-sm text-gray-500">{campaigns.find(c => c.ctr === Math.max(...campaigns.map(c => c.ctr)))?.name}</p></> : <p className="text-gray-500">No campaigns yet</p>}</div>
                <div className="border rounded-lg p-4"><h3 className="font-medium mb-2">Total ROI</h3><p className="text-2xl font-bold text-green-600">{totalStats.totalSpent > 0 ? ((totalStats.totalSales / totalStats.totalSpent) * 100).toFixed(1) : 0}%</p></div>
                <div className="border rounded-lg p-4"><h3 className="font-medium mb-2">Most Advertised Product</h3><p className="text-gray-500">Coming soon</p></div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold">Create Campaign</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">Close</button>
            </div>
            <div className="p-6">
              <div className="flex mb-8">
                {['Settings', 'Products', 'Keywords', 'Review'].map((step, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-sm font-medium ${currentStep > idx + 1 ? 'bg-green-500 text-white' : currentStep === idx + 1 ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{currentStep > idx + 1 ? '✓' : idx + 1}</div>
                    <p className="text-xs mt-1 text-gray-500">{step}</p>
                  </div>
                ))}
              </div>

              {currentStep === 1 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">Campaign Settings</h2>
                  <div><label className="block text-sm font-medium mb-1">Campaign Name *</label><input type="text" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium mb-1">Campaign Type</label><select value={newCampaign.type} onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="sponsoredProducts">Sponsored Products</option><option value="sponsoredBrands">Sponsored Brands</option></select></div>
                  <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Total Budget (₹) *</label><input type="number" value={newCampaign.budget} onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm font-medium mb-1">Daily Budget (₹)</label><input type="number" value={newCampaign.dailyBudget} onChange={(e) => setNewCampaign({ ...newCampaign, dailyBudget: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div></div>
                  <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Start Date</label><input type="date" value={newCampaign.startDate} onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm font-medium mb-1">End Date</label><input type="date" value={newCampaign.endDate} onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div></div>
                  <div><label className="block text-sm font-medium mb-1">Targeting</label><select value={newCampaign.targeting} onChange={(e) => setNewCampaign({ ...newCampaign, targeting: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="automatic">Automatic targeting</option><option value="manual">Manual targeting</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Default Bid (₹ per click)</label><input type="number" step="0.5" value={newCampaign.bidAmount} onChange={(e) => setNewCampaign({ ...newCampaign, bidAmount: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="5.00" /></div>
                  <div className="flex justify-end pt-4"><button onClick={() => setCurrentStep(2)} className="bg-pink-600 text-white px-5 py-2 rounded-lg">Continue</button></div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">Select Products to Advertise</h2>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left w-10"><input type="checkbox" checked={newCampaign.selectedProducts.length === products.length} onChange={() => { if (newCampaign.selectedProducts.length === products.length) setNewCampaign({ ...newCampaign, selectedProducts: [] }); else setNewCampaign({ ...newCampaign, selectedProducts: products.map(p => p.id) }); }} className="rounded" /></th><th className="px-4 py-2 text-left">Product Name</th><th className="px-4 py-2 text-right">Price</th><th className="px-4 py-2 text-right">Stock</th></tr></thead>
                      <tbody className="divide-y">{products.map(product => (<tr key={product.id} className="hover:bg-gray-50"><td className="px-4 py-2"><input type="checkbox" checked={newCampaign.selectedProducts.includes(product.id)} onChange={() => toggleProductSelection(product.id)} className="rounded" /></td><td className="px-4 py-2 font-medium">{product.name}</td><td className="px-4 py-2 text-right">₹{product.price}</td><td className="px-4 py-2 text-right">{product.stock}</td></tr>))}</tbody>
                    </table>
                  </div>
                  <div className="flex justify-between pt-4"><button onClick={() => setCurrentStep(1)} className="px-5 py-2 border border-gray-300 rounded-lg">Back</button><button onClick={() => setCurrentStep(3)} className="bg-pink-600 text-white px-5 py-2 rounded-lg">Continue</button></div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">Keywords</h2>
                  <div><label className="block text-sm font-medium mb-1">Add Keywords</label><div className="flex gap-2 mb-2"><input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g., glass skin serum" className="flex-1 px-3 py-2 border rounded-lg" onKeyPress={(e) => e.key === 'Enter' && addKeyword()} /><button onClick={addKeyword} className="px-4 py-2 bg-gray-100 rounded-lg">Add</button></div><div className="flex flex-wrap gap-2">{newCampaign.keywords.map(kw => (<span key={kw} className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-sm">{kw}<button onClick={() => removeKeyword(kw)} className="text-gray-500 hover:text-red-500">×</button></span>))}</div></div>
                  <div><label className="block text-sm font-medium mb-1">Negative Keywords (Exclude)</label><div className="flex gap-2 mb-2"><input type="text" value={negativeKeyword} onChange={(e) => setNegativeKeyword(e.target.value)} placeholder="e.g., cheap" className="flex-1 px-3 py-2 border rounded-lg" onKeyPress={(e) => e.key === 'Enter' && addNegativeKeyword()} /><button onClick={addNegativeKeyword} className="px-4 py-2 bg-gray-100 rounded-lg">Add</button></div><div className="flex flex-wrap gap-2">{newCampaign.negativeKeywords.map(kw => (<span key={kw} className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-full text-sm">{kw}<button onClick={() => removeNegativeKeyword(kw)} className="text-red-400 hover:text-red-600">×</button></span>))}</div></div>
                  <div className="flex justify-between pt-4"><button onClick={() => setCurrentStep(2)} className="px-5 py-2 border border-gray-300 rounded-lg">Back</button><button onClick={() => setCurrentStep(4)} className="bg-pink-600 text-white px-5 py-2 rounded-lg">Continue</button></div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold">Review & Launch</h2>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2"><p><strong>Campaign Name:</strong> {newCampaign.name || 'Not set'}</p><p><strong>Budget:</strong> ₹{newCampaign.budget || 0}</p><p><strong>Products:</strong> {newCampaign.selectedProducts.length} products selected</p><p><strong>Keywords:</strong> {newCampaign.keywords.length} keywords, {newCampaign.negativeKeywords.length} negative keywords</p><p><strong>Targeting:</strong> {newCampaign.targeting === 'automatic' ? 'Automatic' : 'Manual'}</p><p><strong>Default Bid:</strong> {newCampaign.bidAmount ? `₹${newCampaign.bidAmount}` : 'Not set'}</p></div>
                  <div className="flex justify-between pt-4"><button onClick={() => setCurrentStep(3)} className="px-5 py-2 border border-gray-300 rounded-lg">Back</button><button onClick={createCampaign} className="bg-green-600 text-white px-5 py-2 rounded-lg">Launch Campaign</button></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorAds;
