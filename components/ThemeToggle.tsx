"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("nexora-theme");
    if (saved === "light") {
      setTheme("light");
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.add("light");
    } else {
      setTheme("dark");
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("nexora-theme", next);

    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.remove("light");
    }
  };

  if (!mounted) {
    return null;
  }

  const isLight = theme === "light";

  return (
    <div className="fixed bottom-5 left-5 z-50 flex items-center group">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={
          isLight
            ? "Switch to Royal Night Mode"
            : "Switch to Royal Day Mode (Sunlight Mode)"
        }
        className={`w-12 h-12 rounded-full border shadow-2xl backdrop-blur-md active:scale-90 hover:scale-105 transition-all duration-300 cursor-pointer touch-manipulation select-none flex items-center justify-center ${
          isLight
            ? "bg-white border-[#b8860b] shadow-xl hover:bg-neutral-50"
            : "bg-[#141414] border-[#d4af37]/50 hover:border-[#d4af37] gold-glow-sm"
        }`}
      >
        {isLight ? (
          <Moon className="w-5 h-5 text-[#b8860b] transition-transform duration-300 -rotate-12" />
        ) : (
          <Sun className="w-5 h-5 text-[#f5d77f] transition-transform duration-300 hover:rotate-45" />
        )}
      </button>

      {/* Floating tooltip on hover (desktop only) */}
      <span className="pointer-events-none absolute left-full ml-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-[#d4af37] text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg whitespace-nowrap border border-[#d4af37]/30 shadow-xl hidden md:block">
        {isLight ? "🌙 Night Mode" : "☀️ Day Mode"}
      </span>
    </div>
  );
}
