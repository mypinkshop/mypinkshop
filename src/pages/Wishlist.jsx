import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

function Wishlist() {
  const navigate = useNavigate();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [movingProduct, setMovingProduct] = useState(null);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleMoveToCart = (product) => {
    setMovingProduct(product.id);
    addToCart(product);
    setTimeout(() => {
      removeFromWishlist(product.id);
      setMovingProduct(null);
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your wishlist...</p>
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
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-300 rounded focus:outline-none focus:border-pink-500 text-sm sm:text-base"
                  onKeyPress={(e) => e.key === 'Enter' && navigate(`/shop?search=${e.target.value}`)}
                />
                <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-pink-600 text-white px-4 sm:px-6 py-1.5 rounded text-sm font-medium hover:bg-pink-700 transition">
                  Search
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
              <button onClick={() => navigate('/wishlist')} className="relative p-1.5 sm:p-2 text-pink-600 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>
              
              <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-600 hover:text-pink-600 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
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
          <span className="text-gray-700">Wishlist</span>
        </div>
      </div>

      {wishlist.length === 0 ? (
        // Empty Wishlist
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="bg-white rounded-lg p-12 max-w-md mx-auto border border-gray-200 shadow-sm">
            <div className="text-6xl mb-6">🤍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Save your favorite items here!</p>
            <Link 
              to="/shop" 
              className="inline-block bg-pink-600 text-white px-8 py-3 rounded font-semibold hover:bg-pink-700 transition"
            >
              Start Shopping →
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              My Wishlist ({wishlist.length} {wishlist.length === 1 ? 'item' : 'items'})
            </h1>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {wishlist.map((product) => (
              <div key={product.id} className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                {/* Product Image */}
                <Link to={`/product/${product.id}`}>
                  <div className="relative h-52 overflow-hidden bg-gray-100">
                    {product.images && product.images[0] ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl text-gray-400">
                        No Image
                      </div>
                    )}
                    {product.badge && (
                      <span className="absolute top-3 left-3 bg-pink-600 text-white text-xs px-2 py-1 rounded shadow-md">
                        {product.badge}
                      </span>
                    )}
                    {product.isNew && (
                      <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs px-2 py-1 rounded shadow-md">
                        NEW
                      </span>
                    )}
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition"
                    >
                      <span className="text-red-500 text-lg">✕</span>
                    </button>
                  </div>
                </Link>
                
                {/* Product Info */}
                <div className="p-4">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base line-clamp-2 hover:text-pink-600 transition min-h-[48px]">
                      {product.name}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex text-yellow-500 text-xs">
                      {'★'.repeat(Math.floor(product.rating || 4))}
                      {'☆'.repeat(5 - Math.floor(product.rating || 4))}
                    </div>
                    <span className="text-xs text-gray-400">({product.rating || 4})</span>
                  </div>
                  
                  <div className="mt-2">
                    <span className="text-lg font-bold text-pink-600">₹{product.price}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-xs text-gray-400 line-through ml-2">₹{product.originalPrice}</span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleMoveToCart(product)}
                    disabled={movingProduct === product.id}
                    className={`w-full mt-3 py-2 rounded text-sm font-medium transition ${
                      movingProduct === product.id
                        ? 'bg-green-600 text-white'
                        : 'bg-pink-600 text-white hover:bg-pink-700'
                    }`}
                  >
                    {movingProduct === product.id ? '✓ Added to Cart!' : 'Move to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Continue Shopping Button */}
          <div className="text-center mt-12">
            <Link 
              to="/shop" 
              className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium transition"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      )}

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

export default Wishlist;
