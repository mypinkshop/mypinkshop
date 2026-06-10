import { Link } from 'react-router-dom';

function ResetPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-white text-2xl">🔑</span>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset Password Page</h1>
        
        <p className="text-green-600 mb-4">
          ✅ Page is working! Routing is correct.
        </p>
        
        <Link 
          to="/login" 
          className="inline-block text-pink-500 hover:text-pink-600 transition"
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ResetPassword;
