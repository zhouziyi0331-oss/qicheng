"use client";
import { InputHTMLAttributes, forwardRef } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  suffix?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, suffix, className = "", ...rest }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-xs text-[#8b949e]">{label}</label>}
        <div className="relative">
          <input
            ref={ref}
            className={`${error ? "border-[#f85149]" : ""} ${suffix ? "pr-20" : ""} ${className}`}
            {...rest}
          />
          {suffix && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">{suffix}</div>
          )}
        </div>
        {error && <p className="text-xs text-[#f85149]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#8b949e]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
