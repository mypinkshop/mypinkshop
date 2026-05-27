import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Avatar from '../components/Avatar';

function VendorRegister() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    brandName: '',
    email: '',
    phone: '',
    gstNumber: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Generate and send OTP
  const sendOTP = async () => {
    if (!formData.email) {
      setError('Please enter email address');
      return false;
    }
    if (!formData.phone || formData.phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }

    setLoading(true);
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSentOtp(generatedOtp);

    console.log(`📧 Email OTP to ${formData.email}: ${generatedOtp}`);
    console.log(`📱 SMS OTP to ${formData.phone}: ${generatedOtp}`);
    
    alert(`✨ Your OTP is: ${generatedOtp}\n\n(OTP sent to ${formData.email} and ${formData.phone})`);

    setLoading(false);
    setResendTimer(30);
    return true;
  };

  // Verify OTP and complete registration
  const verifyOTP = async () => {
    if (otp !== sentOtp) {
      setError('Invalid OTP. Please try again.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.brandName.trim()) {
      setError('Please enter brand name');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        const existingVendors = JSON.parse(localStorage.getItem('registeredVendors') || '[]');
        
        // ✅ Check if vendor already exists (email duplicate)
        if (existingVendors.some(v => v.email === formData.email)) {
          setError('Vendor account already exists with this email. Please login.');
          setLoading(false);
          return;
        }
        
        // ✅ NO CUSTOMER CHECK - Same email se customer account already ho sakta hai
        
        const newVendor = {
          id: Date.now(),
          brandName: formData.brandName,
          name: formData.brandName,
          email: formData.email,
          phone: formData.phone,
          gstNumber: formData.gstNumber || '',
          address: formData.address || '',
          vendorStatus: 'pending',
          role: 'vendor',
          productsCount: 0,
          totalSales: 0,
          joinedDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          commission: 15,
          password: formData.password,
          emailVerified: true,
          phoneVerified: true,
        };
        
        existingVendors.push(newVendor);
        localStorage.setItem('registeredVendors', JSON.stringify(existingVendors));
        
        alert('✅ Registration successful! Please wait for admin approval. You will be notified via email once approved.');
        navigate('/vendor/login');
      } catch (err) {
        setError('Something went wrong. Please try again.');
        setLoading(false);
      }
      setLoading(false);
    }, 500);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    const sent = await sendOTP();
    if (sent) setStep(2);
  };

  const resendOTP = async () => {
    if (resendTimer > 0) return;
    await sendOTP();
  };

  if (user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      
      {/* Premium Top Bar */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white py-2.5 text-center text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex justify-center items-center gap-2 flex-wrap">
          <span>✨</span>
          <span>Sell with MyPinkShop</span>
          <span className="hidden sm:inline">•</span>
          <span>0% Commission for 3 months</span>
          <span className="hidden sm:inline">•</span>
          <span>Pan India Delivery</span>
          <span>✨</span>
        </div>
      </div>

      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
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
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-full focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-sm sm:text-base bg-gray-50"
                  onKeyPress={(e) => e.key === 'Enter' && navigate(`/shop?search=${e.target.value}`)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
              <Link to="/wishlist" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-purple-500 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{wishlistCount}</span>}
              </Link>
              
              <Link to="/cart" className="relative p-1.5 sm:p-2 text-gray-700 hover:text-purple-500 transition">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">{cartCount}</span>}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-500 hover:text-purple-500 transition">Home</Link>
          <span className="text-gray-400">/</span>
          <span className="text-purple-600 font-medium">Vendor Registration</span>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center py-12 sm:py-16 px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100 p-6 sm:p-8">
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg">
                🏪
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Become a Seller 🚀</h1>
              <p className="text-gray-500 text-sm mt-1">Join MyPinkShop marketplace and grow your business</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {step === 1 ? (
              // Step 1: Registration Form
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand / Store Name *</label>
                    <input 
                      type="text" 
                      name="brandName" 
                      value={formData.brandName} 
                      onChange={handleChange} 
                      placeholder="Enter your brand or store name"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition" 
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
                      placeholder="Enter your email"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500" 
                      required 
                    />
                    <p className="text-xs text-gray-400 mt-1">Note: Same email can be used for customer account separately</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange} 
                      placeholder="10-digit mobile number"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                    <input 
                      type="text" 
                      name="gstNumber" 
                      value={formData.gstNumber} 
                      onChange={handleChange} 
                      placeholder="Optional"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                    <textarea 
                      name="address" 
                      rows="2" 
                      value={formData.address} 
                      onChange={handleChange} 
                      placeholder="Your business address"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        placeholder="Min 6 characters"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 pr-10" 
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-500 transition"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'} 
                        name="confirmPassword" 
                        value={formData.confirmPassword} 
                        onChange={handleChange} 
                        placeholder="Re-enter password"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 pr-10" 
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-500 transition"
                      >
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-3 text-xs text-purple-700">
                  <p className="font-medium mb-1">✨ Benefits of selling with us:</p>
                  <ul className="space-y-1">
                    <li>• 0% commission for first 3 months</li>
                    <li>• Pan India shipping network</li>
                    <li>• Dedicated seller support</li>
                    <li>• Easy product listing</li>
                  </ul>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-2.5 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending OTP...
                    </span>
                  ) : (
                    'Continue with Verification →'
                  )}
                </button>
              </form>
            ) : (
              // Step 2: OTP Verification
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-md">
                    🔐
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Verify Your Identity</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    OTP sent to <span className="font-medium text-purple-600">{formData.email}</span> and <span className="font-medium text-purple-600">{formData.phone}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Enter OTP</label>
                  <input 
                    type="text" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} 
                    maxLength="6" 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200" 
                    placeholder="000000" 
                    autoFocus 
                  />
                </div>

                <button 
                  onClick={verifyOTP} 
                  disabled={loading || otp.length !== 6} 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-2.5 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registering...
                    </span>
                  ) : (
                    'Verify & Register'
                  )}
                </button>

                <div className="text-center">
                  <button 
                    onClick={resendOTP} 
                    disabled={resendTimer > 0} 
                    className={`text-sm transition ${
                      resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-purple-600 hover:underline'
                    }`}
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>

                <button 
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setError('');
                  }} 
                  className="w-full text-center text-gray-500 hover:text-purple-600 text-sm transition flex items-center justify-center gap-1 mt-2"
                >
                  <span>←</span> Back to registration
                </button>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Already have a seller account?{' '}
                <Link to="/vendor/login" className="text-purple-600 hover:underline font-medium">
                  Login
                </Link>
              </p>
              <p className="text-xs text-gray-400 mt-3">
                Want to shop as a customer?{' '}
                <Link to="/signup" className="text-pink-600 hover:underline">
                  Create Customer Account →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Premium Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6 text-xs mb-4">
            <Link to="/terms" className="hover:text-purple-500 transition">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-purple-500 transition">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-purple-500 transition">Contact Us</Link>
            <Link to="/faqs" className="hover:text-purple-500 transition">FAQs</Link>
          </div>
          <p className="text-center text-xs text-gray-500">© 2026 MyPinkShop. All rights reserved.</p>
          <p className="text-center text-xs text-gray-600 mt-2">Made with 💖 for the girlies</p>
        </div>
      </footer>
    </div>
  );
}

export default VendorRegister;
