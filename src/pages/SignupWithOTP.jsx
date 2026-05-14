import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function SignupWithOTP() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Send OTP to mobile
  const sendOTP = async () => {
    if (!formData.mobile || formData.mobile.length < 10) {
      setError('Enter valid mobile number');
      return false;
    }
    
    setLoading(true);
    // Simulate OTP sending
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSentOtp(generatedOtp);
    
    // In production, send SMS via API
    console.log(`OTP for ${formData.mobile}: ${generatedOtp}`);
    alert(`Demo OTP: ${generatedOtp} (In production, this will be sent via SMS)`);
    
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
      setError('Invalid OTP');
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
    
    // Save user data (without email verified)
    const userData = {
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      password: formData.password,
      mobileVerified: true,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    
    localStorage.setItem('pendingUser', JSON.stringify(userData));
    
    // Register API call would go here
    setTimeout(() => {
      setLoading(false);
      alert('Mobile verified! Please login.');
      navigate('/login');
    }, 1000);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    const sent = await sendOTP();
    if (sent) setStep(2);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    await verifyOTP();
  };

  const resendOTP = async () => {
    if (resendTimer > 0) return;
    await sendOTP();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-pink-100 py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-block hover:opacity-80 transition">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">MyPinkShop</h1>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-8">
            
            {step === 1 ? (
              // Step 1: Signup Form
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <span className="text-white text-2xl">📝</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800">Create account</h1>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium py-2 rounded-lg hover:opacity-90 transition shadow-md"
                  >
                    {loading ? 'Sending OTP...' : 'Continue'}
                  </button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                  <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Already have an account?</span></div>
                </div>

                <Link to="/login" className="block w-full text-center border border-pink-500 bg-white text-pink-600 font-medium py-2 rounded-lg hover:bg-pink-50 transition">
                  Sign In
                </Link>
              </>
            ) : (
              // Step 2: OTP Verification
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <span className="text-white text-2xl">🔐</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800">Verify Mobile</h1>
                  <p className="text-gray-500 text-sm mt-1">OTP sent to {formData.mobile}</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleVerifyOTP} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength="6"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 text-center text-2xl tracking-widest"
                      placeholder="000000"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium py-2 rounded-lg hover:opacity-90 transition shadow-md"
                  >
                    {loading ? 'Verifying...' : 'Verify & Create Account'}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={resendOTP}
                      disabled={resendTimer > 0}
                      className={`text-sm ${resendTimer > 0 ? 'text-gray-400' : 'text-pink-600 hover:underline'}`}
                    >
                      {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-center text-gray-500 hover:text-pink-600 text-sm transition"
                  >
                    ← Back to signup
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-pink-100 py-6 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500 mb-4">
            <a href="#" className="hover:text-pink-500">Conditions of Use</a>
            <a href="#" className="hover:text-pink-500">Privacy Notice</a>
            <a href="#" className="hover:text-pink-500">Help</a>
          </div>
          <p className="text-center text-xs text-gray-400">© 2025 MyPinkShop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default SignupWithOTP;
