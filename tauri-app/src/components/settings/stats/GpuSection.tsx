import { Checkbox } from "@/components/ui/Checkbox";
import { SensorSection } from "@/components/ui/SensorSection";
import { BoundaryInput } from "@/components/ui/BoundaryInput";
import { SensorDropdown } from "./SensorDropdown";
import { useSettingsStore } from "@/stores/settings-store";
import { SensorType } from "@/lib/types";
import type { Hardware, Sensor } from "@/lib/types";

interface GpuSectionProps {
  sensors: Sensor[];
  hardwares: Hardware[];
}

export function GpuSection({ sensors, hardwares }: GpuSectionProps) {
  const settings = useSettingsStore((s) => s.settings);
  const updateSensor = useSettingsStore((s) => s.updateSensor);
  const updateGraphSensor = useSettingsStore((s) => s.updateGraphSensor);
  const updateBoundary = useSettingsStore((s) => s.updateBoundary);
  const { gpuUsage, gpuTemp, vramUsage, totalVramUsed, gpuConsumption } =
    settings.sensors;

  const anyEnabled =
    gpuUsage.isEnabled ||
    gpuTemp.isEnabled ||
    vramUsage.isEnabled ||
    totalVramUsed.isEnabled ||
    gpuConsumption.isEnabled;

  return (
    <SensorSection
      title="GPU"
      enabled={anyEnabled}
      onToggle={(enabled) => {
        updateSensor("gpuUsage", { isEnabled: enabled });
        updateSensor("gpuTemp", { isEnabled: enabled });
        updateSensor("vramUsage", { isEnabled: enabled });
        updateSensor("totalVramUsed", { isEnabled: enabled });
        updateSensor("gpuConsumption", { isEnabled: enabled });
      }}
    >
      <Checkbox
        label="GPU Usage"
        checked={gpuUsage.isEnabled}
        onChange={(v) => updateSensor("gpuUsage", { isEnabled: v })}
      />
      {gpuUsage.isEnabled && (
        <>
          <SensorDropdown
            sensorType={SensorType.Load}
            sensors={sensors}
            hardwares={hardwares}
            value={gpuUsage.customReadingId}
            onChange={(v) =>
              updateGraphSensor("gpuUsage", { customReadingId: v })
            }
          />
          <BoundaryInput
            boundaries={gpuUsage.boundaries}
            onChange={(b) => updateBoundary("gpuUsage", b)}
            unit="%"
          />
        </>
      )}

      <Checkbox
        label="GPU Temp"
        checked={gpuTemp.isEnabled}
        onChange={(v) => updateSensor("gpuTemp", { isEnabled: v })}
      />
      {gpuTemp.isEnabled && (
        <>
          <SensorDropdown
            sensorType={SensorType.Temperature}
            sensors={sensors}
            hardwares={hardwares}
            value={gpuTemp.customReadingId}
            onChange={(v) =>
              updateGraphSensor("gpuTemp", { customReadingId: v })
            }
          />
          <BoundaryInput
            boundaries={gpuTemp.boundaries}
            onChange={(b) => updateBoundary("gpuTemp", b)}
            unit="°"
          />
        </>
      )}

      <Checkbox
        label="VRAM Usage"
        checked={vramUsage.isEnabled}
        onChange={(v) => updateSensor("vramUsage", { isEnabled: v })}
      />
      {vramUsage.isEnabled && (
        <>
          <SensorDropdown
            sensorType={SensorType.Load}
            sensors={sensors}
            hardwares={hardwares}
            value={vramUsage.customReadingId}
            onChange={(v) =>
              updateGraphSensor("vramUsage", { customReadingId: v })
            }
          />
          <BoundaryInput
            boundaries={vramUsage.boundaries}
            onChange={(b) => updateBoundary("vramUsage", b)}
            unit="%"
          />
        </>
      )}

      <Checkbox
        label="Total VRAM Used"
        checked={totalVramUsed.isEnabled}
        onChange={(v) => updateSensor("totalVramUsed", { isEnabled: v })}
      />

      <Checkbox
        label="GPU Power"
        checked={gpuConsumption.isEnabled}
        onChange={(v) => updateSensor("gpuConsumption", { isEnabled: v })}
      />
    </SensorSection>
  );
}
