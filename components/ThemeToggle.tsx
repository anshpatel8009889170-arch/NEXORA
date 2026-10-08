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
        className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-full border shadow-2xl backdrop-blur-md active:scale-95 transition-all duration-300 cursor-pointer touch-manipulation select-none ${
          isLight
            ? "bg-white text-[#121212] border-[#b8860b] shadow-xl hover:bg-neutral-50"
            : "bg-[#141414] text-[#d4af37] border-[#d4af37]/50 hover:border-[#d4af37] gold-glow-sm"
        }`}
      >
        {isLight ? (
          <>
            <Moon className="w-4 h-4 text-[#b8860b] shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#121212] inline-block">
              Night Mode
            </span>
          </>
        ) : (
          <>
            <Sun className="w-4 h-4 text-[#f5d77f] shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#f5f5f0] inline-block">
              Day Mode
            </span>
          </>
        )}
      </button>

      {/* Floating tooltip */}
      <span className="pointer-events-none absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-[#d4af37] text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md whitespace-nowrap border border-[#d4af37]/30 shadow-lg hidden md:block">
        {isLight ? "🌙 Switch to Royal Night Mode" : "☀️ Switch to Royal Day Mode (Dhoop Mode)"}
      </span>
    </div>
  );
}
