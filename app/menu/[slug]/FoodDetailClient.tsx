"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FoodCard from "@/components/FoodCard";
import { useCart } from "@/context/CartContext";
import { MenuItem } from "@/types/database";
import { formatCurrency } from "@/utils/formatters";
import { getRelatedMenuItems, fallbackCategories } from "@/lib/menuData";
import {
  Star,
  Plus,
  Minus,
  ShoppingBag,
  Clock,
  Flame,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ChefHat,
  Share2,
} from "lucide-react";

interface FoodDetailClientProps {
  item: MenuItem & { rating?: number; reviewCount?: number };
}

export default function FoodDetailClient({ item }: FoodDetailClientProps) {
  const router = useRouter();
  const { addToCart, totalItems, subtotal } = useCart();

  const [quantity, setQuantity] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const isVeg = item.is_vegetarian ?? item.is_veg;
  const imageSrc = item.image || item.image_url;
  const rating = item.rating ?? 4.8;
  const reviewCount = item.reviewCount ?? 128;
  const unitPrice = item.discount_price ?? item.price;
  const totalPrice = unitPrice * quantity;

  // Category name
  const category = fallbackCategories.find((c) => c.id === item.category_id);
  const categoryName = category ? category.name : "Fine Dining";

  // Related items
  const relatedItems = getRelatedMenuItems(item.category_id, item.id);

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleAddToCart = () => {
    addToCart(item, quantity);
    setToastMessage(`Added ${quantity} × ${item.name} to your cart`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col selection:bg-[#d4af37]/30 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between py-4 text-xs text-[var(--text-sub)]">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-[#d4af37] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/menu" className="hover:text-[#d4af37] transition-colors">
              Menu
            </Link>
            <span>/</span>
            <span className="text-[#d4af37] font-medium truncate max-w-[200px] sm:max-w-none">
              {item.name}
            </span>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-sub)] hover:text-[#d4af37] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        {/* ===================================================================
            PHASE 8 SPECIFICATION: FOOD DETAILS CARD
            =================================================================== */}
        <div className="mt-4 bg-[var(--card-bg)] border border-[#d4af37]/25 rounded-3xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left: Food Image Container */}
            <div className="lg:col-span-6 relative min-h-[340px] sm:min-h-[420px] lg:min-h-[540px] bg-[#121212] overflow-hidden group">
              <Image
                src={imageSrc}
                alt={item.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />

              {/* Gradient shadow overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

              {/* Badges Overlay */}
              <div className="absolute top-5 left-5 flex items-center gap-2">
                {/* Veg / Non-Veg Indicator */}
                <div className="bg-[#0a0a0a]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 shadow-lg">
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
                  <span className="text-[11px] uppercase tracking-wider text-white font-semibold">
                    {isVeg ? "Pure Veg" : "Non-Veg"}
                  </span>
                </div>

                {/* Chef Special Badge */}
                {item.is_featured && (
                  <div className="bg-gold-gradient text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Chef Signature</span>
                  </div>
                )}
              </div>

              {/* Share Button Overlay */}
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share dish"
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-[#d4af37] hover:text-black hover:border-[#d4af37] transition-all cursor-pointer shadow-lg"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {copied && (
                <div className="absolute top-16 right-5 bg-black/90 text-[#d4af37] text-[10px] px-3 py-1 rounded-full border border-[#d4af37]/40 shadow-lg animate-in fade-in">
                  Link copied!
                </div>
              )}
            </div>

            {/* Right: Food Information & Actions */}
            <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                {/* Category Pill */}
                <span className="text-[11px] uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
                  {categoryName}
                </span>

                {/* Dish Name */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[var(--text-main)] leading-tight">
                  {item.name}
                </h1>

                {/* Rating Display (⭐ 4.8) */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#d4af37]">
                    <Star className="w-4 h-4 fill-[#d4af37] text-[#d4af37]" />
                    <span className="text-sm font-bold">{rating}</span>
                  </div>
                  <span className="text-xs text-[var(--text-sub)]">
                    ({reviewCount} authentic guest reviews)
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm sm:text-base text-[var(--text-sub)] font-light leading-relaxed">
                  {item.description}
                </p>

                {/* Meta Attributes: Prep Time, Spice Level, Calories */}
                <div className="grid grid-cols-3 gap-3 pt-2 pb-1 border-y border-[#d4af37]/15 text-xs text-[var(--text-sub)]">
                  {item.prep_time_minutes && (
                    <div className="flex flex-col items-center sm:items-start gap-1">
                      <span className="flex items-center gap-1 text-[var(--text-main)] font-semibold">
                        <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>{item.prep_time_minutes} Mins</span>
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--text-sub)]">
                        Prep Time
                      </span>
                    </div>
                  )}

                  {item.spice_level && (
                    <div className="flex flex-col items-center sm:items-start gap-1">
                      <span className="flex items-center gap-1 text-[var(--text-main)] font-semibold capitalize">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <span>{item.spice_level}</span>
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--text-sub)]">
                        Spice Level
                      </span>
                    </div>
                  )}

                  {item.calories && (
                    <div className="flex flex-col items-center sm:items-start gap-1">
                      <span className="flex items-center gap-1 text-[var(--text-main)] font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>{item.calories} kcal</span>
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--text-sub)]">
                        Energy
                      </span>
                    </div>
                  )}
                </div>

                {/* Pricing Display */}
                <div className="flex items-baseline gap-3 pt-2">
                  <span className="text-3xl sm:text-4xl font-serif font-bold text-gold-gradient">
                    {formatCurrency(unitPrice)}
                  </span>
                  {item.discount_price && (
                    <span className="text-base text-[var(--text-sub)] line-through">
                      {formatCurrency(item.price)}
                    </span>
                  )}
                  <span className="text-xs text-[var(--text-sub)]">
                    (inclusive of all taxes)
                  </span>
                </div>
              </div>

              {/* Actions Section: Quantity & Add to Cart */}
              <div className="space-y-4 pt-4 border-t border-[#d4af37]/15">
                {/* Quantity Controls */}
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-[var(--text-main)] font-semibold">
                    Quantity
                  </span>

                  <div className="flex items-center bg-[var(--background)] border border-[#d4af37]/40 rounded-full px-3 py-1.5 gap-4 shadow-inner">
                    <button
                      type="button"
                      onClick={handleDecrease}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37]/20 active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <span className="text-sm font-bold text-[var(--text-main)] min-w-6 text-center select-none">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      onClick={handleIncrease}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37]/20 active:scale-90 transition-all cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Large [ ADD TO CART ] Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-4 rounded-full text-xs sm:text-sm font-bold uppercase tracking-[0.2em] bg-gold-gradient text-black hover:opacity-90 active:scale-[0.99] transition-all shadow-xl gold-glow flex items-center justify-center gap-3 cursor-pointer touch-manipulation"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    Add To Cart • {formatCurrency(totalPrice)}
                  </span>
                </button>

                {/* Assurance Badges */}
                <div className="flex items-center justify-center gap-6 pt-2 text-[11px] text-[var(--text-sub)]">
                  <span className="flex items-center gap-1">
                    <ChefHat className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Master Chef Crafted</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>100% Authentic Quality</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            RELATED DISHES (RECOMMENDED BY CHEF)
            =================================================================== */}
        {relatedItems.length > 0 && (
          <section className="mt-20 space-y-8">
            <div className="flex items-center justify-between border-b border-[#d4af37]/15 pb-4">
              <div>
                <span className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
                  Complete Your Meal
                </span>
                <h2 className="text-2xl font-serif font-bold text-[var(--text-main)] mt-1">
                  You May Also Like
                </h2>
              </div>
              <Link
                href="/menu"
                className="text-xs uppercase tracking-wider text-[#d4af37] hover:underline"
              >
                View Full Menu →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedItems.map((dish) => (
                <FoodCard
                  key={dish.id}
                  item={dish}
                  onAddToCart={(d) => {
                    addToCart(d);
                    setToastMessage(`Added ${d.name} to cart`);
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Floating Sticky Cart Indicator */}
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
            <span>{totalItems} in Cart • {formatCurrency(subtotal)}</span>
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

      <Footer />
    </div>
  );
}
