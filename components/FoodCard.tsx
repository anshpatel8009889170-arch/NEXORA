"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, Flame, Clock } from "lucide-react";
import { MenuItem } from "@/types/database";
import { formatCurrency } from "@/utils/formatters";

export interface FoodCardProps {
  item: MenuItem;
  quantityInCart?: number;
  onAddToCart?: (item: MenuItem) => void;
  onIncrement?: (item: MenuItem) => void;
  onDecrement?: (item: MenuItem) => void;
}

export default function FoodCard({
  item,
  quantityInCart = 0,
  onAddToCart,
  onIncrement,
  onDecrement,
}: FoodCardProps) {
  const isVeg = item.is_vegetarian ?? item.is_veg;
  const imageSrc = item.image || item.image_url;
  const itemLink = `/menu/${item.slug || item.id}`;

  return (
    <div className="group rounded-2xl bg-[#121212] border border-[#d4af37]/20 hover:border-[#d4af37]/60 hover:gold-glow-sm transition-all duration-300 flex flex-col overflow-hidden">
      {/* Dish Image Container */}
      <Link href={itemLink} className="relative w-full h-48 sm:h-52 overflow-hidden bg-[#181818] block">
        <Image
          src={imageSrc}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Subtle dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/30 pointer-events-none" />

        {/* Veg / Non-Veg Badge */}
        <div className="absolute top-3 left-3 bg-[#0a0a0a]/85 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 flex items-center gap-1.5 shadow-md">
          <div
            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center p-[2px] ${
              isVeg ? "border-green-500" : "border-red-500"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isVeg ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </div>
          <span className="text-[10px] uppercase tracking-wider text-[#f5f5f0]/90 font-medium">
            {isVeg ? "Veg" : "Non-Veg"}
          </span>
        </div>

        {/* Featured Tag */}
        {item.is_featured && (
          <div className="absolute top-3 right-3 bg-gold-gradient text-black text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md">
            Chef Special
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <Link href={itemLink} className="block group-hover:text-gold-gradient transition-colors">
              <h3 className="text-base font-serif font-semibold text-[#f5f5f0] group-hover:text-gold-gradient transition-colors leading-snug">
                {item.name}
              </h3>
            </Link>
          </div>

          <Link href={itemLink} className="block">
            <p className="text-xs text-[#f5f5f0]/65 line-clamp-2 font-light leading-relaxed">
              {item.description}
            </p>
          </Link>

          {/* Meta tags: Prep Time / Spice Level */}
          <div className="flex items-center gap-3 pt-2 text-[11px] text-[#f5f5f0]/50">
            {item.prep_time_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#d4af37]" />
                <span>{item.prep_time_minutes}m</span>
              </span>
            )}
            {item.spice_level && (
              <span className="flex items-center gap-1 capitalize">
                <Flame className="w-3 h-3 text-orange-400" />
                <span>{item.spice_level}</span>
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="pt-3 border-t border-[#d4af37]/15 flex items-center justify-between gap-3">
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-serif font-bold text-gold-gradient">
              {formatCurrency(item.discount_price ?? item.price)}
            </span>
            {item.discount_price && (
              <span className="text-xs text-[#f5f5f0]/40 line-through">
                {formatCurrency(item.price)}
              </span>
            )}
          </div>

          {/* Add to Cart or Quantity Controls */}
          {quantityInCart === 0 ? (
            <button
              type="button"
              onClick={() => onAddToCart && onAddToCart(item)}
              className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer touch-manipulation"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          ) : (
            <div className="flex items-center bg-[#1c1c1c] border border-[#d4af37]/40 rounded-full px-2 py-1 gap-2">
              <button
                type="button"
                onClick={() => onDecrement && onDecrement(item)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37]/20 active:scale-90 transition-transform cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-bold text-[#f5f5f0] min-w-4 text-center">
                {quantityInCart}
              </span>
              <button
                type="button"
                onClick={() => onIncrement && onIncrement(item)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37]/20 active:scale-90 transition-transform cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
