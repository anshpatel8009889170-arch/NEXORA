"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Lock,
  User,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  Clock,
  Sparkles,
  CreditCard,
  Banknote,
  Smartphone,
  UtensilsCrossed,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/lib/supabase/client";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    user,
    profile,
    isLoggedIn,
    isLoading: authLoading,
    sendOtp,
    verifyOtp,
    updateProfileName,
    deliveryAddress,
    saveDeliveryAddress,
  } = useAuth();

  const {
    items,
    totalItems,
    subtotal,
    deliveryFee,
    discountAmount,
    grandTotal,
    appliedCoupon,
    clearCart,
    isLoaded: cartLoaded,
  } = useCart();

  // Authentication Step State (When Not Logged In)
  const [authStep, setAuthStep] = useState<"phone" | "otp" | "name">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [timer, setTimer] = useState(0);

  // Delivery & Order Form State
  const [deliveryType, setDeliveryType] = useState<"delivery" | "dine_in">("delivery");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Amauli - Fatehpur");
  const [pincode, setPincode] = useState("212631");
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi" | "online">("cod");

  // Order Placement State
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);

  // Sync saved address if available
  useEffect(() => {
    if (deliveryAddress) {
      if (deliveryAddress.street) setStreet(deliveryAddress.street);
      if (deliveryAddress.landmark) setLandmark(deliveryAddress.landmark);
      if (deliveryAddress.city) setCity(deliveryAddress.city);
      if (deliveryAddress.pincode) setPincode(deliveryAddress.pincode);
    }
  }, [deliveryAddress]);

  // Timer countdown for Resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Auth Handler: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const cleaned = phoneInput.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      setAuthError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setAuthSubmitting(true);
    const res = await sendOtp(cleaned);
    setAuthSubmitting(false);

    if (res.success) {
      setAuthSuccess(res.message || "OTP code sent!");
      setAuthStep("otp");
      setTimer(30);
    } else {
      setAuthError(res.message || "Failed to send OTP.");
    }
  };

  // Auth Handler: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (otpInput.trim().length < 6) {
      setAuthError("Please enter the 6-digit verification code.");
      return;
    }

    setAuthSubmitting(true);
    const res = await verifyOtp(phoneInput, otpInput);
    setAuthSubmitting(false);

    if (res.success) {
      if (res.isNewUser) {
        setAuthStep("name");
        setAuthSuccess("Verified! Please enter your name.");
      } else {
        setAuthSuccess("Authenticated successfully!");
      }
    } else {
      setAuthError(res.message || "Invalid OTP code.");
    }
  };

  // Auth Handler: Save Name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!nameInput.trim()) {
      setAuthError("Please enter your full name.");
      return;
    }

    setAuthSubmitting(true);
    const res = await updateProfileName(nameInput.trim());
    setAuthSubmitting(false);

    if (res.success) {
      setAuthSuccess("Welcome to NEXORA!");
    } else {
      setAuthError(res.message || "Failed to save name.");
    }
  };

  // Final Order Placement Handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (deliveryType === "delivery" && !street.trim()) {
      alert("Please provide your delivery address.");
      return;
    }

    if (deliveryType === "dine_in" && !tableNumber.trim()) {
      alert("Please enter your table number.");
      return;
    }

    setIsPlacingOrder(true);

    const orderNum = `NX-${Math.floor(100000 + Math.random() * 900000)}`;
    const fullAddress =
      deliveryType === "delivery"
        ? `${street.trim()}, Landmark: ${landmark.trim() || "Near Ankit Internet Cafe"}, ${city} - ${pincode}`
        : `Dine-in at Table ${tableNumber.trim()}`;

    // Save address for future orders
    if (deliveryType === "delivery") {
      saveDeliveryAddress({
        street: street.trim(),
        landmark: landmark.trim(),
        city,
        pincode,
      });
    }

    try {
      // 1. Insert into Supabase Orders table
      await supabase.from("orders").insert({
        order_number: orderNum,
        user_id: user?.id && !user.id.startsWith("user_") ? user.id : null,
        customer_name: profile?.full_name || "Guest Patron",
        customer_phone: user?.phone || profile?.phone || phoneInput,
        delivery_type: deliveryType,
        delivery_address: fullAddress,
        status: "pending",
        payment_method: paymentMethod,
        payment_status: "pending",
        subtotal: subtotal,
        discount: discountAmount,
        delivery_fee: deliveryFee,
        tax: 0,
        total: grandTotal,
      });
    } catch (err) {
      console.warn("Supabase order recording notice:", err);
    } finally {
      setIsPlacingOrder(false);
      setPlacedOrderNumber(orderNum);
      clearCart();
    }
  };

  // Wait for initial hydration
  if (authLoading || !cartLoaded) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest text-[var(--text-sub)]">
            Preparing your royal checkout...
          </p>
        </div>
      </div>
    );
  }

  // ORDER SUCCESS CELEBRATION VIEW
  if (placedOrderNumber) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col selection:bg-[#d4af37]/30 selection:text-white">
        <main className="flex-1 pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full flex items-center justify-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-[var(--card-bg)] border border-[#d4af37]/40 shadow-2xl text-center space-y-6 gold-glow animate-in zoom-in-95 duration-300 w-full">
            <div className="relative w-24 h-24 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center shadow-2xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                Order Confirmed
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[var(--text-main)] pt-2">
                Thank You, {profile?.full_name || "Guest"}!
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-sub)] max-w-md mx-auto leading-relaxed">
                Your royal order <span className="font-mono font-bold text-[#d4af37]">#{placedOrderNumber}</span> has been received by our kitchen. Our master chefs are preparing your pure vegetarian feast.
              </p>
            </div>

            {/* Order Highlight Box */}
            <div className="p-5 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] space-y-3 text-xs text-left max-w-md mx-auto">
              <div className="flex justify-between items-center text-[var(--text-sub)]">
                <span>Order Reference</span>
                <span className="font-mono font-bold text-[#d4af37]">#{placedOrderNumber}</span>
              </div>
              <div className="flex justify-between items-center text-[var(--text-sub)]">
                <span>Status</span>
                <span className="text-emerald-400 font-semibold">Kitchen Preparing (30–35 mins)</span>
              </div>
              <div className="flex justify-between items-center text-[var(--text-sub)]">
                <span>Payment Mode</span>
                <span className="uppercase font-semibold text-[var(--text-main)]">
                  {paymentMethod === "cod" ? "Pay on Delivery" : paymentMethod.toUpperCase()}
                </span>
              </div>
              <div className="pt-2 border-t border-[var(--card-border)] flex justify-between items-center font-serif text-sm font-bold text-[var(--text-main)]">
                <span>Amount Payable</span>
                <span className="text-gold-gradient text-base">{formatCurrency(grandTotal || 0)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/menu"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all shadow-lg"
              >
                <span>Back to Menu</span>
              </Link>

              <a
                href="https://wa.me/918303890056"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-[var(--card-bg)] text-[var(--text-main)] border border-[#d4af37]/40 hover:border-[#d4af37] active:scale-95 transition-all"
              >
                <span>Track on WhatsApp</span>
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // EMPTY CART CHECK
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col">
        <main className="flex-1 pt-24 pb-24 px-4 text-center max-w-md mx-auto w-full space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-[var(--card-bg)] border border-[#d4af37]/30 flex items-center justify-center shadow-lg">
            <ShoppingBag className="w-8 h-8 text-[#d4af37]" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[var(--text-main)]">
            Your Cart is Empty
          </h1>
          <p className="text-xs text-[var(--text-sub)]">
            Please add gourmet dishes to your cart before proceeding to checkout.
          </p>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90"
          >
            <span>Browse Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col selection:bg-[#d4af37]/30 selection:text-white">
      <main className="flex-1 pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 py-4 text-xs text-[var(--text-sub)]">
          <Link href="/" className="hover:text-[#d4af37] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-[var(--text-sub-light)]" />
          <Link href="/cart" className="hover:text-[#d4af37] transition-colors">
            Cart
          </Link>
          <ChevronRight className="w-3 h-3 text-[var(--text-sub-light)]" />
          <span className="text-[#d4af37] font-medium">Checkout</span>
        </div>

        {/* Page Header */}
        <div className="pb-8 border-b border-[var(--card-border)]">
          <span className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
            Final Royal Step
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[var(--text-main)] pt-1">
            Checkout & Delivery
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
          {/* ==========================================================
              LEFT COLUMN: AUTHENTICATION (IF NOT LOGGED IN) OR ADDRESS
              ========================================================== */}
          <div className="lg:col-span-7 space-y-6">
            {!isLoggedIn ? (
              /* ========================================================
                 FLOW BRANCH: NOT LOGGED IN -> PHONE -> OTP -> NAME
                 ======================================================== */
              <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-6 gold-glow-sm animate-in fade-in duration-200">
                <div className="flex items-center gap-3 pb-4 border-b border-[var(--card-border)]">
                  <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[var(--text-main)]">
                      Step 1: Customer Verification
                    </h2>
                    <p className="text-xs text-[var(--text-sub)]">
                      Quick OTP verification to confirm your phone number and order status.
                    </p>
                  </div>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                {/* Sub-step 1: Phone */}
                {authStep === "phone" && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                        Enter Mobile Number
                      </label>
                      <div className="flex rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] overflow-hidden focus-within:border-[#d4af37]">
                        <span className="px-3.5 py-3 text-xs font-medium text-[var(--text-sub)] border-r border-[var(--card-border)] flex items-center gap-1.5">
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
                          placeholder="9876543210"
                          className="w-full text-sm font-mono tracking-wider px-3.5 py-3 bg-transparent text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none"
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authSubmitting || phoneInput.length < 10}
                      className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      {authSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Verification OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Sub-step 2: OTP */}
                {authStep === "otp" && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                          Enter 6-Digit OTP Code
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthStep("phone");
                            setOtpInput("");
                            setAuthError(null);
                          }}
                          className="text-[11px] text-[#d4af37] hover:underline"
                        >
                          Change Number
                        </button>
                      </div>

                      <input
                        type="text"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="w-full text-center text-2xl font-mono tracking-[0.5em] py-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authSubmitting || otpInput.length < 6}
                      className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      {authSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Continue</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="text-center pt-2">
                      {timer > 0 ? (
                        <p className="text-xs text-[var(--text-sub)]">
                          Resend code in <span className="text-[#d4af37] font-semibold">{timer}s</span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={authSubmitting}
                          className="text-xs text-[#d4af37] font-medium hover:underline"
                        >
                          Resend OTP Code
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {/* Sub-step 3: Profile Name */}
                {authStep === "name" && (
                  <form onSubmit={handleSaveName} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="e.g. Ansh Patel"
                        className="w-full text-sm px-4 py-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authSubmitting || !nameInput.trim()}
                      className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      {authSubmitting ? (
                        <span>Saving...</span>
                      ) : (
                        <>
                          <span>Proceed to Address</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* ========================================================
                 FLOW BRANCH: LOGGED IN -> ADDRESS & PAYMENT DETAILS
                 ======================================================== */
              <form onSubmit={handlePlaceOrder} className="space-y-6">
                {/* User Identity Banner */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-sub)]">Ordering as:</p>
                      <p className="text-sm font-serif font-bold text-[var(--text-main)]">
                        {profile?.full_name} <span className="font-mono text-xs font-normal text-[var(--text-sub)]">({user?.phone || profile?.phone})</span>
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                </div>

                {/* Delivery vs Dine-in Toggle */}
                <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-5">
                  <h2 className="text-base font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#d4af37]" />
                    <span>Order Type & Location</span>
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("delivery")}
                      className={`p-3.5 rounded-2xl border text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        deliveryType === "delivery"
                          ? "bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37] shadow-sm"
                          : "bg-[var(--section-alt)] border-[var(--card-border)] text-[var(--text-sub)] hover:border-[#d4af37]/30"
                      }`}
                    >
                      <span>🛵 Doorstep Delivery</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType("dine_in")}
                      className={`p-3.5 rounded-2xl border text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        deliveryType === "dine_in"
                          ? "bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37] shadow-sm"
                          : "bg-[var(--section-alt)] border-[var(--card-border)] text-[var(--text-sub)] hover:border-[#d4af37]/30"
                      }`}
                    >
                      <span>🍽️ Dine-in Table</span>
                    </button>
                  </div>

                  {/* Delivery Address Fields */}
                  {deliveryType === "delivery" ? (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                          Street / House / Colony Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="e.g. Near Market, Main Road, House No. 12"
                          className="w-full text-xs p-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                            Landmark (Optional)
                          </label>
                          <input
                            type="text"
                            value={landmark}
                            onChange={(e) => setLandmark(e.target.value)}
                            placeholder="e.g. Near Ankit Internet Cafe"
                            className="w-full text-xs p-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                            City / Area
                          </label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full text-xs p-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Dine-in Table Selector */
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                        Table Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="e.g. Table 4 or Lounge Corner"
                        className="w-full text-xs p-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
                  <h2 className="text-base font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-[#d4af37]" />
                    <span>Payment Method</span>
                  </h2>

                  <div className="space-y-2.5">
                    <label
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === "cod"
                          ? "bg-[#d4af37]/10 border-[#d4af37] text-[var(--text-main)] shadow-sm"
                          : "bg-[var(--section-alt)] border-[var(--card-border)] text-[var(--text-sub)] hover:border-[#d4af37]/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Banknote className="w-5 h-5 text-[#d4af37]" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">
                            Cash / Pay on Delivery (COD)
                          </p>
                          <p className="text-[11px] text-[var(--text-sub-light)]">
                            Pay with cash or UPI scan when your order arrives.
                          </p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                        className="accent-[#d4af37]"
                      />
                    </label>

                    <label
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === "upi"
                          ? "bg-[#d4af37]/10 border-[#d4af37] text-[var(--text-main)] shadow-sm"
                          : "bg-[var(--section-alt)] border-[var(--card-border)] text-[var(--text-sub)] hover:border-[#d4af37]/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-[#d4af37]" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">
                            Instant UPI Payment
                          </p>
                          <p className="text-[11px] text-[var(--text-sub-light)]">
                            Google Pay, PhonePe, Paytm, BHIM UPI
                          </p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === "upi"}
                        onChange={() => setPaymentMethod("upi")}
                        className="accent-[#d4af37]"
                      />
                    </label>
                  </div>
                </div>

                {/* Final Submit Order Button */}
                <button
                  type="submit"
                  disabled={isPlacingOrder}
                  className="w-full py-4 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-2xl"
                >
                  {isPlacingOrder ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending to Kitchen...</span>
                    </>
                  ) : (
                    <>
                      <span>Place Royal Order • {formatCurrency(grandTotal)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* ==========================================================
              RIGHT COLUMN: ORDER SUMMARY SIDEBAR
              ========================================================== */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] p-6 sm:p-7 space-y-6 shadow-xl sticky top-28 gold-glow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                <h2 className="text-lg font-serif font-bold text-[var(--text-main)]">
                  Order Summary
                </h2>
                <span className="text-xs text-[var(--text-sub)]">
                  {totalItems} item{totalItems > 1 ? "s" : ""}
                </span>
              </div>

              {/* Items Miniature List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map(({ menuItem, quantity }) => (
                  <div key={menuItem.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 border border-emerald-500 rounded-sm flex items-center justify-center p-0.5 shrink-0">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      </span>
                      <span className="text-[var(--text-main)] font-medium">
                        {menuItem.name} <span className="text-[var(--text-sub-light)]">× {quantity}</span>
                      </span>
                    </div>
                    <span className="font-semibold text-[var(--text-main)]">
                      {formatCurrency((menuItem.discount_price ?? menuItem.price) * quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="space-y-3 pt-3 border-t border-[var(--card-border)] text-xs text-[var(--text-sub)]">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[var(--text-main)]">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-400">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span className="font-semibold">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Delivery Charges</span>
                  <span className="font-semibold text-[var(--text-main)]">
                    {formatCurrency(deliveryFee)}
                  </span>
                </div>

                <div className="pt-3 border-t border-dashed border-[#d4af37]/40 flex justify-between items-baseline">
                  <span className="text-sm font-semibold uppercase tracking-wider text-[var(--text-main)]">
                    Total
                  </span>
                  <span className="text-2xl font-serif font-bold text-gold-gradient">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Assurances */}
              <div className="pt-2 space-y-2 text-[11px] text-[var(--text-sub-light)] border-t border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                  <span>100% Pure Vegetarian Cuisine</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                  <span>Delivered steaming hot in 30–35 mins</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
