"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, User, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRestaurantSettings } from "@/context/SettingsContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const { totalItems } = useCart();
  const { isLoggedIn, profile } = useAuth();
  const { settings } = useRestaurantSettings();

  // Smart Scroll Header: Hide on scroll down, show on scroll up
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Near the very top, always show
          if (currentScrollY < 30) {
            setIsVisible(true);
          } else if (currentScrollY > lastScrollY && currentScrollY > 70) {
            // Scrolling down -> hide navbar
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY) {
            // Scrolling up -> reveal navbar
            setIsVisible(true);
          }
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-[var(--nav-bg)] backdrop-blur-md border-b border-[var(--card-border)] transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* LOGO (Exact same size maintained) */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-md group-hover:scale-105 transition-all duration-300">
              <Image
                src={settings.logo_url || "/logo.png"}
                alt={`${settings.name} Logo`}
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-serif tracking-[0.25em] text-gold-gradient font-bold">
                {settings.name.split(" ")[0]}
              </span>
              <span className="text-[10px] tracking-[0.3em] text-[#d4af37]/70 uppercase -mt-1">
                {settings.name.includes(" ") ? settings.name.slice(settings.name.indexOf(" ") + 1) : "Fine Dining & Lounge"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-7">
            <Link
              href="/"
              className="text-xs uppercase tracking-widest text-[var(--text-main)] hover:text-[#d4af37] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/menu"
              className="text-xs uppercase tracking-widest text-[var(--text-sub)] hover:text-[#d4af37] transition-colors"
            >
              Menu
            </Link>
            <Link
              href="/menu"
              className="text-xs uppercase tracking-widest text-[var(--text-sub)] hover:text-[#d4af37] transition-colors"
            >
              Order Online
            </Link>
            <Link
              href="/#about"
              className="text-xs uppercase tracking-widest text-[var(--text-sub)] hover:text-[#d4af37] transition-colors"
            >
              About
            </Link>
            <Link
              href="/offers"
              className="text-xs uppercase tracking-widest text-[var(--text-sub)] hover:text-[#d4af37] transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-[#d4af37]" />
              <span>Offers</span>
            </Link>
          </div>

          {/* Desktop Right Action Icons & Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle (Day / Night Mode) */}
            <ThemeToggle />

            {/* Login / Profile Link */}
            <Link
              href={isLoggedIn ? "/account" : "/login"}
              className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[var(--text-main)] hover:text-[#d4af37] transition-colors px-2 py-1.5"
            >
              <User className="w-4 h-4 text-[#d4af37]" />
              <span>{isLoggedIn && profile?.full_name ? profile.full_name.split(" ")[0] : "Login"}</span>
            </Link>

            {/* Cart Icon Button with Live Count */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-full bg-[var(--card-bg)] border border-[#d4af37]/30 hover:border-[#d4af37] hover:gold-glow-sm active:scale-95 transition-all"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#d4af37]" />
              <span className="absolute -top-1 -right-1 bg-gold-gradient text-black text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-md">
                {totalItems}
              </span>
            </Link>

            {/* Order Now Button */}
            <Link
              href="/menu"
              className="px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all gold-glow-sm"
            >
              Order Now
            </Link>
          </div>

          {/* Mobile Right Controls: Day/Night Theme Toggle Only (Three lines hamburger removed) */}
          <div className="flex md:hidden items-center">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
