import React from "react";
import Link from "next/link";
import { UtensilsCrossed, ArrowRight, Home, Sparkles, ChefHat } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col items-center justify-center px-4 py-20 selection:bg-[#d4af37]/30 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#d4af37]/10 via-[#d4af37]/5 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-md w-full text-center relative z-10 space-y-7 animate-in fade-in zoom-in-95 duration-300">
        {/* Royal Crest / 404 Badge */}
        <div className="relative w-24 h-24 mx-auto rounded-3xl bg-[var(--card-bg)] border border-[#d4af37]/40 flex items-center justify-center shadow-2xl gold-glow-sm">
          <UtensilsCrossed className="w-10 h-10 text-[#d4af37]" />
          <span className="absolute -bottom-2.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-gold-gradient text-black shadow-md">
            404 ERROR
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
            Culinary Chamber Uncharted
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[var(--text-main)]">
            Dish or Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-sub)] leading-relaxed">
            The culinary creation, private dining chamber, or order page you are seeking might have been moved, retired, or entered an incorrect address.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-2 space-y-3">
          <Link
            href="/"
            className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl"
          >
            <Home className="w-4 h-4" />
            <span>Return to Royal Palace</span>
          </Link>

          <Link
            href="/menu"
            className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--card-border)] hover:border-[#d4af37]/50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ChefHat className="w-4 h-4 text-[#d4af37]" />
            <span>Browse Signature Menu</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#d4af37]" />
          </Link>
        </div>

        {/* Quick Suggestions */}
        <div className="pt-6 border-t border-[var(--card-border)] text-xs text-[var(--text-sub)] space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-[var(--text-sub-light)] font-semibold">
            Guest Favorites:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Paneer Tikka", href: "/menu/paneer-tikka" },
              { label: "Dal Bukhara", href: "/menu/dal-bukhara" },
              { label: "Exclusive Offers", href: "/offers" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-3 py-1 rounded-full text-[11px] bg-[var(--section-alt)] border border-[var(--card-border)] hover:border-[#d4af37]/50 text-[var(--text-main)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
