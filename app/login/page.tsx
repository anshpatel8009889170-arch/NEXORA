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
    signOut,
  } = useAuth();

  const { addToCart } = useCart();

  // Mode: "login" (Sign In) vs "signup" (Create Account)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Steps: "phone" (Inputs) | "otp" (Verify 6-digit code)
  const [step, setStep] = useState<"phone" | "otp">("phone");

  // Form Inputs
  const [phoneInput, setPhoneInput] = useState("");
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");

  // Validation Warnings
  const [newUserWarning, setNewUserWarning] = useState<string | null>(null);
  const [alreadyRegisteredWarning, setAlreadyRegisteredWarning] = useState<{ name: string } | null>(null);
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

  // Handle Send OTP (Strict Dual Flow)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setNewUserWarning(null);
    setAlreadyRegisteredWarning(null);

    const cleaned = phoneInput.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Additional validations for Create Account
    if (authMode === "signup") {
      if (!firstNameInput.trim()) {
        setErrorMessage("Please enter your First Name.");
        return;
      }
      if (!lastNameInput.trim()) {
        setErrorMessage("Please enter your Last Name.");
        return;
      }
      if (emailInput.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
        setErrorMessage("Please enter a valid email address, or leave it blank.");
        return;
      }
    }

    setIsSubmitting(true);
    const res = await sendOtp(cleaned, {
      mode: authMode,
      name: authMode === "signup" ? `${firstNameInput.trim()} ${lastNameInput.trim()}` : undefined,
      email: authMode === "signup" && emailInput.trim() ? emailInput.trim() : undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      const isReg = Boolean(res.isRegistered);
      const regName = res.registeredName || null;
      setDetectedUser({ isRegistered: isReg, name: regName });

      if (authMode === "login") {
        setSuccessMessage(
          regName
            ? `Welcome back, ${regName}! Verification code sent.`
            : "Verification code sent to your registered number."
        );
      } else {
        setSuccessMessage(`Verification code sent to +91 ${cleaned}.`);
      }

      setStep("otp");
      setTimer(30);
    } else {
      // Handle Specific Dual Auth Block Cases
      if (res.code === "USER_NOT_FOUND" || res.isRegistered === false) {
        // Sign In attempted with a non-existent number -> DO NOT SEND OTP, prompt Create Account!
        setNewUserWarning(
          `No account found with mobile number +91 ${cleaned}. You are a new user, please Create Account.`
        );
        return;
      }

      if (res.code === "USER_ALREADY_EXISTS" || res.isRegistered === true) {
        // Create Account attempted with an existing number -> DO NOT SEND OTP, prompt Sign In!
        setAlreadyRegisteredWarning({
          name: res.registeredName || "Registered Patron",
        });
        return;
      }

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
    const fullName =
      authMode === "signup"
        ? `${firstNameInput.trim()} ${lastNameInput.trim()}`
        : undefined;

    const res = await verifyOtp(phoneInput, otpInput, {
      name: fullName,
      email: emailInput.trim() || undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      processPendingCartItem();
      const resolvedName = fullName || res.userName || profile?.full_name;
      const hasName = Boolean(resolvedName && resolvedName !== "Guest" && resolvedName !== "Royal Guest");

      setSuccessMessage(
        hasName
          ? `Welcome to NEXORA, ${resolvedName}!`
          : "Authentication successful! Welcome to NEXORA."
      );

      setTimeout(() => {
        router.push(redirectPath);
      }, 700);
    } else {
      setErrorMessage(res.message || "Invalid OTP code entered. Please try again.");
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

  // ALREADY LOGGED IN VIEW - Only show if user has an authentic name and is not currently verifying
  const hasAuthenticName = Boolean(
    profile?.full_name &&
    profile.full_name.trim().length > 0 &&
    profile.full_name.trim() !== "Guest" &&
    profile.full_name.trim() !== "Royal Guest"
  );

  if (isLoggedIn && hasAuthenticName && profile && step !== "otp") {
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
                <CheckCircle2 className="w-3.5 h-3.5" /> Active & Verified in Supabase
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

  // LOGIN / CREATE ACCOUNT / OTP FORM
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
                setNewUserWarning(null);
                setAlreadyRegisteredWarning(null);
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
                setNewUserWarning(null);
                setAlreadyRegisteredWarning(null);
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
            {step === "otp" && (authMode === "login" ? <ShieldCheck className="w-6 h-6 text-emerald-400" /> : <UserPlus className="w-6 h-6 text-[#d4af37]" />)}
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--text-main)]">
            {step === "phone" && (authMode === "login" ? "Sign In" : "Create Account")}
            {step === "otp" && (authMode === "login" ? "Sign In Verification" : "Confirm Registration")}
          </h1>

          {step === "phone" && (
            <p className="text-xs text-[var(--text-sub)] leading-relaxed">
              {authMode === "login"
                ? "Sign in with your registered mobile number."
                : "Fill in your details to create your royal dining profile."}
            </p>
          )}

          {step === "otp" && (
            <div className="space-y-2 pt-1 text-left">
              {authMode === "login" ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Registered Patron: {detectedUser?.name || "Patron"}</div>
                      <div className="text-[11px] text-emerald-300/80">Signing into Supabase (+91 {phoneInput})</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">Existing</span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">New Patron: {firstNameInput} {lastNameInput}</div>
                      <div className="text-[11px] text-amber-300/80">+91 {phoneInput} &bull; {emailInput || "No email"}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">New</span>
                </div>
              )}
              <p className="text-[11px] text-[var(--text-sub)] text-center pt-1">
                Enter the 6-digit OTP code. (Testing code:{" "}
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
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: SIGN IN OR CREATE ACCOUNT INPUTS */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {/* If Sign In attempted with a NEW user -> Show Prominent New User Alert Box */}
            {authMode === "login" && newUserWarning && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-semibold text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>You are a new user!</span>
                </div>
                <p className="text-[11px] text-amber-300/90 leading-relaxed">
                  No existing account found for <strong>+91 {phoneInput}</strong>. Please switch to Create Account to set up your profile.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setNewUserWarning(null);
                    setErrorMessage(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#d4af37]/90 text-black font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Switch to Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* If Create Account attempted with an ALREADY REGISTERED user -> Show Prominent Already Registered Alert Box */}
            {authMode === "signup" && alreadyRegisteredWarning && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-semibold text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Account Already Exists!</span>
                </div>
                <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                  This mobile number is already registered to <strong>{alreadyRegisteredWarning.name}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAlreadyRegisteredWarning(null);
                    setErrorMessage(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Switch to Sign In &rarr;</span>
                </button>
              </div>
            )}

            {/* CREATE ACCOUNT FIELDS: First Name & Last Name */}
            {authMode === "signup" && (
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                      First Name
                    </label>
                    <span className="text-[10px] text-amber-400">*</span>
                  </div>
                  <input
                    type="text"
                    value={firstNameInput}
                    onChange={(e) => setFirstNameInput(e.target.value)}
                    placeholder="e.g. Ansh"
                    className="w-full text-sm px-3.5 py-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                      Last Name
                    </label>
                    <span className="text-[10px] text-amber-400">*</span>
                  </div>
                  <input
                    type="text"
                    value={lastNameInput}
                    onChange={(e) => setLastNameInput(e.target.value)}
                    placeholder="e.g. Patel"
                    className="w-full text-sm px-3.5 py-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                    required
                  />
                </div>
              </div>
            )}

            {/* Mobile Number Field (Present in both modes) */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                  Mobile Number
                </label>
                <span className="text-[10px] text-amber-400 font-medium tracking-wide">
                  10-Digit Mobile
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
                  onChange={(e) => {
                    setPhoneInput(e.target.value.replace(/\D/g, ""));
                    setNewUserWarning(null);
                    setAlreadyRegisteredWarning(null);
                  }}
                  placeholder={authMode === "login" ? "Enter registered mobile" : "Enter mobile number"}
                  className="w-full text-sm font-mono tracking-wider px-3.5 py-3 bg-transparent text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none"
                  autoFocus={authMode === "login"}
                  required
                />
              </div>
            </div>

            {/* CREATE ACCOUNT FIELDS: Email Address (Optional) */}
            {authMode === "signup" && (
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Email Address</span>
                  </label>
                  <span className="text-[10px] text-[var(--text-sub-light)] font-medium">Optional</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="patron@example.com (for receipts)"
                    className="w-full text-sm px-3.5 py-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || phoneInput.length < 10 || (authMode === "signup" && (!firstNameInput.trim() || !lastNameInput.trim()))}
              className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking Supabase...</span>
                </>
              ) : (
                <>
                  <span>{authMode === "login" ? "Send Sign In OTP" : "Register & Send OTP"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Mode Switch Helper Link */}
            <div className="text-center pt-2">
              {authMode === "login" ? (
                <p className="text-xs text-[var(--text-sub)]">
                  New patron?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setNewUserWarning(null);
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
                      setAlreadyRegisteredWarning(null);
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
                    setSuccessMessage(null);
                  }}
                  className="text-[11px] text-[#d4af37] hover:underline cursor-pointer"
                >
                  Change details / Back
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
                  <span>{authMode === "login" ? "Verify & Sign In" : "Verify & Create Account"}</span>
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

        {/* Assurance */}
        <div className="pt-4 border-t border-[var(--card-border)] flex items-center justify-center gap-2 text-xs text-[var(--text-sub-light)]">
          <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
          <span>100% Encrypted &bull; Direct Supabase PostgreSQL Security</span>
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
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-sub-light)]" />
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
