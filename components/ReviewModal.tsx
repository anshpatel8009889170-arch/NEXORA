"use client";

import React, { useState, useEffect } from "react";
import { Star, CheckCircle2, Sparkles, Loader2, UtensilsCrossed } from "lucide-react";
import Modal from "./Modal";

export interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultDishName?: string;
  orderId?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: "Disappointing",
  2: "Needs Improvement",
  3: "Average Experience",
  4: "Very Good Dining",
  5: "Exceptional Royal Gastronomy!",
};

export default function ReviewModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDishName = "",
  orderId = "",
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>("");
  const [dishName, setDishName] = useState<string>(defaultDishName);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setErrorMessage(null);
      if (defaultDishName) setDishName(defaultDishName);

      // Try pre-filling name from localStorage profile if available
      try {
        const storedProfile = localStorage.getItem("nexora_user_profile");
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          if (profile.full_name) setCustomerName(profile.full_name);
        }
      } catch {}
    }
  }, [isOpen, defaultDishName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMessage("Please share a few words about your food and experience.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim() || "Valued Patron",
          rating,
          dish_name: dishName.trim() || "Overall Dining Experience",
          order_id: orderId || null,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsSubmitted(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setErrorMessage(data.error || "Failed to submit review. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="How was your order?"
      description="Share your fine-dining experience with NEXORA Master Chefs."
      maxWidth="md"
    >
      {isSubmitted ? (
        <div className="py-8 text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-serif font-bold text-[var(--text-main)]">
              Thank You for Your Review!
            </h3>
            <p className="text-xs text-[var(--text-sub)] max-w-sm mx-auto font-light leading-relaxed">
              Your feedback has been received. To maintain authenticity and highest standards, public website par sirf approved reviews display honge once approved by our concierge.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* 5-Star Interactive Rating Selector */}
          <div className="p-4 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 rounded-lg transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                    aria-label={`${star} star`}
                  >
                    <Star
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                        isFilled
                          ? "fill-[#d4af37] text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                          : "text-zinc-600 hover:text-zinc-400"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-semibold text-[#d4af37] tracking-wider uppercase">
              {RATING_LABELS[hoverRating || rating]}
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)] mb-1">
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ansh Patel / Royal Patron"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#d4af37] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)] mb-1">
                Dish Name or Occasion (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 24K Gold Saffron Shahi Tukda / Royal Dining"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#d4af37] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)] mb-1">
                Your Experience &amp; Comments <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Food was amazing. The slow-cooked flavors and aroma were extraordinary..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#d4af37] transition-all resize-none"
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl text-center">
              {errorMessage}
            </p>
          )}

          {/* Information badge */}
          <div className="text-[11px] text-[var(--text-sub)]/80 bg-[var(--section-alt)] border border-[var(--card-border)] p-3 rounded-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#d4af37] shrink-0" />
            <span>
              Public website par sirf approved reviews show honge. Our concierge reviews every feedback within 24 hours.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-[var(--text-sub)] hover:text-[var(--text-main)] bg-[var(--section-alt)] border border-[var(--card-border)] hover:border-zinc-500 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Write Review</span>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
