import type { Boundaries } from "@/lib/types";

interface BoundaryInputProps {
  boundaries: Boundaries;
  onChange: (boundaries: Boundaries) => void;
  unit: string;
}

export function BoundaryInput({
  boundaries,
  onChange,
  unit,
}: BoundaryInputProps) {
  return (
    <div className="mt-2 ml-7">
      <div className="flex gap-4 border-l-2 border-[var(--border)] pl-4 py-2">
        <BoundaryColumn
          color="var(--color-success)"
          label="Low"
          value={boundaries.low}
          onChange={(v) => onChange({ ...boundaries, low: v })}
          unit={unit}
        />
        <BoundaryColumn
          color="var(--color-warning)"
          label="Medium"
          value={boundaries.medium}
          onChange={(v) => onChange({ ...boundaries, medium: v })}
          unit={unit}
        />
        <BoundaryColumn
          color="var(--color-danger)"
          label="High"
          value={boundaries.high}
          onChange={(v) => onChange({ ...boundaries, high: v })}
          unit={unit}
        />
      </div>
      <p className="text-[10px] text-[var(--text-paragraph)] mt-1 ml-4">
        Colors are visible only when the graph is enabled in the style settings
      </p>
    </div>
  );
}

function BoundaryColumn({
  color,
  label,
  value,
  onChange,
  unit,
}: {
  color: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit: string;
}) {
  return (
    <div className="flex flex-col gap-1 flex-1">
      <div className="flex items-center gap-1.5">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-[10px] font-medium text-[var(--text-paragraph)]">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="w-full h-7 px-2 text-xs rounded border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-heading)] outline-none focus:border-[var(--brand)]"
        />
        <span className="text-[10px] text-[var(--text-disabled)]">{unit}</span>
      </div>
    </div>
  );
}
