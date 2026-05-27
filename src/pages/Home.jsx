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

  // Load banners from localStorage
  useEffect(() => {
    const savedBanners = JSON.parse(localStorage.getItem('homepage_banners') || '[]');
    const activeBanners = savedBanners.filter(b => b.active).sort((a, b) => a.order - b.order);
    setBanners(activeBanners);
  }, []);

  // Auto slide for carousel
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
    { name: 'Skincare', image: '🧴', link: '/shop?category=skincare' },
    { name: 'Makeup', image: '💄', link: '/shop?category=makeup' },
    { name: 'Clothing', image: '👗', link: '/shop?category=clothing' },
    { name: 'Accessories', image: '👜', link: '/shop?category=accessories' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Top Bar */}
      <div className="bg-pink-600 text-white py-2 text-center text-sm">
        Free Shipping on ₹999+ | Extra 10% off on first order | Cash on Delivery Available
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">M</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">MyPinkShop</h1>
                <p className="text-[9px] sm:text-[10px] text-gray-400">FOR THE GIRLIES</p>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-md lg:max-w-2xl">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search for products..."
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 text-sm sm:text-base bg-white"
                />
                <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-pink-600 text-white px-4 sm:px-6 py-1.5 rounded-lg text-sm font-medium hover:bg-pink-700 transition">
                  Search
                </button>
              </div>
            </div>

            {/* Right Icons */}
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

      {/* Category Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-[61px] sm:top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 overflow-x-auto py-3">
            <Link to="/shop" className="text-sm font-medium text-gray-600 hover:text-pink-600 whitespace-nowrap">All</Link>
            <Link to="/shop?category=skincare" className="text-sm font-medium text-gray-600 hover:text-pink-600 whitespace-nowrap">Skincare</Link>
            <Link to="/shop?category=makeup" className="text-sm font-medium text-gray-600 hover:text-pink-600 whitespace-nowrap">Makeup</Link>
            <Link to="/shop?category=clothing" className="text-sm font-medium text-gray-600 hover:text-pink-600 whitespace-nowrap">Clothing</Link>
            <Link to="/shop?category=accessories" className="text-sm font-medium text-gray-600 hover:text-pink-600 whitespace-nowrap">Accessories</Link>
            <Link to="/shop?offer=sale" className="text-sm font-medium text-red-500 hover:text-pink-600 whitespace-nowrap">Sale</Link>
            <Link to="/shop?sort=newest" className="text-sm font-medium text-gray-600 hover:text-pink-600 whitespace-nowrap">New Arrivals</Link>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-pink-100 to-rose-100 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">Glow Up This Summer</h1>
            <p className="text-gray-600 text-lg mb-6">Discover our premium skincare, makeup, and fashion collection.</p>
            <Link to="/shop" className="inline-block bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-700 transition">Shop Now →</Link>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, idx) => (
              <Link key={idx} to={cat.link} className="group bg-gray-50 rounded-lg p-6 text-center hover:shadow-md transition">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-3xl mb-3">
                  {cat.image}
                </div>
                <h3 className="font-semibold text-gray-800">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Deals of the Day */}
      {featuredProducts.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Deals of the Day</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Ends in:</span>
                <div className="flex gap-1">
                  <div className="bg-gray-800 text-white px-2 py-1 rounded text-center min-w-[40px]">{String(timeLeft.hours).padStart(2, '0')}</div>
                  <span>:</span>
                  <div className="bg-gray-800 text-white px-2 py-1 rounded text-center min-w-[40px]">{String(timeLeft.minutes).padStart(2, '0')}</div>
                  <span>:</span>
                  <div className="bg-gray-800 text-white px-2 py-1 rounded text-center min-w-[40px]">{String(timeLeft.seconds).padStart(2, '0')}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} addToCart={addToCart} isInWishlist={isInWishlist(product.id)} onWishlistToggle={() => {}} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bestsellers Section */}
      {bestsellerProducts.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Bestsellers</h2>
              <Link to="/shop?sort=bestseller" className="text-pink-600 text-sm hover:underline">View All →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {bestsellerProducts.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} addToCart={addToCart} isInWishlist={isInWishlist(product.id)} onWishlistToggle={() => {}} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">New Arrivals</h2>
              <Link to="/shop?sort=newest" className="text-pink-600 text-sm hover:underline">View All →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {newArrivals.map(product => (
                <ProductCard key={product.id} product={product} addToCart={addToCart} isInWishlist={isInWishlist(product.id)} onWishlistToggle={() => {}} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="py-16 bg-pink-600">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-2">Join the Pink Club</h2>
          <p className="text-white/80 mb-6">Subscribe to get 15% off on your first order + exclusive updates</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" placeholder="Your email address" className="flex-1 px-5 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white" />
            <button className="bg-white text-pink-600 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition">Subscribe</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
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

// ✅ Product Card Component with REAL IMAGES
const ProductCard = ({ product, addToCart, isInWishlist, onWishlistToggle }) => (
  <div className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition">
    <Link to={`/product/${product.id}`}>
      <div className="relative h-48 sm:h-52 md:h-60 overflow-hidden bg-gray-100">
        {product.images && product.images[0] ? (
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-400">
            No Image
          </div>
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-pink-600 text-white text-xs px-2 py-1 rounded shadow-md">{product.badge}</span>
        )}
        {product.isNew && (
          <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs px-2 py-1 rounded shadow-md">NEW</span>
        )}
      </div>
    </Link>
    <div className="p-4">
      <Link to={`/product/${product.id}`}>
        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1 hover:text-pink-600 transition">{product.name}</h3>
      </Link>
      <div className="flex items-center gap-1 mb-2">
        <div className="flex text-yellow-400 text-sm">
          {'★'.repeat(Math.floor(product.rating || 4))}
          {'☆'.repeat(5 - Math.floor(product.rating || 4))}
        </div>
        <span className="text-xs text-gray-400">({product.rating || 4})</span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg font-bold text-pink-600">₹{product.price}</span>
        {product.originalPrice && product.originalPrice > product.price && (
          <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
        )}
      </div>
      <button 
        onClick={() => addToCart(product)} 
        className="w-full bg-pink-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition"
      >
        Add to Cart
      </button>
    </div>
  </div>
);

export default Home;
