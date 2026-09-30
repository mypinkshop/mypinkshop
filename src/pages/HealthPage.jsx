// src/pages/HealthPage.jsx
import { useState, useEffect, useMemo, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import ProductCard from '../components/ProductCard';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

function HealthPage() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlist, wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [apiSubcategories, setApiSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [heroBanner, setHeroBanner] = useState(null);
  const [midBanners, setMidBanners] = useState([]);
  const [bottomBanner, setBottomBanner] = useState(null);
  const [topOffers, setTopOffers] = useState([]);
  const [midOffers, setMidOffers] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [visibleCount, setVisibleCount] = useState(16);

  const SLUG = 'health-wellness';

  useEffect(() => {
    const loadAll = async () => {
      try {
        const catRes = await fetch(`${API_URL}/api/categories/tree`);
        const catJson = await catRes.json();
        const tree = catJson.data || catJson;
        const found = tree.find(c => c.slug === SLUG);
        if (found) setApiSubcategories(found.children || []);

        const bannerRes = await fetch(`${API_URL}/api/banners/active?category=${SLUG}`);
        const bannerJson = await bannerRes.json();
        const banners = Array.isArray(bannerJson) ? bannerJson : (bannerJson.data || []);

        setHeroBanner(banners.find(b => b.position === 'category_hero') || null);
        setMidBanners(
          banners
            .filter(b => b.position && b.position.startsWith('category_mid'))
            .sort((a, b) => (a.position || '').localeCompare(b.position || ''))
        );
        setBottomBanner(banners.find(b => b.position === 'category_bottom') || null);

        const offerRes = await fetch(`${API_URL}/api/offers/active?category=${SLUG}`);
        const offerJson = await offerRes.json();
        const offers = Array.isArray(offerJson) ? offerJson : (offerJson.data || []);

        setTopOffers(offers.filter(o => o.position === 'category_top' || o.position === 'top_banner'));
        setMidOffers(offers.filter(o => o.position === 'category_mid'));
      } catch (err) {
        console.error('Load error:', err);
      }
    };
    loadAll();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/api/products?category=${encodeURIComponent('Health & Wellness')}&limit=200`
        );
        if (!response.ok) throw new Error('Failed to load products');
        const data = await response.json();
        const productsArray = Array.isArray(data) ? data : (data.data || []);

        const filtered = productsArray.map(p => {
          let images = p.images;
          if (typeof images === 'string') {
            try { images = JSON.parse(images || '[]'); } catch { images = []; }
          }
          return {
            ...p,
            id: p.id || p._id,
            _id: p._id || p.id,
            images: images || [],
            subCategory: p.sub_category || p.subCategory || '',
            mainCategory: p.main_category || p.mainCategory || '',
            originalPrice: p.original_price || p.originalPrice || 0,
          };
        });

        setProducts(filtered);
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const subcategories = useMemo(() => {
    const seen = new Set();
    const unique = [];
    if (apiSubcategories.length > 0) {
      apiSubcategories.forEach((s) => {
        const key = String(s.name || '').trim().toLowerCase();
        if (!key || seen.has(key)) return;
        seen.add(key);
        unique.push({ id: s.id, name: s.name, icon: s.icon || '💊' });
      });
      return unique;
    }
    products.forEach((p) => {
      const name = String(p.subCategory || '').trim();
      const key = name.toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      unique.push({ id: unique.length, name, icon: '💊' });
    });
    return unique;
  }, [apiSubcategories, products]);

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
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(p => p.brand === selectedBrand);
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
  }, [products, searchTerm, selectedSubcategory, selectedBrand, priceRange, sortBy]);

  const brands = useMemo(() => {
    const unique = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return [{ id: 'all', name: 'All Brands' }, ...unique.map(b => ({ id: b, name: b }))];
  }, [products]);

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
    setSelectedBrand('all');
    setPriceRange('all');
    setSortBy('default');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Health & Wellness — Live Healthy | MyPinkShop</title>
        <meta name="description" content="Shop health supplements, fitness gear, ayurvedic products, and more at MyPinkShop." />
        <link rel="canonical" href="https://www.mypinkshop.com/health" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <OfferBanner />

        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-emerald-100/70 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className="flex items-center gap-3 shrink-0 group">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/50 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">MyPinkShop</h1>
                  <p className="text-[9px] tracking-[0.25em] text-emerald-400 uppercase">For the Girlies ✨</p>
                </div>
              </Link>

              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search health & wellness..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-5 py-2.5 bg-emerald-50/50 border border-emerald-100 rounded-full text-sm text-gray-700 placeholder-emerald-300 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                  />
                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => navigate('/wishlist')} className="relative p-2.5 hover:bg-pink-50 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center shadow-sm">{wishlistCount}</span>}
                </button>
                <Link to="/cart" className="relative p-2.5 hover:bg-pink-50 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center shadow-sm">{cartCount}</span>}
                </Link>
                {user ? <Avatar user={user} onLogout={logout} /> :
                  <Link to="/login" className="p-2.5 hover:bg-pink-50 rounded-full transition-colors">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                }
              </div>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="relative bg-gradient-to-br from-green-100 via-emerald-50 to-green-100 border-b border-emerald-100">
          <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20 text-center">
            <p className="text-[11px] tracking-[0.4em] text-emerald-500 uppercase mb-4 font-medium">The Health & Wellness Edit</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light text-gray-800 mb-5 leading-tight">
              Live Healthy, <span className="bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent font-semibold">Live Happy</span>
            </h1>
            <div className="w-16 h-px bg-gradient-to-r from-emerald-400 to-green-400 mx-auto mb-5"></div>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed">
              Wellness essentials to nourish your body, mind, and soul.
            </p>
          </div>
        </section>

        {heroBanner && heroBanner.images?.[0] && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Link to={heroBanner.link || '/shop'}>
              <div className="relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-500">
                <img src={heroBanner.images[0]} alt={heroBanner.title} className="w-full h-48 sm:h-64 object-cover" />
                {heroBanner.showTextOverlay && (
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent flex items-center">
                    <div className="px-6 sm:px-12 text-white">
                      <h2 className="text-2xl sm:text-4xl font-bold mb-2">{heroBanner.title}</h2>
                      {heroBanner.subtitle && <p className="text-sm sm:text-lg mb-3 opacity-90">{heroBanner.subtitle}</p>}
                      {heroBanner.buttonText && (
                        <span className="inline-block bg-white text-emerald-600 px-6 py-2 rounded-full text-sm font-semibold shadow-md">
                          {heroBanner.buttonText}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          </div>
        )}

        {topOffers.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {topOffers.map((offer, idx) => (
                <div key={offer.id || idx} className="shrink-0 min-w-[260px] sm:min-w-[320px] bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl px-5 py-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{offer.icon || '💊'}</span>
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

        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center gap-2 text-xs tracking-wider text-gray-400">
            <Link to="/" className="hover:text-emerald-500 transition-colors">HOME</Link>
            <span className="text-emerald-300">/</span>
            <span className="text-emerald-600 font-medium">HEALTH & WELLNESS</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-20">
          <div className="flex gap-8 lg:gap-10">
            <aside className={`fixed md:static inset-0 z-40 md:z-0 ${showSidebar ? '' : 'hidden md:block'} md:w-64 shrink-0`}>
              {showSidebar && (
                <div className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30" onClick={() => setShowSidebar(false)} />
              )}
              <div className={`${showSidebar ? 'fixed top-0 left-0 h-full w-72 z-40 overflow-y-auto bg-white shadow-2xl' : 'bg-white/70 backdrop-blur-sm rounded-3xl border border-emerald-100 shadow-sm'} overflow-hidden`}>
                <div className="px-5 py-4 border-b border-emerald-100/70 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
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
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium shadow-md'
                        : 'text-gray-700 hover:bg-emerald-50'
                    }`}
                  >
                    <span className="text-base">✨</span>
                    <span>All Products</span>
                  </button>
                  {subcategories.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => { setSelectedSubcategory(sub.name); setShowSidebar(false); }}
                      className={`w-full text-left px-4 py-3 text-sm transition-all rounded-2xl flex items-center gap-3 mb-1 ${
                        selectedSubcategory === sub.name
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium shadow-md'
                          : 'text-gray-700 hover:bg-emerald-50'
                      }`}
                    >
                      <span className="text-base">{sub.icon || '💊'}</span>
                      <span className="truncate">{sub.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            <main className="flex-1 min-w-0">
              <div className="md:hidden mb-5 flex gap-2">
                <button onClick={() => setShowSidebar(true)} className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full text-xs tracking-widest uppercase font-medium shadow-md">
                  Categories
                </button>
                <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-3 border border-emerald-200 rounded-full text-xs tracking-widest uppercase font-medium text-emerald-600 bg-white">
                  Filters
                </button>
              </div>

              <div className="mb-8 pb-6 border-b border-emerald-100">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="hidden md:flex gap-3 flex-wrap">
                    <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="px-4 py-2.5 bg-white border border-emerald-200 rounded-full text-xs tracking-wider text-gray-700 focus:outline-none focus:border-emerald-400">
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="px-4 py-2.5 bg-white border border-emerald-200 rounded-full text-xs tracking-wider text-gray-700 focus:outline-none focus:border-emerald-400">
                      {priceRanges.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    {(selectedSubcategory !== 'all' || selectedBrand !== 'all' || priceRange !== 'all' || searchTerm) && (
                      <button onClick={clearFilters} className="text-[11px] tracking-wider text-emerald-500 uppercase underline underline-offset-4">Clear All</button>
                    )}
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2.5 bg-white border border-emerald-200 rounded-full text-xs tracking-wider text-gray-700 focus:outline-none focus:border-emerald-400">
                      {sortOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs tracking-wider text-gray-400">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                  {selectedSubcategory !== 'all' && <span className="text-emerald-600 font-medium"> · {selectedSubcategory}</span>}
                </p>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-16 text-center border border-emerald-100 shadow-sm">
                  <div className="text-4xl mb-4">💊</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Coming Soon</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    {selectedSubcategory !== 'all' ? `We're adding ${selectedSubcategory} soon.` : 'New arrivals coming soon.'}
                  </p>
                  <button onClick={clearFilters} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full text-xs tracking-widest uppercase font-medium shadow-md">
                    View All
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                  {filteredProducts.slice(0, visibleCount).map((product, index) => (
                    <Fragment key={product.id}>
                      <ProductCard
                        product={product}
                        addToCart={addToCart}
                        isInWishlist={isInWishlist}
                        addToWishlist={addToWishlist}
                        removeFromWishlist={removeFromWishlist}
                        user={user}
                        wishlistContext={wishlist}
                      />
                      {(index + 1) % 4 === 0 && midOffers[Math.floor(index / 4)] && (
                        <div className="col-span-full my-4">
                          <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 text-white rounded-2xl p-4 flex items-center gap-4 shadow-md">
                            <span className="text-3xl">{midOffers[Math.floor(index / 4)].icon || '💊'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm sm:text-base truncate">{midOffers[Math.floor(index / 4)].title}</p>
                              <p className="text-xs opacity-90 truncate">{midOffers[Math.floor(index / 4)].description}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {(index + 1) % 4 === 0 && midBanners[Math.floor(index / 4)] && (
                        <div className="col-span-full my-4">
                          <Link to={midBanners[Math.floor(index / 4)].link || '/shop'}>
                            <div className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition">
                              <img src={midBanners[Math.floor(index / 4)].images?.[0]} alt={midBanners[Math.floor(index / 4)].title} className="w-full h-32 sm:h-40 object-cover" />
                            </div>
                          </Link>
                        </div>
                      )}
                    </Fragment>
                  ))}
                </div>
              )}

              {visibleCount < filteredProducts.length && (
                <div className="text-center mt-12">
                  <button onClick={() => setVisibleCount(prev => prev + 16)} className="px-10 py-3.5 border-2 border-emerald-300 text-emerald-600 rounded-full text-xs tracking-[0.25em] uppercase font-semibold hover:bg-gradient-to-r hover:from-emerald-500 hover:to-green-500 hover:text-white hover:border-transparent transition-all duration-300">
                    Load More
                  </button>
                </div>
              )}

              {bottomBanner && bottomBanner.images?.[0] && (
                <div className="mt-12">
                  <Link to={bottomBanner.link || '/shop'}>
                    <div className="relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition">
                      <img src={bottomBanner.images[0]} alt={bottomBanner.title} className="w-full h-40 sm:h-56 object-cover" />
                      {bottomBanner.showTextOverlay && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center">
                          <div className="text-center text-white px-4">
                            <h3 className="text-2xl sm:text-3xl font-bold mb-2">{bottomBanner.title}</h3>
                            {bottomBanner.subtitle && <p className="text-sm sm:text-base opacity-90">{bottomBanner.subtitle}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              )}
            </main>
          </div>
        </div>

        <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-400 py-16 mt-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <h3 className="font-bold text-white text-lg">MyPinkShop</h3>
                </div>
                <p className="text-xs leading-relaxed text-gray-500">Luxe essentials, thoughtfully curated for the girlies ✨</p>
              </div>
              <div>
                <h4 className="text-white text-sm mb-4 tracking-wide font-semibold">Shop</h4>
                <ul className="space-y-2.5 text-xs">
                  <li><Link to="/skincare" className="hover:text-pink-400 transition-colors">Skincare</Link></li>
                  <li><Link to="/makeup" className="hover:text-pink-400 transition-colors">Makeup</Link></li>
                  <li><Link to="/hair" className="hover:text-pink-400 transition-colors">Haircare</Link></li>
                  <li><Link to="/clothing" className="hover:text-pink-400 transition-colors">Fashion</Link></li>
                  <li><Link to="/accessories" className="hover:text-pink-400 transition-colors">Accessories</Link></li>
                  <li><Link to="/electronics" className="hover:text-pink-400 transition-colors">Electronics</Link></li>
                  <li><Link to="/home-kitchen" className="hover:text-pink-400 transition-colors">Home & Kitchen</Link></li>
                  <li><Link to="/health" className="hover:text-pink-400 transition-colors">Health</Link></li>
                  <li><Link to="/books" className="hover:text-pink-400 transition-colors">Books</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white text-sm mb-4 tracking-wide font-semibold">Support</h4>
                <ul className="space-y-2.5 text-xs">
                  <li><Link to="/contact" className="hover:text-pink-400 transition-colors">Contact</Link></li>
                  <li><Link to="/faqs" className="hover:text-pink-400 transition-colors">FAQs</Link></li>
                  <li><Link to="/shipping" className="hover:text-pink-400 transition-colors">Shipping</Link></li>
                  <li><Link to="/returns" className="hover:text-pink-400 transition-colors">Returns</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white text-sm mb-4 tracking-wide font-semibold">Follow</h4>
                <ul className="space-y-2.5 text-xs">
                  <li><a href="#" className="hover:text-pink-400 transition-colors">Instagram</a></li>
                  <li><a href="#" className="hover:text-pink-400 transition-colors">Pinterest</a></li>
                </ul>
              </div>
            </div>
            <div className="text-center pt-8 border-t border-gray-800">
              <p className="text-[11px] tracking-widest text-gray-500 uppercase">© 2026 MyPinkShop · All Rights Reserved</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default HealthPage;
