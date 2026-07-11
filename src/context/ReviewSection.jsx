import { useState, useEffect, useCallback } from 'react';
import { useReviews } from '../context/ReviewContext';
import { useAuth } from '../context/AuthContext';
import QuickRating from './QuickRating';
import RatingStars from './RatingStars';
import RatingSummary from './RatingSummary';

const ReviewSection = ({ productId }) => {
  const { user } = useAuth();
  const { 
    fetchProductReviews,
    getProductReviews, 
    getAverageRating, 
    getReviewCount,
    getRatingDistribution,
    getRatingOnlyCount,
    getReviewWithCommentCount,
    canUserReview,
    uploadReviewMedia,
    addReview,
    markHelpful,
    deleteOwnReview
  } = useReviews();
  
  // ===== STATES =====
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(5);
  const [canReviewStatus, setCanReviewStatus] = useState({ canReview: false, alreadyReviewed: false, orderId: null });
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedReviews, setExpandedReviews] = useState({});
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  
  // ===== FETCH REVIEWS =====
  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      await fetchProductReviews(productId);
      setLoading(false);
    };
    loadReviews();
  }, [productId, fetchProductReviews]);
  
  // ===== CHECK ELIGIBILITY =====
  useEffect(() => {
    const checkEligibility = async () => {
      if (!user) {
        setCheckingEligibility(false);
        return;
      }
      setCheckingEligibility(true);
      const result = await canUserReview(productId);
      setCanReviewStatus(result);
      setCheckingEligibility(false);
    };
    checkEligibility();
  }, [productId, user, canUserReview]);
  
  // ===== GET DATA =====
  const reviews = getProductReviews(productId);
  const averageRating = getAverageRating(productId);
  const totalReviews = getReviewCount(productId);
  const ratingCounts = getRatingDistribution(productId);
  const ratingOnlyCount = getRatingOnlyCount(productId);
  const reviewWithCommentCount = getReviewWithCommentCount(productId);
  
  const canReview = user && canReviewStatus.canReview && !canReviewStatus.alreadyReviewed;
  
  // Check if user has pending review
  const hasPendingReview = reviews.some(
    r => r.userId?._id === user?.id && r.status === 'pending'
  );
  
  // ===== FILTER REVIEWS =====
  const filteredReviews = reviews.filter(review => {
    if (filter === 'with_images') return review.images && review.images.length > 0;
    if (filter === 'rating_only') return review.isRatingOnly === true;
    if (filter === 'with_comment') return review.isRatingOnly === false && review.comment && review.comment.length > 0;
    if (filter === '5') return review.rating === 5;
    if (filter === '4') return review.rating === 4;
    if (filter === '3') return review.rating === 3;
    if (filter === '2') return review.rating === 2;
    if (filter === '1') return review.rating === 1;
    return true;
  });
  
  // ===== SORT REVIEWS =====
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch(sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'helpful':
        return (b.helpful || 0) - (a.helpful || 0);
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });
  
  // ===== PAGINATION =====
  const visibleReviews = sortedReviews.slice(0, visibleCount);
  const hasMore = visibleCount < sortedReviews.length;
  
  const loadMore = () => {
    setVisibleCount(prev => prev + 5);
  };
  
  // ===== IMAGE HANDLERS =====
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    const maxSize = 5 * 1024 * 1024;
    const oversized = files.some(f => f.size > maxSize);
    if (oversized) {
      alert('Each image must be less than 5MB');
      return;
    }
    
    if (images.length + files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }
    
    setUploadingImages(true);
    try {
      const uploadedUrls = await uploadReviewMedia(files);
      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      alert('Failed to upload images: ' + error.message);
    } finally {
      setUploadingImages(false);
    }
  };
  
  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };
  
  // ===== SUBMIT REVIEW =====
  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      alert('Please enter your review');
      return;
    }
    if (comment.length < 10) {
      alert('Review must be at least 10 characters');
      return;
    }
    
    setSubmitting(true);
    try {
      const result = await addReview(
        productId, 
        canReviewStatus.orderId,
        rating, 
        title, 
        comment, 
        images, 
        [],
        false // isRatingOnly = false (full review)
      );
      
      if (result.success) {
        setRating(0);
        setTitle('');
        setComment('');
        setImages([]);
        setShowReviewForm(false);
        setReviewSubmitted(true);
        setTimeout(() => setReviewSubmitted(false), 5000);
        await fetchProductReviews(productId);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to submit review: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  // ===== MARK HELPFUL =====
  const handleMarkHelpful = async (reviewId) => {
    if (!user) {
      alert('Please login to mark reviews as helpful');
      return;
    }
    await markHelpful(productId, reviewId);
  };
  
  // ===== DELETE OWN REVIEW =====
  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete your review?')) return;
    const success = await deleteOwnReview(reviewId, productId);
    if (success) {
      alert('Review deleted successfully');
      await fetchProductReviews(productId);
    } else {
      alert('Failed to delete review');
    }
  };
  
  // ===== TOGGLE EXPAND =====
  const toggleExpand = (reviewId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };
  
  // ===== RATING SUBMITTED CALLBACK =====
  const handleRatingSubmitted = async () => {
    await fetchProductReviews(productId);
  };
  
  // ===== LOADING =====
  if (loading && !reviews.length) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // ===== SUBMITTED =====
  if (reviewSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="text-5xl mb-3">📝</div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">Review Submitted!</h3>
        <p className="text-green-700">Thank you for your review. It is now pending admin approval and will appear here once approved.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8" id="reviews">
      {/* ===== RATING SUMMARY ===== */}
      <RatingSummary 
        averageRating={averageRating}
        totalReviews={totalReviews}
        ratingCounts={ratingCounts}
        onFilterChange={(rating) => {
          if (rating) {
            setFilter(rating.toString());
          } else {
            setFilter('all');
          }
        }}
      />
      
      {/* ===== STATS: Rating Only vs Full Reviews ===== */}
      {totalReviews > 0 && (
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
          <span>📊 {totalReviews} total ratings</span>
          <span>•</span>
          <span>⭐ {ratingOnlyCount} quick ratings</span>
          <span>•</span>
          <span>📝 {reviewWithCommentCount} written reviews</span>
        </div>
      )}
      
      {/* ===== PENDING REVIEW BANNER ===== */}
      {hasPendingReview && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-yellow-700 text-sm">
            ⏳ You have a pending review awaiting admin approval.
          </p>
        </div>
      )}
      
      {/* ===== QUICK RATING + WRITE REVIEW BUTTONS ===== */}
      {!checkingEligibility && canReview && !showReviewForm && (
        <div className="flex flex-wrap items-center gap-4">
          {/* ✅ Quick Rating Component */}
          <QuickRating 
            productId={productId}
            onRatingSubmitted={handleRatingSubmitted}
            buttonText="⭐ Rate Now"
            showPopup={true}
          />
          
          {/* ✅ Write Review Button */}
          <button
            onClick={() => setShowReviewForm(true)}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2.5 rounded-lg hover:shadow-lg transition text-sm font-medium"
          >
            ✍️ Write a Review
          </button>
        </div>
      )}
      
      {/* ===== REVIEW FORM ===== */}
      {showReviewForm && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Write Your Review</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating *</label>
            <RatingStars 
              rating={rating}
              size="2xl"
              interactive={true}
              onRatingChange={setRating}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Review Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-200"
              maxLength="100"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Review *</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              placeholder="Share your experience with this product"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-200"
            />
            <p className="text-xs text-gray-400 mt-1">
              {comment.length}/2000 characters {comment.length < 10 && comment.length > 0 && (
                <span className="text-red-500"> (Minimum 10 characters)</span>
              )}
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Add Images (Optional, Max 5)</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={img} alt={`Review ${idx}`} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeImage(idx)} 
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="reviewImageUpload" />
            <label 
              htmlFor="reviewImageUpload" 
              className={`inline-block px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition text-sm ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {uploadingImages ? '📤 Uploading...' : '📸 Upload Images'}
            </label>
            <p className="text-xs text-gray-400 mt-1">Max 5 images, up to 5MB each</p>
          </div>
          
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <span>⏳</span> Your review will be reviewed by admin before being published.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleSubmitReview} 
              disabled={submitting || comment.length < 10} 
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button 
              onClick={() => setShowReviewForm(false)} 
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* ===== REVIEWS LIST ===== */}
      <div className="space-y-4">
        {/* Header with Sort */}
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-gray-800">
            Customer Reviews ({filteredReviews.length})
          </h3>
          <div className="flex gap-2 flex-wrap">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="helpful">Most Helpful</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => setFilter('all')} 
            className={`px-3 py-1 rounded-full text-xs transition ${filter === 'all' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('with_images')} 
            className={`px-3 py-1 rounded-full text-xs transition ${filter === 'with_images' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            📷 With Images
          </button>
          <button 
            onClick={() => setFilter('with_comment')} 
            className={`px-3 py-1 rounded-full text-xs transition ${filter === 'with_comment' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            📝 With Comments
          </button>
          <button 
            onClick={() => setFilter('rating_only')} 
            className={`px-3 py-1 rounded-full text-xs transition ${filter === 'rating_only' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            ⭐ Quick Ratings
          </button>
          <button 
            onClick={() => setFilter('5')} 
            className={`px-3 py-1 rounded-full text-xs transition ${filter === '5' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            5 ★
          </button>
          <button 
            onClick={() => setFilter('4')} 
            className={`px-3 py-1 rounded-full text-xs transition ${filter === '4' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            4 ★
          </button>
          <button 
            onClick={() => setFilter('3')} 
            className={`px-3 py-1 rounded-full text-xs transition ${filter === '3' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            3 ★
          </button>
        </div>
        
        {/* No Reviews */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-5xl mb-3">📝</div>
            <p className="text-gray-500">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <>
            {/* Review Cards */}
            {visibleReviews.map((review) => {
              const isExpanded = expandedReviews[review._id] || false;
              const isLongComment = review.comment && review.comment.length > 200;
              const isOwnReview = user && review.userId?._id === user.id;
              const isRatingOnly = review.isRatingOnly === true;
              
              return (
                <div key={review._id} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition">
                  <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <RatingStars rating={review.rating} size="sm" />
                        
                        {isRatingOnly && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            ⭐ Quick Rating
                          </span>
                        )}
                        
                        {review.isVerifiedPurchase && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            ✓ Verified
                          </span>
                        )}
                        
                        {review.status === 'pending' && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            ⏳ Pending
                          </span>
                        )}
                      </div>
                      {review.title && <h4 className="font-semibold text-gray-800">{review.title}</h4>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800">{review.userId?.name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {/* Comment - Show only if not rating only */}
                  {!isRatingOnly && review.comment && (
                    <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                      {isLongComment && !isExpanded 
                        ? `${review.comment.substring(0, 200)}...` 
                        : review.comment
                      }
                      {isLongComment && (
                        <button 
                          onClick={() => toggleExpand(review._id)}
                          className="text-pink-500 hover:text-pink-600 text-xs font-medium ml-1"
                        >
                          {isExpanded ? 'Show Less' : 'Read More'}
                        </button>
                      )}
                    </p>
                  )}
                  
                  {/* Images with Lightbox */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {review.images.map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt={`Review ${idx}`} 
                          className="w-20 h-20 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition hover:scale-105"
                          onClick={() => setSelectedImage(img)}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {!isRatingOnly && (
                      <button 
                        onClick={() => handleMarkHelpful(review._id)} 
                        className="text-sm text-gray-500 hover:text-pink-600 transition flex items-center gap-1"
                      >
                        👍 Helpful ({review.helpful || 0})
                      </button>
                    )}
                    
                    {isOwnReview && review.status === 'pending' && (
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        className="text-sm text-red-500 hover:text-red-600 transition flex items-center gap-1"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Load More Button */}
            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full py-3 text-pink-600 hover:text-pink-700 text-sm font-medium border border-pink-200 rounded-lg hover:bg-pink-50 transition"
              >
                Load More Reviews ({visibleCount} of {sortedReviews.length})
              </button>
            )}
          </>
        )}
      </div>
      
      {/* ===== IMAGE LIGHTBOX ===== */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-[90%] max-h-[90%]">
            <img 
              src={selectedImage} 
              alt="Review" 
              className="max-w-full max-h-[90vh] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full text-white text-2xl flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
