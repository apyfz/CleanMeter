import { useSettingsStore } from "@/stores/settings-store";
import { cn } from "@/lib/utils";
import { FpsSection } from "./FpsSection";
import { GpuSection } from "./GpuSection";
import { CpuSection } from "./CpuSection";
import { RamSection } from "./RamSection";
import { NetSection } from "./NetSection";

export function OverlayHud() {
  const settings = useSettingsStore((s) => s.settings);
  const isHorizontal = settings.isHorizontal;

  return (
    <div
      className={cn(
        "flex gap-2 p-4",
        isHorizontal
          ? "flex-row items-center h-full rounded-full bg-black/36"
          : "flex-col rounded-xl bg-black/36 w-full"
      )}
      style={{ opacity: settings.opacity }}
    >
      <FpsSection isHorizontal={isHorizontal} />
      <GpuSection isHorizontal={isHorizontal} />
      <CpuSection isHorizontal={isHorizontal} />
      <RamSection isHorizontal={isHorizontal} />
      <NetSection isHorizontal={isHorizontal} />
    </div>
  );
}
