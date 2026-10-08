"use client";

import React from "react";
import { Utensils } from "lucide-react";
import { Category } from "@/types/database";

export interface CategoryCardProps {
  category: Category;
  isActive?: boolean;
  itemCount?: number;
  onClick?: () => void;
}

export default function CategoryCard({
  category,
  isActive = false,
  itemCount,
  onClick,
}: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full p-4 sm:p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer select-none touch-manipulation flex flex-col justify-between min-h-[110px] ${
        isActive
          ? "bg-[#181818] border-[#d4af37] gold-glow-sm"
          : "bg-[#121212] border-[#d4af37]/20 hover:border-[#d4af37]/50 hover:bg-[#161616]"
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <div
          className={`p-2.5 rounded-xl border transition-colors ${
            isActive
              ? "bg-[#d4af37] text-black border-[#d4af37]"
              : "bg-[#1c1c1c] text-[#d4af37] border-[#d4af37]/30 group-hover:border-[#d4af37]"
          }`}
        >
          <Utensils className="w-4 h-4" />
        </div>

        {itemCount !== undefined && (
          <span className="text-[11px] text-[#f5f5f0]/50 tracking-wider">
            {itemCount} items
          </span>
        )}
      </div>

      <div className="mt-3">
        <h3
          className={`text-sm sm:text-base font-serif font-semibold tracking-wide transition-colors ${
            isActive
              ? "text-gold-gradient"
              : "text-[#f5f5f0] group-hover:text-gold-gradient"
          }`}
        >
          {category.name}
        </h3>
        {category.description && (
          <p className="text-[11px] text-[#f5f5f0]/55 line-clamp-1 mt-0.5 font-light">
            {category.description}
          </p>
        )}
      </div>
    </button>
  );
}
