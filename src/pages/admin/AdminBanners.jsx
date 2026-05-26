import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    mobileImage: '',
    link: '',
    buttonText: 'Shop Now',
    order: 0,
    active: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const savedBanners = JSON.parse(localStorage.getItem('homepage_banners') || '[]');
    if (savedBanners.length === 0) {
      const defaultBanners = [
        { 
          id: 1, 
          title: 'Summer Sale', 
          subtitle: 'Up to 50% off on skincare', 
          image: 'https://images.unsplash.com/photo-1596462502278-27bfdc1e2e7c?w=1200&h=400&fit=crop',
          mobileImage: '',
          link: '/shop', 
          buttonText: 'Shop Now',
          order: 1, 
          active: true 
        },
        { 
          id: 2, 
          title: 'New Arrivals', 
          subtitle: 'Fresh collection just landed', 
          image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=400&fit=crop',
          mobileImage: '',
          link: '/shop', 
          buttonText: 'Explore',
          order: 2, 
          active: true 
        },
      ];
      setBanners(defaultBanners);
      localStorage.setItem('homepage_banners', JSON.stringify(defaultBanners));
    } else {
      setBanners(savedBanners);
    }
    setLoading(false);
  }, [navigate]);

  const saveBanners = (updated) => {
    setBanners(updated);
    localStorage.setItem('homepage_banners', JSON.stringify(updated));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.image) {
      alert('Please fill title and image URL');
      return;
    }
    if (editingBanner) {
      const updated = banners.map(b => b.id === editingBanner.id ? { ...b, ...formData } : b);
      saveBanners(updated);
      alert('Banner updated');
    } else {
      const newBanner = { id: Date.now(), ...formData };
      saveBanners([...banners, newBanner]);
      alert('Banner added');
    }
    setShowModal(false);
    setEditingBanner(null);
    setFormData({ title: '', subtitle: '', image: '', mobileImage: '', link: '', buttonText: 'Shop Now', order: 0, active: true });
  };

  const deleteBanner = (id) => {
    if (window.confirm('Delete this banner?')) {
      saveBanners(banners.filter(b => b.id !== id));
    }
  };

  const toggleActive = (id) => {
    const updated = banners.map(b => b.id === id ? { ...b, active: !b.active } : b);
    saveBanners(updated);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const reordered = [...banners];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    reordered.forEach((b, idx) => b.order = idx + 1);
    saveBanners(reordered);
  };

  const moveDown = (index) => {
    if (index === banners.length - 1) return;
    const reordered = [...banners];
    [reordered[index + 1], reordered[index]] = [reordered[index], reordered[index + 1]];
    reordered.forEach((b, idx) => b.order = idx + 1);
    saveBanners(reordered);
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
      <AdminSidebar />
      <div className="ml-64">
        <div className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-40">
          <h1 className="text-xl font-semibold text-gray-800">Hero Banners</h1>
        </div>
        <div className="p-6">
          <div className="flex justify-end mb-4">
            <button onClick={() => { setEditingBanner(null); setFormData({ title: '', subtitle: '', image: '', mobileImage: '', link: '', buttonText: 'Shop Now', order: 0, active: true }); setShowModal(true); }} className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-700 transition">
              + Add Banner
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left w-16">Order</th>
                  <th className="px-4 py-3 text-left">Image</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Subtitle</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {banners.map((banner, idx) => (
                  <tr key={banner.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">↑</button>
                        <span className="text-xs text-gray-500">{banner.order}</span>
                        <button onClick={() => moveDown(idx)} disabled={idx === banners.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">↓</button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <img src={banner.image} alt={banner.title} className="w-20 h-12 object-cover rounded" />
                    </td>
                    <td className="px-4 py-3 font-medium">{banner.title}</td>
                    <td className="px-4 py-3 text-gray-500">{banner.subtitle}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(banner.id)} className={`px-2 py-1 rounded-full text-xs ${banner.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {banner.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { setEditingBanner(banner); setFormData(banner); setShowModal(true); }} className="text-blue-500 hover:text-blue-700">Edit</button>
                        <button onClick={() => deleteBanner(banner.id)} className="text-red-500 hover:text-red-700">Delete</button>
                      </div>
                     </td>
                   </tr>
                ))}
              </tbody>
             </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Banner Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold">{editingBanner ? 'Edit Banner' : 'Add New Banner'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Title *</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Subtitle</label><input type="text" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Desktop Image URL *</label><input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="https://..." /></div>
              <div><label className="block text-sm font-medium mb-1">Mobile Image URL (optional)</label><input type="text" value={formData.mobileImage} onChange={(e) => setFormData({ ...formData, mobileImage: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Link URL</label><input type="text" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="/shop" /></div>
              <div><label className="block text-sm font-medium mb-1">Button Text</label><input type="text" value={formData.buttonText} onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Order</label><input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="w-4 h-4" /><label>Active</label></div>
              <button onClick={handleSubmit} className="w-full bg-pink-600 text-white py-2 rounded-lg font-medium hover:bg-pink-700 transition">{editingBanner ? 'Update Banner' : 'Add Banner'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBanners;
