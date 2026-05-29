import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import { useReviews } from '../../context/ReviewContext';

function AdminReviews() {
  const navigate = useNavigate();
  const { 
    getAllPendingReviews, 
    getAllApprovedReviews,
    approveReview, 
    rejectReview,
    deleteReview 
  } = useReviews();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingReviews, setPendingReviews] = useState([]);
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadReviews();
  }, [navigate]);

  const loadReviews = () => {
    const pending = getAllPendingReviews();
    const approved = getAllApprovedReviews();
    setPendingReviews(pending);
    setApprovedReviews(approved);
    setLoading(false);
  };

  const handleApprove = (reviewId) => {
    if (window.confirm('Approve this review?')) {
      approveReview(reviewId);
      loadReviews();
      alert('✓ Review approved successfully!');
    }
  };

  const handleReject = (reviewId) => {
    if (window.confirm('Reject this review?')) {
      rejectReview(reviewId);
      loadReviews();
      alert('✗ Review rejected');
    }
  };

  const handleDelete = (productId, reviewId) => {
    if (window.confirm('Delete this review permanently?')) {
      deleteReview(productId, reviewId);
      loadReviews();
      alert('🗑 Review deleted');
    }
  };

  const getStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="ml-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800">Review Management</h1>
          <p className="text-sm text-gray-500">Manage customer reviews and ratings</p>
        </div>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-yellow-500">
              <p className="text-sm text-gray-500">Pending Reviews</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingReviews.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
              <p className="text-sm text-gray-500">Approved Reviews</p>
              <p className="text-2xl font-bold text-green-600">{approvedReviews.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
              <p className="text-sm text-gray-500">Total Reviews</p>
              <p className="text-2xl font-bold text-blue-600">{pendingReviews.length + approvedReviews.length}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'pending' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}
            >
              Pending ({pendingReviews.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'approved' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}
            >
              Approved ({approvedReviews.length})
            </button>
          </div>

          {/* Pending Reviews Table */}
          {activeTab === 'pending' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left">Product</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-center">Rating</th>
                      <th className="px-4 py-3 text-left">Review</th>
                      <th className="px-4 py-3 text-center">Date</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pendingReviews.length === 0 ? (
                      <tr className="hover:bg-gray-50">
                        <td colSpan="6" className="px-4 py-12 text-center text-gray-400">
                          No pending reviews
                        </td>
                       </tr>
                    ) : (
                      pendingReviews.map((review) => (
                        <tr key={review.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-800">Product #{review.productId}</p>
                              <p className="text-xs text-gray-400 truncate max-w-[150px]">{review.title}</p>
                            </div>
                           </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-800">{review.userName}</p>
                              <p className="text-xs text-gray-400">{review.userEmail}</p>
                            </div>
                           </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center">
                              <span className="text-yellow-500">{getStars(review.rating)}</span>
                            </div>
                           </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-600 line-clamp-2 max-w-[200px]">{review.comment}</p>
                            {review.images && review.images.length > 0 && (
                              <span className="text-xs text-blue-500 mt-1">📸 {review.images.length} images</span>
                            )}
                           </td>
                          <td className="px-4 py-3 text-center text-gray-500 text-xs">
                            {new Date(review.date).toLocaleDateString()}
                           </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleApprove(review.id)} className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition">Approve</button>
                              <button onClick={() => handleReject(review.id)} className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition">Reject</button>
                              <button onClick={() => { setSelectedReview(review); setShowDetails(true); }} className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition">View</button>
                            </div>
                           </td>
                         </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Approved Reviews Table */}
          {activeTab === 'approved' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left">Product</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-center">Rating</th>
                      <th className="px-4 py-3 text-left">Review</th>
                      <th className="px-4 py-3 text-center">Date</th>
                      <th className="px-4 py-3 text-center">Helpful</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y">
                    {approvedReviews.length === 0 ? (
                      <tr className="hover:bg-gray-50">
                        <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                          No approved reviews
                        </td>
                       </tr>
                    ) : (
                      approvedReviews.map((review) => (
                        <tr key={review.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-800">Product #{review.productId}</p>
                              <p className="text-xs text-gray-400 truncate max-w-[150px]">{review.title}</p>
                            </div>
                           </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-800">{review.userName}</p>
                              <p className="text-xs text-gray-400">{review.userEmail}</p>
                            </div>
                           </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center">
                              <span className="text-yellow-500">{getStars(review.rating)}</span>
                            </div>
                           </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-600 line-clamp-2 max-w-[200px]">{review.comment}</p>
                           </td>
                          <td className="px-4 py-3 text-center text-gray-500 text-xs">
                            {new Date(review.date).toLocaleDateString()}
                           </td>
                          <td className="px-4 py-3 text-center">{review.helpful || 0}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleDelete(review.productId, review.id)} className="text-red-500 hover:text-red-700">🗑 Delete</button>
                            </div>
                           </td>
                         </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Details Modal */}
      {showDetails && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Review Details</h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{selectedReview.userName}</p>
                <p className="text-xs text-gray-400">{selectedReview.userEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <div className="text-yellow-500 text-lg">{getStars(selectedReview.rating)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Title</p>
                <p className="font-medium">{selectedReview.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Review</p>
                <p className="text-gray-600">{selectedReview.comment}</p>
              </div>
              {selectedReview.images && selectedReview.images.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Images</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedReview.images.map((img, idx) => (
                      <img key={idx} src={img} alt={`Review ${idx}`} className="w-20 h-20 rounded-lg object-cover border" />
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                {activeTab === 'pending' && (
                  <>
                    <button onClick={() => { handleApprove(selectedReview.id); setShowDetails(false); }} className="flex-1 bg-green-500 text-white py-2 rounded-lg">Approve</button>
                    <button onClick={() => { handleReject(selectedReview.id); setShowDetails(false); }} className="flex-1 bg-red-500 text-white py-2 rounded-lg">Reject</button>
                  </>
                )}
                <button onClick={() => setShowDetails(false)} className="flex-1 border border-gray-300 py-2 rounded-lg">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReviews;
