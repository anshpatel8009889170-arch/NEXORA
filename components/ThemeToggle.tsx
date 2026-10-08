"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check saved theme or default to dark
    const saved = localStorage.getItem("nexora-theme");
    if (saved === "light") {
      setTheme("light");
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      setTheme("dark");
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("nexora-theme", next);

    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-5 z-40 flex items-center group">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={
          theme === "dark"
            ? "Switch to Royal Day Mode (Sunlight Mode)"
            : "Switch to Royal Night Mode"
        }
        className="relative flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#141414]/90 dark-theme-toggle border border-[#d4af37]/50 hover:border-[#d4af37] text-[#d4af37] shadow-2xl backdrop-blur-md gold-glow-sm active:scale-95 transition-all duration-300 cursor-pointer touch-manipulation select-none"
      >
        {theme === "dark" ? (
          <>
            <Sun className="w-4 h-4 text-[#f5d77f] animate-spin-slow shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#f5f5f0] hidden sm:inline-block">
              Day Mode
            </span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-[#141414] shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#141414] hidden sm:inline-block">
              Night Mode
            </span>
          </>
        )}
      </button>

      {/* Floating tooltip on mobile/desktop hover */}
      <span className="pointer-events-none absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-[#d4af37] text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md whitespace-nowrap border border-[#d4af37]/30 shadow-lg hidden md:block">
        {theme === "dark" ? "☀️ Royal Ivory (Dhoop Mode)" : "🌙 Royal Obsidian (Night Mode)"}
      </span>
    </div>
  );
}
