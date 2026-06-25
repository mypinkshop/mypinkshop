import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

function VendorRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [currentStep, setCurrentStep] = useState(1);
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSessionId, setOtpSessionId] = useState('');

  const API_URL = 'https://api.mypinkshop.com';

  // Resend timer
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

  // ✅ Send OTP via Backend
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
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          name: formData.legalName || formData.brandName,
          type: 'vendor'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('OTP sent successfully! 📧');
        setOtpSessionId(data.sessionId || '');
        setResendTimer(30);
        setStep(2);
        return true;
      } else {
        setError(data.error || data.message || 'Failed to send OTP');
        toast.error('Failed to send OTP');
        return false;
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setError('Network error. Please check your connection.');
      toast.error('Network error. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Verify OTP & Register Vendor
  const verifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    // Validate password
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
    setError('');

    try {
      // ✅ Step 1: Verify OTP
      const otpResponse = await fetch(`${API_URL}/api/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: otp,
          sessionId: otpSessionId
        })
      });

      const otpData = await otpResponse.json();

      if (!otpResponse.ok || !otpData.success) {
        setError(otpData.error || 'Invalid OTP. Please try again.');
        setLoading(false);
        return;
      }

      // ✅ Step 2: Register Vendor
      const vendorData = {
        name: formData.legalName,
        brandName: formData.brandName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        gstNumber: formData.gst || '',
        panNumber: formData.pan || '',
        address: {
          street: formData.address || '',
          city: formData.city || '',
          state: formData.state || '',
          pincode: formData.pincode || '',
          country: 'India'
        }
      };

      const registerResponse = await fetch(`${API_URL}/api/vendor/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorData)
      });

      const registerData = await registerResponse.json();

      if (registerResponse.ok && registerData.success) {
        toast.success('Registration successful! 🎉');
        toast.info('Please wait for admin approval.', { duration: 5000 });
        
        // ✅ Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/vendor/login');
        }, 2000);
      } else {
        setError(registerData.message || 'Registration failed. Please try again.');
        toast.error(registerData.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (currentStep === 1) {
      // Validate Step 1 fields
      if (!formData.legalName?.trim()) {
        setError('Please enter legal business name');
        return;
      }
      if (!formData.brandName?.trim()) {
        setError('Please enter brand/store name');
        return;
      }
      if (!formData.email?.trim()) {
        setError('Please enter email address');
        return;
      }
      if (!formData.phone || formData.phone.length < 10) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }
      
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError('');
      const sent = await sendOTP();
      if (sent) {
        // OTP sent successfully
      }
    }
  };

  const resendOTP = async () => {
    if (resendTimer > 0) return;
    await sendOTP();
  };

  const goToStep1 = () => {
    setCurrentStep(1);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto-detect OTP from SMS (mobile)
  useEffect(() => {
    if ('OTPCredential' in window && step === 2) {
      const abortController = new AbortController();
      
      navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: abortController.signal
      })
      .then(otpCredential => {
        if (otpCredential?.code) {
          setOtp(otpCredential.code);
          // Auto-submit after 500ms
          setTimeout(() => {
            verifyOTP();
          }, 500);
        }
      })
      .catch(err => {
        // OTP auto-fill not available
        console.log('OTP auto-fill not available');
      });
      
      return () => abortController.abort();
    }
  }, [step]);

  return (
    <>
      <Helmet>
        <title>Become a Seller - Vendor Registration | MyPinkShop</title>
        <meta name="description" content="Join MyPinkShop as a seller. Sell your beauty & fashion products to 1M+ customers. Zero commission for first 3 months." />
        <link rel="canonical" href="https://www.mypinkshop.com/vendor/register" />
        <meta property="og:title" content="Become a Seller - MyPinkShop Vendor Registration" />
        <meta property="og:description" content="Join India's largest beauty & fashion marketplace as a seller." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mypinkshop.com/vendor/register" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        
        {/* Top Bar */}
        <div className="bg-gradient-to-r from-[#FF6B6B] via-[#FF8E8E] to-[#FF6B6B] text-white py-2 text-center text-xs sm:text-sm">
          <div className="container mx-auto px-4">
            ✨ India's Fastest Growing Beauty Marketplace | 1 Million+ Happy Customers ✨
          </div>
        </div>

        {/* Header */}
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
                <span className="cursor-pointer hover:text-[#FF6B6B] transition">Sell with Us</span>
                <span className="cursor-pointer hover:text-[#FF6B6B] transition">Partner Program</span>
                <span className="cursor-pointer hover:text-[#FF6B6B] transition">Success Stories</span>
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-all ${
                currentStep >= 1 ? 'bg-[#FF6B6B] text-white shadow-md' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <p className="text-xs text-gray-600">Business Info</p>
            </div>
            <div className="text-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-all ${
                currentStep >= 2 ? 'bg-[#FF6B6B] text-white shadow-md' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <p className="text-xs text-gray-600">Verify & Set Password</p>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            
            {/* Step 1: Business Information */}
            {currentStep === 1 && (
              <div className="p-6 sm:p-8">
                <div className="border-b border-gray-100 pb-4 mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">Business Information</h2>
                  <p className="text-xs text-gray-400 mt-1">Tell us about your business</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-5 text-sm flex items-start gap-2">
                    <span className="text-red-500">⚠️</span>
                    <span>{error}</span>
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 transition"
                        required
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 transition"
                        required
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 transition"
                        required
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 transition"
                        required
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 transition"
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 transition"
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
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 transition"
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 transition"
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 transition"
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white font-medium py-3 rounded-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5"
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
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-5 text-sm flex items-start gap-2">
                    <span className="text-red-500">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                {step === 1 ? (
                  <div className="space-y-5">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <p className="text-sm text-gray-600 mb-2">We will send OTP to:</p>
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        <span className="font-medium">📧 {formData.email}</span>
                        <span className="text-gray-300">|</span>
                        <span className="font-medium">📱 {formData.phone}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white font-medium py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending OTP...
                        </span>
                      ) : (
                        'Send Verification OTP →'
                      )}
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
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 transition"
                        placeholder="000000"
                        autoFocus
                      />
                      <p className="text-xs text-gray-400 text-center mt-2">
                        Enter the 6-digit code sent to your email & phone
                      </p>
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
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 transition pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#FF6B6B] transition"
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
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 transition pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#FF6B6B] transition"
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
                        className="mt-0.5 w-4 h-4 text-[#FF6B6B] focus:ring-[#FF6B6B] border-gray-300 rounded"
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
                      className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white font-medium py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Registering...
                        </span>
                      ) : (
                        'Complete Registration →'
                      )}
                    </button>

                    <div className="text-center">
                      <button
                        onClick={resendOTP}
                        disabled={resendTimer > 0}
                        className={`text-sm transition ${
                          resendTimer > 0 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-[#FF6B6B] hover:underline'
                        }`}
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
            <div className="bg-white rounded-lg p-4 text-center border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-semibold text-gray-800 text-sm">0% Commission</h3>
              <p className="text-xs text-gray-500">For first 3 months</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="text-2xl mb-2">🚚</div>
              <h3 className="font-semibold text-gray-800 text-sm">Pan India Shipping</h3>
              <p className="text-xs text-gray-500">Easy logistics support</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-100 shadow-sm hover:shadow-md transition">
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
          <div className="bg-gray-50 rounded-lg p-4 mt-6 text-center border border-gray-100">
            <p className="text-xs text-gray-500">
              Need help? Call us at <span className="font-medium text-gray-700">1800-123-456799</span> or email{' '}
              <a href="mailto:info@mypinkshop.com" className="text-[#FF6B6B] hover:underline">info@mypinkshop.com</a>
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
    </>
  );
}

export default VendorRegister;
