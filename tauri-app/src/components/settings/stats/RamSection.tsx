import { Checkbox } from "@/components/ui/Checkbox";
import { SensorSection } from "@/components/ui/SensorSection";
import { useSettingsStore } from "@/stores/settings-store";

export function RamSection() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSensor = useSettingsStore((s) => s.updateSensor);
  const { ramUsage } = settings.sensors;

  return (
    <SensorSection
      title="RAM"
      enabled={ramUsage.isEnabled}
      onToggle={(enabled) => updateSensor("ramUsage", { isEnabled: enabled })}
    >
      <Checkbox
        label="RAM Usage"
        checked={ramUsage.isEnabled}
        onChange={(v) => updateSensor("ramUsage", { isEnabled: v })}
      />
    </SensorSection>
  );
}
