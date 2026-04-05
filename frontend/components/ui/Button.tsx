"use client";
import { ReactNode, ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

const styles = {
  primary: "bg-[#238636] hover:bg-[#2ea043] text-white border border-[#2ea043]",
  secondary: "bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] border border-[#30363d]",
  ghost: "bg-transparent hover:bg-[#21262d] text-[#8b949e] border border-transparent",
  danger: "bg-[#da3633] hover:bg-[#f85149] text-white border border-[#f85149]",
};
const sizes = {
  sm: "px-3 py-1 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-md",
  lg: "px-6 py-3 text-base rounded-lg",
};

export default function Button({
  variant = "primary", size = "md", loading, children, className = "", disabled, ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all ${styles[variant]} ${sizes[size]} ${className}`}
    >
      {loading && (
        <svg className="spinner w-3 h-3 border-2 border-current border-t-transparent rounded-full" viewBox="0 0 24 24" />
      )}
      {children}
    </button>
  );
}
