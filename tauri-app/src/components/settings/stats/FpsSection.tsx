import { Checkbox } from "@/components/ui/Checkbox";
import { SensorSection } from "@/components/ui/SensorSection";
import { Select } from "@/components/ui/Select";
import { useSettingsStore } from "@/stores/settings-store";
export function FpsSection() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSensor = useSettingsStore((s) => s.updateSensor);
  const presentMonApps = useSettingsStore((s) => s.presentMonApps);
  const { framerate, frametime } = settings.sensors;

  const anyEnabled = framerate.isEnabled || frametime.isEnabled;

  return (
    <SensorSection
      title="FPS"
      enabled={anyEnabled}
      onToggle={(enabled) => {
        updateSensor("framerate", { isEnabled: enabled });
        updateSensor("frametime", { isEnabled: enabled });
      }}
    >
      <Checkbox
        label="Framerate"
        checked={framerate.isEnabled}
        onChange={(v) => updateSensor("framerate", { isEnabled: v })}
      />
      <Checkbox
        label="Frametime"
        checked={frametime.isEnabled}
        onChange={(v) => updateSensor("frametime", { isEnabled: v })}
      />
      {presentMonApps.length > 0 && (
        <div className="mt-2">
          <Select
            label="Monitored app:"
            value={framerate.customReadingId}
            onChange={(v) => updateSensor("framerate", { customReadingId: v })}
            options={presentMonApps.map((app) => ({
              value: app,
              label: app,
            }))}
            placeholder="Select app..."
          />
        </div>
      )}
    </SensorSection>
  );
}
