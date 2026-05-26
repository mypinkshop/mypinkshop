import { Link } from 'react-router-dom';

function Terms() {
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
              <h2 className="text-lg font-semibold text-gray-800 mb-2">10. Contact Us</h2>
              <p>If you have any questions about these Terms, please contact us at: support@mypinkshop.com</p>
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

export default Terms;
