// src/pages/admin/AdminBrands.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'https://api.mypinkshop.com/api';

/* ------------------------------------------------------------------ */
/* Presets                                                            */
/* ------------------------------------------------------------------ */
const HIGHLIGHT_PRESETS = [
  { icon: '🌿', title: 'Natural', desc: 'Pure ingredients' },
  { icon: '🔬', title: 'Tested', desc: 'Clinically proven' },
  { icon: '💚', title: 'Cruelty-free', desc: 'No animal testing' },
  { icon: '🚚', title: 'Free Shipping', desc: 'On orders ₹999+' },
  { icon: '✨', title: 'Premium', desc: 'Luxury quality' },
  { icon: '🏆', title: 'Award-winning', desc: 'Recognized brand' },
  { icon: '♻️', title: 'Eco-friendly', desc: 'Sustainable' },
  { icon: '🇮🇳', title: 'Made in India', desc: 'Proudly Indian' },
];

const EMOJI_OPTIONS = [
  '🌿', '🔬', '💚', '🚚', '✨', '🏆', '♻️', '🇮🇳',
  '💎', '🌸', '⭐', '🔥', '🎁', '💯', '🌟', '🦋',
  '🌺', '🍃', '💝', '🎀',
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * ✅ Safe fetch with timeout + JSON parsing
 */
async function safeFetch(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);

    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        throw new Error('Server ne invalid JSON bheja');
      }
    } else {
      const text = await res.text().catch(() => '');
      // HTML error page ya plain text
      if (!res.ok) {
        throw new Error(
          `Server error (${res.status}): ${text.slice(0, 120) || 'No details'}`
        );
      }
    }

    return { res, data };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * ✅ Get user-friendly error message
 */
function getFriendlyError(err, defaultMsg = 'Kuch galat ho gaya') {
  if (!err) return defaultMsg;

  const msg = err.message || '';

  if (err.name === 'AbortError' || msg.includes('aborted')) {
    return 'Request timeout ho gayi. Internet check karo.';
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Network error — server se connect nahi ho paya.';
  }
  if (msg.includes('invalid JSON')) {
    return 'Server ne galat response bheja. Baad me try karo.';
  }
  if (msg.toLowerCase().includes('name is required')) {
    return 'Brand Name required hai';
  }
  if (msg.toLowerCase().includes('slug')) {
    return 'Slug required hai ya invalid hai';
  }
  if (msg.toLowerCase().includes('already exists')) {
    return 'Ye brand already exist karta hai (same name ya slug)';
  }
  if (msg.toLowerCase().includes('not found')) {
    return 'Brand nahi mila. Refresh karo.';
  }
  if (msg.toLowerCase().includes('unauthorized') || msg.includes('401')) {
    return 'Session expire ho gaya. Please login again.';
  }
  if (msg.toLowerCase().includes('forbidden') || msg.includes('403')) {
    return 'Aapko is action ki permission nahi hai';
  }

  return msg || defaultMsg;
}

/* ------------------------------------------------------------------ */
/* Main Component                                                     */
/* ------------------------------------------------------------------ */
function AdminBrands() {
  const navigate = useNavigate();

  /* ---------------------- State ---------------------- */
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [mobileTab, setMobileTab] = useState('list');
  const [previewMode, setPreviewMode] = useState('desktop');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [formData, setFormData] = useState(emptyForm());
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const fileLogoRef = useRef(null);
  const fileBannerRef = useRef(null);

  function emptyForm() {
    return {
      name: '',
      slug: '',
      tagline: '',
      description: '',
      logo: '',
      banner: '',
      highlights: [],
      offers: [],
      featured_products: [],
      active: true,
      is_featured: false,
      sort_order: 0,
    };
  }

  /* ---------------------- Handle token expiry ---------------------- */
  const handleAuthError = useCallback(() => {
    localStorage.removeItem('adminToken');
    toast.error('Session expire ho gaya. Please login again.');
    navigate('/admin/login');
  }, [navigate]);

  /* ---------------------- Load brands ---------------------- */
  const loadBrands = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        handleAuthError();
        return;
      }

      const { res, data } = await safeFetch(`${API_BASE}/brands/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        handleAuthError();
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || `Load failed (HTTP ${res.status})`);
      }

      if (data?.success) {
        setBrands(data.data || []);
      } else {
        throw new Error(data?.error || 'Brands load nahi ho paye');
      }
    } catch (err) {
      console.error('Load brands error:', err);
      toast.error(getFriendlyError(err, 'Brands load nahi ho paye'));
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadBrands();
  }, [loadBrands, navigate]);

  /* ---------------------- Filtered brands ---------------------- */
  const filteredBrands = useMemo(() => {
    let list = [...brands];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          (b.name || '').toLowerCase().includes(q) ||
          (b.slug || '').toLowerCase().includes(q)
      );
    }

    if (filter === 'active') list = list.filter((b) => b.active);
    if (filter === 'inactive') list = list.filter((b) => !b.active);
    if (filter === 'featured') list = list.filter((b) => b.is_featured);

    return list;
  }, [brands, search, filter]);

  /* ---------------------- Select brand ---------------------- */
  const handleSelectBrand = (brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name || '',
      slug: brand.slug || '',
      tagline: brand.tagline || '',
      description: brand.description || '',
      logo: brand.logo || '',
      banner: brand.banner || '',
      highlights: brand.highlights || [],
      offers: brand.offers || [],
      featured_products: brand.featured_products || [],
      active: brand.active !== false,
      is_featured: !!brand.is_featured,
      sort_order: brand.sort_order ?? 0,
    });
    setLogoPreview(brand.logo || '');
    setBannerPreview(brand.banner || '');
    setSlugManuallyEdited(true);
    setMobileTab('edit');
  };

  /* ---------------------- New brand ---------------------- */
  const handleNewBrand = () => {
    setEditingBrand(null);
    setFormData(emptyForm());
    setLogoPreview('');
    setBannerPreview('');
    setSlugManuallyEdited(false);
    setMobileTab('edit');
  };

  /* ---------------------- Auto slug ---------------------- */
  const handleNameChange = (value) => {
    setFormData((p) => ({
      ...p,
      name: value,
      slug: slugManuallyEdited ? p.slug : slugify(value),
    }));
  };

  /* ---------------------- Image upload ---------------------- */
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error('Logo 500KB se chhota hona chahiye');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result);
      setFormData((p) => ({ ...p, logo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error('Banner 1MB se chhota hona chahiye');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setBannerPreview(reader.result);
      setFormData((p) => ({ ...p, banner: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  /* ---------------------- Highlights ---------------------- */
  const addHighlight = (preset = null) => {
    if (formData.highlights.length >= 8) {
      toast.error('Max 8 highlights allowed hain');
      return;
    }
    const newItem = preset ? { ...preset } : { icon: '✨', title: '', desc: '' };
    setFormData((p) => ({ ...p, highlights: [...p.highlights, newItem] }));
  };

  const updateHighlight = (idx, field, value) => {
    setFormData((p) => {
      const highlights = [...p.highlights];
      highlights[idx] = { ...highlights[idx], [field]: value };
      return { ...p, highlights };
    });
  };

  const removeHighlight = (idx) => {
    setFormData((p) => ({
      ...p,
      highlights: p.highlights.filter((_, i) => i !== idx),
    }));
  };

  const moveHighlight = (idx, dir) => {
    setFormData((p) => {
      const highlights = [...p.highlights];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= highlights.length) return p;
      [highlights[idx], highlights[newIdx]] = [highlights[newIdx], highlights[idx]];
      return { ...p, highlights };
    });
  };

  /* ---------------------- Offers ---------------------- */
  const addOffer = () => {
    if (formData.offers.length >= 5) {
      toast.error('Max 5 offers allowed hain');
      return;
    }
    setFormData((p) => ({
      ...p,
      offers: [...p.offers, { title: '', code: '', description: '' }],
    }));
  };

  const updateOffer = (idx, field, value) => {
    setFormData((p) => {
      const offers = [...p.offers];
      offers[idx] = { ...offers[idx], [field]: value };
      return { ...p, offers };
    });
  };

  const removeOffer = (idx) => {
    setFormData((p) => ({
      ...p,
      offers: p.offers.filter((_, i) => i !== idx),
    }));
  };

  /* ---------------------- Save ---------------------- */
  const handleSave = async () => {
    // ✅ Field-level validation
    const missing = [];
    if (!formData.name?.trim()) missing.push('Brand Name');
    if (!formData.slug?.trim()) missing.push('Slug');

    if (missing.length > 0) {
      toast.error(`Ye fields required hain: ${missing.join(', ')}`, {
        duration: 4000,
      });
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        handleAuthError();
        return;
      }

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        tagline: formData.tagline || '',
        description: formData.description || '',
        logo: formData.logo || '',
        banner: formData.banner || '',
        highlights: JSON.stringify(formData.highlights || []),
        offers: JSON.stringify(formData.offers || []),
        featured_products: JSON.stringify(formData.featured_products || []),
        active: formData.active ? 'true' : 'false',
        is_featured: formData.is_featured ? 'true' : 'false',
        sort_order: String(formData.sort_order || 0),
      };

      const url = editingBrand
        ? `${API_BASE}/brands/${editingBrand.id}`
        : `${API_BASE}/brands`;

      const { res, data } = await safeFetch(url, {
        method: editingBrand ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // ✅ HTTP status specific messages
      if (res.status === 401) {
        handleAuthError();
        return;
      }
      if (res.status === 403) {
        throw new Error('Aapko is action ki permission nahi hai');
      }
      if (res.status === 409) {
        throw new Error(data?.error || 'Ye brand already exist karta hai (same name ya slug)');
      }
      if (res.status === 400) {
        throw new Error(data?.error || 'Kuch fields invalid hain. Please check karo.');
      }
      if (res.status >= 500) {
        throw new Error(data?.error || 'Server me problem hai. Baad me try karo.');
      }
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Save failed (HTTP ${res.status})`);
      }

      // ✅ Success
      toast.success(
        editingBrand ? '✅ Brand update ho gaya!' : '✅ Brand create ho gaya!',
        { duration: 3000 }
      );

      await loadBrands();

      if (!editingBrand && data.data) {
        handleSelectBrand(data.data);
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error(getFriendlyError(err, 'Save nahi ho paya'), { duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------- Delete ---------------------- */
  const handleDelete = async (brand) => {
    if (!window.confirm(`Delete "${brand.name}" permanently?`)) return;

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        handleAuthError();
        return;
      }

      const { res, data } = await safeFetch(`${API_BASE}/brands/${brand.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        handleAuthError();
        return;
      }

      if (res.status === 404) {
        toast.error('Brand nahi mila. Refresh kar rahe hain...');
        await loadBrands();
        return;
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Delete nahi ho paya');
      }

      toast.success('✅ Brand delete ho gaya');
      await loadBrands();
      if (editingBrand?.id === brand.id) handleNewBrand();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(getFriendlyError(err, 'Delete nahi ho paya'), { duration: 5000 });
    }
  };

  /* ---------------------- Quick toggle ---------------------- */
  const toggleField = async (brand, field) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        handleAuthError();
        return;
      }

      const { res, data } = await safeFetch(`${API_BASE}/brands/${brand.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: !brand[field] }),
      });

      if (res.status === 401) {
        handleAuthError();
        return;
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Update nahi ho paya');
      }

      const fieldName = field === 'active' ? 'Status' : 'Featured';
      const newVal = !brand[field];
      toast.success(
        `${fieldName} ${newVal ? 'enable' : 'disable'} ho gaya`,
        { duration: 2000 }
      );

      await loadBrands();
      if (editingBrand?.id === brand.id && data.data) {
        handleSelectBrand(data.data);
      }
    } catch (err) {
      console.error('Toggle error:', err);
      toast.error(getFriendlyError(err, 'Update nahi ho paya'), { duration: 4000 });
    }
  };

  /* ---------------------- Copy link ---------------------- */
  const copyLink = () => {
    if (!formData.slug) {
      toast.error('Pehle slug bharo');
      return;
    }
    const url = `${window.location.origin}/brand/${formData.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied! 📋');
  };

  const testLink = () => {
    if (!formData.slug) {
      toast.error('Pehle slug bharo');
      return;
    }
    window.open(`/brand/${formData.slug}`, '_blank');
  };

  /* ---------------------- Loading ---------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF7FA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading brands...</p>
        </div>
      </div>
    );
  }

  /* ---------------------- Render ---------------------- */
  return (
    <div className="min-h-screen bg-[#FFF7FA]">
      {/* Top Bar */}
      <div className="bg-white border-b border-pink-100 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-gray-500 hover:text-pink-600 transition-colors"
            >
              ←
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">
              🏷️ Brand Manager
            </h1>
            <span className="hidden sm:inline text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-full font-medium">
              {brands.length} brands
            </span>
          </div>

          <button
            onClick={handleNewBrand}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 sm:px-6 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg transition-all"
          >
            + Create Brand
          </button>
        </div>

        {/* Mobile tabs */}
        <div className="lg:hidden flex border-t border-pink-100">
          {[
            { id: 'list', label: '📋 List' },
            { id: 'edit', label: '✏️ Edit' },
            { id: 'preview', label: '👁️ Preview' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setMobileTab(t.id)}
              className={`flex-1 py-3 text-xs font-medium transition-colors ${
                mobileTab === t.id
                  ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50/50'
                  : 'text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_400px] gap-4 p-4 sm:p-6">
          {/* ==================== COLUMN 1: LIST ==================== */}
          <aside
            className={`${
              mobileTab === 'list' ? 'block' : 'hidden'
            } lg:block bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden lg:sticky lg:top-24 h-fit max-h-[calc(100vh-120px)] flex flex-col`}
          >
            <div className="p-4 border-b border-pink-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Search brands..."
                className="w-full border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />

              <div className="flex flex-wrap gap-1.5 mt-3">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'inactive', label: 'Inactive' },
                  { id: 'featured', label: '⭐ Featured' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                      filter === f.id
                        ? 'bg-pink-500 text-white'
                        : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {filteredBrands.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-2">🏷️</div>
                  <p className="text-gray-400 text-sm">No brands found</p>
                </div>
              ) : (
                filteredBrands.map((b) => {
                  const isActive = editingBrand?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => handleSelectBrand(b)}
                      className={`w-full text-left p-3 border-b border-pink-50 transition-colors flex items-center gap-3 ${
                        isActive
                          ? 'bg-pink-50 border-l-4 border-l-pink-500'
                          : 'hover:bg-pink-50/50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center shrink-0 overflow-hidden border border-pink-200">
                        {b.logo ? (
                          <img src={b.logo} alt={b.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-pink-500 font-bold text-sm">
                            {b.name?.[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-gray-800 text-sm truncate">
                            {b.name}
                          </p>
                          {b.is_featured && <span className="text-xs">⭐</span>}
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {b.product_count || 0} products
                          {!b.active && ' · Inactive'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* ==================== COLUMN 2: EDIT FORM ==================== */}
          <main
            className={`${
              mobileTab === 'edit' ? 'block' : 'hidden'
            } lg:block bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden`}
          >
            <div className="p-4 sm:p-6 border-b border-pink-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-800">
                {editingBrand ? `✏️ Edit ${editingBrand.name}` : '✨ Create New Brand'}
              </h2>
              {editingBrand && (
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleField(editingBrand, 'active')}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      formData.active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {formData.active ? '● Active' : '○ Inactive'}
                  </button>
                  <button
                    onClick={() => toggleField(editingBrand, 'is_featured')}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      formData.is_featured
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {formData.is_featured ? '⭐ Featured' : '☆ Feature'}
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* ---------- Images ---------- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Logo */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Logo <span className="text-gray-400">(400×400, max 500KB)</span>
                  </label>
                  <div
                    onClick={() => fileLogoRef.current?.click()}
                    className="border-2 border-dashed border-pink-200 rounded-xl p-4 text-center hover:border-pink-400 hover:bg-pink-50/30 transition cursor-pointer"
                  >
                    {logoPreview ? (
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="w-24 h-24 mx-auto object-contain rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLogoPreview('');
                            setFormData((p) => ({ ...p, logo: '' }));
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl text-pink-400 mb-1">📷</div>
                        <p className="text-xs text-gray-500">Click to upload</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileLogoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>

                {/* Banner */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Banner <span className="text-gray-400">(1600×500, max 1MB)</span>
                  </label>
                  <div
                    onClick={() => fileBannerRef.current?.click()}
                    className="border-2 border-dashed border-pink-200 rounded-xl p-4 text-center hover:border-pink-400 hover:bg-pink-50/30 transition cursor-pointer"
                  >
                    {bannerPreview ? (
                      <div className="relative">
                        <img
                          src={bannerPreview}
                          alt="Banner"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBannerPreview('');
                            setFormData((p) => ({ ...p, banner: '' }));
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl text-pink-400 mb-1">🖼️</div>
                        <p className="text-xs text-gray-500">Click to upload</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileBannerRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                  />
                </div>
              </div>

              {/* ---------- Basic Info ---------- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. SKINQ"
                    className="w-full border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Slug (URL) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setFormData((p) => ({ ...p, slug: slugify(e.target.value) }));
                    }}
                    placeholder="skinq"
                    className="w-full border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    /brand/{formData.slug || '...'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tagline <span className="text-gray-400">(1 line punchline)</span>
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData((p) => ({ ...p, tagline: e.target.value }))}
                  placeholder="e.g. Science-backed skincare"
                  maxLength={80}
                  className="w-full border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-[10px] text-gray-400 mt-1 text-right">
                  {formData.tagline.length}/80
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400">(2-3 lines)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Short description about the brand..."
                  rows={3}
                  maxLength={300}
                  className="w-full border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                />
                <p className="text-[10px] text-gray-400 mt-1 text-right">
                  {formData.description.length}/300
                </p>
              </div>

              {/* ---------- Highlights ---------- */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">
                    Highlights <span className="text-gray-400">(max 8, optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => addHighlight()}
                    className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                  >
                    + Add
                  </button>
                </div>

                {formData.highlights.length < 8 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {HIGHLIGHT_PRESETS.slice(0, 6).map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => addHighlight(p)}
                        className="text-[11px] bg-pink-50 hover:bg-pink-100 text-pink-700 px-2 py-1 rounded-full transition-colors"
                      >
                        {p.icon} {p.title}
                      </button>
                    ))}
                  </div>
                )}

                {formData.highlights.length > 0 && (
                  <div className="space-y-2">
                    {formData.highlights.map((h, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-pink-50/50 border border-pink-100 rounded-xl p-2"
                      >
                        <select
                          value={h.icon}
                          onChange={(e) => updateHighlight(idx, 'icon', e.target.value)}
                          className="w-12 text-center bg-white border border-pink-100 rounded-lg px-1 py-1.5 text-sm cursor-pointer"
                        >
                          {EMOJI_OPTIONS.map((e) => (
                            <option key={e} value={e}>{e}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={h.title}
                          onChange={(e) => updateHighlight(idx, 'title', e.target.value)}
                          placeholder="Title"
                          className="flex-1 min-w-0 bg-white border border-pink-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                        />
                        <input
                          type="text"
                          value={h.desc}
                          onChange={(e) => updateHighlight(idx, 'desc', e.target.value)}
                          placeholder="Description"
                          className="hidden sm:block flex-1 min-w-0 bg-white border border-pink-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                        />
                        <button
                          type="button"
                          onClick={() => moveHighlight(idx, -1)}
                          disabled={idx === 0}
                          className="text-gray-400 hover:text-pink-600 disabled:opacity-30 text-xs"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveHighlight(idx, 1)}
                          disabled={idx === formData.highlights.length - 1}
                          className="text-gray-400 hover:text-pink-600 disabled:opacity-30 text-xs"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeHighlight(idx)}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ---------- Offers ---------- */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">
                    Offers <span className="text-gray-400">(max 5, optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={addOffer}
                    className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                  >
                    + Add
                  </button>
                </div>

                {formData.offers.length > 0 && (
                  <div className="space-y-2">
                    {formData.offers.map((o, idx) => (
                      <div
                        key={idx}
                        className="bg-pink-50/50 border border-pink-100 rounded-xl p-2 space-y-1.5"
                      >
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={o.title}
                            onChange={(e) => updateOffer(idx, 'title', e.target.value)}
                            placeholder="Offer title (e.g. Buy 1 Get 1)"
                            className="flex-1 bg-white border border-pink-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeOffer(idx)}
                            className="text-red-500 hover:text-red-600 text-sm px-1"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={o.code}
                            onChange={(e) => updateOffer(idx, 'code', e.target.value.toUpperCase())}
                            placeholder="Code (e.g. SKINQ50)"
                            className="flex-1 bg-white border border-pink-100 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-pink-500"
                          />
                          <input
                            type="text"
                            value={o.description}
                            onChange={(e) => updateOffer(idx, 'description', e.target.value)}
                            placeholder="Description"
                            className="flex-1 bg-white border border-pink-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ---------- Display Settings ---------- */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-pink-100">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))
                    }
                    min="0"
                    className="w-full border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div className="flex flex-col gap-2 pt-6">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData((p) => ({ ...p, active: e.target.checked }))}
                      className="w-4 h-4 accent-pink-500"
                    />
                    Active (visible on store)
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData((p) => ({ ...p, is_featured: e.target.checked }))}
                      className="w-4 h-4 accent-pink-500"
                    />
                    Featured (top placement)
                  </label>
                </div>
              </div>

              {/* ---------- Generated Link ---------- */}
              {formData.slug && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-[10px] text-green-700 mb-1 font-medium">
                    ✅ Public Link
                  </p>
                  <p className="text-xs font-mono text-green-800 break-all mb-2">
                    /brand/{formData.slug}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={copyLink}
                      className="text-[11px] px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                    >
                      📋 Copy
                    </button>
                    <button
                      type="button"
                      onClick={testLink}
                      className="text-[11px] px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                      🔗 Test
                    </button>
                  </div>
                </div>
              )}

              {/* ---------- Actions ---------- */}
              <div className="flex gap-3 pt-4 border-t border-pink-100 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 -mb-4 sm:-mb-6 pb-4 sm:pb-6">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving
                    ? '⏳ Saving...'
                    : editingBrand
                    ? '💾 Update Brand'
                    : '🚀 Create Brand'}
                </button>
                {editingBrand && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingBrand)}
                    className="px-4 py-3 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </main>

          {/* ==================== COLUMN 3: LIVE PREVIEW ==================== */}
          <aside
            className={`${
              mobileTab === 'preview' ? 'block' : 'hidden'
            } lg:block lg:sticky lg:top-24 h-fit`}
          >
            <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">👁️ Live Preview</h3>
                <div className="flex gap-1 bg-white/20 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`px-2 py-0.5 text-xs rounded ${
                      previewMode === 'desktop' ? 'bg-white text-pink-600' : 'text-white'
                    }`}
                  >
                    🖥️
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`px-2 py-0.5 text-xs rounded ${
                      previewMode === 'mobile' ? 'bg-white text-pink-600' : 'text-white'
                    }`}
                  >
                    📱
                  </button>
                </div>
              </div>

              <div className="bg-pink-50/30 p-3 sm:p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                <div
                  className={`mx-auto transition-all ${
                    previewMode === 'mobile' ? 'max-w-[320px]' : ''
                  }`}
                >
                  {/* Hero preview */}
                  <div className="relative rounded-xl overflow-hidden shadow-md">
                    <div className="h-40 bg-gradient-to-r from-pink-400 to-rose-400 relative">
                      {bannerPreview && (
                        <img
                          src={bannerPreview}
                          alt="Banner"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />

                      <div className="relative h-full flex flex-col items-center justify-center text-center px-3">
                        <div className="w-12 h-12 rounded-full bg-white border-2 border-pink-200 flex items-center justify-center mb-2 overflow-hidden shadow-lg">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-pink-500 font-bold text-lg">
                              {formData.name?.[0]?.toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <h4 className="text-white font-bold text-base tracking-wide truncate max-w-full">
                          {formData.name || 'Brand Name'}
                        </h4>
                        {formData.tagline && (
                          <p className="text-white/90 text-[11px] italic mt-0.5 truncate max-w-full">
                            "{formData.tagline}"
                          </p>
                        )}
                        <p className="text-white/80 text-[10px] mt-2">
                          {editingBrand?.product_count || 0} products
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description preview */}
                  {formData.description && (
                    <div className="mt-3 bg-white rounded-xl p-3 shadow-sm">
                      <p className="text-[10px] text-pink-600 font-medium mb-1 uppercase tracking-wide">
                        About
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-3">{formData.description}</p>
                    </div>
                  )}

                  {/* Highlights preview */}
                  {formData.highlights.length > 0 && (
                    <div className="mt-3 bg-white rounded-xl p-3 shadow-sm">
                      <p className="text-[10px] text-pink-600 font-medium mb-2 uppercase tracking-wide">
                        Highlights
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {formData.highlights.map((h, i) => (
                          <div key={i} className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base shrink-0">{h.icon}</span>
                            <span className="text-[10px] text-gray-700 truncate">
                              {h.title || '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Offers preview */}
                  {formData.offers.length > 0 && (
                    <div className="mt-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl p-3 shadow-sm text-white">
                      <p className="text-[10px] font-medium mb-2 uppercase tracking-wide opacity-90">
                        🎁 Active Offers
                      </p>
                      <div className="space-y-1.5">
                        {formData.offers.map((o, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-xs">
                            <span className="truncate">{o.title || '—'}</span>
                            {o.code && (
                              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono shrink-0">
                                {o.code}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="mt-3 flex flex-wrap gap-2 justify-center">
                    {formData.active ? (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        ● Active
                      </span>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        ○ Inactive
                      </span>
                    )}
                    {formData.is_featured && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        ⭐ Featured
                      </span>
                    )}
                    {formData.slug && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono">
                        /{formData.slug}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default AdminBrands;
