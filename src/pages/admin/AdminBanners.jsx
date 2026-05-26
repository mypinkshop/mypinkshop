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
    image: '',
    order: 0,
    active: true
  });
  const [imagePreview, setImagePreview] = useState('');

  // ✅ SAME AUTH CHECK AS YOUR DASHBOARD
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.image) {
      alert('Please fill title and upload image');
      return;
    }

    if (editingBanner) {
      const updatedBanners = banners.map(b => 
        b.id === editingBanner.id ? { ...formData, id: editingBanner.id } : b
      );
      saveBanners(updatedBanners);
      alert('Banner updated successfully!');
    } else {
      const newBanner = { ...formData, id: Date.now(), createdAt: new Date().toISOString() };
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
      image: '',
      order: banners.length,
      active: true
    });
    setImagePreview('');
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      buttonText: banner.buttonText || 'Shop Now',
      link: banner.link || '/shop',
      image: banner.image,
      order: banner.order,
      active: banner.active
    });
    setImagePreview(banner.image);
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
      <div className="ml-64">
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">Banner Management</h1>
            <div className="flex gap-3">
              <button onClick={() => navigate('/admin/dashboard')} className="px-4 py-2 text-gray-600">Dashboard</button>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-md">Logout</button>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">{editingBanner ? 'Edit Banner' : 'Add New Banner'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border rounded-md px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subtitle</label>
                  <input type="text" value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} className="w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Button Text</label>
                  <input type="text" value={formData.buttonText} onChange={(e) => setFormData({...formData, buttonText: e.target.value})} className="w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Link URL</label>
                  <input type="text" value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} className="w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Order</label>
                  <input type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})} className="w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Banner Image *</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full border rounded-md px-3 py-2" />
                  {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-md" />}
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({...formData, active: e.target.checked})} />
                    <span>Active (show on homepage)</span>
                  </label>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="bg-pink-500 text-white px-4 py-2 rounded-md">{editingBanner ? 'Update' : 'Add'} Banner</button>
                  {editingBanner && <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded-md">Cancel</button>}
                </div>
              </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">All Banners</h2>
              {banners.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No banners yet. Add your first banner!</p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {banners.map((banner) => (
                    <div key={banner.id} className="border rounded-lg p-4">
                      <img src={banner.image} alt={banner.title} className="h-32 w-full object-cover rounded-md mb-3" />
                      <h3 className="font-semibold">{banner.title}</h3>
                      <p className="text-sm text-gray-500">{banner.subtitle}</p>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(banner)} className="text-blue-500 text-sm">Edit</button>
                          <button onClick={() => handleDelete(banner.id)} className="text-red-500 text-sm">Delete</button>
                        </div>
                        <button onClick={() => toggleActive(banner.id)} className={`text-sm px-2 py-1 rounded ${banner.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {banner.active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Live Preview</h2>
            {banners.filter(b => b.active).length > 0 ? (
              <div className="relative">
                <img src={banners.filter(b => b.active)[0]?.image} className="w-full h-48 md:h-64 object-cover rounded-lg" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg">
                  <div className="text-center text-white">
                    <h3 className="text-xl font-bold">{banners.filter(b => b.active)[0]?.title}</h3>
                    <p className="text-sm">{banners.filter(b => b.active)[0]?.subtitle}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-200 h-48 flex items-center justify-center rounded-lg">No active banners</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminBanners;
