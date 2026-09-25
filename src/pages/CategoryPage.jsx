import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';

const API_URL = 'https://api.mypinkshop.com';

function CategoryPage() {
  const { slug } = useParams(); // URL se slug milega
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);

  // ✅ STEP 1: Category + Subcategories fetch karo (tree se)
  useEffect(() => {
    const loadCategory = async () => {
      try {
        setLoading(true);
        
        const res = await fetch(`${API_URL}/api/categories/tree`);
        if (!res.ok) throw new Error('Failed to load categories');
        
        const json = await res.json();
        const tree = json.data || json;
        
        // Slug se category dhundo
        const found = tree.find(c => c.slug === slug);
        
        if (!found) {
          toast.error('Category not found');
          navigate('/');
          return;
        }
        
        setCategory(found);
        setSubcategories(found.children || []);
      } catch (err) {
        console.error('Category load error:', err);
        toast.error('Failed to load category');
      }
    };
    
    loadCategory();
  }, [slug, navigate]);

  // ✅ STEP 2: Products fetch karo
  useEffect(() => {
    const loadProducts = async () => {
      if (!category) return;
      
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/products`);
        if (!res.ok) throw new Error('Failed to load products');
        
        const data = await res.json();
        const productsArray = Array.isArray(data) ? data : (data.data || []);
        
        // Sirf is category ke products
        const categoryProducts = productsArray.filter(p => 
          p.is_active === 1 &&
          p.main_category === category.name
        ).map(p => ({
          ...p,
          id: p.id || p._id,
          images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || []),
          subCategory: p.sub_category,
          mainCategory: p.main_category,
          originalPrice: p.original_price,
        }));
        
        setProducts(categoryProducts);
      } catch (err) {
        console.error('Products load error:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [category]);

  // ✅ STEP 3: Filter + Sort
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

  // Brands from products
  const brands = useMemo(() => {
    const unique = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return [{ id: 'all', name: 'All Brands' }, ...unique.map(b => ({ id: b, name: b }))];
  }, [products]);

  const priceRanges = [
    { id: 'all', name: 'All Prices' },
    { id: 'under500', name: 'Under ₹500' },
    { id: '500-1000', name: '₹500 - ₹1000' },
    { id: '1000-2000', name: '₹1000 - ₹2000' },
    { id: '2000-5000', name: '₹2000 - ₹5000' },
    { id: 'above5000', name: 'Above ₹5000' },
  ];

  const sortOptions = [
    { id: 'default', name: 'Default Sorting' },
    { id: 'price_low', name: 'Price: Low to High' },
    { id: 'price_high', name: 'Price: High to Low' },
    { id: 'rating', name: 'Highest Rated' },
    { id: 'newest', name: 'Newest First' },
  ];

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSubcategory('all');
    setSelectedBrand('all');
    setPriceRange('all');
    setSortBy('default');
  };

  if (loading && !category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{category?.name} - Shop Online | MyPinkShop</title>
        <meta name="description" content={`Shop ${category?.name} products at MyPinkShop. Best prices, fast delivery.`} />
        <link rel="canonical" href={`https://www.mypinkshop.com/category/${slug}`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <OfferBanner />

        {/* Header (same as your existing) */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
              </Link>

              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder={`Search ${category?.name}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-full bg-gray-50 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Link to="/wishlist" className="relative p-2">
                  🤍
                  {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{wishlistCount}</span>}
                </Link>
                <Link to="/cart" className="relative p-2">
                  🛒
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
                </Link>
                {user ? <Avatar user={user} onLogout={logout} /> : <Link to="/login">👤</Link>}
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <div className="bg-gradient-to-r from-pink-100 via-rose-100 to-pink-100">
          <div className="max-w-7xl mx-auto px-4 py-12 text-center">
            <div className="text-5xl mb-3">{category?.icon || '🛍️'}</div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
              {category?.name}
            </h1>
            <p className="text-gray-600 text-sm">{category?.description || `Explore our ${category?.name} collection`}</p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">{category?.name}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-12">
          
          {/* ✅ SUBCATEGORY CHIPS (Ye naya hai!) */}
          {subcategories.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubcategory('all')}
                className={`px-4 py-2 rounded-full text-sm border transition ${
                  selectedSubcategory === 'all'
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white border-pink-200 text-gray-700 hover:border-pink-400'
                }`}
              >
                All
              </button>
              {subcategories.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.name)}
                  className={`px-4 py-2 rounded-full text-sm border transition flex items-center gap-1 ${
                    selectedSubcategory === sub.name
                      ? 'bg-pink-500 text-white border-pink-500'
                      : 'bg-white border-pink-200 text-gray-700 hover:border-pink-400'
                  }`}
                >
                  <span>{sub.icon}</span>
                  <span>{sub.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Filters Bar */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="hidden md:flex gap-2">
                <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-full text-sm bg-white">
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="px-3 py-2 border border-pink-200 rounded-full text-sm bg-white">
                  {priceRanges.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <button onClick={() => setShowFilters(!showFilters)} className="md:hidden px-4 py-2 border border-pink-200 rounded-full text-sm bg-white">
                Filters 🔽
              </button>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border border-pink-200 rounded-full text-sm bg-white">
                {sortOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="mb-4">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-pink-600">{filteredProducts.length}</span> products
            </p>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white/80 rounded-2xl p-12 text-center border border-pink-100">
              <div className="text-6xl mb-3">{category?.icon || '🛍️'}</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">No products found</h3>
              <p className="text-gray-500 text-sm mb-4">
                {selectedSubcategory !== 'all' ? `No products in "${selectedSubcategory}" yet` : 'Coming soon!'}
              </p>
              <button onClick={clearFilters} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full text-sm">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  addToCart={addToCart}
                  isInWishlist={isInWishlist}
                  addToWishlist={addToWishlist}
                  removeFromWishlist={removeFromWishlist}
                  user={user}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer (same as existing) */}
      </div>
    </>
  );
}

export default CategoryPage;
