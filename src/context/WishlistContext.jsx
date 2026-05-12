import { createContext, useState, useContext, useEffect } from 'react';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const savedWishlist = localStorage.getItem('pinkWishlist');
    if (savedWishlist) {
      const parsed = JSON.parse(savedWishlist);
      setWishlist(parsed);
      setWishlistCount(parsed.length);
    }
  }, []);

  const addToWishlist = (product) => {
    setWishlist(prev => {
      const existing = prev.find(i => i.id === product.id);
      let newWishlist;
      if (existing) {
        newWishlist = prev;
        alert(`${product.name} is already in your wishlist ❤️`);
      } else {
        newWishlist = [...prev, product];
        alert(`${product.name} added to wishlist ❤️`);
      }
      localStorage.setItem('pinkWishlist', JSON.stringify(newWishlist));
      setWishlistCount(newWishlist.length);
      return newWishlist;
    });
  };

  const removeFromWishlist = (id) => {
    setWishlist(prev => {
      const newWishlist = prev.filter(item => item.id !== id);
      localStorage.setItem('pinkWishlist', JSON.stringify(newWishlist));
      setWishlistCount(newWishlist.length);
      alert('Removed from wishlist');
      return newWishlist;
    });
  };

  const isInWishlist = (id) => {
    return wishlist.some(item => item.id === id);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, wishlistCount, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
