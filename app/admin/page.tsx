"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Clock,
  LogOut,
  UtensilsCrossed,
  ChefHat,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Settings,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  name: string;
  loggedInAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

      // Not authenticated as admin -> redirect to /admin/login
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[#d4af37]">
        Verifying admin authorization...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col selection:bg-[#d4af37]/30 selection:text-white">
      {/* Admin Top Navigation Bar */}
      <header className="border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 border border-[#d4af37] text-[#d4af37] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-bold text-sm tracking-wide text-[var(--text-main)]">
                NEXORA
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#d4af37] block font-semibold">
                Admin Management
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-[var(--text-main)]">
                {adminUser?.name || "Owner"}
              </p>
              <p className="text-[10px] text-[var(--text-sub)] font-mono">
                {adminUser?.email}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAdminLogout}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card-bg)] border border-[#d4af37]/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 gold-glow-sm">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
              Owner Overview
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--text-main)] pt-1">
              Welcome back, {adminUser?.name || "Owner"}!
            </h1>
            <p className="text-xs text-[var(--text-sub)] pt-1 max-w-lg font-light">
              Manage live kitchen orders, menu items, table reservations, and restaurant settings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/track-order"
              className="px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
            >
              <ChefHat className="w-4 h-4" />
              <span>Live Orders</span>
            </Link>
            <Link
              href="/"
              className="px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--section-alt)] text-[var(--text-main)] border border-[var(--card-border)] hover:border-[#d4af37] transition-all"
            >
              View Site
            </Link>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
              <span>Today&apos;s Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-serif font-bold text-gold-gradient">
              {formatCurrency(14820)}
            </p>
            <span className="text-[11px] text-emerald-400 font-medium">
              +18% from yesterday
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
              <span>Active Kitchen Orders</span>
              <ChefHat className="w-4 h-4 text-[#d4af37]" />
            </div>
            <p className="text-2xl font-serif font-bold text-[var(--text-main)]">
              4
            </p>
            <span className="text-[11px] text-[#d4af37] font-medium">
              Steaming & in prep
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
              <span>Total Orders Today</span>
              <ShoppingBag className="w-4 h-4 text-[#d4af37]" />
            </div>
            <p className="text-2xl font-serif font-bold text-[var(--text-main)]">
              28
            </p>
            <span className="text-[11px] text-[var(--text-sub)]">
              Online & COD
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
              <span>Pure Veg Menu</span>
              <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-serif font-bold text-[var(--text-main)]">
              14 Items
            </p>
            <span className="text-[11px] text-emerald-400 font-medium">
              100% Available
            </span>
          </div>
        </div>

        {/* Quick Management Section */}
        <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
            <h2 className="text-base font-serif font-bold text-[var(--text-main)]">
              Quick Restaurant Actions
            </h2>
            <span className="text-xs text-[#d4af37] font-semibold uppercase tracking-wider">
              Phase 16 Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/track-order"
              className="p-4 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] hover:border-[#d4af37] transition-all space-y-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center">
                <ChefHat className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-main)] group-hover:text-[#d4af37] transition-colors">
                Live Kitchen Control
              </h3>
              <p className="text-xs text-[var(--text-sub)] font-light leading-relaxed">
                Accept incoming orders and advance status from preparing to delivered.
              </p>
            </Link>

            <Link
              href="/menu"
              className="p-4 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] hover:border-[#d4af37] transition-all space-y-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-main)] group-hover:text-[#d4af37] transition-colors">
                Menu Management
              </h3>
              <p className="text-xs text-[var(--text-sub)] font-light leading-relaxed">
                View gourmet item listings, prices, ingredients, and categories.
              </p>
            </Link>

            <Link
              href="/account"
              className="p-4 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] hover:border-[#d4af37] transition-all space-y-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-main)] group-hover:text-[#d4af37] transition-colors">
                Customer View
              </h3>
              <p className="text-xs text-[var(--text-sub)] font-light leading-relaxed">
                Inspect customer account views, order histories, and addresses.
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
