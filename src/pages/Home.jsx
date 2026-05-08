import { useState } from 'react';
import { useCart } from '../context/CartContext';

const products = [
  { id: 1, name: "Glass Skin Serum", category: "skincare", price: 1299, originalPrice: 1999, rating: 4.8, emoji: "💧", badge: "⭐ Bestseller" },
  { id: 2, name: "Rice Water Toner", category: "skincare", price: 899, originalPrice: 1299, rating: 4.6, emoji: "🌸", badge: "🔥 Trending" },
  { id: 3, name: "Cherry Lip Tint", category: "makeup", price: 599, originalPrice: 999, rating: 4.7, emoji: "🍒", badge: "💄 Viral" },
  { id: 4, name: "Satin Slip Dress", category: "drip", price: 2499, originalPrice: 3999, rating: 4.9, emoji: "👗", badge: "✨ Main Character" },
  { id: 5, name: "Baby Pink Blush", category: "makeup", price: 799, originalPrice: 1299, rating: 4.5, emoji: "🎀", badge: "🌸 Soft Girl" },
  { id: 6, name: "Coquette Bow Dress", category: "drip", price: 2999, originalPrice: 4499, rating: 4.8, emoji: "🎀", badge: "👗 Coquette" },
  { id: 7, name: "Vitamin C Glow Drops", category: "skincare", price: 1499, originalPrice: 2299, rating: 4.9, emoji: "🍊", badge: "⭐ Holy Grail" },
  { id: 8, name: "Y2K Mesh Top", category: "drip", price: 1599, originalPrice: 2499, rating: 4.6, emoji: "💅", badge: "🔥 Y2K" },
  { id: 9, name: "Matte Lipstick Set", category: "makeup", price: 999, originalPrice: 1599, rating: 4.4, emoji: "💄", badge: "🎨 3 Shades" },
  { id: 10, name: "Pearl Hair Clips", category: "accessories", price: 299, originalPrice: 599, rating: 4.7, emoji: "🎀", badge: "🌸 Cute" },
  { id: 11, name: "Pink Tote Bag", category: "accessories", price: 899, originalPrice: 1499, rating: 4.5, emoji: "👜", badge: "🎀 Trendy" },
  { id: 12, name: "Sunscreen SPF 50", category: "skincare", price: 699, originalPrice: 999, rating: 4.8, emoji: "☀️", badge: "⭐ Bestseller" },
];

function Home() {
  const { addToCart, cartCount } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  const [discountOnly, setDiscountOnly] = useState(false);

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : Infinity;
    if (p.price < min || p.price > max) return false;
    if (selectedRating > 0 && p.rating < selectedRating) return false;
    if (discountOnly && p.originalPrice <= p.price) return false;
    return true;
  });

  const clearFilters = () => {
    setSelectedCategory('all');
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedRating(0);
    setDiscountOnly(false);
  };

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-pink-100 to-pink-50 text-pink-600 text-center py-2 text-sm">
        🎀 Free Shipping on ₹999+ | Extra 10% off on first order | COD Available 🎀
      </div>

      {/* Header */}
      <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-pink-100">
        <div className="flex items-center justify-between flex-wrap gap-4 px-4 py-3 max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-amber-500 bg-clip-text text-transparent">MyPinkShop</h1>
            <p className="text-xs text-pink-400">for the girlies ✨</p>
          </div>
          
          <div className="flex-1 max-w-md flex">
            <input 
              type="text" 
              placeholder="Search skincare, makeup, dresses..."
              className="flex-1 px-4 py-2 border border-pink-100 rounded-l-full focus:outline-none focus:border-pink-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="bg-pink-500 text-white px-5 rounded-r-full">🔍</button>
          </div>
          
          <div className="flex gap-5 text-gray-600">
            <i className="fa-regular fa-heart text-xl cursor-pointer"></i>
            <div className="relative cursor-pointer">
              <i className="fa-solid fa-bag-shopping text-xl"></i>
              <span className="absolute -top-2 -right-3 bg-pink-500 text-white text-xs rounded-full px-1.5">{cartCount}</span>
            </div>
            <i className="fa-regular fa-user text-xl cursor-pointer"></i>
          </div>
        </div>
      </header>

      {/* Category Navbar */}
      <div className="bg-white border-b border-pink-100 px-4 py-3 flex gap-6 overflow-x-auto max-w-7xl mx-auto">
        {['all', 'skincare', 'makeup', 'drip', 'accessories'].map(cat => (
          <button 
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-sm font-medium ${selectedCategory === cat ? 'text-pink-500 border-b-2 border-pink-500 pb-1' : 'text-gray-500'}`}
          >
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
        Home &gt; <span className="text-pink-500">Shop</span>
      </div>

      {/* Main Layout - Sidebar + Products */}
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-6 pb-10">
        
        {/* Sidebar Filters */}
        <aside className="md:w-72 bg-white rounded-xl p-5 h-fit sticky top-24 border border-pink-100">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Filters</h3>
          
          <div className="mb-5 border-b border-pink-100 pb-4">
            <h4 className="font-semibold text-sm mb-3">📁 Category</h4>
            {['skincare', 'makeup', 'drip', 'accessories'].map(cat => (
              <label key={cat} className="flex items-center gap-2 mb-2 text-sm text-gray-600 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selectedCategory === cat}
                  onChange={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
                  className="accent-pink-500"
                />
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </label>
            ))}
          </div>
          
          <div className="mb-5 border-b border-pink-100 pb-4">
            <h4 className="font-semibold text-sm mb-3">💰 Price Range</h4>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-1/2 px-3 py-2 border border-pink-100 rounded-lg text-sm" />
              <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-1/2 px-3 py-2 border border-pink-100 rounded-lg text-sm" />
            </div>
          </div>
          
          <div className="mb-5 border-b border-pink-100 pb-4">
            <h4 className="font-semibold text-sm mb-3">⭐ Rating</h4>
            {[4, 3].map(r => (
              <label key={r} className="flex items-center gap-2 mb-2 text-sm text-gray-600 cursor-pointer">
                <input type="radio" name="rating" checked={selectedRating === r} onChange={() => setSelectedRating(selectedRating === r ? 0 : r)} className="accent-pink-500" />
                {r}★ & above
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="radio" name="rating" checked={selectedRating === 0} onChange={() => setSelectedRating(0)} className="accent-pink-500" />
              All ratings
            </label>
          </div>
          
          <div className="mb-5 pb-2">
            <h4 className="font-semibold text-sm mb-3">🎁 Offers</h4>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={discountOnly} onChange={(e) => setDiscountOnly(e.target.checked)} className="accent-pink-500" />
              Discounted items only
            </label>
          </div>
          
          <button onClick={clearFilters} className="w-full mt-3 border border-pink-500 text-pink-500 py-2 rounded-full text-sm hover:bg-pink-500 hover:text-white transition">
            Clear All Filters ✨
          </button>
        </aside>

        {/* Products Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl px-5 py-3 mb-4 border border-pink-100">
            <span className="text-sm text-gray-500">Showing {filteredProducts.length} products</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-pink-100">
              <p className="text-gray-500">No products found matching your filters.</p>
              <button onClick={clearFilters} className="mt-3 text-pink-500 underline">Clear all filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map(p => (
                <div key={p.id} className="bg-white rounded-xl overflow-hidden border border-pink-100 hover:shadow-lg transition">
                  <div className="h-48 flex items-center justify-center bg-pink-50 text-6xl relative">
                    <span className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full">{p.badge}</span>
                    {p.emoji}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800">{p.name}</h3>
                    <div className="text-yellow-500 text-sm mt-1">{"★".repeat(Math.floor(p.rating))} {p.rating}</div>
                    <div className="mt-2">
                      <span className="text-pink-500 font-bold text-lg">₹{p.price}</span>
                      <span className="text-gray-400 line-through text-sm ml-2">₹{p.originalPrice}</span>
                    </div>
                    <button onClick={() => addToCart(p)} className="w-full mt-3 bg-gradient-to-r from-pink-500 to-pink-400 text-white py-2 rounded-full hover:from-pink-600 transition font-medium">
                      Add to Cart 🛒
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 mt-10 py-10 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-pink-500 font-bold text-lg mb-2">MyPinkShop</h3>
            <p className="text-sm">aesthetic & affordable 💕</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Shop</h4>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">Skincare</a>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">Makeup</a>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">The Drip</a>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Support</h4>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">Contact Us</a>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">FAQs</a>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">Shipping</a>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Social</h4>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">Instagram</a>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">TikTok</a>
            <a href="#" className="text-sm block py-1 hover:text-pink-500">Pinterest</a>
          </div>
        </div>
        <div className="text-center text-xs pt-8 border-t border-gray-800 mt-8">
          <p>© 2025 MyPinkShop – made with 💖 for the girlies</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
