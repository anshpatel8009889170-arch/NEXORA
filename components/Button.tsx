"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold uppercase tracking-widest transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation focus:outline-none";

  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-[11px] rounded-lg gap-1.5",
    md: "px-5 py-2.5 text-xs rounded-full gap-2",
    lg: "px-7 py-3.5 text-xs sm:text-sm rounded-full gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-gold-gradient text-black hover:opacity-90 gold-glow-sm shadow-md",
    secondary:
      "bg-[#141414] text-[#f5f5f0] border border-[#d4af37]/40 hover:border-[#d4af37] hover:bg-[#1a1a1a]",
    outline:
      "bg-transparent text-[#d4af37] border border-[#d4af37] hover:bg-[#d4af37]/10",
    ghost:
      "bg-transparent text-[#f5f5f0]/80 hover:text-[#d4af37] hover:bg-white/5",
    danger:
      "bg-red-950/80 text-red-300 border border-red-700/50 hover:bg-red-900",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
