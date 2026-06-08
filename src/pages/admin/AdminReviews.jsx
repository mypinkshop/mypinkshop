import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import { useReviews } from '../../context/ReviewContext';

function AdminReviews() {
  const navigate = useNavigate();
  const { 
    fetchPendingReviews,
    fetchAllReviews,
    approveReview, 
    rejectReview, 
    deleteReview 
  } = useReviews();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionReviewId, setActionReviewId] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  
  const API_URL = 'https://api.mypinkshop.com';
  const getToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token');

  // Auth check
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }
  }, [navigate]);

  // Load reviews based on active tab
  const loadReviews = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    try {
      let data;
      if (activeTab === 'pending') {
        const response = await fetch(`${API_URL}/api/reviews/admin/pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        data = await response.json();
        setReviews(data);
        setTotalReviews(data.length);
        setTotalPages(1);
      } else {
        const response = await fetch(`${API_URL}/api/reviews/admin/all?status=${activeTab}&page=${currentPage}&limit=20`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        data = await response.json();
        setReviews(data.reviews || []);
        setTotalReviews(data.total || 0);
        setTotalPages(data.pages || 1);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, navigate]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const userName = review.userId?.name?.toLowerCase() || '';
      const userEmail = review.userId?.email?.toLowerCase() || '';
      const productName = review.productId?.name?.toLowerCase() || '';
      const comment = review.comment?.toLowerCase() || '';
      if (!userName.includes(searchLower) && !userEmail.includes(searchLower) && 
          !productName.includes(searchLower) && !comment.includes(searchLower)) {
        return false;
      }
    }
    if (filterRating !== 'all' && review.rating !== parseInt(filterRating)) {
      return false;
    }
    return true;
  });

  const handleApprove = async (reviewId) => {
    setActionLoading(true);
    const success = await approveReview(reviewId, adminNote);
    if (success) {
      await loadReviews();
      alert('✅ Review approved successfully!');
    } else {
      alert('❌ Failed to approve review');
    }
    setActionLoading(false);
    setShowNoteModal(false);
    setAdminNote('');
  };

  const handleReject = async (reviewId) => {
    setActionLoading(true);
    const success = await rejectReview(reviewId, adminNote);
    if (success) {
      await loadReviews();
      alert('❌ Review rejected');
    } else {
      alert('❌ Failed to reject review');
    }
    setActionLoading(false);
    setShowNoteModal(false);
    setAdminNote('');
  };

  const handleDelete = async (reviewId, productId) => {
    if (!window.confirm('Delete this review permanently? This action cannot be undone.')) return;
    
    setActionLoading(true);
    const success = await deleteReview(reviewId, productId);
    if (success) {
      await loadReviews();
      alert('🗑 Review deleted successfully');
    } else {
      alert('❌ Failed to delete review');
    }
    setActionLoading(false);
  };

  const openActionModal = (reviewId, type) => {
    setActionReviewId(reviewId);
    setActionType(type);
    setAdminNote('');
    setShowNoteModal(true);
  };

  const getStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getRatingBadge = (rating) => {
    const colors = {
      5: 'bg-green-100 text-green-700',
      4: 'bg-blue-100 text-blue-700',
      3: 'bg-yellow-100 text-yellow-700',
      2: 'bg-orange-100 text-orange-700',
      1: 'bg-red-100 text-red-700'
    };
    return colors[rating] || 'bg-gray-100 text-gray-700';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterRating('all');
    setCurrentPage(1);
  };

  // Stats
  const pendingCount = reviews.filter(r => r.status === 'pending').length;
  const approvedCount = reviews.filter(r => r.status === 'approved').length;
  const rejectedCount = reviews.filter(r => r.status === 'rejected').length;
  const avgRating = approvedCount > 0 
    ? (reviews.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.rating, 0) / approvedCount).toFixed(1)
    : '0';

  if (loading && !reviews.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="md:ml-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-40 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">📝 Review Management</h1>
              <p className="text-sm text-gray-500">Manage customer reviews and ratings</p>
            </div>
            <div className="relative w-full sm:w-64">
              <input 
                type="text" 
                placeholder="Search by customer, product..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-200"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
              <p className="text-xs text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
              <p className="text-xs text-gray-500">Avg Rating</p>
              <p className="text-2xl font-bold text-purple-600">{avgRating} ★</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Rating:</span>
                <select 
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-pink-500"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 ★</option>
                  <option value="4">4 ★</option>
                  <option value="3">3 ★</option>
                  <option value="2">2 ★</option>
                  <option value="1">1 ★</option>
                </select>
              </div>
              
              <button
                onClick={clearFilters}
                className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition"
              >
                Clear Filters
              </button>
              
              {(searchTerm || filterRating !== 'all') && (
                <span className="text-xs text-gray-400">
                  Showing {filteredReviews.length} of {reviews.length} reviews
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto">
            <button
              onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
              className={`px-4 py-2 text-sm font-medium transition whitespace-nowrap ${activeTab === 'pending' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => { setActiveTab('approved'); setCurrentPage(1); }}
              className={`px-4 py-2 text-sm font-medium transition whitespace-nowrap ${activeTab === 'approved' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => { setActiveTab('rejected'); setCurrentPage(1); }}
              className={`px-4 py-2 text-sm font-medium transition whitespace-nowrap ${activeTab === 'rejected' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Rejected ({rejectedCount})
            </button>
            <button
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              className={`px-4 py-2 text-sm font-medium transition whitespace-nowrap ${activeTab === 'all' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All ({reviews.length})
            </button>
          </div>

          {/* Reviews Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Product / Customer</th>
                    <th className="px-4 py-3 text-center">Rating</th>
                    <th className="px-4 py-3 text-left">Review</th>
                    <th className="px-4 py-3 text-center">Date</th>
                    {activeTab === 'approved' && <th className="px-4 py-3 text-center">Helpful</th>}
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredReviews.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'approved' ? 6 : 5} className="px-4 py-12 text-center text-gray-400">
                        <div className="text-5xl mb-3">⭐</div>
                        <p>No {activeTab} reviews found</p>
                        {(searchTerm || filterRating !== 'all') && (
                          <button onClick={clearFilters} className="mt-2 text-pink-500 text-sm hover:underline">Clear filters</button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredReviews.map((review) => (
                      <tr key={review._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 text-sm">{review.productId?.name || 'Unknown Product'}</p>
                          <p className="text-xs text-gray-500 mt-0.5">by {review.userId?.name || review.userId?.email || 'Anonymous'}</p>
                          <p className="text-[10px] text-gray-400">{review.productId?.brand || ''}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRatingBadge(review.rating)}`}>
                            {review.rating} ★
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800 text-sm">{review.title || 'No title'}</p>
                          <p className="text-gray-500 text-xs line-clamp-2 max-w-[250px] mt-0.5">{review.comment}</p>
                          {review.images?.length > 0 && (
                            <span className="text-xs text-blue-500 mt-1 inline-flex items-center gap-1">📸 {review.images.length} images</span>
                          )}
                          {review.isVerifiedPurchase && (
                            <span className="text-xs text-green-600 ml-2">✓ Verified</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500 text-xs">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </td>
                        {activeTab === 'approved' && (
                          <td className="px-4 py-3 text-center">{review.helpful || 0} 👍</td>
                        )}
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            {activeTab === 'pending' ? (
                              <>
                                <button 
                                  onClick={() => openActionModal(review._id, 'approve')} 
                                  disabled={actionLoading}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition disabled:opacity-50" 
                                  title="Approve"
                                >
                                  ✓
                                </button>
                                <button 
                                  onClick={() => openActionModal(review._id, 'reject')} 
                                  disabled={actionLoading}
                                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition disabled:opacity-50" 
                                  title="Reject"
                                >
                                  ✗
                                </button>
                                <button 
                                  onClick={() => { setSelectedReview(review); setShowDetails(true); }} 
                                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition" 
                                  title="View"
                                >
                                  👁️
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleDelete(review._id, review.productId?._id)} 
                                  disabled={actionLoading}
                                  className="text-red-500 hover:text-red-700 transition disabled:opacity-50" 
                                  title="Delete"
                                >
                                  🗑️
                                </button>
                                <button 
                                  onClick={() => { setSelectedReview(review); setShowDetails(true); }} 
                                  className="text-blue-500 hover:text-blue-700 transition" 
                                  title="View"
                                >
                                  👁️
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Showing {filteredReviews.length} of {reviews.length} reviews
            </p>
          </div>
        </div>
      </div>

      {/* Admin Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNoteModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-4">
              <h3 className="text-lg font-semibold">{actionType === 'approve' ? 'Approve' : 'Reject'} Review</h3>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium mb-2">Admin Note (Optional)</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows="3"
                placeholder="Add a note for the customer..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-pink-500"
              />
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => actionType === 'approve' ? handleApprove(actionReviewId) : handleReject(actionReviewId)}
                  disabled={actionLoading}
                  className={`flex-1 py-2 rounded-lg text-white ${actionType === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} disabled:opacity-50`}
                >
                  {actionLoading ? 'Processing...' : (actionType === 'approve' ? '✓ Approve' : '✗ Reject')}
                </button>
                <button onClick={() => setShowNoteModal(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Details Modal */}
      {showDetails && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Review Details</h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Product</p>
                <p className="font-medium">{selectedReview.productId?.name || 'Unknown Product'}</p>
                <p className="text-xs text-gray-400 mt-1">{selectedReview.productId?.brand || ''}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="font-medium">{selectedReview.userId?.name || 'Anonymous'}</p>
                <p className="text-xs text-gray-400">{selectedReview.userId?.email || ''}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Rating</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRatingBadge(selectedReview.rating)}`}>
                    {selectedReview.rating} ★
                  </span>
                  <span className="text-yellow-500 text-sm">{getStars(selectedReview.rating)}</span>
                </div>
              </div>
              {selectedReview.title && (
                <div>
                  <p className="text-xs text-gray-500">Title</p>
                  <p className="font-medium">{selectedReview.title}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Review</p>
                <p className="text-gray-600 text-sm">{selectedReview.comment}</p>
              </div>
              {selectedReview.images?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Images ({selectedReview.images.length})</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedReview.images.map((img, idx) => (
                      <img key={idx} src={img} alt={`Review ${idx}`} className="w-20 h-20 rounded-lg object-cover border" />
                    ))}
                  </div>
                </div>
              )}
              {selectedReview.adminNote && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-600">Admin Note</p>
                  <p className="text-sm text-blue-700">{selectedReview.adminNote}</p>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t">
                {selectedReview.status === 'pending' ? (
                  <>
                    <button 
                      onClick={() => { openActionModal(selectedReview._id, 'approve'); setShowDetails(false); }} 
                      className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => { openActionModal(selectedReview._id, 'reject'); setShowDetails(false); }} 
                      className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => { handleDelete(selectedReview._id, selectedReview.productId?._id); setShowDetails(false); }} 
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                  >
                    Delete Review
                  </button>
                )}
                <button onClick={() => setShowDetails(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReviews;
