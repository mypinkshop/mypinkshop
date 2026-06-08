import { useState, useEffect, useCallback } from 'react';
import { useReviews } from '../context/ReviewContext';
import { useAuth } from '../context/AuthContext';

function ReviewSection({ productId }) {
  const { 
    fetchProductReviews, 
    getProductReviews, 
    getAverageRating, 
    getReviewCount,
    canUserReview,
    uploadReviewMedia,
    addReview, 
    markHelpful, 
    deleteReview 
  } = useReviews();
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canReviewStatus, setCanReviewStatus] = useState({ canReview: false, alreadyReviewed: false, orderId: null });
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [filter, setFilter] = useState('all');

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
  
  const canReview = user && canReviewStatus.canReview && !canReviewStatus.alreadyReviewed;

  // Filter reviews
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to submit a review');
      return;
    }
    if (comment.trim() === '') {
      alert('Please write a comment');
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
        []
      );
      
      if (result.success) {
        setRating(5);
        setTitle('');
        setComment('');
        setImages([]);
        setShowForm(false);
        alert('✨ Review submitted! Awaiting admin approval.');
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

  const handleDeleteReview = async (reviewId) => {
    if (confirm('Are you sure you want to delete this review?')) {
      const success = await deleteReview(reviewId, productId);
      if (success) {
        alert('Review deleted successfully');
        await fetchProductReviews(productId);
      } else {
        alert('Failed to delete review');
      }
    }
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

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="bg-gradient-to-r from-pink-50 to-white rounded-xl p-6 border border-pink-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <div className="text-4xl font-bold text-gray-800">{averageRating || 'No'} ⭐</div>
            <div className="flex justify-center md:justify-start mt-2">
              {renderStars(averageRating || 0)}
            </div>
            <p className="text-sm text-gray-500 mt-1">{totalReviews} customer {totalReviews === 1 ? 'review' : 'reviews'}</p>
          </div>
          {!checkingEligibility && canReview && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition text-sm font-medium"
            >
              Write a Review →
            </button>
          )}
          {showForm && (
            <button
              onClick={() => setShowForm(false)}
              className="border border-pink-300 text-pink-600 px-6 py-2 rounded-full hover:bg-pink-50 transition text-sm font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Rating Filter Tabs */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-pink-100 pb-3">
          <button 
            onClick={() => setFilter('all')} 
            className={`px-3 py-1 rounded-full text-xs transition ${filter === 'all' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All ({reviews.length})
          </button>
          <button 
            onClick={() => setFilter('with_images')} 
            className={`px-3 py-1 rounded-full text-xs transition ${filter === 'with_images' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            📷 With Images
          </button>
          <button 
            onClick={() => setFilter('5')} 
            className={`px-3 py-1 rounded-full text-xs transition ${filter === '5' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            5 ★
          </button>
          <button 
            onClick={() => setFilter('4')} 
            className={`px-3 py-1 rounded-full text-xs transition ${filter === '4' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            4 ★
          </button>
        </div>
      )}

      {/* Write Review Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-pink-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Write Your Review</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating *</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-2xl transition"
                  >
                    <span className={star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
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
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                maxLength="100"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Review *</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                placeholder="Share your experience with this product..."
                className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:border-pink-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Photos (Optional)</label>
              <div className="flex flex-wrap gap-3 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                    <img src={img} alt={`Review ${idx}`} className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(idx)} 
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="reviewImageUpload" />
              <label 
                htmlFor="reviewImageUpload" 
                className="inline-block px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition text-sm"
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
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition text-sm font-medium disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {filteredReviews.length === 0 && !showForm && (
        <div className="bg-white rounded-xl p-10 text-center border border-pink-100">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
        </div>
      )}

      {filteredReviews.length > 0 && (
        <div className="space-y-5">
          <h3 className="font-semibold text-gray-800">Customer Reviews ({filteredReviews.length})</h3>
          {filteredReviews.map((review) => (
            <div key={review._id} className="bg-white rounded-xl p-5 border border-pink-100 hover:shadow-md transition">
              <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                <div>
                  <span className="font-semibold text-gray-800">{review.userId?.name || 'Anonymous'}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                    {review.isVerifiedPurchase && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        ✓ Verified Purchase
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleMarkHelpful(review._id)}
                    className="text-sm text-gray-500 hover:text-pink-500 transition flex items-center gap-1"
                  >
                    👍 Helpful ({review.helpful || 0})
                  </button>
                  {user && (user.role === 'admin' || review.userId?._id === user.id) && (
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      className="text-sm text-red-500 hover:text-red-600 transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              {review.title && (
                <h4 className="font-semibold text-gray-800 mb-2">{review.title}</h4>
              )}
              <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
              
              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {review.images.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img} 
                      alt={`Review ${idx}`} 
                      className="w-20 h-20 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition"
                      onClick={() => window.open(img, '_blank')}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewSection;
