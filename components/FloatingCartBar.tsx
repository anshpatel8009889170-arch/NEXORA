"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/utils/formatters";

export default function FloatingCartBar() {
  const pathname = usePathname();
  const { totalItems, subtotal } = useCart();

  // Hide on cart, checkout, and admin pages
  if (
    totalItems === 0 ||
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <>
      {/* 1. Mobile Floating Banner (Right above MobileBottomNav on 390px-767px screens) */}
      <div className="md:hidden fixed bottom-[max(calc(env(safe-area-inset-bottom)+58px),66px)] left-3 right-3 z-30 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <Link
          href="/cart"
          className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gold-gradient text-black font-semibold text-xs uppercase tracking-wider shadow-2xl gold-glow active:scale-[0.98] transition-all cursor-pointer border border-black/20"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative bg-black/15 p-1.5 rounded-lg">
              <ShoppingBag className="w-4 h-4 text-black" />
              <span className="absolute -top-1 -right-1 bg-black text-[#d4af37] text-[9px] font-bold min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[11px] font-bold">
                {totalItems} {totalItems === 1 ? "Item" : "Items"} in Cart
              </span>
              <span className="text-[10px] opacity-80 font-mono font-medium">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1.5 rounded-xl font-bold text-[11px]">
            <span>View Cart</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {/* 2. Desktop Floating Pill (At bottom-right on 768px+ screens) */}
      <div className="hidden md:block fixed bottom-6 right-6 z-30 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <Link
          href="/cart"
          className="flex items-center gap-3 px-5 py-3 rounded-full bg-gold-gradient text-black font-semibold text-xs uppercase tracking-wider shadow-2xl gold-glow hover:opacity-95 active:scale-95 transition-all cursor-pointer border border-black/20"
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4 text-black" />
            <span className="absolute -top-1.5 -right-2 bg-black text-[#d4af37] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          </div>
          <span>
            {totalItems} {totalItems > 1 ? "Items" : "Item"} • {formatCurrency(subtotal)}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </>
  );
}
