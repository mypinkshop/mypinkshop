import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function VendorRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    legalName: '',
    brandName: '',
    email: '',
    phone: '',
    gst: '',
    pan: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);

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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

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

    if (!formData.legalName?.trim()) {
      setError('Please enter legal business name');
      return;
    }

    if (!formData.brandName?.trim()) {
      setError('Please enter brand/store name');
      return;
    }

    if (!formData.agreeTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        const existingVendors = JSON.parse(localStorage.getItem('registeredVendors') || '[]');
        
        if (existingVendors.some(v => v.email === formData.email)) {
          setError('Vendor account already exists with this email. Please login.');
          setLoading(false);
          return;
        }
        
        const newVendor = {
          id: Date.now(),
          legalName: formData.legalName,
          brandName: formData.brandName,
          name: formData.brandName,
          email: formData.email,
          phone: formData.phone,
          gst: formData.gst || '',
          pan: formData.pan || '',
          address: formData.address || '',
          city: formData.city || '',
          state: formData.state || '',
          pincode: formData.pincode || '',
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
    
    if (currentStep === 1) {
      if (!formData.legalName || !formData.brandName || !formData.email || !formData.phone) {
        setError('Please fill all required fields');
        return;
      }
      setCurrentStep(2);
      window.scrollTo(0, 0);
    } else {
      setError('');
      const sent = await sendOTP();
      if (sent) setStep(2);
    }
  };

  const resendOTP = async () => {
    if (resendTimer > 0) return;
    await sendOTP();
  };

  const goToStep1 = () => {
    setCurrentStep(1);
    setError('');
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      
      {/* Amazon Style Top Bar */}
      <div className="bg-gradient-to-r from-[#FF6B6B] via-[#FF8E8E] to-[#FF6B6B] text-white py-2 text-center text-xs sm:text-sm">
        <div className="container mx-auto px-4">
          ✨ India's Fastest Growing Beauty Marketplace | 1 Million+ Happy Customers ✨
        </div>
      </div>

      {/* Amazon Style Header */}
      <div className="bg-white border-b border-gray-200 py-3 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-xl font-bold text-gray-800">MyPinkShop</span>
            </Link>
            <div className="flex gap-6 text-sm text-gray-600">
              <span>Sell with Us</span>
              <span>Partner Program</span>
              <span>Success Stories</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Become a Seller</h1>
          <p className="text-gray-500 text-sm mt-2">Join India's largest beauty & fashion marketplace</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8 max-w-md mx-auto">
          <div className="text-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-all ${currentStep >= 1 ? 'bg-[#FF6B6B] text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>
              1
            </div>
            <p className="text-xs text-gray-600">Business Info</p>
          </div>
          <div className="text-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-all ${currentStep >= 2 ? 'bg-[#FF6B6B] text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>
              2
            </div>
            <p className="text-xs text-gray-600">Verify Contact</p>
          </div>
          <div className="text-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-all ${step === 2 ? 'bg-[#FF6B6B] text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>
              3
            </div>
            <p className="text-xs text-gray-600">Set Password</p>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          
          {/* Step 1: Business Information */}
          {currentStep === 1 && step === 1 && (
            <div className="p-6 sm:p-8">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Business Information</h2>
                <p className="text-xs text-gray-400 mt-1">Tell us about your business</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-5 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendOTP} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Legal Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="legalName"
                      value={formData.legalName}
                      onChange={handleChange}
                      placeholder="As per GST certificate"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] focus:ring-1 focus:ring-[#FF6B6B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand / Store Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleChange}
                      placeholder="Your brand/store name"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] focus:ring-1 focus:ring-[#FF6B6B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="business@example.com"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B]"
                    />
                    <p className="text-xs text-gray-400 mt-1">Same email can be used for customer account</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Number (Optional)</label>
                    <input
                      type="text"
                      name="gst"
                      value={formData.gst}
                      onChange={handleChange}
                      placeholder="22AAAAA0000A1Z"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number (Optional)</label>
                    <input
                      type="text"
                      name="pan"
                      value={formData.pan}
                      onChange={handleChange}
                      placeholder="ABCDE1234F"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                  <textarea
                    name="address"
                    rows="2"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street address"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="Pincode"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white font-medium py-3 rounded-lg hover:shadow-lg transition-all mt-4"
                >
                  Continue →
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Contact Verification & Password */}
          {currentStep === 2 && (
            <div className="p-6 sm:p-8">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Verify & Set Password</h2>
                <p className="text-xs text-gray-400 mt-1">Verify your contact details and set a password</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-5 text-sm">
                  {error}
                </div>
              )}

              {step === 1 ? (
                <div className="space-y-5">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">We will send OTP to:</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">📧 {formData.email}</span>
                      <span className="text-gray-400">|</span>
                      <span className="font-medium">📱 {formData.phone}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white font-medium py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? 'Sending OTP...' : 'Send Verification OTP →'}
                  </button>

                  <button
                    onClick={goToStep1}
                    className="w-full text-center text-gray-500 hover:text-[#FF6B6B] text-sm transition"
                  >
                    ← Back to Business Info
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      maxLength="6"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-[#FF6B6B] focus:ring-1 focus:ring-[#FF6B6B]"
                      placeholder="000000"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Min 6 characters"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
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
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showConfirmPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className="mt-0.5"
                    />
                    <span className="text-xs text-gray-600">
                      I agree to the <Link to="/terms" className="text-[#FF6B6B] hover:underline">Terms of Service</Link>, 
                      {' '}<Link to="/privacy" className="text-[#FF6B6B] hover:underline">Privacy Policy</Link>, 
                      and <Link to="/shipping" className="text-[#FF6B6B] hover:underline">Seller Agreement</Link>
                    </span>
                  </label>

                  <button
                    onClick={verifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white font-medium py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? 'Registering...' : 'Complete Registration →'}
                  </button>

                  <div className="text-center">
                    <button
                      onClick={resendOTP}
                      disabled={resendTimer > 0}
                      className={`text-sm transition ${resendTimer > 0 ? 'text-gray-400' : 'text-[#FF6B6B] hover:underline'}`}
                    >
                      {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setStep(1);
                      setOtp('');
                    }}
                    className="w-full text-center text-gray-500 hover:text-[#FF6B6B] text-sm transition"
                  >
                    ← Back
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-lg p-4 text-center border border-gray-100">
            <div className="text-2xl mb-2">💰</div>
            <h3 className="font-semibold text-gray-800 text-sm">0% Commission</h3>
            <p className="text-xs text-gray-500">For first 3 months</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-gray-100">
            <div className="text-2xl mb-2">🚚</div>
            <h3 className="font-semibold text-gray-800 text-sm">Pan India Shipping</h3>
            <p className="text-xs text-gray-500">Easy logistics support</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-gray-100">
            <div className="text-2xl mb-2">📈</div>
            <h3 className="font-semibold text-gray-800 text-sm">1M+ Customers</h3>
            <p className="text-xs text-gray-500">Access to our audience</p>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Already registered?{' '}
            <Link to="/vendor/login" className="text-[#FF6B6B] hover:underline font-medium">
              Sign in to your seller account
            </Link>
          </p>
        </div>

        {/* Help Section */}
        <div className="bg-gray-50 rounded-lg p-4 mt-6 text-center">
          <p className="text-xs text-gray-500">
            Need help? Call us at <span className="font-medium text-gray-700">1800-123-4567</span> or email{' '}
            <a href="mailto:seller@mypinkshop.com" className="text-[#FF6B6B] hover:underline">seller@mypinkshop.com</a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-400 py-6 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs">© 2026 MyPinkShop. All rights reserved.</p>
          <p className="text-xs text-gray-600 mt-1">Made with 💖 for the girlies</p>
        </div>
      </div>
    </div>
  );
}

export default VendorRegister;
