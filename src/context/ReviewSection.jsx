import { useState, useEffect, useCallback } from 'react';
import { useReviews } from '../context/ReviewContext';
import { useAuth } from '../context/AuthContext';
import QuickRating from './QuickRating';

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
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(5);
  const [canReviewStatus, setCanReviewStatus] = useState({ canReview: false, alreadyReviewed: false, orderId: null });
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedReviews, setExpandedReviews] = useState({});
  
  // ===== FETCH REVIEWS =====
  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      await fetchProductReviews(productId);
      setLoading(false);
    };
    if (productId) loadReviews();
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
      setCanReviewStatus(result || {});
      setCheckingEligibility(false);
    };
    checkEligibility();
  }, [productId, user, canUserReview]);
  
  // ===== GET DATA =====
  const reviews = getProductReviews(productId) || [];
  const averageRating = getAverageRating(productId) || 0;
  const totalReviews = getReviewCount(productId) || 0;
  const ratingCounts = getRatingDistribution(productId) || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const ratingOnlyCount = getRatingOnlyCount(productId) || 0;
  const reviewWithCommentCount = getReviewWithCommentCount(productId) || 0;
  
  const canReview = user && canReviewStatus.canReview && !canReviewStatus.alreadyReviewed;
  
  const hasPendingReview = reviews.some(
    r => (r.userId === user?.id || r.user_id === user?.id) && r.status === 'pending'
  );
  
  // ===== FILTER =====
  const filteredReviews = reviews.filter(review => {
    if (filter === 'with_images') return review.images && review.images.length > 0;
    if (filter === 'rating_only') return review.isRatingOnly === true;
    if (filter === 'with_comment') return review.isRatingOnly === false && review.comment && review.comment.length > 0;
    if (['5','4','3','2','1'].includes(filter)) return review.rating === parseInt(filter);
    return true;
  });
  
  // ===== SORT =====
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.created_at);
    const dateB = new Date(b.createdAt || b.created_at);
    switch(sortBy) {
      case 'newest': return dateB - dateA;
      case 'oldest': return dateA - dateB;
      case 'helpful': return (b.helpful || b.helpful_count || 0) - (a.helpful || a.helpful_count || 0);
      case 'highest': return b.rating - a.rating;
      case 'lowest': return a.rating - b.rating;
      default: return 0;
    }
  });
  
  const visibleReviews = sortedReviews.slice(0, visibleCount);
  const hasMore = visibleCount < sortedReviews.length;
  
  // ===== IMAGE HANDLERS =====
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024;
    if (files.some(f => f.size > maxSize)) {
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
  
  const removeImage = (index) => setImages(images.filter((_, i) => i !== index));
  
  // ===== SUBMIT REVIEW =====
  const handleSubmitReview = async () => {
    if (rating === 0) return alert('Please select a rating');
    if (!comment.trim()) return alert('Please enter your review');
    if (comment.length < 10) return alert('Review must be at least 10 characters');
    
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
        false
      );
      
      if (result.success) {
        setRating(0);
        setTitle('');
        setComment('');
        setImages([]);
        setShowReviewForm(false);
        alert('✅ Review submitted! Awaiting admin approval.');
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
  
  // ===== HELPFUL =====
  const handleMarkHelpful = async (reviewId) => {
    if (!user) return alert('Please login to mark reviews as helpful');
    await markHelpful(productId, reviewId);
  };
  
  // ===== DELETE OWN REVIEW =====
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    const success = await deleteOwnReview(reviewId, productId);
    if (success) {
      alert('Review deleted successfully');
      await fetchProductReviews(productId);
    } else {
      alert('Failed to delete review');
    }
  };
  
  const toggleExpand = (reviewId) => {
    setExpandedReviews(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };
  
  // ===== LOADING SKELETON =====
  if (loading && !reviews.length) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 bg-pink-50 rounded-3xl"></div>
        <div className="h-32 bg-pink-50 rounded-3xl"></div>
        <div className="h-32 bg-pink-50 rounded-3xl"></div>
      </div>
    );
  }
  
  // ===== EMPTY STATE =====
  if (totalReviews === 0 && !canReview && !checkingEligibility) {
    return (
      <div className="bg-gradient-to-br from-pink-50 via-white to-rose-50 rounded-3xl p-12 text-center border-2 border-pink-100">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-5xl">💬</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">Be the first to share your experience with this product!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8" id="reviews">
      
      {/* ==================== PREMIUM RATING SUMMARY ==================== */}
      <div className="bg-gradient-to-br from-pink-50 via-white to-rose-50 rounded-3xl border-2 border-pink-100 overflow-hidden shadow-sm">
        <div className="grid md:grid-cols-2 gap-6 p-6 sm:p-8">
          
          {/* LEFT — Average rating */}
          <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-pink-200 pb-6 md:pb-0 md:pr-6">
            <div className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex gap-1 mt-3 mb-2">
              {[1,2,3,4,5].map(star => (
                <span key={star} className={`text-3xl ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-200'}`}>
                  ★
                </span>
              ))}
            </div>
            <p className="text-sm font-semibold text-gray-600">
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-3 text-xs">
              <span className="bg-white px-3 py-1 rounded-full border border-pink-200 text-pink-700 font-semibold">
                ⭐ {ratingOnlyCount} Quick Ratings
              </span>
              <span className="bg-white px-3 py-1 rounded-full border border-pink-200 text-pink-700 font-semibold">
                📝 {reviewWithCommentCount} Written
              </span>
            </div>
          </div>
          
          {/* RIGHT — Distribution bars */}
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map(star => {
              const count = ratingCounts[star] || 0;
              const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <button
                  key={star}
                  onClick={() => setFilter(star.toString())}
                  className="w-full flex items-center gap-3 group hover:bg-white/60 p-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-1 w-16 flex-shrink-0">
                    <span className="text-sm font-bold text-gray-700">{star}</span>
                    <span className="text-yellow-400">★</span>
                  </div>
                  <div className="flex-1 bg-pink-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-gray-600 w-12 text-right group-hover:text-pink-600 transition">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* ==================== PENDING BANNER ==================== */}
      {hasPendingReview && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <p className="text-amber-800 text-sm font-medium">
            You have a pending review awaiting admin approval. It will appear here once approved.
          </p>
        </div>
      )}
      
      {/* ==================== ACTION BAR ==================== */}
      <div className="flex flex-wrap items-center gap-3">
        {!checkingEligibility && canReview && !showReviewForm && (
          <>
            <QuickRating 
              productId={productId}
              onRatingSubmitted={() => fetchProductReviews(productId)}
              buttonText="⭐ Quick Rate"
              showPopup={true}
            />
            <button
              onClick={() => setShowReviewForm(true)}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-full hover:shadow-lg hover:scale-105 transition font-bold text-sm flex items-center gap-2"
            >
              ✍️ Write a Detailed Review
            </button>
          </>
        )}
        
        {!user && (
          <div className="text-sm text-gray-500 bg-pink-50 px-4 py-2 rounded-full">
            💡 <a href="/login" className="text-pink-600 font-bold hover:underline">Login</a> to write a review
          </div>
        )}
        
        {canReviewStatus.reason === 'not_delivered' && user && (
          <div className="text-sm text-gray-500 bg-pink-50 px-4 py-2 rounded-full">
            📦 You can review this product after delivery
          </div>
        )}
        
        {canReviewStatus.reason === 'already_reviewed' && (
          <div className="text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full font-medium">
            ✓ You have already reviewed this product
          </div>
        )}
      </div>
      
      {/* ==================== REVIEW FORM ==================== */}
      {showReviewForm && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-pink-100 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">✍️ Write Your Review</h3>
            <button 
              onClick={() => setShowReviewForm(false)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
            >
              ✕
            </button>
          </div>
          
          {/* Star rating */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Your Rating <span className="text-pink-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="text-5xl focus:outline-none transition-transform hover:scale-110"
                >
                  <span className={star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-200'}>
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Review Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Amazing product!"
              className="w-full px-4 py-3 border-2 border-pink-200 rounded-2xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition"
              maxLength="100"
            />
          </div>
          
          {/* Comment */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Your Review <span className="text-pink-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="5"
              placeholder="Share your experience with this product..."
              className="w-full px-4 py-3 border-2 border-pink-200 rounded-2xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition resize-none"
              maxLength="2000"
            />
            <p className="text-xs text-gray-400 mt-1">
              {comment.length}/2000 characters
              {comment.length > 0 && comment.length < 10 && (
                <span className="text-rose-500 ml-2 font-bold">Minimum 10 characters</span>
              )}
            </p>
          </div>
          
          {/* Images */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Add Photos <span className="text-gray-400 font-normal">(Max 5, up to 5MB each)</span>
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-pink-100 group">
                  <img src={img} alt={`Review ${idx}`} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeImage(idx)} 
                    className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-rose-600 shadow-md"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="reviewImageUpload" />
                  <label 
                    htmlFor="reviewImageUpload" 
                    className={`w-24 h-24 border-2 border-dashed border-pink-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50 transition ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploadingImages ? (
                      <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="text-2xl text-pink-400">📸</span>
                        <span className="text-[10px] text-pink-500 font-bold mt-1">Upload</span>
                      </>
                    )}
                  </label>
                </>
              )}
            </div>
          </div>
          
          {/* Info banner */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-start gap-3">
            <span className="text-xl">ℹ️</span>
            <p className="text-sm text-blue-800 font-medium">
              Your review will be reviewed by our team before being published. This usually takes a few hours.
            </p>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={handleSubmitReview} 
              disabled={submitting || rating === 0 || comment.length < 10} 
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-full hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
            >
              {submitting ? '⏳ Submitting...' : '✓ Submit Review'}
            </button>
            <button 
              onClick={() => setShowReviewForm(false)} 
              className="px-6 py-3 border-2 border-gray-200 rounded-full hover:bg-gray-50 transition font-bold text-sm text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* ==================== REVIEWS LIST ==================== */}
      {totalReviews > 0 && (
        <div className="space-y-5">
          
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              💬 Customer Reviews
              <span className="text-sm font-medium text-gray-500 bg-pink-100 px-3 py-1 rounded-full">
                {filteredReviews.length}
              </span>
            </h3>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border-2 border-pink-200 rounded-full text-sm font-semibold focus:outline-none focus:border-pink-500 bg-white cursor-pointer"
            >
              <option value="newest">🆕 Newest First</option>
              <option value="oldest">📅 Oldest First</option>
              <option value="helpful">👍 Most Helpful</option>
              <option value="highest">⭐ Highest Rating</option>
              <option value="lowest">📉 Lowest Rating</option>
            </select>
          </div>
          
          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'All', icon: '🌐' },
              { id: 'with_images', label: 'With Photos', icon: '📷' },
              { id: 'with_comment', label: 'With Comments', icon: '📝' },
              { id: 'rating_only', label: 'Quick Ratings', icon: '⭐' },
              { id: '5', label: '5★', icon: '' },
              { id: '4', label: '4★', icon: '' },
              { id: '3', label: '3★', icon: '' },
            ].map(f => (
              <button 
                key={f.id}
                onClick={() => setFilter(f.id)} 
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  filter === f.id 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md scale-105' 
                    : 'bg-white border-2 border-pink-100 text-gray-600 hover:border-pink-300'
                }`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>
          
          {/* No reviews after filter */}
          {filteredReviews.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl border-2 border-pink-100">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-gray-500 font-medium">No reviews match this filter</p>
              <button 
                onClick={() => setFilter('all')} 
                className="mt-3 text-pink-600 font-bold text-sm hover:underline"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <>
              {visibleReviews.map((review) => {
                const reviewId = review._id || review.id;
                const userName = review.user_name || review.userId?.name || review.userName || 'Anonymous';
                const userAvatar = review.user_avatar || review.userId?.avatar;
                const reviewText = review.comment || review.review || '';
                const createdAt = review.createdAt || review.created_at;
                const helpful = review.helpful_count ?? review.helpful ?? 0;
                const isExpanded = expandedReviews[reviewId] || false;
                const isLongComment = reviewText.length > 250;
                const isOwnReview = user && (review.userId === user.id || review.user_id === user.id);
                const isRatingOnly = review.isRatingOnly === true || !reviewText;
                const initial = userName.charAt(0).toUpperCase();
                
                return (
                  <div 
                    key={reviewId} 
                    className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-pink-100 hover:border-pink-200 hover:shadow-lg transition-all duration-300"
                  >
                    
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0 overflow-hidden">
                        {userAvatar ? (
                          <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                        ) : (
                          initial
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-bold text-gray-900 text-sm">{userName}</p>
                          {isOwnReview && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                              YOU
                            </span>
                          )}
                          {review.status === 'pending' && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                              ⏳ PENDING
                            </span>
                          )}
                        </div>
                        
                        {/* Stars + date */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(star => (
                              <span key={star} className={`text-sm ${star <= review.rating ? 'text-yellow-400' : 'text-gray-200'}`}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400 font-medium">
                            {createdAt ? new Date(createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            }) : ''}
                          </span>
                          {isRatingOnly && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                              ⭐ Quick
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Title */}
                    {review.title && (
                      <h4 className="font-bold text-gray-900 text-base mb-2">{review.title}</h4>
                    )}
                    
                    {/* Comment */}
                    {!isRatingOnly && reviewText && (
                      <p className="text-gray-700 text-sm leading-relaxed mb-3">
                        {isLongComment && !isExpanded 
                          ? `${reviewText.substring(0, 250)}...` 
                          : reviewText
                        }
                        {isLongComment && (
                          <button 
                            onClick={() => toggleExpand(reviewId)}
                            className="text-pink-600 hover:text-pink-700 text-xs font-bold ml-2"
                          >
                            {isExpanded ? 'Show Less' : 'Read More'}
                          </button>
                        )}
                      </p>
                    )}
                    
                    {/* Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {review.images.map((img, idx) => (
                          <img 
                            key={idx} 
                            src={img} 
                            alt={`Review ${idx}`} 
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-pink-100 cursor-pointer hover:opacity-90 hover:scale-105 transition-all shadow-sm"
                            onClick={() => setSelectedImage(img)}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex items-center gap-4 flex-wrap pt-3 border-t border-pink-50">
                      {!isRatingOnly && (
                        <button 
                          onClick={() => handleMarkHelpful(reviewId)} 
                          className="text-xs font-bold text-gray-500 hover:text-pink-600 transition flex items-center gap-1.5 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-full"
                        >
                          👍 Helpful {helpful > 0 && `(${helpful})`}
                        </button>
                      )}
                      
                      {isOwnReview && review.status === 'pending' && (
                        <button
                          onClick={() => handleDeleteReview(reviewId)}
                          className="text-xs font-bold text-rose-500 hover:text-rose-600 transition flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Load More */}
              {hasMore && (
                <button
                  onClick={() => setVisibleCount(prev => prev + 5)}
                  className="w-full py-4 text-pink-600 hover:text-pink-700 text-sm font-bold border-2 border-pink-200 rounded-full hover:bg-pink-50 transition"
                >
                  Load More Reviews ({visibleCount} of {sortedReviews.length})
                </button>
              )}
            </>
          )}
        </div>
      )}
      
      {/* ==================== IMAGE LIGHTBOX ==================== */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/20 hover:bg-white/40 rounded-full text-white text-2xl flex items-center justify-center transition z-10"
          >
            ✕
          </button>
          <img 
            src={selectedImage} 
            alt="Review" 
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
