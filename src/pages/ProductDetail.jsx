import { useState, useEffect } from 'react';
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
    { id: 2, user: "Aditi R.", avatar: "👧", rating: 5, date: "5 days ago", comment: "10/10 would recommend! 🎀", helpful: 23 },
    { id: 3, user: "Neha K.", avatar: "👩‍🦱", rating: 4, date: "1 week ago", comment: "Worth every penny! ❤️", helpful: 67 },
  ];

  useEffect(() => {
    setTimeout(() => {
      setProduct(products[id]);
      setLoading(false);
    }, 500);
  }, [id]);

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
    alert(`✨ ${product.name} added to bag!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto relative">
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-pink-400 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-400 mt-4">loading... ✨</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">oops! not found</h2>
          <p className="text-gray-400 mb-6">the product you're looking for doesn't exist.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition">
            back to home →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      
      {/* Header — Clean Minimal */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
            mypinkshop
          </Link>
          <div className="flex items-center gap-6">
            <button className="text-2xl hover:scale-110 transition">🤍</button>
            <Link to="/cart" className="relative text-2xl hover:scale-110 transition">🛒</Link>
            <button className="text-2xl hover:scale-110 transition">👤</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb — Minimal */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-black transition">home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-black transition">{product.category}</Link>
          <span>/</span>
          <span className="text-black font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left — Image Section */}
          <div className="space-y-4">
            <div className="group relative bg-gray-50 rounded-3xl p-8 flex items-center justify-center text-8xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-100/30 to-transparent rounded-3xl"></div>
              <div className="animate-float">{product.images[selectedImage]}</div>
              <div className="absolute top-4 left-4">
                <span className="bg-black text-white text-xs px-3 py-1 rounded-full">-{product.discount}%</span>
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
                  className={`w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-2xl border-2 transition-all duration-300 ${
                    selectedImage === idx ? 'border-pink-500 shadow-lg scale-105' : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  {img}
                </button>
              ))}
            </div>
          </div>

          {/* Right — Product Info */}
          <div>
            <div className="mb-2">
              <span className="text-sm text-pink-500 font-medium uppercase tracking-wider">{product.brand}</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-lg">★★★★★</span>
                <span className="text-sm font-medium ml-1">{product.rating}</span>
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-gray-400 text-sm">{product.reviewCount} reviews</span>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-gray-900">₹{product.price}</span>
                <span className="text-lg text-gray-400 line-through">₹{product.originalPrice}</span>
              </div>
              <p className="text-sm text-green-600 mt-2">✓ free shipping on orders above ₹999</p>
            </div>

            {/* Size */}
            {product.sizes.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold mb-3">size</h3>
                <div className="flex gap-3">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-full font-medium transition-all duration-300 ${
                        selectedSize === size 
                          ? 'bg-black text-white shadow-md' 
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
              <h3 className="font-semibold mb-3">quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-100 rounded-full">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-white shadow-sm hover:bg-gray-50 transition text-xl"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-white shadow-sm hover:bg-gray-50 transition text-xl"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-green-600">{product.inStock ? 'in stock' : 'out of stock'}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-black text-white py-4 rounded-full font-medium hover:bg-gray-800 transition-all duration-300"
              >
                add to bag 🛒
              </button>
              <button
                onClick={() => { handleAddToCart(); navigate('/cart'); }}
                className="flex-1 border-2 border-black text-black py-4 rounded-full font-medium hover:bg-black hover:text-white transition-all duration-300"
              >
                buy now
              </button>
            </div>

            {/* Delivery Info — Glass Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: "🚚", label: "free shipping", detail: "on ₹999+" },
                { emoji: "🔄", label: "easy returns", detail: "30 days policy" },
                { emoji: "💳", label: "secure payment", detail: "100% safe" },
                { emoji: "🎁", label: "free gift", detail: "on ₹1499+" },
              ].map((item, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16">
          <div className="flex gap-6 border-b border-gray-100">
            {['description', 'benefits', 'reviews'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium transition ${
                  activeTab === tab ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-black'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="space-y-6">
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h4 className="font-semibold mb-3">how to use</h4>
                  <p className="text-gray-600">Apply 2-3 drops on clean face morning and evening. Gently massage until absorbed.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">key ingredients</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Hyaluronic Acid", "Vitamin C", "Niacinamide"].map(ing => (
                      <span key={ing} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm">{ing}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'benefits' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <span className="text-xl">✨</span>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">write a review</h3>
                  <div className="flex gap-2 mb-4">
                    {[1,2,3,4,5].map(r => (
                      <button key={r} className="text-2xl text-yellow-400">★</button>
                    ))}
                  </div>
                  <textarea placeholder="share your experience..." rows="3" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black"></textarea>
                  <button className="mt-4 bg-black text-white px-6 py-2 rounded-full text-sm hover:bg-gray-800 transition">submit review</button>
                </div>

                {reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">{review.avatar}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">{review.user}</span>
                            <div className="flex text-yellow-400 text-sm mt-1">
                              {'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">{review.date}</span>
                        </div>
                        <p className="text-gray-600 mt-2">{review.comment}</p>
                        <button className="text-sm text-gray-400 mt-2 hover:text-black transition">helpful ({review.helpful})</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight">you may also like</h2>
            <button className="text-sm text-gray-400 hover:text-black transition">view all →</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <Link key={i} to={`/product/${i+2}`} className="group bg-gray-50 rounded-2xl p-4 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="text-4xl mb-3 group-hover:scale-110 transition">✨</div>
                <h3 className="font-medium text-sm">premium product</h3>
                <p className="text-black font-bold mt-2">₹999</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default ProductDetail;
