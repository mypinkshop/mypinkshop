import { createContext, useContext, useState, useEffect } from 'react';

const ReviewContext = createContext();

export const useReviews = () => useContext(ReviewContext);

export const ReviewProvider = ({ children }) => {
  const [reviews, setReviews] = useState({});
  const [pendingReviews, setPendingReviews] = useState([]);
  const [userReviews, setUserReviews] = useState({});

  // Load reviews from localStorage
  useEffect(() => {
    const savedReviews = localStorage.getItem('productReviews');
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    }
    
    const savedPendingReviews = localStorage.getItem('pendingReviews');
    if (savedPendingReviews) {
      setPendingReviews(JSON.parse(savedPendingReviews));
    }
    
    const savedUserReviews = localStorage.getItem('userReviews');
    if (savedUserReviews) {
      setUserReviews(JSON.parse(savedUserReviews));
    }
  }, []);

  // Save reviews to localStorage
  const saveReviews = (newReviews) => {
    setReviews(newReviews);
    localStorage.setItem('productReviews', JSON.stringify(newReviews));
  };

  const savePendingReviews = (newPendingReviews) => {
    setPendingReviews(newPendingReviews);
    localStorage.setItem('pendingReviews', JSON.stringify(newPendingReviews));
  };

  // Get reviews for a product (only approved)
  const getProductReviews = (productId) => {
    return reviews[productId] || [];
  };

  // Get pending reviews for a product
  const getPendingReviewsForProduct = (productId) => {
    return pendingReviews.filter(r => r.productId == productId);
  };

  // Get all pending reviews for admin
  const getAllPendingReviews = () => {
    return pendingReviews;
  };

  // Get all approved reviews for admin
  const getAllApprovedReviews = () => {
    const allReviews = [];
    Object.keys(reviews).forEach(productId => {
      reviews[productId].forEach(review => {
        allReviews.push({ ...review, productId });
      });
    });
    return allReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Get average rating for a product
  const getAverageRating = (productId) => {
    const productReviews = reviews[productId] || [];
    if (productReviews.length === 0) return 0;
    const sum = productReviews.reduce((acc, rev) => acc + rev.rating, 0);
    return (sum / productReviews.length).toFixed(1);
  };

  // Get rating distribution
  const getRatingDistribution = (productId) => {
    const productReviews = reviews[productId] || [];
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    productReviews.forEach(review => {
      distribution[review.rating]++;
    });
    return distribution;
  };

  // Check if user can review (has purchased product and not reviewed)
  const canUserReview = (productId, userEmail) => {
    if (!userEmail) return false;
    
    const userReviewKey = `${userEmail}_${productId}`;
    if (userReviews[userReviewKey]) return false;
    
    const allOrders = JSON.parse(localStorage.getItem('adminOrdersList') || '[]');
    const userOrders = allOrders.filter(order => order.customerEmail === userEmail);
    
    for (const order of userOrders) {
      if (order.status === 'delivered' && order.items) {
        const hasProduct = order.items.some(item => item.id == productId);
        if (hasProduct) return true;
      }
    }
    return false;
  };

  // Add a review (pending approval)
  const addReview = (productId, userEmail, userName, rating, title, comment, images = []) => {
    const userReviewKey = `${userEmail}_${productId}`;
    if (userReviews[userReviewKey]) {
      return { success: false, message: 'You have already reviewed this product' };
    }
    
    const hasPurchased = canUserReview(productId, userEmail);
    if (!hasPurchased) {
      return { success: false, message: 'You can only review products you have purchased' };
    }
    
    const newReview = {
      id: Date.now(),
      productId,
      userName: userName || userEmail.split('@')[0],
      userEmail,
      rating,
      title,
      comment,
      images,
      date: new Date().toISOString(),
      verified: true,
      status: 'pending', // pending, approved, rejected
      helpful: 0,
      helpfulUsers: []
    };
    
    const updatedPendingReviews = [...pendingReviews, newReview];
    savePendingReviews(updatedPendingReviews);
    
    // Mark user as reviewed (pending)
    const updatedUserReviews = {
      ...userReviews,
      [userReviewKey]: true
    };
    setUserReviews(updatedUserReviews);
    localStorage.setItem('userReviews', JSON.stringify(updatedUserReviews));
    
    return { success: true, message: 'Thank you! Your review has been submitted and is awaiting admin approval.' };
  };

  // Admin approve review
  const approveReview = (reviewId) => {
    const pendingReview = pendingReviews.find(r => r.id === reviewId);
    if (!pendingReview) return;
    
    // Remove from pending
    const updatedPending = pendingReviews.filter(r => r.id !== reviewId);
    savePendingReviews(updatedPending);
    
    // Add to approved reviews
    const { productId, ...reviewData } = pendingReview;
    const currentProductReviews = reviews[productId] || [];
    const updatedProductReviews = {
      ...reviews,
      [productId]: [{ ...reviewData, status: 'approved' }, ...currentProductReviews]
    };
    saveReviews(updatedProductReviews);
  };

  // Admin reject review
  const rejectReview = (reviewId) => {
    const pendingReview = pendingReviews.find(r => r.id === reviewId);
    if (!pendingReview) return;
    
    // Remove from pending
    const updatedPending = pendingReviews.filter(r => r.id !== reviewId);
    savePendingReviews(updatedPending);
    
    // Allow user to review again
    const userReviewKey = `${pendingReview.userEmail}_${pendingReview.productId}`;
    const updatedUserReviews = { ...userReviews };
    delete updatedUserReviews[userReviewKey];
    setUserReviews(updatedUserReviews);
    localStorage.setItem('userReviews', JSON.stringify(updatedUserReviews));
  };

  // Admin delete review
  const deleteReview = (productId, reviewId) => {
    const productReviews = reviews[productId] || [];
    const updatedProductReviews = productReviews.filter(r => r.id !== reviewId);
    const updatedReviews = {
      ...reviews,
      [productId]: updatedProductReviews
    };
    saveReviews(updatedReviews);
  };

  // Mark review as helpful
  const markHelpful = (productId, reviewId, userEmail) => {
    const productReviews = [...(reviews[productId] || [])];
    const reviewIndex = productReviews.findIndex(r => r.id === reviewId);
    
    if (reviewIndex !== -1) {
      if (!productReviews[reviewIndex].helpfulUsers?.includes(userEmail)) {
        productReviews[reviewIndex].helpful++;
        productReviews[reviewIndex].helpfulUsers = [...(productReviews[reviewIndex].helpfulUsers || []), userEmail];
        
        const updatedReviews = {
          ...reviews,
          [productId]: productReviews
        };
        saveReviews(updatedReviews);
      }
    }
  };

  return (
    <ReviewContext.Provider value={{
      reviews,
      pendingReviews,
      getProductReviews,
      getPendingReviewsForProduct,
      getAllPendingReviews,
      getAllApprovedReviews,
      getAverageRating,
      getRatingDistribution,
      canUserReview,
      addReview,
      approveReview,
      rejectReview,
      deleteReview,
      markHelpful
    }}>
      {children}
    </ReviewContext.Provider>
  );
};
