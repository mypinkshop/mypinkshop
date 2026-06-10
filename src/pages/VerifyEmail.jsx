import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  const API_URL = 'https://api.mypinkshop.com';

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/verify-email/${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Invalid or expired verification link');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md sm:max-w-lg mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-pink-100 p-6 sm:p-8 md:p-10 text-center">
          
          {/* Loading State */}
          {status === 'verifying' && (
            <>
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 sm:mb-5"></div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">Verifying your email...</h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-2">Please wait while we verify your email address</p>
            </>
          )}

          {/* Success State */}
          {status === 'success' && (
            <>
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-lg">
                <span className="text-white text-xl sm:text-2xl md:text-3xl">✓</span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">Email Verified!</h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-2">{message}</p>
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <>
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-lg">
                <span className="text-white text-xl sm:text-2xl md:text-3xl">✗</span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">Verification Failed</h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-2 mb-4 sm:mb-5">{message}</p>
              <Link 
                to="/login" 
                className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm sm:text-base"
              >
                Go to Login →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
