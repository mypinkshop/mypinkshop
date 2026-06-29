import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotalAmount, setCartTotalAmount] = useState(0);

  // ✅ Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('pinkCart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCart(parsed);
        setCartCount(parsed.reduce((sum, i) => sum + i.quantity, 0));
        setCartTotalAmount(parsed.reduce((sum, i) => sum + (i.price * i.quantity), 0));
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
  }, []);

  // ✅ Update cart count and total whenever cart changes
  useEffect(() => {
    const count = cart.reduce((sum, i) => sum + i.quantity, 0);
    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    setCartCount(count);
    setCartTotalAmount(total);
    localStorage.setItem('pinkCart', JSON.stringify(cart));
  }, [cart]);

  // ✅ Add to cart with proper image handling
  const addToCart = (product) => {
    const productId = product.id || product._id;
    
    setCart(prev => {
      const existing = prev.find(i => i.id === productId);
      
      // ✅ Ensure image is properly captured
      const productToAdd = {
        id: productId,
        name: product.name || 'Product',
        price: product.price || 0,
        quantity: product.quantity || 1,
        image: product.image || product.images?.[0] || null,
        category: product.category || product.mainCategory || '',
        emoji: product.emoji || '✨',
        stock: product.stock || 0,
        originalPrice: product.originalPrice || null,
        rating: product.rating || null,
      };
      
      if (existing) {
        // ✅ Check stock before increasing quantity
        const newQuantity = existing.quantity + (product.quantity || 1);
        if (existing.stock && newQuantity > existing.stock) {
          return prev; // Not enough stock
        }
        return prev.map(i => 
          i.id === productId 
            ? { ...i, quantity: newQuantity } 
            : i
        );
      }
      
      return [...prev, productToAdd];
    });
  };

  // ✅ Remove from cart
  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  // ✅ Update quantity
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }
    
    setCart(prev => 
      prev.map(i => 
        i.id === id ? { ...i, quantity: newQuantity } : i
      )
    );
  };

  // ✅ Increase quantity
  const increaseQuantity = (id) => {
    setCart(prev => 
      prev.map(i => {
        if (i.id === id) {
          const newQuantity = i.quantity + 1;
          if (i.stock && newQuantity > i.stock) {
            return i; // Not enough stock
          }
          return { ...i, quantity: newQuantity };
        }
        return i;
      })
    );
  };

  // ✅ Decrease quantity
  const decreaseQuantity = (id) => {
    setCart(prev => 
      prev.map(i => {
        if (i.id === id) {
          const newQuantity = i.quantity - 1;
          if (newQuantity < 1) {
            return null; // Will be filtered out
          }
          return { ...i, quantity: newQuantity };
        }
        return i;
      }).filter(Boolean) // Remove null items
    );
  };

  // ✅ Cart total
  const cartTotal = () => {
    return cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  };

  // ✅ Item count
  const totalItems = () => {
    return cart.reduce((sum, i) => sum + i.quantity, 0);
  };

  // ✅ Clear cart
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('pinkCart');
  };

  return (
    <CartContext.Provider value={{ 
      cart,
      cartCount,
      cartTotalAmount,
      addToCart,
      removeFromCart,
      updateQuantity,
      increaseQuantity,
      decreaseQuantity,
      cartTotal,
      totalItems,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
