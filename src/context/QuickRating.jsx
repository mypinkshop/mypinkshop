import { useState } from 'react';
import { useReviews } from '../context/ReviewContext';
import { useAuth } from '../context/AuthContext';

function QuickRating({ 
  productId, 
  onRatingSubmitted, 
  buttonText = '⭐ Rate Now',
  showPopup = true,
  size = 'md',        // 'sm' | 'md' | 'lg'
  variant = 'button'  // 'button' | 'inline'
}) {
  const { user } = useAuth();
  const { addReview } = useReviews();
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Size classes
  const sizeClasses = {
    sm: { star: 'text-3xl', button: 'px-4 py-2 text-xs' },
    md: { star: 'text-4xl', button: 'px-6 py-2.5 text-sm' },
    lg: { star: 'text-5xl', button: 'px-8 py-3 text-base' },
  };
  const sizes = sizeClasses[size] || sizeClasses.md;

  const handleStarClick = (star) => {
    setRating(star);
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('Please login to rate');
      return;
    }
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const result = await addReview(
        productId,
        null,           // orderId — backend automatically detects
        rating,
        '',             // title
        '',             // comment (empty — rating only)
        [],             // images
        [],             // videos
        true            // isRatingOnly
      );

      if (result.success) {
        setShowModal(false);
        setRating(0);
        alert('⭐ Thanks for rating!');
        if (onRatingSubmitted) onRatingSubmitted();
      } else {
        alert(result.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Rating error:', error);
      alert('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  // ===== INLINE VARIANT (stars directly on page) =====
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-700">Rate:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => {
                setRating(star);
                setTimeout(() => handleSubmit(), 100);
              }}
              disabled={submitting}
              className={`${sizes.star} transition-transform hover:scale-110 focus:outline-none disabled:opacity-50`}
            >
              <span className={star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'}>
                ★
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ===== BUTTON VARIANT (opens modal) =====
  return (
    <>
      {/* Trigger Button */}
      {!showModal && (
        <button
          onClick={() => setShowModal(true)}
          className={`bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 ${sizes.button}`}
        >
          {buttonText}
        </button>
      )}

      {/* Modal */}
      {showModal && showPopup && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Quick Rating</h3>
                <p className="text-xs text-white/80 mt-0.5">Rate without writing a review</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 text-center">
              <p className="text-sm font-medium text-gray-600 mb-5">
                How would you rate this product?
              </p>

              {/* Stars */}
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleStarClick(star)}
                    className="text-5xl transition-transform hover:scale-110 focus:outline-none"
                  >
                    <span className={star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  </button>
                ))}
              </div>

              {/* Rating label */}
              {rating > 0 && (
                <p className="text-sm font-bold text-gray-700 mb-5">
                  {rating === 5 && '😍 Excellent!'}
                  {rating === 4 && '😊 Good'}
                  {rating === 3 && '😐 Average'}
                  {rating === 2 && '😕 Poor'}
                  {rating === 1 && '😞 Very Bad'}
                </p>
              )}

              {/* Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 mb-5 flex items-start gap-2 text-left">
                <span className="text-lg">💡</span>
                <p className="text-xs text-yellow-800">
                  Want to add photos or write a review? Use the <strong>Write a Review</strong> button instead.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || rating === 0}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-3 rounded-2xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {submitting ? '⏳ Submitting...' : '✓ Submit Rating'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border-2 border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default QuickRating;
