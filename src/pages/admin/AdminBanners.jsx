import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminBanners() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    buttonText: '',
    link: '/shop',
    images: [],
    order: 0,
    active: true,
    showTextOverlay: false
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadBanners();
  }, [navigate]);

  // ✅ Load banners from BACKEND API
  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://mypinkshop-dr93.vercel.app/api/banners');
      const data = await response.json();
      setBanners(data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error("Error loading banners:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save banner to BACKEND API
  const saveBannerToAPI = async (bannerData, isEdit = false) => {
    const url = isEdit 
      ? `https://mypinkshop-dr93.vercel.app/api/banners/${editingBanner._id || editingBanner.id}`
      : 'https://mypinkshop-dr93.vercel.app/api/banners';
    
    const method = isEdit ? 'PUT' : 'POST';
    
    const formDataToSend = new FormData();
    formDataToSend.append('title', bannerData.title);
    formDataToSend.append('subtitle', bannerData.subtitle || '');
    formDataToSend.append('buttonText', bannerData.buttonText || '');
    formDataToSend.append('link', bannerData.link);
    formDataToSend.append('order', bannerData.order);
    formDataToSend.append('active', bannerData.active);
    formDataToSend.append('showTextOverlay', bannerData.showTextOverlay);
    
    // Handle images - convert base64 to blob
    if (bannerData.images && bannerData.images.length > 0) {
      for (let i = 0; i < bannerData.images.length; i++) {
        const image = bannerData.images[i];
        if (typeof image === 'string' && image.startsWith('data:image')) {
          // Convert base64 to blob
          const blob = await fetch(image).then(res => res.blob());
          formDataToSend.append('images', blob, `banner-${Date.now()}-${i}.jpg`);
        }
      }
    }
    
    const response = await fetch(url, { 
      method, 
      body: formDataToSend 
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    return response.json();
  };

  // ✅ Delete banner from BACKEND API
  const deleteBannerFromAPI = async (id) => {
    const response = await fetch(`https://mypinkshop-dr93.vercel.app/api/banners/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  };

  // ✅ Toggle active status
  const toggleActive = async (id, currentStatus) => {
    try {
      const response = await fetch(`https://mypinkshop-dr93.vercel.app/api/banners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus })
      });
      if (response.ok) {
        await loadBanners();
      }
    } catch (error) {
      console.error("Error toggling banner:", error);
    }
  };

  const handleMultipleImages = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (files.length > 6) {
      alert('You can upload maximum 6 images per banner');
      return;
    }
    
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 5 * 1024 * 1024) {
      alert('Total images size should be less than 5MB');
      return;
    }
    
    const previews = [];
    
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        previews.push(event.target.result);
        if (previews.length === files.length) {
          setImagePreviews([...imagePreviews, ...previews]);
          setFormData({ ...formData, images: [...formData.images, ...files] });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    const newPreviews = [...imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setFormData({ ...formData, images: newImages });
    setImagePreviews(newPreviews);
  };

  const moveImageUp = (index) => {
    if (index === 0) return;
    const newImages = [...formData.images];
    const newPreviews = [...imagePreviews];
    [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
    [newPreviews[index], newPreviews[index - 1]] = [newPreviews[index - 1], newPreviews[index]];
    setFormData({ ...formData, images: newImages });
    setImagePreviews(newPreviews);
  };

  const moveImageDown = (index) => {
    if (index === formData.images.length - 1) return;
    const newImages = [...formData.images];
    const newPreviews = [...imagePreviews];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    [newPreviews[index], newPreviews[index + 1]] = [newPreviews[index + 1], newPreviews[index]];
    setFormData({ ...formData, images: newImages });
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title && formData.images.length === 0) {
      alert('Please fill title or upload at least one image');
      return;
    }

    setUploading(true);
    
    try {
      if (editingBanner) {
        await saveBannerToAPI(formData, true);
        alert('Banner updated successfully!');
      } else {
        await saveBannerToAPI(formData, false);
        alert('Banner added successfully!');
      }
      await loadBanners();
      resetForm();
    } catch (error) {
      console.error("Error saving banner:", error);
      alert('Error saving banner: ' + error.message);
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
      showTextOverlay: false
    });
    setImagePreviews([]);
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      buttonText: banner.buttonText || '',
      link: banner.link || '/shop',
      images: banner.images || [],
      order: banner.order,
      active: banner.active,
      showTextOverlay: banner.showTextOverlay || false
    });
    setImagePreviews(banner.images || []);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this banner?')) {
      try {
        await deleteBannerFromAPI(id);
        alert('Banner deleted successfully!');
        await loadBanners();
        if (editingBanner?._id === id || editingBanner?.id === id) resetForm();
      } catch (error) {
        console.error("Error deleting banner:", error);
        alert('Error deleting banner.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminLoggedIn');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm fixed top-0 left-0 right-0 z-50 px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-pink-600">Banner Management</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="absolute right-0 top-0 w-64 bg-white h-full shadow-xl p-4">
            <div className="flex justify-end mb-4">
              <button onClick={() => setMobileMenuOpen(false)} className="p-2">✕</button>
            </div>
            <div className="space-y-3">
              <button onClick={() => { navigate('/admin/dashboard'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-pink-50">Dashboard</button>
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:bg-red-50">Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold text-pink-600 mb-6">MyPinkShop</h2>
          <div className="space-y-2">
            <button onClick={() => navigate('/admin/dashboard')} className="w-full text-left px-4 py-2 rounded-lg hover:bg-pink-50">Dashboard</button>
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 rounded-lg text-red-600 hover:bg-red-50">Logout</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 pt-14 lg:pt-0">
        <header className="hidden lg:block bg-white shadow-sm">
          <div className="px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">Banner Management</h1>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-md">Logout</button>
          </div>
        </header>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Form */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">{editingBanner ? 'Edit Banner' : 'Add New Banner'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    placeholder="e.g., Summer Sale"
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Subtitle (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.subtitle} 
                    onChange={(e) => setFormData({...formData, subtitle: e.target.value})} 
                    placeholder="e.g., Up to 50% off"
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Button Text (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.buttonText} 
                    onChange={(e) => setFormData({...formData, buttonText: e.target.value})} 
                    placeholder="e.g., Shop Now"
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Link URL</label>
                  <input 
                    type="text" 
                    value={formData.link} 
                    onChange={(e) => setFormData({...formData, link: e.target.value})} 
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">e.g., /skincare, /makeup, /shop</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Order (1, 2, 3...)</label>
                  <input 
                    type="number" 
                    value={formData.order} 
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})} 
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                {/* Multiple Images Upload */}
                <div>
                  <label className="block text-sm font-medium mb-1">Banner Images</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-pink-500 transition">
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={handleMultipleImages} 
                      className="w-full text-sm cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Select multiple images at once (Ctrl+Click or Cmd+Click)
                    </p>
                    <p className="text-xs text-gray-400">Max 6 images, total under 5MB</p>
                  </div>
                  
                  {imagePreviews.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Images ({imagePreviews.length})</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {imagePreviews.map((preview, idx) => (
                          <div key={idx} className="relative group border rounded-lg overflow-hidden">
                            <img src={preview} alt={`Preview ${idx + 1}`} className="h-24 w-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                              <button 
                                type="button"
                                onClick={() => moveImageUp(idx)}
                                className="bg-white text-gray-800 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-pink-500 hover:text-white"
                                disabled={idx === 0}
                              >
                                ↑
                              </button>
                              <button 
                                type="button"
                                onClick={() => moveImageDown(idx)}
                                className="bg-white text-gray-800 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-pink-500 hover:text-white"
                                disabled={idx === imagePreviews.length - 1}
                              >
                                ↓
                              </button>
                              <button 
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.active} 
                      onChange={(e) => setFormData({...formData, active: e.target.checked})} 
                      className="w-4 h-4 text-pink-500"
                    />
                    <span>Active (show on homepage)</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.showTextOverlay} 
                      onChange={(e) => setFormData({...formData, showTextOverlay: e.target.checked})} 
                      className="w-4 h-4 text-pink-500"
                    />
                    <span>Show text overlay on image</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">If unchecked, only image will be shown (no title/subtitle/button on banner)</p>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={uploading} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-md hover:shadow-lg transition disabled:opacity-50">
                    {uploading ? 'Saving...' : (editingBanner ? 'Update Banner' : 'Add Banner')}
                  </button>
                  {editingBanner && (
                    <button type="button" onClick={resetForm} className="bg-gray-300 px-6 py-2 rounded-md hover:bg-gray-400 transition">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">All Banners ({banners.length})</h2>
              {banners.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No banners yet. Add your first banner!</p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {banners.map((banner) => (
                    <div key={banner._id || banner.id} className="border rounded-lg p-3 sm:p-4">
                      <div className="relative">
                        {banner.images && banner.images.length > 0 ? (
                          <>
                            <img 
                              src={banner.images[0]} 
                              alt={banner.title || 'Banner'} 
                              className="h-32 w-full object-cover rounded-md mb-2" 
                            />
                            {banner.images.length > 1 && (
                              <div className="flex gap-1 mt-1">
                                {banner.images.slice(1, 4).map((img, idx) => (
                                  <img key={idx} src={img} alt="" className="h-10 w-10 object-cover rounded-md" />
                                ))}
                                {banner.images.length > 4 && (
                                  <span className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center text-xs">
                                    +{banner.images.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="h-32 bg-gradient-to-r from-pink-100 to-rose-100 rounded-md mb-2 flex items-center justify-center">
                            <span className="text-3xl">🎨</span>
                          </div>
                        )}
                      </div>
                      
                      {banner.title && <h3 className="font-semibold text-gray-800 mt-2">{banner.title}</h3>}
                      {banner.subtitle && <p className="text-sm text-gray-500">{banner.subtitle}</p>}
                      <p className="text-xs text-gray-400 mt-1">Order: {banner.order} | Images: {banner.images?.length || 0}</p>
                      
                      <div className="flex flex-wrap justify-between items-center mt-3 gap-2">
                        <div className="flex gap-3">
                          <button onClick={() => handleEdit(banner)} className="text-blue-500 text-sm hover:underline">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(banner._id || banner.id)} className="text-red-500 text-sm hover:underline">
                            Delete
                          </button>
                        </div>
                        <button 
                          onClick={() => toggleActive(banner._id || banner.id, banner.active)} 
                          className={`text-xs px-3 py-1 rounded-full transition ${
                            banner.active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {banner.active ? 'Active ✓' : 'Inactive'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div className="mt-6 bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">📱 Live Preview</h2>
            {banners.filter(b => b.active).length > 0 ? (
              (() => {
                const activeBanner = banners.filter(b => b.active)[0];
                const showOverlay = activeBanner.showTextOverlay;
                const hasTitle = activeBanner.title && activeBanner.title.trim() !== '';
                
                return (
                  <div className="relative overflow-hidden rounded-lg">
                    {activeBanner.images && activeBanner.images[0] ? (
                      <img 
                        src={activeBanner.images[0]} 
                        alt={activeBanner.title || 'Banner'} 
                        className="w-full h-48 sm:h-56 md:h-64 object-cover" 
                      />
                    ) : (
                      <div className="w-full h-48 sm:h-56 md:h-64 bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                        <div className="text-center text-white">
                          <span className="text-5xl mb-2 block">🌸</span>
                          {activeBanner.title && <h3 className="text-xl sm:text-2xl font-bold">{activeBanner.title}</h3>}
                          {activeBanner.subtitle && <p className="text-sm mt-1">{activeBanner.subtitle}</p>}
                          {activeBanner.buttonText && <button className="mt-3 bg-white text-pink-600 px-4 py-1.5 rounded-full text-sm font-semibold">{activeBanner.buttonText}</button>}
                        </div>
                      </div>
                    )}
                    
                    {showOverlay && hasTitle && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center pointer-events-none rounded-lg">
                        <div className="text-center text-white">
                          {activeBanner.title && <h3 className="text-xl sm:text-2xl font-bold drop-shadow-lg">{activeBanner.title}</h3>}
                          {activeBanner.subtitle && <p className="text-sm drop-shadow-lg">{activeBanner.subtitle}</p>}
                          {activeBanner.buttonText && (
                            <button className="mt-2 bg-white text-pink-600 px-4 py-1.5 rounded-full text-sm font-semibold pointer-events-auto">
                              {activeBanner.buttonText}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-48 flex items-center justify-center rounded-lg">
                <p className="text-gray-500">No active banners to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminBanners;
