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
  const [selectedSize, setSelectedSize] = useState('Small');
  const [activeTab, setActiveTab] = useState('description');
  const [addedToWishlist, setAddedToWishlist] = useState(false);

  const products = {
    1: {
      id: 1,
      name: "Glass Skin Serum",
      brand: "Nykaa Beauty",
      category: "Skincare",
      price: 1299,
      originalPrice: 1999,
      discount: 35,
      rating: 4.8,
      reviewCount: 1243,
      images: ["💧", "✨", "💎", "🌟"],
      sizes: ["Small", "Medium", "Large"],
      inStock: true,
      description: "Achieve glass-like glowing skin with our premium serum. Enriched with hyaluronic acid and vitamin C, this lightweight formula hydrates, brightens, and reduces fine lines with regular use.",
      benefits: [
        "Deep hydration for all skin types",
        "Brightens skin tone and reduces dark spots",
        "Minimizes fine lines and wrinkles",
        "Lightweight, non-greasy formula"
      ],
    },
  };

  const reviews = [
    { id: 1, user: "Priya Sharma", rating: 5, date: "May 10, 2024", comment: "Absolutely love this product! My skin feels so smooth and hydrated.", helpful: 45 },
    { id: 2, user: "Aditi Singh", rating: 4, date: "May 8, 2024", comment: "Good product. Takes about 2 weeks to see visible results.", helpful: 23 },
  ];

  useEffect(() => {
    setTimeout(() => {
      setProduct(products[id]);
      setLoading(false);
    }, 500);
  }, [id]);

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-gray-200 border-t-pink-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-6">The product you're looking for does not exist.</p>
          <Link to="/" className="bg-gray-900 text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-semibold tracking-tight">
            MyPinkShop
          </Link>
          <div className="flex items-center gap-6">
            <button className="text-gray-600 hover:text-gray-900 transition">Wishlist</button>
            <Link to="/cart" className="text-gray-600 hover:text-gray-900 transition">Cart</Link>
            <button className="text-gray-600 hover:text-gray-900 transition">Account</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-gray-900 transition">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-gray-900 transition">{product.category}</Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column - Images */}
          <div>
            <div className="bg-gray-50 rounded-2xl aspect-square flex items-center justify-center text-8xl">
              {product.images[selectedImage]}
            </div>
            <div className="flex gap-3 mt-4">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center text-3xl border-2 transition ${
                    selectedImage === idx ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
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
              <span className="text-sm text-pink-600 font-medium">{product.brand}</span>
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-3">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center">
                <span className="text-yellow-500 text-sm">★★★★★</span>
                <span className="text-sm font-medium ml-2">{product.rating}</span>
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">{product.reviewCount} Reviews</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-semibold text-gray-900">₹{product.price}</span>
                <span className="text-base text-gray-400 line-through">₹{product.originalPrice}</span>
                <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded text-sm font-medium">{product.discount}% Off</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Inclusive of all taxes. Free shipping on orders above ₹999.</p>
            </div>

            {/* Size Selector */}
            {product.sizes.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Select Size</h3>
                <div className="flex gap-3">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-2 rounded-full border text-sm font-medium transition ${
                        selectedSize === size 
                          ? 'border-gray-900 bg-gray-900 text-white' 
                          : 'border-gray-300 text-gray-700 hover:border-gray-900'
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
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-full">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full hover:bg-gray-100 transition text-xl"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full hover:bg-gray-100 transition text-xl"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-green-600">{product.inStock ? 'In Stock' : 'Out of Stock'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-gray-900 text-white py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition"
              >
                Add to Cart
              </button>
              <button
                onClick={() => { handleAddToCart(); navigate('/cart'); }}
                className="flex-1 border border-gray-900 text-gray-900 py-3 rounded-full text-sm font-medium hover:bg-gray-50 transition"
              >
                Buy Now
              </button>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "🚚", title: "Free Shipping", detail: "On orders above ₹999" },
                { icon: "🔄", title: "Easy Returns", detail: "30 days return policy" },
                { icon: "💳", title: "Secure Payment", detail: "100% secure transactions" },
                { icon: "🎁", title: "Free Gift", detail: "On orders above ₹1499" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16">
          <div className="flex gap-8 border-b border-gray-200">
            {['description', 'benefits', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium transition ${
                  activeTab === tab ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="space-y-6">
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-medium text-gray-900 mb-2">How To Use</h4>
                  <p className="text-gray-600 text-sm">Apply 2-3 drops on cleansed face morning and evening. Gently massage until fully absorbed. Follow with moisturizer.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Key Ingredients</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Hyaluronic Acid", "Vitamin C", "Niacinamide", "Green Tea Extract"].map((ing) => (
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
                    <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700 text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {/* Write Review */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Write a Review</h3>
                  <div className="flex gap-2 mb-4">
                    {[5,4,3,2,1].map((r) => (
                      <button key={r} className="text-2xl text-yellow-400">★</button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Share your experience with this product..."
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 text-sm"
                  ></textarea>
                  <button className="mt-4 bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition">
                    Submit Review
                  </button>
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-gray-900">{review.user}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex text-yellow-400 text-sm">
                              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </div>
                            <span className="text-xs text-gray-400">{review.date}</span>
                          </div>
                        </div>
                        <button className="text-sm text-gray-400 hover:text-gray-600 transition">
                          Helpful ({review.helpful})
                        </button>
                      </div>
                      <p className="text-gray-600 text-sm mt-2">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">You May Also Like</h2>
            <button className="text-sm text-gray-500 hover:text-gray-900 transition">View All →</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Link
                key={i}
                to={`/product/${i + 2}`}
                className="group bg-gray-50 rounded-xl p-4 text-center hover:shadow-md transition"
              >
                <div className="text-4xl mb-3">🌟</div>
                <h3 className="font-medium text-sm text-gray-900">Premium Product</h3>
                <p className="text-pink-600 font-medium text-sm mt-2">₹999</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
