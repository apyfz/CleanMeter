import { Checkbox } from "@/components/ui/Checkbox";
import { SensorSection } from "@/components/ui/SensorSection";
import { SensorDropdown } from "./SensorDropdown";
import { useSettingsStore } from "@/stores/settings-store";
import { SensorType } from "@/lib/types";
import type { Hardware, Sensor } from "@/lib/types";

interface NetworkSectionProps {
  sensors: Sensor[];
  hardwares: Hardware[];
}

export function NetworkSection({ sensors, hardwares }: NetworkSectionProps) {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const updateSensor = useSettingsStore((s) => s.updateSensor);
  const { downRate, upRate } = settings.sensors;

  const anyEnabled = downRate.isEnabled || upRate.isEnabled || settings.netGraph;

  return (
    <SensorSection
      title="NETWORK"
      enabled={anyEnabled}
      onToggle={(enabled) => {
        updateSensor("downRate", { isEnabled: enabled });
        updateSensor("upRate", { isEnabled: enabled });
        updateSettings({ netGraph: enabled });
      }}
    >
      <Checkbox
        label="Download Rate"
        checked={downRate.isEnabled}
        onChange={(v) => updateSensor("downRate", { isEnabled: v })}
      />
      {downRate.isEnabled && (
        <SensorDropdown
          sensorType={SensorType.Throughput}
          sensors={sensors}
          hardwares={hardwares}
          value={downRate.customReadingId}
          onChange={(v) => updateSensor("downRate", { customReadingId: v })}
        />
      )}

      <Checkbox
        label="Upload Rate"
        checked={upRate.isEnabled}
        onChange={(v) => updateSensor("upRate", { isEnabled: v })}
      />
      {upRate.isEnabled && (
        <SensorDropdown
          sensorType={SensorType.Throughput}
          sensors={sensors}
          hardwares={hardwares}
          value={upRate.customReadingId}
          onChange={(v) => updateSensor("upRate", { customReadingId: v })}
        />
      )}

      <Checkbox
        label="Net Graph"
        checked={settings.netGraph}
        onChange={(v) => updateSettings({ netGraph: v })}
      />
    </SensorSection>
  );
}
