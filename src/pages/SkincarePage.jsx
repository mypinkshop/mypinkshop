// src/pages/SkincarePage.jsx
import { useState, useEffect, useMemo, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import ProductCard from '../components/ProductCard';
import BannerRenderer from '../components/BannerRenderer';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

/* ✅ Category normalizer */
const normalizeCategory = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
    .trim();

/* ✅ Active check */
const isProductActive = (p) =>
  p.is_active === 1 ||
  p.is_active === true ||
  p.isActive === true ||
  p.status === 'active';

/* ✅ Product normalizer */
const normalizeProduct = (p) => {
  let images = p.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images || '[]'); } catch { images = []; }
  }
  let concerns = p.concerns || p.skinConcerns;
  if (typeof concerns === 'string') {
    try { concerns = JSON.parse(concerns || '[]'); } catch { concerns = []; }
  }
  return {
    ...p,
    id: p.id || p._id,
    _id: p._id || p.id,
    images: Array.isArray(images) ? images : [],
    mainCategory: p.main_category || p.mainCategory || p.category || '',
    subCategory: p.sub_category || p.subCategory || p.subcategory || '',
    originalPrice: p.original_price || p.originalPrice || 0,
    skinConcerns: Array.isArray(concerns) ? concerns : [],
    skinType: p.skin_type || p.skinType || 'all',
  };
};

/* ✅ Banner grouping */
function groupBanners(list) {
  const grouped = {};
  list.forEach((b) => {
    const positions =
      Array.isArray(b.positions) && b.positions.length > 0
        ? b.positions
        : b.position
        ? [b.position]
        : [];
    positions.forEach((pos) => {
      if (!grouped[pos]) grouped[pos] = [];
      grouped[pos].push(b);
    });
  });
  return grouped;
}

function SkincarePage() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlist, wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [apiSubcategories, setApiSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannersByPosition, setBannersByPosition] = useState({});
  const [topOffers, setTopOffers] = useState([]);
  const [midOffers, setMidOffers] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [selectedConcern, setSelectedConcern] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedSkinType, setSelectedSkinType] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [visibleCount, setVisibleCount] = useState(16);

  const SLUG = 'skincare';

  /* ---------------- ✅ Load category + banners + offers ---------------- */
  useEffect(() => {
    const loadAll = async () => {
      try {
        const catRes = await fetch(`${API_URL}/api/categories/tree`);
        const catJson = await catRes.json();
        const tree = catJson.data || catJson;
        const found = Array.isArray(tree) ? tree.find((c) => c.slug === SLUG) : null;
        if (found) {
          // ✅ Proper mapping — subcategories
          setApiSubcategories(
            (found.children || []).map(child => ({
              id: child.id,
              name: child.name,
              icon: child.icon || '🌸',
            }))
          );
        }

        const bannerRes = await fetch(`${API_URL}/api/banners/active?category=${SLUG}`);
        const bannerJson = await bannerRes.json();
        const banners = Array.isArray(bannerJson) ? bannerJson : (bannerJson.data || []);
        setBannersByPosition(groupBanners(banners));

        const offerRes = await fetch(`${API_URL}/api/offers/active?category=${SLUG}`);
        const offerJson = await offerRes.json();
        const offers = Array.isArray(offerJson) ? offerJson : (offerJson.data || []);
        setTopOffers(offers.filter((o) => o.position === 'category_top' || o.position === 'top_banner'));
        setMidOffers(offers.filter((o) => o.position === 'category_mid'));
      } catch (err) {
        console.error('Load error:', err);
      }
    };
    loadAll();
  }, []);

  /* ✅ NAYA — Subcategories dedicated API */
  useEffect(() => {
    const loadSubs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/subcategories/${SLUG}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setApiSubcategories(
            json.data.map(s => ({
              id: s.id,
              name: s.name,
              icon: s.icon || '🌸',
            }))
          );
        }
      } catch (err) {
        console.error('Subcategories fetch error:', err);
      }
    };
    loadSubs();
  }, []);

  /* ---------------- Load products ---------------- */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/products`);
        if (!response.ok) throw new Error('Failed to load products');
        const data = await response.json();
        const productsArray = (Array.isArray(data) ? data : (data.data || []))
          .map(normalizeProduct);

        const skincareProducts = productsArray.filter(
          (p) => isProductActive(p) && normalizeCategory(p.mainCategory) === 'skincare'
        );
        setProducts(skincareProducts);
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  /* ---------------- ✅ Subcategories (dedupe) ---------------- */
  const subcategories = useMemo(() => {
    const seen = new Set();
    const unique = [];

    if (apiSubcategories.length > 0) {
      apiSubcategories.forEach((s) => {
        const name = typeof s === 'string' ? s : (s.name || '');
        const key = String(name).trim().toLowerCase();
        if (!key || seen.has(key)) return;
        seen.add(key);
        unique.push({
          id: s.id || unique.length,
          name: String(name).trim(),
          icon: s.icon || '🌸',
        });
      });
      return unique;
    }

    // ✅ Fallback — products se derive
    products.forEach((p) => {
      const name = String(p.subCategory || '').trim();
      const key = name.toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      unique.push({ id: unique.length, name, icon: '🌸' });
    });
    return unique;
  }, [apiSubcategories, products]);

  /* ---------------- Filters ---------------- */
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name?.toLowerCase().includes(t) || p.brand?.toLowerCase().includes(t)
      );
    }
    if (selectedSubcategory !== 'all') {
      filtered = filtered.filter(
        (p) => normalizeCategory(p.subCategory) === normalizeCategory(selectedSubcategory)
      );
    }
    if (selectedConcern !== 'all') {
      filtered = filtered.filter((p) => (p.skinConcerns || []).includes(selectedConcern));
    }
    if (selectedBrand !== 'all') {
      filtered = filtered.filter((p) => p.brand === selectedBrand);
    }
    if (selectedSkinType !== 'all') {
      filtered = filtered.filter((p) => (p.skinType || 'all') === selectedSkinType);
    }
    let min = 0, max = Infinity;
    if (priceRange !== 'all') {
      switch (priceRange) {
        case 'under500': max = 500; break;
        case '500-1000': min = 500; max = 1000; break;
        case '1000-2000': min = 1000; max = 2000; break;
        case '2000-5000': min = 2000; max = 5000; break;
        case 'above5000': min = 5000; break;
      }
    }
    filtered = filtered.filter((p) => p.price >= min && p.price <= max);
    switch (sortBy) {
      case 'price_low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price_high': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
        break;
    }
    return filtered;
  }, [products, searchTerm, selectedSubcategory, selectedConcern, selectedBrand, selectedSkinType, priceRange, sortBy]);

  const concerns = useMemo(() => {
    const all = products.flatMap((p) => p.skinConcerns || []).filter(Boolean);
    return [...new Set(all)];
  }, [products]);

  const brands = useMemo(() => {
    const unique = [...new Set(products.map((p) => p.brand).filter(Boolean))];
    return [{ id: 'all', name: 'All Brands' }, ...unique.map((b) => ({ id: b, name: b }))];
  }, [products]);

  const skinTypes = [
    { id: 'all', name: 'All Skin Types' },
    { id: 'oily', name: 'Oily' },
    { id: 'dry', name: 'Dry' },
    { id: 'combination', name: 'Combination' },
    { id: 'sensitive', name: 'Sensitive' },
    { id: 'normal', name: 'Normal' },
  ];

  const priceRanges = [
    { id: 'all', name: 'All Prices' },
    { id: 'under500', name: 'Under ₹500' },
    { id: '500-1000', name: '₹500 – ₹1000' },
    { id: '1000-2000', name: '₹1000 – ₹2000' },
    { id: '2000-5000', name: '₹2000 – ₹5000' },
    { id: 'above5000', name: 'Above ₹5000' },
  ];

  const sortOptions = [
    { id: 'default', name: 'Featured' },
    { id: 'price_low', name: 'Price: Low to High' },
    { id: 'price_high', name: 'Price: High to Low' },
    { id: 'rating', name: 'Top Rated' },
    { id: 'newest', name: 'Newest First' },
  ];

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSubcategory('all');
    setSelectedConcern('all');
    setSelectedBrand('all');
    setSelectedSkinType('all');
    setPriceRange('all');
    setSortBy('default');
  };

  /* ---------------- ✅ Top 4 products ---------------- */
  const topProducts = useMemo(() => {
    return filteredProducts.slice(0, 4);
  }, [filteredProducts]);

  /* ---------------- ✅ Baaki products ko subcategory-wise group ---------------- */
  const groupedBySubcategory = useMemo(() => {
    const topIds = new Set(topProducts.map((p) => p.id));
    const groups = {};
    filteredProducts
      .filter((p) => !topIds.has(p.id))
      .forEach((p) => {
        const sub = p.subCategory || 'Other';
        if (!groups[sub]) groups[sub] = [];
        groups[sub].push(p);
      });
    return groups;
  }, [filteredProducts, topProducts]);

  /* ---------------- Banner groups ---------------- */
  const heroBanners = bannersByPosition.category_hero || bannersByPosition.skincare_hero || [];
  const midBanners1 = bannersByPosition.skincare_mid_1 || bannersByPosition.category_mid_1 || [];
  const midBanners2 = bannersByPosition.skincare_mid_2 || bannersByPosition.category_mid_2 || [];
  const bottomBanners = bannersByPosition.skincare_bottom || bannersByPosition.category_bottom || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters =
    selectedSubcategory !== 'all' ||
    searchTerm ||
    selectedConcern !== 'all' ||
    selectedBrand !== 'all' ||
    selectedSkinType !== 'all' ||
    priceRange !== 'all';

  return (
    <>
      <Helmet>
        <title>Skincare — Curated Beauty | MyPinkShop</title>
        <meta name="description" content="Discover our curated collection of premium skincare. Face washes, serums, moisturizers, and more." />
        <link rel="canonical" href="https://www.mypinkshop.com/skincare" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <OfferBanner />

        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-pink-100/70 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200/50 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">MyPinkShop</h1>
                  <p className="text-[9px] tracking-[0.25em] text-pink-400 uppercase">For the Girlies ✨</p>
                </div>
              </Link>

              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search skincare..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 sm:px-5 py-2 sm:py-2.5 bg-pink-50/50 border border-pink-100 rounded-full text-sm text-gray-700 placeholder-pink-300 focus:outline-none focus:border-pink-400 focus:bg-white transition-all"
                  />
                  <svg className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1">
                <button onClick={() => navigate('/wishlist')} className="relative p-2 sm:p-2.5 hover:bg-pink-50 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center shadow-sm">{wishlistCount}</span>}
                </button>
                <Link to="/cart" className="relative p-2 sm:p-2.5 hover:bg-pink-50 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center shadow-sm">{cartCount}</span>}
                </Link>
                {user ? <Avatar user={user} onLogout={logout} /> :
                  <Link to="/login" className="p-2 sm:p-2.5 hover:bg-pink-50 rounded-full transition-colors">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                }
              </div>
            </div>
          </div>
        </header>

        {/* HERO TEXT */}
        <section className="relative bg-gradient-to-br from-pink-100 via-rose-50 to-pink-100 border-b border-pink-100">
          <div className="max-w-7xl mx-auto px-4 py-10 sm:py-20 text-center">
            <p className="text-[11px] tracking-[0.4em] text-pink-500 uppercase mb-3 sm:mb-4 font-medium">The Skincare Edit</p>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-light text-gray-800 mb-4 sm:mb-5 leading-tight">
              Glow, <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent font-semibold">Beautifully</span>
            </h1>
            <div className="w-16 h-px bg-gradient-to-r from-pink-400 to-rose-400 mx-auto mb-4 sm:mb-5"></div>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed px-2">
              Curated skincare formulas for luminous, healthy skin — thoughtfully selected for the modern woman.
            </p>
          </div>
        </section>

        {/* ✅ HERO BANNER — FULL WIDTH */}
        {heroBanners.length > 0 && (
          <section className="w-full">
            <BannerRenderer banners={heroBanners} />
          </section>
        )}

        {/* TOP OFFERS */}
        {topOffers.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {topOffers.map((offer, idx) => (
                <div key={offer.id || idx} className="shrink-0 min-w-[260px] sm:min-w-[320px] bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl px-5 py-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{offer.icon || '🎉'}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{offer.title}</p>
                      <p className="text-xs opacity-90 truncate">{offer.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BREADCRUMB */}
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5">
          <div className="flex items-center gap-2 text-xs tracking-wider text-gray-400">
            <Link to="/" className="hover:text-pink-500 transition-colors">HOME</Link>
            <span className="text-pink-300">/</span>
            <span className="text-pink-600 font-medium">SKINCARE</span>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          <div className="flex gap-6 lg:gap-10">

            {/* SIDEBAR */}
            <aside className={`fixed md:static inset-0 z-40 md:z-0 ${showSidebar ? '' : 'hidden md:block'} md:w-64 shrink-0`}>
              {showSidebar && (
                <div className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30" onClick={() => setShowSidebar(false)} />
              )}
              <div className={`${showSidebar ? 'fixed top-0 left-0 h-full w-72 z-40 overflow-y-auto bg-white shadow-2xl' : 'bg-white/70 backdrop-blur-sm rounded-3xl border border-pink-100 shadow-sm'} overflow-hidden`}>
                <div className="px-5 py-4 border-b border-pink-100/70 bg-gradient-to-r from-pink-50 to-rose-50 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 text-sm tracking-wide">Categories</h3>
                  {showSidebar && (
                    <button onClick={() => setShowSidebar(false)} className="md:hidden text-gray-400 text-lg">✕</button>
                  )}
                </div>
                <nav className="p-2 max-h-[600px] overflow-y-auto">
                  <button
                    onClick={() => { setSelectedSubcategory('all'); setShowSidebar(false); }}
                    className={`w-full text-left px-4 py-3 text-sm transition-all rounded-2xl flex items-center gap-3 mb-1 ${
                      selectedSubcategory === 'all'
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium shadow-md shadow-pink-200/50'
                        : 'text-gray-700 hover:bg-pink-50'
                    }`}
                  >
                    <span className="text-base">✨</span>
                    <span>All Products</span>
                  </button>
                  {subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => { setSelectedSubcategory(sub.name); setShowSidebar(false); }}
                      className={`w-full text-left px-4 py-3 text-sm transition-all rounded-2xl flex items-center gap-3 mb-1 ${
                        selectedSubcategory === sub.name
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium shadow-md shadow-pink-200/50'
                          : 'text-gray-700 hover:bg-pink-50'
                      }`}
                    >
                      <span className="text-base">{sub.icon || '🌸'}</span>
                      <span className="truncate">{sub.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* PRODUCTS */}
            <main className="flex-1 min-w-0">
              {/* Mobile filter buttons */}
              <div className="md:hidden mb-4 flex gap-2">
                <button onClick={() => setShowSidebar(true)} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-xs tracking-widest uppercase font-medium shadow-md">
                  Categories
                </button>
                <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2.5 border border-pink-200 rounded-full text-xs tracking-widest uppercase font-medium text-pink-600 bg-white">
                  Filters
                </button>
              </div>

              {/* Concerns */}
              {concerns.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-[11px] tracking-[0.3em] text-pink-500 uppercase mb-3 sm:mb-4 font-semibold">Shop by Concern</h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <button onClick={() => setSelectedConcern('all')} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs tracking-wider border ${selectedConcern === 'all' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow-md' : 'bg-white text-gray-600 border-pink-200 hover:border-pink-400'}`}>All</button>
                    {concerns.map((c) => (
                      <button key={c} onClick={() => setSelectedConcern(c)} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs tracking-wider border ${selectedConcern === c ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow-md' : 'bg-white text-gray-600 border-pink-200 hover:border-pink-400'}`}>{c}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter bar (desktop) */}
              <div className="mb-6 pb-5 border-b border-pink-100">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="hidden md:flex gap-2 flex-wrap">
                    <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="px-3 sm:px-4 py-2 bg-white border border-pink-200 rounded-full text-xs tracking-wider text-gray-700 focus:outline-none focus:border-pink-400">
                      {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <select value={selectedSkinType} onChange={(e) => setSelectedSkinType(e.target.value)} className="px-3 sm:px-4 py-2 bg-white border border-pink-200 rounded-full text-xs tracking-wider text-gray-700 focus:outline-none focus:border-pink-400">
                      {skinTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="px-3 sm:px-4 py-2 bg-white border border-pink-200 rounded-full text-xs tracking-wider text-gray-700 focus:outline-none focus:border-pink-400">
                      {priceRanges.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="text-[10px] sm:text-[11px] tracking-wider text-pink-500 uppercase underline underline-offset-4">Clear</button>
                    )}
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 sm:px-4 py-2 bg-white border border-pink-200 rounded-full text-xs tracking-wider text-gray-700 focus:outline-none focus:border-pink-400">
                      {sortOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Mobile filters drawer */}
              {showFilters && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilters(false)}>
                  <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-pink-100">
                      <h3 className="font-semibold text-gray-800 text-base">Refine</h3>
                      <button onClick={() => setShowFilters(false)} className="text-gray-400 text-xl">✕</button>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-[11px] tracking-widest text-pink-500 uppercase mb-2 font-semibold">Brand</label>
                        <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full p-3 bg-pink-50/50 border border-pink-100 rounded-xl text-sm">
                          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] tracking-widest text-pink-500 uppercase mb-2 font-semibold">Skin Type</label>
                        <select value={selectedSkinType} onChange={(e) => setSelectedSkinType(e.target.value)} className="w-full p-3 bg-pink-50/50 border border-pink-100 rounded-xl text-sm">
                          {skinTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] tracking-widest text-pink-500 uppercase mb-2 font-semibold">Price</label>
                        <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full p-3 bg-pink-50/50 border border-pink-100 rounded-xl text-sm">
                          {priceRanges.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                      <button onClick={clearFilters} className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-xs tracking-widest uppercase font-medium shadow-md">Clear All</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Count */}
              <div className="mb-4 sm:mb-6">
                <p className="text-xs tracking-wider text-gray-400">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                  {selectedSubcategory !== 'all' && <span className="text-pink-600 font-medium"> · {selectedSubcategory}</span>}
                </p>
              </div>

              {/* ✅ EMPTY STATE */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 sm:p-16 text-center border border-pink-100 shadow-sm">
                  <div className="text-4xl mb-4">🌸</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Nothing here yet</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    {selectedSubcategory !== 'all' ? `We're adding ${selectedSubcategory} soon.` : 'New arrivals coming soon.'}
                  </p>
                  <button onClick={clearFilters} className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-xs tracking-widest uppercase font-medium shadow-md">
                    View All
                  </button>
                </div>
              ) : hasActiveFilters ? (
                /* ✅ Filter active — flat grid */
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
                  {filteredProducts.slice(0, visibleCount).map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isInWishlist={isInWishlist}
                      addToWishlist={addToWishlist}
                      removeFromWishlist={removeFromWishlist}
                      user={user}
                      wishlistContext={wishlist}
                    />
                  ))}
                </div>
              ) : (
                /* ✅ No filter — Top 4 + Subcategory sections */
                <>
                  {/* Top 4 */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
                    {topProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        isInWishlist={isInWishlist}
                        addToWishlist={addToWishlist}
                        removeFromWishlist={removeFromWishlist}
                        user={user}
                        wishlistContext={wishlist}
                      />
                    ))}
                  </div>

                  {/* Mid Banner 1 — full width */}
                  {midBanners1.length > 0 && (
                    <section className="w-full my-6 sm:my-8">
                      <BannerRenderer banners={midBanners1} />
                    </section>
                  )}

                  {/* Subcategory sections */}
                  {Object.entries(groupedBySubcategory).map(([subName, subProducts], idx) => {
                    if (!subProducts.length) return null;
                    return (
                      <Fragment key={subName}>
                        <section className="my-8 sm:my-10">
                          <div className="flex items-center gap-3 mb-4 sm:mb-5">
                            <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-pink-400 to-rose-500 rounded-full"></div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800">{subName}</h3>
                            <span className="text-xs text-pink-400 font-medium">({subProducts.length})</span>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
                            {subProducts.slice(0, 8).map((product) => (
                              <ProductCard
                                key={product.id}
                                product={product}
                                isInWishlist={isInWishlist}
                                addToWishlist={addToWishlist}
                                removeFromWishlist={removeFromWishlist}
                                user={user}
                                wishlistContext={wishlist}
                              />
                            ))}
                          </div>
                        </section>

                        {/* Mid Banner 2 — after first subcategory */}
                        {idx === 0 && midBanners2.length > 0 && (
                          <section className="w-full my-6 sm:my-8">
                            <BannerRenderer banners={midBanners2} />
                          </section>
                        )}
                      </Fragment>
                    );
                  })}

                  {/* Mid offers */}
                  {midOffers.length > 0 && (
                    <div className="my-6 sm:my-8 space-y-3">
                      {midOffers.map((offer, i) => (
                        <div key={offer.id || i} className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 text-white rounded-2xl p-4 flex items-center gap-4 shadow-md">
                          <span className="text-3xl">{offer.icon || '🎉'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm sm:text-base truncate">{offer.title}</p>
                            <p className="text-xs opacity-90 truncate">{offer.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* BOTTOM BANNER — full width */}
              {bottomBanners.length > 0 && (
                <section className="w-full mt-10 sm:mt-12">
                  <BannerRenderer banners={bottomBanners} />
                </section>
              )}
            </main>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-400 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <h3 className="font-bold text-white text-lg">MyPinkShop</h3>
                </div>
                <p className="text-xs leading-relaxed text-gray-500">Luxe beauty essentials, thoughtfully curated for the girlies ✨</p>
              </div>
              <div>
                <h4 className="text-white text-sm mb-4 tracking-wide font-semibold">Shop</h4>
                <ul className="space-y-2.5 text-xs">
                  <li><Link to="/skincare" className="hover:text-pink-400 transition-colors">Skincare</Link></li>
                  <li><Link to="/makeup" className="hover:text-pink-400 transition-colors">Makeup</Link></li>
                  <li><Link to="/hair" className="hover:text-pink-400 transition-colors">Haircare</Link></li>
                  <li><Link to="/clothing" className="hover:text-pink-400 transition-colors">Fashion</Link></li>
                  <li><Link to="/accessories" className="hover:text-pink-400 transition-colors">Accessories</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white text-sm mb-4 tracking-wide font-semibold">Support</h4>
                <ul className="space-y-2.5 text-xs">
                  <li><Link to="/contact" className="hover:text-pink-400 transition-colors">Contact</Link></li>
                  <li><Link to="/faqs" className="hover:text-pink-400 transition-colors">FAQs</Link></li>
                  <li><Link to="/shipping-info" className="hover:text-pink-400 transition-colors">Shipping</Link></li>
                  <li><Link to="/returns-policy" className="hover:text-pink-400 transition-colors">Returns</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white text-sm mb-4 tracking-wide font-semibold">Follow</h4>
                <ul className="space-y-2.5 text-xs">
                  <li><a href="https://www.instagram.com/mypinkshopofficial" className="hover:text-pink-400 transition-colors">Instagram</a></li>
                  <li><a href="https://www.facebook.com/mypinkshopofficial" className="hover:text-pink-400 transition-colors">Facebook</a></li>
                </ul>
              </div>
            </div>
            <div className="text-center pt-8 border-t border-gray-800">
              <p className="text-[11px] tracking-widest text-gray-500 uppercase">© 2026 MyPinkShop · All Rights Reserved</p>
            </div>
          </div>
        </footer>

        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    </>
  );
}

export default SkincarePage;
