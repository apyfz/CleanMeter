import { getBoundaryColor, formatValue } from "@/lib/utils";
import type { Boundaries } from "@/lib/types";

interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  boundaries?: Boundaries;
}

export function ProgressRing({
  value,
  max,
  label,
  unit,
  boundaries,
}: ProgressRingProps) {
  const percentage = Math.min(value / max, 1);
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage);
  const color = boundaries
    ? getBoundaryColor(value, boundaries)
    : "var(--green-500)";

  return (
    <div className="flex items-center gap-1.5">
      <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0">
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="white"
          strokeOpacity="0.15"
          strokeWidth="3"
        />
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 12 12)"
        />
      </svg>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xs font-medium text-white">
          {formatValue(value)}
        </span>
        <span className="text-[9px] text-white/50">{unit}</span>
      </div>
    </div>
  );
}
