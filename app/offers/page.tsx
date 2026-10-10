"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tag,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Clock,
  UtensilsCrossed,
  ShieldCheck,
  Gift,
  ChevronRight,
  Phone,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Offer } from "@/types/database";

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function loadOffers() {
      try {
        // 1. Check local admin offers
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("nexora_admin_offers");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setOffers(parsed.filter((o: Offer) => o.is_active));
            }
          }
        }

        // 2. Fetch from /api/offers
        const res = await fetch("/api/offers");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.offers) && json.offers.length > 0) {
            setOffers(json.offers.filter((o: Offer) => o.is_active));
            setIsLoading(false);
            return;
          }
        }

        // 3. Fallback direct Supabase query
        const { data, error } = await supabase
          .from("offers")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setOffers(data as Offer[]);
        }
      } catch (err) {
        console.warn("Notice loading offers:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadOffers();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col selection:bg-[#d4af37]/30 selection:text-white">
      <main className="flex-1 pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 py-4 text-xs text-[var(--text-sub)]">
          <Link href="/" className="hover:text-[#d4af37] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-[var(--text-sub-light)]" />
          <span className="text-[#d4af37] font-medium">Offers & Discounts</span>
        </div>

        {/* Page Header */}
        <header className="relative text-center py-10 border-b border-[var(--card-border)] overflow-hidden space-y-4">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[280px] bg-gradient-to-b from-[#d4af37]/10 via-[#d4af37]/5 to-transparent blur-3xl pointer-events-none rounded-full" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs text-[#d4af37] font-medium uppercase tracking-[0.25em] relative z-10">
            <Gift className="w-3.5 h-3.5" />
            <span>Royal Dining Privileges</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif text-[var(--text-main)] font-medium tracking-tight relative z-10">
            Exclusive Offers & Vouchers
          </h1>

          <p className="text-xs sm:text-sm text-[var(--text-sub)] max-w-xl mx-auto leading-relaxed relative z-10">
            Discover curated culinary savings, festive coupon codes, and exclusive membership rewards for NEXORA guests.
          </p>
        </header>

        {/* Content Section */}
        <div className="pt-12">
          {isLoading ? (
            <div className="py-24 text-center space-y-4">
              <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs uppercase tracking-widest text-[var(--text-sub)]">
                Checking for active privileges...
              </p>
            </div>
          ) : offers.length === 0 ? (
            /* ==========================================================
               EMPTY STATE: No Active Offers (When Owner hasn't added any)
               ========================================================== */
            <div className="max-w-2xl mx-auto text-center space-y-8 py-10 animate-in fade-in duration-300">
              <div className="relative w-28 h-28 mx-auto rounded-full bg-[var(--card-bg)] border border-[#d4af37]/30 flex items-center justify-center shadow-xl gold-glow-sm">
                <Tag className="w-12 h-12 text-[#d4af37]" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#d4af37] animate-ping opacity-75" />
              </div>

              <div className="space-y-3">
                <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-semibold bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30">
                  Currently Unavailable
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif text-[var(--text-main)] font-semibold">
                  Sorry, Currently No Active Offers
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-sub)] leading-relaxed max-w-lg mx-auto">
                  Our management and master chefs are currently designing new festive promotions and seasonal discount vouchers. Please check back soon or place an order from our signature menu!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link
                  href="/menu"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Explore Gourmet Menu</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="tel:+918303890056"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-[var(--card-bg)] text-[var(--text-main)] border border-[#d4af37]/40 hover:border-[#d4af37] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 text-[#d4af37]" />
                  <span>Contact Concierge</span>
                </a>
              </div>

              {/* Perks Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 text-left">
                <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-2">
                  <div className="w-8 h-8 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]">
                    Surprise Rewards
                  </h3>
                  <p className="text-[11px] text-[var(--text-sub)] leading-relaxed">
                    Exclusive dining discounts are periodically released during festivals and celebrations.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-2">
                  <div className="w-8 h-8 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]">
                    100% Pure Veg
                  </h3>
                  <p className="text-[11px] text-[var(--text-sub)] leading-relaxed">
                    Every dish is crafted with utmost purity, hygiene, and fresh farm ingredients.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-2">
                  <div className="w-8 h-8 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]">
                    Express Delivery
                  </h3>
                  <p className="text-[11px] text-[var(--text-sub)] leading-relaxed">
                    Delivered hot to your door within 30–35 minutes across the Amauli-Fatehpur region.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* ==========================================================
               ACTIVE OFFERS GRID (When Owner adds offers in Supabase)
               ========================================================== */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] p-6 space-y-5 shadow-xl relative overflow-hidden group hover:border-[#d4af37]/60 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40">
                        {offer.discount_percent
                          ? `${offer.discount_percent}% OFF`
                          : offer.discount_amount
                          ? `₹${offer.discount_amount} FLAT OFF`
                          : "SPECIAL DISCOUNT"}
                      </span>
                      <h3 className="text-lg font-serif font-bold text-[var(--text-main)] pt-1">
                        {offer.code}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] shrink-0">
                      <Tag className="w-5 h-5" />
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-sub)] leading-relaxed">
                    {offer.description || "Applicable on your online dining and delivery orders."}
                  </p>

                  {/* Coupon Code Copy Box */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--section-alt)] border border-dashed border-[#d4af37]/40">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-sub-light)]">
                        Coupon Code
                      </p>
                      <p className="text-sm font-mono font-bold tracking-widest text-[#d4af37]">
                        {offer.code}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(offer.code)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--card-bg)] border border-[#d4af37]/40 hover:border-[#d4af37] text-[var(--text-main)] active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      {copiedCode === offer.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Conditions & CTA */}
                  <div className="pt-2 flex items-center justify-between text-xs border-t border-[var(--card-border)] text-[var(--text-sub)]">
                    <span>
                      {offer.minimum_order
                        ? `Min order: ₹${offer.minimum_order}`
                        : "No min order"}
                    </span>
                    <Link
                      href="/menu"
                      className="text-[#d4af37] font-semibold flex items-center gap-1 hover:underline"
                    >
                      <span>Apply in Menu</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
