import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disclaimer?: string;
}

export function Select({
  value,
  options,
  onChange,
  placeholder = "Select...",
  label,
  disclaimer,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      {label && (
        <span className="text-xs font-medium text-[var(--text-paragraph)] mb-1 block">
          {label}
        </span>
      )}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between w-full h-10 px-3 rounded-lg",
          "border border-[var(--border)] bg-[var(--bg-raised)]",
          "text-sm text-[var(--text-heading)]"
        )}
      >
        <span className={!selected ? "text-[var(--text-disabled)]" : ""}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={cn("transition-transform", open && "rotate-180")}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {disclaimer && (
        <p className="text-[10px] text-[var(--text-paragraph)] mt-1">
          {disclaimer}
        </p>
      )}
      {open && (
        <div className="absolute z-50 top-full left-0 w-full mt-1 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-surface)] transition-colors",
                option.value === value
                  ? "text-[var(--brand)] font-medium"
                  : "text-[var(--text-heading)]"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
