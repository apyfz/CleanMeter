import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "outlined" | "ghost";
  size?: "sm" | "md";
}

export function Button({
  variant = "filled",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        variant === "filled" &&
          "bg-[var(--brand)] text-[var(--text-inverse)] hover:opacity-90",
        variant === "outlined" &&
          "border border-[var(--border-strong)] text-[var(--text-heading)] hover:bg-[var(--bg-raised)]",
        variant === "ghost" &&
          "text-[var(--text-paragraph)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-raised)]",
        props.disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
