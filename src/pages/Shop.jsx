import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

function Shop() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    if (category && category !== 'all') {
      setSelectedCategory(category);
    }
    
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const approvedProducts = allProducts.filter(p => p.adminApproved === true && p.status === 'active');
    setProducts(approvedProducts);
    setLoading(false);
  }, [location]);

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
    
    if (sortBy === 'price_low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_high') {
      filtered.sort((a, b) => b.price - a.price);
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, minPrice, maxPrice, sortBy, products]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
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
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50">
      
      {/* Header */}
      <div className="bg-white border-b border-pink-100 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-pink-600">MyPinkShop</Link>
          <div className="flex items-center gap-4">
            <Link to="/wishlist" className="relative text-2xl">🤍{wishlistCount > 0 && <span className="absolute -top-2 -right-3 bg-pink-500 text-white text-xs rounded-full w-5 h-5">{wishlistCount}</span>}</Link>
            <Link to="/cart" className="relative text-2xl">🛒{cartCount > 0 && <span className="absolute -top-2 -right-3 bg-pink-500 text-white text-xs rounded-full w-5 h-5">{cartCount}</span>}</Link>
            {user ? <Avatar user={user} onLogout={logout} /> : <Link to="/login" className="text-2xl">👤</Link>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Filters Row */}
        <div className="bg-white rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg" />
            
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-2 border rounded-lg">
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name} ({cat.count})</option>)}
            </select>
            
            <input type="number" placeholder="Min Price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-28 px-3 py-2 border rounded-lg" />
            <input type="number" placeholder="Max Price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-28 px-3 py-2 border rounded-lg" />
            
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border rounded-lg">
              <option value="default">Default</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
            
            <button onClick={clearFilters} className="px-4 py-2 bg-pink-500 text-white rounded-lg">Clear</button>
          </div>
        </div>
        
        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow hover:shadow-md transition">
                <Link to={`/product/${product.id}`}>
                  <div className="h-48 bg-gray-100 flex items-center justify-center text-5xl">
                    {product.images && product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      product.emoji || '✨'
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-gray-800 line-clamp-1">{product.name}</h3>
                  </Link>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm">{product.rating || 4}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-xl font-bold text-pink-600">₹{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through ml-2">₹{product.originalPrice}</span>
                    )}
                  </div>
                  <button onClick={() => addToCart(product)} className="w-full mt-3 bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 mt-8 text-center">
        <p>© 2026 MyPinkShop. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Shop;
