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
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  // Mock product data
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
      colors: ["Pink", "White", "Gold"],
      inStock: true,
      description: "Achieve that glass-like glowing skin with our premium serum. Enriched with hyaluronic acid and vitamin C, this lightweight formula hydrates, brightens, and reduces fine lines.",
      benefits: ["Deep hydration", "Brightens skin tone", "Reduces fine lines", "Lightweight formula"],
      howToUse: "Apply 2-3 drops on clean face morning and evening. Gently massage until absorbed.",
      ingredients: ["Hyaluronic Acid", "Vitamin C", "Niacinamide", "Green Tea Extract"],
    },
    2: {
      id: 2,
      name: "Rice Water Toner",
      brand: "Mamaearth",
      category: "skincare",
      price: 899,
      originalPrice: 1299,
      discount: 30,
      rating: 4.6,
      reviewCount: 892,
      emoji: "🌸",
      images: ["🌸", "🌾", "💧", "✨"],
      sizes: ["100ml", "200ml"],
      colors: [],
      inStock: true,
      description: "Rice water-infused toner that gently exfoliates and brightens your skin. Perfect for all skin types.",
      benefits: ["Brightens complexion", "Removes dead skin", "Pore tightening", "Hydrating"],
      howToUse: "Apply with cotton pad after cleansing. Use twice daily.",
      ingredients: ["Rice Water", "Niacinamide", "Witch Hazel", "Aloe Vera"],
    },
  };

  // Mock reviews
  const mockReviews = [
    { id: 1, user: "Priya S.", rating: 5, date: "2024-05-10", comment: "Amazing product! My skin feels so soft and glowing ✨", helpful: 45 },
    { id: 2, user: "Aditi R.", rating: 4, date: "2024-05-08", comment: "Good product, but takes time to show results", helpful: 23 },
    { id: 3, user: "Neha K.", rating: 5, date: "2024-05-05", comment: "Worth every penny! ❤️", helpful: 67 },
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const foundProduct = products[id];
      if (foundProduct) {
        setProduct(foundProduct);
        setReviews(mockReviews);
      }
      setLoading(false);
    }, 500);
  }, [id]);

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
    alert(`✨ ${product.name} added to cart!`);
  };

  const handleBuyNow = () => {
    addToCart({ ...product, quantity });
    navigate('/cart');
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    const review = {
      id: reviews.length + 1,
      user: "You",
      rating: newReview.rating,
      date: new Date().toISOString().split('T')[0],
      comment: newReview.comment,
      helpful: 0,
    };
    setReviews([review, ...reviews]);
    setNewReview({ rating: 5, comment: '' });
    alert('✨ Review added successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500">Loading product...</p>
        </div>
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
          <Link to="/" className="bg-pink-500 text-white px-6 py-2 rounded-full">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-pink-100">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <Link to="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">MyPinkShop</h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/wishlist" className="text-2xl">🤍</Link>
            <Link to="/cart" className="relative">
              <span className="text-2xl">🛒</span>
            </Link>
            <Link to="/login" className="text-2xl">👤</Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4 text-sm">
        <Link to="/" className="text-gray-500 hover:text-pink-500">Home</Link>
        <span className="text-gray-400 mx-2">/</span>
        <Link to={`/shop?category=${product.category}`} className="text-gray-500 hover:text-pink-500">{product.category}</Link>
        <span className="text-gray-400 mx-2">/</span>
        <span className="text-pink-500">{product.name}</span>
      </div>

      {/* Product Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left - Product Images */}
          <div>
            <div className="bg-white rounded-2xl p-8 flex items-center justify-center text-9xl border border-pink-100">
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

          {/* Right - Product Info */}
          <div>
            <div className="mb-2">
              <span className="text-sm text-pink-500 font-medium">{product.brand}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-lg">★</span>
                <span className="font-semibold">{product.rating}</span>
              </div>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500 text-sm">{product.reviewCount} ratings</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-pink-600">₹{product.price}</span>
                <span className="text-lg text-gray-400 line-through">₹{product.originalPrice}</span>
                <span className="bg-pink-100 text-pink-600 px-2 py-1 rounded-lg text-sm font-semibold">{product.discount}% OFF</span>
              </div>
              <p className="text-sm text-green-600 mt-1">Inclusive of all taxes</p>
            </div>

            {/* Size Selector */}
            {product.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Select Size</h3>
                <div className="flex gap-3">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-full border-2 transition ${
                        selectedSize === size ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-pink-200 hover:border-pink-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Quantity</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full border border-pink-200 hover:bg-pink-50"
                >
                  -
                </button>
                <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full border border-pink-200 hover:bg-pink-50"
                >
                  +
                </button>
                <span className="text-sm text-gray-500 ml-2">{product.inStock ? 'In Stock' : 'Out of Stock'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-pink-500 text-white py-3 rounded-full font-semibold hover:bg-pink-600 transition"
              >
                Add to Cart 🛒
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 text-white py-3 rounded-full font-semibold hover:shadow-lg transition"
              >
                Buy Now
              </button>
            </div>

            {/* Delivery Info */}
            <div className="bg-gray-50 rounded-xl p-4 border border-pink-100">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">🚚</span>
                <span className="font-semibold">Free Delivery</span>
                <span className="text-sm text-gray-500">on orders above ₹999</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">🔄</span>
                <span className="font-semibold">Easy Returns</span>
                <span className="text-sm text-gray-500">30 days return policy</span>
              </div>
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
                className={`pb-3 px-1 font-semibold capitalize transition ${
                  activeTab === tab ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-pink-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="py-6">
            {activeTab === 'description' && (
              <div className="space-y-4">
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
                <div>
                  <h4 className="font-semibold mb-2">How to Use</h4>
                  <p className="text-gray-600">{product.howToUse}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Key Ingredients</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.ingredients.map(ing => (
                      <span key={ing} className="bg-pink-50 text-pink-600 px-3 py-1 rounded-full text-sm">{ing}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'benefits' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
                    <span className="text-2xl">✓</span>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {/* Write Review */}
                <div className="bg-pink-50 rounded-xl p-6 mb-8">
                  <h3 className="font-semibold mb-4">Write a Review</h3>
                  <form onSubmit={handleReviewSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setNewReview({ ...newReview, rating: r })}
                            className={`text-2xl ${r <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <textarea
                        placeholder="Share your experience with this product..."
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:border-pink-500"
                        required
                      />
                    </div>
                    <button type="submit" className="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition">
                      Submit Review
                    </button>
                  </form>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-pink-100 pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-semibold">{review.user}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex text-yellow-400">
                              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </div>
                            <span className="text-xs text-gray-400">{review.date}</span>
                          </div>
                        </div>
                        <button className="text-sm text-gray-400 hover:text-pink-500">Helpful ({review.helpful})</button>
                      </div>
                      <p className="text-gray-600 mt-2">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Link key={i} to={`/product/${i+2}`} className="bg-white rounded-xl p-4 text-center border border-pink-100 hover:shadow-md transition">
                <div className="text-5xl mb-2">🌟</div>
                <h3 className="font-semibold text-sm">Related Product</h3>
                <p className="text-pink-600 font-bold mt-1">₹999</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
