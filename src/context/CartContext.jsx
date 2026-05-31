import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const savedCart = localStorage.getItem('pinkCart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCart(parsed);
        setCartCount(parsed.reduce((sum, i) => sum + i.quantity, 0));
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
  }, []);

  // ✅ FIXED: Add to cart with proper image storage
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      let newCart;
      
      // Ensure image is properly captured
      const productToAdd = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity || 1,
        image: product.image || product.images?.[0] || null,
        category: product.category || '',
        emoji: product.emoji || '✨',
        stock: product.stock || 0
      };
      
      if (existing) {
        newCart = prev.map(i => 
          i.id === product.id 
            ? { ...i, quantity: i.quantity + (product.quantity || 1) } 
            : i
        );
      } else {
        newCart = [...prev, productToAdd];
      }
      
      localStorage.setItem('pinkCart', JSON.stringify(newCart));
      setCartCount(newCart.reduce((sum, i) => sum + i.quantity, 0));
      return newCart;
    });
  };

  // Remove from cart
  const removeFromCart = (id) => {
    setCart(prev => {
      const newCart = prev.filter(i => i.id !== id);
      localStorage.setItem('pinkCart', JSON.stringify(newCart));
      setCartCount(newCart.reduce((sum, i) => sum + i.quantity, 0));
      return newCart;
    });
  };

  // Update quantity
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }
    setCart(prev => {
      const newCart = prev.map(i => 
        i.id === id ? { ...i, quantity: newQuantity } : i
      );
      localStorage.setItem('pinkCart', JSON.stringify(newCart));
      setCartCount(newCart.reduce((sum, i) => sum + i.quantity, 0));
      return newCart;
    });
  };

  // Cart total
  const cartTotal = () => {
    return cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  };

  // Clear cart (for after checkout)
  const clearCart = () => {
    setCart([]);
    setCartCount(0);
    localStorage.removeItem('pinkCart');
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      cartCount, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      cartTotal,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
