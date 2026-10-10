"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ChefHat,
  Bike,
  Home,
  ChevronRight,
  ArrowRight,
  UtensilsCrossed,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface TrackedOrder {
  orderNumber: string;
  items?: { name: string; quantity: number; price: number }[];
  total?: number;
  address?: string;
  paymentMethod?: string;
  isPaid?: boolean;
  createdAt?: string;
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const queryOrderId = searchParams.get("orderId");

  const [order, setOrder] = useState<TrackedOrder | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexora_last_order");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (!queryOrderId || parsed.orderNumber === queryOrderId) {
            setOrder(parsed);
            return;
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    // Fallback if accessed directly with an order ID
    setOrder({
      orderNumber: queryOrderId || "ORD-1048",
      address: "Home: Sathigva, Amauli-Fatehpur Road, Near Ankit Internet Cafe And Janseva Kendra",
      items: [
        { name: "Truffle Malai Paneer Tikka", quantity: 1, price: 440 },
        { name: "NEXORA Royal Dal Bukhara", quantity: 1, price: 470 },
      ],
      total: 950,
      isPaid: true,
      paymentMethod: "online",
      createdAt: new Date().toISOString(),
    });
  }, [queryOrderId]);

  // Tracking Steps
  const steps = [
    {
      title: "Order Confirmed",
      description: "Payment verified and order accepted by restaurant.",
      status: "completed",
      icon: CheckCircle2,
      time: "Just now",
    },
    {
      title: "Preparing Food",
      description: "Fresh ingredients being crafted by our chef.",
      status: "current",
      icon: ChefHat,
      time: "In progress",
    },
    {
      title: "Out for Delivery",
      description: "Thermal insulated box with delivery partner.",
      status: "upcoming",
      icon: Bike,
      time: "Next",
    },
    {
      title: "Delivered",
      description: "Enjoy your pure vegetarian meal.",
      status: "upcoming",
      icon: Home,
      time: "35–45 mins",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col selection:bg-[#d4af37]/30 selection:text-white">
      <main className="flex-1 pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 py-4 text-xs text-[var(--text-sub)]">
          <Link href="/" className="hover:text-[#d4af37] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-[var(--text-sub-light)]" />
          <Link href="/checkout" className="hover:text-[#d4af37] transition-colors">
            Checkout
          </Link>
          <ChevronRight className="w-3 h-3 text-[var(--text-sub-light)]" />
          <span className="text-[#d4af37] font-medium">Track Order</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[var(--card-border)]">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
              Live Order Status
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[var(--text-main)] pt-1">
              Order #{order?.orderNumber || "ORD-1048"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Kitchen Preparing
            </span>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
          {/* Left Column: Live Progress Stepper (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-8 gold-glow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)]">
                <div>
                  <h2 className="text-lg font-serif font-bold text-[var(--text-main)]">
                    Estimated Time
                  </h2>
                  <p className="text-xs text-[var(--text-sub)]">
                    Freshly cooked and delivered to your doorstep.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-serif font-bold text-gold-gradient block">
                    35–45
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-sub)]">
                    Minutes
                  </span>
                </div>
              </div>

              {/* Stepper Timeline */}
              <div className="space-y-6 relative pl-4 before:absolute before:left-[27px] before:top-3 before:bottom-3 before:w-0.5 before:bg-[var(--card-border)]">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = step.status === "completed";
                  const isCurrent = step.status === "current";

                  return (
                    <div key={idx} className="relative flex items-start gap-4">
                      {/* Step Circle */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                          isDone
                            ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                            : isCurrent
                            ? "bg-[#d4af37] text-black ring-4 ring-[#d4af37]/20 shadow-lg"
                            : "bg-[var(--section-alt)] text-[var(--text-sub-light)] border border-[var(--card-border)]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3
                            className={`text-sm font-semibold tracking-wide ${
                              isDone || isCurrent
                                ? "text-[var(--text-main)]"
                                : "text-[var(--text-sub-light)]"
                            }`}
                          >
                            {step.title}
                          </h3>
                          <span className="text-[11px] font-mono text-[var(--text-sub-light)]">
                            {step.time}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-sub)] pt-0.5 font-light">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery Address Box */}
              <div className="p-4 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-[var(--text-main)] uppercase tracking-wider">
                    Delivery Address
                  </p>
                  <p className="text-[var(--text-sub)] leading-relaxed">
                    {order?.address ||
                      "Sathigva, Amauli-Fatehpur Road, Near Ankit Internet Cafe And Janseva Kendra"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Help (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-7 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
              <h2 className="text-lg font-serif font-bold text-[var(--text-main)] flex items-center gap-2 pb-3 border-b border-[var(--card-border)]">
                <UtensilsCrossed className="w-4 h-4 text-[#d4af37]" />
                <span>Order Summary</span>
              </h2>

              {order?.items && order.items.length > 0 ? (
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-[var(--text-main)]">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-semibold text-[var(--text-sub)]">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-[var(--card-border)] flex justify-between items-center text-sm font-bold">
                    <span>Total Amount</span>
                    <span className="text-gold-gradient font-serif text-base">
                      {formatCurrency(order.total || 0)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-sub)]">
                  Details confirmed with restaurant kitchen.
                </p>
              )}

              {/* Restaurant Contact Card */}
              <div className="p-4 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] space-y-3">
                <p className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                  Need Help With Your Order?
                </p>
                <p className="text-[11px] text-[var(--text-sub)] leading-relaxed font-light">
                  Our team is available to assist you with live kitchen updates or delivery adjustments.
                </p>
                <a
                  href="tel:+918303890056"
                  className="w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-[var(--card-bg)] border border-[#d4af37]/40 text-[#d4af37] hover:border-[#d4af37] hover:bg-[#d4af37]/10 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call: +91 83038 90056</span>
                </a>
              </div>

              {/* Navigation Back */}
              <Link
                href="/menu"
                className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Browse Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[#d4af37] text-sm">
          Loading order details...
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
