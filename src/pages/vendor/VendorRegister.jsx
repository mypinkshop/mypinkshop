import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function VendorRegister() {
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
  const navigate = useNavigate();

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
    if (!formData.phone) {
      setError('Please enter phone number');
      return false;
    }

    setLoading(true);
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSentOtp(generatedOtp);

    // Simulate sending email
    console.log(`📧 Email OTP to ${formData.email}: ${generatedOtp}`);
    console.log(`📱 SMS OTP to ${formData.phone}: ${generatedOtp}`);
    
    // In production, use actual email/SMS API
    alert(`Demo: OTP sent to ${formData.email} and ${formData.phone}\nOTP: ${generatedOtp}`);

    setLoading(false);
    
    // Start resend timer
    setResendTimer(30);
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) clearInterval(timer);
        return prev - 1;
      });
    }, 1000);
    
    return true;
  };

  // Verify OTP
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

    setLoading(true);

    setTimeout(() => {
      try {
        const existingVendors = localStorage.getItem('registeredVendors');
        let vendors = existingVendors ? JSON.parse(existingVendors) : [];
        
        if (vendors.some(v => v.email === formData.email)) {
          setError('Email already registered');
          setLoading(false);
          return;
        }
        
        const newVendor = {
          id: Date.now(),
          brandName: formData.brandName,
          email: formData.email,
          phone: formData.phone,
          gstNumber: formData.gstNumber,
          address: formData.address,
          vendorStatus: 'pending',
          productsCount: 0,
          totalSales: 0,
          joinedDate: new Date().toISOString().split('T')[0],
          commission: 15,
          password: formData.password,
          emailVerified: true,
          phoneVerified: true,
        };
        
        vendors.push(newVendor);
        localStorage.setItem('registeredVendors', JSON.stringify(vendors));
        
        alert('✅ Registration successful! Please wait for admin approval.');
        navigate('/vendor/login');
      } catch (err) {
        setError('Something went wrong');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-pink-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg">
            🏪
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Become a Seller</h2>
          <p className="text-gray-500 mt-2">Join MyPinkShop marketplace</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">
            {error}
          </div>
        )}

        {step === 1 ? (
          // Step 1: Registration Form
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                <input type="text" name="brandName" value={formData.brandName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                <textarea name="address" rows="2" value={formData.address} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 pr-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-500 transition">
                    {showPassword ? '👁️' : '🔒'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 pr-10" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-500 transition">
                    {showConfirmPassword ? '👁️' : '🔒'}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all mt-4 disabled:opacity-50">
              {loading ? 'Sending OTP...' : 'Continue →'}
            </button>
          </form>
        ) : (
          // Step 2: OTP Verification
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-md">
                🔐
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Verify Your Identity</h3>
              <p className="text-sm text-gray-500 mt-1">
                OTP sent to <span className="font-medium">{formData.email}</span> and <span className="font-medium">{formData.phone}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:border-pink-500" placeholder="000000" autoFocus />
            </div>

            <div className="flex gap-3">
              <button onClick={verifyOTP} disabled={loading} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify & Register'}
              </button>
            </div>

            <div className="text-center">
              <button onClick={resendOTP} disabled={resendTimer > 0} className="text-sm text-pink-500 hover:underline disabled:text-gray-400">
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>

            <button onClick={() => setStep(1)} className="w-full text-center text-gray-500 hover:text-pink-600 text-sm transition mt-2">
              ← Back to registration
            </button>
          </div>
        )}

        <p className="text-center text-gray-500 mt-6 text-sm">
          Already have a seller account?{' '}
          <Link to="/vendor/login" className="text-pink-500 hover:underline font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default VendorRegister;
