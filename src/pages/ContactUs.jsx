import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

function ContactUs() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    orderId: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeCategory, setActiveCategory] = useState('general');

  const categories = [
    { id: 'general', name: 'General Inquiry', icon: '💬', color: 'from-pink-500 to-rose-500' },
    { id: 'order', name: 'Order Related', icon: '📦', color: 'from-blue-500 to-cyan-500' },
    { id: 'returns', name: 'Returns & Refunds', icon: '🔄', color: 'from-green-500 to-emerald-500' },
    { id: 'product', name: 'Product Info', icon: '✨', color: 'from-purple-500 to-violet-500' },
    { id: 'vendor', name: 'Vendor Inquiry', icon: '🏪', color: 'from-orange-500 to-amber-500' },
  ];

  const faqs = [
    {
      question: 'How long does shipping take?',
      answer: 'Standard delivery takes 3-5 business days. Express delivery (₹99) takes 1-2 business days. Free shipping on orders above ₹999.',
    },
    {
      question: 'What is your return policy?',
      answer: 'We accept returns within 7 days of delivery for unused products in original packaging. Refunds are processed within 5-7 business days.',
    },
    {
      question: 'How can I track my order?',
      answer: 'You can track your order from "My Orders" section in your account. A tracking link is also sent to your email once the order is shipped.',
    },
    {
      question: 'Do you offer cash on delivery?',
      answer: 'Yes, COD is available on all orders. Please keep exact change ready for the delivery agent.',
    },
    {
      question: 'How do I cancel my order?',
      answer: 'You can cancel your order from "My Orders" page before it is shipped. Cancellation is free and refund is processed immediately.',
    },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Auto-fill user data if logged in
    if (user) {
      formData.name = user.name || '';
      formData.email = user.email || '';
    }

    // Save to localStorage
    const contactMessages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    const newMessage = {
      id: Date.now(),
      ...formData,
      category: activeCategory,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    contactMessages.unshift(newMessage);
    localStorage.setItem('contactMessages', JSON.stringify(contactMessages));

    // Simulate email sending
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', email: '', subject: '', message: '', orderId: '' });
        setActiveCategory('general');
      }, 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      
      {/* Premium Top Bar */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
          <span>✨</span>
          <span>We're Here to Help 24/7</span>
          <span className="hidden sm:inline">•</span>
          <span>support@mypinkshop.com</span>
          <span className="hidden sm:inline">•</span>
          <span>+91 1800-123-4567</span>
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
          <span className="text-pink-600 font-medium">Contact Us</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-100 via-rose-100 to-pink-100 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
            We'd Love to Hear From You 💖
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Have questions, feedback, or need assistance? Our team is here to help you 24/7.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Contact Info */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-pink-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📞</span> Contact Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="font-medium text-gray-800">Address</p>
                    <p className="text-sm text-gray-500">123, Glamour Street, Andheri West, Mumbai - 400053, India</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📧</span>
                  <div>
                    <p className="font-medium text-gray-800">Email</p>
                    <p className="text-sm text-gray-500">support@mypinkshop.com</p>
                    <p className="text-sm text-gray-500">careers@mypinkshop.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📞</span>
                  <div>
                    <p className="font-medium text-gray-800">Phone</p>
                    <p className="text-sm text-gray-500">+91 1800-123-4567 (Toll Free)</p>
                    <p className="text-sm text-gray-500">+91 22-1234-5678</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <p className="font-medium text-gray-800">Business Hours</p>
                    <p className="text-sm text-gray-500">Monday - Saturday: 10 AM - 7 PM</p>
                    <p className="text-sm text-gray-500">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-pink-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>💝</span> Follow Us
              </h2>
              <div className="flex gap-4">
                <a href="#" className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-2xl hover:bg-pink-200 transition transform hover:scale-110">📷</a>
                <a href="#" className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-2xl hover:bg-pink-200 transition transform hover:scale-110">🎵</a>
                <a href="#" className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-2xl hover:bg-pink-200 transition transform hover:scale-110">📘</a>
                <a href="#" className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-2xl hover:bg-pink-200 transition transform hover:scale-110">🐦</a>
                <a href="#" className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-2xl hover:bg-pink-200 transition transform hover:scale-110">📌</a>
              </div>
            </div>
          </div>

          {/* Middle Column - Contact Form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-pink-100 shadow-sm">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">✓</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Message Sent! 🎉</h2>
                <p className="text-gray-500 mb-4">Thank you for reaching out to us. We'll get back to you within 24 hours.</p>
                <p className="text-sm text-gray-400">A confirmation email has been sent to your inbox.</p>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-pink-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>✉️</span> Send us a Message
                </h2>
                
                {/* Category Selector */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        activeCategory === cat.id
                          ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">{cat.icon}</span> {cat.name}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  {(activeCategory === 'order' || activeCategory === 'returns') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Order ID (if applicable)</label>
                      <input
                        type="text"
                        name="orderId"
                        value={formData.orderId}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500"
                        placeholder="e.g., MPS12345678"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 transition"
                      placeholder="Brief subject line"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="5"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 transition resize-none"
                      placeholder="Describe your query in detail..."
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </span>
                    ) : (
                      'Send Message →'
                    )}
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    By submitting, you agree to our Privacy Policy. We'll never share your information.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* FAQs Section */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Frequently Asked Questions</h2>
            <p className="text-gray-500">Quick answers to common questions</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-pink-100 shadow-sm hover:shadow-md transition">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-start gap-2">
                  <span className="text-pink-500">💬</span> {faq.question}
                </h3>
                <p className="text-sm text-gray-600 ml-6">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Chat CTA */}
        <div className="mt-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-center text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-1">Need immediate assistance?</h3>
              <p className="text-white/80 text-sm">Chat with our support team for quick help</p>
            </div>
            <button className="px-6 py-2.5 bg-white text-pink-600 rounded-xl font-semibold hover:shadow-lg transition transform hover:-translate-y-0.5">
              💬 Start Live Chat
            </button>
          </div>
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
                <li><a href="#" className="hover:text-pink-500 transition">FAQs</a></li>
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

export default ContactUs;
