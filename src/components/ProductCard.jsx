// src/components/ProductCard.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
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

/* ✅ Same logic as CartContext */
function getCartItemKey(product) {
  const productId = product.id || product._id;
  const variantId = product.variantId || product.variant_id || '';
  return variantId ? `${productId}::${variantId}` : productId;
}

/* ✅ Theme config — har page ka color */
const THEMES = {
  pink: {
    cardBorder: 'border-pink-100',
    brandText: 'text-pink-600',
    brandHover: 'hover:text-pink-700',
    priceText: 'text-pink-600',
    titleHover: 'hover:text-pink-500',
    addBtnGradient: 'from-pink-500 to-rose-500',
    wishlistBorder: 'border-pink-200',
    wishlistHover: 'hover:bg-pink-50',
    wishlistHoverBorder: 'hover:border-pink-300',
    discountBadge: 'from-pink-500 to-rose-500',
    viewCartBg: 'bg-pink-500 hover:bg-pink-600',
  },
  blue: {
    cardBorder: 'border-blue-100',
    brandText: 'text-blue-600',
    brandHover: 'hover:text-blue-700',
    priceText: 'text-blue-600',
    titleHover: 'hover:text-blue-500',
    addBtnGradient: 'from-blue-500 to-indigo-500',
    wishlistBorder: 'border-blue-200',
    wishlistHover: 'hover:bg-blue-50',
    wishlistHoverBorder: 'hover:border-blue-300',
    discountBadge: 'from-blue-500 to-indigo-500',
    viewCartBg: 'bg-blue-500 hover:bg-blue-600',
  },
  orange: {
    cardBorder: 'border-orange-100',
    brandText: 'text-orange-600',
    brandHover: 'hover:text-orange-700',
    priceText: 'text-orange-600',
    titleHover: 'hover:text-orange-500',
    addBtnGradient: 'from-orange-500 to-amber-500',
    wishlistBorder: 'border-orange-200',
    wishlistHover: 'hover:bg-orange-50',
    wishlistHoverBorder: 'hover:border-orange-300',
    discountBadge: 'from-orange-500 to-amber-500',
    viewCartBg: 'bg-orange-500 hover:bg-orange-600',
  },
  purple: {
    cardBorder: 'border-purple-100',
    brandText: 'text-purple-600',
    brandHover: 'hover:text-purple-700',
    priceText: 'text-purple-600',
    titleHover: 'hover:text-purple-500',
    addBtnGradient: 'from-purple-500 to-pink-500',
    wishlistBorder: 'border-purple-200',
    wishlistHover: 'hover:bg-purple-50',
    wishlistHoverBorder: 'hover:border-purple-300',
    discountBadge: 'from-purple-500 to-pink-500',
    viewCartBg: 'bg-purple-500 hover:bg-purple-600',
  },
  green: {
    cardBorder: 'border-green-100',
    brandText: 'text-green-600',
    brandHover: 'hover:text-green-700',
    priceText: 'text-green-600',
    titleHover: 'hover:text-green-500',
    addBtnGradient: 'from-green-500 to-emerald-500',
    wishlistBorder: 'border-green-200',
    wishlistHover: 'hover:bg-green-50',
    wishlistHoverBorder: 'hover:border-green-300',
    discountBadge: 'from-green-500 to-emerald-500',
    viewCartBg: 'bg-green-500 hover:bg-green-600',
  },
  cyan: {
    cardBorder: 'border-cyan-100',
    brandText: 'text-cyan-600',
    brandHover: 'hover:text-cyan-700',
    priceText: 'text-cyan-600',
    titleHover: 'hover:text-cyan-500',
    addBtnGradient: 'from-cyan-500 to-blue-500',
    wishlistBorder: 'border-cyan-200',
    wishlistHover: 'hover:bg-cyan-50',
    wishlistHoverBorder: 'hover:border-cyan-300',
    discountBadge: 'from-cyan-500 to-blue-500',
    viewCartBg: 'bg-cyan-500 hover:bg-cyan-600',
  },
  rose: {
    cardBorder: 'border-rose-100',
    brandText: 'text-rose-600',
    brandHover: 'hover:text-rose-700',
    priceText: 'text-rose-600',
    titleHover: 'hover:text-rose-500',
    addBtnGradient: 'from-rose-500 to-pink-500',
    wishlistBorder: 'border-rose-200',
    wishlistHover: 'hover:bg-rose-50',
    wishlistHoverBorder: 'hover:border-rose-300',
    discountBadge: 'from-rose-500 to-pink-500',
    viewCartBg: 'bg-rose-500 hover:bg-rose-600',
  },
};

function ProductCard({
  product,
  isInWishlist,
  addToWishlist,
  removeFromWishlist,
  user,
  wishlistContext,
  theme = 'pink',   // ✅ NAYA — default pink
}) {
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart } = useCart();

  // ✅ Theme
  const t = THEMES[theme] || THEMES.pink;

  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const contextWishlist = wishlistContext || [];

  const productId = product._id || product.id;

  const productCartKey = useMemo(() => {
    return getCartItemKey({
      id: productId,
      variantId: product.variantId || product.variant_id || null,
    });
  }, [productId, product.variantId, product.variant_id]);

  const isAdded = cart.some((item) => item.cartKey === productCartKey);

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
      variantId: product.variantId || product.variant_id || null,
      variantSku: product.variantSku || product.variant_sku || null,
      variantImage: product.variantImage || product.variant_image || null,
      variantLabel: product.variantLabel || product.variant_label || null,
      size: product.size || null,
      color: product.color || null,
      option1Name: product.option1Name || product.option1_name || null,
      option2Name: product.option2Name || product.option2_name || null,
    });

    toast.success((toastInstance) => (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Added to cart! 🛒</span>
        <button
          onClick={() => {
            toast.dismiss(toastInstance.id);
            navigate('/cart');
          }}
          className={`${t.viewCartBg} text-white px-4 py-1.5 rounded-full text-xs font-medium transition shadow-md`}
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

  const handleRemoveFromCart = () => {
    try {
      if (typeof removeFromCart === 'function') {
        removeFromCart(productCartKey);
        toast.success('Removed from cart');
      } else {
        console.warn('removeFromCart not available in CartContext');
        toast.error('Remove function not available');
      }
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

  const brandSlug = product.brand ? slugify(product.brand) : '';

  return (
    <div className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border ${t.cardBorder}`}>

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

          {discountPercent > 0 && (
            <span className={`absolute top-3 left-3 bg-gradient-to-r ${t.discountBadge} text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md z-10`}>
              {discountPercent}% OFF
            </span>
          )}

          {product.isNew && (
            <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs px-2 py-1 rounded-full shadow-md z-10">
              NEW
            </span>
          )}

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

        {product.brand && (
          <Link
            to={`/brand/${brandSlug}`}
            onClick={(e) => e.stopPropagation()}
            className={`text-[11px] font-semibold ${t.brandText} ${t.brandHover} hover:underline uppercase tracking-wider mb-1 inline-block transition-colors`}
            title={`View all ${product.brand} products`}
          >
            {product.brand}
          </Link>
        )}

        <Link to={`/product/${productId}`}>
          <h3 className={`font-semibold text-gray-800 text-sm mb-2 line-clamp-2 min-h-[2.5rem] ${t.titleHover} transition leading-snug`}>
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mb-2">
          <div className="flex text-yellow-400 text-sm">
            {'★'.repeat(Math.floor(product.rating || 4))}
            {'☆'.repeat(5 - Math.floor(product.rating || 4))}
          </div>
          <span className="text-xs text-gray-400">({product.rating || 4})</span>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-lg font-bold ${t.priceText}`}>
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

        {/* ==================== ACTIONS ==================== */}
        <div className="flex gap-2">
          {isAdded ? (
            <>
              <button
                onClick={handleRemoveFromCart}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 hover:border-red-300 shadow-sm hover:shadow-md shrink-0"
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </button>

              <button
                onClick={handleGoToCart}
                className="flex-1 py-2 rounded-full text-sm font-medium transition-all bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg flex items-center justify-center gap-1"
              >
                <span>✓</span> Go to Cart
              </button>
            </>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                !isOutOfStock
                  ? `bg-gradient-to-r ${t.addBtnGradient} text-white hover:shadow-lg hover:scale-105`
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
          )}

          <button
            onClick={handleWishlistToggle}
            className={`w-10 py-2 rounded-full text-center transition border ${t.wishlistBorder} ${t.wishlistHover} ${t.wishlistHoverBorder} shrink-0`}
          >
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
