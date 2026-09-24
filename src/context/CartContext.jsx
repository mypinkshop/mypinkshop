import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// ✅ Unique cart key generator (product + variant)
const getCartItemKey = (product) => {
  const productId = product.id || product._id;
  const variantId = product.variantId || product.variant_id || '';
  return variantId ? `${productId}::${variantId}` : productId;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotalAmount, setCartTotalAmount] = useState(0);

  // ✅ Load cart from localStorage (with migration)
  useEffect(() => {
    const savedCart = localStorage.getItem('pinkCart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        // ✅ Purane items me cartKey add karo (migration)
        const migrated = parsed.map(item => ({
          ...item,
          cartKey: item.cartKey || (item.variantId ? `${item.id}::${item.variantId}` : item.id),
        }));
        setCart(migrated);
        setCartCount(migrated.reduce((sum, i) => sum + i.quantity, 0));
        setCartTotalAmount(migrated.reduce((sum, i) => sum + (i.price * i.quantity), 0));
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

  // ✅ Add to cart with variants
  const addToCart = (product) => {
    const productId = product.id || product._id;
    const cartKey = getCartItemKey(product);

    setCart(prev => {
      const existing = prev.find(i => i.cartKey === cartKey);

      // ✅ Saare variant fields preserve karo
      const productToAdd = {
        cartKey,
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

        // ✅ VARIANT FIELDS
        variantId: product.variantId || null,
        variantSku: product.variantSku || null,
        variantImage: product.variantImage || null,
        variantLabel: product.variantLabel || null,
        size: product.size || null,
        color: product.color || null,
        option1Name: product.option1Name || null,
        option2Name: product.option2Name || null,
      };

      if (existing) {
        const newQuantity = existing.quantity + (product.quantity || 1);
        if (existing.stock && newQuantity > existing.stock) {
          return prev;
        }
        return prev.map(i =>
          i.cartKey === cartKey ? { ...i, quantity: newQuantity } : i
        );
      }

      return [...prev, productToAdd];
    });
  };

  // ✅ Remove from cart (by cartKey)
  const removeFromCart = (cartKey) => {
    setCart(prev => prev.filter(i => i.cartKey !== cartKey));
  };

  // ✅ Update quantity (by cartKey)
  const updateQuantity = (cartKey, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(cartKey);
      return;
    }
    setCart(prev =>
      prev.map(i =>
        i.cartKey === cartKey ? { ...i, quantity: newQuantity } : i
      )
    );
  };

  // ✅ Increase quantity
  const increaseQuantity = (cartKey) => {
    setCart(prev =>
      prev.map(i => {
        if (i.cartKey === cartKey) {
          const newQuantity = i.quantity + 1;
          if (i.stock && newQuantity > i.stock) return i;
          return { ...i, quantity: newQuantity };
        }
        return i;
      })
    );
  };

  // ✅ Decrease quantity
  const decreaseQuantity = (cartKey) => {
    setCart(prev =>
      prev.map(i => {
        if (i.cartKey === cartKey) {
          const newQuantity = i.quantity - 1;
          if (newQuantity < 1) return null;
          return { ...i, quantity: newQuantity };
        }
        return i;
      }).filter(Boolean)
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
