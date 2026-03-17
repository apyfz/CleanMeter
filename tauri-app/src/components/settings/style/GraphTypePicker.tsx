import { StyleCard } from "@/components/ui/StyleCard";
import { Switch } from "@/components/ui/Switch";
import { useSettingsStore } from "@/stores/settings-store";
import type { ProgressType } from "@/lib/types";

export function GraphTypePicker() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const isEnabled = settings.progressType !== "none";

  const handleToggle = (enabled: boolean) => {
    updateSettings({ progressType: enabled ? "circular" : "none" });
  };

  const setType = (type: ProgressType) => {
    updateSettings({ progressType: type });
  };

  return (
    <div className="rounded-xl bg-[var(--bg-raised)] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider text-[var(--text-paragraph)] uppercase">
          Graph
        </span>
        <Switch checked={isEnabled} onChange={handleToggle} />
      </div>
      {isEnabled && (
        <div className="flex gap-3">
          <StyleCard
            selected={settings.progressType === "circular"}
            onClick={() => setType("circular")}
            label="Ring"
          >
            <div className="flex items-center justify-center w-full h-full">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="var(--bg-sunken)" strokeWidth="3" />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="var(--brand)"
                  strokeWidth="3"
                  strokeDasharray="47 63"
                  strokeLinecap="round"
                  transform="rotate(-90 12 12)"
                  opacity="0.6"
                />
              </svg>
            </div>
          </StyleCard>
          <StyleCard
            selected={settings.progressType === "bar"}
            onClick={() => setType("bar")}
            label="Bar"
          >
            <div className="flex items-center justify-center w-full h-full">
              <div className="flex flex-col gap-0.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className="w-6 h-1 rounded-sm"
                    style={{
                      backgroundColor:
                        i < 7 ? "var(--brand)" : "var(--bg-sunken)",
                      opacity: i < 7 ? 0.6 : 1,
                    }}
                  />
                )).reverse()}
              </div>
            </div>
          </StyleCard>
        </div>
      )}
    </div>
  );
}
