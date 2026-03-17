import { Switch } from "./Switch";

interface SensorSectionProps {
  title: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: React.ReactNode;
}

export function SensorSection({
  title,
  enabled,
  onToggle,
  children,
}: SensorSectionProps) {
  return (
    <div className="rounded-xl bg-[var(--bg-raised)] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider text-[var(--text-paragraph)] uppercase">
          {title}
        </span>
        <Switch checked={enabled} onChange={onToggle} />
      </div>
      {enabled && <div className="flex flex-col gap-1">{children}</div>}
    </div>
  );
}
