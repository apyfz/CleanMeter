import { useEffect, useState } from "react";
import { Select } from "@/components/ui/Select";
import { useSettingsStore } from "@/stores/settings-store";
import { getMonitors } from "@/lib/tauri";
import type { MonitorInfo } from "@/lib/types";

export function MonitorSelect() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [monitors, setMonitors] = useState<MonitorInfo[]>([]);

  useEffect(() => {
    getMonitors().then(setMonitors).catch(() => {});
  }, []);

  return (
    <div className="rounded-xl bg-[var(--bg-raised)] p-4">
      <span className="text-xs font-semibold tracking-wider text-[var(--text-paragraph)] uppercase block mb-3">
        Monitor
      </span>
      <Select
        value={String(settings.selectedDisplayIndex)}
        options={monitors.map((m, i) => ({
          value: String(i),
          label: m.name + (m.primary ? " (Primary)" : ""),
        }))}
        onChange={(v) =>
          updateSettings({ selectedDisplayIndex: parseInt(v) })
        }
        placeholder="Select monitor..."
      />
    </div>
  );
}
