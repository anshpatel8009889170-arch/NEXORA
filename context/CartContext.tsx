"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MenuItem, CartItem } from "@/types/database";
import { useRestaurantSettings } from "@/context/SettingsContext";

export interface AppliedCoupon {
  code: string;
  discountType: "flat" | "percentage";
  discountValue: number;
  minOrder?: number;
  maxDiscount?: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  grandTotal: number;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (coupon: AppliedCoupon) => boolean;
  removeCoupon: () => void;
  addToCart: (item: MenuItem, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  getItemQuantity: (itemId: string) => number;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load cart and coupon from localStorage on initial mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("nexora-cart");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }

      const savedCoupon = localStorage.getItem("nexora-coupon");
      if (savedCoupon) {
        const parsedCoupon = JSON.parse(savedCoupon);
        if (parsedCoupon && parsedCoupon.code) {
          setAppliedCoupon(parsedCoupon);
        }
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Persist cart items whenever they change (ONLY after initial load is done)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("nexora-cart", JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [items, isLoaded]);

  // 3. Persist applied coupon whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (appliedCoupon) {
        localStorage.setItem("nexora-coupon", JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem("nexora-coupon");
      }
    } catch (e) {
      console.error("Failed to save coupon to localStorage", e);
    }
  }, [appliedCoupon, isLoaded]);

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
    setAppliedCoupon(null);
  };

  const getItemQuantity = (itemId: string) => {
    const found = items.find((ci) => ci.menuItem.id === itemId);
    return found ? found.quantity : 0;
  };

  const applyCoupon = (coupon: AppliedCoupon): boolean => {
    if (subtotal < (coupon.minOrder || 0)) {
      return false;
    }
    setAppliedCoupon(coupon);
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const totalItems = items.reduce((sum, ci) => sum + ci.quantity, 0);

  const subtotal = items.reduce((sum, ci) => {
    const price = ci.menuItem.discount_price ?? ci.menuItem.price;
    return sum + price * ci.quantity;
  }, 0);

  const { settings } = useRestaurantSettings();

  // Delivery fee: Dynamic from restaurant settings (defaults to ₹40)
  const configuredFee = typeof settings?.delivery_fee === "number" ? settings.delivery_fee : 40;
  const deliveryFee = items.length > 0 ? configuredFee : 0;

  // Calculate discount amount
  let discountAmount = 0;
  if (appliedCoupon && items.length > 0) {
    if (subtotal >= (appliedCoupon.minOrder || 0)) {
      if (appliedCoupon.discountType === "percentage") {
        let calc = Math.round((subtotal * appliedCoupon.discountValue) / 100);
        if (appliedCoupon.maxDiscount && appliedCoupon.maxDiscount > 0) {
          calc = Math.min(calc, appliedCoupon.maxDiscount);
        }
        discountAmount = calc;
      } else {
        discountAmount = appliedCoupon.discountValue;
      }
      // Ensure discount doesn't exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal);
    }
  }

  // Grand Total: Subtotal - Discount + Delivery
  const grandTotal = items.length > 0 ? Math.max(0, subtotal - discountAmount + deliveryFee) : 0;

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        deliveryFee,
        discountAmount,
        grandTotal,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemQuantity,
        isLoaded,
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
