import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UtensilsCrossed, ArrowLeft } from "lucide-react";

export default function FoodNotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-32">
        <div className="max-w-md w-full text-center space-y-6 bg-[var(--card-bg)] border border-[#d4af37]/30 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center mx-auto text-[#d4af37]">
            <UtensilsCrossed className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
              Dish Not Available
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--text-main)]">
              Culinary Item Not Found
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-[var(--text-sub)] font-light leading-relaxed">
            The dish you are looking for may have been rotated with our seasonal royal menu or the link might be misspelled.
          </p>

          <div className="pt-2">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all shadow-md"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Explore Full Menu</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
