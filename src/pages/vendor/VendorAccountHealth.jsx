import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorAccountHealth() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [health, setHealth] = useState({
    rating: 0,
    totalReviews: 0,
    positiveReviews: 0,
    negativeReviews: 0,
    responseTime: 0,
    cancellationRate: 0,
    lateShipmentRate: 0,
    validTrackingRate: 0,
    aToZClaims: 0,
    customerFeedback: [],
  });
  const [vendor, setVendor] = useState(null);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      navigate('/vendor/login');
      return;
    }
    fetchVendorData(token);
  }, [navigate]);

  // ✅ Fetch vendor data from backend
  const fetchVendorData = async (token) => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch vendor profile
      const profileRes = await fetch(`${API_URL}/api/vendor/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      
      if (profileData.success) {
        setVendor(profileData.vendor);
      }

      // 2. Fetch vendor stats (for health metrics)
      const statsRes = await fetch(`${API_URL}/api/vendor/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();

      // 3. Fetch vendor orders (for calculating metrics)
      const ordersRes = await fetch(`${API_URL}/api/vendor/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();

      // 4. Fetch vendor products (for reviews)
      const productsRes = await fetch(`${API_URL}/api/vendor/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const productsData = await productsRes.json();

      const myOrders = ordersData.success ? ordersData.orders || [] : [];
      const myProducts = productsData.success ? productsData.products || [] : [];
      
      // ✅ Calculate metrics
      const deliveredOrders = myOrders.filter(o => o.status === 'delivered');
      const totalOrders = myOrders.length;
      const cancelledOrders = myOrders.filter(o => o.status === 'cancelled');
      
      // Average rating from products
      let avgRating = 0;
      let totalReviews = 0;
      let positiveReviews = 0;
      let negativeReviews = 0;
      
      myProducts.forEach(product => {
        const rating = product.rating || 0;
        const reviewCount = product.reviewCount || 0;
        totalReviews += reviewCount;
        if (rating >= 4) positiveReviews += 1;
        if (rating < 3) negativeReviews += 1;
      });
      
      avgRating = myProducts.length > 0 
        ? (myProducts.reduce((sum, p) => sum + (p.rating || 4.0), 0) / myProducts.length)
        : 0;
      
      const cancellationRate = totalOrders > 0 ? (cancelledOrders.length / totalOrders) * 100 : 0;
      const lateShipmentRate = totalOrders > 0 
        ? (myOrders.filter(o => o.lateShipment === true).length / totalOrders) * 100 
        : 0;
      const validTrackingRate = totalOrders > 0 
        ? (myOrders.filter(o => o.trackingNumber && o.trackingNumber !== '').length / totalOrders) * 100 
        : 0;
      
      // Customer feedback from delivered orders
      const feedback = deliveredOrders.slice(0, 5).map((order, idx) => ({
        id: idx + 1,
        customer: order.customerName || 'Customer',
        rating: order.rating || 4,
        comment: order.feedback || 'Good product, fast delivery!',
        date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
      }));

      // Default feedback if no orders
      if (feedback.length === 0) {
        feedback.push({
          id: 1,
          customer: 'No feedback yet',
          rating: 0,
          comment: 'Customer feedback will appear here once you have delivered orders.',
          date: 'N/A'
        });
      }

      setHealth({
        rating: parseFloat(avgRating.toFixed(1)),
        totalReviews: totalReviews,
        positiveReviews: positiveReviews,
        negativeReviews: negativeReviews,
        responseTime: 2.4, // Mock - can be calculated from real data
        cancellationRate: cancellationRate,
        lateShipmentRate: lateShipmentRate,
        validTrackingRate: validTrackingRate,
        aToZClaims: 0, // Mock - can be added to order schema
        customerFeedback: feedback,
      });

    } catch (err) {
      console.error('Error fetching vendor health data:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading account health...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      <VendorSidebar activeTab="performance" />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">📊 Account Health</h1>
            <p className="text-gray-500 text-sm">Monitor your seller performance metrics</p>
          </div>

          {/* Rating Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Seller Rating</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-3xl font-bold text-yellow-500">{health.rating}</p>
                <div className="flex text-yellow-400 text-lg">
                  {"★".repeat(Math.floor(health.rating))}
                  {"☆".repeat(5 - Math.floor(health.rating))}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Response Time</p>
              <p className="text-3xl font-bold text-green-600">{health.responseTime} hrs</p>
              <p className="text-xs text-gray-400 mt-1">Target: Within 24 hours</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Cancellation Rate</p>
              <p className={`text-3xl font-bold ${health.cancellationRate < 2.5 ? 'text-green-600' : 'text-red-600'}`}>
                {health.cancellationRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">Target: Below 2.5%</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Valid Tracking Rate</p>
              <p className="text-3xl font-bold text-green-600">{health.validTrackingRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-400 mt-1">Target: Above 95%</p>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Late Shipment Rate</p>
              <p className={`text-2xl font-bold ${health.lateShipmentRate < 4 ? 'text-green-600' : 'text-red-600'}`}>
                {health.lateShipmentRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500">A-to-Z Claims</p>
              <p className="text-2xl font-bold text-green-600">{health.aToZClaims}</p>
              <p className="text-xs text-gray-400">No claims received</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Total Reviews</p>
              <p className="text-2xl font-bold text-purple-600">{health.totalReviews}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500">Positive vs Negative</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-green-600 font-bold text-xl">{health.positiveReviews}</span>
                <span className="text-gray-400">/</span>
                <span className="text-red-600 font-bold text-xl">{health.negativeReviews}</span>
              </div>
            </div>
          </div>

          {/* Customer Feedback */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">💬 Customer Feedback</h2>
              <span className="text-xs text-gray-400">Last {health.customerFeedback.length} reviews</span>
            </div>
            <div className="divide-y divide-gray-100">
              {health.customerFeedback.length === 0 || health.customerFeedback[0]?.customer === 'No feedback yet' ? (
                <div className="p-8 text-center text-gray-400">
                  <div className="text-4xl mb-2">💬</div>
                  <p>No customer feedback yet</p>
                  <p className="text-xs mt-1">Feedback will appear here once you have delivered orders</p>
                </div>
              ) : (
                health.customerFeedback.map(feedback => (
                  <div key={feedback.id} className="p-5 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex text-yellow-400 text-sm mb-1">
                          {"★".repeat(feedback.rating)}
                          {"☆".repeat(5 - feedback.rating)}
                        </div>
                        <p className="font-medium text-gray-800">{feedback.customer}</p>
                        <p className="text-sm text-gray-600 mt-1">{feedback.comment}</p>
                      </div>
                      <p className="text-xs text-gray-400">{feedback.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Health Status */}
          {health.rating >= 4 && health.cancellationRate < 2.5 && health.lateShipmentRate < 4 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 font-medium">✅ Your account is in good standing</p>
              <p className="text-xs text-green-600 mt-1">All metrics are within acceptable limits. Keep up the good work!</p>
            </div>
          ) : health.rating >= 3 && health.cancellationRate < 5 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-medium">⚠️ Your account needs attention</p>
              <p className="text-xs text-yellow-600 mt-1">Some metrics need improvement. Check cancellation rate and late shipments.</p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium">❌ Your account needs immediate attention</p>
              <p className="text-xs text-red-600 mt-1">Multiple metrics are below acceptable limits. Please review your performance.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default VendorAccountHealth;
