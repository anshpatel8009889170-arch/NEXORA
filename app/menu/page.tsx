"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import FoodCard from "@/components/FoodCard";
import { useCart } from "@/context/CartContext";
import { fallbackMenuItems, fallbackCategories } from "@/lib/menuData";
import { MenuItem } from "@/types/database";
import {
  Search,
  Sparkles,
  UtensilsCrossed,
  ArrowRight,
  ShoppingBag,
  CheckCircle2,
  X,
  Filter,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

export default function MenuPage() {
  const { addToCart, updateQuantity, getItemQuantity, totalItems, subtotal } = useCart();
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dietFilter, setDietFilter] = useState<"all" | "veg" | "non-veg">("all");
  
  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item);
    showToast(`Added ${item.name} to your cart`);
  };

  const handleIncrement = (item: MenuItem) => {
    updateQuantity(item.id, 1);
  };

  const handleDecrement = (item: MenuItem) => {
    updateQuantity(item.id, -1);
  };

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return fallbackMenuItems.filter((item) => {
      // 1. Category filter
      if (selectedCategory !== "all") {
        const category = fallbackCategories.find((c) => c.slug === selectedCategory);
        if (category && item.category_id !== category.id) {
          return false;
        }
      }

      // 2. Dietary filter (veg / non-veg)
      const isVeg = item.is_vegetarian ?? item.is_veg;
      if (dietFilter === "veg" && !isVeg) return false;
      if (dietFilter === "non-veg" && isVeg) return false;

      // 3. Search query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesSlug = item.slug?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesSlug) return false;
      }

      return true;
    });
  }, [selectedCategory, dietFilter, searchQuery]);

  // Categories list with [All] at the start
  const categoryFilters = [
    { slug: "all", name: "All", count: fallbackMenuItems.length },
    ...fallbackCategories.map((c) => ({
      slug: c.slug || c.id,
      name: c.name.replace("Royal ", "").replace("Woodfire ", "").replace(" & Elixirs", ""),
      count: fallbackMenuItems.filter((item) => item.category_id === c.id).length,
    })),
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col selection:bg-[#d4af37]/30 selection:text-white">

      {/* Hero / Page Header */}
      <header className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#d4af37]/15 overflow-hidden">
        {/* Subtle radial background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#d4af37]/10 via-[#d4af37]/5 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs text-[#d4af37] font-medium uppercase tracking-[0.25em]">
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>NEXORA Culinary Repertoire</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight text-[var(--text-main)]">
            Our Grand <span className="text-gold-gradient">Menu</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[var(--text-sub)] font-light leading-relaxed">
            Authentic North Indian delicacies, hand-crafted woodfire creations, and royal sweets prepared fresh to order with pure culinary craftsmanship.
          </p>

          {/* Quick Search Bar */}
          <div className="max-w-md mx-auto pt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37]" />
              <input
                type="text"
                placeholder="Search dishes (e.g. Paneer Tikka, Dal Bukhara)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-full bg-[var(--card-bg)] border border-[#d4af37]/30 text-[var(--text-main)] placeholder-[var(--text-sub)] text-xs sm:text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-sub)] hover:text-[var(--text-main)] p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Controls Bar: Category Buttons & Veg / Non-Veg Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#d4af37]/15">
          {/* Category Tabs: [All] [Starters] [Main Course] [Pizza] [Desserts] [Drinks] */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {categoryFilters.map((cat) => {
              const isActive = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer touch-manipulation flex items-center gap-1.5 ${
                    isActive
                      ? "bg-gold-gradient text-black shadow-md font-bold"
                      : "bg-[var(--card-bg)] text-[var(--text-sub)] hover:text-[var(--text-main)] border border-[#d4af37]/20 hover:border-[#d4af37]/50"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-black/20 text-black" : "bg-[#d4af37]/10 text-[#d4af37]"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dietary Toggle: [All] [Veg Only] [Non-Veg Only] */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-[var(--card-bg)] p-1 rounded-full border border-[#d4af37]/25 text-xs">
            <button
              type="button"
              onClick={() => setDietFilter("all")}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
                dietFilter === "all"
                  ? "bg-[#d4af37]/20 text-[#d4af37] font-semibold"
                  : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setDietFilter("veg")}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 font-medium ${
                dietFilter === "veg"
                  ? "bg-green-500/20 text-green-400 font-semibold"
                  : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Veg Only
            </button>
            <button
              type="button"
              onClick={() => setDietFilter("non-veg")}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 font-medium ${
                dietFilter === "non-veg"
                  ? "bg-red-500/20 text-red-400 font-semibold"
                  : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Non-Veg
            </button>
          </div>
        </div>

        {/* Results Count Banner */}
        <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
          <div>
            Showing <span className="font-semibold text-[var(--text-main)]">{filteredItems.length}</span> signature dishes
            {searchQuery && (
              <span> matching &ldquo;<span className="text-[#d4af37]">{searchQuery}</span>&rdquo;</span>
            )}
          </div>
          {(selectedCategory !== "all" || dietFilter !== "all" || searchQuery !== "") && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setDietFilter("all");
                setSearchQuery("");
              }}
              className="text-[#d4af37] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset all filters
            </button>
          )}
        </div>

        {/* If user clicked Non-Veg, show dedicated "Now Unavailable" Section */}
        {dietFilter === "non-veg" ? (
          <div className="py-20 sm:py-24 text-center space-y-6 bg-[var(--card-bg)] rounded-3xl border border-[#d4af37]/30 p-8 sm:p-14 shadow-xl max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Red Non-Veg Badge Indicator */}
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400 shadow-inner">
              <div className="w-5 h-5 rounded-sm border border-red-500 flex items-center justify-center p-[2px]">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-red-400 font-semibold">
                Non-Veg Kitchen Section
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[var(--text-main)]">
                Now Unavailable
              </h2>
            </div>

            <p className="text-sm text-[var(--text-sub)] max-w-md mx-auto leading-relaxed font-light">
              NEXORA is currently operating exclusively as a 100% Pure Vegetarian royal kitchen. Non-Veg preparations are now unavailable and will be introduced in the future.
            </p>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => setDietFilter("all")}
                className="px-8 py-3.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                View Pure Veg Menu
              </button>
            </div>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((dish) => {
              const qty = getItemQuantity(dish.id);
              return (
                <FoodCard
                  key={dish.id}
                  item={dish}
                  quantityInCart={qty}
                  onAddToCart={handleAddToCart}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                />
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="py-20 text-center space-y-4 bg-[var(--card-bg)] rounded-3xl border border-[#d4af37]/20 p-8">
            <div className="w-16 h-16 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center mx-auto text-[#d4af37]">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[var(--text-main)]">
              No Culinary Creations Found
            </h3>
            <p className="text-sm text-[var(--text-sub)] max-w-md mx-auto">
              We couldn&apos;t find any pure veg dishes matching your exact filter criteria. Try adjusting your search term.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setDietFilter("all");
                setSearchQuery("");
              }}
              className="px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md"
            >
              View Full Menu
            </button>
          </div>
        )}
      </main>

      {/* Floating Sticky Cart Indicator if items exist */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Link
            href="/cart"
            className="flex items-center gap-3 px-5 py-3 rounded-full bg-gold-gradient text-black font-semibold text-xs uppercase tracking-wider shadow-2xl gold-glow hover:opacity-95 active:scale-95 transition-all cursor-pointer border border-black/20"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              <span className="absolute -top-1.5 -right-2 bg-black text-[#d4af37] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            </div>
            <span>{totalItems} Item{totalItems > 1 ? "s" : ""} • {formatCurrency(subtotal)}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[var(--card-bg)] text-[var(--text-main)] border border-[#d4af37]/50 px-5 py-3 rounded-full shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
