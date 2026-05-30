import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminBanners() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    buttonText: '',
    link: '/shop',
    images: [],    // will store File objects or base64 previews
    order: 0,
    active: true,
    showTextOverlay: false
  });
  const [imagePreviews, setImagePreviews] = useState([]);

  // Auth
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadBanners();
  }, [navigate]);

  // Load from backend
  const loadBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://mypinkshop-dr93.vercel.app/api/banners');
      const data = await res.json();
      setBanners(Array.isArray(data) ? data.sort((a, b) => a.order - b.order) : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Upload images + text
  const saveBannerToAPI = async (bannerData, isEdit = false) => {
    const form = new FormData();
    form.append('title', bannerData.title || '');
    form.append('subtitle', bannerData.subtitle || '');
    form.append('buttonText', bannerData.buttonText || '');
    form.append('link', bannerData.link);
    form.append('order', bannerData.order);
    form.append('active', bannerData.active);
    form.append('showTextOverlay', bannerData.showTextOverlay);

    // Append actual image files (not base64)
    if (bannerData.images && bannerData.images.length) {
      for (let i = 0; i < bannerData.images.length; i++) {
        const img = bannerData.images[i];
        if (img instanceof File) {
          form.append('images', img);
        }
      }
    }

    const url = isEdit
      ? `https://mypinkshop-dr93.vercel.app/api/banners/${editingBanner._id || editingBanner.id}`
      : 'https://mypinkshop-dr93.vercel.app/api/banners';

    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, { method, body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Something went wrong');
    return json;
  };

  const deleteBanner = async (id) => {
    const res = await fetch(`https://mypinkshop-dr93.vercel.app/api/banners/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    return true;
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (files.length > 6) return alert('Max 6 images');

    const previews = files.map(f => URL.createObjectURL(f));
    setImagePreviews(previews);
    setFormData(prev => ({ ...prev, images: files }));
  };

  const removeImage = (idx) => {
    const newImages = [...formData.images];
    const newPreviews = [...imagePreviews];
    newImages.splice(idx, 1);
    newPreviews.splice(idx, 1);
    setFormData(prev => ({ ...prev, images: newImages }));
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      if (editingBanner) {
        await saveBannerToAPI(formData, true);
        alert('✅ Banner updated!');
      } else {
        await saveBannerToAPI(formData, false);
        alert('✅ Banner added!');
      }
      await loadBanners();
      resetForm();
    } catch (err) {
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
      showTextOverlay: false
    });
    setImagePreviews([]);
  };

  const handleEdit = (b) => {
    setEditingBanner(b);
    setFormData({
      title: b.title || '',
      subtitle: b.subtitle || '',
      buttonText: b.buttonText || '',
      link: b.link || '/shop',
      images: [],
      order: b.order,
      active: b.active,
      showTextOverlay: b.showTextOverlay || false
    });
    setImagePreviews(b.images || []);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await deleteBanner(id);
      alert('Deleted');
      await loadBanners();
      if (editingBanner?._id === id || editingBanner?.id === id) resetForm();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const toggleActive = async (id, current) => {
    try {
      await fetch(`https://mypinkshop-dr93.vercel.app/api/banners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !current })
      });
      await loadBanners();
    } catch (err) {
      alert('Toggle failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading banners...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow z-50 px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-pink-600">Banner Manager</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>☰</button>
      </div>
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 w-64 bg-white h-full p-5 shadow">
            <button className="mb-4 text-right w-full" onClick={() => setMobileMenuOpen(false)}>✕</button>
            <button className="block w-full text-left py-2" onClick={() => navigate('/admin/dashboard')}>Dashboard</button>
            <button className="block w-full text-left py-2 text-red-600" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 w-64 bg-white h-full shadow p-6">
        <h2 className="text-xl font-bold text-pink-600 mb-6">MyPinkShop</h2>
        <button className="block w-full text-left py-2 hover:bg-pink-50 rounded" onClick={() => navigate('/admin/dashboard')}>Dashboard</button>
        <button className="block w-full text-left py-2 text-red-600 mt-4" onClick={handleLogout}>Logout</button>
      </div>

      {/* Main */}
      <div className="lg:ml-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Add / Edit Form */}
            <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
              <h2 className="text-xl font-semibold mb-5">{editingBanner ? '✏️ Edit Banner' : '➕ Add New Banner'}</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <input type="text" placeholder="Title (optional)" className="w-full border rounded-xl px-4 py-2" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <input type="text" placeholder="Subtitle (optional)" className="w-full border rounded-xl px-4 py-2" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} />
                <input type="text" placeholder="Button text (optional)" className="w-full border rounded-xl px-4 py-2" value={formData.buttonText} onChange={e => setFormData({...formData, buttonText: e.target.value})} />
                <input type="text" placeholder="Link /shop /skincare" className="w-full border rounded-xl px-4 py-2" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
                <input type="number" placeholder="Order (1,2,3)" className="w-full border rounded-xl px-4 py-2" value={formData.order} onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})} />

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-1">Banner Images (Max 6)</label>
                  <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="w-full border rounded-xl p-2" />
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {imagePreviews.map((src, idx) => (
                        <div key={idx} className="relative group">
                          <img src={src} className="h-20 w-full object-cover rounded-lg border" alt="preview" />
                          <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} /> Active</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formData.showTextOverlay} onChange={e => setFormData({...formData, showTextOverlay: e.target.checked})} /> Show text overlay</label>
                </div>

                <button type="submit" disabled={uploading} className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-xl w-full transition">
                  {uploading ? 'Saving...' : editingBanner ? 'Update Banner' : 'Add Banner'}
                </button>
                {editingBanner && <button type="button" onClick={resetForm} className="w-full text-gray-500 text-sm py-1">Cancel edit</button>}
              </form>
            </div>

            {/* Banner List */}
            <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">📸 All Banners ({banners.length})</h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {banners.map(b => (
                  <div key={b._id || b.id} className="border rounded-xl p-3 flex flex-col gap-2">
                    {b.images?.[0] && <img src={b.images[0]} className="h-32 w-full object-cover rounded-lg" alt="banner" />}
                    <div className="font-semibold">{b.title || 'Untitled'}</div>
                    <div className="text-sm text-gray-500">Order {b.order} • {b.active ? 'Active' : 'Inactive'}</div>
                    <div className="flex gap-3 mt-1">
                      <button onClick={() => handleEdit(b)} className="text-blue-600 text-sm">Edit</button>
                      <button onClick={() => handleDelete(b._id || b.id)} className="text-red-600 text-sm">Delete</button>
                      <button onClick={() => toggleActive(b._id || b.id, b.active)} className="text-gray-600 text-sm">{b.active ? 'Deactivate' : 'Activate'}</button>
                    </div>
                  </div>
                ))}
                {banners.length === 0 && <p className="text-gray-400 text-center py-8">✨ No banners yet. Add your first one.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminBanners;
