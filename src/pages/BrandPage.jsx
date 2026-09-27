// src/pages/BrandPage.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SearchableSelect from '../components/SearchableSelect';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'https://api.mypinkshop.com/api';

const SORT_OPTIONS = [
  { value: 'popular',    label: 'Most Coveted' },
  { value: 'newest',     label: 'New Arrivals' },
  { value: 'price_low',  label: 'Price · Ascending' },
  { value: 'price_high', label: 'Price · Descending' },
  { value: 'rating',     label: 'Highest Rated' },
];

/* ------------------------------------------------------------------ */
/* Hook: Reveal on scroll                                             */
/* ------------------------------------------------------------------ */
function useReveal(options = { threshold: 0.15 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, options);
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, visible];
}

/* ------------------------------------------------------------------ */
/* Premium Product Card                                               */
/* ------------------------------------------------------------------ */
function ProductCard({ product, index = 0 }) {
  const [ref, visible] = useReveal();
  const [wishlisted, setWishlisted] = useState(false);
  const [hovered, setHovered] = useState(false);

  const discount =
    product.originalPrice > product.price && product.originalPrice > 0
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <div
      ref={ref}
      className={`group transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${(index % 6) * 80}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/product/${product.slug || product.id}`} className="block">
        <div className="relative bg-white rounded-2xl overflow-hidden border border-pink-100 hover:border-pink-300 hover:shadow-[0_20px_40px_-20px_rgba(236,72,153,0.3)] transition-all duration-500 hover:-translate-y-1">

          {/* Image */}
          <div className="relative aspect-product bg-pink-50 overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-serif text-5xl text-pink-300">✦</span>
              </div>
            )}

            {/* Discount badge */}
            {discount > 0 && (
              <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-full font-semibold shadow-md">
                −{discount}%
              </div>
            )}

            {/* Wishlist */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setWishlisted(!wishlisted);
              }}
              aria-label="Wishlist"
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white hover:scale-110 transition-all duration-300"
            >
              <svg
                className={`w-4 h-4 transition-all ${
                  wishlisted ? 'fill-pink-500 stroke-pink-500 scale-110' : 'fill-none stroke-gray-700'
                }`}
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </button>

            {/* Quick Add */}
            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] tracking-[0.25em] uppercase font-semibold py-3.5 text-center transition-transform duration-500 ease-out ${
                hovered ? 'translate-y-0' : 'translate-y-full'
              }`}
            >
              Add to Bag
            </div>
          </div>

          {/* Info */}
          <div className="pt-4 pb-3 px-4">
            {product.rating > 0 && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.round(product.rating) ? 'fill-pink-500' : 'fill-pink-200'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 1l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.4 4.7 17l1-5.8L1.5 7.2l5.9-.9L10 1z" />
                    </svg>
                  ))}
                </div>
                {product.reviewCount > 0 && (
                  <span className="text-[10px] text-gray-400 tracking-wide">
                    ({product.reviewCount})
                  </span>
                )}
              </div>
            )}

            <h3 className="font-serif text-[15px] leading-snug text-gray-800 line-clamp-2 min-h-[2.6rem] transition-colors duration-300 group-hover:text-pink-600">
              {product.name}
            </h3>

            <div className="w-8 h-px bg-pink-300 my-3 transition-all duration-500 group-hover:w-16" />

            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-semibold text-gray-800">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-[12px] text-gray-400 line-through">
                  ₹{Number(product.originalPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Compact Brand Card (jab banner nahi ho)                            */
/* ------------------------------------------------------------------ */
function CompactBrandHeader({ brand, total }) {
  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-6">
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">

          {/* Logo */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center border-4 border-white shadow-lg shrink-0 overflow-hidden relative">
            {brand.logo ? (
              <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-serif text-4xl text-pink-500">
                {brand.name?.[0]?.toUpperCase()}
              </span>
            )}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-pink-400" />
          </div>

          {/* Info */}
          <div className="text-center sm:text-left flex-1 min-w-0">
            <p className="text-[10px] tracking-luxe-xl uppercase text-pink-500 mb-1">
              Exclusive Brand
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl text-gray-800 tracking-wide">
              {brand.name}
            </h1>
            {brand.tagline && (
              <p className="text-pink-600 mt-2 font-display italic text-lg">
                "{brand.tagline}"
              </p>
            )}
            {brand.description && (
              <p className="text-gray-500 text-sm mt-2 max-w-2xl">
                {brand.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              <span className="text-[11px] bg-pink-50 text-pink-600 px-3 py-1 rounded-full font-medium">
                📦 {total} {total === 1 ? 'product' : 'products'}
              </span>
              <span className="text-[11px] bg-green-50 text-green-600 px-3 py-1 rounded-full font-medium">
                ✓ Verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Main BrandPage                                                     */
/* ------------------------------------------------------------------ */
function BrandPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('popular');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* ---------------------- Scroll listener ---------------------- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ---------------------- Load data ---------------------- */
  const loadBrand = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [brandRes, productsRes, brandsRes] = await Promise.all([
        fetch(`${API_BASE}/brands/${slug}`).then((r) => r.json()),
        fetch(`${API_BASE}/brands/${slug}/products?page=1&limit=20&sort=${sort}`).then((r) => r.json()),
        fetch(`${API_BASE}/brands`).then((r) => r.json()),
      ]);

      if (!brandRes.success) {
        setError('Brand not found');
        setBrand(null);
        return;
      }

      setBrand(brandRes.data);

      if (productsRes.success) {
        setProducts(productsRes.data.products || []);
        setHasMore(productsRes.data.pagination?.hasMore || false);
        setTotal(productsRes.data.pagination?.total || 0);
      }

      if (brandsRes.success) setAllBrands(brandsRes.data || []);
      setPage(1);
    } catch (err) {
      console.error(err);
      setError('Failed to load brand');
    } finally {
      setLoading(false);
    }
  }, [slug, sort]);

  useEffect(() => {
    loadBrand();
  }, [loadBrand]);

  /* ---------------------- Load more ---------------------- */
  const loadMore = async () => {
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await fetch(
        `${API_BASE}/brands/${slug}/products?page=${nextPage}&limit=20&sort=${sort}`
      ).then((r) => r.json());
      if (res.success) {
        setProducts((prev) => [...prev, ...(res.data.products || [])]);
        setHasMore(res.data.pagination?.hasMore || false);
        setPage(nextPage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  /* ---------------------- LOADING ---------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF7FA] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 border border-pink-200 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-pink-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center font-serif text-pink-500 text-2xl">
              ✦
            </div>
          </div>
          <p className="font-serif text-gray-500 tracking-luxe-lg text-xs uppercase">
            Curating
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------- NOT FOUND ---------------------- */
  if (error || !brand) {
    return (
      <div className="min-h-screen bg-[#FFF7FA] flex flex-col items-center justify-center p-6">
        <div className="text-pink-500 text-5xl mb-6 animate-float">✦</div>
        <h1 className="font-serif text-4xl text-gray-800 mb-3 tracking-wide">
          Brand Not Found
        </h1>
        <div className="divider-pink w-32 mb-6">
          <span className="text-xs">✦</span>
        </div>
        <p className="text-gray-500 mb-10 text-sm tracking-wider max-w-md text-center">
          The brand you're looking for doesn't exist in our collection.
        </p>
        <Link to="/" className="btn-pink">
          Return Home
        </Link>
      </div>
    );
  }

  const hasBanner = !!(brand.banner && brand.banner.trim());

  /* ---------------------- RENDER ---------------------- */
  return (
    <div className="min-h-screen bg-[#FFF7FA] font-sans">

      {/* ============================================================ */}
      {/* STICKY MINI HEADER — only when scrolled                      */}
      {/* ============================================================ */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 glass border-b border-pink-200 transition-all duration-500 ${
          scrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center border-2 border-white shadow-md overflow-hidden">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-white text-lg">
                  {brand.name?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-serif text-gray-800 text-sm tracking-luxe uppercase">
                {brand.name}
              </p>
              <p className="text-[10px] text-gray-400 tracking-wider">
                {total} {total === 1 ? 'piece' : 'pieces'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-[10px] tracking-luxe-lg uppercase text-gray-500 hover:text-pink-600 transition-colors duration-300"
          >
            ← Home
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* HERO — only if banner exists                                 */}
      {/* ============================================================ */}
      {hasBanner ? (
        <section className="relative w-full h-[320px] sm:h-[380px] md:h-[420px] lg:h-[460px] max-h-[500px] overflow-hidden">
          <img
            src={brand.banner}
            alt={brand.name}
            className="absolute inset-0 w-full h-full object-cover animate-slow-zoom"
          />

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/65" />
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-transparent to-rose-500/15" />

          {/* Top pink line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent" />

          {/* Corner ornaments */}
          <div className="absolute top-5 left-5 w-10 h-10 border-t-2 border-l-2 border-white/30 hidden sm:block" />
          <div className="absolute top-5 right-5 w-10 h-10 border-t-2 border-r-2 border-white/30 hidden sm:block" />
          <div className="absolute bottom-5 left-5 w-10 h-10 border-b-2 border-l-2 border-white/30 hidden sm:block" />
          <div className="absolute bottom-5 right-5 w-10 h-10 border-b-2 border-r-2 border-white/30 hidden sm:block" />

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
            {/* Logo */}
            <div className="mb-4 relative">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                <div className="absolute inset-0 rounded-full border border-white/30 animate-rotate-slow" />
                <div className="absolute inset-1 rounded-full border border-white/50" />
                <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-2xl">
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-serif text-3xl text-pink-500">
                      {brand.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Small label */}
            <p className="text-[10px] tracking-luxe-xl uppercase text-pink-200 mb-2">
              Exclusive Brand
            </p>

            {/* Brand name */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white tracking-luxe uppercase font-light text-shadow-lg">
              {brand.name}
            </h1>

            {/* Divider */}
            <div className="flex items-center gap-3 my-3">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-pink-300" />
              <span className="text-pink-300 text-xs">✦</span>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-pink-300" />
            </div>

            {/* Tagline */}
            {brand.tagline && (
              <p className="font-display italic text-white/95 text-base sm:text-lg tracking-wide max-w-xl text-shadow-md">
                "{brand.tagline}"
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 mt-4 text-white/90">
              <div className="text-center">
                <p className="font-serif text-lg sm:text-xl text-white">{total}</p>
                <p className="text-[9px] tracking-luxe uppercase opacity-80">Pieces</p>
              </div>
              <div className="w-px h-6 bg-white/30" />
              <div className="text-center">
                <p className="font-serif text-lg sm:text-xl text-white">✦</p>
                <p className="text-[9px] tracking-luxe uppercase opacity-80">Curated</p>
              </div>
              <div className="w-px h-6 bg-white/30" />
              <div className="text-center">
                <p className="font-serif text-lg sm:text-xl text-white">100%</p>
                <p className="text-[9px] tracking-luxe uppercase opacity-80">Authentic</p>
              </div>
            </div>

            {/* CTA */}
            <a href="#collection" className="btn-white mt-5 text-[10px]">
              Explore Collection
            </a>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#FFF7FA] to-transparent pointer-events-none" />
        </section>
      ) : (
        /* ============ NO BANNER — Compact Card ============ */
        <CompactBrandHeader brand={brand} total={total} />
      )}

      {/* ============================================================ */}
      {/* HIGHLIGHTS                                                   */}
      {/* ============================================================ */}
      {brand.highlights && brand.highlights.length > 0 && (
        <section className={`max-w-[1400px] mx-auto px-4 sm:px-6 ${hasBanner ? '-mt-6' : 'mt-6'} relative z-10`}>
          <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-5 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {brand.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{h.icon}</span>
                  <div className="min-w-0">
                    <p className="font-serif text-sm text-gray-800 truncate">{h.title}</p>
                    {h.desc && (
                      <p className="text-[11px] text-gray-500 truncate">{h.desc}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* OFFERS                                                       */}
      {/* ============================================================ */}
      {brand.offers && brand.offers.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 mt-6">
          <div className="bg-gradient-to-r from-pink-500 via-pink-500 to-rose-500 rounded-2xl shadow-xl p-6 sm:p-8 text-white">
            <div className="text-center mb-5">
              <p className="text-[10px] tracking-luxe-xl uppercase text-pink-100 mb-2">
                🎁 Active Offers
              </p>
              <h3 className="font-serif text-2xl tracking-wide">Special Deals</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {brand.offers.map((o, i) => (
                <div
                  key={i}
                  className="bg-white/15 backdrop-blur border border-white/25 rounded-xl p-4"
                >
                  <p className="font-semibold text-sm">{o.title || 'Offer'}</p>
                  {o.description && (
                    <p className="text-xs text-pink-100 mt-1">{o.description}</p>
                  )}
                  {o.code && (
                    <div className="mt-3 flex items-center justify-between bg-white/20 rounded-lg px-3 py-1.5">
                      <span className="font-mono text-xs tracking-wider">{o.code}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(o.code);
                        }}
                        className="text-[10px] uppercase tracking-wider font-semibold opacity-90 hover:opacity-100"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* BREADCRUMB                                                   */}
      {/* ============================================================ */}
      <div className={`max-w-[1400px] mx-auto px-6 ${hasBanner ? 'pt-8' : 'pt-6'}`}>
        <nav className="flex items-center gap-2 text-[10px] tracking-luxe uppercase text-gray-400">
          <Link to="/" className="hover:text-pink-600 transition-colors">Home</Link>
          <span className="text-pink-400">✦</span>
          <Link to="/brands" className="hover:text-pink-600 transition-colors">Brands</Link>
          <span className="text-pink-400">✦</span>
          <span className="text-gray-700">{brand.name}</span>
        </nav>
      </div>

      {/* ============================================================ */}
      {/* MAIN                                                         */}
      {/* ============================================================ */}
      <div id="collection" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

          {/* ==================== SIDEBAR ==================== */}
          <aside className="lg:col-span-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-full flex items-center justify-between bg-white border border-pink-200 px-5 py-4 mb-4 rounded-xl transition-colors hover:border-pink-400"
            >
              <span className="font-serif text-sm tracking-luxe uppercase text-gray-800">
                Browse Brands
              </span>
              <span className="text-pink-500 text-lg">{sidebarOpen ? '−' : '+'}</span>
            </button>

            <div
              className={`${
                sidebarOpen ? 'block' : 'hidden'
              } lg:block lg:sticky lg:top-24 bg-white border border-pink-100 rounded-2xl overflow-hidden shadow-sm`}
            >
              <div className="px-6 py-5 border-b border-pink-100 bg-gradient-to-br from-pink-50 to-white">
                <p className="text-[10px] tracking-luxe-xl uppercase text-pink-500 mb-2">
                  The Brands
                </p>
                <h2 className="font-serif text-lg text-gray-800 tracking-wide">
                  All Brands
                </h2>
                <div className="w-10 h-px bg-pink-400 mt-3" />
              </div>

              <div className="px-5 py-4 border-b border-pink-100">
                <SearchableSelect
                  options={allBrands.map((b) => ({
                    value: b.slug,
                    label: `${b.name}  ·  ${b.product_count || 0}`,
                  }))}
                  value={slug}
                  onChange={(newSlug) => {
                    navigate(`/brand/${newSlug}`);
                    setSidebarOpen(false);
                  }}
                  placeholder="Search brands..."
                />
              </div>

              <div className="max-h-[60vh] overflow-y-auto py-2 scrollbar-pink">
                {allBrands.map((b) => {
                  const active = b.slug === slug;
                  return (
                    <Link
                      key={b.slug}
                      to={`/brand/${b.slug}`}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center justify-between px-6 py-3.5 transition-all duration-500 ${
                        active ? 'bg-pink-50' : 'hover:bg-pink-50 hover:pl-8'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`shrink-0 w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                            active
                              ? 'bg-pink-500 scale-150'
                              : 'bg-gray-300 group-hover:bg-pink-400 group-hover:scale-125'
                          }`}
                        />
                        <span
                          className={`font-serif text-sm tracking-wide truncate transition-colors duration-300 ${
                            active
                              ? 'text-gray-900 font-medium'
                              : 'text-gray-600 group-hover:text-gray-900'
                          }`}
                        >
                          {b.name}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] tracking-wider ${
                          active ? 'text-pink-500 font-medium' : 'text-gray-400'
                        }`}
                      >
                        {b.product_count || 0}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <div className="px-6 py-4 border-t border-pink-100 text-center">
                <div className="inline-flex items-center gap-2 text-pink-300">
                  <span className="w-6 h-px bg-pink-300" />
                  <span className="text-xs">✦</span>
                  <span className="w-6 h-px bg-pink-300" />
                </div>
              </div>
            </div>
          </aside>

          {/* ==================== PRODUCTS ==================== */}
          <main className="lg:col-span-9">

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-5 border-b border-pink-200">
              <div>
                <p className="text-[10px] tracking-luxe-xl uppercase text-pink-500 mb-2">
                  The Collection
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl text-gray-800 tracking-wide">
                  {brand.name}
                </h2>
                <p className="text-xs text-gray-500 mt-2 tracking-wider">
                  {total} {total === 1 ? 'piece' : 'pieces'} · Curated with care
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] tracking-luxe-lg uppercase text-gray-400">
                  Sort
                </span>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="appearance-none bg-transparent border-b border-pink-400 font-serif text-sm text-gray-800 py-1.5 pr-8 focus:outline-none cursor-pointer hover:border-pink-600 transition-colors"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-pink-500 pointer-events-none">
                    ▾
                  </span>
                </div>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="py-24 text-center">
                <div className="text-pink-400 text-5xl mb-6 animate-float">✦</div>
                <h3 className="font-serif text-2xl text-gray-800 mb-4">
                  Coming Soon
                </h3>
                <div className="divider-pink max-w-xs mx-auto mb-6">
                  <span className="text-xs">✦</span>
                </div>
                <p className="text-sm text-gray-500 tracking-wider max-w-md mx-auto leading-relaxed">
                  This brand's collection is being carefully curated. Return soon for something special.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10">
                  {products.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center mt-14">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="btn-pink disabled:opacity-40"
                    >
                      {loadingMore ? (
                        <span className="inline-flex items-center gap-3">
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Loading
                        </span>
                      ) : (
                        'Discover More'
                      )}
                    </button>
                  </div>
                )}

                {!hasMore && products.length > 0 && (
                  <div className="text-center mt-14">
                    <div className="inline-flex items-center gap-3 text-pink-400">
                      <div className="w-12 h-px bg-pink-300" />
                      <span className="text-xs animate-soft-pulse">✦</span>
                      <div className="w-12 h-px bg-pink-300" />
                    </div>
                    <p className="mt-3 text-[10px] tracking-luxe-xl uppercase text-gray-400">
                      End of Collection
                    </p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TRUST BADGES                                                 */}
      {/* ============================================================ */}
      <section className="bg-gradient-to-br from-pink-500 via-pink-500 to-rose-500 text-white py-14 mt-12">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-[10px] tracking-luxe-xl uppercase text-pink-100 mb-3">
              The Promise
            </p>
            <h3 className="font-serif text-2xl sm:text-3xl text-white tracking-wide">
              Why Shop With Us
            </h3>
            <div className="divider-pink max-w-xs mx-auto mt-5 opacity-70">
              <span className="text-xs text-white">✦</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: '✦', title: 'Curated', desc: 'Hand-selected' },
              { icon: '✧', title: 'Authentic', desc: '100% genuine' },
              { icon: '✦', title: 'Free Shipping', desc: 'Over ₹999' },
              { icon: '✧', title: 'Support', desc: '24/7 help' },
            ].map((item, i) => (
              <div key={i} className="group">
                <div className="text-white/90 text-3xl mb-3 group-hover:scale-125 transition-transform duration-500">
                  {item.icon}
                </div>
                <p className="font-serif text-base sm:text-lg text-white mb-1 tracking-wide">
                  {item.title}
                </p>
                <p className="text-[10px] tracking-wider text-white/70 uppercase">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default BrandPage;
