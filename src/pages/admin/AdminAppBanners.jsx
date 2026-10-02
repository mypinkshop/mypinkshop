// AdminAppBanners.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminSidebar from '../../components/AdminSidebar';

function AdminAppBanners() {
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';
  const getToken = () => localStorage.getItem('adminToken');

  // ============ FORM STATE ============
  const emptyForm = {
    type: 'hero',
    title: '',
    subtitle: '',
    description: '',
    emoji: '',
    image: '',
    ctaText: '',
    ctaLink: '',
    gradientStart: '#EC4899',
    gradientEnd: '#F43F5E',
    bgColor: '',
    textColor: '#FFFFFF',
    orderIndex: 0,
    isActive: true,
    startDate: '',
    endDate: '',
  };
  const [form, setForm] = useState(emptyForm);

  // ============ LOAD BANNERS ============
  const loadBanners = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/app-banners/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || [];
        setBanners(list);
      } else {
        toast.error('Failed to load banners');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // ============ OPEN MODAL ============
  const handleAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, orderIndex: banners.length + 1 });
    setShowModal(true);
  };

  const handleEdit = (banner) => {
    setEditing(banner);
    setForm({
      type: banner.type || 'hero',
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      emoji: banner.emoji || '',
      image: banner.image || '',
      ctaText: banner.cta_text || '',
      ctaLink: banner.cta_link || '',
      gradientStart: banner.gradient_start || '#EC4899',
      gradientEnd: banner.gradient_end || '#F43F5E',
      bgColor: banner.bg_color || '',
      textColor: banner.text_color || '#FFFFFF',
      orderIndex: banner.order_index || 0,
      isActive: banner.is_active === 1,
      startDate: banner.start_date || '',
      endDate: banner.end_date || '',
    });
    setShowModal(true);
  };

  // ============ SAVE ============
  const handleSave = async () => {
    if (!form.title && !form.image) {
      toast.error('Title or image is required');
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      const url = editing
        ? `${API_URL}/api/app-banners/${editing.id}`
        : `${API_URL}/api/app-banners`;
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(editing ? 'Banner updated!' : 'Banner created!');
        setShowModal(false);
        setForm(emptyForm);
        setEditing(null);
        loadBanners();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  // ============ DELETE ============
  const handleDelete = async (banner) => {
    if (!window.confirm(`Delete "${banner.title || banner.id}"?`)) return;

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/app-banners/${banner.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('Banner deleted');
        loadBanners();
      } else {
        toast.error('Failed to delete');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  // ============ TOGGLE ACTIVE ============
  const handleToggle = async (banner) => {
    try {
      const token = getToken();
      const res = await fetch(
        `${API_URL}/api/app-banners/${banner.id}/toggle`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        toast.success(data.is_active ? 'Banner activated' : 'Banner deactivated');
        loadBanners();
      }
    } catch (err) {
      toast.error('Failed to toggle');
    }
  };

  // ============ REORDER ============
  const handleMoveOrder = async (banner, direction) => {
    const currentIdx = banners.findIndex((b) => b.id === banner.id);
    const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;

    if (targetIdx < 0 || targetIdx >= banners.length) return;

    const newOrder = [...banners];
    [newOrder[currentIdx], newOrder[targetIdx]] = [
      newOrder[targetIdx],
      newOrder[currentIdx],
    ];

    // Update local state
    setBanners(newOrder.map((b, i) => ({ ...b, order_index: i + 1 })));

    // Send to backend
    try {
      const token = getToken();
      await fetch(`${API_URL}/api/app-banners/reorder/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order: newOrder.map((b, i) => ({ id: b.id, orderIndex: i + 1 })),
        }),
      });
      toast.success('Order updated');
    } catch (err) {
      toast.error('Failed to reorder');
    }
  };

  // ============ FILTER ============
  const filteredBanners =
    filterType === 'all'
      ? banners
      : banners.filter((b) => b.type === filterType);

  const typeCounts = {
    all: banners.length,
    hero: banners.filter((b) => b.type === 'hero').length,
    offer: banners.filter((b) => b.type === 'offer').length,
    promo: banners.filter((b) => b.type === 'promo').length,
    category: banners.filter((b) => b.type === 'category').length,
    section: banners.filter((b) => b.type === 'section').length,
  };

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30">
        <AdminSidebar />
        <div className="lg:ml-64 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-24 bg-white rounded-3xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-white rounded-3xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50/30">
      <AdminSidebar />

      <div className="lg:ml-64">
        {/* ============ HEADER ============ */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                    📱 App Banners
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-pink-700 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-200">
                    Mobile App Only
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Manage banners shown in the mobile app home screen
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/admin/banners"
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                >
                  🎨 Website Banners
                </Link>

                <button
                  onClick={handleAdd}
                  className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold hover:shadow-lg hover:shadow-pink-500/30 transition shadow-md flex items-center gap-2"
                >
                  <span className="text-lg">+</span>
                  Add Banner
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* ============ STATS ============ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { key: 'all', label: 'All', icon: '📋', color: 'from-slate-500 to-slate-700' },
              { key: 'hero', label: 'Hero', icon: '✨', color: 'from-pink-500 to-rose-500' },
              { key: 'offer', label: 'Offer', icon: '📢', color: 'from-amber-500 to-orange-500' },
              { key: 'promo', label: 'Promo', icon: '🎉', color: 'from-purple-500 to-pink-500' },
              { key: 'category', label: 'Category', icon: '📁', color: 'from-blue-500 to-indigo-500' },
              { key: 'section', label: 'Section', icon: '📊', color: 'from-teal-500 to-emerald-500' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setFilterType(t.key)}
                className={`relative bg-white rounded-2xl border-2 p-3 text-left hover:shadow-md transition overflow-hidden ${
                  filterType === t.key
                    ? 'border-pink-500 shadow-lg shadow-pink-500/20'
                    : 'border-slate-200/60'
                }`}
              >
                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${t.color} opacity-10 rounded-full -mr-4 -mt-4`}></div>
                <div className="relative flex items-center gap-2">
                  <span className="text-xl">{t.icon}</span>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">
                      {t.label}
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {typeCounts[t.key] || 0}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ============ BANNERS GRID ============ */}
          {filteredBanners.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/60 p-16 text-center">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                No {filterType !== 'all' ? filterType : ''} banners yet
              </h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Add your first banner to show in the mobile app home screen
              </p>
              <button
                onClick={handleAdd}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold hover:shadow-lg transition inline-flex items-center gap-2"
              >
                <span className="text-lg">+</span>
                Add First Banner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBanners.map((banner, idx) => (
                <div
                  key={banner.id}
                  className={`group bg-white rounded-3xl border-2 overflow-hidden hover:shadow-xl transition ${
                    banner.is_active ? 'border-slate-200/60' : 'border-red-200 bg-red-50/30'
                  }`}
                >
                  {/* Preview */}
                  <div
                    className="relative h-40 overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${banner.gradient_start || '#EC4899'}, ${banner.gradient_end || '#F43F5E'})`,
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-between p-6">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-1">
                          {banner.type}
                        </p>
                        <p className="text-white font-bold text-lg leading-tight mb-1">
                          {banner.title}
                        </p>
                        {banner.subtitle && (
                          <p className="text-white/90 text-xs">
                            {banner.subtitle}
                          </p>
                        )}
                      </div>
                      {banner.emoji && (
                        <div className="text-6xl opacity-90">{banner.emoji}</div>
                      )}
                    </div>

                    {/* Order index badge */}
                    <div className="absolute top-2 left-2 bg-black/40 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm">
                      #{banner.order_index}
                    </div>

                    {/* Active indicator */}
                    <button
                      onClick={() => handleToggle(banner)}
                      className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-lg transition ${
                        banner.is_active
                          ? 'bg-emerald-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {banner.is_active ? '● ACTIVE' : '● INACTIVE'}
                    </button>
                  </div>

                  {/* Info + Actions */}
                  <div className="p-4">
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        ID
                      </p>
                      <p className="text-xs font-mono text-slate-700">
                        {banner.id}
                      </p>
                    </div>

                    {(banner.cta_text || banner.cta_link) && (
                      <div className="mb-3 text-xs">
                        {banner.cta_text && (
                          <span className="inline-block bg-pink-50 text-pink-700 px-2 py-1 rounded-md font-bold mr-1">
                            {banner.cta_text}
                          </span>
                        )}
                        {banner.cta_link && (
                          <span className="text-slate-500 font-mono">
                            {banner.cta_link}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Order buttons */}
                      <button
                        onClick={() => handleMoveOrder(banner, 'up')}
                        disabled={idx === 0}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-xs transition"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveOrder(banner, 'down')}
                        disabled={idx === filteredBanners.length - 1}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-xs transition"
                        title="Move down"
                      >
                        ↓
                      </button>

                      <div className="flex-1"></div>

                      {/* Edit */}
                      <button
                        onClick={() => handleEdit(banner)}
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition"
                      >
                        ✏️ Edit
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(banner)}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============ MODAL ============ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {editing ? '✏️ Edit Banner' : '➕ Add New Banner'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditing(null);
                  setForm(emptyForm);
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Banner Type *
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-sm"
                >
                  <option value="hero">✨ Hero (main carousel)</option>
                  <option value="offer">📢 Offer Strip (thin)</option>
                  <option value="promo">🎉 Promo (full-width)</option>
                  <option value="category">📁 Category</option>
                  <option value="section">📊 Product Section</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="GLOW UP SALE"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-sm"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm({ ...form, subtitle: e.target.value })
                  }
                  placeholder="Up to 60% off on premium beauty"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-sm"
                />
              </div>

              {/* Emoji + Image */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={form.emoji}
                    onChange={(e) =>
                      setForm({ ...form, emoji: e.target.value })
                    }
                    placeholder="✨"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-sm text-center text-2xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Image URL (optional)
                  </label>
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e) =>
                      setForm({ ...form, image: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    CTA Text
                  </label>
                  <input
                    type="text"
                    value={form.ctaText}
                    onChange={(e) =>
                      setForm({ ...form, ctaText: e.target.value })
                    }
                    placeholder="Shop Now"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    CTA Link
                  </label>
                  <input
                    type="text"
                    value={form.ctaLink}
                    onChange={(e) =>
                      setForm({ ...form, ctaLink: e.target.value })
                    }
                    placeholder="/shop?sale=glowup"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Gradient Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Gradient Start
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.gradientStart}
                      onChange={(e) =>
                        setForm({ ...form, gradientStart: e.target.value })
                      }
                      className="w-12 h-12 rounded-lg border-2 border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.gradientStart}
                      onChange={(e) =>
                        setForm({ ...form, gradientStart: e.target.value })
                      }
                      className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Gradient End
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.gradientEnd}
                      onChange={(e) =>
                        setForm({ ...form, gradientEnd: e.target.value })
                      }
                      className="w-12 h-12 rounded-lg border-2 border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.gradientEnd}
                      onChange={(e) =>
                        setForm({ ...form, gradientEnd: e.target.value })
                      }
                      className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              {(form.title || form.emoji) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Preview
                  </label>
                  <div
                    className="rounded-2xl p-6 flex items-center justify-between h-32"
                    style={{
                      background: `linear-gradient(135deg, ${form.gradientStart}, ${form.gradientEnd})`,
                    }}
                  >
                    <div>
                      {form.type && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-1">
                          {form.type}
                        </p>
                      )}
                      <p className="text-white font-bold text-lg leading-tight">
                        {form.title || 'Title here'}
                      </p>
                      {form.subtitle && (
                        <p className="text-white/90 text-xs mt-1">
                          {form.subtitle}
                        </p>
                      )}
                    </div>
                    {form.emoji && (
                      <div className="text-6xl">{form.emoji}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Order + Active */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Order Index
                  </label>
                  <input
                    type="number"
                    value={form.orderIndex}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        orderIndex: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Status
                  </label>
                  <button
                    onClick={() =>
                      setForm({ ...form, isActive: !form.isActive })
                    }
                    className={`w-full px-4 py-3 rounded-xl font-bold text-sm transition ${
                      form.isActive
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {form.isActive ? '● ACTIVE' : '○ INACTIVE'}
                  </button>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Start Date (optional)
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditing(null);
                  setForm(emptyForm);
                }}
                className="px-6 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 transition flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    {editing ? 'Update Banner' : 'Create Banner'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAppBanners;
