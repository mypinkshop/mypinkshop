import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleMoveToCart = (product) => {
    addToCart(product);
    removeFromWishlist(product.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-pink-50">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-pink-100">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link to="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">MyPinkShop</h1>
            </Link>
            <Link to="/cart" className="relative">
              <span className="text-2xl text-gray-600 hover:text-pink-500 transition">🛒</span>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="text-8xl mb-6">🤍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">Save your favorite items here!</p>
          <Link to="/" className="bg-pink-500 text-white px-6 py-3 rounded-full hover:bg-pink-600 transition inline-block">
            Start Shopping →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">MyPinkShop</h1>
          </Link>
          <div className="flex items-center gap-5">
            <Link to="/wishlist" className="relative">
              <span className="text-2xl text-pink-500">🤍</span>
              <span className="absolute -top-1 -right-2 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{wishlist.length}</span>
            </Link>
            <Link to="/cart" className="relative">
              <span className="text-2xl text-gray-600 hover:text-pink-500 transition">🛒</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Wishlist</h1>
          <p className="text-gray-500 mt-1">{wishlist.length} items saved</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-pink-100 hover:shadow-lg transition group">
              <div className="relative h-64 bg-gradient-to-br from-pink-50 to-pink-100/30 flex items-center justify-center text-7xl">
                {product.emoji || '💕'}
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-pink-50 transition"
                >
                  <span className="text-red-500 text-lg">✕</span>
                </button>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-yellow-400 text-sm">★★★★★</div>
                  <span className="text-xs text-gray-400">({product.rating || 4.5})</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-bold text-pink-600">₹{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
                  )}
                </div>
                <button
                  onClick={() => handleMoveToCart(product)}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 rounded-full font-medium hover:shadow-lg transition"
                >
                  Move to Cart 🛒
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Wishlist;
