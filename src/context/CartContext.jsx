import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const savedCart = localStorage.getItem('pinkCart');
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      setCart(parsed);
      setCartCount(parsed.reduce((sum, i) => sum + i.quantity, 0));
    }
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      let newCart;
      if (existing) {
        newCart = prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        newCart = [...prev, { ...product, quantity: 1 }];
      }
      localStorage.setItem('pinkCart', JSON.stringify(newCart));
      setCartCount(newCart.reduce((sum, i) => sum + i.quantity, 0));
      return newCart;
    });
  };

  return (
    <CartContext.Provider value={{ cart, cartCount, addToCart }}>
      {children}
    </CartContext.Provider>
  );
};
