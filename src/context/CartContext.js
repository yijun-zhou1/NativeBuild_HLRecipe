// 建議放：src/context/CartContext.js
import React, { createContext, useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';

export const CartContext = createContext({
  cartItems: [],
  addToCart: () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
});

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = useCallback((product, qty = 1) => {
    const quantity = Math.max(1, Number(qty) || 1);

    setCartItems(prev => {
      const idx = prev.findIndex(it => it.id === product.id);
      if (idx !== -1) {
        const next = [...prev];
        const current = next[idx].quantity || 1;
        next[idx] = { ...next[idx], quantity: current + quantity };
        return next;
      }
      return [...prev, { ...product, quantity }];
    });

    Alert.alert('加入購物車', `已將 ${product.name} 加入購物車！`);
  }, []);

  const updateQuantity = useCallback((productId, newQuantity) => {
    const q = Math.max(1, Number(newQuantity) || 1);
    setCartItems(prev =>
      prev.map(it => (it.id === productId ? { ...it, quantity: q } : it))
    );
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems(prev => prev.filter(it => it.id !== productId));
  }, []);

  const value = useMemo(
    () => ({ cartItems, addToCart, updateQuantity, removeFromCart }),
    [cartItems, addToCart, updateQuantity, removeFromCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
