import { useState } from 'react';
import { useReviews } from '../context/ReviewContext';
import { useAuth } from '../context/AuthContext';

const ReviewSection = ({ productId }) => {
  const { user } = useAuth();
  const { 
    getProductReviews, 
    getPendingReviewsForProduct,
    getAverageRating, 
    getRatingDistribution, 
    canUserReview,
    addReview,
    markHelpful 
  } = useReviews();
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState('all');
  
  const reviews = getProductReviews(productId);
  const pendingUserReviews = getPendingReviewsForProduct(productId).filter(r => r.userEmail === user?.email);
  const averageRating = getAverageRating(productId);
  const distribution = getRatingDistribution(productId);
  const totalReviews = reviews.length;
  
  const canReview = user && canUserReview(productId, user.email);
  const hasPendingReview = pendingUserReviews.length > 0;
  
  const filteredReviews = reviews.filter(review => {
    if (filter === 'with_images') return review.images && review.images.length > 0;
    if (filter === '5') return review.rating === 5;
    if (filter === '4') return review.rating === 4;
    if (filter === '3') return review.rating === 3;
    if (filter === '2') return review.rating === 2;
    if (filter === '1') return review.rating === 1;
    return true;
  });
  
  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!title.trim()) {
      alert('Please enter a review title');
      return;
    }
    if (!comment.trim()) {
      alert('Please enter your review');
      return;
    }
    
    setSubmitting(true);
    const result = addReview(productId, user.email, user.name, rating, title, comment, images);
    if (result.success) {
      setRating(0);
      setTitle('');
      setComment('');
      setImages([]);
      setShowReviewForm(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } else {
      alert(result.message);
    }
    setSubmitting(false);
  };
  
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];
    files.forEach(file => {
      if (file.size <= 2 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result);
          if (newImages.length === files.length) {
            setImages([...images, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        alert(`Image ${file.name} is larger than 2MB`);
      }
    });
  };
  
  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };
  
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
            <div className="text-5xl font-bold text-gray-800">{averageRating}</div>
            <div className="flex items-center justify-center md:justify-start gap-1 mt-2">
              {[1,2,3,4,5].map(star => (
                <span key={star} className="text-2xl text-yellow-400">
                  {star <= Math.round(averageRating) ? '★' : '☆'}
                </span>
              ))}
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
      
      {/* Pending Review Message */}
      {hasPendingReview && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-yellow-700">⏳ Your review is pending admin approval. It will appear here once approved.</p>
        </div>
      )}
      
      {/* Write Review Button */}
      {canReview && !hasPendingReview && !showReviewForm && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition"
        >
          ✍️ Write a Review
        </button>
      )}
      
      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Review Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Add Images (Optional)</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={img} alt={`Review ${idx}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">✕</button>
                </div>
              ))}
            </div>
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="reviewImageUpload" />
            <label htmlFor="reviewImageUpload" className="inline-block px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition text-sm">📸 Upload Images</label>
            <p className="text-xs text-gray-400 mt-1">Max 2MB per image</p>
          </div>
          
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <span>⏳</span> Your review will be reviewed by admin before being published.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button onClick={handleSubmitReview} disabled={submitting} className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button onClick={() => setShowReviewForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
          </div>
        </div>
      )}
      
      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Customer Reviews ({filteredReviews.length})</h3>
          <div className="flex gap-2">
            <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-sm transition ${filter === 'all' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>All</button>
            <button onClick={() => setFilter('with_images')} className={`px-3 py-1 rounded-full text-sm transition ${filter === 'with_images' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>With Images</button>
          </div>
        </div>
        
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                      ))}
                    </div>
                    {review.verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">✓ Verified Purchase</span>}
                  </div>
                  <h4 className="font-semibold text-gray-800">{review.title}</h4>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">{review.userName}</p>
                  <p className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-3">{review.comment}</p>
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {review.images.map((img, idx) => (
                    <img key={idx} src={img} alt={`Review ${idx}`} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                  ))}
                </div>
              )}
              <button onClick={() => markHelpful(productId, review.id, user?.email)} className="text-sm text-gray-500 hover:text-pink-600 transition flex items-center gap-1">
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
