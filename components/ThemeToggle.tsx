"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
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
    return (
      <div
        className={`w-10 h-10 rounded-full border border-[#d4af37]/30 bg-[var(--card-bg)] opacity-40 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isLight
          ? "Switch to Royal Night Mode"
          : "Switch to Royal Day Mode (Sunlight Mode)"
      }
      title={isLight ? "Switch to Royal Night Mode" : "Switch to Royal Day Mode"}
      className={`relative w-10 h-10 rounded-full border shadow-md backdrop-blur-md active:scale-90 hover:scale-105 transition-all duration-300 cursor-pointer touch-manipulation select-none flex items-center justify-center ${
        isLight
          ? "bg-white border-[#b8860b]/50 text-[#b8860b] hover:bg-neutral-50 shadow-sm"
          : "bg-[var(--card-bg)] border-[#d4af37]/40 text-[#f5d77f] hover:border-[#d4af37] gold-glow-sm"
      } ${className}`}
    >
      {isLight ? (
        <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#b8860b] transition-transform duration-300 -rotate-12" />
      ) : (
        <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#f5d77f] transition-transform duration-300 hover:rotate-45" />
      )}
    </button>
  );
}
