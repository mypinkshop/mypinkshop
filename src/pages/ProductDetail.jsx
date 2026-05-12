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
      images: ["💧", "✨", "💎", "🌟"],
      sizes: ["S", "M", "L"],
      inStock: true,
      description: "Achieve glass-like glowing skin with our premium serum. Enriched with hyaluronic acid and vitamin C.",
      benefits: [
        "Deep hydration for all skin types",
        "Brightens skin tone",
        "Reduces fine lines",
        "Lightweight formula"
      ],
    },
  };

  const reviews = [
    { id: 1, user: "Priya Sharma", rating: 5, date: "May 10, 2024", comment: "Absolutely love this product!", helpful: 45 },
    { id: 2, user: "Aditi Singh", rating: 4, date: "May 8, 2024", comment: "Good product, takes time to show results.", helpful: 23 },
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
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-6">The product you're looking for doesn't exist.</p>
          <Link to="/" className="bg-pink-500 text-white px-8 py-3 rounded-full hover:bg-pink-600 transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50">
      
      {/* Header — Dark Pink (same as homepage) */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">MyPinkShop</h1>
          </Link>
          <div className="flex items-center gap-5">
            <button className="relative">
              <span className="text-2xl text-gray-600 hover:text-pink-500 transition">🤍</span>
              <span className="absolute -top-1 -right-2 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">0</span>
            </button>
            <Link to="/cart" className="relative">
              <span className="text-2xl text-gray-600 hover:text-pink-500 transition">🛒</span>
            </Link>
            <Link to="/login" className="text-2xl text-gray-600 hover:text-pink-500 transition">👤</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-pink-500 transition">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-pink-500 transition">{product.category}</Link>
          <span>/</span>
          <span className="text-pink-600 font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left — Images */}
          <div>
            <div className="bg-white rounded-2xl aspect-square flex items-center justify-center text-8xl shadow-sm border border-pink-100">
              {product.images[selectedImage]}
            </div>
            <div className="flex gap-3 mt-4">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 bg-white rounded-xl flex items-center justify-center text-3xl border-2 transition ${
                    selectedImage === idx ? 'border-pink-500 shadow-md' : 'border-pink-100 hover:border-pink-300'
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
              <span className="text-sm text-pink-600 font-medium">{product.brand}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-lg">★★★★★</span>
                <span className="text-sm font-medium ml-1">{product.rating}</span>
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">{product.reviewCount} reviews</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-pink-600">₹{product.price}</span>
                <span className="text-base text-gray-400 line-through">₹{product.originalPrice}</span>
                <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded text-sm font-medium">{product.discount}% OFF</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Inclusive of all taxes. Free shipping on orders above ₹999.</p>
            </div>

            {/* Size */}
            {product.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-800 mb-3">Select Size</h3>
                <div className="flex gap-3">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-full border font-medium transition ${
                        selectedSize === size 
                          ? 'bg-pink-500 text-white border-pink-500' 
                          : 'border-pink-200 text-gray-600 hover:border-pink-500'
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
              <h3 className="text-sm font-medium text-gray-800 mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-pink-200 rounded-full">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full hover:bg-pink-50 transition text-xl"
                  >
                    -
                  </button>
                  <span className="w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full hover:bg-pink-50 transition text-xl"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-green-600">{product.inStock ? 'In Stock' : 'Out of Stock'}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-pink-500 text-white py-3 rounded-full font-medium hover:bg-pink-600 transition"
              >
                Add to Cart
              </button>
              <button
                onClick={() => { handleAddToCart(); navigate('/cart'); }}
                className="flex-1 border border-pink-500 text-pink-600 py-3 rounded-full font-medium hover:bg-pink-50 transition"
              >
                Buy Now
              </button>
            </div>

            {/* Delivery Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "🚚", title: "Free Shipping", detail: "on ₹999+" },
                { icon: "🔄", title: "Easy Returns", detail: "30 days policy" },
                { icon: "💳", title: "Secure Payment", detail: "100% safe" },
                { icon: "🎁", title: "Free Gift", detail: "on ₹1499+" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl p-3 flex items-center gap-3 border border-pink-100">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-medium text-sm text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-12">
          <div className="flex gap-6 border-b border-pink-200">
            {['description', 'benefits', 'reviews'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition ${
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
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
                <div className="bg-pink-50 rounded-xl p-6">
                  <h4 className="font-medium text-gray-800 mb-2">How To Use</h4>
                  <p className="text-gray-600 text-sm">Apply 2-3 drops on cleansed face morning and evening. Gently massage until fully absorbed.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Key Ingredients</h4>
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
                  <div key={idx} className="flex items-center gap-3 p-4 bg-pink-50 rounded-xl">
                    <span className="text-pink-500 text-xl">✓</span>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Write Review */}
                <div className="bg-pink-50 rounded-xl p-6">
                  <h3 className="font-medium text-gray-800 mb-4">Write a Review</h3>
                  <div className="flex gap-2 mb-4">
                    {[5,4,3,2,1].map(r => (
                      <button key={r} className="text-2xl text-yellow-400 hover:scale-110 transition">★</button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Share your experience with this product..."
                    rows="3"
                    className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:border-pink-400"
                  ></textarea>
                  <button className="mt-4 bg-pink-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-pink-600 transition">
                    Submit Review
                  </button>
                </div>

                {/* Reviews List */}
                {reviews.map(review => (
                  <div key={review.id} className="border-b border-pink-100 pb-6 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium text-gray-800">{review.user}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex text-yellow-400 text-sm">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}
                          </div>
                          <span className="text-xs text-gray-400">{review.date}</span>
                        </div>
                      </div>
                      <button className="text-sm text-gray-400 hover:text-pink-500 transition">
                        Helpful ({review.helpful})
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm mt-2">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">You May Also Like</h2>
            <button className="text-sm text-pink-500 hover:text-pink-600 transition">View All →</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <Link key={i} to={`/product/${i+2}`} className="bg-white rounded-xl p-4 text-center border border-pink-100 hover:shadow-md transition hover:-translate-y-1">
                <div className="text-4xl mb-3">✨</div>
                <h3 className="font-medium text-sm text-gray-800">Premium Product</h3>
                <p className="text-pink-600 font-bold mt-2">₹999</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
