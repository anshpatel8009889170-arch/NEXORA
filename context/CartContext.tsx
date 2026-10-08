"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MenuItem, CartItem } from "@/types/database";

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addToCart: (item: MenuItem, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  getItemQuantity: (itemId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("nexora-cart");
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    }
  }, []);

  // Save cart to localStorage on update
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem("nexora-cart", JSON.stringify(items));
      } catch (e) {
        console.error("Failed to save cart to localStorage", e);
      }
    }
  }, [items, mounted]);

  const addToCart = (menuItem: MenuItem, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.id === menuItem.id
            ? { ...ci, quantity: ci.quantity + quantity }
            : ci
        );
      }
      return [...prev, { menuItem, quantity: Math.max(1, quantity) }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((ci) => ci.menuItem.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((ci) => {
          if (ci.menuItem.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemQuantity = (itemId: string) => {
    const found = items.find((ci) => ci.menuItem.id === itemId);
    return found ? found.quantity : 0;
  };

  const totalItems = items.reduce((sum, ci) => sum + ci.quantity, 0);

  const subtotal = items.reduce((sum, ci) => {
    const price = ci.menuItem.discount_price ?? ci.menuItem.price;
    return sum + price * ci.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
