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
  CheckCircle2,
  Clock,
  ShieldCheck,
  Check,
  Phone,
  Mail,
  AlertCircle,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/utils/formatters";

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
    updateProfileName,
    signOut,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("orders");

  // Profile Edit State
  const [nameInput, setNameInput] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // New Address State
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addrType, setAddrType] = useState<"Home" | "Work" | "Other">("Home");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrLandmark, setAddrLandmark] = useState("");
  const [addrCity, setAddrCity] = useState("Amauli - Fatehpur");
  const [addrPincode, setAddrPincode] = useState("212631");

  // Orders State (Includes #1048 per Phase 15 specification)
  const [orders, setOrders] = useState<AccountOrder[]>([
    {
      orderNumber: "1048",
      items: ["Truffle Malai Paneer Tikka × 1", "NEXORA Royal Dal Bukhara × 1"],
      total: 787,
      status: "Delivered",
      date: "Today, 1:45 PM",
    },
    {
      orderNumber: "1024",
      items: ["Burrata & Truffle Funghi Pizza × 1"],
      total: 610,
      status: "Delivered",
      date: "Yesterday",
    },
  ]);

  // Load last order if available in localStorage
  useEffect(() => {
    if (profile?.full_name) {
      setNameInput(profile.full_name);
    } else {
      setNameInput("Ansh");
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexora_last_order");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const shortNum = parsed.orderNumber?.replace(/^ORD-/, "") || "1049";
          setOrders((prev) => {
            if (prev.some((o) => o.orderNumber === shortNum)) return prev;
            return [
              {
                orderNumber: shortNum,
                items: parsed.items?.map((i: any) => `${i.name} × ${i.quantity}`) || [
                  "Gourmet Selection",
                ],
                total: parsed.total || 787,
                status: "Preparing",
                date: "Just now",
              },
              ...prev,
            ];
          });
        } catch {}
      }
    }
  }, [profile]);

  const customerName = profile?.full_name || (isLoggedIn ? "Ansh" : "Ansh");
  const rawPhone = user?.phone || profile?.phone || "+91 98765 43210";
  // Mask phone as requested: "+91 XXXXX XXXXX" or display formatted
  const displayPhone = isLoggedIn
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

  // Handle Add Address
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrStreet.trim()) return;
    addSavedAddress({
      type: addrType,
      street: addrStreet.trim(),
      landmark: addrLandmark.trim(),
      city: addrCity.trim(),
      pincode: addrPincode.trim(),
    });
    setIsAddingAddress(false);
    setAddrStreet("");
    setAddrLandmark("");
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

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
                  {orders.map((ord) => (
                    <div
                      key={ord.orderNumber}
                      className="p-5 sm:p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-md hover:border-[#d4af37]/50 transition-all space-y-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          {/* #1048 */}
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-lg text-[var(--text-main)]">
                              #{ord.orderNumber}
                            </span>
                            <span className="text-xs text-[var(--text-sub)]">
                              • {ord.date}
                            </span>
                          </div>

                          {/* ₹787 */}
                          <p className="text-xl font-serif font-bold text-gold-gradient">
                            {formatCurrency(ord.total)}
                          </p>
                        </div>

                        {/* Delivered Badge */}
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

                      {/* [View Details] Action Button */}
                      <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between">
                        <Link
                          href={`/track-order?orderId=ORD-${ord.orderNumber}`}
                          className="px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--section-alt)] text-[#d4af37] border border-[#d4af37]/40 hover:bg-gold-gradient hover:text-black hover:border-transparent active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          href="/menu"
                          className="text-xs text-[var(--text-sub)] hover:text-[#d4af37] transition-colors"
                        >
                          Reorder Items
                        </Link>
                      </div>
                    </div>
                  ))}
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
                    onClick={() => setIsAddingAddress(!isAddingAddress)}
                    className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 font-semibold uppercase tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {/* Inline Add Address Form */}
                {isAddingAddress && (
                  <form
                    onSubmit={handleSaveAddress}
                    className="p-5 rounded-2xl bg-[var(--section-alt)] border border-[#d4af37]/40 space-y-4 animate-in fade-in duration-200"
                  >
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-main)]">
                      New Delivery Location
                    </h4>

                    <div className="flex gap-2">
                      {(["Home", "Work", "Other"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setAddrType(type)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                            addrType === type
                              ? "bg-gold-gradient text-black font-bold border-transparent"
                              : "bg-[var(--card-bg)] text-[var(--text-sub)] border-[var(--card-border)]"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        value={addrStreet}
                        onChange={(e) => setAddrStreet(e.target.value)}
                        placeholder="House / Flat / Street *"
                        className="w-full text-xs p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                      />
                      <input
                        type="text"
                        value={addrLandmark}
                        onChange={(e) => setAddrLandmark(e.target.value)}
                        placeholder="Landmark (Near...)"
                        className="w-full text-xs p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={addrCity}
                          onChange={(e) => setAddrCity(e.target.value)}
                          placeholder="City"
                          className="w-full text-xs p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)]"
                        />
                        <input
                          type="text"
                          value={addrPincode}
                          onChange={(e) => setAddrPincode(e.target.value)}
                          placeholder="Pincode"
                          className="w-full text-xs p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)]"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 shadow-md"
                      >
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(false)}
                        className="px-4 py-2 rounded-xl text-xs text-[var(--text-sub)] hover:text-[var(--text-main)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-start gap-3 shadow-sm"
                    >
                      <MapPin className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                          {addr.type}
                        </span>
                        <p className="text-xs text-[var(--text-sub)] leading-relaxed">
                          {addr.street}
                          {addr.landmark ? `, Near ${addr.landmark}` : ""},{" "}
                          {addr.city} {addr.pincode ? `- ${addr.pincode}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
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
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-serif font-bold text-[var(--text-main)]">
                    Your Reviews
                  </h3>
                  <span className="text-xs text-[#d4af37] font-semibold uppercase tracking-wider">
                    2 Rated Dishes
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[var(--text-main)]">
                        Truffle Malai Paneer Tikka
                      </h4>
                      <div className="flex items-center text-[#d4af37]">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-sub)] italic font-light">
                      &ldquo;The clay oven smoked aroma and cashew marinade was absolutely exquisite.&rdquo;
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[var(--text-main)]">
                        NEXORA Royal Dal Bukhara
                      </h4>
                      <div className="flex items-center text-[#d4af37]">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-sub)] italic font-light">
                      &ldquo;Slow cooked overnight perfection. Authentic royal flavors!&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
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
