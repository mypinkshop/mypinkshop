import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Countdown timer for sale
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

  const products = [
    { id: 1, name: "Glass Skin Serum", category: "skincare", price: 1299, originalPrice: 1999, rating: 4.8, emoji: "💧", badge: "⭐ Bestseller", isNew: true },
    { id: 2, name: "Rice Water Toner", category: "skincare", price: 899, originalPrice: 1299, rating: 4.6, emoji: "🌸", badge: "🔥 Trending", isNew: false },
    { id: 3, name: "Cherry Lip Tint", category: "makeup", price: 599, originalPrice: 999, rating: 4.7, emoji: "🍒", badge: "💄 Viral", isNew: true },
    { id: 4, name: "Satin Slip Dress", category: "drip", price: 2499, originalPrice: 3999, rating: 4.9, emoji: "👗", badge: "✨ Main Character", isNew: false },
    { id: 5, name: "Baby Pink Blush", category: "makeup", price: 799, originalPrice: 1299, rating: 4.5, emoji: "🎀", badge: "🌸 Soft Girl", isNew: true },
    { id: 6, name: "Coquette Bow Dress", category: "drip", price: 2999, originalPrice: 4499, rating: 4.8, emoji: "🎀", badge: "👗 Coquette", isNew: false },
    { id: 7, name: "Vitamin C Drops", category: "skincare", price: 1499, originalPrice: 2299, rating: 4.9, emoji: "🍊", badge: "⭐ Holy Grail", isNew: true },
    { id: 8, name: "Y2K Mesh Top", category: "drip", price: 1599, originalPrice: 2499, rating: 4.6, emoji: "💅", badge: "🔥 Y2K", isNew: false },
  ];

  const categories = [
    { name: "Skincare", icon: "✨", image: "🧴", color: "from-rose-100 to-pink-100", link: "/shop?category=skincare" },
    { name: "Makeup", icon: "💄", image: "💋", color: "from-pink-100 to-purple-100", link: "/shop?category=makeup" },
    { name: "The Drip", icon: "👗", image: "👠", color: "from-purple-100 to-indigo-100", link: "/shop?category=drip" },
    { name: "Accessories", icon: "👜", image: "💍", color: "from-indigo-100 to-blue-100", link: "/shop?category=accessories" },
  ];

  const offers = [
    { title: "Buy 1 Get 1 Free", subtitle: "On selected skincare", bg: "from-amber-500 to-rose-500", emoji: "🎁", link: "/shop?offer=bogo" },
    { title: "Flat 20% Off", subtitle: "On first order", bg: "from-pink-500 to-purple-600", emoji: "✨", link: "/shop?offer=first" },
    { title: "Free Shipping", subtitle: "On orders above ₹999", bg: "from-emerald-500 to-teal-500", emoji: "🚚", link: "/shop" },
  ];

  const instagramFeed = [
    { id: 1, img: "💄", likes: "12.5k" },
    { id: 2, img: "👗", likes: "8.2k" },
    { id: 3, img: "💅", likes: "15.3k" },
    { id: 4, img: "💋", likes: "6.8k" },
    { id: 5, img: "👠", likes: "9.4k" },
    { id: 6, img: "👜", likes: "11.2k" },
  ];

  return (
    <div className="min-h-screen bg-white">
      
      {/* Top Bar - Countdown Timer */}
      <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white py-3 text-center">
        <div className="container mx-auto px-4">
          <p className="text-sm font-medium tracking-wide">
            🔥 LIMITED TIME OFFER — Sale ends in: 
            <span className="font-bold mx-2 bg-white/20 px-2 py-1 rounded-lg">
              {String(countdown.days).padStart(2, '0')}d {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m {String(countdown.seconds).padStart(2, '0')}s
            </span>
            🔥
          </p>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-rose-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">MyPinkShop</h1>
                <p className="text-[10px] text-gray-400 tracking-wider">LUXURY BEAUTY</p>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search for products..." 
                  className="w-full px-5 py-3 border border-gray-200 rounded-full focus:outline-none focus:border-amber-400 bg-gray-50"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-rose-500 text-white px-4 py-1.5 rounded-full text-sm">
                  Search
                </button>
              </div>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-6">
              <button className="relative">
                <span className="text-2xl">🤍</span>
                <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">0</span>
              </button>
              <Link to="/cart" className="relative">
                <span className="text-2xl">🛒</span>
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>
              </Link>
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Hi, {user.name}</span>
                  <button onClick={logout} className="text-sm text-gray-500 hover:text-rose-500">Logout</button>
                </div>
              ) : (
                <Link to="/login" className="text-2xl">👤</Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Lancome Style */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1887&auto=format')] bg-cover bg-center opacity-20"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-block px-4 py-1 bg-amber-500/20 backdrop-blur-sm rounded-full text-amber-400 text-sm mb-6">
              ✨ NEW DROP ALERT
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Glow Up <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">This Summer</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8 max-w-lg">
              Discover our latest collection of premium skincare and makeup. Up to 40% off + free gift with purchase.
            </p>
            <div className="flex gap-4">
              <button className="bg-gradient-to-r from-amber-500 to-rose-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition">
                Shop Now →
              </button>
              <button className="border border-white/30 hover:bg-white/10 px-8 py-3 rounded-full font-semibold transition">
                Explore Collection
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Strip */}
      <div className="border-y border-gray-100 py-4 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-around items-center flex-wrap gap-6">
            <span className="text-xl font-serif text-gray-500">LANCÔME</span>
            <span className="text-2xl">✨</span>
            <span className="text-xl font-serif text-gray-500">NYkaa</span>
            <span className="text-2xl">💄</span>
            <span className="text-xl font-serif text-gray-500">Mamaearth</span>
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-serif text-gray-500">HUDA</span>
            <span className="text-2xl">💋</span>
            <span className="text-xl font-serif text-gray-500">SUGAR</span>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-amber-600 text-sm tracking-wider mb-2">SHOP BY CATEGORY</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Find Your Perfect Match</h2>
            <div className="w-20 h-0.5 bg-gradient-to-r from-amber-500 to-rose-500 mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <Link key={idx} to={cat.link} className="group">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 text-center border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-100 to-rose-100 rounded-full flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition">
                    {cat.image}
                  </div>
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Shop Now →</p>
                </div>
              </Link>
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
                  <div>
                    <div className="text-4xl mb-2">{offer.emoji}</div>
                    <h3 className="text-xl font-bold">{offer.title}</h3>
                    <p className="text-white/80 text-sm mt-1">{offer.subtitle}</p>
                  </div>
                  <div className="text-3xl">→</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-amber-600 text-sm tracking-wider mb-2">⭐ CUSTOMER FAVORITES</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Bestsellers</h2>
            <div className="w-20 h-0.5 bg-gradient-to-r from-amber-500 to-rose-500 mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.slice(0, 4).map(product => (
              <div key={product.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-7xl">
                  {product.emoji}
                  <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">{product.badge}</span>
                  {product.isNew && <span className="absolute top-3 right-3 bg-rose-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex text-amber-400 text-sm">{"★".repeat(Math.floor(product.rating))}</div>
                    <span className="text-xs text-gray-400">({product.rating})</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl font-bold text-rose-600">₹{product.price}</span>
                    <span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
                  </div>
                  <button onClick={() => addToCart(product)} className="w-full bg-gray-900 text-white py-2 rounded-full font-medium hover:bg-rose-600 transition">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Feed */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-amber-600 text-sm tracking-wider mb-2">📸 FOLLOW US</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">@mypinkshop</h2>
            <div className="w-20 h-0.5 bg-gradient-to-r from-amber-500 to-rose-500 mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {instagramFeed.map((item) => (
              <div key={item.id} className="group relative aspect-square bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl overflow-hidden cursor-pointer">
                <div className="absolute inset-0 flex items-center justify-center text-6xl">{item.img}</div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-2xl">❤️</div>
                    <div className="text-sm">{item.likes}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="text-5xl mb-4">💌</div>
            <h2 className="text-3xl font-bold mb-2">Join the Pink Club</h2>
            <p className="text-gray-300 mb-6">Subscribe to get 15% off on your first order + exclusive updates</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" placeholder="Your email address" className="flex-1 px-5 py-3 rounded-full text-gray-900 focus:outline-none" />
              <button className="bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-3 rounded-full font-semibold hover:shadow-lg transition">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-4">MyPinkShop</h3>
              <p className="text-gray-500 text-sm">Luxury beauty for the modern woman.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-rose-500">Skincare</a></li>
                <li><a href="#" className="hover:text-rose-500">Makeup</a></li>
                <li><a href="#" className="hover:text-rose-500">The Drip</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-rose-500">Contact</a></li>
                <li><a href="#" className="hover:text-rose-500">FAQs</a></li>
                <li><a href="#" className="hover:text-rose-500">Shipping</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Social</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-rose-500">Instagram</a></li>
                <li><a href="#" className="hover:text-rose-500">TikTok</a></li>
                <li><a href="#" className="hover:text-rose-500">Pinterest</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-400">© 2025 MyPinkShop — All rights reserved. Made with 💖</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
