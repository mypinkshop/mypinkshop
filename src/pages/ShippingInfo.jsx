import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

function ShippingInfo() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [activeTab, setActiveTab] = useState('domestic');

  const shippingZones = [
    { zone: 'Zone 1', cities: 'Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad, Pune', days: '2-3 days', charge: '₹40' },
    { zone: 'Zone 2', cities: 'Ahmedabad, Surat, Jaipur, Lucknow, Nagpur, Indore', days: '3-4 days', charge: '₹60' },
    { zone: 'Zone 3', cities: 'Other Metro Cities & Tier 1 Cities', days: '4-5 days', charge: '₹80' },
    { zone: 'Zone 4', cities: 'Rest of India (Tier 2 & 3 Cities)', days: '5-7 days', charge: '₹100' },
  ];

  const internationalShipping = [
    { country: 'USA', days: '7-10 days', charge: '₹1500', available: false },
    { country: 'UK', days: '7-10 days', charge: '₹1400', available: false },
    { country: 'UAE', days: '5-7 days', charge: '₹1200', available: false },
    { country: 'Singapore', days: '5-7 days', charge: '₹1000', available: false },
    { country: 'Canada', days: '8-12 days', charge: '₹1600', available: false },
    { country: 'Australia', days: '8-12 days', charge: '₹1700', available: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      
      {/* Premium Top Bar */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
          <span>✨</span>
          <span>Free Shipping on ₹999+</span>
          <span className="hidden sm:inline">•</span>
          <span>Express Delivery Available</span>
          <span className="hidden sm:inline">•</span>
          <span>Track Your Order</span>
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
          <span className="text-pink-600 font-medium">Shipping Information</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-100 via-rose-100 to-pink-100 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-4">🚚</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
            Shipping Information
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Fast, reliable delivery across India with real-time tracking
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Delivery Options Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-pink-100 shadow-sm hover:shadow-md transition">
            <div className="text-4xl mb-3">🚚</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Standard Delivery</h3>
            <p className="text-2xl font-bold text-pink-600 mb-1">₹40</p>
            <p className="text-sm text-gray-500">3-5 business days</p>
            <p className="text-xs text-gray-400 mt-3">Free on orders above ₹999</p>
          </div>
          
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-center text-white shadow-lg transform scale-105">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-lg font-bold mb-2">Express Delivery</h3>
            <p className="text-2xl font-bold mb-1">₹99</p>
            <p className="text-sm text-white/80">1-2 business days</p>
            <p className="text-xs text-white/60 mt-3">Priority processing</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-pink-100 shadow-sm hover:shadow-md transition">
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Free Shipping</h3>
            <p className="text-2xl font-bold text-green-600 mb-1">₹0</p>
            <p className="text-sm text-gray-500">On orders ₹999+</p>
            <p className="text-xs text-gray-400 mt-3">Standard delivery only</p>
          </div>
        </div>

        {/* Domestic/International Tabs */}
        <div className="mb-8">
          <div className="flex justify-center gap-4 border-b border-pink-200">
            <button
              onClick={() => setActiveTab('domestic')}
              className={`pb-3 px-6 text-sm font-medium transition-all ${
                activeTab === 'domestic'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-500 hover:text-pink-500'
              }`}
            >
              🇮🇳 Domestic Shipping
            </button>
            <button
              onClick={() => setActiveTab('international')}
              className={`pb-3 px-6 text-sm font-medium transition-all ${
                activeTab === 'international'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-500 hover:text-pink-500'
              }`}
            >
              🌍 International Shipping
            </button>
          </div>
        </div>

        {/* Domestic Shipping Content */}
        {activeTab === 'domestic' && (
          <>
            {/* Shipping Zones Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-6 py-4 border-b border-pink-100">
                <h2 className="text-lg font-semibold text-gray-800">Shipping Zones & Delivery Times</h2>
                <p className="text-sm text-gray-500 mt-0.5">Estimated delivery time based on your location</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left">Zone</th>
                      <th className="px-6 py-3 text-left">Cities / Regions</th>
                      <th className="px-6 py-3 text-left">Delivery Time</th>
                      <th className="px-6 py-3 text-left">Standard Charge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {shippingZones.map((zone, idx) => (
                      <tr key={idx} className="hover:bg-pink-50/30 transition">
                        <td className="px-6 py-3 font-medium text-gray-800">{zone.zone}</td>
                        <td className="px-6 py-3 text-gray-600">{zone.cities}</td>
                        <td className="px-6 py-3 text-gray-600">{zone.days}</td>
                        <td className="px-6 py-3 font-semibold text-pink-600">{zone.charge}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Processing Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-pink-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">⏰</span>
                  <h3 className="font-semibold text-gray-800">Order Processing Time</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">• Orders placed before 12 PM: Same day dispatch</li>
                  <li className="flex items-center gap-2">• Orders after 12 PM: Next day dispatch</li>
                  <li className="flex items-center gap-2">• Weekend orders: Dispatched on Monday</li>
                  <li className="flex items-center gap-2">• Processing takes 24-48 hours max</li>
                </ul>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-pink-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">📦</span>
                  <h3 className="font-semibold text-gray-800">Delivery Partners</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">• Blue Dart - Metro cities</li>
                  <li className="flex items-center gap-2">• Delhivery - Nationwide</li>
                  <li className="flex items-center gap-2">• DTDC - Tier 2 & 3 cities</li>
                  <li className="flex items-center gap-2">• India Post - Remote locations</li>
                </ul>
              </div>
            </div>

            {/* Shipping FAQs */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-pink-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>❓</span> Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Do you offer free shipping?</h4>
                  <p className="text-sm text-gray-600">Yes! Free standard shipping on all orders above ₹999. No coupon code needed.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Can I track my order?</h4>
                  <p className="text-sm text-gray-600">Absolutely! Once your order is shipped, you'll receive a tracking link via email and SMS. You can also track from "My Orders" section.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">What if I'm not home during delivery?</h4>
                  <p className="text-sm text-gray-600">Our delivery partners will attempt delivery twice. You can also reschedule delivery through the tracking link or contact our support team.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Do you ship to PO Box addresses?</h4>
                  <p className="text-sm text-gray-600">Currently, we don't ship to PO Box addresses. Please provide a valid street address for delivery.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* International Shipping Content */}
        {activeTab === 'international' && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌍</span>
                <div>
                  <h3 className="font-semibold text-amber-800 mb-1">Coming Soon!</h3>
                  <p className="text-sm text-amber-700">
                    We're working hard to bring MyPinkShop to international customers. International shipping will be available soon. 
                    Subscribe to our newsletter to get notified when we launch internationally!
                  </p>
                  <div className="mt-4 flex gap-3">
                    <input 
                      type="email" 
                      placeholder="Enter your email" 
                      className="px-4 py-2 border border-amber-300 rounded-lg bg-white text-sm"
                    />
                    <button className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition">
                      Notify Me
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* International Shipping Table Preview */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-6 py-4 border-b border-pink-100">
                <h2 className="text-lg font-semibold text-gray-800">International Destinations (Coming Soon)</h2>
                <p className="text-sm text-gray-500">Estimated rates for popular destinations</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left">Country</th>
                      <th className="px-6 py-3 text-left">Delivery Time</th>
                      <th className="px-6 py-3 text-left">Estimated Charge</th>
                      <th className="px-6 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {internationalShipping.map((country, idx) => (
                      <tr key={idx} className="hover:bg-pink-50/30 transition">
                        <td className="px-6 py-3 font-medium text-gray-800">{country.country}</td>
                        <td className="px-6 py-3 text-gray-600">{country.days}</td>
                        <td className="px-6 py-3 text-gray-600">{country.charge}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                            Coming Soon
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Need Help Section */}
        <div className="mt-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-center text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold mb-1">Need help with shipping?</h3>
              <p className="text-white/80 text-sm">Our support team is here to assist you</p>
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
                <li><Link to="/shipping" className="hover:text-pink-500 transition">Shipping Info</Link></li>
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

export default ShippingInfo;
