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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800">Verifying your email...</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Success!</h2>
            <p className="text-gray-500 mt-2">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white text-2xl">✗</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Verification Failed</h2>
            <p className="text-gray-500 mt-2 mb-4">{message}</p>
            <Link to="/login" className="text-pink-500 hover:underline">
              Go to Login →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
