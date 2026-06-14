import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';
import OfferBanner from '../components/OfferBanner';

function ReturnsPolicy() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [activeTab, setActiveTab] = useState('returns');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const returnSteps = [
    { step: 1, title: 'Initiate Return', description: 'Go to "My Orders" section, select the order, and click "Return Item". Fill in the reason for return.', icon: '📱', color: 'from-pink-500 to-rose-500' },
    { step: 2, title: 'Pickup Arranged', description: 'Our delivery partner will schedule a pickup within 2-3 business days from your address.', icon: '🚚', color: 'from-blue-500 to-cyan-500' },
    { step: 3, title: 'Quality Check', description: 'Product is inspected at our facility to ensure it meets return policy criteria.', icon: '🔍', color: 'from-purple-500 to-violet-500' },
    { step: 4, title: 'Refund Processed', description: 'Refund is initiated within 5-7 business days after successful inspection.', icon: '💰', color: 'from-green-500 to-emerald-500' },
  ];

  const returnConditions = [
    { condition: '7-Day Return Window', detail: 'Items must be returned within 7 days of delivery date.', icon: '📅', eligible: true },
    { condition: 'Unused Condition', detail: 'Products must be unused, unwashed, and in original packaging with all tags attached.', icon: '✨', eligible: true },
    { condition: 'Original Packaging', detail: 'Return must include original box, invoice, and any freebies/gifts received.', icon: '📦', eligible: true },
    { condition: 'Damaged Products', detail: 'Must be reported within 24 hours of delivery with photo/video evidence.', icon: '⚠️', eligible: true },
    { condition: 'Customized Products', detail: 'Personalized/customized items cannot be returned.', icon: '🎨', eligible: false },
    { condition: 'Clearance Items', detail: 'Items purchased on clearance/end-of-season sale are final sale.', icon: '🏷️', eligible: false },
  ];

  const nonReturnableItems = [
    { category: 'Underwear & Lingerie', reason: 'Hygiene reasons', icon: '🩲' },
    { category: 'Jewelry & Earrings', reason: 'Hygiene reasons', icon: '💍' },
    { category: 'Opened Beauty Products', reason: 'Hygiene & safety', icon: '💄' },
    { category: 'Perfumes & Mists', reason: 'Safety regulations', icon: '🌸' },
    { category: 'Face Masks', reason: 'Hygiene reasons', icon: '😷' },
    { category: 'Gift Cards', reason: 'Non-refundable', icon: '🎁' },
  ];

  const refundTimeline = [
    { method: 'Credit/Debit Card', time: '5-7 business days', icon: '💳', note: 'After quality check' },
    { method: 'UPI', time: '3-5 business days', icon: '📱', note: 'After quality check' },
    { method: 'Net Banking', time: '5-7 business days', icon: '🏦', note: 'After quality check' },
    { method: 'Cash on Delivery', time: '7-10 business days', icon: '💵', note: 'Bank transfer required' },
    { method: 'Store Credit', time: 'Immediately', icon: '🎫', note: 'Instant credit to wallet' },
  ];

  // SEO Schema
  const generateBreadcrumbSchema = () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.mypinkshop.com" },
      { "@type": "ListItem", "position": 2, "name": "Returns Policy", "item": "https://www.mypinkshop.com/returns" }
    ]
  });

  const generateOrganizationSchema = () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MyPinkShop",
    "url": "https://www.mypinkshop.com",
    "logo": "https://www.mypinkshop.com/logo.png"
  });

  return (
    <>
      <Helmet>
        <title>Returns & Refunds Policy - MyPinkShop | Easy 7-Day Returns</title>
        <meta name="description" content="MyPinkShop offers easy 7-day returns and 100% refund guarantee. Learn about our return policy, conditions, and refund timeline. Shop with confidence!" />
        <meta name="keywords" content="return policy, refund policy, returns, refunds, mypinkshop returns, easy returns, 7 day return" />
        <link rel="canonical" href="https://www.mypinkshop.com/returns" />
        <meta property="og:title" content="Returns & Refunds Policy - MyPinkShop" />
        <meta property="og:description" content="Easy 7-day returns and 100% refund guarantee. Shop with confidence at MyPinkShop." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mypinkshop.com/returns" />
        <meta property="og:image" content="https://www.mypinkshop.com/og-returns.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Returns & Refunds Policy - MyPinkShop" />
        <meta name="twitter:description" content="Easy 7-day returns and 100% refund guarantee." />
        <meta name="twitter:image" content="https://www.mypinkshop.com/og-returns.jpg" />
        <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema())}</script>
        <script type="application/ld+json">{JSON.stringify(generateOrganizationSchema())}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        
        {/* Dynamic Offer Banner */}
        <OfferBanner />

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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm sm:text-base bg-gray-50"
                  />
                  <button 
                    onClick={handleSearch}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 sm:px-6 py-1.5 sm:py-1.5 rounded-full text-sm font-medium hover:shadow-lg transition-all"
                  >
                    <span className="hidden sm:inline">Search</span>
                    <span className="sm:hidden">🔍</span>
                  </button>
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
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">Returns Policy</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-pink-100 via-rose-100 to-pink-100 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-6xl mb-4">🔄</div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              Returns & Refunds Policy
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Easy returns, 100% refund guarantee. Shop with confidence!
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Policy Highlights Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-pink-100 shadow-sm hover:shadow-md transition">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-xl font-bold text-pink-600">7 Days</div>
              <p className="text-xs text-gray-500">Return Window</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-pink-100 shadow-sm hover:shadow-md transition">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-xl font-bold text-pink-600">100%</div>
              <p className="text-xs text-gray-500">Money Back</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-pink-100 shadow-sm hover:shadow-md transition">
              <div className="text-3xl mb-2">🚚</div>
              <div className="text-xl font-bold text-pink-600">Free</div>
              <p className="text-xs text-gray-500">Pickup Available</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-pink-100 shadow-sm hover:shadow-md transition">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-xl font-bold text-pink-600">Instant</div>
              <p className="text-xs text-gray-500">Store Credit</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 border-b border-pink-200">
              <button
                onClick={() => setActiveTab('returns')}
                className={`pb-3 px-4 sm:px-6 text-sm font-medium transition-all ${
                  activeTab === 'returns'
                    ? 'text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-500 hover:text-pink-500'
                }`}
              >
                📋 Return Process
              </button>
              <button
                onClick={() => setActiveTab('conditions')}
                className={`pb-3 px-4 sm:px-6 text-sm font-medium transition-all ${
                  activeTab === 'conditions'
                    ? 'text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-500 hover:text-pink-500'
                }`}
              >
                ✓ Return Conditions
              </button>
              <button
                onClick={() => setActiveTab('refund')}
                className={`pb-3 px-4 sm:px-6 text-sm font-medium transition-all ${
                  activeTab === 'refund'
                    ? 'text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-500 hover:text-pink-500'
                }`}
              >
                💰 Refund Timeline
              </button>
            </div>
          </div>

          {/* Return Process Tab */}
          {activeTab === 'returns' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {returnSteps.map((step) => (
                  <div key={step.step} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-pink-100 hover:shadow-md transition">
                    <div className={`w-16 h-16 mx-auto bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center text-2xl mb-4 shadow-md`}>
                      {step.icon}
                    </div>
                    <div className="text-sm text-pink-500 font-semibold mb-1">Step {step.step}</div>
                    <h3 className="font-bold text-gray-800 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-100 mb-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="text-6xl">📝</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">How to Initiate a Return?</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>1️⃣ Go to <Link to="/my-orders" className="text-pink-500 hover:underline">My Orders</Link> section</li>
                      <li>2️⃣ Select the order you want to return</li>
                      <li>3️⃣ Click on "Return Item" button</li>
                      <li>4️⃣ Select reason for return and upload images (if damaged)</li>
                      <li>5️⃣ Confirm return request</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Return Conditions Tab */}
          {activeTab === 'conditions' && (
            <>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-6 py-4 border-b border-pink-100">
                  <h2 className="text-lg font-semibold text-gray-800">Return Eligibility Criteria</h2>
                  <p className="text-sm text-gray-500">Check if your item qualifies for return</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left">Condition</th>
                        <th className="px-4 sm:px-6 py-3 text-left">Details</th>
                        <th className="px-4 sm:px-6 py-3 text-center">Eligible</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {returnConditions.map((item, idx) => (
                        <tr key={idx} className="hover:bg-pink-50/30 transition">
                          <td className="px-4 sm:px-6 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{item.icon}</span>
                              <span className="font-medium text-gray-800 text-sm">{item.condition}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-gray-600 text-sm">{item.detail}</td>
                          <td className="px-4 sm:px-6 py-3 text-center">
                            {item.eligible ? (
                              <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
                                ✓ Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs">
                                ✗ No
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-pink-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🚫</span> Non-Returnable Items
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {nonReturnableItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{item.category}</p>
                        <p className="text-xs text-gray-500">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4 text-center">
                  *These items cannot be returned due to hygiene and safety reasons
                </p>
              </div>
            </>
          )}

          {/* Refund Timeline Tab */}
          {activeTab === 'refund' && (
            <>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-6 py-4 border-b border-pink-100">
                  <h2 className="text-lg font-semibold text-gray-800">Refund Processing Time</h2>
                  <p className="text-sm text-gray-500">Based on your original payment method</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left">Payment Method</th>
                        <th className="px-4 sm:px-6 py-3 text-left">Refund Time</th>
                        <th className="px-4 sm:px-6 py-3 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {refundTimeline.map((method, idx) => (
                        <tr key={idx} className="hover:bg-pink-50/30 transition">
                          <td className="px-4 sm:px-6 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{method.icon}</span>
                              <span className="font-medium text-gray-800 text-sm">{method.method}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <span className="text-green-600 font-medium text-sm">{method.time}</span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-gray-500 text-xs">{method.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-1">Important Notes</h3>
                    <ul className="space-y-1 text-sm text-amber-700">
                      <li>• Refunds are initiated only after quality check is complete</li>
                      <li>• Shipping charges (if any) are non-refundable</li>
                      <li>• Cash on Delivery refunds are processed via bank transfer or store credit</li>
                      <li>• Store credit can be used immediately for new purchases</li>
                      <li>• Contact support if refund takes longer than mentioned timeline</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Damaged Product Section */}
          <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="text-4xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Received a Damaged Product?</h3>
                <p className="text-sm text-red-700 mb-3">
                  Don't worry! We've got you covered. Report damaged products within 24 hours of delivery.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/contact"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                  >
                    Report Now →
                  </Link>
                  <button className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition">
                    View Guidelines
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Need Help Section */}
          <div className="mt-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-center text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold mb-1">Still have questions?</h3>
                <p className="text-white/80 text-sm">Our support team is here to help you</p>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/contact"
                  className="px-5 py-2 bg-white text-pink-600 rounded-xl font-medium hover:shadow-lg transition"
                >
                  Contact Support
                </Link>
                <Link
                  to="/faqs"
                  className="px-5 py-2 bg-white/20 border border-white/30 rounded-xl font-medium hover:bg-white/30 transition"
                >
                  View FAQs
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
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

export default ReturnsPolicy;
