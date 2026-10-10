"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, Sparkles, ShoppingBag, Clock, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { isLoggedIn } = useAuth();

  // Hide mobile bottom nav on admin portal routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      href: "/menu",
      label: "Menu",
      icon: UtensilsCrossed,
      isActive: pathname.startsWith("/menu"),
    },
    {
      href: "/offers",
      label: "Offers",
      icon: Sparkles,
      isActive: pathname.startsWith("/offers"),
    },
    {
      href: "/cart",
      label: "Cart",
      icon: ShoppingBag,
      badge: totalItems > 0 ? totalItems : null,
      isActive: pathname.startsWith("/cart"),
    },
    {
      href: isLoggedIn ? "/account" : "/track-order",
      label: isLoggedIn ? "Account" : "Track",
      icon: isLoggedIn ? User : Clock,
      isActive: pathname.startsWith("/account") || pathname.startsWith("/track-order"),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--card-bg)]/95 backdrop-blur-xl border-t border-[var(--card-border)] pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.35)] transition-colors duration-200"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-90 touch-manipulation select-none relative ${
                active
                  ? "text-[#d4af37]"
                  : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    active ? "scale-110 text-[#d4af37]" : ""
                  }`}
                />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-gold-gradient text-black text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-in zoom-in-75">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-wider mt-1 transition-colors ${
                  active ? "font-bold text-[#d4af37]" : "font-medium"
                }`}
              >
                {item.label}
              </span>

              {/* Active Golden Glow Pill Indicator */}
              {active && (
                <span className="w-1.5 h-1.5 rounded-full bg-gold-gradient mt-0.5 gold-glow-sm animate-in fade-in" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
