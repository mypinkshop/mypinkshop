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

/* ================================================================== */
/* HOOK: Reveal on scroll                                             */
/* ================================================================== */
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
  }, [options]);

  return [ref, visible];
}

/* ================================================================== */
/* PREMIUM PRODUCT CARD                                               */
/* ================================================================== */
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
      className={`group relative transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${(index % 6) * 80}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/product/${product.slug || product.id}`} className="block">
        {/* Image wrapper */}
        <div className="relative bg-[#FAF7F2] overflow-hidden aspect-product">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-serif text-6xl text-gold/30">✦</span>
            </div>
          )}

          {/* Overlay on hover */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-500 ${
              hovered ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Corner accents — luxury detail */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-gold/60 pointer-events-none" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-gold/60 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l border-gold/60 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-gold/60 pointer-events-none" />

          {/* Discount badge */}
          {discount > 0 && (
            <div className="absolute top-4 left-4 z-10 bg-charcoal text-white text-[9px] tracking-[0.25em] uppercase px-3 py-1.5 font-medium">
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
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full glass flex items-center justify-center transition-all duration-500 hover:scale-110 shadow-md"
          >
            <svg
              className={`w-4 h-4 transition-all duration-300 ${
                wishlisted ? 'fill-gold stroke-gold scale-110' : 'fill-none stroke-charcoal'
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

          {/* Quick Add — slides up */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-charcoal text-white text-[10px] tracking-[0.3em] uppercase font-medium py-4 text-center transition-transform duration-500 ease-out ${
              hovered ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            Add to Bag
          </div>
        </div>

        {/* Info */}
        <div className="pt-5 pb-2">
          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.round(product.rating) ? 'fill-gold' : 'fill-gold/20'
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 1l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.4 4.7 17l1-5.8L1.5 7.2l5.9-.9L10 1z" />
                  </svg>
                ))}
              </div>
              {product.reviewCount > 0 && (
                <span className="text-[10px] text-charcoal/40 tracking-wider">
                  {product.reviewCount} reviews
                </span>
              )}
            </div>
          )}

          {/* Name */}
          <h3 className="font-serif text-[15px] leading-snug text-charcoal line-clamp-2 min-h-[2.6rem] transition-colors duration-500 group-hover:text-gold">
            {product.name}
          </h3>

          {/* Divider */}
          <div className="w-8 h-px bg-gold/40 my-3 transition-all duration-500 group-hover:w-16" />

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-medium text-charcoal tracking-wide">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-[12px] text-charcoal/40 line-through">
                ₹{Number(product.originalPrice).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ================================================================== */
/* SKELETON — Luxury loading                                          */
/* ================================================================== */
function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-product bg-[#F0EBE1]" />
      <div className="pt-5 space-y-3">
        <div className="h-3 bg-[#F0EBE1] w-1/2" />
        <div className="h-4 bg-[#F0EBE1] w-3/4" />
        <div className="h-4 bg-[#F0EBE1] w-1/3" />
      </div>
    </div>
  );
}

/* ================================================================== */
/* MAIN BRAND PAGE                                                    */
/* ================================================================== */
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

  const [heroRef, heroVisible] = useReveal({ threshold: 0.05 });

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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 border border-gold/20 rounded-full" />
            <div className="absolute inset-0 border-t border-gold rounded-full animate-rotate-slow" />
            <div className="absolute inset-0 flex items-center justify-center font-serif text-gold text-2xl">
              ✦
            </div>
          </div>
          <p className="font-serif text-charcoal/60 tracking-luxe-lg text-xs uppercase">
            Curating
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------- NOT FOUND ---------------------- */
  if (error || !brand) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
        <div className="text-gold text-5xl mb-6 animate-float">✦</div>
        <h1 className="font-serif text-4xl text-charcoal mb-3 tracking-wide">
          Maison Not Found
        </h1>
        <div className="divider-gold w-32 mb-6">
          <span className="text-xs">✦</span>
        </div>
        <p className="text-charcoal/50 mb-10 text-sm tracking-wider max-w-md text-center">
          The atelier you seek does not exist in our collection.
        </p>
        <Link to="/" className="btn-luxe">
          Return to Boutique
        </Link>
      </div>
    );
  }

  /* ---------------------- RENDER ---------------------- */
  return (
    <div className="min-h-screen bg-cream font-sans">

      {/* ============================================================ */}
      {/* STICKY MINI HEADER — appears on scroll                      */}
      {/* ============================================================ */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 glass border-b border-gold/20 transition-all duration-500 ${
          scrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-charcoal flex items-center justify-center border border-gold overflow-hidden">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-gold text-lg">
                  {brand.name?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-serif text-charcoal text-sm tracking-luxe uppercase">
                {brand.name}
              </p>
              <p className="text-[10px] text-charcoal/50 tracking-wider">
                {total} pieces
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-[10px] tracking-luxe-lg uppercase text-charcoal/60 hover:text-gold transition-colors duration-300"
          >
            ← Boutique
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* HERO                                                         */}
      {/* ============================================================ */}
      <section
        ref={heroRef}
        className={`relative w-full h-[70vh] min-h-[500px] max-h-[720px] overflow-hidden transition-all duration-1000 ${
          heroVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Background image / gradient */}
        {brand.banner ? (
          <img
            src={brand.banner}
            alt={brand.name}
            className="absolute inset-0 w-full h-full object-cover animate-slow-zoom"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-[#2A2A2A] to-charcoal" />
        )}

        {/* Multi-layer overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-gold/10" />

        {/* Top gold line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

        {/* Corner ornaments */}
        <div className="absolute top-8 left-8 w-16 h-16 border-t border-l border-gold/40 hidden sm:block" />
        <div className="absolute top-8 right-8 w-16 h-16 border-t border-r border-gold/40 hidden sm:block" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-b border-l border-gold/40 hidden sm:block" />
        <div className="absolute bottom-8 right-8 w-16 h-16 border-b border-r border-gold/40 hidden sm:block" />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">

          {/* Logo — luxury circle */}
          <div className="mb-8 relative animate-fade-in-up">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border border-gold/40 animate-rotate-slow" />
              {/* Inner ring */}
              <div className="absolute inset-2 rounded-full border border-gold/60" />
              {/* Logo */}
              <div className="absolute inset-3 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-gold-lg">
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-serif text-5xl text-gold">
                    {brand.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            {/* Gold dot */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gold animate-soft-pulse" />
          </div>

          {/* Small label */}
          <p className="text-[10px] tracking-luxe-xl uppercase text-gold/80 mb-4 animate-fade-in-up">
            Maison Exclusive
          </p>

          {/* Brand name */}
          <h1
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-luxe uppercase font-light text-shadow-lg animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            {brand.name}
          </h1>

          {/* Gold divider */}
          <div
            className="flex items-center gap-4 my-6 animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-gold" />
            <span className="text-gold text-sm">✦</span>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-gold" />
          </div>

          {/* Tagline / description */}
          {brand.tagline && (
            <p
              className="font-display italic text-white/90 text-xl sm:text-2xl tracking-wide max-w-2xl text-shadow-md animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              "{brand.tagline}"
            </p>
          )}
          {!brand.tagline && brand.description && (
            <p
              className="text-white/75 text-sm sm:text-base tracking-wider max-w-2xl leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              {brand.description}
            </p>
          )}

          {/* Stats row */}
          <div
            className="flex items-center gap-8 mt-8 text-white/80 animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="text-center">
              <p className="font-serif text-2xl text-gold">{total}</p>
              <p className="text-[10px] tracking-luxe uppercase mt-1">Pieces</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="font-serif text-2xl text-gold">✦</p>
              <p className="text-[10px] tracking-luxe uppercase mt-1">Curated</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="font-serif text-2xl text-gold">100%</p>
              <p className="text-[10px] tracking-luxe uppercase mt-1">Authentic</p>
            </div>
          </div>

          {/* CTA */}
          <a
            href="#collection"
            className="btn-outline-gold mt-10 animate-fade-in-up"
            style={{ animationDelay: '0.5s' }}
          >
            Explore the Collection
          </a>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream to-transparent pointer-events-none" />
      </section>

      {/* ============================================================ */}
      {/* BREADCRUMB                                                   */}
      {/* ============================================================ */}
      <div className="max-w-[1400px] mx-auto px-6 pt-8">
        <nav className="flex items-center gap-2 text-[10px] tracking-luxe uppercase text-charcoal/50">
          <Link to="/" className="hover:text-gold transition-colors">Home</Link>
          <span className="text-gold">✦</span>
          <Link to="/brands" className="hover:text-gold transition-colors">Maisons</Link>
          <span className="text-gold">✦</span>
          <span className="text-charcoal">{brand.name}</span>
        </nav>
      </div>

      {/* ============================================================ */}
      {/* MAIN CONTENT                                                 */}
      {/* ============================================================ */}
      <div id="collection" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* ==================== SIDEBAR ==================== */}
          <aside className="lg:col-span-3">
            {/* Mobile toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-full flex items-center justify-between bg-white border border-gold/30 px-5 py-4 mb-4 transition-colors hover:border-gold"
            >
              <span className="font-serif text-sm tracking-luxe uppercase text-charcoal">
                Browse Maisons
              </span>
              <span className="text-gold text-lg">{sidebarOpen ? '−' : '+'}</span>
            </button>

            <div
              className={`${
                sidebarOpen ? 'block' : 'hidden'
              } lg:block lg:sticky lg:top-24 bg-white border border-gold/20 overflow-hidden`}
            >
              {/* Header */}
              <div className="px-6 py-6 border-b border-gold/20 bg-gradient-to-br from-cream to-white">
                <p className="text-[10px] tracking-luxe-xl uppercase text-gold mb-2">
                  The Maison
                </p>
                <h2 className="font-serif text-lg text-charcoal tracking-wide">
                  All Ateliers
                </h2>
                <div className="w-10 h-px bg-gold mt-3" />
              </div>

              {/* Search */}
              <div className="px-5 py-4 border-b border-gold/20">
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
                  placeholder="Search maisons..."
                />
              </div>

              {/* Brand list */}
              <div className="max-h-[60vh] overflow-y-auto py-2 scrollbar-gold">
                {allBrands.map((b, idx) => {
                  const active = b.slug === slug;
                  return (
                    <Link
                      key={b.slug}
                      to={`/brand/${b.slug}`}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center justify-between px-6 py-3.5 transition-all duration-500 ${
                        active ? 'bg-cream' : 'hover:bg-cream hover:pl-8'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`shrink-0 w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                            active
                              ? 'bg-gold scale-150 shadow-gold'
                              : 'bg-charcoal/20 group-hover:bg-gold group-hover:scale-125'
                          }`}
                        />
                        <span
                          className={`font-serif text-sm tracking-wide truncate transition-colors duration-300 ${
                            active ? 'text-charcoal font-medium' : 'text-charcoal/70 group-hover:text-charcoal'
                          }`}
                        >
                          {b.name}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] tracking-wider transition-colors ${
                          active ? 'text-gold font-medium' : 'text-charcoal/30'
                        }`}
                      >
                        {b.product_count || 0}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Bottom flourish */}
              <div className="px-6 py-5 border-t border-gold/20 text-center">
                <div className="inline-flex items-center gap-2 text-gold/60">
                  <span className="w-6 h-px bg-gold/40" />
                  <span className="text-xs">✦</span>
                  <span className="w-6 h-px bg-gold/40" />
                </div>
              </div>
            </div>
          </aside>

          {/* ==================== PRODUCTS ==================== */}
          <main className="lg:col-span-9">

            {/* Header bar */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-6 border-b border-gold/20">
              <div>
                <p className="text-[10px] tracking-luxe-xl uppercase text-gold mb-3">
                  The Collection
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl text-charcoal tracking-wide">
                  {brand.name}
                </h2>
                <p className="text-xs text-charcoal/50 mt-3 tracking-wider">
                  {total} {total === 1 ? 'masterpiece' : 'masterpieces'} · Curated with care
                </p>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] tracking-luxe-lg uppercase text-charcoal/50">
                  Sort
                </span>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="appearance-none bg-transparent border-b border-gold font-serif text-sm text-charcoal py-1.5 pr-8 focus:outline-none cursor-pointer hover:border-gold-dark transition-colors"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gold pointer-events-none">
                    ▾
                  </span>
                </div>
              </div>
            </div>

            {/* Products */}
            {products.length === 0 ? (
              <div className="py-32 text-center">
                <div className="text-gold text-6xl mb-8 animate-float">✦</div>
                <h3 className="font-serif text-3xl text-charcoal mb-4">
                  Being Curated
                </h3>
                <div className="divider-gold max-w-xs mx-auto mb-6">
                  <span className="text-xs">✦</span>
                </div>
                <p className="text-sm text-charcoal/50 tracking-wider max-w-md mx-auto leading-relaxed">
                  This atelier's collection is being carefully curated. Return soon for something extraordinary.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-12">
                  {products.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="text-center mt-20">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="btn-luxe disabled:opacity-40"
                    >
                      {loadingMore ? (
                        <span className="inline-flex items-center gap-3">
                          <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-rotate-slow" />
                          Loading
                        </span>
                      ) : (
                        'Discover More'
                      )}
                    </button>
                  </div>
                )}

                {/* End mark */}
                {!hasMore && products.length > 0 && (
                  <div className="text-center mt-20">
                    <div className="inline-flex items-center gap-3 text-gold">
                      <div className="w-12 h-px bg-gold/40" />
                      <span className="text-xs animate-soft-pulse">✦</span>
                      <div className="w-12 h-px bg-gold/40" />
                    </div>
                    <p className="mt-4 text-[10px] tracking-luxe-xl uppercase text-charcoal/40">
                      Fin de la Collection
                    </p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TRUST BADGES — Luxury                                          */}
      {/* ============================================================ */}
      <section className="bg-charcoal text-white py-16 mt-16">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-luxe-xl uppercase text-gold mb-3">
              The Promise
            </p>
            <h3 className="font-serif text-3xl text-white tracking-wide">
              Maison Standards
            </h3>
            <div className="divider-gold max-w-xs mx-auto mt-6">
              <span className="text-xs">✦</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: '✦', title: 'Curated', desc: 'Hand-selected pieces' },
              { icon: '✧', title: 'Authentic', desc: '100% genuine' },
              { icon: '✦', title: 'Complimentary', desc: 'Free shipping over ₹999' },
              { icon: '✧', title: 'Concierge', desc: '24/7 assistance' },
            ].map((item, i) => (
              <div
                key={i}
                className="group hover-lift"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="text-gold text-3xl mb-4 group-hover:scale-125 transition-transform duration-500">
                  {item.icon}
                </div>
                <p className="font-serif text-lg text-white mb-2 tracking-wide">
                  {item.title}
                </p>
                <p className="text-[11px] tracking-wider text-white/60 uppercase">
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
