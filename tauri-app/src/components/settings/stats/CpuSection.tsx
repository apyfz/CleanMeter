import { Checkbox } from "@/components/ui/Checkbox";
import { SensorSection } from "@/components/ui/SensorSection";
import { BoundaryInput } from "@/components/ui/BoundaryInput";
import { SensorDropdown } from "./SensorDropdown";
import { useSettingsStore } from "@/stores/settings-store";
import { SensorType } from "@/lib/types";
import type { Hardware, Sensor } from "@/lib/types";

interface CpuSectionProps {
  sensors: Sensor[];
  hardwares: Hardware[];
}

export function CpuSection({ sensors, hardwares }: CpuSectionProps) {
  const settings = useSettingsStore((s) => s.settings);
  const updateSensor = useSettingsStore((s) => s.updateSensor);
  const updateGraphSensor = useSettingsStore((s) => s.updateGraphSensor);
  const updateBoundary = useSettingsStore((s) => s.updateBoundary);
  const { cpuUsage, cpuTemp, cpuConsumption } = settings.sensors;

  const anyEnabled =
    cpuUsage.isEnabled || cpuTemp.isEnabled || cpuConsumption.isEnabled;

  return (
    <SensorSection
      title="CPU"
      enabled={anyEnabled}
      onToggle={(enabled) => {
        updateSensor("cpuUsage", { isEnabled: enabled });
        updateSensor("cpuTemp", { isEnabled: enabled });
        updateSensor("cpuConsumption", { isEnabled: enabled });
      }}
    >
      <Checkbox
        label="CPU Usage"
        checked={cpuUsage.isEnabled}
        onChange={(v) => updateSensor("cpuUsage", { isEnabled: v })}
      />
      {cpuUsage.isEnabled && (
        <>
          <SensorDropdown
            sensorType={SensorType.Load}
            sensors={sensors}
            hardwares={hardwares}
            value={cpuUsage.customReadingId}
            onChange={(v) =>
              updateGraphSensor("cpuUsage", { customReadingId: v })
            }
          />
          <BoundaryInput
            boundaries={cpuUsage.boundaries}
            onChange={(b) => updateBoundary("cpuUsage", b)}
            unit="%"
          />
        </>
      )}

      <Checkbox
        label="CPU Temp"
        checked={cpuTemp.isEnabled}
        onChange={(v) => updateSensor("cpuTemp", { isEnabled: v })}
      />
      {cpuTemp.isEnabled && (
        <>
          <SensorDropdown
            sensorType={SensorType.Temperature}
            sensors={sensors}
            hardwares={hardwares}
            value={cpuTemp.customReadingId}
            onChange={(v) =>
              updateGraphSensor("cpuTemp", { customReadingId: v })
            }
          />
          <BoundaryInput
            boundaries={cpuTemp.boundaries}
            onChange={(b) => updateBoundary("cpuTemp", b)}
            unit="°"
          />
        </>
      )}

      <Checkbox
        label="CPU Power"
        checked={cpuConsumption.isEnabled}
        onChange={(v) => updateSensor("cpuConsumption", { isEnabled: v })}
      />
    </SensorSection>
  );
}
