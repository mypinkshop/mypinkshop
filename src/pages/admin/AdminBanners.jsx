// src/pages/admin/AdminBanners.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SearchableSelect from '../../components/SearchableSelect';
import BannerRenderer from '../../components/BannerRenderer';

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const SIZE_OPTIONS = [
  { value: 'small',  label: 'Small',  hint: '300×200' },
  { value: 'medium', label: 'Medium', hint: '600×300' },
  { value: 'large',  label: 'Large',  hint: '1200×400' },
  { value: 'xl',     label: 'XL',     hint: '1600×500' },
  { value: 'full',   label: 'Full',   hint: '1920×600' },
];

const STYLE_OPTIONS = [
  { value: 'single',  label: 'Single',  hint: 'Ek banner full width' },
  { value: 'slide',   label: 'Slide',   hint: 'Multiple rotate' },
  { value: 'split',   label: 'Split',   hint: 'Text left + Image right' },
  { value: 'overlay', label: 'Overlay', hint: 'Image pe text' },
  { value: 'grid',    label: 'Grid',    hint: '2-4 side by side' },
];

const POSITION_OPTIONS = [
  { value: 'home_hero',       label: '🏠 Home Hero' },
  { value: 'category_hero',   label: '🎯 Category Hero' },
  { value: 'category_mid_1',  label: '📢 Mid 1' },
  { value: 'category_mid_2',  label: '📢 Mid 2' },
  { value: 'category_mid_3',  label: '📢 Mid 3' },
  { value: 'category_bottom', label: '⬇️ Bottom' },
];

const LINK_TYPE_OPTIONS = [
  { value: 'category',    label: '📂 Category' },
  { value: 'subcategory', label: '📁 Subcategory' },
  { value: 'brand',       label: '🏷️ Brand' },
  { value: 'product',     label: '🛍️ Specific Product' },
  { value: 'custom',      label: '🔗 Custom URL' },
];

const SIZE_GUIDE = {
  home_hero:       { size: 'full',   style: 'slide',   px: '1920×600', ratio: '16:5' },
  category_hero:   { size: 'xl',     style: 'single',  px: '1600×500', ratio: '16:5' },
  category_mid_1:  { size: 'large',  style: 'split',   px: '1200×400', ratio: '3:1' },
  category_mid_2:  { size: 'large',  style: 'grid',    px: '1200×400', ratio: '3:1' },
  category_mid_3:  { size: 'large',  style: 'slide',   px: '1200×400', ratio: '3:1' },
  category_bottom: { size: 'xl',     style: 'overlay', px: '1600×500', ratio: '16:5' },
};

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'https://api.mypinkshop.com/api';

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

function AdminBanners() {
  const navigate = useNavigate();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dropdown data
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    buttonText: '',
    images: [],
    order: 1,
    active: true,
    showTextOverlay: true,
    category: '',
    position: 'home_hero',
    size: 'large',
    display_style: 'single',
    link_type: 'custom',
    link: '/shop',
  });

  const [imagePreviews, setImagePreviews] = useState([]);

  /* ------------------------- Auth + Load ------------------------- */

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadBanners();
    loadDropdownData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/banners/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      const data = await res.json();
      setBanners(Array.isArray(data) ? data.sort((a, b) => a.order - b.order) : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      const [brandsRes, productsRes, catRes] = await Promise.allSettled([
        fetch(`${API_BASE}/brands`).then((r) => r.json()),
        fetch(`${API_BASE}/products?limit=200`).then((r) => r.json()),
        fetch(`${API_BASE}/categories/tree`).then((r) => r.json()),
      ]);

      // Brands
      if (brandsRes.status === 'fulfilled') {
        const b = brandsRes.value;
        setBrands(Array.isArray(b) ? b.map((x) => (typeof x === 'string' ? x : x.name)).filter(Boolean) : []);
      }

      // Products
      if (productsRes.status === 'fulfilled') {
        const p = productsRes.value;
        const list = Array.isArray(p) ? p : p.products || [];
        setProducts(list);
      }

      // Categories + Subcategories
      if (catRes.status === 'fulfilled') {
        const tree = catRes.value;
        const list = Array.isArray(tree) ? tree : tree.categories || [];
        setCategories(list.map((c) => ({ value: c.slug || c.id, label: c.name })));

        const subs = [];
        list.forEach((c) => {
          (c.children || []).forEach((sub) => {
            subs.push({ value: sub.slug || sub.id, label: `${c.name} › ${sub.name}` });
          });
        });
        setSubcategories(subs);
      }
    } catch (err) {
      console.error('Dropdown load error:', err);
    }
  };

  /* ------------------------- Save / Delete ------------------------- */

  const saveBannerToAPI = async (data, isEdit) => {
    const token = localStorage.getItem('adminToken');
    const form = new FormData();

    ['title', 'subtitle', 'buttonText', 'link', 'category', 'position', 'size', 'display_style', 'link_type'].forEach((k) => {
      form.append(k, data[k] || '');
    });
    form.append('order', data.order);
    form.append('active', data.active);
    form.append('showTextOverlay', data.showTextOverlay);

    if (data.images?.length) {
      data.images.forEach((img) => {
        if (img instanceof File) form.append('images', img);
      });
    }

    const url = isEdit
      ? `${API_BASE}/banners/${editingBanner._id || editingBanner.id}`
      : `${API_BASE}/banners/create`;

    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      body: form,
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Save failed');
    return json;
  };

  const deleteBanner = async (id) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/banners/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Delete failed');
  };

  const toggleActive = async (id, current) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/banners/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !current }),
    });
    if (res.ok) {
      await loadBanners();
      toast.success(`Banner ${!current ? 'activated' : 'deactivated'}`);
    }
  };

  /* ------------------------- Image handling ------------------------- */

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (files.length > 6) return toast.error('Max 6 images');
    if (files.reduce((s, f) => s + f.size, 0) > 5 * 1024 * 1024) {
      return toast.error('Total size < 5MB');
    }
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
    setFormData((p) => ({ ...p, images: files }));
  };

  const removeImage = (i) => {
    const imgs = [...formData.images];
    const prev = [...imagePreviews];
    imgs.splice(i, 1);
    prev.splice(i, 1);
    setFormData((p) => ({ ...p, images: imgs }));
    setImagePreviews(prev);
  };

  /* ------------------------- Link generation ------------------------- */

  const generateLink = () => {
    const { link_type, link } = formData;
    if (link_type === 'custom') return link || '';
    return link || '';
  };

  const copyLink = () => {
    const full = `${window.location.origin}${generateLink()}`;
    navigator.clipboard.writeText(full);
    toast.success('Link copied!');
  };

  const testLink = () => {
    const link = generateLink();
    if (!link) return toast.error('No link generated');
    window.open(link, '_blank');
  };

  /* ------------------------- Form submit ------------------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title && !formData.images.length) {
      return toast.error('Title ya image required');
    }
    if (!generateLink()) {
      return toast.error('Link generate nahi hua');
    }

    setUploading(true);
    try {
      // Final link set karo
      const payload = { ...formData, link: generateLink() };
      if (editingBanner) {
        await saveBannerToAPI(payload, true);
        toast.success('✅ Banner updated');
      } else {
        await saveBannerToAPI(payload, false);
        toast.success('✅ Banner published');
      }
      await loadBanners();
      resetForm();
    } catch (err) {
      toast.error('❌ ' + err.message);
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
      images: [],
      order: banners.length + 1,
      active: true,
      showTextOverlay: true,
      category: '',
      position: 'home_hero',
      size: 'large',
      display_style: 'single',
      link_type: 'custom',
      link: '/shop',
    });
    setImagePreviews([]);
  };

  const handleEdit = (b) => {
    setEditingBanner(b);
    setFormData({
      title: b.title || '',
      subtitle: b.subtitle || '',
      buttonText: b.buttonText || '',
      images: [],
      order: b.order || 1,
      active: b.active !== false,
      showTextOverlay: b.showTextOverlay !== false,
      category: b.category || '',
      position: b.position || 'home_hero',
      size: b.size || 'large',
      display_style: b.display_style || 'single',
      link_type: b.link_type || 'custom',
      link: b.link || '/shop',
    });
    setImagePreviews(b.images || []);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await deleteBanner(id);
      toast.success('Deleted');
      await loadBanners();
      if (editingBanner?._id === id || editingBanner?.id === id) resetForm();
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ------------------------- Auto-suggest on position change ------------------------- */

  const applySizeGuide = (position) => {
    const guide = SIZE_GUIDE[position];
    if (!guide) return;
    setFormData((p) => ({
      ...p,
      position,
      size: guide.size,
      display_style: guide.style,
    }));
  };

  /* ------------------------- Preview banner ------------------------- */

  const previewBanner = useMemo(
    () => ({
      ...formData,
      images: imagePreviews.length ? imagePreviews : formData.images,
    }),
    [formData, imagePreviews]
  );

  /* ------------------------- Render ------------------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const isMobilePreview = previewMode === 'mobile';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow z-50 px-4 py-3 flex justify-between">
        <h1 className="text-lg font-bold text-pink-600">Banner Manager</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>☰</button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 w-56 bg-white shadow-xl h-full p-6">
        <h2 className="text-xl font-bold text-pink-600 mb-8">MyPinkShop</h2>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="w-full text-left px-4 py-2 rounded-lg hover:bg-pink-50 mb-2"
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('adminToken');
            navigate('/admin/login');
          }}
          className="w-full text-left px-4 py-2 rounded-lg text-red-600 hover:bg-red-50"
        >
          🚪 Logout
        </button>
      </div>

      <div className="lg:ml-56 pt-16 lg:pt-8">
        <div className="max-w-[1600px] mx-auto p-4 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">🎨 Banner Manager</h1>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* ============================ FORM ============================ */}
            <div className="xl:col-span-2 bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">
                  {editingBanner ? '✏️ Edit Banner' : '✨ Create Banner'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {/* Title / Subtitle / Button */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Images (max 6)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="w-full text-sm border border-dashed border-gray-300 rounded-xl p-3 cursor-pointer"
                  />
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="relative group">
                          <img src={src} className="h-20 w-full object-cover rounded-lg" alt="" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ============ SIZE ============ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📐 Size</label>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_OPTIONS.map((s) => (
                      <label
                        key={s.value}
                        className={`cursor-pointer px-4 py-2 rounded-xl border-2 text-sm font-medium transition ${
                          formData.size === s.value
                            ? 'border-pink-500 bg-pink-50 text-pink-600'
                            : 'border-gray-200 hover:border-pink-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="size"
                          value={s.value}
                          checked={formData.size === s.value}
                          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                          className="sr-only"
                        />
                        {s.label}
                        <span className="text-xs opacity-60 ml-1">({s.hint})</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* ============ STYLE ============ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎨 Display Style</label>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map((s) => (
                      <label
                        key={s.value}
                        className={`cursor-pointer px-4 py-2 rounded-xl border-2 text-sm font-medium transition ${
                          formData.display_style === s.value
                            ? 'border-pink-500 bg-pink-50 text-pink-600'
                            : 'border-gray-200 hover:border-pink-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="style"
                          value={s.value}
                          checked={formData.display_style === s.value}
                          onChange={(e) => setFormData({ ...formData, display_style: e.target.value })}
                          className="sr-only"
                        />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* ============ POSITION + CATEGORY ============ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">📍 Position</label>
                    <select
                      value={formData.position}
                      onChange={(e) => applySizeGuide(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      {POSITION_OPTIONS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    {SIZE_GUIDE[formData.position] && (
                      <p className="text-xs text-gray-500 mt-1">
                        📏 Recommended: {SIZE_GUIDE[formData.position].px} ({SIZE_GUIDE[formData.position].ratio})
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">📂 Category (optional)</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="">🌐 Global (all pages)</option>
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ============ LINK TYPE ============ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🔗 Link Type</label>
                  <div className="flex flex-wrap gap-2">
                    {LINK_TYPE_OPTIONS.map((l) => (
                      <label
                        key={l.value}
                        className={`cursor-pointer px-3 py-2 rounded-xl border-2 text-sm transition ${
                          formData.link_type === l.value
                            ? 'border-pink-500 bg-pink-50 text-pink-600'
                            : 'border-gray-200 hover:border-pink-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="link_type"
                          value={l.value}
                          checked={formData.link_type === l.value}
                          onChange={(e) => {
                            setFormData({ ...formData, link_type: e.target.value, link: '' });
                          }}
                          className="sr-only"
                        />
                        {l.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* ============ LINK VALUE ============ */}
                {formData.link_type === 'category' && (
                  <SearchableSelect
                    label="Category"
                    options={categories}
                    value={formData.link}
                    onChange={(v) => setFormData({ ...formData, link: `/category/${v}` })}
                    placeholder="Search category..."
                  />
                )}

                {formData.link_type === 'subcategory' && (
                  <SearchableSelect
                    label="Subcategory"
                    options={subcategories}
                    value={formData.link}
                    onChange={(v) => setFormData({ ...formData, link: `/category/${v}` })}
                    placeholder="Search subcategory..."
                  />
                )}

                {formData.link_type === 'brand' && (
                  <SearchableSelect
                    label="Brand"
                    options={brands}
                    value={formData.link.replace('/brand/', '')}
                    onChange={(v) => setFormData({ ...formData, link: `/brand/${slugify(v)}` })}
                    placeholder="Search brand..."
                    allowCustom
                  />
                )}

                {formData.link_type === 'product' && (
                  <SearchableSelect
                    label="Product"
                    options={products.map((p) => ({
                      value: p.id || p._id,
                      label: `${p.title || p.name} ${p.sku ? `(${p.sku})` : ''}`,
                    }))}
                    value={formData.link.replace('/product/', '')}
                    onChange={(v) => setFormData({ ...formData, link: `/product/${v}` })}
                    placeholder="Search product (title/SKU)..."
                  />
                )}

                {formData.link_type === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom URL</label>
                    <input
                      type="text"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="/shop or https://..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                )}

                {/* ============ GENERATED LINK ============ */}
                {generateLink() && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <p className="text-xs text-green-700 mb-1">✅ Generated Link:</p>
                    <p className="text-sm font-mono text-green-800 break-all mb-2">{generateLink()}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={copyLink} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        📋 Copy
                      </button>
                      <button type="button" onClick={testLink} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        🔗 Test
                      </button>
                    </div>
                  </div>
                )}

                {/* ============ ORDER + ACTIVE ============ */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2 pt-6">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="w-4 h-4 accent-pink-500"
                      />
                      Active
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.showTextOverlay}
                        onChange={(e) => setFormData({ ...formData, showTextOverlay: e.target.checked })}
                        className="w-4 h-4 accent-pink-500"
                      />
                      Show text overlay
                    </label>
                  </div>
                </div>

                {/* ============ ACTIONS ============ */}
                <div className="flex gap-3 pt-3 border-t">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                  >
                    {uploading ? 'Publishing...' : editingBanner ? '✏️ Update' : '🚀 Publish'}
                  </button>
                  {editingBanner && (
                    <button type="button" onClick={resetForm} className="px-6 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* ============================ LIVE PREVIEW ============================ */}
            <div className="xl:col-span-1">
              <div className="sticky top-6 bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 flex items-center justify-between">
                  <h2 className="text-white font-semibold">👁️ Live Preview</h2>
                  <div className="flex gap-1 bg-white/20 rounded-lg p-1">
                    <button
                      onClick={() => setPreviewMode('desktop')}
                      className={`px-2 py-1 text-xs rounded ${previewMode === 'desktop' ? 'bg-white text-purple-600' : 'text-white'}`}
                    >
                      🖥️
                    </button>
                    <button
                      onClick={() => setPreviewMode('mobile')}
                      className={`px-2 py-1 text-xs rounded ${previewMode === 'mobile' ? 'bg-white text-purple-600' : 'text-white'}`}
                    >
                      📱
                    </button>
                  </div>
                </div>

                <div className={`p-4 bg-gray-50 transition-all ${isMobilePreview ? 'max-w-[375px] mx-auto' : ''}`}>
                  {generateLink() ? (
                    <BannerRenderer
                      banners={previewBanner}
                      size={formData.size}
                      style={formData.display_style}
                    />
                  ) : (
                    <div className="h-40 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                      Select link type to preview
                    </div>
                  )}
                </div>

                <div className="px-4 pb-4 text-xs text-gray-500 space-y-1">
                  <p>📐 Size: <b>{formData.size}</b></p>
                  <p>🎨 Style: <b>{formData.display_style}</b></p>
                  <p>📍 Position: <b>{formData.position}</b></p>
                  <p>🔗 Link: <b className="break-all">{generateLink() || '—'}</b></p>
                </div>
              </div>
            </div>
          </div>

          {/* ============================ BANNERS LIST ============================ */}
          <div className="mt-8 bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-4">
              <h2 className="text-white font-semibold">📸 All Banners ({banners.length})</h2>
            </div>
            <div className="p-6">
              {banners.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No banners yet</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {banners.map((b) => (
                    <div key={b._id || b.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition">
                      {b.images?.[0] ? (
                        <img src={b.images[0]} alt="" className="w-full h-32 object-cover" />
                      ) : (
                        <div className="w-full h-32 bg-pink-100 flex items-center justify-center text-3xl">🖼️</div>
                      )}
                      <div className="p-3">
                        <h3 className="font-semibold text-sm truncate">{b.title || 'Untitled'}</h3>
                        <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                          <span className="bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded">
                            {b.size || 'large'}
                          </span>
                          <span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                            {b.display_style || 'single'}
                          </span>
                          <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                            {b.position || 'home_hero'}
                          </span>
                          {b.active ? (
                            <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded">Active</span>
                          ) : (
                            <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Inactive</span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2 text-xs">
                          <button onClick={() => handleEdit(b)} className="text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => toggleActive(b._id || b.id, b.active)} className="text-gray-600 hover:underline">
                            {b.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDelete(b._id || b.id)} className="text-red-600 hover:underline">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Helper */
function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default AdminBanners;
