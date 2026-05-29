import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

// Product Card Component (same as above - copy from MakeupPage)
const ProductCard = ({ product, addToCart, isInWishlist, addToWishlist, removeFromWishlist }) => {
  // ... (same ProductCard code as MakeupPage)
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const handleAddToCart = () => { addToCart(product); setIsAdded(true); setTimeout(() => setIsAdded(false), 1500); };
  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) removeFromWishlist(product.id);
    else addToWishlist(product);
  };
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-pink-100">
      <Link to={`/product/${product.id}`}>
        <div className="relative h-48 sm:h-52 md:h-60 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {product.images && product.images[0] && !imgError ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">{product.emoji || '👗'}</div>
          )}
          {product.badge && <span className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-2 py-1 rounded-full">{product.badge}</span>}
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/product/${product.id}`}><h3 className="font-semibold text-gray-800 mb-1 line-clamp-1 hover:text-pink-500">{product.name}</h3></Link>
        <div className="flex items-center gap-1 mb-2">
          <div className="flex text-yellow-400 text-sm">{'★'.repeat(Math.floor(product.rating || 4))}{'☆'.repeat(5 - Math.floor(product.rating || 4))}</div>
          <span className="text-xs text-gray-400">({product.rating || 4})</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-pink-600">₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={handleAddToCart} className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 rounded-full text-sm font-medium">{isAdded ? 'Added! ✓' : 'Add to Cart'}</button>
          <button onClick={handleWishlistToggle} className="w-10 py-2 border border-pink-200 rounded-full hover:bg-pink-50">{isInWishlist(product.id) ? '❤️' : '🤍'}</button>
        </div>
      </div>
    </div>
  );
};

const clothingCategories = [
  { id: 'womenWestern', name: "Women's Western", icon: '👗' },
  { id: 'womenEthnic', name: "Women's Ethnic", icon: '🥻' },
  { id: 'menWestern', name: "Men's Western", icon: '👔' },
  { id: 'menEthnic', name: "Men's Ethnic", icon: '🤵' },
  { id: 'kids', name: "Kids Wear", icon: '🧸' },
  { id: 'activewear', name: "Activewear", icon: '🏃‍♀️' },
  { id: 'innerwear', name: "Innerwear", icon: '👙' },
  { id: 'sleepwear', name: "Sleepwear", icon: '😴' },
  { id: 'footwear', name: "Footwear", icon: '👠' },
  { id: 'jewelry', name: "Jewelry", icon: '💍' },
];

function ClothingPage() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcat, setSelectedSubcat] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedSize, setSelectedSize] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const clothingProducts = storedProducts.filter(p => 
      p.adminApproved === true && 
      p.status === 'active' && 
      p.category === 'clothing'
    );
    setProducts(clothingProducts);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = [...products];
    if (searchTerm) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (selectedSubcat !== 'all') filtered = filtered.filter(p => p.subcategory === selectedSubcat);
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : Infinity;
    filtered = filtered.filter(p => p.price >= min && p.price <= max);
    if (selectedSize !== 'all') filtered = filtered.filter(p => p.sizes?.includes(selectedSize));
    if (sortBy === 'price_low') filtered.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_high') filtered.sort((a, b) => b.price - a.price);
    setFilteredProducts(filtered);
  }, [searchTerm, selectedSubcat, minPrice, maxPrice, selectedSize, sortBy, products]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSubcat('all');
    setMinPrice('');
    setMaxPrice('');
    setSelectedSize('all');
    setSortBy('default');
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm">✨ Free Shipping on ₹999+ • Extra 10% off on first order ✨</div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><div className="w-9 h-9 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center"><span className="text-white font-bold">M</span></div><h1 className="hidden sm:block text-xl font-bold">MyPinkShop</h1></Link>
          <div className="flex-1 max-w-md"><input type="text" placeholder="Search clothing..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-5 py-2.5 border rounded-full bg-gray-50 text-sm" /></div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/wishlist')} className="relative p-2">❤️{wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4">{wishlistCount}</span>}</button>
            <Link to="/cart" className="relative p-2">🛒{cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4">{cartCount}</span>}</Link>
            {user ? <Avatar user={user} onLogout={logout} /> : <Link to="/login">👤</Link>}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 py-12 text-center">
        <h1 className="text-4xl font-bold text-blue-800 mb-2">Clothing 👗</h1>
        <p className="text-blue-600">Fashion that speaks your style</p>
      </div>

      {/* Categories */}
      <div className="border-b border-pink-100 bg-white overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
            <button onClick={() => setSelectedSubcat('all')} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${selectedSubcat === 'all' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'bg-gray-100'}`}>📦 All ({products.length})</button>
            {clothingCategories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedSubcat(cat.id)} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap flex items-center gap-1 ${selectedSubcat === cat.id ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'bg-gray-100'}`}>
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-500 hover:text-pink-500">Home</Link>
          <span className="text-gray-400">/</span>
          <span className="text-pink-600 font-medium">Clothing</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <button onClick={() => setShowFilters(!showFilters)} className="md:hidden w-full bg-white/80 border border-pink-100 rounded-2xl py-3 mb-4 flex justify-center gap-2">🔽 Filters & Sorting</button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block md:w-80 space-y-5`}>
            <div className="bg-white/80 rounded-2xl p-5 border border-pink-100">
              <h3 className="font-semibold mb-3">💰 Price</h3>
              <div className="flex gap-3"><input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full px-3 py-2 border rounded-xl" /><input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full px-3 py-2 border rounded-xl" /></div>
            </div>
            <div className="bg-white/80 rounded-2xl p-5 border border-pink-100">
              <h3 className="font-semibold mb-3">📏 Size</h3>
              <div className="flex flex-wrap gap-2">{sizes.map(size => (<button key={size} onClick={() => setSelectedSize(selectedSize === size ? 'all' : size)} className={`px-3 py-1 rounded-full text-sm ${selectedSize === size ? 'bg-pink-500 text-white' : 'bg-gray-100'}`}>{size}</button>))}</div>
            </div>
            <button onClick={clearFilters} className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-2xl">Clear All ✨</button>
          </div>

          {/* Products */}
          <div className="flex-1">
            <div className="bg-white/80 rounded-2xl p-4 mb-6 flex justify-between items-center">
              <span>{filteredProducts.length} products</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border rounded-xl"><option value="default">Default</option><option value="price_low">Price: Low to High</option><option value="price_high">Price: High to Low</option></select>
            </div>
            {filteredProducts.length === 0 ? <div className="text-center py-12">No products found</div> : <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{filteredProducts.map(p => <ProductCard key={p.id} product={p} addToCart={addToCart} isInWishlist={isInWishlist} addToWishlist={addToWishlist} removeFromWishlist={removeFromWishlist} />)}</div>}
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 py-12 mt-8 text-center">© 2026 MyPinkShop. All rights reserved.</footer>
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

export default ClothingPage;
