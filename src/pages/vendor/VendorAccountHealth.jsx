import { useState } from 'react';
import VendorSidebar from './components/VendorSidebar';
import VendorHeader from './components/VendorHeader';

function VendorAccountHealth() {
  const [health] = useState({
    rating: 4.8,
    totalReviews: 234,
    positiveReviews: 218,
    negativeReviews: 16,
    responseTime: '2.4 hours',
    cancellationRate: '1.2%',
    lateShipmentRate: '0.8%',
    validTrackingRate: '98.5%',
    aToZClaims: 2,
    customerFeedback: [
      { id: 1, customer: 'Priya Sharma', rating: 5, comment: 'Amazing product! Fast delivery.', date: '2025-05-20' },
      { id: 2, customer: 'Aditi Singh', rating: 4, comment: 'Good quality, but delivery was slow.', date: '2025-05-18' },
      { id: 3, customer: 'Neha Gupta', rating: 5, comment: 'Love it! Will buy again.', date: '2025-05-15' },
    ]
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <VendorHeader />
      <VendorSidebar activeTab="performance" />
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Account Health</h1>
          <p className="text-gray-500 mb-6">Monitor your seller performance metrics</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Seller Rating</p><p className="text-3xl font-bold text-yellow-500">{health.rating} ★</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Response Time</p><p className="text-3xl font-bold text-green-600">{health.responseTime}</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Cancellation Rate</p><p className="text-3xl font-bold text-orange-500">{health.cancellationRate}</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"><p className="text-sm text-gray-500">Valid Tracking Rate</p><p className="text-3xl font-bold text-green-600">{health.validTrackingRate}</p></div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200"><h2 className="font-semibold">Customer Feedback</h2></div>
            <div className="divide-y">
              {health.customerFeedback.map(feedback => (
                <div key={feedback.id} className="p-5"><div className="flex justify-between items-start"><div><div className="flex text-yellow-400">{'★'.repeat(feedback.rating)}{'☆'.repeat(5-feedback.rating)}</div><p className="font-medium mt-1">{feedback.customer}</p><p className="text-sm text-gray-600 mt-1">{feedback.comment}</p></div><p className="text-xs text-gray-400">{feedback.date}</p></div></div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"><p className="text-sm text-blue-800">✅ Your account is in good standing. Keep up the good work!</p></div>
        </div>
      </main>
    </div>
  );
}
export default VendorAccountHealth;
