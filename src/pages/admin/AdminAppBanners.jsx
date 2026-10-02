// AdminAppBanners.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminSidebar from './components/AdminSidebar';

// ✅ Sab possible positions (checkbox ke liye)
const POSITION_OPTIONS = [
  { value: 'hero', label: '🎯 Hero Carousel (top)', group: 'Top' },
  { value: 'after_trending', label: '📢 After Trending Section', group: 'Home' },
  { value: 'after_category_skincare', label: '📢 After Skincare', group: 'Categories' },
  { value: 'after_category_makeup', label: '📢 After Makeup', group: 'Categories' },
  { value: 'after_category_hair', label: '📢 After Haircare', group: 'Categories' },
  { value: 'after_category_fashion', label: '📢 After Fashion', group: 'Categories' },
  { value: 'after_category_accessories', label: '📢 After Accessories', group: 'Categories' },
  { value: 'after_category_home', label: '📢 After Home & Kitchen', group: 'Categories' },
  { value: 'after_category_health', label: '📢 After Health & Wellness', group: 'Categories' },
  { value: 'after_category_electronics', label: '📢 After Electronics', group: 'Categories' },
  { value: 'after_category_books', label: '📢 After Books & Stationery', group: 'Categories' },
  { value: 'between_categories', label: '📢 Between Categories', group: 'Middle' },
  { value: 'bottom', label: '📢 Page Bottom', group: 'Bottom' },
  { value: 'empty', label: '⛔ Empty (disabled)', group: 'Other' },
];

function AdminAppBanners() {
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const fileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';
  const getToken = () => localStorage.getItem('adminToken');

  // ============ FORM STATE ============
  const emptyForm = {
    type: 'hero',
    position: 'hero',           // ✅ Single position (dropdown)
    positions: ['hero'],        // ✅ Multiple positions (checkbox)
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
    textSize: 'medium',
    textWeight: 'bold',
    textOpacity: 1.0,
    textPosition: 'center-left',
    textShadow: 0,
    imagePosition: 'right',
    imageSize: 'medium',
    layout: 'gradient',
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

  // ============ IMAGE UPLOAD ============
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('images', file);

      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const url = data.data?.url || data.url;
        setForm({ ...form, image: url });
        toast.success('Image uploaded!');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during upload');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setForm({ ...form, image: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ============ OPEN MODAL ============
  const handleAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, orderIndex: banners.length + 1 });
    setShowModal(true);
  };

  const handleEdit = (banner) => {
    setEditing(banner);
    // Parse positions — agar array hai to, warna single position
    let positions = ['hero'];
    if (Array.isArray(banner.positions)) {
      positions = banner.positions;
    } else if (banner.position) {
      positions = [banner.position];
    }

    setForm({
      type: banner.type || 'hero',
      position: banner.position || 'hero',
      positions: positions,
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
      textSize: banner.text_size || 'medium',
      textWeight: banner.text_weight || 'bold',
      textOpacity: banner.text_opacity ?? 1.0,
      textPosition: banner.text_position || 'center-left',
      textShadow: banner.text_shadow ?? 0,
      imagePosition: banner.image_position || 'right',
      imageSize: banner.image_size || 'medium',
      layout: banner.layout || 'gradient',
    });
    setShowModal(true);
  };

  // ============ TOGGLE POSITION CHECKBOX ============
  const togglePosition = (posValue) => {
    setForm((prev) => {
      const current = prev.positions || [];
      const isSelected = current.includes(posValue);
      const updated = isSelected
        ? current.filter((p) => p !== posValue)
        : [...current, posValue];
      return { ...prev, positions: updated };
    });
  };

  // ============ SAVE ============
  const handleSave = async () => {
    if (!form.title && !form.image) {
      toast.error('Title or image is required');
      return;
    }

    if (!form.positions || form.positions.length === 0) {
      toast.error('Please select at least one position');
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      const url = editing
        ? `${API_URL}/api/app-banners/${editing.id}`
        : `${API_URL}/api/app-banners`;
      const method = editing ? 'PUT' : 'POST';

      // ✅ Multiple positions ke liye alag rows create karo
      const positions = form.positions || ['hero'];

      const responses = await Promise.all(
        positions.map((pos) =>
          fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...form,
              position: pos,
              positions: undefined,  // Not needed in backend
            }),
          })
        )
      );

      const allOk = responses.every((r) => r.ok);

      if (allOk) {
        toast.success(
          editing
            ? `Banner updated in ${positions.length} position(s)!`
            : `Banner created in ${positions.length} position(s)!`
        );
        setShowModal(false);
        setForm(emptyForm);
        setEditing(null);
        loadBanners();
      } else {
        toast.error('Failed to save (some positions failed)');
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

    setBanners(newOrder.map((b, i) => ({ ...b, order_index: i + 1 })));

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

  // ============ HELPERS ============
  const getTextSizeClass = (size) => {
    switch (size) {
      case 'small': return 'text-sm';
      case 'large': return 'text-2xl';
      case 'xlarge': return 'text-3xl';
      case 'medium':
      default: return 'text-lg';
    }
  };

  const getTextWeightClass = (weight) => {
    switch (weight) {
      case 'regular': return 'font-normal';
      case 'black': return 'font-black';
      case 'bold':
      default: return 'font-bold';
    }
  };

  const getPositionClasses = (pos) => {
    const map = {
      'top-left': 'items-start justify-start text-left',
      'top-center': 'items-start justify-center text-center',
      'top-right': 'items-start justify-end text-right',
      'center-left': 'items-center justify-start text-left',
      'center': 'items-center justify-center text-center',
      'center-right': 'items-center justify-end text-right',
      'bottom-left': 'items-end justify-start text-left',
      'bottom-center': 'items-end justify-center text-center',
      'bottom-right': 'items-end justify-end text-right',
    };
    return map[pos] || map['center-left'];
  };

  const getPositionLabel = (pos) => {
    return POSITION_OPTIONS.find((p) => p.value === pos)?.label || pos;
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

  // Group positions for UI
  const positionGroups = POSITION_OPTIONS.reduce((acc, pos) => {
    if (!acc[pos.group]) acc[pos.group] = [];
    acc[pos.group].push(pos);
    return acc;
  }, {});

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
        {/* HEADER */}
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
                  Manage banners + display positions for the mobile app
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
          {/* STATS */}
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

          {/* BANNERS GRID */}
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
                    {banner.image && banner.image_position === 'background' && (
                      <img
                        src={banner.image}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                      />
                    )}

                    <div
                      className={`absolute inset-0 flex p-6 ${
                        banner.image_position === 'left'
                          ? 'flex-row-reverse'
                          : 'flex-row'
                      } ${getPositionClasses(banner.text_position || 'center-left')}`}
                    >
                      {banner.image && banner.image_position === 'left' && (
                        <img
                          src={banner.image}
                          alt=""
                          className="h-24 w-24 object-cover rounded-lg shadow-lg mr-3"
                        />
                      )}

                      <div
                        className="flex-1"
                        style={{
                          color: banner.text_color || '#FFFFFF',
                          opacity: banner.text_opacity ?? 1.0,
                          textShadow: banner.text_shadow
                            ? '0 2px 4px rgba(0,0,0,0.3)'
                            : 'none',
                        }}
                      >
                        <p
                          className={`text-[10px] uppercase tracking-wider mb-1 ${getTextWeightClass(
                            banner.text_weight
                          )}`}
                          style={{ opacity: 0.85 }}
                        >
                          {banner.type}
                        </p>
                        <p
                          className={`${getTextSizeClass(
                            banner.text_size
                          )} leading-tight mb-1 ${getTextWeightClass(
                            banner.text_weight
                          )}`}
                        >
                          {banner.title}
                        </p>
                        {banner.subtitle && (
                          <p className="text-xs" style={{ opacity: 0.9 }}>
                            {banner.subtitle}
                          </p>
                        )}
                      </div>

                      {banner.image && banner.image_position === 'right' && (
                        <img
                          src={banner.image}
                          alt=""
                          className="h-24 w-24 object-cover rounded-lg shadow-lg ml-3"
                        />
                      )}

                      {!banner.image && banner.emoji && (
                        <div className="text-6xl opacity-90">
                          {banner.emoji}
                        </div>
                      )}
                    </div>

                    <div className="absolute top-2 left-2 bg-black/40 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm z-10">
                      #{banner.order_index}
                    </div>

                    <button
                      onClick={() => handleToggle(banner)}
                      className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-lg transition z-10 ${
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

                    {/* ✅ Position badges */}
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Position
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(banner.positions) ? (
                          banner.positions.map((p) => (
                            <span
                              key={p}
                              className="inline-block bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold"
                            >
                              {getPositionLabel(p).split(' ').slice(1).join(' ')}
                            </span>
                          ))
                        ) : (
                          <span className="inline-block bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            {getPositionLabel(banner.position || 'hero')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Color swatches */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Colors:
                      </span>
                      <div
                        className="w-5 h-5 rounded border border-slate-200"
                        style={{ background: banner.gradient_start || '#EC4899' }}
                      />
                      <div
                        className="w-5 h-5 rounded border border-slate-200"
                        style={{ background: banner.gradient_end || '#F43F5E' }}
                      />
                      <div
                        className="w-5 h-5 rounded border border-slate-200"
                        style={{ background: banner.text_color || '#FFFFFF' }}
                      />
                    </div>

                    {(banner.cta_text || banner.cta_link) && (
                      <div className="mb-3 text-xs">
                        {banner.cta_text && (
                          <span className="inline-block bg-pink-50 text-pink-700 px-2 py-1 rounded-md font-bold mr-1">
                            {banner.cta_text}
                          </span>
                        )}
                        {banner.cta_link && (
                          <span className="text-slate-500 font-mono truncate">
                            {banner.cta_link}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMoveOrder(banner, 'up')}
                        disabled={idx === 0}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-xs transition"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveOrder(banner, 'down')}
                        disabled={idx === filteredBanners.length - 1}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-xs transition"
                      >
                        ↓
                      </button>

                      <div className="flex-1"></div>

                      <button
                        onClick={() => handleEdit(banner)}
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition"
                      >
                        ✏️ Edit
                      </button>
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

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
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

            {/* Form — 2 Columns */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT — Form */}
              <div className="space-y-4">
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

                {/* ✅ MULTIPLE POSITIONS — Checkboxes */}
                <div className="border-2 border-pink-200 bg-pink-50/30 rounded-xl p-4">
                  <label className="block text-xs font-bold text-slate-700 mb-3 uppercase">
                    📍 Display Positions * (select multiple)
                  </label>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {Object.entries(positionGroups).map(([group, positions]) => (
                      <div key={group}>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
                          {group}
                        </p>
                        <div className="space-y-1.5">
                          {positions.map((pos) => {
                            const checked = (form.positions || []).includes(
                              pos.value
                            );
                            return (
                              <label
                                key={pos.value}
                                className="flex items-center gap-2 cursor-pointer hover:bg-white/50 p-1.5 rounded-lg transition"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePosition(pos.value)}
                                  className="w-4 h-4 accent-pink-500 cursor-pointer"
                                />
                                <span className="text-xs font-semibold text-slate-700">
                                  {pos.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selected count */}
                  <p className="text-[10px] font-bold text-pink-600 mt-3">
                    ✓ {(form.positions || []).length} position(s) selected
                  </p>
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

                {/* Emoji */}
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

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Banner Image
                  </label>

                  {form.image ? (
                    <div className="relative rounded-xl overflow-hidden border-2 border-slate-200">
                      <img
                        src={form.image}
                        alt="Banner"
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-pink-500 hover:bg-pink-50/30 cursor-pointer transition"
                    >
                      {uploading ? (
                        <>
                          <span className="text-3xl animate-spin inline-block">⟳</span>
                          <p className="text-sm font-bold text-slate-700 mt-2">
                            Uploading...
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="text-4xl">📷</span>
                          <p className="text-sm font-bold text-slate-700 mt-2">
                            Click to upload image
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            PNG, JPG, WebP • Max 5MB
                          </p>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* CTA */}
                <div className="grid grid-cols-2 gap-3">
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
                      className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-sm"
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
                      placeholder="/shop"
                      className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                      Start
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="color"
                        value={form.gradientStart}
                        onChange={(e) =>
                          setForm({ ...form, gradientStart: e.target.value })
                        }
                        className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={form.gradientStart}
                        onChange={(e) =>
                          setForm({ ...form, gradientStart: e.target.value })
                        }
                        className="flex-1 px-2 py-2 border-2 border-slate-200 rounded-lg focus:border-pink-500 focus:outline-none text-[10px] font-mono min-w-0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                      End
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="color"
                        value={form.gradientEnd}
                        onChange={(e) =>
                          setForm({ ...form, gradientEnd: e.target.value })
                        }
                        className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={form.gradientEnd}
                        onChange={(e) =>
                          setForm({ ...form, gradientEnd: e.target.value })
                        }
                        className="flex-1 px-2 py-2 border-2 border-slate-200 rounded-lg focus:border-pink-500 focus:outline-none text-[10px] font-mono min-w-0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                      Text
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="color"
                        value={form.textColor}
                        onChange={(e) =>
                          setForm({ ...form, textColor: e.target.value })
                        }
                        className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={form.textColor}
                        onChange={(e) =>
                          setForm({ ...form, textColor: e.target.value })
                        }
                        className="flex-1 px-2 py-2 border-2 border-slate-200 rounded-lg focus:border-pink-500 focus:outline-none text-[10px] font-mono min-w-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Text Styling */}
                <div className="border-t-2 border-slate-100 pt-4">
                  <p className="text-xs font-bold text-slate-700 mb-3 uppercase">
                    📝 Text Styling
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                        Size
                      </label>
                      <select
                        value={form.textSize}
                        onChange={(e) =>
                          setForm({ ...form, textSize: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-pink-500 focus:outline-none text-xs"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="xlarge">Extra Large</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                        Weight
                      </label>
                      <select
                        value={form.textWeight}
                        onChange={(e) =>
                          setForm({ ...form, textWeight: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-pink-500 focus:outline-none text-xs"
                      >
                        <option value="regular">Regular</option>
                        <option value="bold">Bold</option>
                        <option value="black">Extra Bold</option>
                      </select>
                    </div>
                  </div>

                  {/* Text Position 3x3 */}
                  <div className="mt-3">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                      Position
                    </label>
                    <div className="grid grid-cols-3 gap-1 w-32">
                      {[
                        'top-left', 'top-center', 'top-right',
                        'center-left', 'center', 'center-right',
                        'bottom-left', 'bottom-center', 'bottom-right',
                      ].map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setForm({ ...form, textPosition: pos })}
                          className={`aspect-square rounded border-2 transition ${
                            form.textPosition === pos
                              ? 'bg-pink-500 border-pink-500'
                              : 'bg-white border-slate-200 hover:border-pink-300'
                          }`}
                          title={pos}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Opacity */}
                  <div className="mt-3">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                      Text Opacity: {Math.round(form.textOpacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={form.textOpacity}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          textOpacity: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-pink-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, textShadow: form.textShadow ? 0 : 1 })
                    }
                    className={`mt-3 w-full px-3 py-2 rounded-lg text-xs font-bold transition ${
                      form.textShadow
                        ? 'bg-pink-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {form.textShadow ? '● Text Shadow ON' : '○ Text Shadow OFF'}
                  </button>
                </div>

                {/* Image Styling */}
                <div className="border-t-2 border-slate-100 pt-4">
                  <p className="text-xs font-bold text-slate-700 mb-3 uppercase">
                    🖼️ Image Styling
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                        Position
                      </label>
                      <select
                        value={form.imagePosition}
                        onChange={(e) =>
                          setForm({ ...form, imagePosition: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-pink-500 focus:outline-none text-xs"
                      >
                        <option value="right">Right</option>
                        <option value="left">Left</option>
                        <option value="background">Background</option>
                        <option value="none">None (hide)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                        Size
                      </label>
                      <select
                        value={form.imageSize}
                        onChange={(e) =>
                          setForm({ ...form, imageSize: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-pink-500 focus:outline-none text-xs"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="full">Full</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Layout */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Layout
                  </label>
                  <select
                    value={form.layout}
                    onChange={(e) =>
                      setForm({ ...form, layout: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-sm"
                  >
                    <option value="gradient">🎨 Gradient (text on gradient)</option>
                    <option value="image-overlay">🖼️ Image Overlay (image with text on top)</option>
                    <option value="product-card">🛍️ Product Card (Amazon style)</option>
                  </select>
                </div>

                {/* Order + Active */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                      Order
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
                      type="button"
                      onClick={() =>
                        setForm({ ...form, isActive: !form.isActive })
                      }
                      className={`w-full px-4 py-3 rounded-xl font-bold text-xs transition ${
                        form.isActive
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {form.isActive ? '● ACTIVE' : '○ INACTIVE'}
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT — Live Preview */}
              <div className="lg:sticky lg:top-6 h-fit">
                <div className="bg-slate-900 rounded-3xl p-4 shadow-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-wider">
                    📱 Mobile Preview
                  </p>

                  <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
                    <div className="flex justify-center pt-2 pb-1 bg-slate-100">
                      <div className="w-16 h-4 bg-slate-900 rounded-full"></div>
                    </div>

                    <div
                      className="relative h-56 overflow-hidden"
                      style={{
                        background:
                          form.layout === 'gradient' || !form.image
                            ? `linear-gradient(135deg, ${form.gradientStart}, ${form.gradientEnd})`
                            : '#000',
                      }}
                    >
                      {form.image && form.imagePosition === 'background' && (
                        <img
                          src={form.image}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover opacity-50"
                        />
                      )}

                      <div
                        className={`absolute inset-0 p-5 flex ${
                          form.imagePosition === 'left'
                            ? 'flex-row-reverse'
                            : 'flex-row'
                        } ${getPositionClasses(form.textPosition)}`}
                      >
                        {form.image && form.imagePosition === 'left' && (
                          <img
                            src={form.image}
                            alt=""
                            className={`object-cover rounded-xl shadow-2xl mr-3 ${
                              form.imageSize === 'small'
                                ? 'h-16 w-16'
                                : form.imageSize === 'large'
                                ? 'h-32 w-32'
                                : 'h-24 w-24'
                            }`}
                          />
                        )}

                        <div
                          className="flex-1"
                          style={{
                            color: form.textColor,
                            opacity: form.textOpacity,
                            textShadow: form.textShadow
                              ? '0 2px 8px rgba(0,0,0,0.4)'
                              : 'none',
                          }}
                        >
                          <p
                            className={`text-[10px] uppercase tracking-wider mb-1 ${getTextWeightClass(
                              form.textWeight
                            )}`}
                            style={{ opacity: 0.85 }}
                          >
                            {form.type}
                          </p>
                          <p
                            className={`${getTextSizeClass(
                              form.textSize
                            )} leading-tight mb-1 ${getTextWeightClass(
                              form.textWeight
                            )}`}
                          >
                            {form.title || 'Your title here'}
                          </p>
                          {form.subtitle && (
                            <p className="text-xs" style={{ opacity: 0.9 }}>
                              {form.subtitle}
                            </p>
                          )}

                          {form.ctaText && (
                            <div className="mt-3">
                              <span
                                className="inline-block px-4 py-1.5 rounded-full text-xs font-bold"
                                style={{
                                  background: form.textColor,
                                  color: form.gradientStart,
                                }}
                              >
                                {form.ctaText}
                              </span>
                            </div>
                          )}
                        </div>

                        {form.image && form.imagePosition === 'right' && (
                          <img
                            src={form.image}
                            alt=""
                            className={`object-cover rounded-xl shadow-2xl ml-3 ${
                              form.imageSize === 'small'
                                ? 'h-16 w-16'
                                : form.imageSize === 'large'
                                ? 'h-32 w-32'
                                : 'h-24 w-24'
                            }`}
                          />
                        )}

                        {!form.image && form.emoji && (
                          <div className="text-6xl opacity-90">
                            {form.emoji}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50">
                      <div className="h-3 w-24 bg-slate-200 rounded mb-2"></div>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="aspect-square bg-slate-200 rounded-lg"
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-2xl">
                  <p className="text-[10px] font-bold text-pink-700 uppercase mb-2">
                    💡 Tips
                  </p>
                  <ul className="text-xs text-pink-600 space-y-1">
                    <li>• Multiple positions select kar sakte ho</li>
                    <li>• Same banner alag-alag jagah dikhega</li>
                    <li>• Image on right with text on left looks best</li>
                  </ul>
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
                disabled={saving || uploading}
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
