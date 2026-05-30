import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminBanners() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    buttonText: '',
    link: '/shop',
    images: [],
    order: 0,
    active: true,
    showTextOverlay: false  // ✅ NEW - Text overlay on/off
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

  const loadBanners = () => {
    const savedBanners = JSON.parse(localStorage.getItem('homepage_banners') || '[]');
    setBanners(savedBanners.sort((a, b) => a.order - b.order));
  };

  const saveBanners = (updatedBanners) => {
    localStorage.setItem('homepage_banners', JSON.stringify(updatedBanners));
    setBanners(updatedBanners.sort((a, b) => a.order - b.order));
  };

  // ✅ Multiple images upload - Ek saath select karo (Ctrl+click ya Cmd+click)
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
    
    const compressedImages = [];
    const previews = [];
    let processed = 0;
    
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize for better performance
          const maxWidth = 1200;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          compressedImages.push(compressed);
          previews.push(compressed);
          processed++;
          
          if (processed === files.length) {
            setFormData({ ...formData, images: compressedImages });
            setImagePreviews(previews);
          }
        };
      };
      reader.readAsDataURL(file);
    });
  };

  // ✅ Remove image from preview
  const removeImage = (index) => {
    const newImages = [...formData.images];
    const newPreviews = [...imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setFormData({ ...formData, images: newImages });
    setImagePreviews(newPreviews);
  };

  // ✅ Reorder images (drag and drop style - simple up/down)
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title && formData.images.length === 0) {
      alert('Please fill title or upload at least one image');
      return;
    }

    setUploading(true);

    if (editingBanner) {
      const updatedBanners = banners.map(b => 
        b.id === editingBanner.id ? { 
          ...formData, 
          id: editingBanner.id,
          images: formData.images || []
        } : b
      );
      saveBanners(updatedBanners);
      alert('Banner updated successfully!');
    } else {
      const newBanner = { 
        ...formData, 
        id: Date.now(), 
        images: formData.images || [],
        createdAt: new Date().toISOString() 
      };
      saveBanners([...banners, newBanner]);
      alert('Banner added successfully!');
    }
    resetForm();
    setUploading(false);
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      buttonText: '',
      link: '/shop',
      images: [],
      order: banners.length,
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

  const handleDelete = (id) => {
    if (window.confirm('Delete this banner?')) {
      saveBanners(banners.filter(b => b.id !== id));
      if (editingBanner?.id === id) resetForm();
    }
  };

  const toggleActive = (id) => {
    saveBanners(banners.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminLoggedIn');
    navigate('/admin/login');
  };

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
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})} 
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                {/* ✅ Multiple Images Upload - Ek saath multiple select */}
                <div>
                  <label className="block text-sm font-medium mb-1">Banner Images</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-pink-500 transition">
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={handleMultipleImages} 
                      className="w-full text-sm cursor-pointer"
                      id="imageUpload"
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

            {/* List - Mobile Responsive */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">All Banners ({banners.length})</h2>
              {banners.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No banners yet. Add your first banner!</p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {banners.map((banner) => (
                    <div key={banner.id} className="border rounded-lg p-3 sm:p-4">
                      {/* Images Preview */}
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
                          <button onClick={() => handleDelete(banner.id)} className="text-red-500 text-sm hover:underline">
                            Delete
                          </button>
                        </div>
                        <button 
                          onClick={() => toggleActive(banner.id)} 
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

          {/* Live Preview - Clean image only option */}
          <div className="mt-6 bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">📱 Live Preview (How it looks on homepage)</h2>
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
                    
                    {/* Text Overlay - Only if enabled and has content */}
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

      <style>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default AdminBanners;
