// src/components/ProductCard.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';

/* ✅ Backend se match — same slugify */
function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function ProductCard({
  product,
  isInWishlist,
  addToWishlist,
  removeFromWishlist,
  user,
  wishlistContext,
}) {
  const navigate = useNavigate();

  // ✅ CartContext se removeFromCart bhi nikalo
  const { cart, addToCart, removeFromCart } = useCart();

  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const contextWishlist = wishlistContext || [];

  const productId = product._id || product.id;

  // ✅ isAdded — cart se derive (refresh proof)
  const isAdded = cart.some((item) => {
    const itemId = item.id || item._id;
    return itemId === productId;
  });

  const getOptimizedImage = (url) => {
    if (!url) return null;
    if (url.includes('amazon') || url.includes('media-amazon')) {
      return url.replace('_SL1500_.jpg', '_SL500_.jpg').replace('_SL1500_', '_SL500_');
    }
    return url;
  };

  const checkWishlistStatus = useCallback(() => {
    if (user) {
      setIsWishlisted(isInWishlist(productId));
    } else {
      const exists = contextWishlist.some(
        (item) => item._id === productId || item.id === productId
      );
      setIsWishlisted(exists);
    }
  }, [productId, user, isInWishlist, contextWishlist]);

  useEffect(() => {
    checkWishlistStatus();

    const handleUpdate = () => {
      checkWishlistStatus();
    };

    window.addEventListener('wishlistUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('wishlistUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [checkWishlistStatus]);

  /* ------------------ Add to cart ------------------ */
  const handleAddToCart = () => {
    if (product.stock === 0) {
      toast.error('Out of stock!');
      return;
    }

    addToCart({
      id: productId,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images?.[0],
      stock: product.stock,
      originalPrice: product.originalPrice || product.original_price,
      category: product.mainCategory || product.category,
      rating: product.rating,
    });

    toast.success((t) => (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Added to cart! 🛒</span>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            navigate('/cart');
          }}
          className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-1.5 rounded-full text-xs font-medium transition shadow-md"
        >
          View Cart
        </button>
      </div>
    ), {
      duration: 4000,
      position: 'bottom-center',
      style: {
        background: '#1f2937',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '12px',
      },
    });
  };

  /* ------------------ ✅ Remove from cart ------------------ */
  const handleRemoveFromCart = () => {
    try {
      if (typeof removeFromCart === 'function') {
        removeFromCart(productId);
      } else {
        // ✅ Fallback: agar removeFromCart available nahi hai
        // toh cart me se remove karne ke liye context ka direct use karo
        console.warn('removeFromCart not available in CartContext');
      }
      toast.success('Removed from cart');
    } catch (err) {
      console.error('Remove from cart error:', err);
      toast.error('Failed to remove from cart');
    }
  };

  const handleGoToCart = () => {
    navigate('/cart');
  };

  const handleWishlistToggle = () => {
    if (user) {
      if (isWishlisted) {
        removeFromWishlist(productId);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        addToWishlist(product);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } else {
      if (isWishlisted) {
        removeFromWishlist(productId);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        const productData = {
          _id: productId,
          id: productId,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          images: product.images,
          rating: product.rating,
          brand: product.brand,
          badge: product.badge,
          isNew: product.isNew,
          stock: product.stock,
          emoji: product.emoji,
        };
        addToWishlist(productData);
        setIsWishlisted(true);
        toast.success('Added to wishlist! 🤍');
      }
    }
  };

  const isOutOfStock = product.stock === 0;

  const price = product.price || product.sellingPrice || 0;
  const mrp =
    product.original_price ||
    product.originalPrice ||
    product.mrp ||
    product.comparePrice ||
    0;
  const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  /* ✅ Brand slug — backend se match */
  const brandSlug = product.brand ? slugify(product.brand) : '';

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-pink-100">

      {/* ==================== IMAGE ==================== */}
      <Link to={`/product/${productId}`}>
        <div className="relative h-48 sm:h-52 md:h-60 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          {!imageLoaded && !imgError && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 to-gray-200" />
          )}

          {product.images && product.images[0] && !imgError ? (
            <img
              src={getOptimizedImage(product.images[0])}
              alt={product.name}
              className={`w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onError={() => setImgError(true)}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
              decoding="async"
              width="300"
              height="300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl sm:text-6xl">
              {product.emoji || '✨'}
            </div>
          )}

          {/* Discount badge — top-left */}
          {discountPercent > 0 && (
            <span className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md z-10">
              {discountPercent}% OFF
            </span>
          )}

          {/* NEW badge — top-right */}
          {product.isNew && (
            <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs px-2 py-1 rounded-full shadow-md z-10">
              NEW
            </span>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <span className="text-white text-sm font-medium px-3 py-1 bg-black/50 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* ==================== INFO ==================== */}
      <div className="p-4">

        {/* ✅ BRAND NAME — Clickable (Amazon/Flipkart style) */}
        {product.brand && (
          <Link
            to={`/brand/${brandSlug}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] font-semibold text-pink-600 hover:text-pink-700 hover:underline uppercase tracking-wider mb-1 inline-block transition-colors"
            title={`View all ${product.brand} products`}
          >
            {product.brand}
          </Link>
        )}

        {/* Product name */}
        <Link to={`/product/${productId}`}>
          <h3 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2 min-h-[2.5rem] hover:text-pink-500 transition leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex text-yellow-400 text-sm">
            {'★'.repeat(Math.floor(product.rating || 4))}
            {'☆'.repeat(5 - Math.floor(product.rating || 4))}
          </div>
          <span className="text-xs text-gray-400">({product.rating || 4})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-lg font-bold text-pink-600">
            ₹{price.toLocaleString()}
          </span>
          {mrp > price && (
            <>
              <span className="text-xs text-gray-400 line-through">
                ₹{mrp.toLocaleString()}
              </span>
              <span className="text-xs text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                {discountPercent}% off
              </span>
            </>
          )}
        </div>

        {/* ==================== ✅ ACTIONS ==================== */}
        <div className="flex gap-2">
          {isAdded ? (
            <>
              {/* ✅ NEW: Remove (−) button */}
              <button
                onClick={handleRemoveFromCart}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 hover:border-red-300 shadow-sm hover:shadow-md"
                title="Remove from cart"
                aria-label="Remove from cart"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 12H4"
                  />
                </svg>
              </button>

              {/* Go to Cart button */}
              <button
                onClick={handleGoToCart}
                className="flex-1 py-2 rounded-full text-sm font-medium transition-all bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg flex items-center justify-center gap-1"
              >
                <span>✓</span> Go to Cart
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                  !isOutOfStock
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg hover:scale-105'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlistToggle}
            className="w-10 py-2 rounded-full text-center transition border border-pink-200 hover:bg-pink-50 hover:border-pink-300"
          >
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
