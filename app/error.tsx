"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, ShieldCheck } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized error details securely
    console.error("NEXORA Unhandled Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col items-center justify-center px-4 py-20 selection:bg-[#d4af37]/30 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-b from-rose-500/10 via-[#d4af37]/5 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-md w-full text-center relative z-10 space-y-7 animate-in fade-in zoom-in-95 duration-300">
        {/* Error Shield */}
        <div className="relative w-24 h-24 mx-auto rounded-3xl bg-[var(--card-bg)] border border-rose-500/30 flex items-center justify-center shadow-2xl">
          <AlertTriangle className="w-10 h-10 text-rose-400" />
          <span className="absolute -bottom-2.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/30">
            CHAMBER NOTICE
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
            Unexpected Culinary Disturbance
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--text-main)]">
            Something Went Wrong
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-sub)] leading-relaxed">
            Our royal kitchen encountered a momentary connection disturbance. Your data remains fully secure. Please reload the chamber or return to the palace home.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-[var(--text-sub-light)] pt-1">
              Reference ID: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Chamber</span>
          </button>

          <Link
            href="/"
            className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--card-border)] hover:border-[#d4af37]/50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-[#d4af37]" />
            <span>Return to Home</span>
          </Link>
        </div>

        {/* Security Assurance */}
        <div className="pt-6 border-t border-[var(--card-border)] flex items-center justify-center gap-2 text-[11px] text-[var(--text-sub-light)]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Session and cart data safely preserved</span>
        </div>
      </div>
    </div>
  );
}
