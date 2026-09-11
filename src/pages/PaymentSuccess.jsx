import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ✅ Sahi param name — txnId (jo backend bhej raha hai)
  const merchantOrderId =
    searchParams.get('txnId') ||
    searchParams.get('merchantOrderId') ||
    searchParams.get('orderId');

  const API_URL = 'https://api.mypinkshop.com';

  const [isLoading, setIsLoading] = useState(true); // ✅ shuru mein true
  const [orderData, setOrderData] = useState(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!merchantOrderId) {
      toast.error('Invalid payment session');
      navigate('/cart');
      return;
    }

    const verifyAndCreateOrder = async () => {
      try {
        const token = localStorage.getItem('token');

        // ✅ Step 1: PhonePe se payment VERIFY karo
        const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ merchantTransactionId: merchantOrderId }),
        });

        const verifyData = await verifyRes.json();

        if (!verifyData.success || !verifyData.data?.verified) {
          // ❌ Payment verify nahi hua
          toast.error('Payment verification failed');
          setVerified(false);
          setIsLoading(false);
          return;
        }

        // ✅ Step 2: Payment verified — ab order banao
        setVerified(true);

        const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
        const total = JSON.parse(localStorage.getItem('orderTotal') || '0');
        const address = JSON.parse(
          localStorage.getItem('checkoutAddress') || '{}'
        );

        if (cartItems.length > 0) {
          const orderRes = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              items: cartItems,
              total,
              address,
              paymentMethod: 'phonepe',
              paymentStatus: 'completed',
              transactionId: merchantOrderId,
            }),
          });

          const orderResult = await orderRes.json();
          setOrderData(orderResult.data || orderResult);
        }

        // ✅ Step 3: Cart clear karo
        localStorage.removeItem('cart');
        localStorage.removeItem('orderTotal');
        localStorage.removeItem('checkoutAddress');

        toast.success('Payment Successful! 🎉');
      } catch (error) {
        console.error('Verification error:', error);
        toast.error('Something went wrong');
        setVerified(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAndCreateOrder();
  }, [merchantOrderId, navigate]);

  // 🔄 LOADING
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Verifying Payment...</p>
        </div>
      </div>
    );
  }

  // ❌ FAILED
  if (!verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h1>
          <p className="text-gray-500 mb-6">
            Payment verify nahi ho paya. Please try again.
          </p>
          <div className="flex gap-3">
            <Link to="/cart" className="flex-1 bg-pink-600 text-white py-3 rounded-xl font-semibold hover:bg-pink-700 transition">
              Back to Cart
            </Link>
            <Link to="/" className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ✅ SUCCESS
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">Payment Successful!</h1>
            <p className="text-pink-100 mt-2 text-sm">
              Thank you for shopping with us.
            </p>
          </div>

          <div className="p-8">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-6">
              <div>
                <p className="text-sm text-gray-400">Order ID</p>
                <p className="text-lg font-bold text-gray-800 tracking-wide break-all">
                  {merchantOrderId}
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
                    ₹{orderData?.total ? Number(orderData.total).toLocaleString() : '—'}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
