import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ReviewSection from '../components/ReviewSection';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('S');
  const [activeTab, setActiveTab] = useState('description');

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
      emoji: "💧",
      images: ["💧", "✨", "💎", "🌟"],
      sizes: ["S", "M", "L"],
      inStock: true,
      description: "Achieve glass-like glowing skin with our premium serum. Enriched with hyaluronic acid and vitamin C.",
      benefits: ["Deep hydration", "Brightens skin tone", "Reduces fine lines", "Lightweight formula"],
      howToUse: "Apply 2-3 drops on cleansed face morning and evening.",
      ingredients: ["Hyaluronic Acid", "Vitamin C", "Niacinamide", "Green Tea Extract"],
    },
    2: {
      id: 2,
      name: "Rice Water Toner",
      brand: "Mamaearth",
      category: "Skincare",
      price: 899,
      originalPrice: 1299,
      discount: 30,
      rating: 4.6,
      reviewCount: 892,
      emoji: "🌸",
      images: ["🌸", "🌾", "💧", "✨"],
      sizes: ["100ml", "200ml"],
      inStock: true,
      description: "Rice water-infused toner that gently exfoliates and brightens your skin.",
      benefits: ["Brightens complexion", "Removes dead skin", "Pore tightening", "Hydrating"],
      howToUse: "Apply with cotton pad after cleansing. Use twice daily.",
      ingredients: ["Rice Water", "Niacinamide", "Witch Hazel", "Aloe Vera"],
    },
  };

  useEffect(() => {
    setTimeout(() => {
      const foundProduct = products[id];
      if (foundProduct) {
        setProduct(foundProduct);
      }
      setLoading(false);
    }, 500);
  }, [id]);

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
    alert(`✨ ${product.name} added to cart!`);
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
          <Link to="/" className="bg-pink-500 text-white px-8 py-3 rounded-full hover:bg-pink-600 transition">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">MyPinkShop</h1>
          </Link>
          <div className="flex items-center gap-5">
            <Link to="/wishlist" className="relative">
              <span className="text-2xl text-gray-600 hover:text-pink-500 transition">🤍</span>
            </Link>
            <Link to="/cart" className="relative">
              <span className="text-2xl text-gray-600 hover:text-pink-500 transition">🛒</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-pink-500 transition">Home</Link>
          <span>/</span>
          <span className="text-pink-600 font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Images */}
          <div>
            <div className="relative bg-white rounded-2xl aspect-square flex items-center justify-center text-8xl shadow-sm border border-pink-100">
              {product.images[selectedImage]}
              <button onClick={handleWishlistToggle} className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition">
                <span className="text-xl">{isInWishlist(product.id) ? '❤️' : '🤍'}</span>
              </button>
            </div>
            <div className="flex gap-3 mt-4">
              {product.images.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(idx)} className={`w-20 h-20 bg-white rounded-xl flex items-center justify-center text-3xl border-2 transition ${selectedImage === idx ? 'border-pink-500 shadow-md' : 'border-pink-100 hover:border-pink-300'}`}>
                  {img}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div>
            <div className="mb-2"><span className="text-sm text-pink-600 font-medium">{product.brand}</span></div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">{product.name}</h1>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-lg">★★★★★</span>
                <span className="text-sm font-medium ml-1">{product.rating}</span>
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">{product.reviewCount} reviews</span>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-pink-600">₹{product.price}</span>
                <span className="text-base text-gray-400 line-through">₹{product.originalPrice}</span>
                <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded text-sm font-medium">{product.discount}% OFF</span>
              </div>
            </div>
            {product.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-800 mb-3">Select Size</h3>
                <div className="flex gap-3">
                  {product.sizes.map(size => (
                    <button key={size} onClick={() => setSelectedSize(size)} className={`w-12 h-12 rounded-full border font-medium transition ${selectedSize === size ? 'bg-pink-500 text-white border-pink-500' : 'border-pink-200 text-gray-600 hover:border-pink-500'}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-800 mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-pink-200 rounded-full">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-full hover:bg-pink-50 transition text-xl">-</button>
                  <span className="w-12 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-full hover:bg-pink-50 transition text-xl">+</button>
                </div>
                <span className="text-sm text-green-600">In Stock</span>
              </div>
            </div>
            <div className="flex gap-4 mb-8">
              <button onClick={handleAddToCart} className="flex-1 bg-pink-500 text-white py-3 rounded-full font-medium hover:bg-pink-600 transition">Add to Cart</button>
              <button onClick={() => { handleAddToCart(); navigate('/cart'); }} className="flex-1 border border-pink-500 text-pink-600 py-3 rounded-full font-medium hover:bg-pink-50 transition">Buy Now</button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-12">
          <div className="flex gap-6 border-b border-pink-200">
            {['description', 'benefits', 'reviews'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-medium capitalize transition ${activeTab === tab ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-pink-500'}`}>
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
                  <p className="text-gray-600 text-sm">{product.howToUse}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Key Ingredients</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.ingredients.map(ing => <span key={ing} className="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full text-sm">{ing}</span>)}
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
              <ReviewSection productId={id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
