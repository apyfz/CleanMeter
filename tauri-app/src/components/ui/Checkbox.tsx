import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  trailing?: React.ReactNode;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
  trailing,
}: CheckboxProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 cursor-pointer py-1",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) onChange(!checked);
        }}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
          checked
            ? "bg-[var(--brand)] border-[var(--brand)]"
            : "border-[var(--border-strong)] bg-transparent"
        )}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M10 3L4.5 8.5L2 6"
              stroke="var(--text-inverse)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span className="text-sm text-[var(--text-heading)] flex-1">
        {label}
      </span>
      {trailing}
    </label>
  );
}
