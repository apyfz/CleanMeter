import { useState } from "react";
import { cn } from "@/lib/utils";

interface CollapsibleProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function Collapsible({
  title,
  defaultOpen = true,
  children,
}: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2"
      >
        <span className="text-xs font-semibold tracking-wider text-[var(--text-paragraph)] uppercase">
          {title}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={cn(
            "text-[var(--icon-subtle)] transition-transform",
            open ? "rotate-0" : "-rotate-90"
          )}
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
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}
