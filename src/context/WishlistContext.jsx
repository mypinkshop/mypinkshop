import { createContext, useState, useContext, useEffect } from 'react';
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

  // Load wishlist from localStorage and backend
  useEffect(() => {
    const loadWishlist = async () => {
      setLoading(true);
      
      const token = getToken();
      const user = getUser();
      
      if (token && user) {
        // Logged in user - fetch from backend
        try {
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
          } else if (response.status === 401) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('token');
            // Load from localStorage as guest
            loadGuestWishlist();
          }
        } catch (error) {
          console.error('Error fetching wishlist:', error);
          loadGuestWishlist();
        }
      } else {
        // Guest user - load from localStorage
        loadGuestWishlist();
      }
      
      setLoading(false);
    };
    
    const loadGuestWishlist = () => {
      const saved = localStorage.getItem('guestWishlist');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const wishlistData = Array.isArray(parsed) ? parsed : [];
          setWishlist(wishlistData);
          setWishlistCount(wishlistData.length);
        } catch (e) {
          setWishlist([]);
          setWishlistCount(0);
        }
      } else {
        setWishlist([]);
        setWishlistCount(0);
      }
    };
    
    loadWishlist();
    
    // Listen for storage changes (for sync across tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'guestWishlist') {
        loadGuestWishlist();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('wishlistUpdated'));
    window.dispatchEvent(new Event('storage'));
    
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

  const removeFromWishlist = async (id) => {
    const newWishlist = wishlist.filter(item => (item._id !== id && item.id !== id));
    setWishlist(newWishlist);
    setWishlistCount(newWishlist.length);
    
    // Save to localStorage
    localStorage.setItem('guestWishlist', JSON.stringify(newWishlist));
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('wishlistUpdated'));
    window.dispatchEvent(new Event('storage'));
    
    // If user is logged in, remove from backend
    const token = getToken();
    if (token) {
      try {
        const response = await fetch(`${API_URL}/api/wishlist/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          console.error('Failed to remove from backend');
        }
      } catch (error) {
        console.error('Error removing from backend wishlist:', error);
      }
    }
    
    toast.success('Removed from wishlist');
  };

  const isInWishlist = (id) => {
    return wishlist.some(item => (item._id === id || item.id === id));
  };

  const clearWishlist = async () => {
    setWishlist([]);
    setWishlistCount(0);
    localStorage.removeItem('guestWishlist');
    localStorage.removeItem('pinkWishlist');
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('wishlistUpdated'));
    window.dispatchEvent(new Event('storage'));
    
    const token = getToken();
    if (token) {
      try {
        await fetch(`${API_URL}/api/wishlist/clear/all`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Error clearing wishlist:', error);
      }
    }
    
    toast.success('Wishlist cleared');
  };

  return (
    <WishlistContext.Provider value={{ 
      wishlist, 
      wishlistCount, 
      loading,
      addToWishlist, 
      removeFromWishlist, 
      isInWishlist,
      clearWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
