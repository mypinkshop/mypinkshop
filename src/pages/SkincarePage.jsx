import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';
import toast from 'react-hot-toast';

// ============ PRODUCT CARD ============
const ProductCard = ({ product, addToCart, isInWishlist, addToWishlist, removeFromWishlist, user }) => {
  const navigate = useNavigate();
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const checkWishlist = () => {
      if (user) {
        setIsWishlisted(isInWishlist(product._id || product.id));
      } else {
        const saved = localStorage.getItem('guestWishlist');
        if (saved) {
          try {
            const wishlist = JSON.parse(saved);
            const exists = wishlist.some(item => (item._id === product._id || item.id === product._id));
            setIsWishlisted(exists);
          } catch(e) {}
        }
      }
    };
    checkWishlist();
    
    const handleUpdate = () => {
      if (!user) {
        const saved = localStorage.getItem('guestWishlist');
        if (saved) {
          try {
            const wishlist = JSON.parse(saved);
            const exists = wishlist.some(item => (item._id === product._id || item.id === product._id));
            setIsWishlisted(exists);
          } catch(e) {}
        }
      } else {
        setIsWishlisted(isInWishlist(product._id || product.id));
      }
    };
    
    window.addEventListener('wishlistUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      window.removeEventListener('wishlistUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [product, user, isInWishlist]);

  const handleAddToCart = () => {
    addToCart({
      id: product._id || product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images?.[0],
      stock: product.stock
    });
    setIsAdded(true);
    toast.success('Added to cart!');
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleGoToCart = () => navigate('/cart');

  const handleWishlistToggle = () => {
    const productId = product._id || product.id;
    
    if (user) {
      if (isWishlisted) {
        removeFromWishlist(productId);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        addToWishlist(product);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } else {
      let wishlist = [];
      const saved = localStorage.getItem('guestWishlist');
      if (saved) {
        try {
          wishlist = JSON.parse(saved);
          if (!Array.isArray(wishlist)) wishlist = [];
        } catch(e) { wishlist = []; }
      }
      
      const exists = wishlist.some(item => (item._id === productId || item.id === productId));
      
      if (!exists) {
        wishlist.push({
          _id: productId,
          id: productId,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          images: product.images,
          rating: product.rating,
          brand: product.brand,
          stock: product.stock
        });
        localStorage.setItem('guestWishlist', JSON.stringify(wishlist));
        setIsWishlisted(true);
        toast.success('Added to wishlist! 🤍');
      } else {
        wishlist = wishlist.filter(item => (item._id !== productId && item.id !== productId));
        localStorage.setItem('guestWishlist', JSON.stringify(wishlist));
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      }
      
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
    }
  };

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
      <Link to={`/product/${product._id || product.id}`}>
        <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-50 flex items-center justify-center">
          {!imageLoaded && !imgError && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 to-gray-200" />
          )}
          
          {product.images && product.images[0] && !imgError ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className={`w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onError={() => setImgError(true)}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
              decoding="async"
              width="300"
              height="300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">✨</div>
          )}
          {product.badge && (
            <span className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-3 py-1 rounded-full shadow-md z-10 font-medium">
              {product.badge}
            </span>
          )}
          {product.isNew && (
            <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs px-3 py-1 rounded-full shadow-md z-10 font-medium">
              NEW
            </span>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/product/${product._id || product.id}`}>
          <h3 className="font-medium text-gray-800 text-sm mb-1 line-clamp-1 hover:text-pink-600 transition">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-400 mb-2">{product.brand || 'MyPinkShop'}</p>
        
        <div className="flex items-center gap-1 mb-2">
          <div className="flex text-yellow-400 text-xs">
            {'★'.repeat(Math.floor(product.rating || 4))}
            {'☆'.repeat(5 - Math.floor(product.rating || 4))}
          </div>
          <span className="text-xs text-gray-400">({product.rating || 4})</span>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-pink-600">₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <>
              <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
              <span className="text-xs text-emerald-500 font-medium">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
              </span>
            </>
          )}
        </div>
        
        <div className="flex gap-2">
          {isAdded ? (
            <button onClick={handleGoToCart} className="flex-1 py-2 rounded-lg text-sm bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition">
              ✓ Go to Cart
            </button>
          ) : (
            <button onClick={handleAddToCart} className="flex-1 py-2 rounded-lg text-sm bg-pink-600 text-white font-medium hover:bg-pink-700 transition">
              Add to Cart
            </button>
          )}
          
          <button onClick={handleWishlistToggle} className="w-10 py-2 rounded-lg border border-gray-200 hover:border-pink-300 transition">
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ CATEGORY SIDEBAR ============
const CategorySidebar = ({ 
  categories, 
  selectedCategory, 
  setSelectedCategory,
  brands,
  selectedBrand,
  setSelectedBrand,
  clearFilters,
  isMobile,
  setIsMobile
}) => {
  const sidebarContent = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Categories</h3>
        <div className="space-y-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                selectedCategory === cat.id 
                  ? 'bg-pink-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Brands</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
            {brands.map(brand => (
              <button
                key={brand.id}
                onClick={() => setSelectedBrand(brand.id)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${
                  selectedBrand === brand.id 
                    ? 'bg-pink-50 text-pink-600 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {brand.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      <button
        onClick={clearFilters}
        className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
      >
        Clear All Filters
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobile(false)}>
        <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-semibold text-gray-800">Filters</h2>
            <button onClick={() => setIsMobile(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
          {sidebarContent}
        </div>
      </div>
    );
  }

  return (
    <div className="w-56 flex-shrink-0 sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto pr-4">
      {sidebarContent}
    </div>
  );
};

// ============ MAIN SKINCARE PAGE ============
function SkincarePage() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const API_URL = 'https://api.mypinkshop.com';

  // ===== GET SUBCATEGORY =====
  const getSubcategory = (product) => {
    const sub = product.subCategory || 
                product.subcategory || 
                product.category || 
                product.mainCategory || 
                '';
    
    if (['Skincare', 'skincare', 'General', 'general', ''].includes(sub)) {
      return '';
    }
    return sub;
  };

  // ===== LOAD PRODUCTS =====
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        
        const cached = sessionStorage.getItem('products_cache');
        const cacheTime = sessionStorage.getItem('products_cache_time');
        
        if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 60000) {
          const data = JSON.parse(cached);
          const productsArray = data.products || data;
          const skincareProducts = productsArray.filter(p => 
            (p.mainCategory === 'Skincare' || p.category === 'Skincare' || p.category === 'skincare') &&
            p.status === 'active'
          ).map(p => ({ 
            ...p, 
            id: p._id, 
            subcategory: getSubcategory(p)
          }));
          setProducts(skincareProducts);
          setLoading(false);
          return;
        }
        
        const response = await fetch(`${API_URL}/api/products`);
        if (!response.ok) throw new Error('Failed to load products');
        
        let data = await response.json();
        const productsArray = data.products || data;
        
        sessionStorage.setItem('products_cache', JSON.stringify(data));
        sessionStorage.setItem('products_cache_time', Date.now().toString());
        
        const skincareProducts = productsArray.filter(p => 
          (p.mainCategory === 'Skincare' || p.category === 'Skincare' || p.category === 'skincare') &&
          p.status === 'active'
        ).map(p => ({ 
          ...p, 
          id: p._id, 
          subcategory: getSubcategory(p)
        }));
        
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

  // ===== FILTER =====
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => {
        const productSub = (p.subcategory || '').toLowerCase();
        const selected = selectedCategory.toLowerCase();
        return productSub === selected || productSub.includes(selected);
      });
    }

    if (selectedBrand !== 'all') {
      filtered = filtered.filter(p => p.brand === selectedBrand);
    }
    
    return filtered;
  }, [products, searchTerm, selectedCategory, selectedBrand]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedBrand('all');
  };

  // ===== MEMOIZED OPTIONS =====
  const categories = useMemo(() => {
    const subs = [...new Set(products.map(p => p.subcategory).filter(Boolean))];
    return [{ id: 'all', name: 'All Categories' }, ...subs.map(s => ({ id: s.toLowerCase().replace(/ /g, '_'), name: s }))];
  }, [products]);

  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return uniqueBrands.map(b => ({ id: b, name: b }));
  }, [products]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
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

      <div className="min-h-screen bg-white">
        
        <OfferBanner />

        {/* ===== HEADER ===== */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
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
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 bg-gray-50 text-sm"
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </button>
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

        {/* ===== HERO BANNER ===== */}
        <div className="relative bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-20 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 drop-shadow-lg">
              Skincare
            </h1>
            <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto mb-6">
              Discover premium skincare for glowing, radiant skin.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/shop" className="bg-white text-pink-600 px-6 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg transition-all hover:scale-105">
                Shop Now
              </Link>
            </div>
          </div>
        </div>

        {/* ===== BREADCRUMB ===== */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-600">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">Skincare</span>
          </div>
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="max-w-7xl mx-auto px-4 pb-12">
          
          {/* Mobile Filter Button */}
          <div className="md:hidden flex items-center justify-between mb-4">
            <button 
              onClick={() => setIsMobileFilterOpen(true)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white flex items-center gap-2"
            >
              <span>☰</span> Filters
            </button>
            <span className="text-sm text-gray-500">{filteredProducts.length} products</span>
          </div>

          <div className="flex gap-8">
            {/* ===== LEFT SIDEBAR (Desktop) ===== */}
            <div className="hidden md:block">
              <CategorySidebar 
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                brands={brands}
                selectedBrand={selectedBrand}
                setSelectedBrand={setSelectedBrand}
                clearFilters={clearFilters}
                isMobile={false}
                setIsMobile={() => {}}
              />
            </div>

            {/* ===== MOBILE FILTERS ===== */}
            <CategorySidebar 
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              brands={brands}
              selectedBrand={selectedBrand}
              setSelectedBrand={setSelectedBrand}
              clearFilters={clearFilters}
              isMobile={true}
              setIsMobile={setIsMobileFilterOpen}
            />

            {/* ===== PRODUCTS ===== */}
            <div className="flex-1 min-w-0">
              {/* Results */}
              <div className="hidden md:flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">{filteredProducts.length} products</p>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-12 text-center">
                  <div className="text-6xl mb-3">🧴</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">No products found</h3>
                  <p className="text-gray-500 text-sm mb-4">Try adjusting your filters</p>
                  <button onClick={clearFilters} className="bg-pink-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-pink-700 transition">
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map(product => (
                    <ProductCard 
                      key={product._id} 
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
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">M</span>
                  </div>
                  <h3 className="font-bold text-white">MyPinkShop</h3>
                </div>
                <p className="text-xs">Luxury skincare for glowing skin.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Shop</h4>
                <ul className="space-y-1 text-xs">
                  <li><Link to="/skincare" className="hover:text-pink-500">Skincare</Link></li>
                  <li><Link to="/makeup" className="hover:text-pink-500">Makeup</Link></li>
                  <li><Link to="/hair" className="hover:text-pink-500">Hair Care</Link></li>
                  <li><Link to="/clothing" className="hover:text-pink-500">Clothing</Link></li>
                  <li><Link to="/accessories" className="hover:text-pink-500">Accessories</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Support</h4>
                <ul className="space-y-1 text-xs">
                  <li><Link to="/contact" className="hover:text-pink-500">Contact Us</Link></li>
                  <li><Link to="/faqs" className="hover:text-pink-500">FAQs</Link></li>
                  <li><Link to="/shipping-info" className="hover:text-pink-500">Shipping</Link></li>
                  <li><Link to="/returns-policy" className="hover:text-pink-500">Returns</Link></li>
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
