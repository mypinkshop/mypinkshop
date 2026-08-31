import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const merchantOrderId = searchParams.get('merchantOrderId'); // PhonePe se aaya hua Order ID

  const API_URL = 'https://api.mypinkshop.com'; // Backend URL

  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!merchantOrderId) {
        toast.error('Invalid payment session');
        navigate('/cart');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/payments/status/${merchantOrderId}`);
        const data = await response.json();

        if (data.data && data.data.state === 'COMPLETED') {
          setOrderData(data.data); // Payment Data Save karo
          setShowConfetti(true); // Confetti dikhao
          toast.success('Payment Successful! 🎉');
        } else if (data.data && data.data.state === 'FAILED') {
          toast.error('Payment Failed!');
          navigate('/cart');
        } else {
          // Pending state
          toast.loading('Payment pending...');
        }
      } catch (error) {
        console.error('Verification error:', error);
        toast.error('Something went wrong');
        navigate('/cart');
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [merchantOrderId]);

  // 🎉 Simple Confetti Logic
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white relative overflow-hidden">
      
      {/* Confetti Effect (CSS based) */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-3 bg-pink-400 rounded-sm animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
                animationDelay: `${Math.random() * 2}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            ></div>
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden">
          
          {/* Success Header */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Payment Successful!</h1>
            <p className="text-pink-100 mt-2 text-sm">Thank you for shopping with us. Your order is confirmed.</p>
          </div>

          {/* Order Details */}
          <div className="p-8">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-6">
              <div className="text-left">
                <p className="text-sm text-gray-400">Order ID</p>
                <p className="text-lg font-bold text-gray-800 tracking-wide">{merchantOrderId ? `#${merchantOrderId}` : 'Processing...'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Payment Method</p>
                <p className="text-lg font-bold text-gray-800">PhonePe</p>
              </div>
            </div>

            {/* Fake Order Summary (Jab tak backend se actual order nahi milta) */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-700 mb-4">Order Summary</h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Yahan aap apna actual order data backend se fetch karke show kar sakte hain. Abhi placeholder hai */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Total Paid</span>
                    <span className="text-xl font-bold text-gray-900">₹{orderData?.amount ? (orderData.amount / 100).toLocaleString() : '1,373'}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Payment Status</span>
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">Completed</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/profile?tab=orders" 
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3.5 rounded-xl font-semibold text-center hover:shadow-lg transition-all"
              >
                View My Orders
              </Link>
              <Link 
                to="/shop" 
                className="flex-1 bg-white border-2 border-pink-200 text-pink-600 py-3.5 rounded-xl font-semibold text-center hover:bg-pink-50 transition-all"
              >
                Continue Shopping
              </Link>
            </div>

            <div className="mt-6 text-center">
              <button 
                onClick={() => window.print()} 
                className="text-sm text-gray-500 hover:text-pink-600 transition underline-offset-2 hover:underline"
              >
                🧾 Download Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
