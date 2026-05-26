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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });
  
  // ✅ ADDED: Banner states
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        clearInterval(timer);
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load approved products
  useEffect(() => {
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const approvedProducts = allProducts.filter(p => p.adminApproved === true && p.status === 'active');
    setProducts(approvedProducts);
    setLoading(false);
  }, []);

  // ✅ ADDED: Load banners from localStorage
  useEffect(() => {
    const savedBanners = JSON.parse(localStorage.getItem('homepage_banners') || '[]');
    const activeBanners = savedBanners.filter(b => b.active).sort((a, b) => a.order - b.order);
    setBanners(activeBanners);
  }, []);

  // ✅ ADDED: Auto slide for carousel
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const featuredProducts = products.slice(0, 4);
  const bestsellerProducts = products.slice(4, 12);
  const newArrivals = products.filter(p => p.isNew).slice(0, 4);

  const categories = [
    { name: 'Skincare', image: '🧴', link: '/shop?category=skincare', color: 'from-pink-100 to-rose-100' },
    { name: 'Makeup', image: '💄', link: '/shop?category=makeup', color: 'from-rose-100 to-pink-200' },
    { name: 'Clothing', image: '👗', link: '/shop?category=clothing', color: 'from-pink-200 to-fuchsia-100' },
    { name: 'Accessories', image: '👜', link: '/shop?category=accessories', color: 'from-fuchsia-100 to-pink-100' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white py-2 text-center text-sm">
        🎀 Free Shipping on ₹999+ | Extra 10% off on first order | Cash on Delivery Available 🎀
      </div>

      {/* Header - Amazon Style */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-800">MyPinkShop</h1>
                <p className="text-[10px] text-gray-400 tracking-wider">FOR THE GIRLIES ✨</p>
              </div>
            </Link>

            {/* Search Bar - Amazon Style */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search for products, brands and more..."
                  className="w-full px-5 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
                <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-pink-500 text-white px-6 py-1.5 rounded-md text-sm font-medium hover:bg-pink-600 transition">
                  Search
                </button>
              </div>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-5">
              <button onClick={() => navigate('/wishlist')} className="relative text-gray-700 hover:text-pink-500 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && <span className="absolute -top-2 -right-3 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{wishlistCount}</span>}
              </button>
              <Link to="/cart" className="relative text-gray-700 hover:text-pink-500 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && <span className="absolute -top-2 -right-3 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>}
              </Link>
              {user ? <Avatar user={user} onLogout={logout} /> : <Link to="/login" className="text-gray-700 hover:text-pink-500 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></Link>}
            </div>
          </div>
        </div>
      </header>

      {/* Category Navigation Strip - Amazon Style */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6 overflow-x-auto py-3 text-sm">
            <Link to="/shop" className="text-gray-700 hover:text-pink-500 whitespace-nowrap font-medium">All</Link>
            <Link to="/shop?category=skincare" className="text-gray-700 hover:text-pink-500 whitespace-nowrap">Skincare</Link>
            <Link to="/shop?category=makeup" className="text-gray-700 hover:text-pink-500 whitespace-nowrap">Makeup</Link>
            <Link to="/shop?category=clothing" className="text-gray-700 hover:text-pink-500 whitespace-nowrap">The Drip</Link>
            <Link to="/shop?category=accessories" className="text-gray-700 hover:text-pink-500 whitespace-nowrap">Accessories</Link>
            <Link to="/shop?offer=sale" className="text-red-500 hover:text-pink-500 whitespace-nowrap">Sale 🔥</Link>
            <Link to="/shop?sort=newest" className="text-gray-700 hover:text-pink-500 whitespace-nowrap">New Arrivals</Link>
            <Link to="/shop?sort=bestseller" className="text-gray-700 hover:text-pink-500 whitespace-nowrap">Bestsellers</Link>
          </div>
        </div>
      </div>

      {/* ✅ REPLACED: Hero Banner with Carousel */}
      {banners.length > 0 ? (
        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-out" 
            style={{ transform: `translateX(-${currentBanner * 100}%)` }}
          >
            {banners.map((banner) => (
              <Link key={banner.id} to={banner.link} className="w-full flex-shrink-0">
                <div className="relative">
                  <img 
                    src={banner.image} 
                    alt={banner.title}
                    className="w-full h-64 md:h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                      <h2 className="text-3xl md:text-5xl font-bold mb-2">{banner.title}</h2>
                      <p className="text-lg mb-4">{banner.subtitle}</p>
                      <button className="bg-white text-pink-600 px-6 py-2 rounded-md font-semibold hover:bg-gray-100 transition">
                        {banner.buttonText}
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Carousel Dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBanner(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${currentBanner === idx ? 'w-6 bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        // Fallback banner if no banners in localStorage
        <div className="relative bg-gradient-to-r from-pink-100 to-rose-100">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-block bg-white/80 backdrop-blur-sm text-pink-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">✨ Summer Sale ✨</span>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">Glow Up <span className="text-pink-500">This Summer</span></h1>
                <p className="text-gray-600 text-lg mb-6">Discover our premium skincare, makeup, and fashion collection. Up to 40% off + free gift with purchase.</p>
                <Link to="/shop" className="inline-block bg-pink-500 text-white px-8 py-3 rounded-md font-semibold hover:bg-pink-600 transition shadow-md">Shop Now →</Link>
              </div>
              <div className="hidden md:block text-center">
                <div className="text-8xl animate-bounce">🎀</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, idx) => (
              <Link key={idx} to={cat.link} className="group bg-gray-50 rounded-xl p-6 text-center hover:shadow-md transition-all hover:-translate-y-1">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition">
                  {cat.image}
                </div>
                <h3 className="font-semibold text-gray-800">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Deals of the Day */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">⏰ Deals of the Day</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Ends in:</span>
              <div className="flex gap-1">
                <span className="bg-gray-800 text-white px-2 py-1 rounded text-center min-w-[40px]">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-gray-800">:</span>
                <span className="bg-gray-800 text-white px-2 py-1 rounded text-center min-w-[40px]">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-gray-800">:</span>
                <span className="bg-gray-800 text-white px-2 py-1 rounded text-center min-w-[40px]">{String(timeLeft.seconds).padStart(2, '0')}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {featuredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition group">
                <Link to={`/product/${product.id}`}>
                  <div className="h-52 bg-gray-100 flex items-center justify-center text-6xl relative">
                    <span>{product.emoji || '✨'}</span>
                    {product.badge && <span className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full">{product.badge}</span>}
                    {product.isNew && <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>}
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{product.name}</h3>
                  </Link>
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex text-yellow-400 text-sm">{'★'.repeat(Math.floor(product.rating || 4.5))}</div>
                    <span className="text-xs text-gray-400">({product.rating || 4.5})</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-pink-600">₹{product.price}</span>
                    <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
                  </div>
                  <button onClick={() => addToCart(product)} className="w-full bg-pink-500 text-white py-2 rounded-full text-sm font-medium hover:bg-pink-600 transition">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">⭐ Bestsellers</h2>
            <Link to="/shop?sort=bestseller" className="text-pink-500 text-sm hover:underline">View All →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {bestsellerProducts.slice(0, 4).map(product => (
              <div key={product.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition group">
                <Link to={`/product/${product.id}`}>
                  <div className="h-52 bg-gray-100 flex items-center justify-center text-6xl relative">
                    <span>{product.emoji || '✨'}</span>
                    {product.badge && <span className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full">{product.badge}</span>}
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{product.name}</h3>
                  </Link>
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex text-yellow-400 text-sm">{'★'.repeat(Math.floor(product.rating || 4.5))}</div>
                    <span className="text-xs text-gray-400">({product.rating || 4.5})</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-pink-600">₹{product.price}</span>
                    <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
                  </div>
                  <button onClick={() => addToCart(product)} className="w-full bg-pink-500 text-white py-2 rounded-full text-sm font-medium hover:bg-pink-600 transition">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">🆕 New Arrivals</h2>
            <Link to="/shop?sort=newest" className="text-pink-500 text-sm hover:underline">View All →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {newArrivals.map(product => (
              <div key={product.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition group">
                <Link to={`/product/${product.id}`}>
                  <div className="h-52 bg-gray-100 flex items-center justify-center text-6xl relative">
                    <span>{product.emoji || '✨'}</span>
                    <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{product.name}</h3>
                  </Link>
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex text-yellow-400 text-sm">{'★'.repeat(Math.floor(product.rating || 4.5))}</div>
                    <span className="text-xs text-gray-400">({product.rating || 4.5})</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-pink-600">₹{product.price}</span>
                    <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
                  </div>
                  <button onClick={() => addToCart(product)} className="w-full bg-pink-500 text-white py-2 rounded-full text-sm font-medium hover:bg-pink-600 transition">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gradient-to-r from-pink-600 to-rose-600 text-white">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-2">Join the Pink Club</h2>
          <p className="text-white/80 mb-6">Subscribe to get 15% off on your first order + exclusive updates</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" placeholder="Your email address" className="flex-1 px-5 py-3 rounded-full text-gray-900 focus:outline-none" />
            <button className="bg-white text-pink-600 px-6 py-3 rounded-full font-semibold hover:shadow-lg transition">Subscribe</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <h3 className="font-bold text-white text-lg">MyPinkShop</h3>
              </div>
              <p className="text-sm text-gray-500">Luxury beauty and fashion for the modern woman.</p>
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
                <li><a href="#" className="hover:text-pink-500 transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-pink-500 transition">FAQs</a></li>
                <li><a href="#" className="hover:text-pink-500 transition">Shipping Info</a></li>
                <li><a href="#" className="hover:text-pink-500 transition">Returns Policy</a></li>
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
            <p className="text-sm text-gray-500">© 2025 MyPinkShop. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
