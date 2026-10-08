"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Menu, X, User } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[rgba(212,175,55,0.2)]">
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
              className="text-sm uppercase tracking-widest text-[#f5f5f0] hover:text-[#d4af37] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/menu"
              className="text-sm uppercase tracking-widest text-[#f5f5f0]/80 hover:text-[#d4af37] transition-colors"
            >
              Menu
            </Link>
            <Link
              href="/menu"
              className="text-sm uppercase tracking-widest text-[#f5f5f0]/80 hover:text-[#d4af37] transition-colors"
            >
              Order Online
            </Link>
            <Link
              href="#about"
              className="text-sm uppercase tracking-widest text-[#f5f5f0]/80 hover:text-[#d4af37] transition-colors"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="text-sm uppercase tracking-widest text-[#f5f5f0]/80 hover:text-[#d4af37] transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Right Action Icons & Buttons */}
          <div className="hidden md:flex items-center gap-5">
            {/* Login Link */}
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#f5f5f0]/90 hover:text-[#d4af37] transition-colors px-3 py-2"
            >
              <User className="w-4 h-4 text-[#d4af37]" />
              <span>Login</span>
            </Link>

            {/* Cart Icon Button */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-full bg-[#141414] border border-[#d4af37]/30 hover:border-[#d4af37] hover:gold-glow-sm transition-all"
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
              className="relative p-2 rounded-full bg-[#141414] border border-[#d4af37]/30"
            >
              <ShoppingBag className="w-5 h-5 text-[#d4af37]" />
              <span className="absolute -top-1 -right-1 bg-[#d4af37] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                0
              </span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#d4af37] focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0e0e0e] border-b border-[#d4af37]/20 px-6 py-6 space-y-4">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm uppercase tracking-widest text-[#f5f5f0] hover:text-[#d4af37]"
          >
            Home
          </Link>
          <Link
            href="/menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm uppercase tracking-widest text-[#f5f5f0] hover:text-[#d4af37]"
          >
            Menu
          </Link>
          <Link
            href="/menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm uppercase tracking-widest text-[#f5f5f0] hover:text-[#d4af37]"
          >
            Order Online
          </Link>
          <Link
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm uppercase tracking-widest text-[#f5f5f0] hover:text-[#d4af37]"
          >
            About
          </Link>
          <Link
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm uppercase tracking-widest text-[#f5f5f0] hover:text-[#d4af37]"
          >
            Contact
          </Link>
          <div className="pt-4 border-t border-[#d4af37]/15 flex items-center justify-between">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-sm text-[#d4af37]"
            >
              <User className="w-4 h-4" />
              <span>Login / Account</span>
            </Link>
            <Link
              href="/menu"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-gold-gradient text-black"
            >
              Order Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
