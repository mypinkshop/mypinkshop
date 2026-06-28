import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function ProductCard({ 
  product, 
  addToCart, 
  isInWishlist, 
  addToWishlist, 
  removeFromWishlist, 
  user,
  wishlistContext 
}) {
  const navigate = useNavigate();
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const contextWishlist = wishlistContext || [];

  const getOptimizedImage = (url) => {
    if (!url) return null;
    if (url.includes('amazon') || url.includes('media-amazon')) {
      return url.replace('_SL1500_.jpg', '_SL500_.jpg').replace('_SL1500_', '_SL500_');
    }
    return url;
  };

  const checkWishlistStatus = useCallback(() => {
    const productId = product._id || product.id;
    
    if (user) {
      setIsWishlisted(isInWishlist(productId));
    } else {
      const exists = contextWishlist.some(item => (item._id === productId || item.id === productId));
      setIsWishlisted(exists);
    }
  }, [product, user, isInWishlist, contextWishlist]);

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

  const handleAddToCart = () => {
    addToCart({
      id: product._id || product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images?.[0],
      stock: product.stock
    });
    setIsAdded(true);
    toast.success('Added to cart!');
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleGoToCart = () => {
    navigate('/cart');
  };

  const handleWishlistToggle = () => {
    const productId = product._id || product.id;
    
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
          emoji: product.emoji
        };
        addToWishlist(productData);
        setIsWishlisted(true);
        toast.success('Added to wishlist! 🤍');
      }
    }
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-pink-100">
      <Link to={`/product/${product._id || product.id}`}>
        <div className="relative h-48 sm:h-52 md:h-60 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          {!imageLoaded && !imgError && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 to-gray-200" />
          )}
          
          {product.images && product.images[0] && !imgError ? (
            <img 
              src={getOptimizedImage(product.images[0])} 
              alt={product.name} 
              className={`w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
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
          {product.badge && (
            <span className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-2 py-1 rounded-full shadow-md z-10">
              {product.badge}
            </span>
          )}
          {product.isNew && (
            <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs px-2 py-1 rounded-full shadow-md z-10">
              NEW
            </span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/product/${product._id || product.id}`}>
          <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-1 hover:text-pink-500 transition">
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
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-pink-600">₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <>
              <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
              <span className="text-xs text-green-500">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
              </span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {isAdded ? (
            <button 
              onClick={handleGoToCart}
              className="flex-1 py-2 rounded-full text-sm font-medium transition-all bg-green-500 text-white hover:bg-green-600"
            >
              ✓ Go to Cart
            </button>
          ) : (
            <button 
              onClick={handleAddToCart}
              className="flex-1 py-2 rounded-full text-sm font-medium transition-all bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg"
            >
              Add to Cart
            </button>
          )}
          
          <button 
            onClick={handleWishlistToggle}
            className="w-10 py-2 rounded-full text-center transition border border-pink-200 hover:bg-pink-50"
          >
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
