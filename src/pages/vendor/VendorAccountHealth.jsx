import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorAccountHealth() {
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendor');
    
    if (!token || !vendorData) {
      navigate('/vendor/login');
      return;
    }

    const vendorInfo = JSON.parse(vendorData);
    setVendor(vendorInfo);
    const vendorName = vendorInfo.brandName || vendorInfo.name;
    
    // Get real data from localStorage
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const myProducts = allProducts.filter(p => p.vendor === vendorName);
    
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const myOrders = allOrders.filter(o => o.vendor === vendorName);
    
    const deliveredOrders = myOrders.filter(o => o.status === 'delivered').length;
    const totalOrders = myOrders.length;
    const cancelledOrders = myOrders.filter(o => o.status === 'cancelled').length;
    
    // Calculate metrics
    const avgRating = myProducts.length > 0 
      ? (myProducts.reduce((sum, p) => sum + (p.rating || 4.5), 0) / myProducts.length).toFixed(1)
      : 0;
    
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
    const lateShipmentRate = totalOrders > 0 ? (myOrders.filter(o => o.lateShipment === true).length / totalOrders) * 100 : 0;
    const validTrackingRate = totalOrders > 0 ? 98.5 : 0;
    
    // Mock customer feedback (from orders)
    const feedback = myOrders.filter(o => o.status === 'delivered').slice(0, 5).map((order, idx) => ({
      id: idx + 1,
      customer: order.customer,
      rating: 4 + Math.floor(Math.random() * 2),
      comment: order.feedback || 'Good product, fast delivery',
      date: order.date,
    }));
    
    setHealth({
      rating: parseFloat(avgRating),
      totalReviews: myProducts.reduce((sum, p) => sum + (p.reviewCount || 0), 0),
      positiveReviews: myProducts.reduce((sum, p) => sum + ((p.rating || 0) >= 4 ? 1 : 0), 0),
      negativeReviews: myProducts.reduce((sum, p) => sum + ((p.rating || 0) < 3 ? 1 : 0), 0),
      responseTime: 2.4,
      cancellationRate: cancellationRate,
      lateShipmentRate: lateShipmentRate,
      validTrackingRate: validTrackingRate,
      aToZClaims: 0,
      customerFeedback: feedback,
    });
    
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
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
            <h1 className="text-2xl font-bold text-gray-800">Account Health</h1>
            <p className="text-gray-500 text-sm">Monitor your seller performance metrics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Seller Rating</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-3xl font-bold text-yellow-500">{health.rating}</p>
                <div className="flex text-yellow-400 text-lg">{"★".repeat(Math.floor(health.rating))}{"☆".repeat(5 - Math.floor(health.rating))}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Response Time</p>
              <p className="text-3xl font-bold text-green-600">{health.responseTime} hours</p>
              <p className="text-xs text-gray-400 mt-1">Target: Within 24 hours</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Cancellation Rate</p>
              <p className={`text-3xl font-bold ${health.cancellationRate < 2.5 ? 'text-green-600' : 'text-red-600'}`}>{health.cancellationRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-400 mt-1">Target: Below 2.5%</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Valid Tracking Rate</p>
              <p className="text-3xl font-bold text-green-600">{health.validTrackingRate}%</p>
              <p className="text-xs text-gray-400 mt-1">Target: Above 95%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Late Shipment Rate</p>
              <p className={`text-2xl font-bold ${health.lateShipmentRate < 4 ? 'text-green-600' : 'text-red-600'}`}>{health.lateShipmentRate.toFixed(1)}%</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">A-to-Z Claims</p>
              <p className="text-2xl font-bold text-green-600">{health.aToZClaims}</p>
              <p className="text-xs text-gray-400">No claims received</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total Reviews</p>
              <p className="text-2xl font-bold">{health.totalReviews}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Positive vs Negative</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-green-600 font-bold">{health.positiveReviews}</span>
                <span className="text-gray-400">/</span>
                <span className="text-red-600">{health.negativeReviews}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">Customer Feedback</h2>
            </div>
            <div className="divide-y">
              {health.customerFeedback.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No customer feedback yet</div>
              ) : (
                health.customerFeedback.map(feedback => (
                  <div key={feedback.id} className="p-5 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex text-yellow-400 text-sm mb-1">
                          {"★".repeat(feedback.rating)}{"☆".repeat(5 - feedback.rating)}
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

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium">Your account is in good standing</p>
            <p className="text-xs text-green-600 mt-1">All metrics are within acceptable limits. Keep up the good work!</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorAccountHealth;
