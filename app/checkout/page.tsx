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
  Home,
  Briefcase,
  Plus,
  X,
  Building,
  RefreshCw,
  Check,
  Trash2,
} from "lucide-react";
import { useAuth, SavedAddress } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/lib/supabase/client";
import AddressMapPicker from "@/components/AddressMapPicker";

// Razorpay type definition for window
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    user,
    profile,
    isLoggedIn,
    isLoading: authLoading,
    savedAddresses,
    selectedAddressId,
    setSelectedAddressId,
    addSavedAddress,
    deleteSavedAddress,
    sendOtp,
    verifyOtp,
    updateProfileName,
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

  // Auth Steps when customer is not logged in: "phone" | "otp" | "name"
  const [authStep, setAuthStep] = useState<"phone" | "otp" | "name">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [timer, setTimer] = useState(0);

  // Payment Selection: Initially COD is default and active
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi" | "debit" | "credit" | "netbanking">("cod");

  // Add Address Modal / Form Toggle
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [newAddrType, setNewAddrType] = useState<"Home" | "Work" | "Other">("Home");
  const [newStreet, setNewStreet] = useState("");
  const [newLandmark, setNewLandmark] = useState("");
  const [newCity, setNewCity] = useState("Amauli - Fatehpur");
  const [newPincode, setNewPincode] = useState("212631");

  const handleAddressFromMap = (addressData: {
    type: "Home" | "Work" | "Other";
    street: string;
    landmark?: string;
    city: string;
    pincode?: string;
    latitude: number;
    longitude: number;
  }) => {
    const newAddr = addSavedAddress(addressData);
    setSelectedAddressId(newAddr.id);
    setIsAddingAddress(false);
  };

  // Order Placement & Payment Verification State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);
  const [isOrderPaid, setIsOrderPaid] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showSandboxModal, setShowSandboxModal] = useState<boolean>(false);
  const [sandboxPayload, setSandboxPayload] = useState<any>(null);

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

  // Dynamically load Razorpay SDK script
  const loadRazorpaySDK = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if (window.Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

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

  // Handle Save New Address
  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet.trim()) {
      alert("Please enter your street address.");
      return;
    }

    addSavedAddress({
      type: newAddrType,
      street: newStreet.trim(),
      landmark: newLandmark.trim(),
      city: newCity.trim(),
      pincode: newPincode.trim(),
    });

    setIsAddingAddress(false);
    setNewStreet("");
    setNewLandmark("");
  };

  // Handle Backend Payment Verification
  const verifyPaymentWithBackend = async (
    orderNumber: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) => {
    try {
      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        }),
      });

      const verifyData = await verifyRes.json();

      if (verifyData.verified) {
        setIsOrderPaid(true);
        setPlacedOrderNumber(orderNumber);
        clearCart();
      } else {
        setPaymentError(verifyData.error || "Payment verification failed. Invalid signature.");
      }
    } catch {
      setPaymentError("Network error during payment verification. Please check your order status.");
    } finally {
      setIsProcessingPayment(false);
      setShowSandboxModal(false);
    }
  };

  // Final Order & Payment Placement Handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    const selectedAddr = savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0];
    if (!selectedAddr) {
      alert("Please select a delivery address.");
      return;
    }

    const orderNum = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullAddress = `${selectedAddr.type}: ${selectedAddr.street}, Landmark: ${selectedAddr.landmark || "N/A"}, ${selectedAddr.city} - ${selectedAddr.pincode || "212631"}`;

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "nexora_last_order",
        JSON.stringify({
          orderNumber: orderNum,
          items: items.map((i) => ({
            id: i.menuItem.id,
            name: i.menuItem.name,
            quantity: i.quantity,
            price: i.menuItem.discount_price ?? i.menuItem.price,
          })),
          total: grandTotal,
          address: fullAddress,
          paymentMethod,
          isPaid: paymentMethod !== "cod",
          createdAt: new Date().toISOString(),
        })
      );
    }

    // A. CASH ON DELIVERY (COD) FLOW
    if (paymentMethod === "cod") {
      setIsProcessingPayment(true);
      try {
        await supabase.from("orders").insert({
          order_number: orderNum,
          user_id: user?.id && !user.id.startsWith("user_") ? user.id : null,
          customer_name: profile?.full_name || "Royal Guest",
          customer_phone: user?.phone || profile?.phone || phoneInput,
          delivery_type: "delivery",
          delivery_address: fullAddress,
          status: "pending",
          payment_method: "cod",
          payment_status: "pending",
          subtotal: subtotal,
          discount: discountAmount,
          delivery_fee: deliveryFee,
          tax: 0,
          total_amount: grandTotal,
          coupon_code: appliedCoupon ? appliedCoupon.code : null,
          notes: appliedCoupon ? `Coupon: ${appliedCoupon.code}` : null,
        });
      } catch (err) {
        console.warn("Supabase order recording notice:", err);
      } finally {
        setIsProcessingPayment(false);
        setIsOrderPaid(false);
        setPlacedOrderNumber(orderNum);
        clearCart();
      }
      return;
    }

    // B. ONLINE PAYMENT (RAZORPAY) FLOW
    // Flow: Create Order -> Payment Gateway -> Customer Payment -> Backend Verification -> Database Order = PAID
    setIsProcessingPayment(true);

    try {
      // Step 1: Create Order on Backend
      const createOrderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNum,
          amount: grandTotal,
          customerName: profile?.full_name || "Royal Guest",
          customerPhone: user?.phone || profile?.phone || phoneInput,
          deliveryAddress: fullAddress,
          subtotal,
          deliveryFee,
          discountAmount,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
        }),
      });

      const orderData = await createOrderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      // Check if real Razorpay key is present or in sandbox test mode
      const isDemoMode = orderData.keyId === "rzp_test_nexora_demo" || orderData.razorpayOrderId.startsWith("order_demo_");

      if (isDemoMode) {
        // Show interactive Sandbox Gateway Modal for instant verification testing
        setSandboxPayload({
          orderNumber: orderNum,
          razorpayOrderId: orderData.razorpayOrderId,
          amount: grandTotal,
        });
        setShowSandboxModal(true);
        setIsProcessingPayment(false);
        return;
      }

      // Step 2: Load Razorpay Checkout SDK & Trigger Gateway
      const isLoaded = await loadRazorpaySDK();
      if (!isLoaded) {
        throw new Error("Unable to load Razorpay payment gateway. Please check your internet connection.");
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "NEXORA Fine Dining",
        description: `Royal Dining Order #${orderNum}`,
        image: "/logo.png",
        order_id: orderData.razorpayOrderId,
        handler: async function (response: any) {
          // Step 3 & 4: Backend Verification required!
          await verifyPaymentWithBackend(
            orderNum,
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        prefill: {
          name: profile?.full_name || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#d4af37",
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (response: any) {
        setPaymentError(response.error.description || "Payment failed. Please try again or choose Cash on Delivery.");
        setIsProcessingPayment(false);
      });
      razorpayInstance.open();
    } catch (err: any) {
      console.error("Razorpay initiation error:", err);
      setPaymentError(err.message || "Failed to initiate online payment.");
      setIsProcessingPayment(false);
    }
  };

  // Hydration loader
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

  // PHASE 13 — ORDER CONFIRMATION VIEW
  if (placedOrderNumber) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col selection:bg-[#d4af37]/30 selection:text-white">
        <main className="flex-1 pt-16 pb-24 px-4 sm:px-6 lg:px-8 max-w-lg mx-auto w-full flex items-center justify-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl text-center space-y-7 gold-glow animate-in zoom-in-95 duration-300 w-full">
            {/* Payment Status Label */}
            <p className="text-xs sm:text-sm font-medium text-[var(--text-sub)]">
              {isOrderPaid ? "Payment successful:" : "Payment: Cash on Delivery"}
            </p>

            {/* Clean Green Checkmark Icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center shadow-lg">
              <Check className="w-10 h-10 text-emerald-400 stroke-[3]" />
            </div>

            {/* ORDER CONFIRMED & Order ID */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold uppercase tracking-wider text-[var(--text-main)]">
                ORDER CONFIRMED
              </h1>
              <p className="text-base sm:text-lg font-mono font-bold text-[#d4af37]">
                Order #{placedOrderNumber}
              </p>
            </div>

            {/* Estimated time */}
            <div className="py-4 px-6 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] max-w-xs mx-auto space-y-1">
              <span className="text-xs text-[var(--text-sub)] uppercase tracking-wider block">
                Estimated time:
              </span>
              <p className="text-xl font-serif font-bold text-[var(--text-main)]">
                35–45 minutes
              </p>
            </div>

            {/* [ TRACK ORDER ] Button */}
            <div className="pt-2 space-y-3">
              <Link
                href={`/track-order?orderId=${placedOrderNumber}`}
                className="w-full py-4 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl"
              >
                <span>TRACK ORDER</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/menu"
                className="inline-block text-xs text-[var(--text-sub)] hover:text-[#d4af37] transition-colors pt-1"
              >
                Back to Menu
              </Link>
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
            Checkout
          </h1>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
          {/* ==========================================================
              LEFT COLUMN: 1. DELIVERY & 3. PAYMENT (lg:col-span-7)
              ========================================================== */}
          <div className="lg:col-span-7 space-y-6">
            {!isLoggedIn ? (
              /* ========================================================
                 AUTH REQUIRED FIRST: Phone -> OTP -> Name
                 ======================================================== */
              <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-6 gold-glow-sm">
                <div className="flex items-center gap-3 pb-4 border-b border-[var(--card-border)]">
                  <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[var(--text-main)]">
                      Customer Verification
                    </h2>
                    <p className="text-xs text-[var(--text-sub)]">
                      Enter your mobile number to verify and continue to delivery selection.
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
                        className="w-full text-center text-xl sm:text-2xl font-mono tracking-[0.25em] sm:tracking-[0.5em] py-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
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
                          <span>Proceed to Delivery</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* ========================================================
                 PHASE 11 & 12: SECTIONS - DELIVERY & RAZORPAY PAYMENT
                 ======================================================== */
              <form onSubmit={handlePlaceOrder} className="space-y-6">
                {/* Logged In Customer Pill */}
                <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-[var(--text-sub)]">Ordering as:</p>
                      <p className="text-xs sm:text-sm font-serif font-bold text-[var(--text-main)]">
                        {profile?.full_name}{" "}
                        <span className="font-mono text-xs font-normal text-[var(--text-sub)]">
                          ({user?.phone || profile?.phone})
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                </div>

                {/* ========================================================
                    SECTION 1: DELIVERY (Home, Work, + Add Address)
                    ======================================================== */}
                <div className="p-6 sm:p-7 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                    <h2 className="text-lg font-serif font-bold text-[var(--text-main)] flex items-center gap-2.5">
                      <MapPin className="w-5 h-5 text-[#d4af37]" />
                      <span>Delivery</span>
                    </h2>
                    <span className="text-xs text-[var(--text-sub)]">Select address</span>
                  </div>

                  {/* Radio List of Saved Addresses: Home, Work, etc. */}
                  <div className="space-y-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <label
                          key={addr.id}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-4 block ${
                            isSelected
                              ? "bg-[#d4af37]/10 border-[#d4af37] shadow-md"
                              : "bg-[var(--section-alt)] border-[var(--card-border)] text-[var(--text-sub)] hover:border-[#d4af37]/30"
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <input
                              type="radio"
                              name="deliveryAddress"
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1 accent-[#d4af37]"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {addr.type === "Home" && <Home className="w-4 h-4 text-[#d4af37]" />}
                                {addr.type === "Work" && <Briefcase className="w-4 h-4 text-[#d4af37]" />}
                                {addr.type === "Other" && <Building className="w-4 h-4 text-[#d4af37]" />}
                                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                                  {addr.type}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--text-main)] leading-relaxed">
                                {addr.street}
                              </p>
                              {addr.landmark && (
                                <p className="text-[11px] text-[var(--text-sub)]">
                                  Landmark: {addr.landmark}
                                </p>
                              )}
                              <p className="text-[11px] text-[var(--text-sub-light)]">
                                {addr.city} {addr.pincode ? `• ${addr.pincode}` : ""}
                              </p>
                              {addr.latitude && addr.longitude && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded-full border border-[#d4af37]/30 mt-1">
                                  <MapPin className="w-2.5 h-2.5" />
                                  <span>Pin: {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isSelected && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-gradient text-black">
                                Selected
                              </span>
                            )}
                            {savedAddresses.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (confirm("Delete this address from saved list?")) {
                                    deleteSavedAddress(addr.id);
                                  }
                                }}
                                className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Delete address"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Address Actions: Set Pin on Map (Swiggy Style) & Manual Entry */}
                  {!isAddingAddress ? (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsMapPickerOpen(true)}
                          className="py-3 px-4 rounded-2xl bg-gold-gradient text-black text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 stroke-[2.5]" />
                          <span>Set Pin on Map (Swiggy Style)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingAddress(true)}
                          className="py-3 px-4 rounded-2xl border border-[var(--card-border)] bg-[var(--section-alt)] text-[var(--text-sub)] hover:text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Enter Manually</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Add Address Form */
                    <div className="p-5 rounded-2xl bg-[var(--section-alt)] border border-[#d4af37]/30 space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--card-border)]">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
                          <Plus className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>Add New Address</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingAddress(false)}
                          className="text-xs text-[var(--text-sub)] hover:text-rose-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Tag selector: Home, Work, Other */}
                      <div className="flex gap-2">
                        {(["Home", "Work", "Other"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setNewAddrType(t)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                              newAddrType === t
                                ? "bg-gold-gradient text-black"
                                : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-sub)]"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          required
                          value={newStreet}
                          onChange={(e) => setNewStreet(e.target.value)}
                          placeholder="Street, House No, Colony *"
                          className="w-full text-xs p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={newLandmark}
                            onChange={(e) => setNewLandmark(e.target.value)}
                            placeholder="Landmark (Near...)"
                            className="w-full text-xs p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                          />
                          <input
                            type="text"
                            value={newCity}
                            onChange={(e) => setNewCity(e.target.value)}
                            placeholder="City"
                            className="w-full text-xs p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleSaveNewAddress}
                          className="flex-1 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 shadow-md"
                        >
                          Save Address
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingAddress(false)}
                          className="px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-sub)]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ========================================================
                    SECTION 3: PAYMENT
                    Initially: Cash on Delivery
                    and later: UPI, Debit Card, Credit Card, Net Banking (Razorpay)
                    ======================================================== */}
                <div className="p-6 sm:p-7 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                    <h2 className="text-lg font-serif font-bold text-[var(--text-main)] flex items-center gap-2.5">
                      <Banknote className="w-5 h-5 text-[#d4af37]" />
                      <span>Payment</span>
                    </h2>
                    <span className="text-xs text-[#d4af37] font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Razorpay Verified
                    </span>
                  </div>

                  {paymentError && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* 1. Cash on Delivery (Initially Active & Primary) */}
                    <label
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-4 block ${
                        paymentMethod === "cod"
                          ? "bg-[#d4af37]/10 border-[#d4af37] shadow-sm"
                          : "bg-[var(--section-alt)] border-[var(--card-border)] text-[var(--text-sub)] hover:border-[#d4af37]/30"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <input
                          type="radio"
                          name="paymentOption"
                          checked={paymentMethod === "cod"}
                          onChange={() => setPaymentMethod("cod")}
                          className="mt-1 accent-[#d4af37]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-[#d4af37]" />
                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                              Cash on Delivery
                            </p>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Active
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-sub)] pt-1">
                            Pay with cash or scan delivery partner&apos;s UPI QR code upon arrival.
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* RAZORPAY GATEWAY OPTIONS (UPI, Cards, Net Banking) */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between pb-2">
                        <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-sub-light)] font-semibold">
                          Online Gateway (Instant Razorpay Verification)
                        </p>
                        <span className="text-[10px] font-mono text-[#d4af37]">Powered by Razorpay</span>
                      </div>

                      <div className="space-y-2.5">
                        {/* 2. UPI */}
                        <label
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                            paymentMethod === "upi"
                              ? "bg-[#d4af37]/10 border-[#d4af37]"
                              : "bg-[var(--section-alt)] border-[var(--card-border)] text-[var(--text-sub)] hover:border-[#d4af37]/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentOption"
                              checked={paymentMethod === "upi"}
                              onChange={() => setPaymentMethod("upi")}
                              className="accent-[#d4af37]"
                            />
                            <Smartphone className="w-4 h-4 text-[#d4af37]" />
                            <div>
                              <p className="text-xs font-semibold text-[var(--text-main)]">
                                UPI
                              </p>
                              <p className="text-[10px] text-[var(--text-sub-light)]">
                                Google Pay, PhonePe, Paytm, BHIM UPI
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] uppercase font-bold">
                            Instant Pay
                          </span>
                        </label>

                        {/* 3. Debit Card */}
                        <label
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                            paymentMethod === "debit"
                              ? "bg-[#d4af37]/10 border-[#d4af37]"
                              : "bg-[var(--section-alt)] border-[var(--card-border)] text-[var(--text-sub)] hover:border-[#d4af37]/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentOption"
                              checked={paymentMethod === "debit"}
                              onChange={() => setPaymentMethod("debit")}
                              className="accent-[#d4af37]"
                            />
                            <CreditCard className="w-4 h-4 text-[#d4af37]" />
                            <div>
                              <p className="text-xs font-semibold text-[var(--text-main)]">
                                Debit Card
                              </p>
                              <p className="text-[10px] text-[var(--text-sub-light)]">
                                Visa, MasterCard, RuPay
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] uppercase font-bold">
                            Online Gateway
                          </span>
                        </label>

                        {/* 4. Credit Card */}
                        <label
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                            paymentMethod === "credit"
                              ? "bg-[#d4af37]/10 border-[#d4af37]"
                              : "bg-[var(--section-alt)] border-[var(--card-border)] text-[var(--text-sub)] hover:border-[#d4af37]/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentOption"
                              checked={paymentMethod === "credit"}
                              onChange={() => setPaymentMethod("credit")}
                              className="accent-[#d4af37]"
                            />
                            <CreditCard className="w-4 h-4 text-[#d4af37]" />
                            <div>
                              <p className="text-xs font-semibold text-[var(--text-main)]">
                                Credit Card
                              </p>
                              <p className="text-[10px] text-[var(--text-sub-light)]">
                                All major banks & rewards cards
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] uppercase font-bold">
                            Online Gateway
                          </span>
                        </label>

                        {/* 5. Net Banking */}
                        <label
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                            paymentMethod === "netbanking"
                              ? "bg-[#d4af37]/10 border-[#d4af37]"
                              : "bg-[var(--section-alt)] border-[var(--card-border)] text-[var(--text-sub)] hover:border-[#d4af37]/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentOption"
                              checked={paymentMethod === "netbanking"}
                              onChange={() => setPaymentMethod("netbanking")}
                              className="accent-[#d4af37]"
                            />
                            <Building className="w-4 h-4 text-[#d4af37]" />
                            <div>
                              <p className="text-xs font-semibold text-[var(--text-main)]">
                                Net Banking
                              </p>
                              <p className="text-[10px] text-[var(--text-sub-light)]">
                                SBI, HDFC, ICICI, Axis & 50+ Banks
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] uppercase font-bold">
                            Online Gateway
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Submit Order Button */}
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="w-full py-4 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-2xl"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>
                        {paymentMethod === "cod" ? "Confirming Order..." : "Connecting to Razorpay..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        Place Your Order • {formatCurrency(grandTotal)}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* ==========================================================
              RIGHT COLUMN: 2. ORDER SECTION & BILL BREAKDOWN (lg:col-span-5)
              ========================================================== */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] p-6 sm:p-7 space-y-6 shadow-xl sticky top-28 gold-glow-sm">
              {/* ======================================================
                  SECTION 2: ORDER (Paneer Tikka ×2, Biryani ×1)
                  ====================================================== */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                  <h2 className="text-lg font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#d4af37]" />
                    <span>Order</span>
                  </h2>
                  <Link
                    href="/cart"
                    className="text-xs text-[#d4af37] hover:underline flex items-center gap-1"
                  >
                    <span>Edit</span>
                  </Link>
                </div>

                {/* Clean Dish List Matching User Example: Dish × Qty */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {items.map(({ menuItem, quantity }) => {
                    const price = menuItem.discount_price ?? menuItem.price;
                    return (
                      <div
                        key={menuItem.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 border border-emerald-500 rounded-sm flex items-center justify-center p-0.5 shrink-0">
                              <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            </span>
                            <span className="font-serif font-bold text-[var(--text-main)] text-sm">
                              {menuItem.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-sub)] pl-4 font-mono">
                            {formatCurrency(price)} × {quantity}
                          </p>
                        </div>

                        <span className="font-semibold text-sm text-[var(--text-main)]">
                          {formatCurrency(price * quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bill Details Breakdown */}
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

      {/* ============================================================
          RAZORPAY SANDBOX TEST POPUP (For Development Verification)
          ============================================================ */}
      {showSandboxModal && sandboxPayload && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[var(--card-bg)] border border-[#d4af37]/50 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-[var(--text-main)]">
                    Razorpay Gateway Simulator
                  </h3>
                  <p className="text-[10px] text-[#d4af37]">Sandbox Verification Pipeline</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSandboxModal(false)}
                className="text-[var(--text-sub)] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-sub)]">Order Ref:</span>
                <span className="font-mono font-bold text-[#d4af37]">#{sandboxPayload.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-sub)]">Razorpay Order ID:</span>
                <span className="font-mono text-[var(--text-sub)]">{sandboxPayload.razorpayOrderId}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-[var(--card-border)]">
                <span>Amount:</span>
                <span className="text-gold-gradient text-sm">{formatCurrency(sandboxPayload.amount)}</span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-sub)] leading-relaxed">
              Click below to simulate customer payment completion. The payment signature will be securely sent to <span className="font-mono text-[#d4af37]">/api/payment/verify</span> for backend cryptographic verification before marking the order as <span className="text-emerald-400 font-bold">PAID</span>.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={() => {
                  setIsProcessingPayment(true);
                  const demoPaymentId = `pay_demo_${Date.now()}`;
                  const demoSignature = `sig_demo_${Date.now()}`;
                  verifyPaymentWithBackend(
                    sandboxPayload.orderNumber,
                    sandboxPayload.razorpayOrderId,
                    demoPaymentId,
                    demoSignature
                  );
                }}
                className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying with Backend...</span>
                  </>
                ) : (
                  <>
                    <span>Simulate Payment & Backend Verify</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowSandboxModal(false)}
                className="w-full py-2.5 text-xs text-[var(--text-sub)] hover:text-white transition-colors"
              >
                Cancel & Return to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Swiggy-Style Interactive Map Address Picker */}
      <AddressMapPicker
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onSelectAddress={handleAddressFromMap}
      />
    </div>
  );
}
