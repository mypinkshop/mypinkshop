import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import ReviewSection from '../components/ReviewSection';
import Avatar from '../components/Avatar';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');

  // Load REAL product from localStorage
  useEffect(() => {
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const foundProduct = allProducts.find(p => p.id == id && p.adminApproved === true && p.status === 'active');
    
    if (foundProduct) {
      setProduct(foundProduct);
    }
    setLoading(false);
  }, [id]);

  const handleAddToCart = () => {
    addToCart({ 
      id: product.id,
      name: product.name, 
      price: product.price,
      quantity: quantity,
      emoji: product.emoji || '✨',
      image: product.image,
      category: product.category,
      stock: product.stock
    });
  };

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        {/* Premium Top Bar */}
        <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
          <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
            <span>✨</span>
            <span>Free Shipping on ₹999+</span>
            <span className="hidden sm:inline">•</span>
            <span>Extra 10% off on first order</span>
            <span className="hidden sm:inline">•</span>
            <span>Cash on Delivery Available</span>
            <span>✨</span>
          </div>
        </div>

        {/* Premium Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
              <Link to="/" className="flex items-center gap-2 shrink-0 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-lg sm:text-xl">M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">MyPinkShop</h1>
                  <p className="text-[9px] sm:text-[10px] text-gray-400 tracking-wider">FOR THE GIRLIES ✨</p>
                </div>
              </Link>

              <div className="flex-1 max-w-md lg:max-w-2xl">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search for products..."
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-gray-50"
                    onKeyPress={(e) => e.key === 'Enter' && navigate(`/shop?search=${e.target.value}`)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
                <Link to="/wishlist" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{wishlistCount}</span>}
                </Link>
                
                <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{cartCount}</span>}
                </Link>
                
                {user ? <Avatar user={user} onLogout={logout} /> : 
                  <Link to="/login" className="p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                }
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto border border-pink-100 shadow-sm">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Product Not Found</h2>
            <p className="text-gray-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Link to="/shop" className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-xl transition">
              Browse Products →
            </Link>
          </div>
        </div>

        {/* Premium Footer */}
        <footer className="bg-gray-900 text-gray-400 py-8 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm">© 2026 MyPinkShop. All rights reserved.</p>
            <p className="text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
          </div>
        </footer>
      </div>
    );
  }

  // Generate images array from product emoji or default
  const productImages = [product.emoji || '✨', '💖', '🎀', '🌸'];
  
  // Parse benefits from description or use default
  const benefits = product.benefits || [
    'Premium quality product',
    'Suitable for all skin types',
    'Dermatologically tested',
    'Cruelty-free'
  ];

  // Parse ingredients
  const ingredients = product.ingredients || [
    'Natural extracts',
    'Vitamin E',
    'Hydrating formula'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      
      {/* Premium Top Bar */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
          <span>✨</span>
          <span>Free Shipping on ₹999+</span>
          <span className="hidden sm:inline">•</span>
          <span>Extra 10% off on first order</span>
          <span className="hidden sm:inline">•</span>
          <span>Cash on Delivery Available</span>
          <span>✨</span>
        </div>
      </div>

      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg sm:text-xl">M</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">MyPinkShop</h1>
                <p className="text-[9px] sm:text-[10px] text-gray-400 tracking-wider">FOR THE GIRLIES ✨</p>
              </div>
            </Link>

            <div className="flex-1 max-w-md lg:max-w-2xl">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search for products..."
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-gray-50"
                  onKeyPress={(e) => e.key === 'Enter' && navigate(`/shop?search=${e.target.value}`)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
              <Link to="/wishlist" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{wishlistCount}</span>}
              </Link>
              
              <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{cartCount}</span>}
              </Link>
              
              {user ? <Avatar user={user} onLogout={logout} /> : 
                <Link to="/login" className="p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
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
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
          <span className="text-gray-400">/</span>
          <Link to="/shop" className="text-gray-500 hover:text-pink-500 transition">Shop</Link>
          <span className="text-gray-400">/</span>
          <span className="text-pink-600 font-medium line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left Column - Images */}
          <div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl aspect-square flex items-center justify-center text-7xl sm:text-8xl shadow-sm border border-pink-100">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span>{productImages[selectedImage]}</span>
              )}
              <button 
                onClick={handleWishlistToggle} 
                className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition"
              >
                <span className="text-xl">{isInWishlist(product.id) ? '❤️' : '🤍'}</span>
              </button>
              {product.badge && (
                <span className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-2 py-1 rounded-full shadow-md">
                  {product.badge}
                </span>
              )}
              {product.isNew && (
                <span className="absolute bottom-4 left-4 bg-amber-500 text-white text-xs px-2 py-1 rounded-full shadow-md">
                  NEW
                </span>
              )}
            </div>
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
              {productImages.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedImage(idx)} 
                  className={`w-16 h-16 sm:w-20 sm:h-20 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl sm:text-3xl border-2 transition flex-shrink-0 ${
                    selectedImage === idx ? 'border-pink-500 shadow-md' : 'border-pink-100 hover:border-pink-300'
                  }`}
                >
                  {img}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div>
            <div className="mb-2">
              <span className="text-sm text-pink-600 font-medium capitalize">{product.category || 'Product'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3">{product.name}</h1>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                <div className="flex text-yellow-400 text-sm sm:text-base">
                  {'★'.repeat(Math.floor(product.rating || 4))}
                  {'☆'.repeat(5 - Math.floor(product.rating || 4))}
                </div>
                <span className="text-sm font-medium ml-1">{product.rating || 4}</span>
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">{product.reviewCount || 0} reviews</span>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-bold text-pink-600">₹{product.price}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-base text-gray-400 line-through">₹{product.originalPrice}</span>
                    <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded text-sm font-medium">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-800 mb-3">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description || 'Premium quality product crafted with care for the modern woman.'}</p>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-800 mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-pink-200 rounded-full bg-white">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-pink-50 transition text-xl text-pink-500"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))} 
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-pink-50 transition text-xl text-pink-500"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-green-600">
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button 
                onClick={handleAddToCart} 
                disabled={product.stock === 0}
                className={`flex-1 py-3 rounded-xl font-medium transition-all transform hover:-translate-y-0.5 ${
                  product.stock > 0 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add to Cart
              </button>
              <button 
                onClick={() => { handleAddToCart(); navigate('/cart'); }} 
                disabled={product.stock === 0}
                className={`flex-1 py-3 rounded-xl font-medium transition-all transform hover:-translate-y-0.5 ${
                  product.stock > 0 
                    ? 'border-2 border-pink-500 text-pink-600 hover:bg-pink-50' 
                    : 'border-2 border-gray-300 text-gray-400 cursor-not-allowed'
                }`}
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-12">
          <div className="flex gap-6 border-b border-pink-200 overflow-x-auto">
            {['description', 'benefits', 'ingredients', 'reviews'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`pb-3 text-sm font-medium capitalize whitespace-nowrap transition ${
                  activeTab === tab ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-pink-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="py-6">
            {activeTab === 'description' && (
              <div className="space-y-6">
                <p className="text-gray-600 leading-relaxed">{product.description || 'Premium quality product crafted with care.'}</p>
                <div className="bg-pink-50 rounded-xl p-6">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <span>✨</span> How To Use
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {product.howToUse || 'Apply as directed on the packaging. For best results, use consistently as part of your daily routine.'}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-pink-100">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <span>📦</span> Shipping Info
                  </h4>
                  <p className="text-gray-600 text-sm">Free shipping on orders above ₹999. Usually delivered in 3-5 business days.</p>
                </div>
              </div>
            )}

            {activeTab === 'benefits' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-pink-50 rounded-xl">
                    <span className="text-pink-500 text-xl">✓</span>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Key Ingredients</h4>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing, idx) => (
                    <span key={idx} className="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full text-sm">
                      {ing}
                    </span>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">*Ingredients may vary slightly. Please check product packaging for complete list.</p>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <ReviewSection productId={id} />
            )}
          </div>
        </div>
      </div>

      {/* Premium Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6 text-xs mb-4">
            <Link to="/terms" className="hover:text-pink-500 transition">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-pink-500 transition">Privacy Policy</Link>
            <a href="#" className="hover:text-pink-500 transition">Help</a>
            <a href="#" className="hover:text-pink-500 transition">Contact Us</a>
          </div>
          <p className="text-center text-xs text-gray-500">
            © 2026 MyPinkShop. All rights reserved.
          </p>
          <p className="text-center text-xs text-gray-600 mt-2">
            Made with 💖 for the girlies
          </p>
        </div>
      </footer>
    </div>
  );
}

export default ProductDetail;
