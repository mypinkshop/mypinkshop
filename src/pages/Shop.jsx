import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

// ✅ Product Card Component with proper image handling
const ProductCard = ({ product, addToCart, isInWishlist, addToWishlist, removeFromWishlist }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.images && product.images[0] && !imgError ? (
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition duration-300"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-gray-400">
              {product.emoji || '🛍️'}
            </div>
          )}
          {product.badge && (
            <span className="absolute top-2 left-2 bg-pink-600 text-white text-xs px-2 py-1 rounded">
              {product.badge}
            </span>
          )}
          {product.isNew && (
            <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded">
              NEW
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-sm font-medium">Out of Stock</span>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-3 sm:p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-800 text-sm sm:text-base line-clamp-2 hover:text-pink-600 transition min-h-[40px] sm:min-h-[48px]">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center gap-1 mt-1">
          <div className="flex text-yellow-500 text-xs sm:text-sm">
            {'★'.repeat(Math.floor(product.rating || 4))}
            {'☆'.repeat(5 - Math.floor(product.rating || 4))}
          </div>
          <span className="text-xs text-gray-400">({product.rating || 4})</span>
        </div>
        
        <div className="mt-2">
          <span className="text-lg sm:text-xl font-bold text-pink-600">₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through ml-2">₹{product.originalPrice}</span>
          )}
        </div>
        
        <button 
          onClick={handleAddToCart} 
          disabled={product.stock === 0}
          className={`w-full mt-3 py-2 rounded-lg text-sm font-medium transition ${
            product.stock > 0 
              ? 'bg-pink-600 text-white hover:bg-pink-700' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isAdded ? 'Added to Cart ✓' : 'Add to Cart'}
        </button>
        
        <button 
          onClick={handleWishlistToggle}
          className="w-full mt-2 text-center text-xs sm:text-sm text-gray-500 hover:text-pink-600 transition"
        >
          {isInWishlist(product.id) ? '❤️ Remove from Wishlist' : '🤍 Add to Wishlist'}
        </button>
      </div>
    </div>
  );
};

function Shop() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);

  // Get category from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    const offer = params.get('offer');
    const sort = params.get('sort');
    
    if (category && category !== 'all') {
      setSelectedCategory(category);
    }
    if (sort === 'newest') {
      setSortBy('newest');
    } else if (sort === 'bestseller') {
      setSortBy('rating');
    }
    
    // ✅ Load ONLY approved and active products (no deleted products)
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    let approvedProducts = allProducts.filter(p => p.adminApproved === true && p.status === 'active');
    
    if (offer === 'sale') {
      approvedProducts = approvedProducts.filter(p => p.badge === 'Sale');
    }
    
    setProducts(approvedProducts);
    setLoading(false);
  }, [location]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : Infinity;
    filtered = filtered.filter(p => p.price >= min && p.price <= max);
    
    if (selectedRating > 0) {
      filtered = filtered.filter(p => (p.rating || 4) >= selectedRating);
    }
    
    switch(sortBy) {
      case 'price_low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price_high': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest': filtered.sort((a, b) => (b.id || 0) - (a.id || 0)); break;
      default: filtered.sort((a, b) => (a.id || 0) - (b.id || 0));
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, minPrice, maxPrice, selectedRating, sortBy, products]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setSelectedRating(0);
    setSortBy('default');
  };

  const categories = [
    { id: 'all', name: 'All Products', count: products.length },
    { id: 'skincare', name: 'Skincare', count: products.filter(p => p.category === 'skincare').length },
    { id: 'makeup', name: 'Makeup', count: products.filter(p => p.category === 'makeup').length },
    { id: 'clothing', name: 'Clothing', count: products.filter(p => p.category === 'clothing').length },
    { id: 'accessories', name: 'Accessories', count: products.filter(p => p.category === 'accessories').length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Top Bar */}
      <div className="bg-gray-900 text-white py-2 text-center text-sm">
        Free Shipping on ₹999+ | Extra 10% off on first order | Cash on Delivery Available
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-pink-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">M</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">MyPinkShop</h1>
                <p className="text-[9px] sm:text-[10px] text-gray-400">FOR THE GIRLIES</p>
              </div>
            </Link>

            <div className="flex-1 max-w-md lg:max-w-2xl">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search for products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 text-sm sm:text-base"
                />
                <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-pink-600 text-white px-4 sm:px-6 py-1.5 rounded-lg text-sm font-medium hover:bg-pink-700 transition">
                  Search
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
              <button onClick={() => navigate('/wishlist')} className="relative p-1.5 sm:p-2 text-gray-600 hover:text-pink-600 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{wishlistCount}</span>}
              </button>
              
              <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-600 hover:text-pink-600 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{cartCount}</span>}
              </Link>
              
              {user ? <Avatar user={user} onLogout={logout} /> : 
                <Link to="/login" className="p-1.5 sm:p-2 text-gray-600 hover:text-pink-600 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              }
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-pink-600">Home</Link>
          <span>/</span>
          <span className="text-gray-700">Shop</span>
          {selectedCategory !== 'all' && (
            <>
              <span>/</span>
              <span className="text-pink-600 capitalize">{selectedCategory}</span>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        
        {/* Mobile Filter Button */}
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className="md:hidden w-full bg-white border border-gray-200 rounded-lg py-3 mb-4 flex items-center justify-center gap-2 text-gray-700 font-medium"
        >
          🔽 Filters & Sorting
        </button>

        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
          
          {/* Left Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block md:w-72 space-y-5`}>
            
            {/* Categories */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">Shop by Category</h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center justify-between cursor-pointer p-1 hover:text-pink-600 transition">
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="category" 
                        checked={selectedCategory === cat.id} 
                        onChange={() => setSelectedCategory(cat.id)} 
                        className="w-4 h-4 text-pink-600"
                      />
                      <span className="text-sm text-gray-700">{cat.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{cat.count}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">Price Range</h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input 
                    type="number" 
                    placeholder="Min ₹" 
                    value={minPrice} 
                    onChange={(e) => setMinPrice(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div className="flex-1">
                  <input 
                    type="number" 
                    placeholder="Max ₹" 
                    value={maxPrice} 
                    onChange={(e) => setMaxPrice(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">Customer Rating</h3>
              <div className="space-y-2">
                {[4, 3].map(r => (
                  <label key={r} className="flex items-center gap-3 cursor-pointer p-1">
                    <input 
                      type="radio" 
                      name="rating" 
                      checked={selectedRating === r} 
                      onChange={() => setSelectedRating(selectedRating === r ? 0 : r)} 
                      className="w-4 h-4 text-pink-600"
                    />
                    <div className="flex text-yellow-500 text-sm">
                      {'★'.repeat(r)}{'☆'.repeat(5 - r)}
                    </div>
                    <span className="text-xs text-gray-500">& above</span>
                  </label>
                ))}
                <label className="flex items-center gap-3 cursor-pointer p-1">
                  <input 
                    type="radio" 
                    name="rating" 
                    checked={selectedRating === 0} 
                    onChange={() => setSelectedRating(0)} 
                    className="w-4 h-4 text-pink-600"
                  />
                  <span className="text-sm text-gray-600">All ratings</span>
                </label>
              </div>
            </div>

            {/* Clear Filters */}
            <button 
              onClick={clearFilters} 
              className="w-full bg-pink-600 text-white py-2 rounded-lg font-medium hover:bg-pink-700 transition"
            >
              Clear all filters
            </button>
          </div>

          {/* Right Section - Products */}
          <div className="flex-1">
            
            {/* Sort Bar */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex flex-wrap justify-between items-center gap-3">
              <div className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-800">{filteredProducts.length}</span> of {products.length} products
              </div>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-pink-500 bg-white"
              >
                <option value="default">Sort by: Default</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Rating: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
            
            {/* Products Grid - Fully Responsive */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters or search term</p>
                <button onClick={clearFilters} className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition">Clear Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5">
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    addToCart={addToCart}
                    isInWishlist={isInWishlist}
                    addToWishlist={addToWishlist}
                    removeFromWishlist={removeFromWishlist}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-pink-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <h3 className="font-bold text-white text-lg">MyPinkShop</h3>
              </div>
              <p className="text-sm">Luxury beauty and fashion for the modern woman.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/shop?category=skincare" className="hover:text-pink-500 transition">Skincare</Link></li>
                <li><Link to="/shop?category=makeup" className="hover:text-pink-500 transition">Makeup</Link></li>
                <li><Link to="/shop?category=clothing" className="hover:text-pink-500 transition">Clothing</Link></li>
                <li><Link to="/shop?category=accessories" className="hover:text-pink-500 transition">Accessories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-pink-500 transition">Contact Us</Link></li>
                <li><Link to="/faqs" className="hover:text-pink-500 transition">FAQs</Link></li>
                <li><Link to="/shipping" className="hover:text-pink-500 transition">Shipping Info</Link></li>
                <li><Link to="/returns" className="hover:text-pink-500 transition">Returns Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Follow Us</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-pink-500 transition">Instagram</a></li>
                <li><a href="#" className="hover:text-pink-500 transition">TikTok</a></li>
                <li><a href="#" className="hover:text-pink-500 transition">Pinterest</a></li>
                <li><a href="#" className="hover:text-pink-500 transition">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-gray-800">
            <p className="text-sm">© 2026 MyPinkShop. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Shop;
