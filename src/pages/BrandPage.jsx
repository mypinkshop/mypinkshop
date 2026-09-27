// src/pages/BrandPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SearchableSelect from '../components/SearchableSelect';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'https://api.mypinkshop.com/api';

const SORT_OPTIONS = [
  { value: 'popular',    label: 'Popular' },
  { value: 'newest',     label: 'Newest' },
  { value: 'price_low',  label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
];

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

  /* ---------------------- Load brand + products ---------------------- */

  const loadBrand = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Brand detail + products parallel
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

      if (brandsRes.success) {
        setAllBrands(brandsRes.data || []);
      }

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

  /* ---------------------- Sort change ---------------------- */

  const handleSortChange = (newSort) => {
    setSort(newSort);
    // loadBrand automatically call hoga sort change pe (useCallback dependency)
  };

  /* ---------------------- Loading / Error ---------------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading brand...</p>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50 p-6">
        <div className="text-6xl mb-4">🏷️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Brand not found</h1>
        <p className="text-gray-500 mb-6">The brand "{slug}" doesn't exist.</p>
        <Link
          to="/"
          className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition"
        >
          Go Home
        </Link>
      </div>
    );
  }

  /* ---------------------- Render ---------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50">
      {/* ==================== BRAND HERO ==================== */}
      <div className="relative">
        {/* Banner */}
        <div className="w-full h-48 sm:h-64 bg-gradient-to-r from-pink-500 to-rose-500 overflow-hidden">
          {brand.banner ? (
            <img
              src={brand.banner}
              alt={brand.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20">
              <span className="text-9xl">🏷️</span>
            </div>
          )}
        </div>

        {/* Logo + Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 relative">
          <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center border-4 border-white shadow-lg -mt-12 sm:-mt-16 shrink-0 overflow-hidden">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-pink-500">
                  {brand.name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {brand.name}
              </h1>
              {brand.tagline && (
                <p className="text-pink-600 font-medium mt-1">{brand.tagline}</p>
              )}
              {brand.description && (
                <p className="text-gray-600 text-sm mt-2 max-w-2xl">
                  {brand.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <span className="text-xs bg-pink-50 text-pink-600 px-3 py-1 rounded-full font-medium">
                  📦 {total} products
                </span>
                {brand.is_featured && (
                  <span className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full font-medium">
                    ⭐ Featured
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MAIN ==================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ==================== SIDEBAR ==================== */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4 lg:sticky lg:top-6">
              <h2 className="font-bold text-gray-800 mb-3">🏷️ All Brands</h2>

              {/* Searchable brand list */}
              <SearchableSelect
                options={allBrands.map((b) => ({
                  value: b.slug,
                  label: `${b.name} (${b.product_count || 0})`,
                }))}
                value={slug}
                onChange={(newSlug) => navigate(`/brand/${newSlug}`)}
                placeholder="Search brands..."
              />

              {/* Quick list (top 10) */}
              <div className="mt-4 space-y-1 max-h-96 overflow-y-auto">
                {allBrands.slice(0, 30).map((b) => (
                  <Link
                    key={b.slug}
                    to={`/brand/${b.slug}`}
                    className={`block px-3 py-2 rounded-lg text-sm transition ${
                      b.slug === slug
                        ? 'bg-pink-50 text-pink-600 font-semibold'
                        : 'text-gray-700 hover:bg-pink-50'
                    }`}
                  >
                    {b.name}
                    <span className="text-xs text-gray-400 ml-1">
                      ({b.product_count || 0})
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* ==================== PRODUCTS ==================== */}
          <main className="lg:col-span-3">
            {/* Sort bar */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-gray-800">
                {brand.name} Products <span className="text-gray-400 font-normal">({total})</span>
              </h2>

              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Products grid */}
            {products.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-5xl mb-3">📦</div>
                <p className="text-gray-500">No products found for this brand</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <Link
                      key={p.id}
                      to={`/product/${p.slug || p.id}`}
                      className="group bg-white rounded-2xl shadow hover:shadow-xl overflow-hidden transition"
                    >
                      <div className="aspect-square bg-gray-50 overflow-hidden">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            🛍️
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[2.5rem]">
                          {p.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-base font-bold text-pink-600">
                            ₹{p.price}
                          </span>
                          {p.originalPrice > p.price && (
                            <span className="text-xs text-gray-400 line-through">
                              ₹{p.originalPrice}
                            </span>
                          )}
                        </div>
                        {p.rating > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            ⭐ {p.rating?.toFixed?.(1) || p.rating}
                            {p.reviewCount > 0 && <span>({p.reviewCount})</span>}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg transition disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default BrandPage;
