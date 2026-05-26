import { Link } from 'react-router-dom';

function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Premium Top Bar */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
          <span>✨</span>
          <span>Free Shipping on ₹999+</span>
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
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-lg sm:text-xl">M</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">MyPinkShop</h1>
              <p className="text-[9px] sm:text-[10px] text-gray-400 tracking-wider">FOR THE GIRLIES ✨</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-500 hover:text-pink-500 transition">Home</Link>
          <span className="text-gray-400">/</span>
          <span className="text-pink-600 font-medium">Privacy Policy</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-6 sm:p-8 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-sm mb-6">Last updated: January 2026</p>

          <div className="space-y-6 text-gray-600">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Information We Collect</h2>
              <p>We collect personal information including name, email address, phone number, shipping address, and payment information when you create an account or place an order.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">How We Use Your Information</h2>
              <p>We use your information to process orders, provide customer support, improve our services, send order updates, and personalize your shopping experience.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Data Protection</h2>
              <p>We implement security measures to protect your personal information. Your payment details are encrypted and processed securely through trusted payment gateways.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Cookies</h2>
              <p>We use cookies to enhance your browsing experience, remember your preferences, and analyze site traffic. You can disable cookies in your browser settings.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Third-Party Sharing</h2>
              <p>We do not sell your personal information. We may share data with shipping partners, payment processors, and service providers necessary to fulfill your orders.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Your Rights</h2>
              <p>You have the right to access, update, or delete your personal information. You can do this through your account settings or by contacting our support team.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Children's Privacy</h2>
              <p>Our service is not intended for users under 13 years of age. We do not knowingly collect personal information from children.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Changes to This Policy</h2>
              <p>We may update this privacy policy from time to time. Changes will be posted on this page with an updated revision date.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us at: privacy@mypinkshop.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">© 2026 MyPinkShop. All rights reserved.</p>
          <p className="text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
        </div>
      </footer>
    </div>
  );
}

export default Privacy;
