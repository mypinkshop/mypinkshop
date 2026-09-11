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

  // ✅ Token check
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token') || localStorage.getItem('auth_token')
      : null;

  const MAX_RETRIES = 6;
  const RETRY_DELAY = 5000;

  const [isLoading, setIsLoading] = useState(true);
  // verifying | success | pending | failed | guest | guest_success
  const [status, setStatus] = useState('verifying');
  const [orderData, setOrderData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // ✅ Agar token nahi hai → guest mode (verify call hi nahi)
    if (!token) {
      setStatus('guest');
      setIsLoading(false);
      return;
    }

    if (!merchantTransactionId) {
      setStatus('failed');
      setIsLoading(false);
      toast.error('Invalid payment session');
      return;
    }

    let cancelled = false;
    let timeoutId = null;

    const verifyPayment = async () => {
      try {
        const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ merchantTransactionId }),
        });

        if (cancelled) return;

        const verifyData = await verifyRes.json();
        console.log(`Verify [attempt ${retryCount + 1}]:`, verifyData);

        // ✅ SUCCESS
        if (verifyData.success && verifyData.data?.verified) {
          const data = verifyData.data;

          // ✅ orderNumber hai → user owner hai → full success page
          if (data.orderNumber) {
            setStatus('success');
            setOrderData({
              orderNumber: data.orderNumber,
              orderTotal: data.orderTotal,
              orderId: data.orderId,
              txnId: merchantTransactionId,
            });
            toast.success('Payment Successful! 🎉');

            localStorage.removeItem('cart');
            localStorage.removeItem('orderTotal');
            localStorage.removeItem('checkoutAddress');
          } else {
            // ✅ Payment successful, lekin user owner nahi → guest_success
            setStatus('guest_success');
            toast.success('Payment Successful! 🎉');
          }

          setIsLoading(false);
          return;
        }

        // ⏳ PENDING — retry
        if (verifyData.data?.status === 'pending' && retryCount < MAX_RETRIES) {
          timeoutId = setTimeout(() => {
            if (!cancelled) setRetryCount((c) => c + 1);
          }, RETRY_DELAY);
          return;
        }

        if (verifyData.data?.status === 'pending') {
          setStatus('pending');
          setIsLoading(false);
          return;
        }

        // ❌ Truly FAILED
        setStatus('failed');
        setIsLoading(false);
        toast.error('Payment failed');
      } catch (error) {
        if (cancelled) return;
        console.error('Verification error:', error);

        if (retryCount < MAX_RETRIES) {
          timeoutId = setTimeout(() => {
            if (!cancelled) setRetryCount((c) => c + 1);
          }, RETRY_DELAY);
          return;
        }

        setStatus('pending');
        setIsLoading(false);
      }
    };

    verifyPayment();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [merchantTransactionId, retryCount, token]);

  // ============================================================
  // ✅ GUEST — user logged in nahi hai (verify call hi nahi hui)
  // ============================================================
  if (status === 'guest') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Payment Successful!</h1>
            <p className="text-pink-100 mt-2 text-sm">Thank you for your payment</p>
          </div>

          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4 text-base font-medium">
              🎉 Your payment has been received successfully.
            </p>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Please check your orders on the device where you placed the order.
            </p>

            <Link
              to="/"
              className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ✅ GUEST SUCCESS — payment done, lekin user owner nahi hai
  // ============================================================
  if (status === 'guest_success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Payment Successful!</h1>
            <p className="text-pink-100 mt-2 text-sm">Thank you for your payment</p>
          </div>

          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4 text-base font-medium">
              🎉 Your payment has been received successfully.
            </p>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Please check your orders on the device where you placed the order.
            </p>

            <Link
              to="/"
              className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // 🔄 VERIFYING
  // ============================================================
  if (status === 'verifying' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-semibold">Verifying Payment...</p>
          <p className="text-gray-400 text-sm mt-2">
            {retryCount > 0
              ? `Confirming with PhonePe... (${retryCount}/${MAX_RETRIES})`
              : "Please wait, don't close this page"}
          </p>
          {retryCount > 2 && (
            <p className="text-xs text-gray-400 mt-3 px-4">
              PhonePe sometimes takes a few moments to confirm. Please be patient.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // ⏳ PENDING
  // ============================================================
  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-amber-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Payment Processing</h1>
            <p className="text-amber-100 mt-2 text-sm">We're confirming your payment with PhonePe</p>
          </div>

          <div className="p-8">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-700 text-center leading-relaxed">
                📱 <strong>Don't worry!</strong> Your payment is being verified.
                <br /><br />
                It may take up to <strong>5 minutes</strong>. We'll update your order automatically once confirmed.
                <br /><br />
                <span className="text-xs text-gray-500">
                  Check your order status anytime in <strong>My Orders</strong>.
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to="/profile?tab=orders"
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3.5 rounded-xl font-semibold text-center hover:shadow-lg transition-all"
              >
                📦 Check My Orders
              </Link>
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

  // ============================================================
  // ❌ FAILED
  // ============================================================
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

  // ============================================================
  // ✅ SUCCESS (Owner only)
  // ============================================================
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
