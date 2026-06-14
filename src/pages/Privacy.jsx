import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import OfferBanner from '../components/OfferBanner';

function Privacy() {
  // SEO Schema
  const generateBreadcrumbSchema = () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.mypinkshop.com" },
      { "@type": "ListItem", "position": 2, "name": "Privacy Policy", "item": "https://www.mypinkshop.com/privacy" }
    ]
  });

  const generateOrganizationSchema = () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MyPinkShop",
    "url": "https://www.mypinkshop.com",
    "logo": "https://www.mypinkshop.com/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "privacy@mypinkshop.com",
      "contactType": "privacy"
    }
  });

  return (
    <>
      <Helmet>
        <title>Privacy Policy - MyPinkShop | Your Data Security Matters</title>
        <meta name="description" content="Read MyPinkShop's privacy policy to understand how we collect, use, and protect your personal information. Your privacy and data security are our top priority." />
        <meta name="keywords" content="privacy policy, data protection, privacy, mypinkshop privacy, data security" />
        <link rel="canonical" href="https://www.mypinkshop.com/privacy" />
        <meta property="og:title" content="Privacy Policy - MyPinkShop" />
        <meta property="og:description" content="Learn how MyPinkShop protects your personal information and respects your privacy." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mypinkshop.com/privacy" />
        <meta property="og:image" content="https://www.mypinkshop.com/og-privacy.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Privacy Policy - MyPinkShop" />
        <meta name="twitter:description" content="Your privacy matters. Read our privacy policy." />
        <meta name="twitter:image" content="https://www.mypinkshop.com/og-privacy.jpg" />
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
            <span className="text-pink-600 font-medium">Privacy Policy</span>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-6 sm:p-8 shadow-sm">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Privacy Policy</h1>
            <p className="text-gray-500 text-sm mb-6">Last updated: January 2026</p>

            <div className="space-y-6 text-gray-600">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Information We Collect</h2>
                <p>We collect personal information including name, email address, phone number, shipping address, and payment information when you create an account or place an order.</p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">How We Use Your Information</h2>
                <p>We use your information to process orders, provide customer support, improve our services, send order updates, and personalize your shopping experience.</p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Data Protection</h2>
                <p>We implement security measures to protect your personal information. Your payment details are encrypted and processed securely through trusted payment gateways.</p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Cookies</h2>
                <p>We use cookies to enhance your browsing experience, remember your preferences, and analyze site traffic. You can disable cookies in your browser settings.</p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Third-Party Sharing</h2>
                <p>We do not sell your personal information. We may share data with shipping partners, payment processors, and service providers necessary to fulfill your orders.</p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Your Rights</h2>
                <p>You have the right to access, update, or delete your personal information. You can do this through your account settings or by contacting our support team.</p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Children's Privacy</h2>
                <p>Our service is not intended for users under 13 years of age. We do not knowingly collect personal information from children.</p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Changes to This Policy</h2>
                <p>We may update this privacy policy from time to time. Changes will be posted on this page with an updated revision date.</p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Contact Us</h2>
                <p>If you have questions about this Privacy Policy, please contact us at: <a href="mailto:info@mypinkshop.com" className="text-pink-600 hover:underline">privacy@mypinkshop.com</a></p>
              </div>
            </div>

            {/* Last Updated Note */}
            <div className="mt-8 pt-6 border-t border-pink-100">
              <p className="text-xs text-gray-400">
                By using MyPinkShop, you agree to the terms outlined in this Privacy Policy.
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

export default Privacy;
