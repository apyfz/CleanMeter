import { Pill } from "./Pill";
import { FrametimeGraph } from "./FrametimeGraph";
import { useSettingsStore } from "@/stores/settings-store";
import { useFrametimeHistory } from "@/hooks/useSensorData";
import { findSensorById } from "@/lib/utils";
import { formatValue } from "@/lib/utils";

interface FpsSectionProps {
  isHorizontal: boolean;
}

export function FpsSection({ isHorizontal }: FpsSectionProps) {
  const settings = useSettingsStore((s) => s.settings);
  const sensorData = useSettingsStore((s) => s.sensorData);
  const frametimeHistory = useFrametimeHistory();
  const sensors = sensorData?.sensors ?? [];

  const valueFontSize = settings.fontSizeValue ?? 24;
  const labelFontSize = settings.fontSizeLabel ?? 12;
  const { framerate, frametime } = settings.sensors;
  if (!framerate.isEnabled && !frametime.isEnabled) return null;

  // Find FPS sensor
  const fpsSensor = framerate.customReadingId
    ? findSensorById(sensors, framerate.customReadingId)
    : sensors.find(
        (s) => s.name.toLowerCase().includes("fps") || s.name.toLowerCase().includes("framerate")
      );

  // Clamp FPS to a sane range — PresentMon can spike on single-frame anomalies
  const rawFps = fpsSensor?.value ?? 0;
  const fpsValue = rawFps > 500 ? 0 : rawFps;
  const lastFrametime = frametimeHistory.length > 0 ? frametimeHistory[frametimeHistory.length - 1] : 0;

  return (
    <Pill title="FPS" isHorizontal={isHorizontal}>
      {framerate.isEnabled && (
        <span style={{ fontSize: valueFontSize, fontWeight: 400, color: "#fff", fontFamily: "Inter" }} className="tabular-nums">
          {formatValue(fpsValue)}
        </span>
      )}
      {frametime.isEnabled && frametimeHistory.length > 2 && (
        <>
          <FrametimeGraph
            history={frametimeHistory}
            width={isHorizontal ? 60 : 80}
            height={isHorizontal ? 20 : 24}
          />
          <span className="tabular-nums" style={{ fontSize: valueFontSize, fontWeight: 400, color: "#fff", fontFamily: "Inter" }}>
            {formatValue(lastFrametime, 1)}
          </span>
          <span style={{ fontSize: labelFontSize, fontWeight: 400, color: "rgba(255,255,255,0.7)" }}>ms</span>
        </>
      )}
    </Pill>
  );
}
