import { cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export function Slider({ value, min, max, step, onChange }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const steps = Math.round((max - min) / step);

  return (
    <div className="relative w-full py-3">
      <div className="relative h-3 rounded-full bg-[var(--bg-sunken)]">
        {/* Active track */}
        <div
          className="absolute h-full rounded-full bg-[var(--brand)]"
          style={{ width: `${percentage}%` }}
        />
        {/* Tick marks */}
        {Array.from({ length: steps + 1 }, (_, i) => {
          const pos = (i / steps) * 100;
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--bg-raised)]"
              style={{ left: `${pos}%` }}
            />
          );
        })}
      </div>
      {/* Thumb via native range input */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          "absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        )}
      />
      {/* Visual thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-[var(--brand)] pointer-events-none shadow-sm"
        style={{ left: `calc(${percentage}% - 10px)` }}
      />
    </div>
  );
}
