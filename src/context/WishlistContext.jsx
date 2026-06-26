import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const API_URL = 'https://api.mypinkshop.com';
  
  const getToken = () => {
    return localStorage.getItem('adminToken') || localStorage.getItem('token');
  };

  const getUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  // ============ GUEST: Load from localStorage ============
  const loadGuestWishlist = useCallback(() => {
    const saved = localStorage.getItem('guestWishlist');
    console.log('🟢 CONTEXT - Loading guest wishlist:', saved);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const wishlistData = Array.isArray(parsed) ? parsed : [];
        setWishlist(wishlistData);
        setWishlistCount(wishlistData.length);
        return wishlistData;
      } catch (e) {
        setWishlist([]);
        setWishlistCount(0);
        return [];
      }
    } else {
      setWishlist([]);
      setWishlistCount(0);
      return [];
    }
  }, []);

  // ============ FETCH WISHLIST (ONLY FOR LOGGED IN USERS) ============
  const fetchWishlist = useCallback(async () => {
    const token = getToken();
    const user = getUser();
    
    // ✅ GUEST MODE: Only load from localStorage, don't call backend
    if (!token || !user) {
      console.log('🟢 CONTEXT - fetchWishlist: Guest mode, loading from localStorage ONLY');
      const data = loadGuestWishlist();
      return data;
    }
    
    // ✅ LOGGED IN USER: Fetch from backend
    try {
      console.log('🟢 CONTEXT - fetchWishlist: Fetching from backend for logged in user');
      const response = await fetch(`${API_URL}/api/wishlist`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const backendWishlist = await response.json();
        const wishlistData = Array.isArray(backendWishlist) ? backendWishlist : [];
        setWishlist(wishlistData);
        setWishlistCount(wishlistData.length);
        // Also save to localStorage for consistency
        localStorage.setItem('guestWishlist', JSON.stringify(wishlistData));
        console.log('🟢 CONTEXT - fetchWishlist: Fetched', wishlistData.length, 'items from backend');
        return wishlistData;
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('token');
        const data = loadGuestWishlist();
        return data;
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      const data = loadGuestWishlist();
      return data;
    }
  }, [loadGuestWishlist]);

  // ============ Load wishlist on mount ============
  useEffect(() => {
    const loadWishlist = async () => {
      setLoading(true);
      await fetchWishlist();
      setLoading(false);
    };
    
    loadWishlist();
    
    // Listen for storage changes (for sync across tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'guestWishlist') {
        console.log('🟢 CONTEXT - Storage event detected');
        loadGuestWishlist();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom event
    const handleCustomEvent = () => {
      console.log('🟢 CONTEXT - Custom event detected');
      const token = getToken();
      const user = getUser();
      if (!token || !user) {
        loadGuestWishlist();
      } else {
        fetchWishlist();
      }
    };
    window.addEventListener('wishlistUpdated', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wishlistUpdated', handleCustomEvent);
    };
  }, [fetchWishlist, loadGuestWishlist]);

  // ============ ADD TO WISHLIST ============
  const addToWishlist = async (product) => {
    const productId = product._id || product.id;
    
    // Check if already in wishlist
    if (wishlist.some(item => (item._id === productId || item.id === productId))) {
      toast.error(`${product.name} is already in your wishlist ❤️`);
      return;
    }
    
    const wishlistItem = {
      _id: productId,
      id: productId,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      images: product.images,
      image: product.images?.[0] || product.image,
      brand: product.brand,
      rating: product.rating || 4,
      stock: product.stock
    };
    
    // Update local state
    const newWishlist = [...wishlist, wishlistItem];
    setWishlist(newWishlist);
    setWishlistCount(newWishlist.length);
    
    // Save to localStorage (for guest and backup)
    localStorage.setItem('guestWishlist', JSON.stringify(newWishlist));
    console.log('🟢 CONTEXT - Added to guest wishlist:', newWishlist);
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('wishlistUpdated'));
    
    // If user is logged in, save to backend
    const token = getToken();
    if (token) {
      try {
        const response = await fetch(`${API_URL}/api/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId: productId })
        });
        
        if (!response.ok) {
          console.error('Failed to save to backend');
        }
      } catch (error) {
        console.error('Error adding to backend wishlist:', error);
      }
    }
    
    toast.success(`${product.name} added to wishlist ❤️`);
  };

  // ============ REMOVE FROM WISHLIST ============
  const removeFromWishlist = async (id) => {
    console.log('🟢 CONTEXT - removeFromWishlist:', id);
    
    const token = getToken();
    const user = getUser();
    
    // ✅ GUEST MODE: Handle locally only
    if (!token || !user) {
      console.log('🟢 CONTEXT - Guest mode remove');
      const saved = localStorage.getItem('guestWishlist');
      let currentList = [];
      if (saved) {
        try {
          currentList = JSON.parse(saved);
          if (!Array.isArray(currentList)) currentList = [];
        } catch (e) {
          currentList = [];
        }
      }
      const newWishlist = currentList.filter(item => (item._id !== id && item.id !== id));
      console.log('🟢 CONTEXT - New guest wishlist:', newWishlist);
      
      // ✅ Update state
      setWishlist(newWishlist);
      setWishlistCount(newWishlist.length);
      
      // ✅ Save to localStorage
      localStorage.setItem('guestWishlist', JSON.stringify(newWishlist));
      
      // ✅ Dispatch event so Wishlist.jsx updates
      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
      
      toast.success('Removed from wishlist');
      return;
    }
    
    // ✅ LOGGED IN USER: Remove from backend
    try {
      const response = await fetch(`${API_URL}/api/wishlist/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const newWishlist = wishlist.filter(item => (item._id !== id && item.id !== id));
        setWishlist(newWishlist);
        setWishlistCount(newWishlist.length);
        localStorage.setItem('guestWishlist', JSON.stringify(newWishlist));
        window.dispatchEvent(new CustomEvent('wishlistUpdated'));
        toast.success('Removed from wishlist');
      } else {
        toast.error('Failed to remove from wishlist');
      }
    } catch (error) {
      console.error('Error removing from backend wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  // ============ IS IN WISHLIST ============
  const isInWishlist = (id) => {
    return wishlist.some(item => (item._id === id || item.id === id));
  };

  // ============ CLEAR WISHLIST ============
  const clearWishlist = async () => {
    const token = getToken();
    const user = getUser();
    
    if (!token || !user) {
      // Guest mode
      setWishlist([]);
      setWishlistCount(0);
      localStorage.removeItem('guestWishlist');
      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
      toast.success('Wishlist cleared');
      return;
    }
    
    // Logged in user
    try {
      await fetch(`${API_URL}/api/wishlist/clear/all`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setWishlist([]);
      setWishlistCount(0);
      localStorage.removeItem('guestWishlist');
      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
      toast.success('Wishlist cleared');
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      toast.error('Failed to clear wishlist');
    }
  };

  return (
    <WishlistContext.Provider value={{ 
      wishlist, 
      wishlistCount, 
      loading,
      addToWishlist, 
      removeFromWishlist, 
      isInWishlist,
      clearWishlist,
      fetchWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
