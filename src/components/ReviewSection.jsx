import { useState } from 'react';
import { useReviews } from '../context/ReviewContext';
import { useAuth } from '../context/AuthContext';

function ReviewSection({ productId }) {
  const { getProductReviews, getAverageRating, addReview, markHelpful, deleteReview } = useReviews();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reviews = getProductReviews(productId);
  const averageRating = getAverageRating(productId);

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
    addReview(productId, {
      rating,
      comment,
      userName: user.name || user.email?.split('@')[0] || 'Anonymous',
    });
    setRating(5);
    setComment('');
    setShowForm(false);
    setSubmitting(false);
    alert('✨ Review submitted successfully!');
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
          >
            <span className={star <= (hoverRating || ratingValue) ? 'text-yellow-400' : 'text-gray-300'}>
              ★
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="bg-pink-50 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <div className="text-4xl font-bold text-gray-800">{averageRating || 'No'} ⭐</div>
            <div className="flex justify-center md:justify-start mt-2">
              {renderStars(averageRating || 0)}
            </div>
            <p className="text-sm text-gray-500 mt-1">{reviews.length} customer {reviews.length === 1 ? 'review' : 'reviews'}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition text-sm font-medium"
          >
            {showForm ? 'Cancel' : 'Write a Review →'}
          </button>
        </div>
      </div>

      {/* Write Review Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-pink-100">
          <h3 className="font-semibold text-gray-800 mb-4">Write Your Review</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-2xl transition"
                  >
                    <span className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                placeholder="Share your experience with this product..."
                className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:border-pink-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition text-sm font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 && !showForm && (
        <div className="bg-white rounded-xl p-10 text-center border border-pink-100">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="space-y-5">
          <h3 className="font-semibold text-gray-800">Customer Reviews</h3>
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl p-5 border border-pink-100">
              <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                <div>
                  <span className="font-semibold text-gray-800">{review.userName}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-xs text-gray-400">{review.date}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => markHelpful(productId, review.id)}
                    className="text-sm text-gray-500 hover:text-pink-500 transition flex items-center gap-1"
                  >
                    👍 Helpful ({review.helpful})
                  </button>
                  {user && (user.role === 'admin' || review.userName === (user.name || user.email?.split('@')[0])) && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this review?')) {
                          deleteReview(productId, review.id);
                        }
                      }}
                      className="text-sm text-red-500 hover:text-red-600 transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewSection;
