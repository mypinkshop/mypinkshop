import { createContext, useState, useContext, useEffect } from 'react';

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

  // Load wishlist from localStorage and backend
  useEffect(() => {
    const loadWishlist = async () => {
      setLoading(true);
      
      // First load from localStorage (for guest users)
      const savedWishlist = localStorage.getItem('pinkWishlist');
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        setWishlist(parsed);
        setWishlistCount(parsed.length);
      }
      
      // If user is logged in, sync with backend
      const token = getToken();
      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/wishlist`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const backendWishlist = await response.json();
            if (backendWishlist.length > 0) {
              setWishlist(backendWishlist);
              setWishlistCount(backendWishlist.length);
              localStorage.setItem('pinkWishlist', JSON.stringify(backendWishlist));
            }
          } else if (response.status === 401) {
            // Token expired or invalid, clear localStorage
            localStorage.removeItem('pinkWishlist');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Error fetching wishlist from backend:', error);
        }
      }
      
      setLoading(false);
    };
    
    loadWishlist();
  }, []);

  const addToWishlist = async (product) => {
    const productId = product._id || product.id;
    
    // Check if already in wishlist
    if (wishlist.some(item => (item._id === productId || item.id === productId))) {
      alert(`${product.name} is already in your wishlist ❤️`);
      return;
    }
    
    const wishlistItem = {
      _id: productId,
      id: productId,
      name: product.name,
      price: product.price || product.sellingPrice,
      image: product.images?.[0] || product.image,
      brand: product.brand,
      category: product.category,
      originalPrice: product.originalPrice
    };
    
    // Update local state
    const newWishlist = [...wishlist, wishlistItem];
    setWishlist(newWishlist);
    setWishlistCount(newWishlist.length);
    localStorage.setItem('pinkWishlist', JSON.stringify(newWishlist));
    
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
    
    alert(`${product.name} added to wishlist ❤️`);
  };

  const removeFromWishlist = async (id) => {
    const newWishlist = wishlist.filter(item => (item._id !== id && item.id !== id));
    setWishlist(newWishlist);
    setWishlistCount(newWishlist.length);
    localStorage.setItem('pinkWishlist', JSON.stringify(newWishlist));
    
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
    
    alert('Removed from wishlist');
  };

  const isInWishlist = (id) => {
    return wishlist.some(item => (item._id === id || item.id === id));
  };

  const clearWishlist = async () => {
    setWishlist([]);
    setWishlistCount(0);
    localStorage.removeItem('pinkWishlist');
    
    const token = getToken();
    if (token) {
      try {
        await fetch(`${API_URL}/api/wishlist/clear`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Error clearing wishlist:', error);
      }
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
      clearWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
