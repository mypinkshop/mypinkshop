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
  const [filteredPending, setFilteredPending] = useState([]);
  const [filteredApproved, setFilteredApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadReviews();
    loadProducts();
  }, [navigate]);

  const loadProducts = () => {
    const allProducts = JSON.parse(localStorage.getItem('adminProductsList') || '[]');
    const approvedProducts = allProducts.filter(p => p.adminApproved === true && p.status === 'active');
    setProducts(approvedProducts);
  };

  const loadReviews = () => {
    const pending = getAllPendingReviews();
    const approved = getAllApprovedReviews();
    setPendingReviews(pending);
    setApprovedReviews(approved);
    setFilteredPending(pending);
    setFilteredApproved(approved);
    setLoading(false);
  };

  useEffect(() => {
    let filtered = [...(activeTab === 'pending' ? pendingReviews : approvedReviews)];
    
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterRating !== 'all') {
      filtered = filtered.filter(r => r.rating === parseInt(filterRating));
    }
    
    if (activeTab === 'pending') {
      setFilteredPending(filtered);
    } else {
      setFilteredApproved(filtered);
    }
  }, [searchTerm, filterRating, activeTab, pendingReviews, approvedReviews]);

  const getProductName = (productId) => {
    const product = products.find(p => p.id == productId);
    return product?.name || `Product #${productId}`;
  };

  const getProductBrand = (productId) => {
    const product = products.find(p => p.id == productId);
    return product?.brand || 'Unknown';
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const currentData = activeTab === 'pending' ? filteredPending : filteredApproved;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="ml-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Review Management</h1>
              <p className="text-sm text-gray-500">Manage customer reviews and ratings across all brands</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search by customer or review..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-pink-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
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
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-500">
              <p className="text-sm text-gray-500">Avg Rating</p>
              <p className="text-2xl font-bold text-purple-600">
                {approvedReviews.length > 0 
                  ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
                  : '0'}
                ★
              </p>
            </div>
          </div>

          {/* Filters Row */}
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
                  <option value="5">5 ★ (Excellent)</option>
                  <option value="4">4 ★ (Good)</option>
                  <option value="3">3 ★ (Average)</option>
                  <option value="2">2 ★ (Poor)</option>
                  <option value="1">1 ★ (Bad)</option>
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
                  Showing {currentData.length} of {activeTab === 'pending' ? pendingReviews.length : approvedReviews.length} reviews
                </span>
              )}
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

          {/* Reviews Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Product / Brand</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-center">Rating</th>
                    <th className="px-4 py-3 text-left">Review</th>
                    <th className="px-4 py-3 text-center">Date</th>
                    {activeTab === 'approved' && <th className="px-4 py-3 text-center">Helpful</th>}
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'approved' ? 7 : 6} className="px-4 py-12 text-center text-gray-400">
                        <div className="text-5xl mb-3">⭐</div>
                        <p>No {activeTab} reviews found</p>
                        {(searchTerm || filterRating !== 'all') && (
                          <button onClick={clearFilters} className="mt-2 text-pink-500 text-sm hover:underline">Clear filters</button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    currentData.map((review) => (
                      <tr key={review.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-800">{getProductName(review.productId)}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Brand: {getProductBrand(review.productId)}</p>
                            <p className="text-xs text-gray-400">ID: #{review.productId}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-800">{review.userName}</p>
                            <p className="text-xs text-gray-400">{review.userEmail}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRatingBadge(review.rating)}`}>
                              {review.rating} ★
                            </span>
                            <span className="text-xs text-gray-400 mt-1">{getStars(review.rating)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{review.title}</p>
                            <p className="text-gray-500 text-xs line-clamp-2 max-w-[200px] mt-0.5">{review.comment}</p>
                            {review.images && review.images.length > 0 && (
                              <span className="text-xs text-blue-500 mt-1 inline-flex items-center gap-1">📸 {review.images.length} images</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500 text-xs">
                          {new Date(review.date).toLocaleDateString()}
                        </td>
                        {activeTab === 'approved' && (
                          <td className="px-4 py-3 text-center">{review.helpful || 0} 👍</td>
                        )}
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            {activeTab === 'pending' ? (
                              <>
                                <button onClick={() => handleApprove(review.id)} className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition" title="Approve">✓</button>
                                <button onClick={() => handleReject(review.id)} className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition" title="Reject">✗</button>
                                <button onClick={() => { setSelectedReview(review); setShowDetails(true); }} className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition" title="View">👁️</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => handleDelete(review.productId, review.id)} className="text-red-500 hover:text-red-700 transition" title="Delete">🗑️</button>
                                <button onClick={() => { setSelectedReview(review); setShowDetails(true); }} className="text-blue-500 hover:text-blue-700 transition" title="View">👁️</button>
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

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Showing {currentData.length} of {activeTab === 'pending' ? pendingReviews.length : approvedReviews.length} reviews
            </p>
          </div>
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
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Product</p>
                <p className="font-medium">{getProductName(selectedReview.productId)}</p>
                <p className="text-xs text-gray-400 mt-1">Brand: {getProductBrand(selectedReview.productId)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="font-medium">{selectedReview.userName}</p>
                <p className="text-xs text-gray-400">{selectedReview.userEmail}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Rating</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRatingBadge(selectedReview.rating)}`}>
                    {selectedReview.rating} ★
                  </span>
                  <span className="text-yellow-500">{getStars(selectedReview.rating)}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Title</p>
                <p className="font-medium">{selectedReview.title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Review</p>
                <p className="text-gray-600 text-sm">{selectedReview.comment}</p>
              </div>
              {selectedReview.images && selectedReview.images.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Images ({selectedReview.images.length})</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedReview.images.map((img, idx) => (
                      <img key={idx} src={img} alt={`Review ${idx}`} className="w-20 h-20 rounded-lg object-cover border" />
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t">
                {activeTab === 'pending' ? (
                  <>
                    <button onClick={() => { handleApprove(selectedReview.id); setShowDetails(false); }} className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">Approve</button>
                    <button onClick={() => { handleReject(selectedReview.id); setShowDetails(false); }} className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">Reject</button>
                  </>
                ) : (
                  <button onClick={() => { handleDelete(selectedReview.productId, selectedReview.id); setShowDetails(false); }} className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">Delete</button>
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
