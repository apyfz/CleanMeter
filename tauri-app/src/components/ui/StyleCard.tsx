import { cn } from "@/lib/utils";

interface StyleCardProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  children?: React.ReactNode;
}

export function StyleCard({
  selected,
  onClick,
  label,
  children,
}: StyleCardProps) {
  return (
    <button onClick={onClick} className="flex flex-col gap-2 flex-1 min-w-0">
      <div
        className={cn(
          "aspect-video w-full rounded-lg flex items-center justify-center transition-all",
          "bg-[var(--bg-sunken)]",
          selected
            ? "border-2 border-[var(--brand)]"
            : "border border-[var(--border)]"
        )}
      >
        {children}
      </div>
      <span
        className={cn(
          "text-xs text-center w-full",
          selected
            ? "text-[var(--text-heading)] font-medium"
            : "text-[var(--text-paragraph)]"
        )}
      >
        {label}
      </span>
    </button>
  );
}
