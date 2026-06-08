import { useState, useEffect, useCallback } from 'react';
import { useReviews } from '../context/ReviewContext';
import { useAuth } from '../context/AuthContext';

const ReviewSection = ({ productId }) => {
  const { user } = useAuth();
  const { 
    fetchProductReviews,
    getProductReviews, 
    getAverageRating, 
    getReviewCount,
    getRatingDistribution, 
    canUserReview,
    uploadReviewMedia,
    addReview,
    markHelpful 
  } = useReviews();
  
  const [loading, setLoading] = useState(true);
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
  const [canReviewStatus, setCanReviewStatus] = useState({ canReview: false, alreadyReviewed: false, orderId: null });
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  
  // Fetch reviews on component mount
  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      await fetchProductReviews(productId);
      setLoading(false);
    };
    loadReviews();
  }, [productId, fetchProductReviews]);
  
  // Check if user can review
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
  
  const reviews = getProductReviews(productId);
  const averageRating = getAverageRating(productId);
  const totalReviews = getReviewCount(productId);
  const distribution = getRatingDistribution(productId);
  
  const canReview = user && canReviewStatus.canReview && !canReviewStatus.alreadyReviewed;
  const hasPendingReview = false; // Will be handled by admin panel
  
  const filteredReviews = reviews.filter(review => {
    if (filter === 'with_images') return review.images && review.images.length > 0;
    if (filter === '5') return review.rating === 5;
    if (filter === '4') return review.rating === 4;
    if (filter === '3') return review.rating === 3;
    if (filter === '2') return review.rating === 2;
    if (filter === '1') return review.rating === 1;
    return true;
  });
  
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
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
  
  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      alert('Please enter your review');
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
        [] // videos array
      );
      
      if (result.success) {
        setRating(0);
        setTitle('');
        setComment('');
        setImages([]);
        setShowReviewForm(false);
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
        // Refresh reviews to show updated average
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
  
  const handleMarkHelpful = async (reviewId) => {
    if (!user) {
      alert('Please login to mark reviews as helpful');
      return;
    }
    await markHelpful(productId, reviewId);
  };
  
  const renderStars = (ratingValue, interactive = false, onRatingChange = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`text-2xl transition ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
            disabled={!interactive}
          >
            <span className={star <= (interactive ? (hoverRating || ratingValue) : ratingValue) ? 'text-yellow-400' : 'text-gray-300'}>
              ★
            </span>
          </button>
        ))}
      </div>
    );
  };
  
  if (loading && !reviews.length) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="text-5xl mb-3">📝</div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">Review Submitted!</h3>
        <p className="text-green-700">Thank you for your review. It is now pending admin approval and will appear here once approved.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="text-center md:text-left">
            <div className="text-5xl font-bold text-gray-800">{averageRating || 'No'} ⭐</div>
            <div className="flex items-center justify-center md:justify-start gap-1 mt-2">
              {renderStars(averageRating || 0)}
            </div>
            <p className="text-sm text-gray-500 mt-1">{totalReviews} global ratings</p>
          </div>
          
          <div className="flex-1 space-y-2">
            {[5,4,3,2,1].map(star => {
              const count = distribution[star];
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <button
                  key={star}
                  onClick={() => setFilter(filter === star.toString() ? 'all' : star.toString())}
                  className="flex items-center gap-3 w-full group"
                >
                  <span className="text-sm text-gray-600 w-8">{star} ★</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-sm text-gray-500 w-12">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Pending Review Message - Commented for now, will be added when we implement pending reviews fetch */}
      
      {/* Write Review Button */}
      {!checkingEligibility && canReview && !showReviewForm && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition"
        >
          ✍️ Write a Review
        </button>
      )}
      
      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Write Your Review</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating *</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="text-3xl focus:outline-none"
                >
                  <span className={star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                </button>
              ))}
            </div>
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
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Add Images (Optional, Max 5)</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={img} alt={`Review ${idx}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600">✕</button>
                </div>
              ))}
            </div>
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="reviewImageUpload" />
            <label htmlFor="reviewImageUpload" className="inline-block px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition text-sm">
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
            <button onClick={handleSubmitReview} disabled={submitting} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button onClick={() => setShowReviewForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
          </div>
        </div>
      )}
      
      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-gray-800">Customer Reviews ({filteredReviews.length})</h3>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-sm transition ${filter === 'all' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
            <button onClick={() => setFilter('with_images')} className={`px-3 py-1 rounded-full text-sm transition ${filter === 'with_images' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>📷 With Images</button>
            <button onClick={() => setFilter('5')} className={`px-3 py-1 rounded-full text-sm transition ${filter === '5' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>5 ★</button>
            <button onClick={() => setFilter('4')} className={`px-3 py-1 rounded-full text-sm transition ${filter === '4' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>4 ★</button>
          </div>
        </div>
        
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-5xl mb-3">📝</div>
            <p className="text-gray-500">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review._id} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                      ))}
                    </div>
                    {review.isVerifiedPurchase && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        ✓ Verified Purchase
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
              <p className="text-gray-600 text-sm mb-3">{review.comment}</p>
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {review.images.map((img, idx) => (
                    <img key={idx} src={img} alt={`Review ${idx}`} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                  ))}
                </div>
              )}
              <button 
                onClick={() => handleMarkHelpful(review._id)} 
                className="text-sm text-gray-500 hover:text-pink-600 transition flex items-center gap-1"
              >
                👍 Helpful ({review.helpful || 0})
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
