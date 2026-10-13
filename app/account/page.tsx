"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ShoppingBag,
  MapPin,
  Star,
  LogOut,
  ChevronRight,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Check,
  Phone,
  Mail,
  AlertCircle,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth, SavedAddress } from "@/context/AuthContext";
import { formatCurrency } from "@/utils/formatters";
import { Review } from "@/types/database";
import ReviewModal from "@/components/ReviewModal";
import AddressMapPicker from "@/components/AddressMapPicker";
import { supabase } from "@/lib/supabase/client";

type TabType = "orders" | "addresses" | "profile" | "reviews";

interface AccountOrder {
  orderNumber: string;
  items: string[];
  total: number;
  status: "Delivered" | "Preparing" | "Accepted" | "Out for Delivery";
  date: string;
}

function AccountContent() {
  const router = useRouter();
  const {
    user,
    profile,
    isLoggedIn,
    isLoading,
    savedAddresses,
    addSavedAddress,
    updateSavedAddress,
    deleteSavedAddress,
    updateProfileName,
    signOut,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("orders");

  // Profile Edit State
  const [nameInput, setNameInput] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Map Address Picker State
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // Edit Address State
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [editType, setEditType] = useState<"Home" | "Work" | "Other">("Home");
  const [editStreet, setEditStreet] = useState("");
  const [editLandmark, setEditLandmark] = useState("");
  const [editCity, setEditCity] = useState("Amauli - Fatehpur");
  const [editPincode, setEditPincode] = useState("212631");
  const [editCoords, setEditCoords] = useState<{ lat?: number; lng?: number }>({});
  const [isEditMapPickerOpen, setIsEditMapPickerOpen] = useState(false);

  // Delete Address Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Orders State (Includes #1048 per Phase 15 specification)
  // Orders State (loaded dynamically from database/session)
  const [orders, setOrders] = useState<AccountOrder[]>([]);

  // Customer Reviews State (Phase 25)
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [isAccountReviewModalOpen, setIsAccountReviewModalOpen] = useState(false);
  const [reviewTargetDish, setReviewTargetDish] = useState("");
  const [reviewTargetOrder, setReviewTargetOrder] = useState("");

  // Sync profile, orders, and reviews from database
  useEffect(() => {
    if (profile?.full_name) {
      setNameInput(profile.full_name);
    } else {
      setNameInput("");
    }

    if (!isLoggedIn) {
      setOrders([]);
      setUserReviews([]);
      return;
    }

    if (typeof window !== "undefined") {
      // 1. Fetch user's genuine orders from Supabase database
      async function fetchCustomerOrders() {
        try {
          let query = supabase
            .from("orders")
            .select("*, order_items(*)")
            .order("created_at", { ascending: false });

          if (user?.id && !user.id.startsWith("user_")) {
            query = query.eq("user_id", user.id);
          } else if (user?.phone || profile?.phone) {
            query = query.eq("customer_phone", user?.phone || profile?.phone);
          }
          const { data, error } = await query;
          if (!error && Array.isArray(data) && data.length > 0) {
            const mapped: AccountOrder[] = data.map((o) => ({
              orderNumber: o.order_number?.replace(/^ORD-/, "") || o.id,
              items:
                Array.isArray(o.order_items) && o.order_items.length > 0
                  ? o.order_items.map((it: any) => `${it.name || "Delicacy"} × ${it.quantity || 1}`)
                  : Array.isArray(o.items)
                  ? o.items.map((it: any) => `${it.name || "Delicacy"} × ${it.quantity || 1}`)
                  : ["Gourmet Delicacy × 1"],
              total: o.total_amount || o.total || 0,
              status: (o.status
                ? o.status.charAt(0).toUpperCase() + o.status.slice(1).replace(/_/g, " ")
                : "Pending") as any,
              date: o.created_at
                ? new Date(o.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                : "Recent",
            }));
            setOrders(mapped);
            return;
          }
        } catch {}

        // Fallback to locally stored recent order in this browser session
        const stored = localStorage.getItem("nexora_last_order");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.orderNumber) {
              const shortNum = parsed.orderNumber.replace(/^ORD-/, "");
              setOrders([
                {
                  orderNumber: shortNum,
                  items: parsed.items?.map((i: any) => `${i.name} × ${i.quantity}`) || [
                    "Gourmet Selection",
                  ],
                  total: parsed.total || 0,
                  status: "Preparing",
                  date: "Just now",
                },
              ]);
            }
          } catch {}
        }
      }

      fetchCustomerOrders();

      // 2. Sync genuine user reviews from API
      fetch("/api/reviews?all=true")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.reviews)) {
            const relevant = json.reviews.filter(
              (r: Review) =>
                (user?.id && r.user_id === user.id) ||
                (profile?.full_name && r.customer_name?.toLowerCase() === profile.full_name.toLowerCase())
            );
            setUserReviews(relevant);
          }
        })
        .catch(() => {});
    }
  }, [profile, user, isLoggedIn]);

  const customerName = profile?.full_name || (isLoggedIn ? "Valued Patron" : "Guest");
  const rawPhone = user?.phone || profile?.phone || "";
  // Mask phone as requested: "+91 XXXXX XXXXX" or display formatted
  const displayPhone = isLoggedIn && rawPhone
    ? rawPhone
    : "+91 XXXXX XXXXX";

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    const res = await updateProfileName(nameInput.trim());
    if (res.success) {
      setProfileMessage("Profile updated successfully!");
      setTimeout(() => setProfileMessage(null), 3000);
    }
  };

  // Start editing existing address
  const handleStartEdit = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setEditType(addr.type);
    setEditStreet(addr.street);
    setEditLandmark(addr.landmark || "");
    setEditCity(addr.city);
    setEditPincode(addr.pincode || "");
    setEditCoords({ lat: addr.latitude, lng: addr.longitude });
    setDeletingId(null);
  };

  // Save edited address
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddress || !editStreet.trim()) return;
    updateSavedAddress(editingAddress.id, {
      type: editType,
      street: editStreet.trim(),
      landmark: editLandmark.trim(),
      city: editCity.trim(),
      pincode: editPincode.trim(),
      latitude: editCoords.lat,
      longitude: editCoords.lng,
    });
    setEditingAddress(null);
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // GUEST UNLOGGED VIEW (Secures customer account from unauthenticated access)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col selection:bg-[#d4af37]/30 selection:text-white">
        <main className="flex-1 pt-16 pb-24 px-4 sm:px-6 lg:px-8 max-w-lg mx-auto w-full flex items-center justify-center">
          <div className="p-8 sm:p-10 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl text-center space-y-6 gold-glow w-full">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
                Customer Authentication
              </span>
              <h1 className="text-2xl font-serif font-bold text-[var(--text-main)]">
                Customer Login Required
              </h1>
              <p className="text-xs text-[var(--text-sub)] max-w-sm mx-auto leading-relaxed">
                Please verify your mobile number with OTP to access your previous dining orders, delivery addresses, and personalized banquet settings.
              </p>
            </div>
            <div className="pt-2 space-y-3">
              <Link
                href="/login?redirect=/account"
                className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl font-bold"
              >
                <span>Sign In with OTP</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/menu"
                className="inline-block text-xs text-[var(--text-sub)] hover:text-[#d4af37] transition-colors"
              >
                Browse Royal Menu
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col selection:bg-[#d4af37]/30 selection:text-white">
      <main className="flex-1 pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 py-4 text-xs text-[var(--text-sub)]">
          <Link href="/" className="hover:text-[#d4af37] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-[var(--text-sub-light)]" />
          <span className="text-[#d4af37] font-medium">My Account</span>
        </div>

        {/* ============================================================
            USER HEADER (Matching User Specification)
            My Account
            Ansh
            +91 XXXXX XXXXX
            ============================================================ */}
        <div className="pb-8">
          <span className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-semibold block">
            Customer Profile
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[var(--text-main)] pt-1">
            My Account
          </h1>

          <div className="mt-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#d4af37]/15 border-2 border-[#d4af37] text-[#d4af37] font-serif font-bold text-2xl flex items-center justify-center shadow-lg">
              {customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                {customerName}
              </h2>
              <p className="text-xs text-[var(--text-sub)] font-mono tracking-wider pt-0.5">
                {displayPhone}
              </p>
            </div>
          </div>
        </div>

        {/* Divider ──────────── */}
        <hr className="border-[var(--card-border)] mb-8" />

        {/* 2-Column Grid: Left Menu Tabs, Right Active Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* ==========================================================
              NAVIGATION TABS
              My Orders
              Saved Addresses
              Profile
              Reviews
              Logout
              ========================================================== */}
          <nav className="md:col-span-4 space-y-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`w-full px-4 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider flex items-center justify-between transition-all ${
                activeTab === "orders"
                  ? "bg-gold-gradient text-black font-bold shadow-md"
                  : "bg-[var(--card-bg)] text-[var(--text-sub)] border border-[var(--card-border)] hover:border-[#d4af37]/40 hover:text-[var(--text-main)]"
              }`}
            >
              <span className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>My Orders</span>
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("addresses")}
              className={`w-full px-4 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider flex items-center justify-between transition-all ${
                activeTab === "addresses"
                  ? "bg-gold-gradient text-black font-bold shadow-md"
                  : "bg-[var(--card-bg)] text-[var(--text-sub)] border border-[var(--card-border)] hover:border-[#d4af37]/40 hover:text-[var(--text-main)]"
              }`}
            >
              <span className="flex items-center gap-3">
                <MapPin className="w-4 h-4" />
                <span>Saved Addresses</span>
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`w-full px-4 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider flex items-center justify-between transition-all ${
                activeTab === "profile"
                  ? "bg-gold-gradient text-black font-bold shadow-md"
                  : "bg-[var(--card-bg)] text-[var(--text-sub)] border border-[var(--card-border)] hover:border-[#d4af37]/40 hover:text-[var(--text-main)]"
              }`}
            >
              <span className="flex items-center gap-3">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={`w-full px-4 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider flex items-center justify-between transition-all ${
                activeTab === "reviews"
                  ? "bg-gold-gradient text-black font-bold shadow-md"
                  : "bg-[var(--card-bg)] text-[var(--text-sub)] border border-[var(--card-border)] hover:border-[#d4af37]/40 hover:text-[var(--text-main)]"
              }`}
            >
              <span className="flex items-center gap-3">
                <Star className="w-4 h-4" />
                <span>Reviews</span>
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider flex items-center justify-between text-rose-400 bg-[var(--card-bg)] border border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/10 transition-all pt-3 mt-4"
            >
              <span className="flex items-center gap-3">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </nav>

          {/* ==========================================================
              RIGHT COLUMN: ACTIVE TAB CONTENT
              ========================================================== */}
          <section className="md:col-span-8">
            {/* ========================================================
                TAB 1: MY ORDERS (Matching User Specification)
                Orders:
                #1048
                ₹787
                Delivered
                [View Details]
                ======================================================== */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-serif font-bold text-[var(--text-main)]">
                    Orders
                  </h3>
                  <span className="text-xs text-[var(--text-sub)]">
                    {orders.length} orders placed
                  </span>
                </div>

                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="py-12 px-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] text-center space-y-4">
                      <div className="w-14 h-14 mx-auto rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                        <UtensilsCrossed className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-serif font-bold text-[var(--text-main)]">
                          No Orders Yet
                        </h4>
                        <p className="text-xs text-[var(--text-sub)] max-w-xs mx-auto">
                          You haven&apos;t placed any dining orders yet. Explore our handcrafted royal menu.
                        </p>
                      </div>
                      <Link
                        href="/menu"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-gold-gradient text-black font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
                      >
                        <span>Explore Royal Menu</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    orders.map((ord) => (
                      <div
                        key={ord.orderNumber}
                        className="p-5 sm:p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-md hover:border-[#d4af37]/50 transition-all space-y-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            {/* Order Number */}
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-lg text-[var(--text-main)]">
                                #{ord.orderNumber}
                              </span>
                              <span className="text-xs text-[var(--text-sub)]">
                                • {ord.date}
                              </span>
                            </div>

                            {/* Total Amount */}
                            <p className="text-xl font-serif font-bold text-gold-gradient">
                              {formatCurrency(ord.total)}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                              ord.status === "Delivered"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-[#d4af37]/15 text-[#d4af37] border-[#d4af37]/30"
                            }`}
                          >
                            {ord.status}
                          </span>
                        </div>

                        {/* Items Preview */}
                        <p className="text-xs text-[var(--text-sub)] line-clamp-1">
                          {ord.items.join(", ")}
                        </p>

                        {/* Action Buttons: [View Details], [Rate Order] and Reorder */}
                        <div className="pt-2 border-t border-[var(--card-border)] flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/track-order?orderId=ORD-${ord.orderNumber}`}
                              className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--section-alt)] text-[#d4af37] border border-[#d4af37]/40 hover:bg-gold-gradient hover:text-black hover:border-transparent active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              <span>View Details</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>

                            {ord.status === "Delivered" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewTargetOrder(`ORD-${ord.orderNumber}`);
                                  setReviewTargetDish(ord.items[0]?.split(" ×")[0] || "");
                                  setIsAccountReviewModalOpen(true);
                                }}
                                className="px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37] hover:text-black active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Star className="w-3 h-3 fill-current" />
                                <span>Rate Order</span>
                              </button>
                            )}
                          </div>

                          <Link
                            href="/menu"
                            className="text-xs text-[var(--text-sub)] hover:text-[#d4af37] transition-colors"
                          >
                            Reorder Items
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
                TAB 2: SAVED ADDRESSES
                ======================================================== */}
            {activeTab === "addresses" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-serif font-bold text-[var(--text-main)]">
                    Saved Addresses
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="px-4 py-2 rounded-full bg-gold-gradient text-black text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Address</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {savedAddresses.map((addr) => {
                    const isDeleting = deletingId === addr.id;

                    return (
                      <div
                        key={addr.id}
                        className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[#d4af37]/40 transition-all shadow-sm space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shrink-0 mt-0.5">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                                {addr.type}
                              </span>
                              {addr.latitude && addr.longitude && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded-full border border-[#d4af37]/30">
                                  <MapPin className="w-2.5 h-2.5" />
                                  <span>Pin: {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-sub)] leading-relaxed">
                              {addr.street}
                              {addr.landmark ? `, Near ${addr.landmark}` : ""},{" "}
                              {addr.city} {addr.pincode ? `- ${addr.pincode}` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons directly below address */}
                        {isDeleting ? (
                          <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between gap-3 animate-in fade-in duration-150">
                            <span className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Delete this address?
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteSavedAddress(addr.id);
                                  setDeletingId(null);
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                              >
                                Yes, Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingId(null)}
                                className="px-3 py-1.5 rounded-xl text-xs text-[var(--text-sub)] hover:text-white border border-[var(--card-border)] hover:border-[var(--text-sub)] transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-[var(--card-border)] flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(addr)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-main)] hover:text-[#d4af37] bg-[var(--section-alt)] hover:bg-[#d4af37]/10 border border-[var(--card-border)] hover:border-[#d4af37]/40 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3 text-[#d4af37]" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(addr.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-[var(--section-alt)] hover:bg-rose-500/10 border border-[var(--card-border)] hover:border-rose-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3 text-rose-400" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {savedAddresses.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-[var(--card-border)] rounded-2xl space-y-3">
                      <MapPin className="w-8 h-8 text-[var(--text-sub-light)] mx-auto opacity-40" />
                      <p className="text-xs text-[var(--text-sub)]">No saved delivery addresses found.</p>
                      <button
                        type="button"
                        onClick={() => setIsMapPickerOpen(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Add on Map</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
                TAB 3: PROFILE
                ======================================================== */}
            {activeTab === "profile" && (
              <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[var(--text-main)]">
                    Profile Information
                  </h3>
                  <p className="text-xs text-[var(--text-sub)] pt-0.5">
                    Manage your personal details and contact preferences.
                  </p>
                </div>

                {profileMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{profileMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Ansh Patel"
                      className="w-full text-sm p-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      disabled
                      value={displayPhone}
                      className="w-full text-sm p-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-sub)] opacity-70 cursor-not-allowed font-mono"
                    />
                    <p className="text-[11px] text-[var(--text-sub-light)]">
                      Mobile number is verified via OTP.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all shadow-md"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {/* ========================================================
                TAB 4: REVIEWS
                ======================================================== */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--card-border)]">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-[var(--text-main)]">
                      Your Reviews
                    </h3>
                    <p className="text-xs text-[var(--text-sub)]">
                      Patron reviews submitted from your account.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewTargetDish("");
                      setReviewTargetOrder("");
                      setIsAccountReviewModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Write Review</span>
                  </button>
                </div>

                {/* Interactive Feedback Prompt Card */}
                <div className="p-6 rounded-3xl bg-[var(--section-alt)] border border-[#d4af37]/30 text-center space-y-3 shadow-md">
                  <div className="flex items-center justify-center gap-1.5 text-[#d4af37]">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-base font-serif font-bold text-[var(--text-main)]">
                      How was your order?
                    </h4>
                    <p className="text-xs text-[var(--text-sub)] font-light max-w-sm mx-auto">
                      Rate your dish and tell us how we can serve you better. Public website par sirf approved reviews display honge.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewTargetDish("");
                      setReviewTargetOrder("");
                      setIsAccountReviewModalOpen(true);
                    }}
                    className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>Write Review</span>
                  </button>
                </div>

                {/* User Reviews List */}
                <div className="space-y-4">
                  {userReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-3 shadow-sm hover:border-[#d4af37]/30 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-[var(--text-main)]">
                            {rev.dish_name || "Overall Dining Experience"}
                          </h4>
                          {rev.order_id && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-sub)]">
                              #{rev.order_id}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-0.5 text-[#d4af37]">
                            {[...Array(rev.rating || 5)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>

                          {/* Approval Status */}
                          {rev.is_approved ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Approved &amp; Live</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Under Moderation</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <blockquote className="text-xs text-[var(--text-sub)] italic font-light leading-relaxed p-3 rounded-xl bg-[var(--section-alt)] border-l-2 border-[#d4af37]">
                        &ldquo;{rev.comment}&rdquo;
                      </blockquote>

                      <div className="text-[10px] text-[var(--text-sub-light)] font-mono">
                        {typeof rev.created_at === "string" ? rev.created_at.split("T")[0] : "Recent"}
                      </div>
                    </div>
                  ))}

                  {userReviews.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-[var(--card-border)] rounded-2xl space-y-2">
                      <Star className="w-8 h-8 text-[var(--text-sub-light)] mx-auto opacity-40" />
                      <p className="text-xs text-[var(--text-sub)]">You haven&apos;t written any reviews yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Account Review Modal */}
      <ReviewModal
        isOpen={isAccountReviewModalOpen}
        onClose={() => setIsAccountReviewModalOpen(false)}
        defaultDishName={reviewTargetDish}
        orderId={reviewTargetOrder}
        onSuccess={() => {
          fetch("/api/reviews?all=true")
            .then((res) => res.json())
            .then((json) => {
              if (json.success && Array.isArray(json.reviews)) {
                setUserReviews(json.reviews);
              }
            })
            .catch(() => {});
        }}
      />

      {/* Interactive Swiggy-Style Map Address Picker Modal */}
      <AddressMapPicker
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onSelectAddress={(selected) => {
          addSavedAddress(selected);
          setIsMapPickerOpen(false);
        }}
      />

      {/* Edit Address Modal */}
      {editingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--card-bg)] border border-[#d4af37]/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#d4af37]" />
                <h3 className="text-base font-serif font-bold text-[var(--text-main)]">
                  Edit Delivery Address
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAddress(null)}
                className="w-8 h-8 rounded-full bg-[var(--section-alt)] text-[var(--text-sub)] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Type selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[var(--text-sub)] uppercase tracking-wider">
                  Address Type
                </label>
                <div className="flex gap-2">
                  {(["Home", "Work", "Other"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditType(type)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        editType === type
                          ? "bg-gold-gradient text-black font-bold border-transparent shadow-sm"
                          : "bg-[var(--section-alt)] text-[var(--text-sub)] border-[var(--card-border)] hover:border-[#d4af37]/30"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-sub)] uppercase tracking-wider block mb-1">
                    House / Flat / Street *
                  </label>
                  <input
                    type="text"
                    required
                    value={editStreet}
                    onChange={(e) => setEditStreet(e.target.value)}
                    placeholder="House / Flat / Street"
                    className="w-full text-xs p-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-sub)] uppercase tracking-wider block mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={editLandmark}
                    onChange={(e) => setEditLandmark(e.target.value)}
                    placeholder="Near Temple / Janseva Kendra"
                    className="w-full text-xs p-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--text-sub)] uppercase tracking-wider block mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="City"
                      className="w-full text-xs p-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--text-sub)] uppercase tracking-wider block mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={editPincode}
                      onChange={(e) => setEditPincode(e.target.value)}
                      placeholder="Pincode"
                      className="w-full text-xs p-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              </div>

              {/* Pin Map Action */}
              <div className="p-3 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold text-[var(--text-main)]">Map Pin Location</p>
                  <p className="text-[10px] font-mono text-[var(--text-sub)]">
                    {editCoords.lat && editCoords.lng
                      ? `${editCoords.lat.toFixed(4)}, ${editCoords.lng.toFixed(4)}`
                      : "No coordinates pinned"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditMapPickerOpen(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/40 hover:bg-[#d4af37] hover:text-black transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Adjust on Map</span>
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 shadow-md cursor-pointer transition-all"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAddress(null)}
                  className="px-4 py-3 rounded-xl text-xs text-[var(--text-sub)] hover:text-white border border-[var(--card-border)] cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Address Map Picker */}
      <AddressMapPicker
        isOpen={isEditMapPickerOpen}
        onClose={() => setIsEditMapPickerOpen(false)}
        initialCoords={
          editCoords.lat && editCoords.lng
            ? { lat: editCoords.lat, lng: editCoords.lng }
            : undefined
        }
        onSelectAddress={(data) => {
          setEditStreet(data.street);
          if (data.landmark) setEditLandmark(data.landmark);
          setEditCity(data.city);
          if (data.pincode) setEditPincode(data.pincode);
          setEditType(data.type);
          setEditCoords({ lat: data.latitude, lng: data.longitude });
          setIsEditMapPickerOpen(false);
        }}
      />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[#d4af37] text-sm">
          Loading account details...
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
