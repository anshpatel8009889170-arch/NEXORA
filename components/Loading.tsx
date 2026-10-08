"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface LoadingProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export default function Loading({
  label = "Loading NEXORA...",
  size = "md",
  fullScreen = false,
}: LoadingProps) {
  const sizeMap = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-6">
      <Loader2 className={`${sizeMap[size]} text-[#d4af37] animate-spin`} />
      {label && (
        <span className="text-xs uppercase tracking-[0.25em] text-[#d4af37]/80 font-medium animate-pulse">
          {label}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
}

export function FoodCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#121212] border border-[#d4af37]/15 overflow-hidden animate-pulse flex flex-col min-h-[320px]">
      <div className="w-full h-48 bg-[#1a1a1a]" />
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="h-5 bg-[#1f1f1f] rounded w-3/4" />
          <div className="h-3 bg-[#181818] rounded w-full" />
          <div className="h-3 bg-[#181818] rounded w-2/3" />
        </div>
        <div className="pt-3 border-t border-[#d4af37]/10 flex items-center justify-between">
          <div className="h-6 bg-[#1f1f1f] rounded w-16" />
          <div className="h-8 bg-[#1f1f1f] rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}
