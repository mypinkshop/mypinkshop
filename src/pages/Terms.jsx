import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import OfferBanner from '../components/OfferBanner';

function Terms() {
  // SEO Schema
  const generateBreadcrumbSchema = () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.mypinkshop.com" },
      { "@type": "ListItem", "position": 2, "name": "Terms of Service", "item": "https://www.mypinkshop.com/terms" }
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
        <title>Terms of Service - MyPinkShop | User Agreement & Policies</title>
        <meta name="description" content="Read MyPinkShop's Terms of Service. Learn about account registration, ordering, payments, shipping, returns, and user conduct. Know your rights and obligations." />
        <meta name="keywords" content="terms of service, terms and conditions, user agreement, mypinkshop terms, legal policy" />
        <link rel="canonical" href="https://www.mypinkshop.com/terms" />
        <meta property="og:title" content="Terms of Service - MyPinkShop" />
        <meta property="og:description" content="Read our Terms of Service to understand your rights and obligations when using MyPinkShop." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mypinkshop.com/terms" />
        <meta property="og:image" content="https://www.mypinkshop.com/og-terms.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Terms of Service - MyPinkShop" />
        <meta name="twitter:description" content="Read our Terms of Service." />
        <meta name="twitter:image" content="https://www.mypinkshop.com/og-terms.jpg" />
        <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema())}</script>
        <script type="application/ld+json">{JSON.stringify(generateOrganizationSchema())}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        
        {/* Dynamic Offer Banner */}
        <OfferBanner />

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
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        window.location.href = `/shop?search=${e.target.value}`;
                      }
                    }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg cursor-pointer">🔍</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
                <Link to="/wishlist" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </Link>
                
                <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </Link>
                
                <Link to="/login" className="p-1.5 sm:p-2 text-gray-700 hover:text-pink-500 transition">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-pink-600 font-medium">Terms of Service</span>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-6 sm:p-8 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Terms of Service</h1>
            <p className="text-gray-500 text-sm mb-6">Last updated: January 2026</p>

            <div className="space-y-6 text-gray-600">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">1. Introduction</h2>
                <p>Welcome to MyPinkShop. By accessing or using our website, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">2. Account Registration</h2>
                <p>To make a purchase, you must register an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">3. Products and Pricing</h2>
                <p>All product descriptions, images, and prices are subject to change without notice. We reserve the right to modify or discontinue any product at any time.</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">4. Orders and Payments</h2>
                <p>All orders are subject to acceptance and availability. We accept various payment methods including credit/debit cards, UPI, and Cash on Delivery.</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">5. Shipping and Delivery</h2>
                <p>We strive to deliver within 3-7 business days. Shipping times may vary based on location. Free shipping on orders above ₹999.</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">6. Returns and Refunds</h2>
                <p>We accept returns within 7 days of delivery for unused products in original packaging. Refunds will be processed within 5-7 business days.</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">7. User Conduct</h2>
                <p>You agree not to misuse our website, upload malicious content, or attempt to gain unauthorized access to our systems.</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">8. Intellectual Property</h2>
                <p>All content on this site including logos, images, and text is the property of MyPinkShop and is protected by copyright laws.</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">9. Limitation of Liability</h2>
                <p>MyPinkShop shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">10. Changes to Terms</h2>
                <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on this page.</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">11. Governing Law</h2>
                <p>These terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">12. Contact Us</h2>
                <p>If you have any questions about these Terms, please contact us at: <a href="mailto:support@mypinkshop.com" className="text-pink-600 hover:underline">support@mypinkshop.com</a></p>
              </div>
            </div>

            {/* Acceptance Note */}
            <div className="mt-8 pt-6 border-t border-pink-100">
              <p className="text-xs text-gray-400">
                By using MyPinkShop, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-8 sm:py-12 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <h3 className="font-bold text-white text-base sm:text-lg">MyPinkShop</h3>
                </div>
                <p className="text-xs sm:text-sm">Luxury beauty and fashion for the modern woman.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Shop</h4>
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li><Link to="/skincare" className="hover:text-pink-500 transition">Skincare</Link></li>
                  <li><Link to="/makeup" className="hover:text-pink-500 transition">Makeup</Link></li>
                  <li><Link to="/hair" className="hover:text-pink-500 transition">Hair</Link></li>
                  <li><Link to="/clothing" className="hover:text-pink-500 transition">Clothing</Link></li>
                  <li><Link to="/accessories" className="hover:text-pink-500 transition">Accessories</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Support</h4>
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li><Link to="/contact" className="hover:text-pink-500 transition">Contact Us</Link></li>
                  <li><Link to="/faqs" className="hover:text-pink-500 transition">FAQs</Link></li>
                  <li><Link to="/shipping" className="hover:text-pink-500 transition">Shipping Info</Link></li>
                  <li><Link to="/returns" className="hover:text-pink-500 transition">Returns Policy</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Follow Us</h4>
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li><a href="#" className="hover:text-pink-500 transition">Instagram</a></li>
                  <li><a href="#" className="hover:text-pink-500 transition">TikTok</a></li>
                  <li><a href="#" className="hover:text-pink-500 transition">Pinterest</a></li>
                  <li><a href="#" className="hover:text-pink-500 transition">YouTube</a></li>
                </ul>
              </div>
            </div>
            <div className="text-center pt-6 sm:pt-8 border-t border-gray-800">
              <p className="text-xs sm:text-sm">© 2026 MyPinkShop. All rights reserved.</p>
              <p className="text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default Terms;
