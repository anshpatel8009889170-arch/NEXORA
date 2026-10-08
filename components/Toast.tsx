"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  isOpen: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  isOpen,
  message,
  type = "success",
  duration = 3500,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-[#d4af37] shrink-0" />,
  };

  const borderStyles = {
    success: "border-emerald-500/40",
    error: "border-red-500/40",
    info: "border-[#d4af37]/40",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={`flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#141414]/95 backdrop-blur-xl border ${borderStyles[type]} shadow-2xl gold-glow-sm text-sm text-[#f5f5f0]`}
      >
        <div className="flex items-center gap-3">
          {icons[type]}
          <p className="font-medium text-xs sm:text-sm leading-snug">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-[#f5f5f0]/60 hover:text-[#f5f5f0] hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4 pointer-events-none" />
        </button>
      </div>
    </div>
  );
}
