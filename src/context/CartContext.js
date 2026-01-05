import React, { createContext, useState, useEffect, useCallback } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = sessionStorage.getItem("cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    sessionStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product) => {
    setCartItems(prev => {
      const exist = prev.find(i => i.id === product.id);
      if (exist) {
        return prev.map(i =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    setCartItems(prev =>
      prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    sessionStorage.removeItem("cart");
  }, []);

  const cartCount = cartItems.reduce((s, i) => s + (i.quantity || 0), 0);
  const totalPrice = cartItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};
