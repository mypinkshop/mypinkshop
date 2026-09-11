import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const merchantTransactionId =
    searchParams.get('txnId') ||
    searchParams.get('merchantOrderId') ||
    searchParams.get('orderId');

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mypinkshop.com';

  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('verifying');
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    if (!merchantTransactionId) {
      setStatus('failed');
      toast.error('Invalid payment session');
      return;
    }

    const verifyPayment = async () => {
      try {
        const token =
          localStorage.getItem('token') ||
          localStorage.getItem('auth_token');

        const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ merchantTransactionId }),
        });

        const verifyData = await verifyRes.json();
        console.log('Verify response:', verifyData);

        if (verifyData.success && verifyData.data?.verified) {
          setStatus('success');
          setOrderData({
            orderNumber: verifyData.data.orderNumber,
            orderTotal: verifyData.data.orderTotal,
            orderId: verifyData.data.orderId,
            txnId: merchantTransactionId,
          });
          toast.success('Payment Successful! 🎉');

          localStorage.removeItem('cart');
          localStorage.removeItem('orderTotal');
          localStorage.removeItem('checkoutAddress');
        } else {
          setStatus('failed');
          toast.error('Payment verification failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('failed');
        toast.error('Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [merchantTransactionId]);

  // 🔄 VERIFYING
  if (status === 'verifying' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Verifying Payment...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait, don't close this page</p>
        </div>
      </div>
    );
  }

  // ❌ FAILED
  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-rose-500 p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Payment Failed</h1>
            <p className="text-red-100 mt-2 text-sm">Your payment could not be processed</p>
          </div>

          <div className="p-8">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 text-center">
                Don't worry, no amount has been deducted. If any amount is deducted, it will be refunded within 5-7 business days.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/cart')}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                🔄 Retry Payment
              </button>
              <Link
                to="/shop"
                className="w-full bg-white border-2 border-pink-200 text-pink-600 py-3.5 rounded-xl font-semibold text-center hover:bg-pink-50 transition-all"
              >
                Continue Shopping
              </Link>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Need help? <Link to="/contact" className="text-pink-500 hover:underline">Contact Support</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ SUCCESS
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Payment Successful!</h1>
            <p className="text-pink-100 mt-2 text-sm">Thank you for shopping with us. Your order is confirmed.</p>
          </div>

          <div className="p-8">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-6">
              <div className="text-left">
                <p className="text-sm text-gray-400">Order Number</p>
                <p className="text-lg font-bold text-gray-800 tracking-wide">
                  {orderData?.orderNumber || '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Payment Method</p>
                <p className="text-lg font-bold text-gray-800">PhonePe</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-700 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Total Paid</span>
                  <span className="text-xl font-bold text-gray-900">
                    ₹{orderData?.orderTotal ? Number(orderData.orderTotal).toLocaleString() : '—'}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Payment Status</span>
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                      Completed
                    </span>
                  </div>
                </div>
              </div>
            </div>

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

            {orderData?.orderId && (
              <div className="mt-6 text-center">
                <Link
                  to={`/track-order/${orderData.orderId}`}
                  className="text-sm text-gray-500 hover:text-pink-600 transition"
                >
                  📦 Track Order
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
