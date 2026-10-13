"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  User,
  LogOut,
  ShoppingBag,
  Sparkles,
  Lock,
  ChevronRight,
  RefreshCw,
  LogIn,
  UserPlus,
  Mail,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/menu";

  const {
    user,
    profile,
    isLoggedIn,
    isLoading,
    sendOtp,
    verifyOtp,
    updateProfileName,
    signOut,
  } = useAuth();

  const { addToCart } = useCart();

  // Mode: "login" (Sign In) vs "signup" (Create Account)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Steps: "phone" | "otp" | "details"
  const [step, setStep] = useState<"phone" | "otp" | "details">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [detectedUser, setDetectedUser] = useState<{ isRegistered: boolean; name?: string | null } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

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

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleaned = phoneInput.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);
    const res = await sendOtp(cleaned);
    setIsSubmitting(false);

    if (res.success) {
      const isReg = Boolean(res.isRegistered);
      const regName = res.registeredName || null;
      setDetectedUser({ isRegistered: isReg, name: regName });

      if (isReg) {
        if (authMode === "signup") {
          setSuccessMessage(
            `Account Found! +91 ${cleaned} is already registered to ${regName || "you"}. Proceeding with Sign In.`
          );
        } else {
          setSuccessMessage(
            regName
              ? `Welcome back, ${regName}! Enter OTP code to sign in.`
              : "Registered account detected! Enter OTP to sign in."
          );
        }
      } else {
        if (authMode === "login") {
          setSuccessMessage(
            `New Customer Detected: No existing account found for +91 ${cleaned}. Please enter OTP code to register your profile.`
          );
        } else {
          setSuccessMessage(
            `New account setup for +91 ${cleaned}! Enter OTP code to continue.`
          );
        }
      }

      setStep("otp");
      setTimer(30);
    } else {
      setErrorMessage(res.message || "Failed to dispatch verification code. Please try again.");
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (otpInput.trim().length < 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    const res = await verifyOtp(phoneInput, otpInput);
    setIsSubmitting(false);

    if (res.success) {
      if (res.isNewUser) {
        setStep("details");
        setSuccessMessage("Phone verified! Enter your full name to complete registration.");
      } else {
        processPendingCartItem();
        const resolvedName = res.userName || profile?.full_name;
        const hasName = Boolean(resolvedName && resolvedName !== "Guest" && resolvedName !== "Royal Guest");
        setSuccessMessage(
          hasName ? `Welcome back, ${resolvedName}!` : "Authentication successful! Welcome to NEXORA."
        );
        setTimeout(() => {
          router.push(redirectPath);
        }, 800);
      }
    } else {
      setErrorMessage(res.message || "Invalid OTP entered. Please try again.");
    }
  };

  // Process pending cart item selected before login
  const processPendingCartItem = () => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("nexora-pending-cart-item");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.item) {
            addToCart(parsed.item, parsed.quantity || 1);
            localStorage.removeItem("nexora-pending-cart-item");
          }
        }
      }
    } catch (e) {
      console.warn("Could not process pending cart item:", e);
    }
  };

  // Handle Profile Details (Name mandatory, Email optional)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    const trimmedEmail = emailInput.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address, or leave it blank.");
      return;
    }

    setIsSubmitting(true);
    const res = await updateProfileName(trimmedName, trimmedEmail || undefined);
    setIsSubmitting(false);

    if (res.success) {
      processPendingCartItem();
      setSuccessMessage(`Account created successfully! Welcome to NEXORA, ${trimmedName}.`);
      setTimeout(() => {
        router.push(redirectPath);
      }, 800);
    } else {
      setErrorMessage(res.message || "Failed to save profile details.");
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs uppercase tracking-widest text-[var(--text-sub)]">
          Checking royal session...
        </p>
      </div>
    );
  }

  // ALREADY LOGGED IN VIEW - Only show if user has an authentic name and is not completing details
  const hasAuthenticName = Boolean(
    profile?.full_name &&
    profile.full_name.trim().length > 0 &&
    profile.full_name.trim() !== "Guest" &&
    profile.full_name.trim() !== "Royal Guest"
  );

  if (isLoggedIn && hasAuthenticName && profile && step !== "details") {
    return (
      <div className="max-w-md mx-auto py-12 animate-in fade-in duration-300">
        <div className="p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl text-center space-y-6 gold-glow-sm">
          <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-[#151515] to-[#252525] border-2 border-[#d4af37]/60 flex items-center justify-center shadow-xl">
            <span className="text-3xl font-serif font-bold text-gold-gradient">
              {profile.full_name.charAt(0).toUpperCase()}
            </span>
            <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-black shadow-md">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
              Authenticated Royal Guest
            </span>
            <h1 className="text-2xl font-serif font-bold text-[var(--text-main)]">
              {profile.full_name}
            </h1>
            <p className="text-xs text-[var(--text-sub)] font-mono">
              {user?.phone || profile.phone}
            </p>
            {profile.email && (
              <p className="text-xs text-[var(--text-sub-light)] font-sans">
                {profile.email}
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-xs text-left space-y-2">
            <div className="flex items-center justify-between text-[var(--text-sub)]">
              <span>Account Status</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active & Verified
              </span>
            </div>
            <div className="flex items-center justify-between text-[var(--text-sub)]">
              <span>Dining Privileges</span>
              <span className="text-[#d4af37] font-semibold">Gold Tier Member</span>
            </div>
          </div>

          {/* Action Navigation */}
          <div className="space-y-3 pt-2">
            <Link
              href="/menu"
              className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Menu & Order</span>
            </Link>

            <Link
              href="/cart"
              className="w-full py-3 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--card-bg)] text-[var(--text-main)] border border-[#d4af37]/40 hover:border-[#d4af37] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>View Cart & Checkout</span>
            </Link>

            <button
              type="button"
              onClick={signOut}
              className="w-full py-2.5 text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center justify-center gap-1.5 pt-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out from Device</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOGIN / CREATE ACCOUNT / OTP / DETAILS FORM
  return (
    <div className="max-w-md mx-auto py-12 animate-in fade-in duration-300">
      <div className="p-8 sm:p-9 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl space-y-6 gold-glow-sm">
        {/* MODE SWITCHER TABS (Sign In vs Create Account) */}
        {step === "phone" && (
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)]">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === "login"
                  ? "bg-gold-gradient text-black shadow-md font-bold"
                  : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === "signup"
                  ? "bg-gold-gradient text-black shadow-md font-bold"
                  : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        )}

        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shadow-inner mb-3">
            {step === "phone" && (authMode === "login" ? <Lock className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />)}
            {step === "otp" && (detectedUser?.isRegistered ? <ShieldCheck className="w-6 h-6 text-emerald-400" /> : <UserPlus className="w-6 h-6 text-[#d4af37]" />)}
            {step === "details" && <User className="w-6 h-6" />}
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--text-main)]">
            {step === "phone" && (authMode === "login" ? "Sign In" : "Create Account")}
            {step === "otp" && (detectedUser?.isRegistered ? "Sign In Verification" : "New Account Verification")}
            {step === "details" && "Complete Your Profile"}
          </h1>

          {step === "otp" && (
            <div className="space-y-2 pt-1 text-left">
              {detectedUser?.isRegistered ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Registered Account: {detectedUser.name || "Patron"}</div>
                      <div className="text-[11px] text-emerald-300/80">Signing into existing profile (+91 {phoneInput})</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">Existing</span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">New Mobile Number (+91 {phoneInput})</div>
                      <div className="text-[11px] text-amber-300/80">Name required after OTP verification</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">New</span>
                </div>
              )}
              <p className="text-[11px] text-[var(--text-sub)] text-center pt-1">
                Enter the 6-digit code sent to +91 {phoneInput}. (Testing code:{" "}
                <button
                  type="button"
                  onClick={() => setOtpInput("123456")}
                  className="text-[#d4af37] font-mono font-bold underline cursor-pointer hover:text-amber-300"
                >
                  123456
                </button>
                )
              </p>
            </div>
          )}

          {step === "details" && (
            <p className="text-xs text-[var(--text-sub)] leading-relaxed">
              Mobile <strong className="text-[var(--text-main)] font-mono">+91 {phoneInput}</strong> verified. Please enter your full name to complete registration.
            </p>
          )}
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: PHONE NUMBER INPUT (MANDATORY) */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                  Mobile Number
                </label>
                <span className="text-[10px] text-amber-400 font-medium tracking-wide">
                  Required
                </span>
              </div>
              <div className="flex rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] overflow-hidden focus-within:border-[#d4af37] transition-all">
                <span className="px-3.5 py-3 text-xs font-medium text-[var(--text-sub)] border-r border-[var(--card-border)] flex items-center gap-1.5">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 10-digit mobile"
                  className="w-full text-sm font-mono tracking-wider px-3.5 py-3 bg-transparent text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || phoneInput.length < 10}
              className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching OTP...</span>
                </>
              ) : (
                <>
                  <span>{authMode === "login" ? "Send Sign In OTP" : "Send Verification OTP"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Helper Switcher */}
            <div className="pt-2 text-center">
              {authMode === "login" ? (
                <p className="text-xs text-[var(--text-sub)]">
                  New to NEXORA?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[#d4af37] font-semibold hover:underline cursor-pointer"
                  >
                    Create Account
                  </button>
                </p>
              ) : (
                <p className="text-xs text-[var(--text-sub)]">
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[#d4af37] font-semibold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </form>
        )}

        {/* STEP 2: 6-DIGIT OTP INPUT (MANDATORY) */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                  6-Digit OTP Code
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtpInput("");
                    setErrorMessage(null);
                  }}
                  className="text-[11px] text-[#d4af37] hover:underline cursor-pointer"
                >
                  Change number
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
              disabled={isSubmitting || otpInput.length < 6}
              className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify & Proceed</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Resend OTP Timer */}
            <div className="text-center pt-2">
              {timer > 0 ? (
                <p className="text-xs text-[var(--text-sub)]">
                  Resend code in <span className="text-[#d4af37] font-semibold">{timer}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSubmitting}
                  className="text-xs text-[#d4af37] font-medium hover:underline cursor-pointer"
                >
                  Resend OTP Code
                </button>
              )}
            </div>
          </form>
        )}

        {/* STEP 3: DETAILS (NAME REQUIRED, EMAIL OPTIONAL) */}
        {step === "details" && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Verified Mobile Confirmation Banner */}
            <div className="p-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="font-mono text-[var(--text-main)]">+91 {phoneInput}</span>
              </div>
              <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            </div>

            {/* 1. Full Name (Mandatory) */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                  Full Name
                </label>
                <span className="text-[10px] text-amber-400 font-medium">Required</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Ansh Patel"
                  className="w-full text-sm px-4 py-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                  autoFocus
                />
              </div>
            </div>

            {/* 2. Email Address (Optional) */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                  Email Address
                </label>
                <span className="text-[10px] text-[var(--text-sub-light)] font-medium">Optional</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="patron@example.com (for invoices)"
                  className="w-full text-sm px-4 py-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                />
              </div>
              <p className="text-[11px] text-[var(--text-sub-light)]">
                Optional: Receive GST invoice and digital delivery updates on your email.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !nameInput.trim()}
              className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Assurance */}
        <div className="pt-4 border-t border-[var(--card-border)] flex items-center justify-center gap-2 text-xs text-[var(--text-sub-light)]">
          <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
          <span>100% Secure</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col selection:bg-[#d4af37]/30 selection:text-white">
      <main className="flex-1 pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 py-4 text-xs text-[var(--text-sub)]">
          <Link href="/" className="hover:text-[#d4af37] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-[var(--text-sub-light)]" />
          <span className="text-[#d4af37] font-medium">Customer Login & Register</span>
        </div>

        <Suspense
          fallback={
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          }
        >
          <LoginContent />
        </Suspense>
      </main>
    </div>
  );
}
