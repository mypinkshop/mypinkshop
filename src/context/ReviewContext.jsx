import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ReviewContext = createContext();

export const useReviews = () => useContext(ReviewContext);

export const ReviewProvider = ({ children }) => {
  const [reviews, setReviews] = useState({});
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = 'https://api.mypinkshop.com';
  const getToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token');

  // Fetch approved reviews for a product
  const fetchProductReviews = useCallback(async (productId, page = 1, limit = 10) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reviews/product/${productId}?page=${page}&limit=${limit}`);
      const data = await response.json();
      
      setReviews(prev => ({
        ...prev,
        [productId]: {
          reviews: data.reviews || [],
          total: data.total || 0,
          page: data.page || 1,
          pages: data.pages || 1,
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0
        }
      }));
      
      return data;
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get product reviews from state
  const getProductReviews = (productId) => {
    return reviews[productId]?.reviews || [];
  };

  // Get average rating
  const getAverageRating = (productId) => {
    return reviews[productId]?.averageRating || 0;
  };

  // Get total review count
  const getReviewCount = (productId) => {
    return reviews[productId]?.totalReviews || 0;
  };

  // Check if user can review (after delivery)
  const canUserReview = async (productId) => {
    const token = getToken();
    if (!token) return { canReview: false, alreadyReviewed: false, orderId: null };
    
    try {
      const response = await fetch(`${API_URL}/api/reviews/can-review/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error checking review eligibility:', err);
      return { canReview: false, alreadyReviewed: false, orderId: null };
    }
  };

  // Upload review images/videos
  const uploadReviewMedia = async (files) => {
    const token = getToken();
    if (!token) throw new Error('Please login to upload media');
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('media', files[i]);
    }
    
    try {
      const response = await fetch(`${API_URL}/api/reviews/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data.urls || [];
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
    }
  };

  // Add a review (goes to pending approval)
  const addReview = async (productId, orderId, rating, title, comment, images = [], videos = []) => {
    const token = getToken();
    if (!token) return { success: false, message: 'Please login to review' };
    
    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          orderId,
          rating,
          title,
          comment,
          images,
          videos
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, message: data.error };
      }
      
      // Refresh product reviews to show updated average
      await fetchProductReviews(productId);
      
      return { 
        success: true, 
        message: 'Thank you! Your review has been submitted and is awaiting admin approval.',
        review: data.review
      };
    } catch (err) {
      console.error('Add review error:', err);
      return { success: false, message: 'Failed to submit review' };
    }
  };

  // Mark review as helpful
  const markHelpful = async (productId, reviewId) => {
    const token = getToken();
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/reviews/${reviewId}/helpful`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      // Update local state
      setReviews(prev => {
        const productReviews = prev[productId]?.reviews || [];
        const updatedReviews = productReviews.map(review => 
          review._id === reviewId ? { ...review, helpful: data.helpful } : review
        );
        return {
          ...prev,
          [productId]: { ...prev[productId], reviews: updatedReviews }
        };
      });
    } catch (err) {
      console.error('Mark helpful error:', err);
    }
  };

  // ========== ADMIN FUNCTIONS ==========
  
  // Fetch all pending reviews (admin only)
  const fetchPendingReviews = async () => {
    const token = getToken();
    if (!token) return [];
    
    try {
      const response = await fetch(`${API_URL}/api/reviews/admin/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPendingReviews(data);
      return data;
    } catch (err) {
      console.error('Fetch pending reviews error:', err);
      return [];
    }
  };

  // Fetch all reviews (admin only)
  const fetchAllReviews = async (status = 'all', page = 1, limit = 20) => {
    const token = getToken();
    if (!token) return null;
    
    try {
      const response = await fetch(`${API_URL}/api/reviews/admin/all?status=${status}&page=${page}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Fetch all reviews error:', err);
      return null;
    }
  };

  // Approve review (admin only)
  const approveReview = async (reviewId, adminNote = '') => {
    const token = getToken();
    if (!token) return false;
    
    try {
      const response = await fetch(`${API_URL}/api/reviews/admin/${reviewId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adminNote })
      });
      
      const data = await response.json();
      if (data.success) {
        // Refresh pending reviews list
        await fetchPendingReviews();
        // Refresh product reviews for that product
        if (data.review?.productId) {
          await fetchProductReviews(data.review.productId);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Approve review error:', err);
      return false;
    }
  };

  // Reject review (admin only)
  const rejectReview = async (reviewId, adminNote = '') => {
    const token = getToken();
    if (!token) return false;
    
    try {
      const response = await fetch(`${API_URL}/api/reviews/admin/${reviewId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adminNote })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchPendingReviews();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Reject review error:', err);
      return false;
    }
  };

  // Delete review (admin only)
  const deleteReview = async (reviewId, productId) => {
    const token = getToken();
    if (!token) return false;
    
    try {
      const response = await fetch(`${API_URL}/api/reviews/admin/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        // Refresh product reviews
        if (productId) {
          await fetchProductReviews(productId);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Delete review error:', err);
      return false;
    }
  };

  // User delete own review
  const deleteOwnReview = async (reviewId, productId) => {
    const token = getToken();
    if (!token) return false;
    
    try {
      const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchProductReviews(productId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Delete review error:', err);
      return false;
    }
  };

  // Get all pending reviews (admin)
  const getAllPendingReviews = () => pendingReviews;

  // Get all approved reviews (admin)
  const getAllApprovedReviews = async () => {
    const data = await fetchAllReviews('approved');
    return data?.reviews || [];
  };

  // Get rating distribution
  const getRatingDistribution = (productId) => {
    const productReviews = getProductReviews(productId);
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    productReviews.forEach(review => {
      distribution[review.rating]++;
    });
    return distribution;
  };

  return (
    <ReviewContext.Provider value={{
      reviews,
      pendingReviews,
      loading,
      error,
      fetchProductReviews,
      getProductReviews,
      getAverageRating,
      getReviewCount,
      getRatingDistribution,
      canUserReview,
      uploadReviewMedia,
      addReview,
      markHelpful,
      fetchPendingReviews,
      fetchAllReviews,
      approveReview,
      rejectReview,
      deleteReview,
      deleteOwnReview,
      getAllPendingReviews,
      getAllApprovedReviews
    }}>
      {children}
    </ReviewContext.Provider>
  );
};

export default ReviewProvider;
