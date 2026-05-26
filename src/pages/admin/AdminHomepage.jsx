import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

function AdminHomepage() {
  const [activeTab, setActiveTab] = useState('banners');
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
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

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const savedBanners = JSON.parse(localStorage.getItem('homepage_banners') || '[]');
    if (savedBanners.length === 0) {
      const defaultBanners = [
        { id: 1, title: 'Summer Sale', subtitle: 'Up to 50% off on skincare', image: 'https://placehold.co/1200x400/f8d4e4/ff6b9d?text=Summer+Sale', link: '/shop', order: 1, active: true },
        { id: 2, title: 'New Arrivals', subtitle: 'Fresh collection just landed', image: 'https://placehold.co/1200x400/e8c4d4/ff6b9d?text=New+Arrivals', link: '/shop', order: 2, active: true },
      ];
      setBanners(defaultBanners);
      localStorage.setItem('homepage_banners', JSON.stringify(defaultBanners));
    } else {
      setBanners(savedBanners);
    }

    const savedCategories = JSON.parse(localStorage.getItem('homepage_categories') || '[]');
    if (savedCategories.length === 0) {
      const defaultCategories = [
        { id: 1, name: 'Skincare', image: '🧴', link: '/shop?category=skincare', order: 1, active: true },
        { id: 2, name: 'Makeup', image: '💄', link: '/shop?category=makeup', order: 2, active: true },
        { id: 3, name: 'Clothing', image: '👗', link: '/shop?category=clothing', order: 3, active: true },
        { id: 4, name: 'Accessories', image: '👜', link: '/shop?category=accessories', order: 4, active: true },
      ];
      setCategories(defaultCategories);
      localStorage.setItem('homepage_categories', JSON.stringify(defaultCategories));
    } else {
      setCategories(savedCategories);
    }

    const savedOffers = JSON.parse(localStorage.getItem('homepage_offers') || '[]');
    if (savedOffers.length === 0) {
      const defaultOffers = [
        { id: 1, title: 'Buy 1 Get 1 Free', subtitle: 'On selected skincare', bg: 'from-pink-500 to-rose-500', link: '/shop?offer=bogo', order: 1, active: true },
        { id: 2, title: 'Flat 20% Off', subtitle: 'On first order', bg: 'from-rose-500 to-pink-600', link: '/shop?offer=first', order: 2, active: true },
        { id: 3, title: 'Free Shipping', subtitle: 'On orders above ₹999', bg: 'from-pink-400 to-rose-400', link: '/shop', order: 3, active: true },
      ];
      setOffers(defaultOffers);
      localStorage.setItem('homepage_offers', JSON.stringify(defaultOffers));
    } else {
      setOffers(savedOffers);
    }
  }, [navigate]);

  const saveBanners = (updated) => {
    setBanners(updated);
    localStorage.setItem('homepage_banners', JSON.stringify(updated));
  };

  const addBanner = () => {
    if (!bannerForm.title || !bannerForm.image) {
      alert('Please fill title and image');
      return;
    }
    const newBanner = {
      id: Date.now(),
      ...bannerForm,
    };
    saveBanners([...banners, newBanner]);
    setShowBannerModal(false);
    setBannerForm({ title: '', subtitle: '', image: '', link: '', order: 0, active: true });
    alert('Banner added');
  };

  const updateBanner = () => {
    const updated = banners.map(b => b.id === editingBanner.id ? { ...b, ...bannerForm } : b);
    saveBanners(updated);
    setShowBannerModal(false);
    setEditingBanner(null);
    alert('Banner updated');
  };

  const deleteBanner = (id) => {
    if (window.confirm('Delete this banner?')) {
      saveBanners(banners.filter(b => b.id !== id));
    }
  };

  const toggleBannerActive = (id) => {
    const updated = banners.map(b => b.id === id ? { ...b, active: !b.active } : b);
    saveBanners(updated);
  };

  const reorderBanners = (dragIndex, hoverIndex) => {
    const reordered = [...banners];
    const [dragged] = reordered.splice(dragIndex, 1);
    reordered.splice(hoverIndex, 0, dragged);
    reordered.forEach((b, idx) => b.order = idx + 1);
    saveBanners(reordered);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="ml-64">
        <div className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-40">
          <h1 className="text-xl font-semibold text-gray-800">Homepage Settings</h1>
        </div>
        <div className="p-6">
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            <button onClick={() => setActiveTab('banners')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'banners' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Hero Banners</button>
            <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'categories' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Categories</button>
            <button onClick={() => setActiveTab('offers')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'offers' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Offer Banners</button>
            <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'settings' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}>Settings</button>
          </div>

          {activeTab === 'banners' && (
            <div>
              <div className="flex justify-end mb-4"><button onClick={() => setShowBannerModal(true)} className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm">+ Add Banner</button></div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr className="border-b"><th className="px-4 py-3 text-left">Order</th><th className="px-4 py-3 text-left">Image</th><th className="px-4 py-3 text-left">Title</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-center">Actions</th></tr></thead>
                  <tbody className="divide-y">{banners.map(banner => (<tr key={banner.id} className="hover:bg-gray-50"><td className="px-4 py-3">{banner.order}</td><td className="px-4 py-3"><img src={banner.image} alt={banner.title} className="w-16 h-10 object-cover rounded" /></td><td className="px-4 py-3 font-medium">{banner.title}</td><td className="px-4 py-3 text-center"><button onClick={() => toggleBannerActive(banner.id)} className={`px-2 py-1 rounded-full text-xs ${banner.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{banner.active ? 'Active' : 'Inactive'}</button></td><td className="px-4 py-3 text-center"><div className="flex justify-center gap-2"><button onClick={() => { setEditingBanner(banner); setBannerForm(banner); setShowBannerModal(true); }} className="text-blue-500">Edit</button><button onClick={() => deleteBanner(banner.id)} className="text-red-500">Delete</button></div></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-gray-500 text-center py-8">Category management coming soon — drag/drop reorder, add/remove categories</p>
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-gray-500 text-center py-8">Offer banner management coming soon</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between"><div><label className="font-medium">Show Brand Strip</label><p className="text-sm text-gray-500">Display brand logos on homepage</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={settings.showBrandStrip} onChange={(e) => setSettings({ ...settings, showBrandStrip: e.target.checked })} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div></label></div>
              <div className="flex items-center justify-between"><div><label className="font-medium">Show Newsletter Section</label><p className="text-sm text-gray-500">Display email subscription section</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={settings.showNewsletter} onChange={(e) => setSettings({ ...settings, showNewsletter: e.target.checked })} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div></label></div>
              <div><label className="block font-medium mb-1">Featured Products Count</label><input type="number" value={settings.featuredProductsCount} onChange={(e) => setSettings({ ...settings, featuredProductsCount: parseInt(e.target.value) })} className="w-32 px-3 py-2 border rounded-lg" /></div>
              <button onClick={() => { localStorage.setItem('homepage_settings', JSON.stringify(settings)); alert('Settings saved!'); }} className="bg-pink-600 text-white px-4 py-2 rounded-lg">Save Settings</button>
            </div>
          )}
        </div>
      </div>

      {showBannerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowBannerModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5 flex justify-between"><h3 className="text-xl font-bold">{editingBanner ? 'Edit Banner' : 'Add Banner'}</h3><button onClick={() => setShowBannerModal(false)}>✕</button></div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Title</label><input type="text" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Subtitle</label><input type="text" value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Image URL</label><input type="text" value={bannerForm.image} onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="https://..." /></div>
              <div><label className="block text-sm font-medium mb-1">Link URL</label><input type="text" value={bannerForm.link} onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="/shop" /></div>
              <div><label className="block text-sm font-medium mb-1">Order</label><input type="number" value={bannerForm.order} onChange={(e) => setBannerForm({ ...bannerForm, order: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={bannerForm.active} onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })} className="w-4 h-4" /><label>Active</label></div>
              <button onClick={editingBanner ? updateBanner : addBanner} className="w-full bg-pink-600 text-white py-2 rounded-lg">{editingBanner ? 'Update' : 'Add'} Banner</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminHomepage;
