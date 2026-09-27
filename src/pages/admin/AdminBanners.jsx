// src/pages/admin/AdminBanners.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SearchableSelect from '../../components/SearchableSelect';
import SearchableMultiSelect from '../../components/SearchableMultiSelect';
import BannerRenderer from '../../components/BannerRenderer';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'https://api.mypinkshop.com/api';

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getErrorMessage(err, defaultMsg = 'Something went wrong') {
  if (!err) return defaultMsg;
  const msg = err.message || '';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Network error — please check your internet connection';
  }
  if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
    return 'Session expired — please login again';
  }
  if (msg.includes('403') || msg.toLowerCase().includes('forbidden')) {
    return 'You do not have permission to perform this action';
  }
  if (msg.includes('404')) return 'Banner not found';
  if (msg.includes('500')) return 'Server error — please try again later';
  return msg || defaultMsg;
}

function AdminBanners() {
  const navigate = useNavigate();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [mobileTab, setMobileTab] = useState('list');

  // Filters
  const [search, setSearch] = useState('');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all | active | inactive

  // Collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const [options, setOptions] = useState({
    sizes: [],
    styles: [],
    positions: [],
    link_types: [],
  });
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [formData, setFormData] = useState(emptyForm());
  const [imagePreviews, setImagePreviews] = useState([]);

  function emptyForm() {
    return {
      title: '',
      subtitle: '',
      buttonText: 'Shop Now',
      images: [],
      order: 1,
      active: true,
      showTextOverlay: false,
      categories: [],
      subcategories: [],
      positions: ['home_hero'],
      size: 'large',
      display_style: 'single',
      link_type: 'custom',
      link: '/shop',
    };
  }

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadOptions();
    loadBanners();
    loadDropdownData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------- Load options ------------------------- */
  const loadOptions = async () => {
    try {
      setOptionsLoading(true);
      const res = await fetch(`${API_BASE}/banners/options`);
      const json = await res.json();
      const data = json.data || json;
      if (data) {
        setOptions({
          sizes: data.sizes || [],
          styles: data.styles || [],
          positions: data.positions || [],
          link_types: data.link_types || [],
        });
      }
    } catch (err) {
      console.error('Options load error:', err);
      toast.error('Failed to load options');
    } finally {
      setOptionsLoading(false);
    }
  };

  /* ------------------------- Load banners (fresh) ------------------------- */
  const loadBanners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/banners/all`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || []);
      setBanners(list.sort((a, b) => (a.order || 0) - (b.order || 0)));

      // Clear frontend cache so Home page also refreshes
      sessionStorage.removeItem('home_banners_cache');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------- Load dropdown data ------------------------- */
  const loadDropdownData = async () => {
    try {
      const [brandsRes, productsRes, catRes] = await Promise.allSettled([
        fetch(`${API_BASE}/brands`).then((r) => r.json()),
        fetch(`${API_BASE}/products?limit=200`).then((r) => r.json()),
        fetch(`${API_BASE}/categories/tree`).then((r) => r.json()),
      ]);

      if (brandsRes.status === 'fulfilled') {
        const res = brandsRes.value;
        const b = Array.isArray(res) ? res : (res.data || []);
        setBrands(
          b.map((x) => (typeof x === 'string' ? x : x.name)).filter(Boolean)
        );
      }

      if (productsRes.status === 'fulfilled') {
        const res = productsRes.value;
        const list = Array.isArray(res)
          ? res
          : (res.data || res.products || []);
        setProducts(list);
      }

      if (catRes.status === 'fulfilled') {
        const res = catRes.value;
        const list = Array.isArray(res)
          ? res
          : (res.data || res.categories || []);

        setCategories(
          list.map((c) => ({ value: c.slug || c.id, label: c.name }))
        );

        const subs = [];
        list.forEach((c) => {
          (c.children || []).forEach((sub) => {
            subs.push({
              value: sub.slug || sub.id,
              label: `${c.name} › ${sub.name}`,
            });
          });
        });
        setSubcategories(subs);
      }
    } catch (err) {
      console.error('Dropdown load error:', err);
    }
  };

  /* ------------------------- Filter + group banners ------------------------- */
  const filteredBanners = useMemo(() => {
    let list = [...banners];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          (b.title || '').toLowerCase().includes(q) ||
          (b.subtitle || '').toLowerCase().includes(q)
      );
    }

    // Position filter
    if (filterPosition !== 'all') {
      list = list.filter((b) => {
        const positions = Array.isArray(b.positions)
          ? b.positions
          : b.position
          ? [b.position]
          : [];
        return positions.includes(filterPosition);
      });
    }

    // Category filter
    if (filterCategory !== 'all') {
      list = list.filter((b) => {
        const cats = Array.isArray(b.categories)
          ? b.categories
          : b.category
          ? [b.category]
          : [];
        return cats.includes(filterCategory);
      });
    }

    // Status filter
    if (filterStatus === 'active') list = list.filter((b) => b.active);
    if (filterStatus === 'inactive') list = list.filter((b) => !b.active);

    return list;
  }, [banners, search, filterPosition, filterCategory, filterStatus]);

  /* ------------------------- Group by position ------------------------- */
  const groupedBanners = useMemo(() => {
    const groups = {};

    // Initialize groups for all positions (so empty ones also show)
    options.positions.forEach((p) => {
      groups[p.value] = {
        value: p.value,
        label: p.label,
        banners: [],
      };
    });

    // Also handle banners without position
    const noPositionGroup = {
      value: '__none__',
      label: 'No Position',
      banners: [],
    };

    filteredBanners.forEach((b) => {
      const positions = Array.isArray(b.positions) && b.positions.length > 0
        ? b.positions
        : b.position
        ? [b.position]
        : [];

      if (positions.length === 0) {
        noPositionGroup.banners.push(b);
      } else {
        // Add to each position group (multi-position support)
        positions.forEach((pos) => {
          if (groups[pos]) {
            groups[pos].banners.push(b);
          } else {
            // Unknown position — add to noPosition
            noPositionGroup.banners.push(b);
          }
        });
      }
    });

    // Convert to array, sort by options.positions order
    const result = options.positions
      .map((p) => groups[p.value])
      .filter(Boolean);

    // Add noPosition group at the end if it has banners
    if (noPositionGroup.banners.length > 0) {
      result.push(noPositionGroup);
    }

    return result;
  }, [filteredBanners, options.positions]);

  /* ------------------------- Position counts for filter ------------------------- */
  const positionCounts = useMemo(() => {
    const counts = {};
    banners.forEach((b) => {
      const positions = Array.isArray(b.positions) && b.positions.length > 0
        ? b.positions
        : b.position
        ? [b.position]
        : [];
      positions.forEach((pos) => {
        counts[pos] = (counts[pos] || 0) + 1;
      });
    });
    return counts;
  }, [banners]);

  /* ------------------------- Select / New ------------------------- */
  const handleSelectBanner = async (b) => {
    try {
      // Fetch fresh data from backend
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/banners/all`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (!res.ok) throw new Error('Failed to load banner');

      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || []);
      const fresh = list.find(
        (x) => (x._id || x.id) === (b._id || b.id)
      );

      if (!fresh) {
        toast.error('Banner not found');
        return;
      }

      setEditingBanner(fresh);

      const cats = Array.isArray(fresh.categories)
        ? fresh.categories
        : fresh.category
        ? [fresh.category]
        : [];

      const poss = Array.isArray(fresh.positions)
        ? fresh.positions
        : fresh.position
        ? [fresh.position]
        : ['home_hero'];

      setFormData({
        title: fresh.title || '',
        subtitle: fresh.subtitle || '',
        buttonText: fresh.buttonText || 'Shop Now',
        images: [],
        order: fresh.order || 1,
        active: fresh.active !== false,
        showTextOverlay: fresh.showTextOverlay === true,
        categories: cats,
        subcategories: Array.isArray(fresh.subcategories) ? fresh.subcategories : [],
        positions: poss,
        size: fresh.size || 'large',
        display_style: fresh.display_style || 'single',
        link_type: fresh.link_type || 'custom',
        link: fresh.link || '/shop',
      });
      setImagePreviews(fresh.images || []);
      setMobileTab('edit');
    } catch (err) {
      console.error('Select banner error:', err);
      toast.error(getErrorMessage(err, 'Failed to load banner'));
    }
  };

  const handleNewBanner = () => {
    setEditingBanner(null);
    setFormData({
      ...emptyForm(),
      order: banners.length + 1,
    });
    setImagePreviews([]);
    setMobileTab('edit');
  };

  /* ------------------------- Image handling ------------------------- */
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (files.length > 6) return toast.error('Maximum 6 images allowed');
    if (files.reduce((s, f) => s + f.size, 0) > 5 * 1024 * 1024) {
      return toast.error('Total image size must be under 5MB');
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
  const generateLink = () => formData.link || '';

  const copyLink = () => {
    const full = `${window.location.origin}${generateLink()}`;
    navigator.clipboard.writeText(full);
    toast.success('Link copied');
  };

  const testLink = () => {
    const link = generateLink();
    if (!link) return toast.error('No link generated');
    window.open(link, '_blank');
  };

  /* ------------------------- Save ------------------------- */
  const saveBannerToAPI = async (data, isEdit) => {
    const token = localStorage.getItem('adminToken');
    const form = new FormData();

    ['title', 'subtitle', 'buttonText', 'link', 'size', 'display_style', 'link_type'].forEach(
      (k) => form.append(k, data[k] || '')
    );

    form.append('categories', JSON.stringify(data.categories || []));
    form.append('positions', JSON.stringify(data.positions || []));
    form.append('subcategories', JSON.stringify(data.subcategories || []));

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

    let json = null;
    try {
      json = await res.json();
    } catch {
      throw new Error(`Server error (HTTP ${res.status})`);
    }

    if (res.status === 401) throw new Error('401 Unauthorized');
    if (!res.ok) throw new Error(json?.error || `Save failed (HTTP ${res.status})`);
    return json;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.images.length && !imagePreviews.length) {
      return toast.error('Please upload at least one image');
    }
    if (!generateLink()) {
      return toast.error('Please enter a valid link');
    }
    if (!formData.positions || formData.positions.length === 0) {
      return toast.error('Please select at least one position');
    }

    setUploading(true);
    try {
      const payload = { ...formData, link: generateLink() };
      if (editingBanner) {
        await saveBannerToAPI(payload, true);
        toast.success('Banner updated');
      } else {
        await saveBannerToAPI(payload, false);
        toast.success('Banner published');
      }
      await loadBanners();
      resetForm();
    } catch (err) {
      console.error('Save banner error:', err);
      toast.error(getErrorMessage(err, 'Failed to save banner'));
      if (err.message?.includes('401')) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      ...emptyForm(),
      order: banners.length + 1,
    });
    setImagePreviews([]);
    setMobileTab('list');
  };

  /* ------------------------- Delete / Toggle ------------------------- */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner permanently?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete failed (HTTP ${res.status})`);
      toast.success('Banner deleted successfully');
      await loadBanners();
      if (editingBanner?._id === id || editingBanner?.id === id) resetForm();
    } catch (err) {
      console.error('Delete banner error:', err);
      toast.error(getErrorMessage(err, 'Failed to delete banner'));
    }
  };

  const toggleActive = async (id, current) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/banners/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !current }),
      });
      if (!res.ok) throw new Error(`Toggle failed (HTTP ${res.status})`);
      await loadBanners();
      toast.success(`Banner ${!current ? 'activated' : 'deactivated'}`);
    } catch (err) {
      console.error('Toggle error:', err);
      toast.error(getErrorMessage(err, 'Failed to update banner'));
    }
  };

  /* ------------------------- Auto-suggest size/style ------------------------- */
  const applySizeGuide = (positions) => {
    if (!positions || positions.length === 0) {
      setFormData((p) => ({ ...p, positions }));
      return;
    }
    const firstPos = positions[0];
    const pos = options.positions.find((p) => p.value === firstPos);
    setFormData((p) => ({
      ...p,
      positions,
      size: pos?.size || p.size,
      display_style: pos?.style || p.display_style,
    }));
  };

  const currentPositionGuide = useMemo(() => {
    if (!formData.positions || formData.positions.length === 0) return null;
    return options.positions.find((p) => p.value === formData.positions[0]);
  }, [options.positions, formData.positions]);

  const previewBanner = useMemo(
    () => ({
      ...formData,
      images: imagePreviews.length ? imagePreviews : formData.images,
      category: formData.categories?.[0] || null,
      position: formData.positions?.[0] || 'home_hero',
    }),
    [formData, imagePreviews]
  );

  const isMobilePreview = previewMode === 'mobile';

  /* ------------------------- Collapse toggling ------------------------- */
  const toggleGroup = (value) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [value]: !prev[value],
    }));
  };

  /* ------------------------- Loading ------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF7FA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading banners...</p>
        </div>
      </div>
    );
  }

  /* ------------------------- Render ------------------------- */
  return (
    <div className="min-h-screen bg-[#FFF7FA]">
      {/* TOP BAR */}
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
              Banner Manager
            </h1>
            <span className="hidden sm:inline text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-full font-medium">
              {banners.length} total
            </span>
          </div>

          <button
            onClick={handleNewBanner}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 sm:px-6 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg transition-all"
          >
            + Create Banner
          </button>
        </div>

        {/* Mobile tabs */}
        <div className="lg:hidden flex border-t border-pink-100">
          {[
            { id: 'list', label: 'List' },
            { id: 'edit', label: 'Edit' },
            { id: 'preview', label: 'Preview' },
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

      {/* MAIN 3-COLUMN */}
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr_400px] gap-4 p-4 sm:p-6">

          {/* ==================== COLUMN 1: LIST WITH FILTERS ==================== */}
          <aside
            className={`${
              mobileTab === 'list' ? 'block' : 'hidden'
            } lg:block bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden lg:sticky lg:top-24 h-fit max-h-[calc(100vh-120px)] flex flex-col`}
          >
            {/* Search + Filters */}
            <div className="p-4 border-b border-pink-100 space-y-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search banners..."
                className="w-full border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="w-full border border-pink-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                >
                  <option value="all">All Positions</option>
                  {options.positions.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label} ({positionCounts[p.value] || 0})
                    </option>
                  ))}
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full border border-pink-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-1.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'inactive', label: 'Inactive' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterStatus(f.id)}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                      filterStatus === f.id
                        ? 'bg-pink-500 text-white'
                        : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-gray-400">
                Showing {filteredBanners.length} of {banners.length} banners
              </p>
            </div>

            {/* Grouped banners list */}
            <div className="overflow-y-auto flex-1">
              {groupedBanners.length === 0 || filteredBanners.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-2">🎨</div>
                  <p className="text-gray-400 text-sm">No banners found</p>
                  {filteredBanners.length === 0 && banners.length > 0 && (
                    <button
                      onClick={() => {
                        setSearch('');
                        setFilterPosition('all');
                        setFilterCategory('all');
                        setFilterStatus('all');
                      }}
                      className="mt-3 text-xs text-pink-600 hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                groupedBanners.map((group) => {
                  const isCollapsed = collapsedGroups[group.value];
                  return (
                    <div key={group.value} className="border-b border-pink-50">
                      {/* Group header */}
                      <button
                        onClick={() => toggleGroup(group.value)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-pink-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-pink-500 shrink-0">
                            {isCollapsed ? '▶' : '▼'}
                          </span>
                          <span className="font-semibold text-sm text-gray-800 truncate">
                            {group.label}
                          </span>
                          <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                            {group.banners.length}
                          </span>
                        </div>
                      </button>

                      {/* Group items */}
                      {!isCollapsed && (
                        <div>
                          {group.banners.length === 0 ? (
                            <div className="px-4 py-3 text-[11px] text-gray-400 italic">
                              No banners in this position
                            </div>
                          ) : (
                            group.banners.map((b) => {
                              const isActive =
                                editingBanner?.id === b.id ||
                                editingBanner?._id === b._id;
                              const cats = Array.isArray(b.categories)
                                ? b.categories
                                : b.category
                                ? [b.category]
                                : [];
                              return (
                                <div
                                  key={b._id || b.id}
                                  className={`px-3 py-2.5 border-b border-pink-50 transition-colors ${
                                    isActive ? 'bg-pink-50' : 'hover:bg-pink-50/50'
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center shrink-0 overflow-hidden border border-pink-200">
                                      {b.images?.[0] ? (
                                        <img
                                          src={b.images[0]}
                                          alt={b.title}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-sm">🖼️</span>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-800 text-xs truncate">
                                        {b.title || 'Untitled'}
                                      </p>
                                      <p className="text-[9px] text-gray-400 truncate">
                                        {cats.length > 0
                                          ? cats.join(', ')
                                          : 'Global'}
                                      </p>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        {b.active ? (
                                          <span className="text-[8px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                                            Active
                                          </span>
                                        ) : (
                                          <span className="text-[8px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                            Inactive
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action buttons */}
                                  <div className="flex gap-1.5 mt-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSelectBanner(b)}
                                      className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-medium transition-colors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleActive(b._id || b.id, b.active)
                                      }
                                      className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 font-medium transition-colors"
                                    >
                                      {b.active ? 'Disable' : 'Enable'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(b._id || b.id)}
                                      className="text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* ==================== COLUMN 2: FORM ==================== */}
          <main
            className={`${
              mobileTab === 'edit' ? 'block' : 'hidden'
            } lg:block bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden`}
          >
            <div className="p-4 sm:p-6 border-b border-pink-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-800">
                {editingBanner ? 'Edit Banner' : 'Create Banner'}
              </h2>
              {editingBanner && (
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      toggleActive(
                        editingBanner._id || editingBanner.id,
                        editingBanner.active
                      )
                    }
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      formData.active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {formData.active ? '● Active' : '○ Inactive'}
                  </button>
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Title <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. Summer Sale 2024"
                    className="w-full border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Subtitle <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    placeholder="e.g. Up to 50% off"
                    className="w-full border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.buttonText}
                    onChange={(e) =>
                      setFormData({ ...formData, buttonText: e.target.value })
                    }
                    placeholder="Shop Now"
                    className="w-full border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Images <span className="text-gray-400">(max 6, 5MB total)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="w-full text-sm border border-dashed border-pink-200 rounded-xl p-3 cursor-pointer hover:border-pink-400 transition"
                />
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={src}
                          className="h-20 w-full object-cover rounded-lg border border-pink-100"
                          alt=""
                        />
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

              <div>
                {optionsLoading ? (
                  <div className="text-xs text-gray-400 py-2">
                    Loading positions...
                  </div>
                ) : (
                  <SearchableMultiSelect
                    label="Positions"
                    options={options.positions}
                    selected={formData.positions || []}
                    onChange={(vals) => applySizeGuide(vals)}
                    placeholder="Search positions..."
                    emptyText="No positions available"
                  />
                )}
                {currentPositionGuide && (
                  <p className="text-[10px] text-gray-500 mt-1.5">
                    Recommended (first position): {currentPositionGuide.px} (
                    {currentPositionGuide.ratio})
                  </p>
                )}
              </div>

              <div>
                <SearchableMultiSelect
                  label="Categories (empty = Global)"
                  options={categories}
                  selected={formData.categories || []}
                  onChange={(vals) =>
                    setFormData({ ...formData, categories: vals })
                  }
                  placeholder="Search categories..."
                  emptyText="No categories available"
                />
                {formData.categories.length === 0 && (
                  <p className="text-[10px] text-green-600 mt-1.5">
                    Global — will show on all pages
                  </p>
                )}
              </div>

              {subcategories.length > 0 && (
                <SearchableMultiSelect
                  label="Subcategories (optional)"
                  options={subcategories}
                  selected={formData.subcategories || []}
                  onChange={(vals) =>
                    setFormData({ ...formData, subcategories: vals })
                  }
                  placeholder="Search subcategories..."
                  emptyText="No subcategories available"
                />
              )}

              {!optionsLoading && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {options.sizes.map((s) => (
                      <label
                        key={s.value}
                        className={`cursor-pointer px-3 py-2 rounded-xl border-2 text-xs font-medium transition ${
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
                          onChange={(e) =>
                            setFormData({ ...formData, size: e.target.value })
                          }
                          className="sr-only"
                        />
                        {s.label}
                        {s.hint && (
                          <span className="text-[10px] opacity-60 ml-1">
                            ({s.hint})
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {!optionsLoading && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Display Style
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {options.styles.map((s) => (
                      <label
                        key={s.value}
                        className={`cursor-pointer px-3 py-2 rounded-xl border-2 text-xs font-medium transition ${
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
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              display_style: e.target.value,
                            })
                          }
                          className="sr-only"
                        />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {!optionsLoading && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Link Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {options.link_types.map((l) => (
                      <label
                        key={l.value}
                        className={`cursor-pointer px-3 py-2 rounded-xl border-2 text-xs transition ${
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
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              link_type: e.target.value,
                              link: '',
                            })
                          }
                          className="sr-only"
                        />
                        {l.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.link_type === 'category' && (
                <SearchableSelect
                  label="Category"
                  options={categories}
                  value={formData.link.replace('/category/', '')}
                  onChange={(v) =>
                    setFormData({ ...formData, link: `/category/${v}` })
                  }
                  placeholder="Search category..."
                />
              )}

              {formData.link_type === 'subcategory' && (
                <SearchableSelect
                  label="Subcategory"
                  options={subcategories}
                  value={formData.link.replace('/category/', '')}
                  onChange={(v) =>
                    setFormData({ ...formData, link: `/category/${v}` })
                  }
                  placeholder="Search subcategory..."
                />
              )}

              {formData.link_type === 'brand' && (
                <SearchableSelect
                  label="Brand"
                  options={brands}
                  value={formData.link.replace('/brand/', '')}
                  onChange={(v) =>
                    setFormData({ ...formData, link: `/brand/${slugify(v)}` })
                  }
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
                  onChange={(v) =>
                    setFormData({ ...formData, link: `/product/${v}` })
                  }
                  placeholder="Search product (title/SKU)..."
                />
              )}

              {formData.link_type === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Custom URL
                  </label>
                  <input
                    type="text"
                    value={formData.link}
                    onChange={(e) =>
                      setFormData({ ...formData, link: e.target.value })
                    }
                    placeholder="/shop or https://..."
                    className="w-full border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              )}

              {generateLink() && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-[10px] text-green-700 mb-1 font-medium">
                    Generated Link
                  </p>
                  <p className="text-xs font-mono text-green-800 break-all mb-2">
                    {generateLink()}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={copyLink}
                      className="text-[11px] px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={testLink}
                      className="text-[11px] px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                      Test
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full border border-pink-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div className="flex flex-col gap-2 pt-5">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) =>
                        setFormData({ ...formData, active: e.target.checked })
                      }
                      className="w-4 h-4 accent-pink-500"
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showTextOverlay}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          showTextOverlay: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-pink-500"
                    />
                    Show text on banner
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-pink-100 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 -mb-4 sm:-mb-6 pb-4 sm:pb-6">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {uploading
                    ? 'Publishing...'
                    : editingBanner
                    ? 'Update Banner'
                    : 'Publish Banner'}
                </button>
                {editingBanner && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingBanner._id || editingBanner.id)}
                    className="px-4 py-3 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
          </main>

          {/* ==================== COLUMN 3: LIVE PREVIEW ==================== */}
          <aside
            className={`${
              mobileTab === 'preview' ? 'block' : 'hidden'
            } lg:block lg:sticky lg:top-24 h-fit`}
          >
            <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">
                  Live Preview
                </h3>
                <div className="flex gap-1 bg-white/20 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`px-2 py-0.5 text-xs rounded ${
                      previewMode === 'desktop'
                        ? 'bg-white text-pink-600'
                        : 'text-white'
                    }`}
                  >
                    🖥️
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`px-2 py-0.5 text-xs rounded ${
                      previewMode === 'mobile'
                        ? 'bg-white text-pink-600'
                        : 'text-white'
                    }`}
                  >
                    📱
                  </button>
                </div>
              </div>

              <div className="bg-pink-50/30 p-3 sm:p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                <div
                  className={`mx-auto transition-all ${
                    isMobilePreview ? 'max-w-[320px]' : ''
                  }`}
                >
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
              </div>

              <div className="px-4 pb-4 text-[11px] text-gray-500 space-y-1 border-t border-pink-100 pt-3">
                <p>
                  Size: <b className="text-gray-700">{formData.size}</b>
                </p>
                <p>
                  Style: <b className="text-gray-700">{formData.display_style}</b>
                </p>
                <p>
                  Positions:{' '}
                  <b className="text-gray-700">
                    {formData.positions?.length || 0}
                  </b>
                </p>
                <p>
                  Categories:{' '}
                  <b className="text-gray-700">
                    {formData.categories?.length || 0}
                  </b>
                </p>
                <p>
                  Link:{' '}
                  <b className="break-all text-gray-700">
                    {generateLink() || '—'}
                  </b>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default AdminBanners;
