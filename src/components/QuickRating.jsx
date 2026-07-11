// src/components/QuickRating.jsx
import { useState, useEffect } from 'react';
import { useReviews } from '../context/ReviewContext';
import { useAuth } from '../context/AuthContext';
import RatingStars from './RatingStars';

const QuickRating = ({ 
  productId, 
  onRatingSubmitted, 
  className = '',
  buttonText = 'Rate Now',
  showPopup = true
}) => {
  const { user } = useAuth();
  const { 
    canUserReview, 
    addReview, 
    fetchProductReviews,
    getAverageRating,
    getReviewCount
  } = useReviews();
  
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [orderId, setOrderId] = useState(null);
  
  // Check if user can review
  useEffect(() => {
    const check = async () => {
      if (!user) {
        setChecking(false);
        return;
      }
      
      setChecking(true);
      const result = await canUserReview(productId);
      setCanReview(result.canReview && !result.alreadyReviewed);
      setAlreadyReviewed(result.alreadyReviewed);
      setOrderId(result.orderId);
      setChecking(false);
    };
    check();
  }, [user, productId, canUserReview]);
  
  // Reset popup after success
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setShowPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);
  
  const handleRatingClick = (selectedRating) => {
    if (!user) {
      alert('Please login to rate this product');
      return;
    }
    
    if (!canReview) {
      alert('You have already rated this product');
      return;
    }
    
    setRating(selectedRating);
    
    if (showPopup) {
      setShowPopup(true);
    } else {
      submitRating(selectedRating);
    }
  };
  
  const submitRating = async (selectedRating) => {
    if (!orderId) {
      const result = await canUserReview(productId);
      if (!result.canReview || result.alreadyReviewed) {
        alert('You cannot rate this product');
        return;
      }
      setOrderId(result.orderId);
    }
    
    setSubmitting(true);
    try {
      const result = await addReview(
        productId,
        orderId || (await canUserReview(productId)).orderId,
        selectedRating,
        '', // No title
        '', // No comment
        [], // No images
        true // ✅ isRatingOnly
      );
      
      if (result.success) {
        setShowSuccess(true);
        setCanReview(false);
        setAlreadyReviewed(true);
        await fetchProductReviews(productId);
        if (onRatingSubmitted) onRatingSubmitted();
      } else {
        alert(result.message || 'Failed to submit rating');
      }
    } catch (error) {
      alert('Failed to submit rating: ' + error.message);
    } finally {
      setSubmitting(false);
      setShowPopup(false);
    }
  };
  
  const handleConfirmRating = () => {
    if (rating > 0) {
      submitRating(rating);
    }
  };
  
  // If not logged in, show nothing
  if (!user) {
    return null;
  }
  
  // If already reviewed
  if (alreadyReviewed && !canReview) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <span>⭐</span>
        <span>You've already rated this product</span>
      </div>
    );
  }
  
  // If checking
  if (checking) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-400">Checking...</span>
      </div>
    );
  }
  
  // If cannot review
  if (!canReview) {
    return null;
  }
  
  return (
    <div className={className}>
      {/* Rating Stars */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 font-medium">{buttonText}</span>
        <RatingStars 
          rating={0}
          size="lg"
          interactive={true}
          onRatingChange={handleRatingClick}
        />
        {submitting && (
          <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>
      
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up">
          ✅ Thank you for rating!
        </div>
      )}
      
      {/* Rating Confirmation Popup */}
      {showPopup && showPopup && rating > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Rate this product</h3>
              <div className="flex justify-center my-4">
                <RatingStars 
                  rating={rating}
                  size="2xl"
                  interactive={false}
                />
              </div>
              <p className="text-sm text-gray-500 mb-4">
                You selected {rating} ★ {rating === 1 ? 'star' : 'stars'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmRating}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm Rating'}
                </button>
                <button
                  onClick={() => setShowPopup(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default QuickRating;
