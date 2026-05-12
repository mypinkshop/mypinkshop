import { createContext, useState, useContext, useEffect } from 'react';

const ReviewContext = createContext();

export const useReviews = () => useContext(ReviewContext);

export const ReviewProvider = ({ children }) => {
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    const savedReviews = localStorage.getItem('pinkReviews');
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    }
  }, []);

  const getProductReviews = (productId) => {
    return reviews[productId] || [];
  };

  const getAverageRating = (productId) => {
    const productReviews = reviews[productId] || [];
    if (productReviews.length === 0) return 0;
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / productReviews.length).toFixed(1);
  };

  const addReview = (productId, review) => {
    const newReview = {
      id: Date.now(),
      userId: 'current-user',
      userName: review.userName || 'Anonymous User',
      rating: review.rating,
      comment: review.comment,
      date: new Date().toISOString().split('T')[0],
      helpful: 0,
      helpfulUsers: [],
    };

    const existingReviews = reviews[productId] || [];
    const updatedReviews = {
      ...reviews,
      [productId]: [newReview, ...existingReviews],
    };
    setReviews(updatedReviews);
    localStorage.setItem('pinkReviews', JSON.stringify(updatedReviews));
    return newReview;
  };

  const markHelpful = (productId, reviewId) => {
    const existingReviews = reviews[productId] || [];
    const updatedProductReviews = existingReviews.map(review => {
      if (review.id === reviewId) {
        return { ...review, helpful: review.helpful + 1 };
      }
      return review;
    });
    const updatedReviews = { ...reviews, [productId]: updatedProductReviews };
    setReviews(updatedReviews);
    localStorage.setItem('pinkReviews', JSON.stringify(updatedReviews));
  };

  const deleteReview = (productId, reviewId) => {
    const existingReviews = reviews[productId] || [];
    const updatedProductReviews = existingReviews.filter(review => review.id !== reviewId);
    const updatedReviews = { ...reviews, [productId]: updatedProductReviews };
    if (updatedProductReviews.length === 0) {
      delete updatedReviews[productId];
    }
    setReviews(updatedReviews);
    localStorage.setItem('pinkReviews', JSON.stringify(updatedReviews));
  };

  return (
    <ReviewContext.Provider value={{
      reviews,
      getProductReviews,
      getAverageRating,
      addReview,
      markHelpful,
      deleteReview,
    }}>
      {children}
    </ReviewContext.Provider>
  );
};
