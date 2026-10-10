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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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

  // Steps: "phone" | "otp" | "name"
  const [step, setStep] = useState<"phone" | "otp" | "name">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [nameInput, setNameInput] = useState("");

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
      setSuccessMessage(res.message || "OTP sent successfully!");
      setStep("otp");
      setTimer(30);
    } else {
      setErrorMessage(res.message || "Failed to send OTP. Please try again.");
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
        setStep("name");
        setSuccessMessage("Phone verified! Please enter your name.");
      } else {
        setSuccessMessage("Authentication successful! Welcome to NEXORA.");
        setTimeout(() => {
          router.push(redirectPath);
        }, 800);
      }
    } else {
      setErrorMessage(res.message || "Invalid OTP entered. Please try again.");
    }
  };

  // Handle Profile Name Submission
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nameInput.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    setIsSubmitting(true);
    const res = await updateProfileName(nameInput.trim());
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage("Profile personalized! Redirecting...");
      setTimeout(() => {
        router.push(redirectPath);
      }, 800);
    } else {
      setErrorMessage(res.message || "Failed to save profile name.");
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

  // ALREADY LOGGED IN VIEW
  if (isLoggedIn && profile?.full_name) {
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
              className="w-full py-2.5 text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center justify-center gap-1.5 pt-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out from Device</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOGIN / OTP / NAME FORM
  return (
    <div className="max-w-md mx-auto py-12 animate-in fade-in duration-300">
      <div className="p-8 sm:p-9 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl space-y-6 gold-glow-sm">
        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shadow-inner mb-3">
            {step === "phone" && <Phone className="w-6 h-6" />}
            {step === "otp" && <Lock className="w-6 h-6" />}
            {step === "name" && <User className="w-6 h-6" />}
          </div>

          <span className="text-[10px] uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
            NEXORA Pure Gourmet Access
          </span>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--text-main)]">
            {step === "phone" && "Customer Login"}
            {step === "otp" && "Verify Phone"}
            {step === "name" && "Welcome to NEXORA"}
          </h1>

          <p className="text-xs text-[var(--text-sub)] leading-relaxed">
            {step === "phone" && "Enter your 10-digit mobile number. We will send you an OTP for instant secure verification."}
            {step === "otp" && `Enter the 6-digit verification code sent to +91 ${phoneInput}.`}
            {step === "name" && "Tell us your name so we can personalize your royal order and fine dining delivery."}
          </p>
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

        {/* STEP 1: PHONE NUMBER INPUT */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                Mobile Number
              </label>
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
                  placeholder="Enter 10-digit phone"
                  className="w-full text-sm font-mono tracking-wider px-3.5 py-3 bg-transparent text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || phoneInput.length < 10}
              className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: 6-DIGIT OTP INPUT */}
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
                  className="text-[11px] text-[#d4af37] hover:underline"
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
              className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg"
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
                  className="text-xs text-[#d4af37] font-medium hover:underline"
                >
                  Resend OTP Code
                </button>
              )}
            </div>
          </form>
        )}

        {/* STEP 3: FULL NAME (PROFILE CREATION FOR NEW GUEST) */}
        {step === "name" && (
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
              disabled={isSubmitting || !nameInput.trim()}
              className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isSubmitting ? (
                <span>Saving Profile...</span>
              ) : (
                <>
                  <span>Complete & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Assurance */}
        <div className="pt-4 border-t border-[var(--card-border)] flex items-center justify-center gap-2 text-[11px] text-[var(--text-sub-light)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Encrypted Phone Verification • No Password Required</span>
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
          <span className="text-[#d4af37] font-medium">Customer Login</span>
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
