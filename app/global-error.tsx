"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-[#141414] border border-[#d4af37]/30 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-serif font-bold text-white">
              Application Error
            </h1>
            <p className="text-xs text-neutral-400">
              An unexpected critical error occurred. Please reload the application.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full py-3 rounded-full text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa771c] text-black shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Application</span>
            </button>

            <Link
              href="/"
              className="block py-2 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
