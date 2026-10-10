import React from "react";

export default function MenuLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="h-5 w-40 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full mx-auto" />
        <div className="h-10 w-72 bg-[var(--card-bg)] rounded-2xl mx-auto" />
        <div className="h-4 w-96 bg-[var(--card-bg)] rounded-lg mx-auto" />
        <div className="h-11 w-full max-w-md bg-[var(--card-bg)] rounded-full mx-auto mt-4" />
      </div>

      {/* Categories Bar Skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[var(--card-border)]">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-8 w-24 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full shrink-0"
          />
        ))}
      </div>

      {/* Food Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden space-y-4 p-4"
          >
            <div className="h-48 w-full bg-[var(--section-alt)] rounded-xl" />
            <div className="space-y-2">
              <div className="h-5 w-3/4 bg-[var(--section-alt)] rounded" />
              <div className="h-3 w-full bg-[var(--section-alt)] rounded" />
              <div className="h-3 w-2/3 bg-[var(--section-alt)] rounded" />
            </div>
            <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-between">
              <div className="h-6 w-20 bg-[var(--section-alt)] rounded" />
              <div className="h-8 w-20 bg-[var(--section-alt)] rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
