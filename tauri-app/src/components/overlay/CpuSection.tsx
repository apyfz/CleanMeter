import { Pill } from "./Pill";
import { ProgressRing } from "./ProgressRing";
import { ProgressBar } from "./ProgressBar";
import { useSettingsStore } from "@/stores/settings-store";
import { findSensorById, formatValue } from "@/lib/utils";

interface CpuSectionProps {
  isHorizontal: boolean;
}

export function CpuSection({ isHorizontal }: CpuSectionProps) {
  const settings = useSettingsStore((s) => s.settings);
  const sensorData = useSettingsStore((s) => s.sensorData);
  const sensors = sensorData?.sensors ?? [];

  const { cpuTemp, cpuUsage, cpuConsumption } = settings.sensors;
  const progressType = settings.progressType;

  const anyEnabled =
    cpuTemp.isEnabled || cpuUsage.isEnabled || cpuConsumption.isEnabled;

  if (!anyEnabled) return null;

  const Progress = progressType === "bar" ? ProgressBar : ProgressRing;
  const showProgress = progressType !== "none";

  const cpuTempVal = findSensorById(sensors, cpuTemp.customReadingId)?.value ?? 0;
  const cpuUsageVal = findSensorById(sensors, cpuUsage.customReadingId)?.value ?? 0;
  const cpuPowerVal = findSensorById(sensors, cpuConsumption.customReadingId)?.value ?? 0;

  return (
    <Pill title="CPU" isHorizontal={isHorizontal}>
      {cpuTemp.isEnabled && showProgress && (
        <Progress
          value={cpuTempVal}
          max={100}
          label={formatValue(cpuTempVal)}
          unit="°C"
          boundaries={cpuTemp.boundaries}
        />
      )}
      {cpuUsage.isEnabled && showProgress && (
        <Progress
          value={cpuUsageVal}
          max={100}
          label={formatValue(cpuUsageVal)}
          unit="%"
          boundaries={cpuUsage.boundaries}
        />
      )}
      {cpuConsumption.isEnabled && (
        <div className="flex items-baseline gap-0.5">
          <span className="text-xs font-medium text-white tabular-nums">
            {formatValue(cpuPowerVal)}
          </span>
          <span className="text-[9px] text-white/50">W</span>
        </div>
      )}
    </Pill>
  );
}
