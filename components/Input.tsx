"use client";

import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs uppercase tracking-wider text-[#f5f5f0]/80 font-medium"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3.5 text-[#d4af37]/70 pointer-events-none flex items-center justify-center">
              {icon}
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-[#141414] text-[#f5f5f0] text-sm placeholder:text-[#f5f5f0]/30 rounded-xl border transition-all duration-200 outline-none ${
              icon ? "pl-10 pr-4 py-3" : "px-4 py-3"
            } ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-[#d4af37]/30 hover:border-[#d4af37]/60 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
            } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
        </div>

        {error && (
          <p className="text-[11px] text-red-400 mt-1 font-medium">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-[11px] text-[#f5f5f0]/50 mt-1 font-light">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
