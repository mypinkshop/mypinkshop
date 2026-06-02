import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminBanners() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    buttonText: '',
    link: '/shop',
    images: [],
    order: 1,
    active: true,
    showTextOverlay: true
  });
  const [imagePreviews, setImagePreviews] = useState([]);

  const API_BASE = 'https://api.mypinkshop.com/api';

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadBanners();
  }, [navigate]);

  // ✅ Load banners from backend with token
  const loadBanners = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_BASE}/banners`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setBanners(Array.isArray(data) ? data.sort((a, b) => a.order - b.order) : []);
    } catch (err) {
      console.error('Load error:', err);
      setError('Failed to load banners. Please refresh.');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save banner to backend with token
  const saveBannerToAPI = async (bannerData, isEdit = false) => {
    const token = localStorage.getItem('adminToken');
    const form = new FormData();
    form.append('title', bannerData.title || '');
    form.append('subtitle', bannerData.subtitle || '');
    form.append('buttonText', bannerData.buttonText || '');
    form.append('link', bannerData.link || '/shop');
    form.append('order', bannerData.order.toString());
    form.append('active', bannerData.active);
    form.append('showTextOverlay', bannerData.showTextOverlay);

    if (bannerData.images && bannerData.images.length) {
      for (let i = 0; i < bannerData.images.length; i++) {
        const img = bannerData.images[i];
        if (img instanceof File) {
          form.append('images', img);
        }
      }
    }

    const url = isEdit
      ? `${API_BASE}/banners/${editingBanner._id || editingBanner.id}`
      : `${API_BASE}/banners`;

    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, { 
      method, 
      body: form,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error('Server returned invalid response');
    }
    
    if (!response.ok) {
      throw new Error(json.error || 'Failed to save banner');
    }
    
    return json;
  };

  // ✅ Delete banner with token
  const deleteBanner = async (id) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE}/banners/${id}`, { 
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Delete failed');
    }
    return true;
  };

  // ✅ Toggle active with token
  const toggleActive = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/banners/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: !currentStatus })
      });
      if (response.ok) {
        await loadBanners();
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (files.length > 6) {
      alert('Maximum 6 images allowed');
      return;
    }
    
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 5 * 1024 * 1024) {
      alert('Total images size should be less than 5MB');
      return;
    }
    
    const previews = files.map(f => URL.createObjectURL(f));
    setImagePreviews(previews);
    setFormData(prev => ({ ...prev, images: files }));
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    const newPreviews = [...imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setFormData(prev => ({ ...prev, images: newImages }));
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title && formData.images.length === 0) {
      alert('Please enter a title or upload at least one image');
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      if (editingBanner) {
        await saveBannerToAPI(formData, true);
        alert('✅ Banner updated successfully!');
      } else {
        await saveBannerToAPI(formData, false);
        alert('✅ Banner added successfully!');
      }
      await loadBanners();
      resetForm();
    } catch (err) {
      console.error('Submit error:', err);
      alert('❌ ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      buttonText: '',
      link: '/shop',
      images: [],
      order: banners.length + 1,
      active: true,
      showTextOverlay: true
    });
    setImagePreviews([]);
    setError('');
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      buttonText: banner.buttonText || '',
      link: banner.link || '/shop',
      images: [],
      order: banner.order,
      active: banner.active,
      showTextOverlay: banner.showTextOverlay !== false
    });
    setImagePreviews(banner.images || []);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner permanently?')) return;
    
    try {
      await deleteBanner(id);
      alert('✅ Banner deleted');
      await loadBanners();
      if (editingBanner?._id === id || editingBanner?.id === id) resetForm();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminLoggedIn');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading banners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-lg z-50 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Banner Manager</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="absolute right-0 top-0 w-72 bg-white h-full shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-pink-600">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="text-gray-500">✕</button>
            </div>
            <div className="space-y-3">
              <button onClick={() => { navigate('/admin/dashboard'); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-2 rounded-lg hover:bg-pink-50 transition">
                Dashboard
              </button>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 w-64 bg-white shadow-xl h-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-8">MyPinkShop</h2>
          <div className="space-y-2">
            <button onClick={() => navigate('/admin/dashboard')} className="w-full text-left px-4 py-2 rounded-lg hover:bg-pink-50 transition">
              📊 Dashboard
            </button>
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 pt-16 lg:pt-8">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Add/Edit Form */}
            <div className="bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">
                  {editingBanner ? '✏️ Edit Banner' : '✨ Create New Banner'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., Summer Sale 2024" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <input type="text" value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} placeholder="e.g., Up to 50% off on skincare" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                  <input type="text" value={formData.buttonText} onChange={(e) => setFormData({...formData, buttonText: e.target.value})} placeholder="e.g., Shop Now" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                  <input type="text" value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} placeholder="/skincare or /makeup" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition" />
                  <p className="text-xs text-gray-400 mt-1">Example: /skincare, /makeup, /shop</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 1})} min="1" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition" />
                  <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner Images</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-pink-500 transition cursor-pointer">
                    <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="w-full text-sm cursor-pointer" />
                    <p className="text-xs text-gray-400 mt-2">Select up to 6 images (max 5MB total)</p>
                  </div>
                  
                  {imagePreviews.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">{imagePreviews.length} image(s) selected</p>
                      <div className="grid grid-cols-3 gap-2">
                        {imagePreviews.map((src, idx) => (
                          <div key={idx} className="relative group">
                            <img src={src} className="h-20 w-full object-cover rounded-lg border shadow-sm" alt="preview" />
                            <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({...formData, active: e.target.checked})} className="w-4 h-4 text-pink-500 rounded" />
                    <span className="text-sm text-gray-700">Active (show on homepage)</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.showTextOverlay} onChange={(e) => setFormData({...formData, showTextOverlay: e.target.checked})} className="w-4 h-4 text-pink-500 rounded" />
                    <span className="text-sm text-gray-700">Show title/text on banner</span>
                  </label>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={uploading} className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2.5 rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50">
                    {uploading ? 'Saving...' : (editingBanner ? 'Update Banner' : 'Add Banner')}
                  </button>
                  {editingBanner && (
                    <button type="button" onClick={resetForm} className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Banners List */}
            <div className="bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">📸 All Banners ({banners.length})</h2>
              </div>
              <div className="p-6 max-h-[600px] overflow-y-auto">
                {banners.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">🎨</div>
                    <p className="text-gray-400">No banners yet. Create your first banner!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {banners.map((banner, idx) => (
                      <div key={banner._id || banner.id || idx} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition">
                        {banner.images && banner.images[0] ? (
                          <img src={banner.images[0]} alt={banner.title || 'Banner'} className="w-full h-32 object-cover rounded-lg mb-3" />
                        ) : (
                          <div className="w-full h-32 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg mb-3 flex items-center justify-center">
                            <span className="text-3xl">🖼️</span>
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-800">{banner.title || 'Untitled'}</h3>
                            {banner.subtitle && <p className="text-sm text-gray-500">{banner.subtitle}</p>}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${banner.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{banner.active ? 'Active' : 'Inactive'}</span>
                        </div>
                        <div className="flex gap-3 mt-3">
                          <button onClick={() => handleEdit(banner)} className="text-sm text-blue-600 hover:text-blue-700 transition">Edit</button>
                          <button onClick={() => handleDelete(banner._id || banner.id)} className="text-sm text-red-600 hover:text-red-700 transition">Delete</button>
                          <button onClick={() => toggleActive(banner._id || banner.id, banner.active)} className="text-sm text-gray-600 hover:text-gray-700 transition">{banner.active ? 'Deactivate' : 'Activate'}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Preview Section */}
          <div className="mt-8 bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">🎯 Live Preview</h2>
              <p className="text-pink-100 text-sm">How it looks on homepage</p>
            </div>
            <div className="p-6">
              {banners.filter(b => b.active).length > 0 ? (
                <div className="relative rounded-xl overflow-hidden">
                  {(() => {
                    const activeBanner = banners.filter(b => b.active)[0];
                    return (
                      <>
                        {activeBanner.images && activeBanner.images[0] ? (
                          <img src={activeBanner.images[0]} alt={activeBanner.title || 'Banner'} className="w-full h-48 sm:h-56 md:h-64 object-cover" />
                        ) : (
                          <div className="w-full h-48 sm:h-56 md:h-64 bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center">
                            <div className="text-center text-white">
                              <div className="text-5xl mb-2">✨</div>
                              {activeBanner.title && <h3 className="text-2xl font-bold">{activeBanner.title}</h3>}
                              {activeBanner.subtitle && <p className="mt-1">{activeBanner.subtitle}</p>}
                              {activeBanner.buttonText && <button className="mt-3 bg-white text-pink-600 px-6 py-2 rounded-full text-sm font-semibold">{activeBanner.buttonText}</button>}
                            </div>
                          </div>
                        )}
                        {activeBanner.showTextOverlay && activeBanner.title && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-center">
                            <div className="text-center text-white">
                              {activeBanner.title && <h3 className="text-xl sm:text-2xl font-bold drop-shadow-lg">{activeBanner.title}</h3>}
                              {activeBanner.subtitle && <p className="drop-shadow-lg">{activeBanner.subtitle}</p>}
                              {activeBanner.buttonText && <button className="mt-2 bg-white text-pink-600 px-6 py-2 rounded-full text-sm font-semibold">{activeBanner.buttonText}</button>}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-gray-100 h-48 flex items-center justify-center rounded-xl">
                  <p className="text-gray-400">No active banners to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminBanners;
