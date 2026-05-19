import { useState, useEffect } from 'react';
import { Link, useNavigate }react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

function Home() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    targetDate.setHours(23, 59, 59, 999);

    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetDate - now;
      if (diff <= 0) {
        clearInterval(interval);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (86400000)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (3600000)) / (1000 * 60)),
        seconds: Math.floor((diff % (60000)) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const allProducts = [
    { id: 1, name: "Glass Skin Serum", category: "skincare", price: 1299, originalPrice: 1999, rating: 4.8, badge: "Bestseller", isNew: true },
    { id: 2, name: "Rice Water Toner", category: "skincare", price: 899, originalPrice: 1299, rating: 4.6, badge: "Trending", isNew: false },
    { id: 3, name: "Cherry Lip Tint", category: "makeup", price: 599, originalPrice: 999, rating: 4.7, badge: "Viral", isNew: true },
    { id: 4, name: "Satin Slip Dress", category: "clothing", price: 2499, originalPrice: 3999, rating: 4.9, badge: "Best Seller", isNew: false },
    { id: 5, name: "Baby Pink Blush", category: "makeup", price: 799, originalPrice: 1299, rating: 4.5, badge: "Trending", isNew: true },
    { id: 6, name: "Coquette Bow Dress", category: "clothing", price: 2999, originalPrice: 4499, rating: 4.8, badge: "New Arrival", isNew: true },
    { id: 7, name: "Vitamin C Drops", category: "skincare", price: 1499, originalPrice: 2299, rating: 4.9, badge: "Bestseller", isNew: true },
    { id: 8, name: "Y2K Mesh Top", category: "clothing", price: 1599, originalPrice: 2499, rating: 4.6, badge: "Trending", isNew: false },
    { id: 9, name: "Pearl Hair Clips", category: "accessories", price: 299, originalPrice: 599, rating: 4.7, badge: "Cute", isNew: true },
    { id: 10, name: "Pink Tote Bag", category: "accessories", price: 899, originalPrice: 1499, rating: 4.5, badge: "Trendy", isNew: false },
  ];

  const filteredProducts = allProducts.filter(p => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const categories = [
    { name: "Skincare", icon: "🧴", value: "skincare" },
    { name: "Makeup", icon: "💄", value: "makeup" },
    { name: "Clothing", icon: "👗", value: "clothing" },
    { name: "Accessories", icon: "👜", value: "accessories" },
  ];

  const offers = [
    { title: "Buy 1 Get 1 Free", subtitle: "On selected skincare", bg: "from-pink-500 to-rose-500", link: "/shop?offer=bogo" },
    { title: "Flat 20% Off", subtitle: "On first order", bg: "from-rose-500 to-pink-600", link: "/shop?offer=first" },
    { title: "Free Shipping", subtitle: "On orders above ₹999", bg: "from-pink-400 to-rose-400", link: "/shop" },
  ];

  const handleWishlistToggle = (product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* Top Bar - Countdown Timer */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white py-3 text-center">
        <div className="container mx-auto px-4">
          <p className="text-sm font-medium tracking-wide">
            LIMITED TIME OFFER — Sale ends in: 
            <span className="font-bold mx-2 bg-white/20 px-2 py-1 rounded-lg">
              {String(countdown.days).padStart(2, '0')}d {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m {String(countdown.seconds).padStart(2, '0')}s
            </span>
          </p>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-800">MyPinkShop</h1>
                <p className="text-[10px] text-gray-400 tracking-wider">LUXURY BEAUTY & FASHION</p>
              </div>
            </Link>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search for products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-5 py-3 border border-gray-200 rounded-full focus:outline-none focus:border-pink-400 bg-gray-50"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-pink-500 text-white px-5 py-1.5 rounded-full text-sm font-medium hover:bg-pink-600 transition">
                  Search
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button onClick={() => navigate('/wishlist')} className="relative text-gray-600 hover:text-pink-500 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <Link to="/cart" className="relative text-gray-600 hover:text-pink-500 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              {user ? (
                <Avatar user={user} onLogout={logout} />
              ) : (
                <Link to="/login" className="text-gray-600 hover:text-pink-500 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-pink-50 to-white">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-2xl">
            <div className="inline-block px-4 py-1 bg-pink-100 rounded-full text-pink-600 text-sm font-medium mb-6">New Collection</div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-gray-900">Glow Up <span className="text-pink-600">This Summer</span></h1>
            <p className="text-gray-600 text-lg mb-8 max-w-lg">Discover our premium skincare, makeup, and fashion collection. Up to 40% off + free gift with purchase.</p>
            <div className="flex gap-4">
              <Link to="/shop" className="bg-pink-500 text-white px-8 py-3 rounded-full font-medium hover:bg-pink-600 transition shadow-md">Shop Now</Link>
              <button className="border border-pink-300 hover:bg-pink-50 px-8 py-3 rounded-full font-medium transition text-gray-700">Explore Collection</button>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Strip */}
      <div className="border-y border-gray-100 py-4 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-around items-center flex-wrap gap-6">
            <span className="text-base font-medium text-gray-500">LANCÔME</span>
            <span className="text-base font-medium text-gray-500">NYkaa</span>
            <span className="text-base font-medium text-gray-500">Mamaearth</span>
            <span className="text-base font-medium text-gray-500">HUDA BEAUTY</span>
            <span className="text-base font-medium text-gray-500">SUGAR</span>
          </div>
        </div>
      </div>

      {/* Categories Section - Original Design, Only Filter Working */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-pink-500 text-sm font-medium tracking-wider mb-2">SHOP BY CATEGORY</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Find Your Perfect Match</h2>
            <div className="w-20 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat.value)}
                className="group bg-white rounded-2xl p-8 text-center border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition">
                  {cat.icon}
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">{cat.name}</h3>
                <p className="text-sm text-pink-500 mt-2">Shop Now →</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Offer Banners */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offers.map((offer, idx) => (
              <Link key={idx} to={offer.link} className={`bg-gradient-to-r ${offer.bg} rounded-2xl p-6 text-white hover:shadow-xl transition hover:-translate-y-1`}>
                <div className="flex items-center justify-between">
                  <div><h3 className="text-xl font-bold">{offer.title}</h3><p className="text-white/80 text-sm mt-1">{offer.subtitle}</p></div>
                  <div className="text-3xl">→</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellers Section - Shows Filtered Products */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-pink-500 text-sm font-medium tracking-wider mb-2">CUSTOMER FAVORITES</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Bestsellers</h2>
            <div className="w-20 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.slice(0, 4).map(product => (
              <div key={product.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
                <Link to={`/product/${product.id}`}>
                  <div className="relative h-64 bg-gray-50 flex items-center justify-center text-7xl">
                    <span className="text-7xl">✨</span>
                    <span className="absolute top-3 left-3 bg-pink-500 text-white text-xs px-3 py-1 rounded-full">{product.badge}</span>
                    {product.isNew && <span className="absolute top-3 right-3 bg-rose-500 text-white text-xs px-3 py-1 rounded-full">NEW</span>}
                  </div>
                </Link>
                <div className="p-5">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-gray-900 mb-1 hover:text-pink-500 transition">{product.name}</h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex text-yellow-400 text-sm">{"★".repeat(Math.floor(product.rating))}{"☆".repeat(5 - Math.floor(product.rating))}</div>
                    <span className="text-xs text-gray-400">({product.rating})</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl font-bold text-pink-600">₹{product.price}</span>
                    <span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => addToCart(product)} className="flex-1 bg-pink-500 text-white py-2 rounded-full font-medium hover:bg-pink-600 transition">Add to Cart</button>
                    <button onClick={() => handleWishlistToggle(product)} className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center hover:bg-pink-50 transition">
                      <svg className={`w-5 h-5 ${isInWishlist(product.id) ? 'text-pink-500 fill-pink-500' : 'text-gray-400'}`} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {selectedCategory !== 'all' && (
            <div className="text-center mt-8">
              <button onClick={() => setSelectedCategory('all')} className="text-pink-500 hover:text-pink-600 text-sm font-medium">Clear Filter → Show All Products</button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gradient-to-r from-pink-600 to-rose-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-2">Join the Pink Club</h2>
            <p className="text-white/80 mb-6">Subscribe to get 15% off on your first order + exclusive updates</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" placeholder="Your email address" className="flex-1 px-5 py-3 rounded-full text-gray-900 focus:outline-none" />
              <button className="bg-white text-pink-600 px-6 py-3 rounded-full font-semibold hover:shadow-lg transition">Subscribe</button>
            </div>
          </div>
        </div>
      </section>

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
