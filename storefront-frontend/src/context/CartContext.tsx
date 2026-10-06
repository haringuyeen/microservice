import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cart } from '../types';
import { fetchCart, addToCart, updateCartItem, removeCartItem, clearCart } from '../api/storefrontApi';
import { useCustomerAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addItem: (productId: number, quantity: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearUserCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getSessionId = (): string => {
  let sid = localStorage.getItem('velvety_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('velvety_session_id', sid);
  }
  return sid;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useCustomerAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const sessionId = getSessionId();

  const loadCart = useCallback(async () => {
    try {
      const res = await fetchCart(sessionId);
      setCart(res.data);
    } catch (err) {
      console.error('Failed to load cart', err);
    }
  }, [sessionId]);

  useEffect(() => {
    loadCart();
  }, [loadCart, user]);

  const addItem = async (productId: number, quantity: number) => {
    setLoading(true);
    try {
      const res = await addToCart(productId, quantity, sessionId);
      setCart(res.data);
      setCartOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemId: number, quantity: number) => {
    setLoading(true);
    try {
      const res = await updateCartItem(itemId, quantity, sessionId);
      setCart(res.data);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    setLoading(true);
    try {
      const res = await removeCartItem(itemId, sessionId);
      setCart(res.data);
    } finally {
      setLoading(false);
    }
  };

  const clearUserCart = async () => {
    setLoading(true);
    try {
      await clearCart(sessionId);
      await loadCart();
    } finally {
      setLoading(false);
    }
  };

  const totalItems = cart?.totalItems || (cart?.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0);
  const totalAmount = cart?.totalAmount || (cart?.items ? cart.items.reduce((sum, item) => sum + item.totalPrice, 0) : 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        cartOpen,
        setCartOpen,
        addItem,
        updateItem,
        removeItem,
        clearUserCart,
        refreshCart: loadCart,
        totalItems,
        totalAmount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
