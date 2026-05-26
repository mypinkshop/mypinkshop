import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

function FAQs() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState(null);

  const categories = [
    { id: 'all', name: 'All', icon: '✨', count: 0 },
    { id: 'orders', name: 'Orders & Shipping', icon: '📦', count: 0 },
    { id: 'returns', name: 'Returns & Refunds', icon: '🔄', count: 0 },
    { id: 'products', name: 'Products', icon: '💄', count: 0 },
    { id: 'account', name: 'Account', icon: '👤', count: 0 },
    { id: 'payments', name: 'Payments', icon: '💳', count: 0 },
  ];

  const faqs = [
    // Orders & Shipping
    {
      id: 1,
      question: 'How long does shipping take?',
      answer: 'Standard delivery takes 3-5 business days. Express delivery (₹99) takes 1-2 business days. Free shipping on orders above ₹999. Delivery times may vary based on your location.',
      category: 'orders',
      helpful: 245,
    },
    {
      id: 2,
      question: 'How can I track my order?',
      answer: 'You can track your order from "My Orders" section in your account. A tracking link is also sent to your email and SMS once the order is shipped. You\'ll receive real-time updates at every stage.',
      category: 'orders',
      helpful: 189,
    },
    {
      id: 3,
      question: 'Do you ship internationally?',
      answer: 'Currently, we only ship within India. We\'re working on expanding internationally. Stay tuned for updates!',
      category: 'orders',
      helpful: 67,
    },
    {
      id: 4,
      question: 'What are the shipping charges?',
      answer: 'Shipping is free on all orders above ₹999. For orders below ₹999, standard shipping charges are ₹40 and express shipping is ₹99.',
      category: 'orders',
      helpful: 156,
    },
    {
      id: 5,
      question: 'Can I change my shipping address after order?',
      answer: 'Yes, you can change your shipping address within 1 hour of placing the order. Contact our support team immediately with your order ID.',
      category: 'orders',
      helpful: 92,
    },

    // Returns & Refunds
    {
      id: 6,
      question: 'What is your return policy?',
      answer: 'We accept returns within 7 days of delivery for unused products in original packaging. The product must be in sellable condition with all tags intact.',
      category: 'returns',
      helpful: 312,
    },
    {
      id: 7,
      question: 'How do I initiate a return?',
      answer: 'Go to "My Orders" section, select the order, and click "Return Item". Fill in the reason and submit. Our team will pick up the product within 2-3 business days.',
      category: 'returns',
      helpful: 178,
    },
    {
      id: 8,
      question: 'How long does refund take?',
      answer: 'Refunds are processed within 5-7 business days after the product is received and inspected. The amount will be credited to your original payment method.',
      category: 'returns',
      helpful: 203,
    },
    {
      id: 9,
      question: 'Can I exchange a product?',
      answer: 'Yes, we offer exchanges for size or color variants within 7 days of delivery. Exchanges are free for the first request.',
      category: 'returns',
      helpful: 145,
    },
    {
      id: 10,
      question: 'What if I receive a damaged product?',
      answer: 'If you receive a damaged or defective product, please contact us within 24 hours with photos of the damage. We\'ll arrange a replacement or full refund immediately.',
      category: 'returns',
      helpful: 267,
    },

    // Products
    {
      id: 11,
      question: 'Are your products authentic?',
      answer: 'Yes, 100%! All products are sourced directly from brands or authorized distributors. We guarantee authenticity of every product sold on MyPinkShop.',
      category: 'products',
      helpful: 423,
    },
    {
      id: 12,
      question: 'How do I know which shade is right for me?',
      answer: 'Each product page has detailed shade descriptions, swatch images, and customer reviews. You can also contact our beauty experts for personalized recommendations.',
      category: 'products',
      helpful: 189,
    },
    {
      id: 13,
      question: 'Do you have size charts for clothing?',
      answer: 'Yes, every clothing product has a detailed size chart. Check the "Size Guide" section on the product page for measurements.',
      category: 'products',
      helpful: 234,
    },
    {
      id: 14,
      question: 'Are your products tested on animals?',
      answer: 'We are cruelty-free! All our products are PETA-certified and never tested on animals. We only work with brands that share our values.',
      category: 'products',
      helpful: 456,
    },

    // Account
    {
      id: 15,
      question: 'How do I create an account?',
      answer: 'Click on the "Sign Up" button on the top right, fill in your details, verify your mobile with OTP, and you\'re ready to shop!',
      category: 'account',
      helpful: 98,
    },
    {
      id: 16,
      question: 'I forgot my password. What should I do?',
      answer: 'Click on "Forgot Password" on the login page. Enter your registered email, and we\'ll send you a link to reset your password.',
      category: 'account',
      helpful: 156,
    },
    {
      id: 17,
      question: 'How do I delete my account?',
      answer: 'Please contact our support team to request account deletion. We\'ll process your request within 7 business days.',
      category: 'account',
      helpful: 45,
    },
    {
      id: 18,
      question: 'Can I have multiple shipping addresses?',
      answer: 'Yes! You can save multiple addresses in your profile. Select your preferred address at checkout.',
      category: 'account',
      helpful: 123,
    },

    // Payments
    {
      id: 19,
      question: 'What payment methods do you accept?',
      answer: 'We accept Credit/Debit Cards (Visa, Mastercard, RuPay), UPI (Google Pay, PhonePe, Paytm), Net Banking (all major banks), and Cash on Delivery.',
      category: 'payments',
      helpful: 287,
    },
    {
      id: 20,
      question: 'Is Cash on Delivery available?',
      answer: 'Yes, COD is available on all orders. Please keep exact change ready for the delivery agent as change may not be available.',
      category: 'payments',
      helpful: 345,
    },
    {
      id: 21,
      question: 'Is it safe to use my card on your website?',
      answer: 'Absolutely! We use 256-bit SSL encryption and PCI-DSS compliant payment gateways. Your card details are never stored on our servers.',
      category: 'payments',
      helpful: 412,
    },
    {
      id: 22,
      question: 'Do you offer EMI options?',
      answer: 'Yes, EMI options are available on orders above ₹3000 through our partner banks. Select "EMI" at checkout to see available plans.',
      category: 'payments',
      helpful: 178,
    },
  ];

  // Update category counts
  categories.forEach(cat => {
    if (cat.id === 'all') {
      cat.count = faqs.length;
    } else {
      cat.count = faqs.filter(f => f.category === cat.id).length;
    }
  });

  // Filter FAQs based on search and category
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      
      {/* Premium Top Bar */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
          <span>✨</span>
          <span>Free Shipping on ₹999+</span>
          <span className="hidden sm:inline">•</span>
          <span>24/7 Customer Support</span>
          <span className="hidden sm:inline">•</span>
          <span>Easy Returns</span>
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
          <span className="text-pink-600 font-medium">FAQs</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-100 via-rose-100 to-pink-100 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
            Frequently Asked Questions ❓
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Find answers to common questions about orders, shipping, returns, and more
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto mt-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search your question..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-5 py-3 pl-12 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 bg-white shadow-sm"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all transform hover:-translate-y-0.5 ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-pink-50 border border-pink-100'
              }`}
            >
              <span className="mr-1">{cat.icon}</span> {cat.name}
              <span className={`ml-1 text-xs ${activeCategory === cat.id ? 'text-white/80' : 'text-gray-400'}`}>
                ({cat.count})
              </span>
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500">
            Found {filteredFaqs.length} {filteredFaqs.length === 1 ? 'answer' : 'answers'}
          </p>
        </div>

        {/* FAQs Accordion */}
        {filteredFaqs.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-pink-100">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No results found</h3>
            <p className="text-gray-500">Try searching with different keywords or browse all categories</p>
            <button
              onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}
              className="mt-4 text-pink-500 hover:underline"
            >
              Clear filters →
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {filteredFaqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-pink-50/50 transition"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-pink-500 text-xl mt-0.5">
                      {openFaq === faq.id ? '▼' : '▶'}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-800 pr-4">{faq.question}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">
                          {categories.find(c => c.id === faq.category)?.icon} {categories.find(c => c.id === faq.category)?.name}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">👍 {faq.helpful} found helpful</span>
                      </div>
                    </div>
                  </div>
                </button>
                
                {openFaq === faq.id && (
                  <div className="px-6 pb-5 pt-2 border-t border-pink-100 bg-pink-50/30">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    <div className="flex gap-3 mt-4">
                      <button className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">
                        👍 Yes, helpful
                      </button>
                      <button className="text-xs text-gray-500 hover:text-gray-600 flex items-center gap-1">
                        👎 Not helpful
                      </button>
                      <button className="text-xs text-pink-500 hover:text-pink-600 flex items-center gap-1">
                        📞 Contact Support
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Still Need Help */}
        <div className="mt-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-8 text-center text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-1">Still have questions?</h3>
              <p className="text-white/80">Our support team is here to help you 24/7</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/contact"
                className="px-6 py-2.5 bg-white text-pink-600 rounded-xl font-semibold hover:shadow-lg transition transform hover:-translate-y-0.5"
              >
                Contact Support →
              </Link>
              <button className="px-6 py-2.5 bg-white/20 border border-white/30 rounded-xl font-semibold hover:bg-white/30 transition">
                💬 Live Chat
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <Link to="/contact" className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-pink-100 hover:shadow-md transition">
            <span className="text-2xl block mb-1">📞</span>
            <span className="text-sm font-medium text-gray-700">Contact Us</span>
          </Link>
          <Link to="/track-order" className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-pink-100 hover:shadow-md transition">
            <span className="text-2xl block mb-1">📦</span>
            <span className="text-sm font-medium text-gray-700">Track Order</span>
          </Link>
          <Link to="/returns" className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-pink-100 hover:shadow-md transition">
            <span className="text-2xl block mb-1">🔄</span>
            <span className="text-sm font-medium text-gray-700">Return Policy</span>
          </Link>
        </div>
      </div>

      {/* Premium Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 sm:py-16 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
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
                <li><Link to="/shop?category=skincare" className="hover:text-pink-500 transition">Skincare</Link></li>
                <li><Link to="/shop?category=makeup" className="hover:text-pink-500 transition">Makeup</Link></li>
                <li><Link to="/shop?category=clothing" className="hover:text-pink-500 transition">Clothing</Link></li>
                <li><Link to="/shop?category=accessories" className="hover:text-pink-500 transition">Accessories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-pink-500 transition">Contact Us</Link></li>
                <li><Link to="/faqs" className="hover:text-pink-500 transition">FAQs</Link></li>
                <li><a href="#" className="hover:text-pink-500 transition">Shipping Info</a></li>
                <li><Link to="/terms" className="hover:text-pink-500 transition">Terms of Service</Link></li>
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
  );
}

export default FAQs;
