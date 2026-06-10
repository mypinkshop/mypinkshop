import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  
  const API_URL = 'https://api.mypinkshop.com';

  // Category data configuration
  const categoryData = {
    skincare: {
      title: 'Skincare Products for Glowing Skin',
      description: 'Discover our premium range of skincare products including face washes, serums, moisturizers, sunscreens, and masks. All products are dermatologically tested, cruelty-free, and made with natural ingredients. From hydrating serums to anti-aging creams, find everything you need for your daily skincare routine. Shop best-selling brands like Lakmé, Neutrogena, and The Derma Co. at MyPinkShop.',
      keywords: 'skincare products, face wash, serum, moisturizer, sunscreen, face mask, buy skincare online',
      faqs: [
        { question: 'What is the best skincare routine for beginners?', answer: 'A basic skincare routine includes: Cleanser → Moisturizer → Sunscreen (morning). Add serums based on your skin concerns.' },
        { question: 'How to choose skincare products for oily skin?', answer: 'Look for oil-free, non-comedogenic products with ingredients like salicylic acid, niacinamide, and hyaluronic acid.' },
        { question: 'Are your skincare products cruelty-free?', answer: 'Yes, all our skincare products are 100% cruelty-free and never tested on animals.' }
      ]
    },
    makeup: {
      title: 'Makeup Products - Foundation, Lipstick, Kajal & More',
      description: 'Shop the latest makeup collection at MyPinkShop. Explore foundations, lipsticks, kajal, eyeliners, eyeshadows, mascaras, and more. Whether you need everyday makeup or party glam, we have it all. Brands include Maybelline, L\'Oreal, Lakmé, and international favorites. Get free shipping on orders above ₹999.',
      keywords: 'makeup products, lipstick, foundation, kajal, eyeliner, eyeshadow, mascara, buy makeup online',
      faqs: [
        { question: 'How to choose the right foundation shade?', answer: 'Match foundation to your jawline in natural light. Our product descriptions include shade guides for reference.' },
        { question: 'What is the difference between matte and satin lipstick?', answer: 'Matte lipsticks have a flat finish and long wear. Satin lipsticks have a creamy, slightly glossy finish.' },
        { question: 'Are your makeup products long-lasting?', answer: 'Yes, we stock long-wear, transfer-resistant formulas perfect for all-day wear.' }
      ]
    },
    clothing: {
      title: 'Clothing for Women - Dresses, Tops, Kurtis & More',
      description: 'Shop trendy clothing for women at MyPinkShop. Explore dresses, tops, kurtis, jeans, skirts, and ethnic wear. From casual everyday wear to party outfits, find your perfect style. Premium fabrics, latest designs, and affordable prices. Free shipping on orders above ₹999.',
      keywords: 'women clothing, dresses, tops, kurtis, jeans, ethnic wear, buy clothes online',
      faqs: [
        { question: 'What size should I order?', answer: 'Check our size guide on each product page. Measure yourself and compare with the size chart.' },
        { question: 'What is your return policy for clothing?', answer: 'We accept returns within 7 days of delivery for unused, unwashed items with original tags.' },
        { question: 'Do you have plus-size clothing?', answer: 'Yes, we offer sizes up to XXL in select styles. Use the size filter to find your fit.' }
      ]
    },
    accessories: {
      title: 'Accessories - Bags, Jewelry, Sunglasses & More',
      description: 'Complete your look with our stunning accessories collection. Shop handbags, jewelry sets, sunglasses, watches, scarves, and belts. Perfect for gifting or treating yourself. Trendy designs at best prices. Free shipping available.',
      keywords: 'accessories, handbags, jewelry, sunglasses, watches, buy accessories online',
      faqs: [
        { question: 'Do you offer gift wrapping?', answer: 'Yes, we offer free gift wrapping on all orders. Add a note at checkout.' },
        { question: 'Are your jewelry pieces tarnish-free?', answer: 'Our jewelry is made with high-quality materials that resist tarnishing.' }
      ]
    },
    hair: {
      title: 'Hair Care Products - Shampoo, Conditioner, Hair Oil & More',
      description: 'Get healthy, shiny hair with our premium hair care range. Shop shampoos, conditioners, hair oils, serums, masks, and styling products. Solutions for hair fall, dandruff, frizz, and damage. Professional brands at affordable prices.',
      keywords: 'hair care, shampoo, conditioner, hair oil, hair serum, hair mask, buy hair products online',
      faqs: [
        { question: 'How often should I wash my hair?', answer: 'It depends on your hair type. Oily hair: daily or every other day. Dry hair: 2-3 times a week.' },
        { question: 'Which shampoo is best for hair fall?', answer: 'Look for shampoos with biotin, caffeine, or redensyl. Check product descriptions for specific concerns.' }
      ]
    }
  };

  const currentCategory = categoryData[category] || {
    title: `${category?.charAt(0).toUpperCase() + category?.slice(1)} Products`,
    description: `Shop the best ${category} products online at MyPinkShop. Wide range, best prices, free shipping.`,
    keywords: `${category}, buy ${category} online, ${category} products`,
    faqs: []
  };

  useEffect(() => {
    fetch(`${API_URL}/api/offers/active-offer`)
      .then(res => res.json())
      .then(data => setOffer(data))
      .catch(err => console.error('Offer fetch error:', err));
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `${API_URL}/api/products?category=${category}&limit=50`;
        const response = await fetch(url);
        const data = await response.json();
        let productList = Array.isArray(data) ? data : data.products || [];
        
        // Apply sorting
        if (sortBy === 'price_low') {
          productList.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price_high') {
          productList.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'rating') {
          productList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sortBy === 'newest') {
          productList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        // Apply price filter
        productList = productList.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);
        
        setProducts(productList);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category, sortBy, priceRange]);

  const generateCategorySchema = () => {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": currentCategory.title,
      "description": currentCategory.description,
      "numberOfItems": products.length,
      "itemListElement": products.slice(0, 10).map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://www.mypinkshop.com/product/${product._id}`
      }))
    };
  };

  const generateBreadcrumbSchema = () => {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.mypinkshop.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": currentCategory.title,
          "item": `https://www.mypinkshop.com/${category}`
        }
      ]
    };
  };

  const categorySchema = generateCategorySchema();
  const breadcrumbSchema = generateBreadcrumbSchema();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{currentCategory.title} | MyPinkShop</title>
        <meta name="description" content={currentCategory.description.substring(0, 160)} />
        <meta name="keywords" content={currentCategory.keywords} />
        <link rel="canonical" href={`https://www.mypinkshop.com/${category}`} />
        <meta property="og:title" content={currentCategory.title} />
        <meta property="og:description" content={currentCategory.description.substring(0, 160)} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://www.mypinkshop.com/${category}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={currentCategory.title} />
        <meta name="twitter:description" content={currentCategory.description.substring(0, 160)} />
        <script type="application/ld+json">{JSON.stringify(categorySchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        {/* Top Bar */}
        <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
          <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
            <span>✨</span>
            <span>{offer?.description || 'FREE SHIPPING ON ALL ORDERS'}</span>
            <span className="hidden sm:inline">•</span>
            <span>Extra 10% off on first order</span>
            <span className="hidden sm:inline">•</span>
            <span>Cash on Delivery Available</span>
            <span>✨</span>
          </div>
        </div>

        {/* Header */}
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
                <button onClick={() => navigate('/wishlist')} className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{wishlistCount}</span>}
                </button>
                
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
            <span className="text-pink-600 font-medium capitalize">{category}</span>
          </div>
        </div>

        {/* Category Hero Section - SEO Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-6 sm:p-8 mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">{currentCategory.title}</h1>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              {currentCategory.description}
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="flex gap-2">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-pink-500 bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
            <p className="text-sm text-gray-500">{products.length} products found</p>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="text-center py-16 bg-white/80 rounded-2xl">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {products.map((product) => (
                <Link 
                  key={product._id} 
                  to={`/product/${product._id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-pink-200 transition-all duration-300"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <img 
                      src={product.images?.[0] || 'https://via.placeholder.com/300'} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {product.badge && (
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                        {product.badge}
                      </span>
                    )}
                    {(product.originalPrice > product.price) && (
                      <span className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </span>
                    )}
                  </div>
                  
                  <div className="p-3">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-sm sm:text-base font-bold text-pink-600">₹{product.price}</span>
                      {product.originalPrice > product.price && (
                        <span className="text-[10px] text-gray-400 line-through">₹{product.originalPrice}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex text-yellow-400 text-[10px]">
                        {'★'.repeat(Math.floor(product.rating || 4))}
                        {'☆'.repeat(5 - Math.floor(product.rating || 4))}
                      </div>
                      <span className="text-[10px] text-gray-400">({product.reviewCount || 0})</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* FAQ Section - For SEO Rich Results */}
        {currentCategory.faqs.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCategory.faqs.map((faq, idx) => (
                  <div key={idx} className="border-b border-pink-100 pb-3">
                    <h3 className="font-semibold text-gray-800 text-sm mb-1">{faq.question}</h3>
                    <p className="text-gray-600 text-sm">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12 sm:py-16 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <h3 className="font-bold text-white text-lg">MyPinkShop</h3>
                </div>
                <p className="text-sm">Luxury beauty and fashion for the modern woman.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Shop</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/skincare" className="hover:text-pink-500 transition">Skincare</Link></li>
                  <li><Link to="/makeup" className="hover:text-pink-500 transition">Makeup</Link></li>
                  <li><Link to="/clothing" className="hover:text-pink-500 transition">Clothing</Link></li>
                  <li><Link to="/accessories" className="hover:text-pink-500 transition">Accessories</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/contact" className="hover:text-pink-500 transition">Contact Us</Link></li>
                  <li><Link to="/faqs" className="hover:text-pink-500 transition">FAQs</Link></li>
                  <li><Link to="/shipping" className="hover:text-pink-500 transition">Shipping Info</Link></li>
                  <li><Link to="/returns" className="hover:text-pink-500 transition">Returns Policy</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Follow Us</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-pink-500 transition">Instagram</a></li>
                  <li><a href="#" className="hover:text-pink-500 transition">TikTok</a></li>
                  <li><a href="#" className="hover:text-pink-500 transition">Pinterest</a></li>
                  <li><a href="#" className="hover:text-pink-500 transition">YouTube</a></li>
                </ul>
              </div>
            </div>
            <div className="text-center pt-8 border-t border-gray-800">
              <p className="text-sm">© 2026 MyPinkShop. All rights reserved.</p>
              <p className="text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default CategoryPage;
