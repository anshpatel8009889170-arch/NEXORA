"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  FolderTree,
  Users,
  Tag,
  Armchair,
  Star,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChefHat,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Bike,
  Phone,
  MapPin,
  Flame,
  ArrowRight,
  Check,
  X,
  ArrowDown,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { OrderStatus } from "@/types/database";

type AdminTab =
  | "dashboard"
  | "orders"
  | "menu"
  | "categories"
  | "customers"
  | "offers"
  | "tables"
  | "reviews"
  | "analytics"
  | "settings";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  name: string;
  loggedInAt: string;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  items: string[];
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: "paid" | "pending";
  time: string;
  address: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const [orderFilter, setOrderFilter] = useState<string>("all");

  // Sample Live Orders for Management (Matching Phase 18 specifications)
  const [ordersList, setOrdersList] = useState<AdminOrder[]>([
    {
      id: "ord_1048",
      orderNumber: "ORD-1048",
      customerName: "Ansh Patel",
      phone: "+91 83038 90056",
      items: ["2 × Biryani", "1 × Paneer Tikka"],
      total: 847,
      status: "pending",
      paymentMethod: "Online (Razorpay)",
      paymentStatus: "paid",
      time: "Just now",
      address: "Sathigva, Amauli-Fatehpur Road, Near Ankit Internet Cafe",
    },
    {
      id: "ord_2",
      orderNumber: "ORD-1047",
      customerName: "Vaibhav Patel",
      phone: "+91 91204 89210",
      items: ["Burrata & Truffle Funghi Pizza × 1", "24K Gold Saffron Shahi Tukda × 2"],
      total: 1250,
      status: "preparing",
      paymentMethod: "Cash on Delivery",
      paymentStatus: "pending",
      time: "8 mins ago",
      address: "Main Market Commercial Plaza, Amauli Road",
    },
    {
      id: "ord_3",
      orderNumber: "ORD-1046",
      customerName: "Rohit Verma",
      phone: "+91 98765 43210",
      items: ["NEXORA Royal Dal Bukhara × 2", "Garlic Naan × 4"],
      total: 1140,
      status: "ready",
      paymentMethod: "Online (UPI)",
      paymentStatus: "paid",
      time: "18 mins ago",
      address: "Station Road, Amauli",
    },
    {
      id: "ord_4",
      orderNumber: "ORD-1045",
      customerName: "Aanya Singhania",
      phone: "+91 99182 34567",
      items: ["24K Gold Saffron Shahi Tukda × 1"],
      total: 380,
      status: "delivered",
      paymentMethod: "Online (Card)",
      paymentStatus: "paid",
      time: "42 mins ago",
      address: "Civil Lines, Fatehpur",
    },
  ]);

  // Auth Verification
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexora_admin_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setAdminUser(parsed);
          setIsLoading(false);
          return;
        } catch {}
      }

      // Not authenticated -> redirect to /admin/login
      router.push("/admin/login");
    }
  }, [router]);

  const handleAdminLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nexora_admin_user");
      localStorage.removeItem("nexora_admin_role");
    }
    router.push("/admin/login");
  };

  // Status Change Handler
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setOrdersList((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    const targetOrder = ordersList.find((o) => o.id === orderId);
    if (targetOrder) {
      try {
        await fetch("/api/orders/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: targetOrder.orderNumber,
            status: newStatus,
          }),
        });
      } catch (err) {
        console.warn("Status sync notice:", err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[#d4af37] text-sm">
        Verifying administrator authorization...
      </div>
    );
  }

  // Sidebar Items Matching User Specification Exactly
  const sidebarItems: { id: AdminTab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "menu", label: "Menu", icon: UtensilsCrossed },
    { id: "categories", label: "Categories", icon: FolderTree },
    { id: "customers", label: "Customers", icon: Users },
    { id: "offers", label: "Offers", icon: Tag },
    { id: "tables", label: "Tables", icon: Armchair },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col selection:bg-[#d4af37]/30 selection:text-white">
      {/* ==============================================================
          TOP HEADER: Dashboard Bar
          ============================================================== */}
      <header className="border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 border border-[#d4af37] text-[#d4af37] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-base tracking-wide text-[var(--text-main)]">
                Dashboard
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-[#d4af37] font-semibold">
                NEXORA Restaurant Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-[var(--text-main)]">
                {adminUser?.name || "NEXORA Admin"}
              </p>
              <p className="text-[10px] text-[var(--text-sub)] font-mono">
                {adminUser?.email || "nexora67@gmail.com"}
              </p>
            </div>

            <Link
              href="/"
              target="_blank"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-sub)] hover:text-[#d4af37] hover:bg-white/5 border border-[var(--card-border)] transition-all flex items-center gap-1.5 hidden md:flex"
            >
              <span>Customer View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={handleAdminLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==============================================================
          MAIN CONTAINER: 2-COLUMN LAYOUT (Sidebar + Content)
          ============================================================== */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto flex flex-col md:flex-row">
        {/* ============================================================
            LEFT SIDEBAR
            Orders, Menu, Categories, Customers, Offers, Tables, Reviews, Analytics, Settings
            ============================================================ */}
        <aside className="w-full md:w-64 border-r border-[var(--card-border)] bg-[var(--section-alt)] p-4 flex flex-col justify-between shrink-0">
          <nav className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-sub-light)] px-3 py-2 block font-semibold">
              Management Menu
            </span>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                    isActive
                      ? "bg-gold-gradient text-black font-bold shadow-md"
                      : "text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {item.id === "orders" && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                        isActive
                          ? "bg-black text-[#d4af37]"
                          : "bg-[#d4af37]/20 text-[#d4af37]"
                      }`}
                    >
                      6
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-[var(--card-border)] text-[11px] text-[var(--text-sub)] space-y-1 px-2">
            <p className="font-semibold text-[var(--text-main)]">NEXORA Fine Dining</p>
            <p className="text-[10px]">Sathigva, Amauli-Fatehpur Road</p>
          </div>
        </aside>

        {/* ============================================================
            RIGHT MAIN CONTENT AREA
            ============================================================ */}
        <main className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto">
          {/* ==========================================================
              TAB: DASHBOARD (MAIN SCREEN MATCHING USER SPECIFICATION)
              Today's Revenue: ₹12,450
              Orders: 48
              Pending: 6
              ========================================================== */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* 3 Core Metric Cards Specified by User */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* 1. Today's Revenue: ₹12,450 */}
                <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[#d4af37]/30 shadow-xl space-y-3 gold-glow-sm">
                  <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
                    <span className="uppercase tracking-wider font-semibold">
                      Today&apos;s Revenue
                    </span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-serif font-bold text-gold-gradient">
                    ₹12,450
                  </p>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    +14.2% higher than yesterday
                  </p>
                </div>

                {/* 2. Orders: 48 */}
                <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-3">
                  <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
                    <span className="uppercase tracking-wider font-semibold">
                      Orders
                    </span>
                    <ShoppingBag className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-serif font-bold text-[var(--text-main)]">
                    48
                  </p>
                  <p className="text-[11px] text-[var(--text-sub)]">
                    42 Delivered &bull; 6 In Progress
                  </p>
                </div>

                {/* 3. Pending: 6 */}
                <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-amber-500/30 shadow-xl space-y-3">
                  <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
                    <span className="uppercase tracking-wider font-semibold text-amber-400">
                      Pending
                    </span>
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-serif font-bold text-amber-400">
                    6
                  </p>
                  <p className="text-[11px] text-[var(--text-sub)]">
                    Requires immediate kitchen attention
                  </p>
                </div>
              </div>

              {/* ==============================================================
                  PHASE 18 — DASHBOARD NEW ORDERS SECTION
                  ============================================================== */}
              <div className="space-y-6">
                <div className="p-6 sm:p-7 rounded-3xl bg-[var(--card-bg)] border border-[#d4af37]/40 shadow-xl space-y-6 gold-glow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                        <Flame className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.25em] text-amber-400 font-bold block">
                          Incoming Queue
                        </span>
                        <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                          NEW ORDERS
                        </h2>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("orders")}
                      className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 font-semibold uppercase tracking-wider"
                    >
                      <span>Pipeline Management</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Filter only new/pending orders, or show empty notice */}
                  {ordersList.filter((o) => o.status === "pending").length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ordersList
                        .filter((o) => o.status === "pending")
                        .map((ord) => (
                          <div
                            key={ord.id}
                            className="p-5 rounded-2xl bg-[var(--section-alt)] border-2 border-[#d4af37]/50 shadow-md space-y-4 hover:border-[#d4af37] transition-all"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-mono font-bold text-lg text-[var(--text-main)] block">
                                  #{ord.orderNumber.replace(/^ORD-/, "")}
                                </span>
                                <span className="text-[11px] text-[var(--text-sub)]">
                                  {ord.customerName} &bull; {ord.time}
                                </span>
                              </div>
                              <span className="text-xl font-serif font-bold text-gold-gradient">
                                {formatCurrency(ord.total)}
                              </span>
                            </div>

                            {/* Dishes List (Matches user specification: 2 x Biryani, 1 x Paneer Tikka) */}
                            <div className="py-2.5 px-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-1">
                              {ord.items.map((item, idx) => (
                                <p
                                  key={idx}
                                  className="text-xs font-semibold text-[var(--text-main)]"
                                >
                                  {item}
                                </p>
                              ))}
                            </div>

                            <p className="text-[11px] text-[var(--text-sub-light)] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#d4af37] shrink-0" />
                              <span className="line-clamp-1">{ord.address}</span>
                            </p>

                            {/* Two Primary Action Buttons: [ ACCEPT ] & [ REJECT ] */}
                            <div className="grid grid-cols-2 gap-2.5 pt-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, "accepted")}
                                className="py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>ACCEPT</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, "cancelled")}
                                className="py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-[var(--card-bg)] text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                              >
                                <X className="w-4 h-4" />
                                <span>REJECT</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-2">
                      <p className="text-xs text-[var(--text-sub)]">
                        No pending new orders. All orders have been accepted!
                      </p>
                      <button
                        type="button"
                        onClick={() => handleUpdateOrderStatus("ord_1048", "pending")}
                        className="text-xs text-[#d4af37] hover:underline"
                      >
                        Reset Demo #1048 to New
                      </button>
                    </div>
                  )}
                </div>

                {/* Live In-Progress Orders (Accepted, Preparing, Ready) */}
                <div className="p-6 sm:p-7 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                    <h2 className="text-base font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-[#d4af37]" />
                      <span>In-Progress Kitchen Orders</span>
                    </h2>
                    <span className="text-xs text-[#d4af37] font-semibold uppercase tracking-wider">
                      Live Kitchen
                    </span>
                  </div>

                  <div className="space-y-3">
                    {ordersList
                      .filter((o) => o.status !== "pending" && o.status !== "cancelled")
                      .map((ord) => (
                        <div
                          key={ord.id}
                          className="p-4 sm:p-5 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-bold text-sm text-[var(--text-main)]">
                                #{ord.orderNumber.replace(/^ORD-/, "")}
                              </span>
                              <span className="text-xs text-[var(--text-sub)]">
                                &bull; {ord.time}
                              </span>

                              {/* Current Stage Badge */}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  ord.status === "accepted"
                                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                    : ord.status === "preparing"
                                    ? "bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/40"
                                    : ord.status === "ready"
                                    ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                    : ord.status === "out_for_delivery"
                                    ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                }`}
                              >
                                {ord.status.replace(/_/g, " ")}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-[var(--text-main)]">
                              {ord.items.join(", ")}
                            </p>
                            <p className="text-[11px] text-[var(--text-sub)]">
                              {ord.customerName} ({ord.phone}) &bull;{" "}
                              <span className="text-[#d4af37] font-semibold">
                                {formatCurrency(ord.total)}
                              </span>
                            </p>
                          </div>

                          {/* Next Transition Action Button */}
                          <div className="flex items-center gap-2">
                            {ord.status === "accepted" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, "preparing")}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 shadow-md flex items-center gap-1.5"
                              >
                                <ChefHat className="w-3.5 h-3.5" />
                                <span>PREPARING</span>
                              </button>
                            )}

                            {ord.status === "preparing" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, "ready")}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-500 text-white hover:bg-blue-600 shadow-md flex items-center gap-1.5"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>READY</span>
                              </button>
                            )}

                            {ord.status === "ready" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, "out_for_delivery")}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-purple-500 text-white hover:bg-purple-600 shadow-md flex items-center gap-1.5"
                              >
                                <Bike className="w-3.5 h-3.5" />
                                <span>OUT FOR DELIVERY</span>
                              </button>
                            )}

                            {ord.status === "out_for_delivery" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, "delivered")}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 text-black hover:bg-emerald-400 shadow-md flex items-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>DELIVERED</span>
                              </button>
                            )}

                            {ord.status === "delivered" && (
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Fulfilled
                              </span>
                            )}

                            <Link
                              href={`/track-order?orderId=${ord.orderNumber}`}
                              className="p-2 rounded-xl bg-[var(--card-bg)] text-[var(--text-sub)] hover:text-[#d4af37] border border-[var(--card-border)]"
                              title="Customer live view"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: ORDERS (FULL KITCHEN LIFECYCLE MANAGEMENT)
              ========================================================== */}
          {activeTab === "orders" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Lifecycle Breadcrumb Overview */}
              <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="font-bold text-amber-400">NEW</span>
                <span className="text-[var(--text-sub-light)]">&rarr;</span>
                <span className="font-bold text-amber-300">ACCEPTED</span>
                <span className="text-[var(--text-sub-light)]">&rarr;</span>
                <span className="font-bold text-[#d4af37]">PREPARING</span>
                <span className="text-[var(--text-sub-light)]">&rarr;</span>
                <span className="font-bold text-blue-400">READY</span>
                <span className="text-[var(--text-sub-light)]">&rarr;</span>
                <span className="font-bold text-purple-400">OUT FOR DELIVERY</span>
                <span className="text-[var(--text-sub-light)]">&rarr;</span>
                <span className="font-bold text-emerald-400">DELIVERED</span>
              </div>

              {/* Stage Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: "all", label: "All Orders" },
                  { key: "pending", label: "New Orders" },
                  { key: "accepted", label: "Accepted" },
                  { key: "preparing", label: "Preparing" },
                  { key: "ready", label: "Ready" },
                  { key: "out_for_delivery", label: "Out for Delivery" },
                  { key: "delivered", label: "Delivered" },
                ].map((f) => {
                  const count =
                    f.key === "all"
                      ? ordersList.length
                      : ordersList.filter((o) => o.status === f.key).length;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setOrderFilter(f.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                        orderFilter === f.key
                          ? "bg-gold-gradient text-black font-bold shadow-sm"
                          : "bg-[var(--card-bg)] text-[var(--text-sub)] border border-[var(--card-border)] hover:border-[#d4af37]"
                      }`}
                    >
                      {f.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Filtered Orders List */}
              <div className="space-y-3">
                {ordersList
                  .filter((o) => orderFilter === "all" || o.status === orderFilter)
                  .map((ord) => (
                    <div
                      key={ord.id}
                      className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm hover:border-[#d4af37]/40 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-base text-[var(--text-main)]">
                            #{ord.orderNumber.replace(/^ORD-/, "")}
                          </span>
                          <span className="text-xs text-[var(--text-sub)]">&bull; {ord.time}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              ord.status === "pending"
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                : ord.status === "accepted"
                                ? "bg-amber-400/15 text-amber-300 border-amber-400/30"
                                : ord.status === "preparing"
                                ? "bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/40"
                                : ord.status === "ready"
                                ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                : ord.status === "out_for_delivery"
                                ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {ord.status.replace(/_/g, " ")}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-[var(--text-main)]">
                          {ord.items.join(" &bull; ")}
                        </p>
                        <p className="text-xs text-[var(--text-sub)]">
                          Customer: {ord.customerName} ({ord.phone}) &bull; {ord.paymentMethod}
                        </p>
                        <p className="text-[11px] text-[var(--text-sub-light)] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#d4af37] shrink-0" />
                          <span>{ord.address}</span>
                        </p>
                      </div>

                      {/* Right Lifecycle Advancement Controls */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-serif font-bold text-gold-gradient text-lg block">
                            {formatCurrency(ord.total)}
                          </span>
                          <span className="text-[10px] text-[var(--text-sub)] uppercase">
                            {ord.paymentStatus}
                          </span>
                        </div>

                        {/* Interactive Transition Buttons */}
                        {ord.status === "pending" && (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(ord.id, "accepted")}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 shadow-sm"
                            >
                              ACCEPT
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(ord.id, "cancelled")}
                              className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                            >
                              REJECT
                            </button>
                          </div>
                        )}

                        {ord.status === "accepted" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(ord.id, "preparing")}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 shadow-sm flex items-center gap-1.5"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            <span>PREPARING</span>
                          </button>
                        )}

                        {ord.status === "preparing" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(ord.id, "ready")}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-500 text-white hover:bg-blue-600 shadow-sm flex items-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>READY</span>
                          </button>
                        )}

                        {ord.status === "ready" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(ord.id, "out_for_delivery")}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-purple-500 text-white hover:bg-purple-600 shadow-sm flex items-center gap-1.5"
                          >
                            <Bike className="w-3.5 h-3.5" />
                            <span>OUT FOR DELIVERY</span>
                          </button>
                        )}

                        {ord.status === "out_for_delivery" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(ord.id, "delivered")}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 text-black hover:bg-emerald-400 shadow-sm flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>DELIVERED</span>
                          </button>
                        )}

                        {ord.status === "delivered" && (
                          <span className="text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </span>
                        )}

                        <Link
                          href={`/track-order?orderId=${ord.orderNumber}`}
                          className="px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-sub)] hover:text-[#d4af37] bg-[var(--section-alt)] border border-[var(--card-border)]"
                          title="View customer tracking"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: MENU (100% PURE VEG MANAGEMENT)
              ========================================================== */}
          {activeTab === "menu" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)]">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                    Menu Management
                  </h2>
                  <p className="text-xs text-[var(--text-sub)]">
                    Manage 100% Pure Vegetarian gourmet dishes & pricing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Add Item feature enabled.")}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Dish</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Truffle Malai Paneer Tikka", price: 440, cat: "Starters", stock: true },
                  { name: "NEXORA Royal Dal Bukhara", price: 470, cat: "Main Course", stock: true },
                  { name: "Burrata & Truffle Funghi Pizza", price: 610, cat: "Wood-Fired Pizza", stock: true },
                  { name: "24K Gold Saffron Shahi Tukda", price: 320, cat: "Desserts", stock: true },
                ].map((dish, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text-main)]">
                        {dish.name}
                      </h4>
                      <p className="text-xs text-[var(--text-sub)]">
                        {dish.cat} &bull;{" "}
                        <span className="text-[#d4af37] font-semibold">₹{dish.price}</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      In Stock
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: CATEGORIES
              ========================================================== */}
          {activeTab === "categories" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[var(--card-border)]">
                <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                  Categories
                </h2>
                <p className="text-xs text-[var(--text-sub)]">
                  Organize culinary courses and menu groups.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  "Royal Starters & Tandoor",
                  "Chef's Signature Mains",
                  "Wood-Fired Artisan Pizza",
                  "Heritage Breads & Rice",
                  "Royal Desserts & Mithai",
                  "Artisan Beverages & Mocktails",
                ].map((cat, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-1"
                  >
                    <FolderTree className="w-5 h-5 text-[#d4af37]" />
                    <h4 className="text-sm font-semibold text-[var(--text-main)] pt-2">
                      {cat}
                    </h4>
                    <span className="text-[11px] text-[var(--text-sub)]">
                      Active category &bull; 100% Pure Veg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: CUSTOMERS
              ========================================================== */}
          {activeTab === "customers" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[var(--card-border)]">
                <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                  Registered Customers
                </h2>
                <p className="text-xs text-[var(--text-sub)]">
                  Verified customer directory and dining profiles.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { name: "Ansh Patel", phone: "+91 83038 90056", orders: 12, tier: "Gold Guest" },
                  { name: "Vaibhav Patel", phone: "+91 91204 89210", orders: 8, tier: "Gold Guest" },
                  { name: "Aanya Singhania", phone: "+91 99182 34567", orders: 4, tier: "Regular" },
                ].map((cust, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text-main)]">
                        {cust.name}
                      </h4>
                      <p className="text-xs text-[var(--text-sub)] font-mono">
                        {cust.phone} &bull; {cust.orders} Orders placed
                      </p>
                    </div>
                    <span className="text-xs text-[#d4af37] font-semibold">
                      {cust.tier}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: OFFERS
              ========================================================== */}
          {activeTab === "offers" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[var(--card-border)]">
                <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                  Promotions & Coupon Offers
                </h2>
                <p className="text-xs text-[var(--text-sub)]">
                  Active discounts applicable on checkout and cart.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[#d4af37]/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-base text-[#d4af37]">
                      WELCOME50
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-sub)]">
                    Flat ₹50 OFF on first order above ₹300.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-base text-[var(--text-main)]">
                      ROYAL100
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-sub)]">
                    Flat ₹100 OFF on banquet and luxury party orders above ₹999.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: TABLES
              ========================================================== */}
          {activeTab === "tables" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[var(--card-border)]">
                <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                  Dine-In Table Status
                </h2>
                <p className="text-xs text-[var(--text-sub)]">
                  12 Restaurant tables reservation and seating map.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
                  const isOccupied = num === 3 || num === 7;
                  const isReserved = num === 5;
                  return (
                    <div
                      key={num}
                      className={`p-4 rounded-2xl border text-center space-y-1.5 ${
                        isOccupied
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          : isReserved
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          : "bg-[var(--card-bg)] border-[var(--card-border)] text-emerald-400"
                      }`}
                    >
                      <Armchair className="w-5 h-5 mx-auto" />
                      <p className="text-xs font-bold text-[var(--text-main)]">
                        Table {num}
                      </p>
                      <span className="text-[10px] font-semibold uppercase tracking-wider block">
                        {isOccupied ? "Occupied" : isReserved ? "Reserved" : "Available"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: REVIEWS
              ========================================================== */}
          {activeTab === "reviews" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[var(--card-border)]">
                <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                  Guest Reviews & Ratings
                </h2>
                <p className="text-xs text-[var(--text-sub)]">
                  Verified patron feedback across all dishes.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    name: "Aanya Singhania",
                    dish: "24K Gold Saffron Shahi Tukda",
                    comment: "Finest dessert in North India. Truly authentic royal gastronomy.",
                    rating: 5,
                  },
                  {
                    name: "Rohit Verma",
                    dish: "Burrata & Truffle Funghi Pizza",
                    comment: "Thermal express delivery arrived steaming hot. Sourdough crust is world-class.",
                    rating: 5,
                  },
                ].map((rev, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-main)]">
                        {rev.name} &bull; <span className="text-[#d4af37]">{rev.dish}</span>
                      </span>
                      <div className="flex items-center text-[#d4af37]">
                        {[...Array(rev.rating)].map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-sub)] italic font-light">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: ANALYTICS
              ========================================================== */}
          {activeTab === "analytics" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[var(--card-border)]">
                <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                  Restaurant Analytics & Insights
                </h2>
                <p className="text-xs text-[var(--text-sub)]">
                  Daily revenue, orders volume, and popular dish metrics.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4">
                <h3 className="text-sm font-semibold text-[var(--text-main)]">
                  Top Selling Dishes
                </h3>
                <div className="space-y-3">
                  {[
                    { name: "Truffle Malai Paneer Tikka", count: "142 orders", revenue: "₹62,480" },
                    { name: "NEXORA Royal Dal Bukhara", count: "128 orders", revenue: "₹60,160" },
                    { name: "Burrata & Truffle Funghi Pizza", count: "89 orders", revenue: "₹54,290" },
                    { name: "24K Gold Saffron Shahi Tukda", count: "76 orders", revenue: "₹24,320" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--section-alt)] text-xs"
                    >
                      <span className="font-medium text-[var(--text-main)]">{item.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-[var(--text-sub)]">{item.count}</span>
                        <span className="font-serif font-bold text-gold-gradient">
                          {item.revenue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: SETTINGS
              ========================================================== */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[var(--card-border)]">
                <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                  Restaurant Settings
                </h2>
                <p className="text-xs text-[var(--text-sub)]">
                  Official contact, landmark address, and business hours.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4 text-xs">
                <div>
                  <span className="text-[var(--text-sub)] block">Official Address:</span>
                  <p className="font-semibold text-[var(--text-main)] pt-0.5">
                    Sathigva, Amauli-Fatehpur Road, Near Ankit Internet Cafe And Janseva Kendra
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-sub)] block">Support Phone Numbers:</span>
                  <p className="font-mono text-[var(--text-main)] pt-0.5">
                    Restaurant Staff: +91 83038 90056 &bull; Delivery Boy: +91 91204 89210
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-sub)] block">Official Email:</span>
                  <p className="font-mono text-[var(--text-main)] pt-0.5">
                    vaibhavpatel8543@gmail.com
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
