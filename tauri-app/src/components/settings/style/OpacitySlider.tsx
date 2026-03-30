import { Caption1, tokens } from "@fluentui/react-components";
import { Collapsible } from "@/components/ui/Collapsible";
import { Slider } from "@/components/ui/Slider";
import { useSettingsStore } from "@/stores/settings-store";

export function OpacitySlider() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  return (
    <div
      style={{
        background: tokens.colorNeutralBackground1,
        borderRadius: 8,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        padding: "12px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <Collapsible title="Opacity">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <Caption1 style={{ fontWeight: 600 }}>Overall</Caption1>
              <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>
                {Math.round(settings.opacity * 100)}%
              </Caption1>
            </div>
            <Slider
              value={settings.opacity}
              min={0.1}
              max={1}
              step={0.05}
              onChange={(v) => updateSettings({ opacity: v })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <Caption1 style={{ fontWeight: 600 }}>Metric pills</Caption1>
              <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>
                {Math.round(settings.pillOpacity * 100)}%
              </Caption1>
            </div>
            <Slider
              value={settings.pillOpacity}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => updateSettings({ pillOpacity: v })}
            />
          </div>
        </div>
      </Collapsible>
      <Collapsible title="Font size">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <Caption1 style={{ fontWeight: 600 }}>Sensor values</Caption1>
              <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>
                {settings.fontSizeValue ?? 24}px
              </Caption1>
            </div>
            <Slider
              value={settings.fontSizeValue ?? 24}
              min={10}
              max={48}
              step={1}
              onChange={(v) => updateSettings({ fontSizeValue: v })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <Caption1 style={{ fontWeight: 600 }}>Sensor labels</Caption1>
              <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>
                {settings.fontSizeLabel ?? 12}px
              </Caption1>
            </div>
            <Slider
              value={settings.fontSizeLabel ?? 12}
              min={8}
              max={24}
              step={1}
              onChange={(v) => updateSettings({ fontSizeLabel: v })}
            />
          </div>
        </div>
      </Collapsible>
    </div>
  );
}
