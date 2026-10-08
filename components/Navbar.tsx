"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Menu, X, User } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--nav-bg)] backdrop-blur-md border-b border-[var(--card-border)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#d4af37]/40 group-hover:border-[#d4af37] transition-all duration-300">
              <Image
                src="/logo.jpg"
                alt="NEXORA Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-serif tracking-[0.25em] text-gold-gradient font-bold">
                NEXORA
              </span>
              <span className="text-[10px] tracking-[0.3em] text-[#d4af37]/70 uppercase -mt-1">
                Fine Dining & Lounge
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm uppercase tracking-widest text-[var(--text-main)] hover:text-[#d4af37] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/menu"
              className="text-sm uppercase tracking-widest text-[var(--text-sub)] hover:text-[#d4af37] transition-colors"
            >
              Menu
            </Link>
            <Link
              href="/menu"
              className="text-sm uppercase tracking-widest text-[var(--text-sub)] hover:text-[#d4af37] transition-colors"
            >
              Order Online
            </Link>
            <Link
              href="#about"
              className="text-sm uppercase tracking-widest text-[var(--text-sub)] hover:text-[#d4af37] transition-colors"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="text-sm uppercase tracking-widest text-[var(--text-sub)] hover:text-[#d4af37] transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Right Action Icons & Buttons */}
          <div className="hidden md:flex items-center gap-5">
            {/* Login Link */}
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[var(--text-main)] hover:text-[#d4af37] transition-colors px-3 py-2"
            >
              <User className="w-4 h-4 text-[#d4af37]" />
              <span>Login</span>
            </Link>

            {/* Cart Icon Button */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-full bg-[var(--card-bg)] border border-[#d4af37]/30 hover:border-[#d4af37] hover:gold-glow-sm transition-all"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#d4af37]" />
              <span className="absolute -top-1 -right-1 bg-[#d4af37] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                0
              </span>
            </Link>

            {/* Reserve Table / Order Now Button */}
            <Link
              href="/menu"
              className="px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 transition-opacity gold-glow-sm"
            >
              Order Now
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-3">
            <Link
              href="/cart"
              className="relative p-2.5 rounded-full bg-[var(--card-bg)] border border-[#d4af37]/30 active:scale-95 transition-transform"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#d4af37] pointer-events-none" />
              <span className="absolute -top-1 -right-1 bg-[#d4af37] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center pointer-events-none">
                0
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2.5 rounded-xl bg-[var(--card-bg)] border border-[#d4af37]/40 text-[#d4af37] hover:border-[#d4af37] active:scale-95 transition-all cursor-pointer touch-manipulation select-none flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 pointer-events-none text-[#d4af37]" />
              ) : (
                <Menu className="w-6 h-6 pointer-events-none text-[#d4af37]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--background)] backdrop-blur-xl border-b border-[var(--card-border)] px-6 py-6 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-lg text-sm uppercase tracking-widest text-[var(--text-main)] hover:text-[#d4af37] hover:bg-white/5 transition-all"
          >
            Home
          </Link>
          <Link
            href="/menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-lg text-sm uppercase tracking-widest text-[var(--text-main)] hover:text-[#d4af37] hover:bg-white/5 transition-all"
          >
            Menu
          </Link>
          <Link
            href="/menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-lg text-sm uppercase tracking-widest text-[var(--text-main)] hover:text-[#d4af37] hover:bg-white/5 transition-all"
          >
            Order Online
          </Link>
          <Link
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-lg text-sm uppercase tracking-widest text-[var(--text-main)] hover:text-[#d4af37] hover:bg-white/5 transition-all"
          >
            About
          </Link>
          <Link
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-lg text-sm uppercase tracking-widest text-[var(--text-main)] hover:text-[#d4af37] hover:bg-white/5 transition-all"
          >
            Contact
          </Link>
          <div className="pt-4 mt-2 border-t border-[var(--card-border)] flex items-center justify-between gap-3">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#d4af37] py-2 px-3 rounded-lg hover:bg-white/5"
            >
              <User className="w-4 h-4 pointer-events-none" />
              <span>Login</span>
            </Link>
            <Link
              href="/menu"
              onClick={() => setMobileMenuOpen(false)}
              className="px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all text-center"
            >
              Order Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
