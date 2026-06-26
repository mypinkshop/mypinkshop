import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import toast from 'react-hot-toast';

function AdminHomepage() {
  const [activeTab, setActiveTab] = useState('banners');
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [settings, setSettings] = useState({
    showBrandStrip: true,
    showNewsletter: true,
    featuredProductsCount: 8,
  });
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    image: '',
    link: '',
    order: 0,
    active: true,
  });
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadHomepageData(token);
  }, [navigate]);

  // ✅ Load all homepage data from backend
  const loadHomepageData = async (token) => {
    try {
      setLoading(true);
      setError('');

      // 1. Load banners
      const bannersRes = await fetch(`${API_URL}/api/banners/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bannersData = await bannersRes.json();
      if (bannersRes.ok) {
        setBanners(Array.isArray(bannersData) ? bannersData : []);
      }

      // 2. Load offers
      const offersRes = await fetch(`${API_URL}/api/offers/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const offersData = await offersRes.json();
      if (offersRes.ok && offersData.success) {
        setOffers(offersData.offers || []);
      }

      // 3. Load settings
      const settingsRes = await fetch(`${API_URL}/api/homepage/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const settingsData = await settingsRes.json();
      if (settingsRes.ok && settingsData.success) {
        setSettings(prev => ({ ...prev, ...settingsData.settings }));
      }

    } catch (err) {
      console.error('Error loading homepage data:', err);
      setError('Network error. Please try again.');
      toast.error('Failed to load homepage data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save banner to backend
  const saveBannerToAPI = async (bannerData, isEdit = false) => {
    const token = localStorage.getItem('adminToken');
    
    const url = isEdit 
      ? `${API_URL}/api/banners/${editingBanner._id || editingBanner.id}`
      : `${API_URL}/api/banners`;
    
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: bannerData.title,
        subtitle: bannerData.subtitle || '',
        image: bannerData.image,
        link: bannerData.link || '/shop',
        order: parseInt(bannerData.order) || 0,
        active: bannerData.active
      })
    });

    if (res.status === 401) {
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
      throw new Error('Session expired');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to save banner');
    }
    return data;
  };

  // ✅ Delete banner from backend
  const deleteBannerFromAPI = async (id) => {
    const token = localStorage.getItem('adminToken');
    
    const res = await fetch(`${API_URL}/api/banners/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 401) {
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to delete banner');
    }
    return true;
  };

  // ✅ Toggle banner status
  const toggleBannerStatusAPI = async (id, currentStatus) => {
    const token = localStorage.getItem('adminToken');
    
    const res = await fetch(`${API_URL}/api/banners/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ active: !currentStatus })
    });

    if (res.status === 401) {
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to toggle banner');
    }
    return true;
  };

  const addBanner = async () => {
    if (!bannerForm.title || !bannerForm.image) {
      toast.error('Please fill title and image');
      return;
    }

    setProcessingId('submitting');
    try {
      await saveBannerToAPI(bannerForm, false);
      toast.success('✅ Banner added successfully!');
      await loadHomepageData(localStorage.getItem('adminToken'));
      setShowBannerModal(false);
      setBannerForm({ title: '', subtitle: '', image: '', link: '', order: 0, active: true });
    } catch (err) {
      console.error('Error adding banner:', err);
      toast.error(err.message || 'Failed to add banner');
    } finally {
      setProcessingId(null);
    }
  };

  const updateBanner = async () => {
    setProcessingId('submitting');
    try {
      await saveBannerToAPI(bannerForm, true);
      toast.success('✅ Banner updated successfully!');
      await loadHomepageData(localStorage.getItem('adminToken'));
      setShowBannerModal(false);
      setEditingBanner(null);
    } catch (err) {
      console.error('Error updating banner:', err);
      toast.error(err.message || 'Failed to update banner');
    } finally {
      setProcessingId(null);
    }
  };

  const deleteBanner = async (id) => {
    if (!window.confirm('Delete this banner?')) return;

    setProcessingId(id);
    try {
      await deleteBannerFromAPI(id);
      toast.success('🗑️ Banner deleted successfully!');
      await loadHomepageData(localStorage.getItem('adminToken'));
    } catch (err) {
      console.error('Error deleting banner:', err);
      toast.error(err.message || 'Failed to delete banner');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleBannerActive = async (id, currentStatus) => {
    setProcessingId(id);
    try {
      await toggleBannerStatusAPI(id, currentStatus);
      toast.success(`Banner ${currentStatus ? 'deactivated' : 'activated'}!`);
      await loadHomepageData(localStorage.getItem('adminToken'));
    } catch (err) {
      console.error('Error toggling banner:', err);
      toast.error(err.message || 'Failed to toggle banner');
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Save settings
  const saveSettings = async () => {
    const token = localStorage.getItem('adminToken');
    setProcessingId('settings');

    try {
      const res = await fetch(`${API_URL}/api/homepage/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('✅ Settings saved successfully!');
        localStorage.setItem('homepage_settings', JSON.stringify(settings));
      } else {
        toast.error(data.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading homepage settings...</p>
        </div>
      </div>
    );
  }

  if (error && banners.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="ml-64">
        <div className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-40 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800">🏠 Homepage Settings</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage hero banners, categories, offers and homepage settings</p>
        </div>
        <div className="p-6">
          <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto">
            <button onClick={() => setActiveTab('banners')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'banners' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>🖼️ Hero Banners</button>
            <button onClick={() => setActiveTab('offers')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'offers' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>🎯 Offers</button>
            <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'settings' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>⚙️ Settings</button>
          </div>

          {activeTab === 'banners' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => { setEditingBanner(null); setBannerForm({ title: '', subtitle: '', image: '', link: '', order: 0, active: true }); setShowBannerModal(true); }} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition">
                  + Add Banner
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left">Order</th>
                        <th className="px-4 py-3 text-left">Image</th>
                        <th className="px-4 py-3 text-left">Title</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {banners.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-gray-400">
                            🖼️ No banners found. Create your first banner!
                          </td>
                        </tr>
                      ) : (
                        banners.map(banner => (
                          <tr key={banner._id || banner.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3">{banner.order || 0}</td>
                            <td className="px-4 py-3">
                              {banner.image ? (
                                <img src={banner.image} alt={banner.title} className="w-16 h-10 object-cover rounded" />
                              ) : (
                                <span className="text-gray-400 text-xs">No image</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium">{banner.title || 'Untitled'}</td>
                            <td className="px-4 py-3 text-center">
                              <button 
                                onClick={() => toggleBannerActive(banner._id || banner.id, banner.active)} 
                                disabled={processingId === (banner._id || banner.id)}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition ${banner.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} disabled:opacity-50`}
                              >
                                {banner.active ? '✅ Active' : '❌ Inactive'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => { setEditingBanner(banner); setBannerForm({ title: banner.title || '', subtitle: banner.subtitle || '', image: banner.image || '', link: banner.link || '', order: banner.order || 0, active: banner.active !== undefined ? banner.active : true }); setShowBannerModal(true); }} className="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                                <button onClick={() => deleteBanner(banner._id || banner.id)} disabled={processingId === (banner._id || banner.id)} className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">🎯 Active Offers</h3>
                <Link to="/admin/offers" className="text-pink-600 text-sm hover:underline">Manage All Offers →</Link>
              </div>
              {offers.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No active offers</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {offers.slice(0, 3).map(offer => (
                    <div key={offer._id || offer.id} className="bg-gradient-to-r p-4 rounded-lg text-white" style={{ backgroundImage: `linear-gradient(to right, ${offer.bg || 'from-pink-500 to-rose-500'})` }}>
                      <h4 className="font-bold">{offer.title}</h4>
                      <p className="text-sm opacity-90">{offer.subtitle}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${offer.isActive !== false ? 'bg-white/20' : 'bg-red-500/50'}`}>
                        {offer.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h3 className="font-semibold text-gray-800 mb-4">⚙️ Homepage Settings</h3>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <label className="font-medium text-gray-700">Show Brand Strip</label>
                  <p className="text-sm text-gray-500">Display brand logos on homepage</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.showBrandStrip} onChange={(e) => setSettings({ ...settings, showBrandStrip: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <label className="font-medium text-gray-700">Show Newsletter Section</label>
                  <p className="text-sm text-gray-500">Display email subscription section</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.showNewsletter} onChange={(e) => setSettings({ ...settings, showNewsletter: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>

              <div className="py-3">
                <label className="block font-medium text-gray-700 mb-1">Featured Products Count</label>
                <input 
                  type="number" 
                  value={settings.featuredProductsCount} 
                  onChange={(e) => setSettings({ ...settings, featuredProductsCount: parseInt(e.target.value) || 8 })} 
                  className="w-32 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200" 
                  min="4"
                  max="20"
                />
                <p className="text-xs text-gray-400 mt-1">Number of products shown in featured section (4-20)</p>
              </div>

              <button 
                onClick={saveSettings} 
                disabled={processingId === 'settings'}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {processingId === 'settings' ? '⏳ Saving...' : '💾 Save Settings'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Banner Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBannerModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">{editingBanner ? '✏️ Edit Banner' : '➕ Add Banner'}</h3>
              <button onClick={() => setShowBannerModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500" placeholder="e.g., Summer Sale" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input type="text" value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500" placeholder="e.g., Up to 50% off" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
                <input type="text" value={bannerForm.image} onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                <input type="text" value={bannerForm.link} onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500" placeholder="/shop" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input type="number" value={bannerForm.order} onChange={(e) => setBannerForm({ ...bannerForm, order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={bannerForm.active} onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })} className="w-4 h-4 text-pink-500 rounded focus:ring-pink-500" />
                <label className="text-sm text-gray-700">Active</label>
              </div>
              <button 
                onClick={editingBanner ? updateBanner : addBanner} 
                disabled={processingId === 'submitting'}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {processingId === 'submitting' ? '⏳ Saving...' : (editingBanner ? 'Update Banner' : 'Add Banner')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminHomepage;
