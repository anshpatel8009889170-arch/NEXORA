import React from "react";

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 space-y-5">
      {/* Royal Gold Concentric Spinner */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-[#d4af37]/20 border-t-[#d4af37] animate-spin" />
        <div className="w-8 h-8 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/40 flex items-center justify-center animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-gold-gradient shadow-sm" />
        </div>
      </div>

      <div className="text-center space-y-1.5">
        <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
          NEXORA Fine Dining
        </p>
        <p className="text-xs text-[var(--text-sub)] animate-pulse">
          Preparing royal gastronomy experience...
        </p>
      </div>
    </div>
  );
}
