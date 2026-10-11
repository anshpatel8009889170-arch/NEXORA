"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, AlertCircle, ArrowRight, RefreshCw, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";

function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const orderNumber = searchParams.get("orderNumber") || "";
  const transactionId = searchParams.get("transactionId") || searchParams.get("merchantTransactionId") || "";

  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verifyStatus() {
      if (!orderNumber && !transactionId) {
        if (isMounted) {
          setLoading(false);
          setErrorMessage("No order details found in payment callback.");
        }
        return;
      }

      try {
        const res = await fetch("/api/payment/phonepe/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber, transactionId }),
        });

        const data = await res.json();

        if (isMounted) {
          if (data.success && data.verified) {
            setVerified(true);
            clearCart();
            // Auto redirect to tracking page after 3.5 seconds
            setTimeout(() => {
              router.push(`/track-order?order=${orderNumber}`);
            }, 3500);
          } else {
            setErrorMessage(data.message || "Payment is pending or was cancelled.");
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setLoading(false);
          setErrorMessage("Failed to verify transaction with PhonePe server. Please check order tracking.");
        }
      }
    }

    verifyStatus();

    return () => {
      isMounted = false;
    };
  }, [orderNumber, transactionId, clearCart, router]);

  if (loading) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl text-center space-y-6 gold-glow max-w-md w-full">
        <div className="w-14 h-14 border-3 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
            Authenticating Payment
          </h1>
          <p className="text-xs text-[var(--text-sub)]">
            Verifying your royal dining transaction with PhonePe Gateway...
          </p>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#d4af37] font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>PhonePe Secure Encryption (256-Bit)</span>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl text-center space-y-7 gold-glow max-w-lg w-full animate-in zoom-in-95 duration-300">
        <p className="text-xs sm:text-sm font-medium text-[var(--text-sub)]">
          Payment Successful via PhonePe / UPI
        </p>

        {/* Clean Green Checkmark */}
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center shadow-lg">
          <Check className="w-10 h-10 text-emerald-400 stroke-[3]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold uppercase tracking-wider text-[var(--text-main)]">
            ORDER CONFIRMED
          </h1>
          <p className="text-base sm:text-lg font-mono font-bold text-[#d4af37]">
            Order #{orderNumber}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] text-xs text-[var(--text-sub)] space-y-1">
          <p className="font-semibold text-[var(--text-main)]">Estimated Delivery: 25 - 35 mins</p>
          <p>Freshly preparing at Sathigva, Amauli-Fatehpur Road</p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href={`/track-order?order=${orderNumber}`}
            className="w-full py-4 px-6 rounded-2xl bg-gold-gradient text-black font-serif font-bold tracking-wider uppercase text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Track Your Order Live</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-[11px] text-[var(--text-sub-light)]">
            Redirecting to live order status automatically in 3 seconds...
          </p>
        </div>
      </div>
    );
  }

  // Payment Failed or Pending
  return (
    <div className="p-8 sm:p-12 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl text-center space-y-6 max-w-md w-full animate-in zoom-in-95 duration-300">
      <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border-2 border-rose-500/40 flex items-center justify-center shadow-lg">
        <AlertCircle className="w-8 h-8 text-rose-400 stroke-[2.5]" />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
          Payment Not Completed
        </h1>
        <p className="text-xs text-[var(--text-sub)]">
          {errorMessage || "The payment was cancelled or could not be verified by PhonePe."}
        </p>
      </div>

      <div className="space-y-2.5 pt-2">
        <Link
          href="/checkout"
          className="w-full py-3.5 px-4 rounded-2xl bg-gold-gradient text-black font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Payment or Select Cash on Delivery</span>
        </Link>
        <Link
          href={`/track-order?order=${orderNumber}`}
          className="w-full py-3 px-4 rounded-2xl border border-[var(--card-border)] text-[var(--text-main)] text-xs font-medium block hover:border-[#d4af37]/40 transition-colors"
        >
          Check Order Status
        </Link>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex items-center justify-center p-4 selection:bg-[#d4af37]/30 selection:text-white">
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs text-[var(--text-sub)]">
            Loading transaction status...
          </div>
        }
      >
        <PaymentStatusContent />
      </Suspense>
    </div>
  );
}
