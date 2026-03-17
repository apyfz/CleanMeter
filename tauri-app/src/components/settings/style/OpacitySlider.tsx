import { Collapsible } from "@/components/ui/Collapsible";
import { Slider } from "@/components/ui/Slider";
import { useSettingsStore } from "@/stores/settings-store";

export function OpacitySlider() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  return (
    <div className="rounded-xl bg-[var(--bg-raised)] p-4">
      <Collapsible title="Opacity">
        <div className="px-1">
          <Slider
            value={settings.opacity}
            min={0}
            max={1}
            step={0.1}
            onChange={(v) => updateSettings({ opacity: v })}
          />
          <div className="flex justify-between mt-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" stroke="var(--icon-subtle)" strokeWidth="1.2" />
              <path d="M8 2V4M8 12V14M2 8H4M12 8H14" stroke="var(--icon-subtle)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" stroke="var(--icon-subtle)" strokeWidth="1.2" />
              <path d="M8 1V4M8 12V15M1 8H4M12 8H15M3.5 3.5L5 5M11 11L12.5 12.5M12.5 3.5L11 5M5 11L3.5 12.5" stroke="var(--icon-subtle)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </Collapsible>
    </div>
  );
}
