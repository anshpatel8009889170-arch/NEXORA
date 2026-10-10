"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check,
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
  RefreshCw,
  Radio,
  Sliders,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/lib/supabase/client";
import { OrderStatus } from "@/types/database";

interface TrackedOrder {
  orderNumber: string;
  status: OrderStatus;
  items?: { name: string; quantity: number; price: number }[];
  total?: number;
  address?: string;
  paymentMethod?: string;
  isPaid?: boolean;
  createdAt?: string;
}

// 5 Canonical Tracking Stages for Phase 14
const TRACKING_STAGES: {
  key: OrderStatus;
  label: string;
  subtext: string;
  timeEstimate: string;
}[] = [
  {
    key: "pending",
    label: "Order placed",
    subtext: "Order received and queued for confirmation",
    timeEstimate: "Completed",
  },
  {
    key: "accepted",
    label: "Restaurant accepted",
    subtext: "NEXORA kitchen received and acknowledged order",
    timeEstimate: "+2 mins",
  },
  {
    key: "preparing",
    label: "Preparing",
    subtext: "Fresh organic ingredients being crafted by our chef",
    timeEstimate: "+15 mins",
  },
  {
    key: "ready",
    label: "Ready",
    subtext: "Packed in thermal heat-insulated luxury casing",
    timeEstimate: "+25 mins",
  },
  {
    key: "delivered",
    label: "Delivered",
    subtext: "Handed over to customer with golden hospitality",
    timeEstimate: "35–45 mins",
  },
];

// Helper to calculate stage index
function getStageIndex(status: OrderStatus): number {
  switch (status) {
    case "pending":
      return 0;
    case "accepted":
      return 1;
    case "preparing":
      return 2;
    case "ready":
    case "out_for_delivery":
      return 3;
    case "delivered":
      return 4;
    default:
      return 0;
  }
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const queryOrderId = searchParams.get("orderId");

  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>("preparing");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(true);

  // Load Order Initial State
  useEffect(() => {
    let orderNum = queryOrderId || "ORD-1048";

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexora_last_order");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (!queryOrderId || parsed.orderNumber === queryOrderId) {
            orderNum = parsed.orderNumber;
            setOrder(parsed);
            if (parsed.status) {
              setCurrentStatus(parsed.status);
            }
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    if (!order) {
      setOrder({
        orderNumber: orderNum,
        status: "preparing",
        address: "Home: Sathigva, Amauli-Fatehpur Road, Near Ankit Internet Cafe And Janseva Kendra",
        items: [
          { name: "Truffle Malai Paneer Tikka", quantity: 2, price: 440 },
          { name: "NEXORA Royal Dal Bukhara", quantity: 1, price: 470 },
        ],
        total: 1350,
        isPaid: true,
        paymentMethod: "online",
        createdAt: new Date().toISOString(),
      });
    }
  }, [queryOrderId]);

  // Supabase Realtime Subscription + Auto Polling
  useEffect(() => {
    const orderNumber = order?.orderNumber || queryOrderId || "ORD-1048";

    // 1. Initial fetch from Supabase if recorded
    const fetchRemoteStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("status")
          .eq("order_number", orderNumber)
          .single();

        if (data?.status) {
          setCurrentStatus(data.status as OrderStatus);
        }
      } catch {
        // quiet fallback
      }
    };

    fetchRemoteStatus();

    // 2. Realtime listener on Supabase
    const channel = supabase
      .channel(`live-tracking-${orderNumber}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `order_number=eq.${orderNumber}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.status) {
            setCurrentStatus(payload.new.status as OrderStatus);
          }
        }
      )
      .subscribe();

    // 3. Fallback Interval Polling every 5 seconds (ensures instant sync even without cloud websocket)
    const interval = setInterval(fetchRemoteStatus, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [order?.orderNumber, queryOrderId]);

  // Admin Status Update Trigger
  const handleAdminUpdateStatus = async (newStatus: OrderStatus) => {
    setIsUpdatingStatus(true);
    setCurrentStatus(newStatus);

    const orderNumber = order?.orderNumber || "ORD-1048";

    // Update local storage so refreshes keep it
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexora_last_order");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.status = newStatus;
          localStorage.setItem("nexora_last_order", JSON.stringify(parsed));
        } catch {}
      }
    }

    try {
      await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          status: newStatus,
        }),
      });
    } catch (err) {
      console.warn("Status broadcast error:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const currentStageIndex = getStageIndex(currentStatus);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col selection:bg-[#d4af37]/30 selection:text-white pb-32">
      <main className="flex-1 pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
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

        {/* Page Header matching user: Order #1048 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[var(--card-border)]">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
              Customer Live Tracker
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[var(--text-main)] pt-1">
              Order #{order?.orderNumber?.replace(/^ORD-/, "") || "1048"}
            </h1>
            <p className="text-xs text-[var(--text-sub)] pt-1 font-mono">
              Full ID: {order?.orderNumber || "ORD-1048"}
            </p>
          </div>

          {/* Live Status Indicator */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Live Updates Active
            </span>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
          {/* ==========================================================
              LEFT COLUMN: PHASE 14 TIMELINE TRACKER (lg:col-span-7)
              ========================================================== */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-8 gold-glow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)]">
                <div>
                  <h2 className="text-lg font-serif font-bold text-[var(--text-main)]">
                    Live Progress
                  </h2>
                  <p className="text-xs text-[var(--text-sub)]">
                    Status automatically synchronizes with restaurant kitchen.
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

              {/* ========================================================
                  PHASE 14 SPECIFICATION TIMELINE
                  ✓ Order placed
                  │
                  ✓ Restaurant accepted
                  │
                  ● Preparing
                  │
                  ○ Ready
                  │
                  ○ Delivered
                  ======================================================== */}
              <div className="space-y-0 py-2">
                {TRACKING_STAGES.map((stage, idx) => {
                  const isCompleted = idx < currentStageIndex;
                  const isCurrent = idx === currentStageIndex;
                  const isUpcoming = idx > currentStageIndex;
                  const isLast = idx === TRACKING_STAGES.length - 1;

                  return (
                    <div key={stage.key} className="relative flex items-start gap-4">
                      {/* Left Symbol Column + Connecting Vertical Line │ */}
                      <div className="flex flex-col items-center">
                        {/* Node Symbol */}
                        {isCompleted && (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/15 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center font-bold text-sm shadow-md transition-all duration-300">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        )}

                        {isCurrent && (
                          <div className="relative w-8 h-8 rounded-full bg-[#d4af37]/20 border-2 border-[#d4af37] text-[#d4af37] flex items-center justify-center shadow-lg transition-all duration-300">
                            {/* Glowing Active Dot ● */}
                            <span className="w-3.5 h-3.5 rounded-full bg-[#d4af37] shadow-[0_0_12px_#d4af37] animate-pulse" />
                          </div>
                        )}

                        {isUpcoming && (
                          <div className="w-8 h-8 rounded-full bg-[var(--section-alt)] border-2 border-[var(--card-border)] text-[var(--text-sub-light)] flex items-center justify-center font-bold text-sm transition-all duration-300">
                            {/* Empty Circle ○ */}
                            <span className="w-2.5 h-2.5 rounded-full border border-[var(--text-sub-light)]" />
                          </div>
                        )}

                        {/* Vertical Connecting Line │ */}
                        {!isLast && (
                          <div
                            className={`w-0.5 h-12 my-1 transition-colors duration-300 ${
                              idx < currentStageIndex
                                ? "bg-emerald-500/70"
                                : "bg-[var(--card-border)]"
                            }`}
                          />
                        )}
                      </div>

                      {/* Right Stage Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3
                            className={`text-base font-serif font-bold tracking-tight transition-colors ${
                              isCurrent
                                ? "text-[#d4af37] text-lg font-bold"
                                : isCompleted
                                ? "text-[var(--text-main)]"
                                : "text-[var(--text-sub-light)]"
                            }`}
                          >
                            {stage.label}
                          </h3>

                          {isCurrent && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40">
                              Active
                            </span>
                          )}

                          {isCompleted && (
                            <span className="text-[11px] text-emerald-400 font-medium">
                              Done
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-xs pt-0.5 leading-relaxed font-light ${
                            isCurrent
                              ? "text-[var(--text-main)]"
                              : isCompleted
                              ? "text-[var(--text-sub)]"
                              : "text-[var(--text-sub-light)]"
                          }`}
                        >
                          {stage.subtext}
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

          {/* ==========================================================
              RIGHT COLUMN: ORDER SUMMARY & TWO INSTANT SUPPORT CONTACTS
              ========================================================== */}
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

              {/* Instant Support (Two Direct Numbers: Restaurant Staff & Delivery Boy) */}
              <div className="p-5 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] space-y-4">
                <div>
                  <p className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                    Instant Support
                  </p>
                  <p className="text-[11px] text-[var(--text-sub)] pt-0.5 font-light">
                    Directly contact our restaurant kitchen or your assigned delivery partner:
                  </p>
                </div>

                <div className="space-y-2.5">
                  {/* 1. Restaurant Staff / Kitchen Worker */}
                  <div className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                        <ChefHat className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-main)]">
                          Restaurant Staff
                        </p>
                        <p className="text-[10px] text-[var(--text-sub)] font-mono">
                          +91 83038 90056
                        </p>
                      </div>
                    </div>
                    <a
                      href="tel:+918303890056"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37] hover:text-black transition-all flex items-center gap-1.5"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </a>
                  </div>

                  {/* 2. Delivery Boy / Partner */}
                  <div className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Bike className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-main)]">
                          Delivery Boy
                        </p>
                        <p className="text-[10px] text-[var(--text-sub)] font-mono">
                          +91 91204 89210
                        </p>
                      </div>
                    </div>
                    <a
                      href="tel:+919120489210"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-1.5"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
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

      {/* ==============================================================
          ADMIN STATUS CONTROLLER (SIMULATOR & REAL-TIME CONTROLLER)
          "Admin status change karega. Customer automatically updated status dekhega."
          ============================================================== */}
      <aside className="fixed bottom-0 inset-x-0 bg-[var(--card-bg)]/95 backdrop-blur-md border-t border-[#d4af37]/40 shadow-2xl p-3 z-40">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-lg bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37]">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-[var(--text-main)] uppercase tracking-wider">
                Admin Status Controller
              </span>
              <p className="text-[10px] text-[var(--text-sub)]">
                Click any step to test live real-time customer timeline sync
              </p>
            </div>
          </div>

          {/* Quick Status Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {TRACKING_STAGES.map((s) => {
              const isActive = currentStatus === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleAdminUpdateStatus(s.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-gold-gradient text-black shadow-md font-bold scale-105"
                      : "bg-[var(--section-alt)] text-[var(--text-sub)] border border-[var(--card-border)] hover:border-[#d4af37] hover:text-[var(--text-main)]"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
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
