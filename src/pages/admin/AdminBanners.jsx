import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminBanners() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    buttonText: 'Shop Now',
    link: '/shop',
    images: [], // ✅ Changed to array for multiple images
    order: 0,
    active: true
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // ✅ Multiple images upload with compression
  const handleMultipleImages = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (files.length > 5) {
      alert('You can upload maximum 5 images per banner');
      return;
    }
    
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 3 * 1024 * 1024) {
      alert('Total images size should be less than 3MB');
      return;
    }
    
    const compressedImages = [];
    const previews = [];
    let processed = 0;
    
    files.forEach((file, index) => {
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
          
          // Resize for mobile optimization
          const maxWidth = 800;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Please fill title');
      return;
    }

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
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      buttonText: 'Shop Now',
      link: '/shop',
      images: [],
      order: banners.length,
      active: true
    });
    setImagePreviews([]);
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      buttonText: banner.buttonText || 'Shop Now',
      link: banner.link || '/shop',
      images: banner.images || [],
      order: banner.order,
      active: banner.active
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
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Subtitle</label>
                  <input 
                    type="text" 
                    value={formData.subtitle} 
                    onChange={(e) => setFormData({...formData, subtitle: e.target.value})} 
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Button Text</label>
                  <input 
                    type="text" 
                    value={formData.buttonText} 
                    onChange={(e) => setFormData({...formData, buttonText: e.target.value})} 
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
                
                {/* ✅ Multiple Images Upload */}
                <div>
                  <label className="block text-sm font-medium mb-1">Banner Images (Select multiple)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={handleMultipleImages} 
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">You can select up to 5 images at once (max 3MB total)</p>
                  
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <img src={preview} alt={`Preview ${idx + 1}`} className="h-20 w-full object-cover rounded-md" />
                          <button 
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
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
                
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-md hover:shadow-lg transition">
                    {editingBanner ? 'Update Banner' : 'Add Banner'}
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
                      {/* Image Carousel Preview */}
                      <div className="relative">
                        {banner.images && banner.images.length > 0 ? (
                          <>
                            <img 
                              src={banner.images[0]} 
                              alt={banner.title} 
                              className="h-32 w-full object-cover rounded-md mb-3" 
                            />
                            {banner.images.length > 1 && (
                              <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                +{banner.images.length - 1} more
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="h-32 bg-gradient-to-r from-pink-100 to-rose-100 rounded-md mb-3 flex items-center justify-center">
                            <span className="text-3xl">🎨</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-gray-800">{banner.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{banner.subtitle}</p>
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

          {/* Live Preview - Mobile Responsive */}
          <div className="mt-6 bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">📱 Live Preview (How it looks on homepage)</h2>
            {banners.filter(b => b.active).length > 0 ? (
              <div className="relative overflow-hidden rounded-lg">
                {banners.filter(b => b.active)[0]?.images && banners.filter(b => b.active)[0]?.images[0] ? (
                  <img 
                    src={banners.filter(b => b.active)[0].images[0]} 
                    alt="Preview" 
                    className="w-full h-48 sm:h-56 md:h-64 object-cover" 
                  />
                ) : (
                  <div className="w-full h-48 sm:h-56 md:h-64 bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                    <div className="text-center text-white">
                      <span className="text-5xl mb-2 block">🌸</span>
                      <h3 className="text-xl sm:text-2xl font-bold">{banners.filter(b => b.active)[0]?.title}</h3>
                      <p className="text-sm mt-1">{banners.filter(b => b.active)[0]?.subtitle}</p>
                      <button className="mt-3 bg-white text-pink-600 px-4 py-1.5 rounded-full text-sm font-semibold">
                        {banners.filter(b => b.active)[0]?.buttonText || 'Shop Now'}
                      </button>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none rounded-lg">
                  <div className="text-center text-white">
                    <h3 className="text-lg sm:text-xl font-bold drop-shadow-lg">{banners.filter(b => b.active)[0]?.title}</h3>
                    <p className="text-sm drop-shadow-lg">{banners.filter(b => b.active)[0]?.subtitle}</p>
                  </div>
                </div>
              </div>
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
