import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('S');
  const [activeTab, setActiveTab] = useState('description');
  const [showShareModal, setShowShareModal] = useState(false);
  const [addedToWishlist, setAddedToWishlist] = useState(false);

  const products = {
    1: {
      id: 1,
      name: "Glass Skin Serum",
      brand: "Nykaa Beauty",
      category: "skincare",
      price: 1299,
      originalPrice: 1999,
      discount: 35,
      rating: 4.8,
      reviewCount: 1243,
      emoji: "💧",
      images: ["💧", "✨", "💎", "🌟"],
      sizes: ["S", "M", "L"],
      inStock: true,
      description: "Achieve that glass-like glowing skin with our premium serum. Enriched with hyaluronic acid and vitamin C.",
      benefits: ["Deep hydration", "Brightens skin tone", "Reduces fine lines", "Lightweight formula"],
    },
  };

  const reviews = [
    { id: 1, user: "Priya S.", avatar: "👩", rating: 5, date: "2 days ago", comment: "Obsessed! My skin has never looked better ✨", helpful: 45 },
    { id: 2, user: "Aditi R.", avatar: "👧", rating: 4, date: "5 days ago", comment: "Good product, consistent use se results dikhte hain", helpful: 23 },
    { id: 3, user: "Neha K.", avatar: "👩‍🦱", rating: 5, date: "1 week ago", comment: "Worth every penny! ❤️", helpful: 67 },
  ];

  useEffect(() => {
    setTimeout(() => {
      setProduct(products[id]);
      setLoading(false);
    }, 500);
  }, [id]);

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
    alert(`✨ ${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-pink-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-400 mt-4 animate-pulse">Loading magic...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-4 animate-bounce">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-400 mb-6">The product you're looking for doesn't exist.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full hover:shadow-lg transition">
            <span>←</span> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-pink-50/30 to-white">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="group">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent group-hover:scale-105 transition">MyPinkShop</h1>
          </Link>
          <div className="flex items-center gap-5">
            <button className="relative group">
              <span className="text-2xl group-hover:scale-110 transition">🤍</span>
              <span className="absolute -top-1 -right-2 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">0</span>
            </button>
            <Link to="/cart" className="relative group">
              <span className="text-2xl group-hover:scale-110 transition">🛒</span>
            </Link>
            <Link to="/login" className="text-2xl hover:scale-110 transition">👤</Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-400 hover:text-pink-500 transition">Home</Link>
          <span className="text-gray-300">→</span>
          <Link to="/shop" className="text-gray-400 hover:text-pink-500 transition">{product.category}</Link>
          <span className="text-gray-300">→</span>
          <span className="text-pink-500 font-medium">{product.name}</span>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left - Image Gallery - Premium Design */}
          <div className="space-y-4">
            <div className="group relative bg-gradient-to-br from-pink-50 to-white rounded-3xl p-8 flex items-center justify-center text-9xl shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-200/20 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
              <div className="animate-float">{product.images[selectedImage]}</div>
              <div className="absolute top-4 left-4">
                <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-3 py-1 rounded-full shadow-lg">{product.discount}% OFF</span>
              </div>
              <button 
                onClick={() => setAddedToWishlist(!addedToWishlist)}
                className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition"
              >
                <span className="text-xl">{addedToWishlist ? '❤️' : '🤍'}</span>
              </button>
            </div>
            <div className="flex gap-3 justify-center">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-3xl border-2 transition-all duration-300 hover:scale-105 ${
                    selectedImage === idx ? 'border-pink-500 shadow-lg scale-105' : 'border-pink-100 hover:border-pink-300'
                  }`}
                >
                  {img}
                </button>
              ))}
            </div>
          </div>

          {/* Right - Product Info - Premium */}
          <div>
            <div className="mb-2">
              <span className="inline-block px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-semibold tracking-wide">{product.brand}</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3 leading-tight">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded-lg text-sm">
                <span>{product.rating}</span>
                <span>★</span>
              </div>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500 text-sm">{product.reviewCount} customer ratings</span>
              <button className="text-pink-500 text-sm hover:underline">Write a review</button>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-pink-600">₹{product.price}</span>
                <span className="text-lg text-gray-400 line-through">₹{product.originalPrice}</span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-sm font-semibold">{product.discount}% OFF</span>
              </div>
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">✓ Inclusive of all taxes ✓ Free shipping on ₹999+</p>
            </div>

            {/* Size Selector */}
            {product.sizes.length > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Select Size</h3>
                  <button className="text-xs text-pink-500 hover:underline">Size Guide →</button>
                </div>
                <div className="flex gap-3">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-xl font-semibold transition-all duration-300 ${
                        selectedSize === size 
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg scale-105' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <h3 className="font-semibold mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-100 rounded-full p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-white shadow-sm hover:bg-gray-50 transition text-xl"
                  >
                    -
                  </button>
                  <span className="w-14 text-center font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-white shadow-sm hover:bg-gray-50 transition text-xl"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-green-600 flex items-center gap-1">✓ {product.inStock ? 'In Stock' : 'Out of Stock'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-full font-semibold hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                🛒 Add to Cart
              </button>
              <button
                onClick={() => { handleAddToCart(); navigate('/cart'); }}
                className="flex-1 border-2 border-pink-500 text-pink-600 py-4 rounded-full font-semibold hover:bg-pink-50 transition-all duration-300"
              >
                Buy Now
              </button>
            </div>

            {/* Delivery Info Cards */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-3 flex items-center gap-3 border border-pink-100">
                <span className="text-2xl">🚚</span>
                <div>
                  <p className="font-semibold text-sm">Free Delivery</p>
                  <p className="text-xs text-gray-400">on ₹999+</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-3 flex items-center gap-3 border border-pink-100">
                <span className="text-2xl">🔄</span>
                <div>
                  <p className="font-semibold text-sm">Easy Returns</p>
                  <p className="text-xs text-gray-400">30 days policy</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-3 flex items-center gap-3 border border-pink-100">
                <span className="text-2xl">💳</span>
                <div>
                  <p className="font-semibold text-sm">Secure Payment</p>
                  <p className="text-xs text-gray-400">100% safe</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-3 flex items-center gap-3 border border-pink-100">
                <span className="text-2xl">🎁</span>
                <div>
                  <p className="font-semibold text-sm">Free Gift</p>
                  <p className="text-xs text-gray-400">on ₹1499+</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16">
          <div className="flex flex-wrap gap-2 border-b border-pink-100">
            {[
              { id: 'description', label: 'Description', icon: '📝' },
              { id: 'benefits', label: 'Benefits', icon: '✨' },
              { id: 'reviews', label: `Reviews (${reviews.length})`, icon: '⭐' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl font-medium transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-white text-pink-600 shadow-sm' 
                    : 'text-gray-400 hover:text-pink-500'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8 mt-0 rounded-t-none">
            {activeTab === 'description' && (
              <div className="space-y-6">
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
                <div className="bg-pink-50 rounded-xl p-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">✨ How to Use</h4>
                  <p className="text-gray-600">Apply 2-3 drops on clean face morning and evening. Gently massage until absorbed. Follow with moisturizer.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">🌿 Key Ingredients</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Hyaluronic Acid", "Vitamin C", "Niacinamide", "Green Tea Extract"].map(ing => (
                      <span key={ing} className="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full text-sm">{ing}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'benefits' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-pink-50 rounded-xl hover:scale-[1.02] transition">
                    <span className="text-2xl">✓</span>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Write Review */}
                <div className="bg-pink-50 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">✍️ Write a Review</h3>
                  <div className="flex gap-4 mb-4">
                    {[5,4,3,2,1].map(r => (
                      <button key={r} className="text-2xl text-yellow-400 hover:scale-110 transition">★</button>
                    ))}
                  </div>
                  <textarea placeholder="Share your experience..." rows="3" className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:border-pink-500"></textarea>
                  <button className="mt-4 bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition">Submit Review</button>
                </div>

                {/* Reviews List */}
                {reviews.map(review => (
                  <div key={review.id} className="border-b border-pink-100 pb-6 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white text-lg">
                        {review.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div>
                            <span className="font-semibold">{review.user}</span>
                            <div className="flex text-yellow-400 text-sm mt-1">
                              {'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">{review.date}</span>
                        </div>
                        <p className="text-gray-600 mt-2">{review.comment}</p>
                        <button className="text-sm text-gray-400 hover:text-pink-500 mt-2">Helpful ({review.helpful})</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Carousel */}
        <div className="mt-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">You May Also Like</h2>
            <button className="text-pink-500 text-sm hover:underline">View All →</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <Link key={i} to={`/product/${i+2}`} className="group bg-white rounded-2xl p-4 text-center border border-pink-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-5xl mb-3 group-hover:scale-110 transition duration-300">🌟</div>
                <h3 className="font-semibold text-sm">Premium Product</h3>
                <p className="text-pink-600 font-bold mt-2">₹999</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default ProductDetail;
