import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

function Home() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ showBrandStrip: true, showNewsletter: true, featuredProductsCount: 8 });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    // Load homepage data from localStorage (admin settings)
    const savedBanners = JSON.parse(localStorage.getItem('homepage_banners') || '[]');
    const activeBanners = savedBanners.filter(b => b.active).sort((a, b) => a.order - b.order);
    setBanners(activeBanners);

    const savedCategories = JSON.parse(localStorage.getItem('homepage_categories') || '[]');
    const activeCategories = savedCategories.filter(c => c.active).sort((a, b) => a.order - b.order);
    setCategories(activeCategories);

    const savedOffers = JSON.parse(localStorage.getItem('homepage_offers') || '[]');
    const activeOffers = savedOffers.filter(o => o.active).sort((a, b) => a.order - b.order);
    setOffers(activeOffers);

    const savedSettings = JSON.parse(localStorage.getItem('homepage_settings') || '{}');
    setSettings({ showBrandStrip: true, showNewsletter: true, featuredProductsCount: 8, ...savedSettings });

    // Load approved products
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const approvedProducts = allProducts.filter(p => p.adminApproved === true && p.status === 'active');
    setProducts(approvedProducts);
    
    setLoading(false);
  }, []);

  const getDisplayProducts = () => {
    if (searchResults.length > 0) return searchResults;
    let filtered = products;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    return filtered.slice(0, settings.featuredProductsCount);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      const results = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const displayProducts = getDisplayProducts();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white py-3 text-center">
        <div className="container mx-auto px-4">
          <p className="text-sm font-medium tracking-wide">FREE SHIPPING on orders above ₹999 | EXTRA 10% off on first order</p>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-lg">M</span></div>
              <div><h1 className="text-2xl font-bold tracking-tight text-gray-800">MyPinkShop</h1><p className="text-[10px] text-gray-400 tracking-wider">LUXURY BEAUTY & FASHION</p></div>
            </Link>
            <div className="flex-1 max-w-md"><div className="relative"><input type="text" placeholder="Search for products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} className="w-full px-5 py-3 border border-gray-200 rounded-full focus:outline-none focus:border-pink-400 bg-gray-50" /><button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2 bg-pink-500 text-white px-5 py-1.5 rounded-full text-sm font-medium hover:bg-pink-600 transition">Search</button></div></div>
            <div className="flex items-center gap-6">
              <button onClick={() => navigate('/wishlist')} className="relative text-gray-600 hover:text-pink-500 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>{wishlistCount > 0 && <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{wishlistCount}</span>}</button>
              <Link to="/cart" className="relative text-gray-600 hover:text-pink-500 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>{cartCount > 0 && <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>}</Link>
              {user ? <Avatar user={user} onLogout={logout} /> : <Link to="/login" className="text-gray-600 hover:text-pink-500 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></Link>}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banners - Dynamic from Admin */}
      {banners.length > 0 && (
        <div className="overflow-hidden">
          <div className="flex transition-transform duration-500">
            {banners.map(banner => (
              <Link key={banner.id} to={banner.link} className="block w-full flex-shrink-0">
                <div className="relative h-64 md:h-80 bg-cover bg-center rounded-xl mx-4" style={{ backgroundImage: `url(${banner.image})` }}>
                  <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center">
                    <div className="text-center text-white">
                      <h2 className="text-3xl md:text-5xl font-bold mb-2">{banner.title}</h2>
                      <p className="text-lg">{banner.subtitle}</p>
                      <button className="mt-4 bg-white text-pink-600 px-6 py-2 rounded-full font-medium">Shop Now →</button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Categories Section - Dynamic */}
      {categories.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12"><p className="text-pink-500 text-sm font-medium tracking-wider mb-2">SHOP BY CATEGORY</p><h2 className="text-3xl md:text-4xl font-bold text-gray-900">Shop by Category</h2><div className="w-20 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 mx-auto mt-4"></div></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map(cat => (
                <Link key={cat.id} to={cat.link} className="group bg-white rounded-2xl p-8 text-center border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition">{cat.image}</div>
                  <h3 className="font-semibold text-gray-900 text-lg">{cat.name}</h3>
                  <p className="text-sm text-pink-500 mt-2">Shop Now →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Offer Banners - Dynamic */}
      {offers.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {offers.map(offer => (
                <Link key={offer.id} to={offer.link} className={`bg-gradient-to-r ${offer.bg} rounded-2xl p-6 text-white hover:shadow-xl transition hover:-translate-y-1`}>
                  <div className="flex items-center justify-between">
                    <div><h3 className="text-xl font-bold">{offer.title}</h3><p className="text-white/80 text-sm mt-1">{offer.subtitle}</p></div>
                    <div className="text-3xl">→</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12"><p className="text-pink-500 text-sm font-medium tracking-wider mb-2">CUSTOMER FAVORITES</p><h2 className="text-3xl md:text-4xl font-bold text-gray-900">Bestsellers</h2><div className="w-20 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 mx-auto mt-4"></div></div>
          {displayProducts.length === 0 ? (<div className="text-center py-12"><p className="text-gray-500">No products found</p></div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{displayProducts.map(product => (<div key={product.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"><Link to={`/product/${product.id}`}><div className="relative h-64 bg-gray-50 flex items-center justify-center text-7xl"><span className="text-7xl">✨</span><span className="absolute top-3 left-3 bg-pink-500 text-white text-xs px-3 py-1 rounded-full">{product.badge}</span>{product.isNew && <span className="absolute top-3 right-3 bg-rose-500 text-white text-xs px-3 py-1 rounded-full">NEW</span>}</div></Link><div className="p-5"><Link to={`/product/${product.id}`}><h3 className="font-semibold text-gray-900 mb-1 hover:text-pink-500 transition">{product.name}</h3></Link><div className="flex items-center gap-2 mb-2"><div className="flex text-yellow-400 text-sm">{"★".repeat(Math.floor(product.rating))}{"☆".repeat(5 - Math.floor(product.rating))}</div><span className="text-xs text-gray-400">({product.rating})</span></div><div className="flex items-center gap-2 mb-4"><span className="text-xl font-bold text-pink-600">₹{product.price}</span><span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span></div><div className="flex gap-3"><button onClick={() => addToCart(product)} className="flex-1 bg-pink-500 text-white py-2 rounded-full font-medium hover:bg-pink-600 transition">Add to Cart</button><button onClick={() => handleWishlistToggle(product)} className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center hover:bg-pink-50 transition"><svg className={`w-5 h-5 ${isInWishlist(product.id) ? 'text-pink-500 fill-pink-500' : 'text-gray-400'}`} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg></button></div></div></div>))}</div>)}
        </div>
      </section>

      {/* Newsletter */}
      {settings.showNewsletter && (
        <section className="py-16 bg-gradient-to-r from-pink-600 to-rose-600 text-white">
          <div className="container mx-auto px-4 text-center"><div className="max-w-2xl mx-auto"><h2 className="text-3xl font-bold mb-2">Join the Pink Club</h2><p className="text-white/80 mb-6">Subscribe to get 15% off on your first order + exclusive updates</p><div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"><input type="email" placeholder="Your email address" className="flex-1 px-5 py-3 rounded-full text-gray-900 focus:outline-none" /><button className="bg-white text-pink-600 px-6 py-3 rounded-full font-semibold hover:shadow-lg transition">Subscribe</button></div></div></div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 pt-12 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div><div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">M</span></div><h3 className="font-bold text-white text-lg">MyPinkShop</h3></div><p className="text-sm text-gray-500">Luxury beauty and fashion for the modern woman.</p></div>
            <div><h4 className="font-semibold text-white mb-4">Shop</h4><ul className="space-y-2 text-sm"><li><Link to="/shop?category=skincare" className="hover:text-pink-500 transition">Skincare</Link></li><li><Link to="/shop?category=makeup" className="hover:text-pink-500 transition">Makeup</Link></li><li><Link to="/shop?category=clothing" className="hover:text-pink-500 transition">Clothing</Link></li><li><Link to="/shop?category=accessories" className="hover:text-pink-500 transition">Accessories</Link></li></ul></div>
            <div><h4 className="font-semibold text-white mb-4">Support</h4><ul className="space-y-2 text-sm"><li><a href="#" className="hover:text-pink-500 transition">Contact Us</a></li><li><a href="#" className="hover:text-pink-500 transition">FAQs</a></li><li><a href="#" className="hover:text-pink-500 transition">Shipping Info</a></li><li><a href="#" className="hover:text-pink-500 transition">Returns Policy</a></li></ul></div>
            <div><h4 className="font-semibold text-white mb-4">Follow Us</h4><ul className="space-y-2 text-sm"><li><a href="#" className="hover:text-pink-500 transition">Instagram</a></li><li><a href="#" className="hover:text-pink-500 transition">TikTok</a></li><li><a href="#" className="hover:text-pink-500 transition">Pinterest</a></li><li><a href="#" className="hover:text-pink-500 transition">YouTube</a></li></ul></div>
          </div>
          <div className="text-center pt-8 border-t border-gray-800"><p className="text-sm text-gray-500">© 2025 MyPinkShop. All rights reserved.</p></div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
