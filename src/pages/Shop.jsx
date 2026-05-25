import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

function Shop() {
  const location = useLocation();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
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

  useEffect(() => {
    // Get URL params for offer filtering
    const params = new URLSearchParams(location.search);
    const offer = params.get('offer');
    
    // Load only approved products
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    let approvedProducts = allProducts.filter(p => p.adminApproved === true && p.status === 'active');
    
    // Apply offer filter if present
    if (offer === 'first') {
      approvedProducts = approvedProducts.filter(p => p.isNew === true);
    } else if (offer === 'bogo') {
      approvedProducts = approvedProducts.filter(p => p.category === 'skincare');
    }
    
    setProducts(approvedProducts);
    setFilteredProducts(approvedProducts);
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
      filtered = filtered.filter(p => p.rating >= selectedRating);
    }
    
    switch(sortBy) {
      case 'price_low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price_high': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating': filtered.sort((a, b) => b.rating - a.rating); break;
      default: filtered.sort((a, b) => a.id - b.id);
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
    { id: 'all', name: 'All Products', icon: '✨' },
    { id: 'skincare', name: 'Skincare', icon: '🧴' },
    { id: 'makeup', name: 'Makeup', icon: '💄' },
    { id: 'clothing', name: 'Clothing', icon: '👗' },
    { id: 'accessories', name: 'Accessories', icon: '👜' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
          <Link to="/"><h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">MyPinkShop</h1></Link>
          <div className="flex-1 max-w-md"><div className="relative"><input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-5 py-2 pr-12 border border-pink-200 rounded-full focus:outline-none focus:border-pink-500 bg-white" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span></div></div>
          <div className="flex items-center gap-4"><Link to="/wishlist" className="text-2xl text-gray-600 hover:text-pink-500">🤍</Link><Link to="/cart" className="text-2xl text-gray-600 hover:text-pink-500">🛒</Link></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6"><Link to="/" className="hover:text-pink-500">Home</Link><span>/</span><span className="text-pink-600">Shop</span></div>

        <button onClick={() => setShowFilters(!showFilters)} className="md:hidden w-full bg-white border border-pink-100 rounded-xl py-3 mb-4 flex items-center justify-center gap-2">🔽 Filters & Sorting</button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block md:w-72 space-y-5`}>
            <div className="bg-white rounded-xl p-5 border border-pink-100"><h3 className="font-semibold text-gray-800 mb-3">Categories</h3><div className="space-y-2">{categories.map(cat => (<label key={cat.id} className="flex items-center gap-3 cursor-pointer"><input type="radio" name="category" checked={selectedCategory === cat.id} onChange={() => setSelectedCategory(cat.id)} className="w-4 h-4 text-pink-500" /><span>{cat.icon}</span><span className="text-sm text-gray-600">{cat.name}</span></label>))}</div></div>
            <div className="bg-white rounded-xl p-5 border border-pink-100"><h3 className="font-semibold text-gray-800 mb-3">Price Range</h3><div className="flex gap-3"><input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-1/2 px-3 py-2 border border-pink-200 rounded-lg text-sm" /><input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-1/2 px-3 py-2 border border-pink-200 rounded-lg text-sm" /></div></div>
            <div className="bg-white rounded-xl p-5 border border-pink-100"><h3 className="font-semibold text-gray-800 mb-3">Rating</h3><div className="space-y-2">{[4, 3].map(r => (<label key={r} className="flex items-center gap-3 cursor-pointer"><input type="radio" name="rating" checked={selectedRating === r} onChange={() => setSelectedRating(selectedRating === r ? 0 : r)} className="w-4 h-4 text-pink-500" /><div className="flex text-yellow-400">{'★'.repeat(r)}{'☆'.repeat(5-r)}</div><span className="text-sm text-gray-500">& above</span></label>))}<label className="flex items-center gap-3 cursor-pointer"><input type="radio" name="rating" checked={selectedRating === 0} onChange={() => setSelectedRating(0)} className="w-4 h-4 text-pink-500" /><span className="text-sm text-gray-600">All ratings</span></label></div></div>
            <button onClick={clearFilters} className="w-full bg-pink-500 text-white py-2 rounded-full text-sm font-medium hover:bg-pink-600 transition">Clear All Filters ✨</button>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="bg-white rounded-xl p-4 mb-5 flex flex-wrap justify-between items-center gap-3 border border-pink-100"><p className="text-sm text-gray-500">Showing {filteredProducts.length} of {products.length} products</p><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border border-pink-200 rounded-full text-sm focus:outline-none focus:border-pink-500"><option value="default">Sort by: Default</option><option value="price_low">Price: Low to High</option><option value="price_high">Price: High to Low</option><option value="rating">Rating: High to Low</option></select></div>
            
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-pink-100"><div className="text-6xl mb-4">🔍</div><h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3><p className="text-gray-500 mb-4">Try adjusting your filters or search term</p><button onClick={clearFilters} className="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition">Clear Filters</button></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {filteredProducts.map(product => (
                  <div key={product.id} className="group bg-white rounded-2xl overflow-hidden border border-pink-100 hover:shadow-lg transition hover:-translate-y-1">
                    <Link to={`/product/${product.id}`}><div className="relative h-48 bg-gradient-to-br from-pink-50 to-pink-100/30 flex items-center justify-center text-6xl">{product.emoji || '✨'}{product.badge && <span className="absolute top-2 left-2 text-xs bg-pink-500 text-white px-2 py-1 rounded-full">{product.badge}</span>}{!product.inStock && product.stock === 0 && <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-medium">Out of Stock</span>}</div></Link>
                    <div className="p-4"><Link to={`/product/${product.id}`}><h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{product.name}</h3></Link><div className="flex items-center gap-1 mb-2"><span className="text-yellow-400 text-sm">★</span><span className="text-sm text-gray-600">{product.rating}</span></div><div className="flex items-center gap-2 mb-3"><span className="text-lg font-bold text-pink-600">₹{product.price}</span><span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span></div><div className="flex gap-2"><button onClick={() => addToCart(product)} disabled={product.stock === 0} className={`flex-1 py-2 rounded-full text-sm font-medium transition ${product.stock > 0 ? 'bg-pink-500 text-white hover:bg-pink-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>🛒</button><button onClick={() => addToWishlist(product)} className="w-10 py-2 border border-pink-200 rounded-full text-center hover:bg-pink-50 transition">{isInWishlist(product.id) ? '❤️' : '🤍'}</button></div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Shop;
