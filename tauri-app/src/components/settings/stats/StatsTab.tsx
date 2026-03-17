import { useSettingsStore } from "@/stores/settings-store";
import { FpsSection } from "./FpsSection";
import { GpuSection } from "./GpuSection";
import { CpuSection } from "./CpuSection";
import { RamSection } from "./RamSection";
import { NetworkSection } from "./NetworkSection";

export function StatsTab() {
  const sensorData = useSettingsStore((s) => s.sensorData);
  const sensors = sensorData?.sensors ?? [];
  const hardwares = sensorData?.hardwares ?? [];

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {/* Hotkey info */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-raised)] border border-[var(--border)]">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="var(--icon-subtle)" strokeWidth="1.2" />
          <path d="M7 4V7.5" stroke="var(--icon-subtle)" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="7" cy="9.5" r="0.6" fill="var(--icon-subtle)" />
        </svg>
        <span className="text-xs text-[var(--text-paragraph)]">
          Press <Kbd>Ctrl</Kbd> + <Kbd>F10</Kbd> to toggle the overlay
        </span>
      </div>

      <FpsSection />
      <GpuSection sensors={sensors} hardwares={hardwares} />
      <CpuSection sensors={sensors} hardwares={hardwares} />
      <RamSection />
      <NetworkSection sensors={sensors} hardwares={hardwares} />
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center h-5 px-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[10px] font-medium text-[var(--text-heading)]">
      {children}
    </kbd>
  );
}
