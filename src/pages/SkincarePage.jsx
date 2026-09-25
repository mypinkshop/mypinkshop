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

  const [category, setCategory] = useState(null);
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

  // ✅ Step 1: API se category + subcategories fetch karo
  useEffect(() => {
    const loadCategory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/categories/tree`);
        if (!res.ok) throw new Error('Failed to load categories');
        const json = await res.json();
        const tree = json.data || json;

        const found = tree.find(c => c.slug === 'skincare');
        if (found) {
          setCategory(found);
          setApiSubcategories(found.children || []);
        }
      } catch (err) {
        console.error('Category load error:', err);
      }
    };
    loadCategory();
  }, []);

  // ✅ Step 2: Products fetch karo
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

  // ✅ Subcategories — API se + products se fallback
  const subcategories = useMemo(() => {
    // API se (priority)
    if (apiSubcategories.length > 0) {
      return apiSubcategories.map(s => ({
        id: s.id,
        name: s.name,
        icon: s.icon || '📁',
      }));
    }
    // Fallback — products se derive
    const subs = [...new Set(products.map(p => p.subCategory).filter(Boolean))];
    return subs.map((s, idx) => ({ id: idx, name: s, icon: '📁' }));
  }, [apiSubcategories, products]);

  // ✅ Filters
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(t) ||
        p.brand?.toLowerCase().includes(t)
      );
    }

    if (selectedSubcategory !== 'all') {
      filtered = filtered.filter(p =>
        (p.subCategory || '').toLowerCase() === selectedSubcategory.toLowerCase()
      );
    }

    if (selectedConcern !== 'all') {
      filtered = filtered.filter(p => {
        const concerns = p.skinConcerns || [];
        return concerns.includes(selectedConcern);
      });
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
    const allConcerns = products.flatMap(p => p.skinConcerns || []).filter(Boolean);
    return [...new Set(allConcerns)];
  }, [products]);

  const brands = useMemo(() => {
    const unique = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return [{ id: 'all', name: 'All Brands' }, ...unique.map(b => ({ id: b, name: b }))];
  }, [products]);

  const skinTypes = [
    { id: 'all', name: 'All Skin Types' },
    { id: 'oily', name: 'Oily Skin' },
    { id: 'dry', name: 'Dry Skin' },
    { id: 'combination', name: 'Combination Skin' },
    { id: 'sensitive', name: 'Sensitive Skin' },
    { id: 'normal', name: 'Normal Skin' },
  ];

  const priceRanges = [
    { id: 'all', name: 'All Prices' },
    { id: 'under500', name: 'Under ₹500' },
    { id: '500-1000', name: '₹500 - ₹1000' },
    { id: '1000-2000', name: '₹1000 - ₹2000' },
    { id: '2000-5000', name: '₹2000 - ₹5000' },
    { id: 'above5000', name: 'Above ₹5000' },
  ];

  const sortOptions = [
    { id: 'default', name: 'Default' },
    { id: 'price_low', name: 'Price: Low to High' },
    { id: 'price_high', name: 'Price: High to Low' },
    { id: 'rating', name: 'Highest Rated' },
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading skincare products...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Skincare Products - Face Wash, Serum, Moisturizer & More | MyPinkShop</title>
        <meta name="description" content="Shop premium skincare products at MyPinkShop. Face washes, serums, moisturizers, sunscreens, and masks for glowing skin." />
        <link rel="canonical" href="https://www.mypinkshop.com/skincare" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <OfferBanner />

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
              <Link to="/" className="flex items-center gap-2 shrink-0 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-lg sm:text-xl">M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">MyPinkShop</h1>
                  <p className="text-[9px] text-gray-400">FOR THE GIRLIES ✨</p>
                </div>
              </Link>

              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search skincare..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 bg-gray-50"
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => navigate('/wishlist')} className="relative p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{wishlistCount}</span>}
                </button>

                <Link to="/cart" className="relative p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
                </Link>

                {user ? <Avatar user={user} onLogout={logout} /> :
                  <Link to="/login" className="p-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                }
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <div className="relative bg-gradient-to-r from-pink-500 to-rose-500 text-white">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
            <div className="flex items-center gap-4">
              <div className="text-5xl sm:text-6xl">🧴</div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold mb-1">Skincare</h1>
                <p className="text-sm sm:text-base text-white/90">✨ Glow Up Sale — Flat 30% OFF</p>
                <p className="text-xs mt-1 text-white/80">{filteredProducts.length} products • {subcategories.length} subcategories</p>
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">Skincare</span>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex gap-6">

            {/* ✅ LEFT SIDEBAR — Subcategories */}
            <aside className={`fixed md:static inset-0 z-40 md:z-0 ${showSidebar ? '' : 'hidden md:block'} md:w-64 shrink-0`}>
              {/* Mobile overlay */}
              {showSidebar && (
                <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setShowSidebar(false)} />
              )}

              <div className={`bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden ${showSidebar ? 'fixed top-0 left-0 h-full w-72 z-40 overflow-y-auto' : ''}`}>
                {/* Sidebar Header */}
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 border-b border-pink-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">📂 Categories</h3>
                  {showSidebar && (
                    <button onClick={() => setShowSidebar(false)} className="md:hidden text-gray-400 text-xl">✕</button>
                  )}
                </div>

                {/* Sidebar Items */}
                <div className="max-h-[600px] overflow-y-auto">
                  {/* All Products */}
                  <button
                    onClick={() => { setSelectedSubcategory('all'); setShowSidebar(false); }}
                    className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 border-b border-gray-50 transition ${
                      selectedSubcategory === 'all'
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold'
                        : 'text-gray-700 hover:bg-pink-50'
                    }`}
                  >
                    <span className="text-lg">🔥</span>
                    <span>All Products</span>
                    <span className={`ml-auto text-xs ${selectedSubcategory === 'all' ? 'text-white/80' : 'text-gray-400'}`}>
                      {products.length}
                    </span>
                  </button>

                  {/* Subcategories */}
                  {subcategories.map(sub => {
                    const count = products.filter(p =>
                      (p.subCategory || '').toLowerCase() === sub.name.toLowerCase()
                    ).length;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => { setSelectedSubcategory(sub.name); setShowSidebar(false); }}
                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 border-b border-gray-50 transition ${
                          selectedSubcategory === sub.name
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold'
                            : 'text-gray-700 hover:bg-pink-50'
                        }`}
                      >
                        <span className="text-lg">{sub.icon || '📁'}</span>
                        <span className="truncate">{sub.name}</span>
                        <span className={`ml-auto text-xs ${selectedSubcategory === sub.name ? 'text-white/80' : 'text-gray-400'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* ✅ RIGHT: Products */}
            <main className="flex-1 min-w-0">

              {/* Mobile: Filter Buttons */}
              <div className="md:hidden mb-4 flex gap-2">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-sm font-medium"
                >
                  📂 Categories ({subcategories.length})
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2.5 border border-pink-200 rounded-full text-sm bg-white"
                >
                  Filters 🔽
                </button>
              </div>

              {/* Shop by Concern */}
              {concerns.length > 0 && (
                <div className="mb-6 bg-white rounded-2xl p-4 border border-pink-100 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">🎯 Shop by Concern</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedConcern('all')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        selectedConcern === 'all' ? 'bg-pink-500 text-white' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
                      }`}
                    >
                      All
                    </button>
                    {concerns.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedConcern(c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          selectedConcern === c ? 'bg-pink-500 text-white' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters Bar */}
              <div className="mb-6 bg-white rounded-2xl p-4 border border-pink-100 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="hidden md:flex gap-2 flex-wrap">
                    <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-full text-sm bg-white focus:outline-none focus:border-pink-500">
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <select value={selectedSkinType} onChange={(e) => setSelectedSkinType(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-full text-sm bg-white focus:outline-none focus:border-pink-500">
                      {skinTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-full text-sm bg-white focus:outline-none focus:border-pink-500">
                      {priceRanges.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {(selectedSubcategory !== 'all' || selectedBrand !== 'all' || selectedConcern !== 'all' || selectedSkinType !== 'all' || priceRange !== 'all' || searchTerm) && (
                      <button onClick={clearFilters} className="text-xs text-pink-500 underline whitespace-nowrap">Clear All</button>
                    )}
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white focus:outline-none focus:border-pink-500">
                      {sortOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Mobile Filters Modal */}
              {showFilters && (
                <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilters(false)}>
                  <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-semibold text-gray-800">Filters</h3>
                      <button onClick={() => setShowFilters(false)} className="text-gray-400 text-xl">✕</button>
                    </div>
                    <div className="space-y-4">
                      <div><label className="block text-sm mb-1">Brand</label><select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full p-2 border rounded-lg">{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                      <div><label className="block text-sm mb-1">Skin Type</label><select value={selectedSkinType} onChange={(e) => setSelectedSkinType(e.target.value)} className="w-full p-2 border rounded-lg">{skinTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                      <div><label className="block text-sm mb-1">Price</label><select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full p-2 border rounded-lg">{priceRanges.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                      <button onClick={clearFilters} className="w-full py-2 bg-pink-500 text-white rounded-lg mt-4">Clear All</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Count */}
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-semibold text-pink-600">{Math.min(visibleCount, filteredProducts.length)}</span> of <span className="font-semibold text-pink-600">{filteredProducts.length}</span> products
                  {selectedSubcategory !== 'all' && <span className="ml-2 text-pink-600 font-medium">in {selectedSubcategory}</span>}
                </p>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white/80 rounded-2xl p-12 text-center border border-pink-100">
                  <div className="text-6xl mb-3">🧴</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">No skincare products found</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {selectedSubcategory !== 'all' ? `No products in "${selectedSubcategory}" yet` : 'Coming soon!'}
                  </p>
                  <button onClick={clearFilters} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full text-sm">Clear Filters</button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <div className="text-center mt-8">
                      <button
                        onClick={() => setVisibleCount(prev => prev + 16)}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg transition"
                      >
                        Load More Products ↓
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Category Banner */}
              <div className="mt-12 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white p-8 text-center">
                <h3 className="text-2xl font-bold mb-2">✨ Glow Up Sale</h3>
                <p className="text-white/90 mb-4">Flat 30% OFF on all Skincare</p>
                <Link to="/shop" className="inline-block bg-white text-gray-800 px-6 py-2 rounded-full font-medium hover:shadow-lg transition">
                  Shop All Products →
                </Link>
              </div>
            </main>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12 mt-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">M</span>
                  </div>
                  <h3 className="font-bold text-white">MyPinkShop</h3>
                </div>
                <p className="text-xs">Your one-stop shop for beauty & fashion.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Shop</h4>
                <ul className="space-y-1 text-xs">
                  <li><Link to="/category/skincare" className="hover:text-pink-500">Skincare</Link></li>
                  <li><Link to="/category/makeup" className="hover:text-pink-500">Makeup</Link></li>
                  <li><Link to="/category/haircare" className="hover:text-pink-500">Haircare</Link></li>
                  <li><Link to="/category/fashion" className="hover:text-pink-500">Fashion</Link></li>
                  <li><Link to="/category/accessories" className="hover:text-pink-500">Accessories</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Support</h4>
                <ul className="space-y-1 text-xs">
                  <li><Link to="/contact" className="hover:text-pink-500">Contact Us</Link></li>
                  <li><Link to="/faqs" className="hover:text-pink-500">FAQs</Link></li>
                  <li><Link to="/shipping" className="hover:text-pink-500">Shipping</Link></li>
                  <li><Link to="/returns" className="hover:text-pink-500">Returns</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Follow Us</h4>
                <ul className="space-y-1 text-xs">
                  <li><a href="#" className="hover:text-pink-500">Instagram</a></li>
                  <li><a href="#" className="hover:text-pink-500">Pinterest</a></li>
                </ul>
              </div>
            </div>
            <div className="text-center pt-6 border-t border-gray-800">
              <p className="text-xs">© 2026 MyPinkShop. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default SkincarePage;
