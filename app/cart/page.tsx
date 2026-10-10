"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ChevronRight,
  Tag,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
  Clock,
  Sparkles,
  UtensilsCrossed,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/lib/supabase/client";
import { Offer } from "@/types/database";

export default function CartPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const {
    items,
    totalItems,
    subtotal,
    deliveryFee,
    discountAmount,
    grandTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    updateQuantity,
    removeFromCart,
    clearCart,
    isLoaded,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [cookingInstructions, setCookingInstructions] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [availableOffers, setAvailableOffers] = useState<Offer[]>([]);

  // Load available active offers for quick one-click chips
  useEffect(() => {
    async function loadActiveOffers() {
      try {
        // 1. Try local admin storage first for immediate updates
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("nexora_admin_offers");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setAvailableOffers(parsed.filter((o: Offer) => o.is_active));
            }
          }
        }

        // 2. Query /api/offers
        const res = await fetch("/api/offers");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.offers)) {
            setAvailableOffers(json.offers.filter((o: Offer) => o.is_active));
          }
        }
      } catch (err) {
        console.warn("Could not load offers:", err);
      }
    }

    loadActiveOffers();
  }, []);

  // Handle applying a coupon code via Backend Verification API (/api/offers/verify)
  const handleApplyCoupon = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const code = (customCode || couponInput).trim().toUpperCase();
    if (!code) return;

    setCouponError(null);
    setCouponSuccess(null);
    setIsApplyingCoupon(true);

    try {
      // Backend Verification checks: valid?, expired?, minimum order?, maximum discount?, already used?
      const res = await fetch("/api/offers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          subtotal,
          userId: user?.id,
          phone: user?.phone || profile?.phone,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        const applied = applyCoupon({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrder: data.minOrder,
          maxDiscount: data.maxDiscount,
        });

        if (applied) {
          setCouponSuccess(data.message || `Coupon ${data.code} applied successfully!`);
          setCouponError(null);
          setCouponInput("");
        } else {
          setCouponError(`Coupon requires minimum order of ₹${data.minOrder}.`);
          setCouponSuccess(null);
        }
      } else {
        setCouponError(data.error || `Unable to apply coupon "${code}".`);
        setCouponSuccess(null);
      }
    } catch {
      setCouponError("Unable to verify coupon on server. Please try again.");
      setCouponSuccess(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Loading state while reading localStorage on initial render
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest text-[var(--text-sub)]">
            Loading your royal cart...
          </p>
        </div>
      </div>
    );
  }

  // EMPTY CART STATE
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col selection:bg-[#d4af37]/30 selection:text-white">
        <main className="flex-1 pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex items-center justify-center">
          <div className="max-w-md w-full text-center space-y-6 py-12 animate-in fade-in duration-300">
            <div className="relative w-28 h-28 mx-auto rounded-full bg-[var(--card-bg)] border border-[#d4af37]/30 flex items-center justify-center shadow-2xl gold-glow-sm">
              <ShoppingBag className="w-12 h-12 text-[#d4af37]" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] font-semibold">
                NEXORA Dining & Delivery
              </span>
              <h1 className="text-3xl font-serif font-bold text-[var(--text-main)]">
                Your Royal Cart is Empty
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-sub)] leading-relaxed">
                You haven&apos;t added any delicacies to your cart yet. Explore our handcrafted royal menu and indulge in pure gourmet dining.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all shadow-lg"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Explore Gourmet Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="pt-6 border-t border-[var(--card-border)] flex items-center justify-center gap-6 text-xs text-[var(--text-sub)]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                <span>100% Pure Veg</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#d4af37]" />
                <span>30–35 Mins Delivery</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ACTIVE CART VIEW
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col selection:bg-[#d4af37]/30 selection:text-white">
      <main className="flex-1 pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 py-4 text-xs text-[var(--text-sub)]">
          <Link href="/" className="hover:text-[#d4af37] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-[var(--text-sub-light)]" />
          <Link href="/menu" className="hover:text-[#d4af37] transition-colors">
            Menu
          </Link>
          <ChevronRight className="w-3 h-3 text-[var(--text-sub-light)]" />
          <span className="text-[#d4af37] font-medium">Your Cart</span>
        </div>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[var(--card-border)]">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
              Review Your Selection
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[var(--text-main)] pt-1">
              Your Cart
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-sub)]">
              {totalItems} Item{totalItems > 1 ? "s" : ""} selected
            </span>
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-500/20 hover:border-rose-500/40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          </div>
        </div>

        {/* 2-Column Layout: Left Items List, Right Order Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
          {/* ==========================================================
              LEFT COLUMN: CART ITEMS LIST (lg:col-span-7)
              ========================================================== */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-4">
              {items.map(({ menuItem, quantity }) => {
                const effectivePrice = menuItem.discount_price ?? menuItem.price;
                const itemTotal = effectivePrice * quantity;

                return (
                  <div
                    key={menuItem.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[#d4af37]/40 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md"
                  >
                    {/* Item Image + Details */}
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-[#151515] border border-[var(--card-border)]">
                        {menuItem.image_url ? (
                          <Image
                            src={menuItem.image_url}
                            alt={menuItem.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 80px, 96px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#181818] text-[#d4af37]">
                            <UtensilsCrossed className="w-6 h-6 opacity-40" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 flex-1">
                        {/* Veg Badge */}
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border border-emerald-500 flex items-center justify-center p-0.5 rounded-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">
                            Pure Veg
                          </span>
                        </div>

                        <Link
                          href={`/menu/${menuItem.slug}`}
                          className="font-serif font-bold text-sm sm:text-base text-[var(--text-main)] hover:text-[#d4af37] transition-colors line-clamp-1 block"
                        >
                          {menuItem.name}
                        </Link>

                        <div className="text-xs text-[var(--text-sub)]">
                          <span>{formatCurrency(effectivePrice)}</span>
                          <span className="text-[var(--text-sub-light)] mx-1">×</span>
                          <span className="font-semibold text-[var(--text-main)]">{quantity}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls & Line Total */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--card-border)]">
                      {/* Quantity Selector [-] [qty] [+] */}
                      <div className="flex items-center bg-[var(--section-alt)] rounded-full border border-[var(--card-border)] px-1 py-0.5 shadow-inner">
                        <button
                          type="button"
                          onClick={() => updateQuantity(menuItem.id, -1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-[var(--text-main)]"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-[var(--text-main)]">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(menuItem.id, 1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-[#d4af37]"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right min-w-20">
                        <span className="text-sm sm:text-base font-serif font-bold text-[var(--text-main)]">
                          {formatCurrency(itemTotal)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(menuItem.id)}
                        className="p-1.5 text-[var(--text-sub-light)] hover:text-rose-400 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Special Instructions Note */}
            <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-[#d4af37]" />
                <span>Special Cooking Instructions / Note</span>
              </div>
              <textarea
                value={cookingInstructions}
                onChange={(e) => setCookingInstructions(e.target.value)}
                placeholder="e.g. Less spicy, pack extra mint chutney, no onion or garlic in dishes..."
                rows={2}
                className="w-full text-xs p-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37] resize-none transition-all"
              />
            </div>

            {/* Continue Shopping Link */}
            <div className="pt-2">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#d4af37] hover:underline"
              >
                <span>+ Add more gourmet dishes from menu</span>
              </Link>
            </div>
          </div>

          {/* ==========================================================
              RIGHT COLUMN: ORDER SUMMARY & CHECKOUT (lg:col-span-5)
              ========================================================== */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] p-6 sm:p-7 space-y-6 shadow-xl sticky top-28 gold-glow-sm">
              <h2 className="text-lg font-serif font-bold text-[var(--text-main)] pb-3 border-b border-[var(--card-border)] flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-sans font-normal text-[var(--text-sub)]">
                  {totalItems} Item{totalItems > 1 ? "s" : ""}
                </span>
              </h2>

              {/* Coupon Code Section (PHASE 22 - Verified Offers & Coupons) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-sub)]">
                    <Tag className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span className="font-semibold text-[var(--text-main)]">Have a coupon?</span>
                  </div>
                  <Link
                    href="/offers"
                    className="text-[10px] text-[#d4af37] hover:underline flex items-center gap-0.5"
                  >
                    <span>View all offers</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-mono font-bold text-emerald-400 tracking-wider">
                            {appliedCoupon.code}
                          </p>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                            Applied
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-sub)]">
                          {appliedCoupon.discountType === "percentage"
                            ? `${appliedCoupon.discountValue}% discount applied${appliedCoupon.maxDiscount ? ` (up to ₹${appliedCoupon.maxDiscount})` : ""}`
                            : `₹${appliedCoupon.discountValue} flat savings applied`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold text-[var(--text-sub)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      aria-label="Remove coupon"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Quick Available Coupon Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {(availableOffers.length > 0 ? availableOffers : [
                        { code: "SAVE50", discount_type: "percentage", discount_value: 20, minimum_order: 499 },
                        { code: "WELCOME50", discount_type: "flat", discount_value: 50, minimum_order: 299 },
                        { code: "ROYAL100", discount_type: "flat", discount_value: 100, minimum_order: 599 },
                      ]).slice(0, 3).map((offer: any) => (
                        <button
                          key={offer.code}
                          type="button"
                          onClick={() => {
                            setCouponInput(offer.code);
                            handleApplyCoupon(undefined, offer.code);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37]/20 border border-[#d4af37]/30 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{offer.code}</span>
                          <span className="text-[9px] font-sans font-normal opacity-80">
                            {offer.discount_type === "percentage" ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Coupon Form: [ INPUT ] [ APPLY ] */}
                    <form onSubmit={(e) => handleApplyCoupon(e)} className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                        placeholder="Enter coupon code (e.g. SAVE50)"
                        className="flex-1 text-xs uppercase font-mono tracking-wider px-3.5 py-2.5 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                      />
                      <button
                        type="submit"
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-98 disabled:opacity-40 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer font-mono"
                      >
                        {isApplyingCoupon ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <span>APPLY</span>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* Backend Verification Feedback */}
                {couponError && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-tight">{couponError}</span>
                  </div>
                )}
                {couponSuccess && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 animate-in fade-in">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-tight">{couponSuccess}</span>
                  </div>
                )}
              </div>

              {/* Bill Details Breakdown (Matches user specification) */}
              <div className="space-y-3 pt-3 border-t border-[var(--card-border)] text-xs text-[var(--text-sub)]">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[var(--text-main)]">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Discount ({appliedCoupon?.code})</span>
                    </span>
                    <span className="font-semibold">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Delivery</span>
                  <span className="font-semibold text-[var(--text-main)]">
                    {formatCurrency(deliveryFee)}
                  </span>
                </div>

                {/* Grand Total Divider */}
                <div className="pt-3 border-t border-dashed border-[#d4af37]/40 flex justify-between items-baseline">
                  <span className="text-sm font-semibold uppercase tracking-wider text-[var(--text-main)]">
                    Total
                  </span>
                  <span className="text-2xl font-serif font-bold text-gold-gradient">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={() => {
                  // Navigate to checkout or notify
                  router.push("/checkout");
                }}
                className="w-full py-4 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl"
              >
                <span>Proceed Your Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Trust & Policy Micro-Badges */}
              <div className="pt-2 space-y-2 text-[11px] text-[var(--text-sub-light)] border-t border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                  <span>100% Pure Vegetarian Certified Kitchen</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                  <span>Thermal packaging • 30–35 mins delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
