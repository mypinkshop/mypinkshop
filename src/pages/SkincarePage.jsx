import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

function SkincarePage() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlist, wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [apiSubcategories, setApiSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // ✅ API se subcategories fetch karo
  useEffect(() => {
    const loadCategory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/categories/tree`);
        if (!res.ok) throw new Error('Failed to load categories');
        const json = await res.json();
        const tree = json.data || json;
        const found = tree.find(c => c.slug === 'skincare');
        if (found) setApiSubcategories(found.children || []);
      } catch (err) {
        console.error('Category load error:', err);
      }
    };
    loadCategory();
  }, []);

  // ✅ Products fetch karo
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/products`);
        if (!response.ok) throw new Error('Failed to load products');
        const data = await response.json();
        const productsArray = Array.isArray(data) ? data : (data.data || []);

        const skincareProducts = productsArray.filter(p =>
          (p.is_active === 1 || p.isActive === true || p.isActive === 1) &&
          (p.main_category === 'Skincare' || p.mainCategory === 'Skincare' || p.category === 'Skincare')
        ).map(p => {
          let images = p.images;
          if (typeof images === 'string') {
            try { images = JSON.parse(images || '[]'); } catch { images = []; }
          }
          let concerns = p.concerns;
          if (typeof concerns === 'string') {
            try { concerns = JSON.parse(concerns || '[]'); } catch { concerns = []; }
          }
          return {
            ...p,
            id: p.id || p._id,
            _id: p._id || p.id,
            images: images || [],
            subCategory: p.sub_category || p.subCategory || '',
            mainCategory: p.main_category || p.mainCategory || '',
            originalPrice: p.original_price || p.originalPrice || 0,
            skinConcerns: concerns || [],
            skinType: p.skin_type || p.skinType || 'all',
          };
        });

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

  // ✅ Subcategories
  const subcategories = useMemo(() => {
    if (apiSubcategories.length > 0) {
      return apiSubcategories.map(s => ({
        id: s.id,
        name: s.name,
        icon: s.icon || '◇',
      }));
    }
    const subs = [...new Set(products.map(p => p.subCategory).filter(Boolean))];
    return subs.map((s, idx) => ({ id: idx, name: s, icon: '◇' }));
  }, [apiSubcategories, products]);

  // ✅ Filters
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(t) || p.brand?.toLowerCase().includes(t)
      );
    }
    if (selectedSubcategory !== 'all') {
      filtered = filtered.filter(p =>
        (p.subCategory || '').toLowerCase() === selectedSubcategory.toLowerCase()
      );
    }
    if (selectedConcern !== 'all') {
      filtered = filtered.filter(p => (p.skinConcerns || []).includes(selectedConcern));
    }
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(p => p.brand === selectedBrand);
    }
    if (selectedSkinType !== 'all') {
      filtered = filtered.filter(p => (p.skinType || 'all') === selectedSkinType);
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
    filtered = filtered.filter(p => p.price >= min && p.price <= max);
    switch (sortBy) {
      case 'price_low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price_high': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest': filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
    }
    return filtered;
  }, [products, searchTerm, selectedSubcategory, selectedConcern, selectedBrand, selectedSkinType, priceRange, sortBy]);

  const concerns = useMemo(() => {
    const all = products.flatMap(p => p.skinConcerns || []).filter(Boolean);
    return [...new Set(all)];
  }, [products]);

  const brands = useMemo(() => {
    const unique = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return [{ id: 'all', name: 'All Brands' }, ...unique.map(b => ({ id: b, name: b }))];
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-[#c9a87c] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#8b7d6b] text-sm tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Skincare — Curated Luxury Skincare | MyPinkShop</title>
        <meta name="description" content="Discover our curated collection of premium skincare. Face washes, serums, moisturizers, and more." />
        <link rel="canonical" href="https://www.mypinkshop.com/skincare" />
      </Helmet>

      <div className="min-h-screen bg-[#faf7f5]">
        <OfferBanner />

        {/* ═══════════ PREMIUM HEADER ═══════════ */}
        <header className="sticky top-0 z-50 bg-[#faf7f5]/95 backdrop-blur-xl border-b border-[#e8ddd0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className="flex items-center gap-3 shrink-0 group">
                <div className="w-10 h-10 bg-gradient-to-br from-[#d4a574] via-[#c9a87c] to-[#b8935f] rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                  <span className="text-white font-serif font-bold text-lg">M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-serif font-semibold tracking-wide text-[#3d3229]">MyPinkShop</h1>
                  <p className="text-[10px] tracking-[0.3em] text-[#8b7d6b] uppercase">Luxe Beauty</p>
                </div>
              </Link>

              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search skincare..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-5 py-2.5 bg-white border border-[#e8ddd0] rounded-full text-sm text-[#3d3229] placeholder-[#b0a695] focus:outline-none focus:border-[#c9a87c] transition-colors"
                  />
                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0a695]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => navigate('/wishlist')} className="relative p-2.5 hover:bg-[#f5ede4] rounded-full transition-colors">
                  <svg className="w-5 h-5 text-[#3d3229]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-[#c9a87c] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{wishlistCount}</span>}
                </button>
                <Link to="/cart" className="relative p-2.5 hover:bg-[#f5ede4] rounded-full transition-colors">
                  <svg className="w-5 h-5 text-[#3d3229]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-[#c9a87c] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
                </Link>
                {user ? <Avatar user={user} onLogout={logout} /> :
                  <Link to="/login" className="p-2.5 hover:bg-[#f5ede4] rounded-full transition-colors">
                    <svg className="w-5 h-5 text-[#3d3229]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                }
              </div>
            </div>
          </div>
        </header>

        {/* ═══════════ ELEGANT HERO ═══════════ */}
        <section className="relative bg-gradient-to-b from-[#f5ede4] to-[#faf7f5] border-b border-[#e8ddd0]">
          <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
            <p className="text-[11px] tracking-[0.4em] text-[#b8935f] uppercase mb-4">The Skincare Edit</p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light text-[#3d3229] mb-5 leading-tight">
              Radiance, Refined
            </h1>
            <div className="w-16 h-px bg-[#c9a87c] mx-auto mb-5"></div>
            <p className="text-[#8b7d6b] text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed">
              Curated formulas for luminous, healthy skin — thoughtfully selected from the world's most refined houses.
            </p>
          </div>
        </section>

        {/* ═══════════ BREADCRUMB ═══════════ */}
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center gap-2 text-xs tracking-wider text-[#8b7d6b]">
            <Link to="/" className="hover:text-[#3d3229] transition-colors">HOME</Link>
            <span className="text-[#d4c7b5]">/</span>
            <span className="text-[#3d3229] font-medium">SKINCARE</span>
          </div>
        </div>

        {/* ═══════════ MAIN LAYOUT ═══════════ */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          <div className="flex gap-8 lg:gap-10">

            {/* ═══ LEFT SIDEBAR ═══ */}
            <aside className={`fixed md:static inset-0 z-40 md:z-0 ${showSidebar ? '' : 'hidden md:block'} md:w-64 shrink-0`}>
              {showSidebar && (
                <div className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30" onClick={() => setShowSidebar(false)} />
              )}

              <div className={`${showSidebar ? 'fixed top-0 left-0 h-full w-72 z-40 overflow-y-auto bg-white' : 'bg-transparent'}`}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e8ddd0]">
                  <h3 className="font-serif text-lg text-[#3d3229] tracking-wide">Categories</h3>
                  {showSidebar && (
                    <button onClick={() => setShowSidebar(false)} className="md:hidden text-[#8b7d6b] text-xl p-2">✕</button>
                  )}
                </div>

                {/* Sidebar Items */}
                <nav className="space-y-0.5">
                  <button
                    onClick={() => { setSelectedSubcategory('all'); setShowSidebar(false); }}
                    className={`w-full text-left px-4 py-3 text-sm tracking-wide transition-all duration-200 rounded-lg flex items-center gap-3 ${
                      selectedSubcategory === 'all'
                        ? 'bg-[#3d3229] text-white font-medium'
                        : 'text-[#5a4d40] hover:bg-[#f5ede4] hover:pl-5'
                    }`}
                  >
                    <span className="text-base">✦</span>
                    <span>All Products</span>
                  </button>

                  {subcategories.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => { setSelectedSubcategory(sub.name); setShowSidebar(false); }}
                      className={`w-full text-left px-4 py-3 text-sm tracking-wide transition-all duration-200 rounded-lg flex items-center gap-3 ${
                        selectedSubcategory === sub.name
                          ? 'bg-[#3d3229] text-white font-medium'
                          : 'text-[#5a4d40] hover:bg-[#f5ede4] hover:pl-5'
                      }`}
                    >
                      <span className="text-[#c9a87c] text-xs">◇</span>
                      <span className="truncate">{sub.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* ═══ RIGHT: PRODUCTS ═══ */}
            <main className="flex-1 min-w-0">

              {/* Mobile: Sidebar + Filters Buttons */}
              <div className="md:hidden mb-5 flex gap-2">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="flex-1 px-4 py-3 bg-[#3d3229] text-white rounded-full text-xs tracking-widest uppercase font-medium"
                >
                  Categories
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-3 border border-[#e8ddd0] rounded-full text-xs tracking-widest uppercase font-medium text-[#3d3229] bg-white"
                >
                  Filters
                </button>
              </div>

              {/* Shop by Concern */}
              {concerns.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-[11px] tracking-[0.3em] text-[#b8935f] uppercase mb-4">Shop by Concern</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedConcern('all')}
                      className={`px-4 py-2 rounded-full text-xs tracking-wider transition-all duration-200 border ${
                        selectedConcern === 'all'
                          ? 'bg-[#3d3229] text-white border-[#3d3229]'
                          : 'bg-white text-[#5a4d40] border-[#e8ddd0] hover:border-[#c9a87c]'
                      }`}
                    >
                      All
                    </button>
                    {concerns.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedConcern(c)}
                        className={`px-4 py-2 rounded-full text-xs tracking-wider transition-all duration-200 border ${
                          selectedConcern === c
                            ? 'bg-[#3d3229] text-white border-[#3d3229]'
                            : 'bg-white text-[#5a4d40] border-[#e8ddd0] hover:border-[#c9a87c]'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters Bar */}
              <div className="mb-8 pb-6 border-b border-[#e8ddd0]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="hidden md:flex gap-3 flex-wrap">
                    <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="px-4 py-2.5 bg-white border border-[#e8ddd0] rounded-full text-xs tracking-wider text-[#3d3229] focus:outline-none focus:border-[#c9a87c] cursor-pointer">
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <select value={selectedSkinType} onChange={(e) => setSelectedSkinType(e.target.value)} className="px-4 py-2.5 bg-white border border-[#e8ddd0] rounded-full text-xs tracking-wider text-[#3d3229] focus:outline-none focus:border-[#c9a87c] cursor-pointer">
                      {skinTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="px-4 py-2.5 bg-white border border-[#e8ddd0] rounded-full text-xs tracking-wider text-[#3d3229] focus:outline-none focus:border-[#c9a87c] cursor-pointer">
                      {priceRanges.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 ml-auto">
                    {(selectedSubcategory !== 'all' || selectedBrand !== 'all' || selectedConcern !== 'all' || selectedSkinType !== 'all' || priceRange !== 'all' || searchTerm) && (
                      <button onClick={clearFilters} className="text-[11px] tracking-wider text-[#b8935f] uppercase underline underline-offset-4 hover:text-[#3d3229] transition-colors">
                        Clear All
                      </button>
                    )}
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2.5 bg-white border border-[#e8ddd0] rounded-full text-xs tracking-wider text-[#3d3229] focus:outline-none focus:border-[#c9a87c] cursor-pointer">
                      {sortOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Mobile Filters Modal */}
              {showFilters && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilters(false)}>
                  <div className="absolute right-0 top-0 h-full w-80 bg-[#faf7f5] shadow-2xl p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#e8ddd0]">
                      <h3 className="font-serif text-lg text-[#3d3229]">Refine</h3>
                      <button onClick={() => setShowFilters(false)} className="text-[#8b7d6b] text-xl">✕</button>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-[11px] tracking-widest text-[#b8935f] uppercase mb-2">Brand</label>
                        <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full p-3 bg-white border border-[#e8ddd0] rounded-lg text-sm text-[#3d3229]">
                          {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] tracking-widest text-[#b8935f] uppercase mb-2">Skin Type</label>
                        <select value={selectedSkinType} onChange={(e) => setSelectedSkinType(e.target.value)} className="w-full p-3 bg-white border border-[#e8ddd0] rounded-lg text-sm text-[#3d3229]">
                          {skinTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] tracking-widest text-[#b8935f] uppercase mb-2">Price</label>
                        <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full p-3 bg-white border border-[#e8ddd0] rounded-lg text-sm text-[#3d3229]">
                          {priceRanges.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                      <button onClick={clearFilters} className="w-full py-3 bg-[#3d3229] text-white rounded-full text-xs tracking-widest uppercase mt-4">Clear All</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Info */}
              <div className="mb-6">
                <p className="text-xs tracking-wider text-[#8b7d6b]">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                  {selectedSubcategory !== 'all' && <span className="text-[#3d3229]"> · {selectedSubcategory}</span>}
                </p>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center border border-[#e8ddd0]">
                  <div className="font-serif text-4xl text-[#c9a87c] mb-4">✦</div>
                  <h3 className="font-serif text-xl text-[#3d3229] mb-2">Nothing here yet</h3>
                  <p className="text-sm text-[#8b7d6b] mb-6">
                    {selectedSubcategory !== 'all' ? `We're adding ${selectedSubcategory} soon.` : 'New arrivals coming soon.'}
                  </p>
                  <button onClick={clearFilters} className="px-8 py-3 bg-[#3d3229] text-white rounded-full text-xs tracking-widest uppercase hover:bg-[#5a4d40] transition-colors">
                    View All
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                    {filteredProducts.slice(0, visibleCount).map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        addToCart={addToCart}
                        isInWishlist={isInWishlist}
                        addToWishlist={addToWishlist}
                        removeFromWishlist={removeFromWishlist}
                        user={user}
                        wishlistContext={wishlist}
                      />
                    ))}
                  </div>

                  {visibleCount < filteredProducts.length && (
                    <div className="text-center mt-12">
                      <button
                        onClick={() => setVisibleCount(prev => prev + 16)}
                        className="px-10 py-3.5 border border-[#3d3229] text-[#3d3229] rounded-full text-xs tracking-[0.25em] uppercase hover:bg-[#3d3229] hover:text-white transition-all duration-300"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className="bg-[#3d3229] text-[#d4c7b5] py-16 mt-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#d4a574] to-[#b8935f] rounded-full flex items-center justify-center">
                    <span className="text-white font-serif font-bold text-sm">M</span>
                  </div>
                  <h3 className="font-serif font-semibold text-white text-lg">MyPinkShop</h3>
                </div>
                <p className="text-xs leading-relaxed text-[#b0a695]">Luxe beauty essentials, thoughtfully curated.</p>
              </div>
              <div>
                <h4 className="font-serif text-white text-sm mb-4 tracking-wide">Shop</h4>
                <ul className="space-y-2.5 text-xs">
                  <li><Link to="/skincare" className="hover:text-[#c9a87c] transition-colors">Skincare</Link></li>
                  <li><Link to="/makeup" className="hover:text-[#c9a87c] transition-colors">Makeup</Link></li>
                  <li><Link to="/hair" className="hover:text-[#c9a87c] transition-colors">Haircare</Link></li>
                  <li><Link to="/clothing" className="hover:text-[#c9a87c] transition-colors">Fashion</Link></li>
                  <li><Link to="/accessories" className="hover:text-[#c9a87c] transition-colors">Accessories</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-serif text-white text-sm mb-4 tracking-wide">Support</h4>
                <ul className="space-y-2.5 text-xs">
                  <li><Link to="/contact" className="hover:text-[#c9a87c] transition-colors">Contact</Link></li>
                  <li><Link to="/faqs" className="hover:text-[#c9a87c] transition-colors">FAQs</Link></li>
                  <li><Link to="/shipping-info" className="hover:text-[#c9a87c] transition-colors">Shipping</Link></li>
                  <li><Link to="/returns-policy" className="hover:text-[#c9a87c] transition-colors">Returns</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-serif text-white text-sm mb-4 tracking-wide">Follow</h4>
                <ul className="space-y-2.5 text-xs">
                  <li><a href="#" className="hover:text-[#c9a87c] transition-colors">Instagram</a></li>
                  <li><a href="#" className="hover:text-[#c9a87c] transition-colors">Pinterest</a></li>
                </ul>
              </div>
            </div>
            <div className="text-center pt-8 border-t border-[#5a4d40]">
              <p className="text-[11px] tracking-widest text-[#8b7d6b] uppercase">© 2026 MyPinkShop · All Rights Reserved</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default SkincarePage;
