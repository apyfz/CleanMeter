import { useEffect } from "react";
import { OverlayHud } from "@/components/overlay/OverlayHud";
import { useSensorData } from "@/hooks/useSensorData";
import { useSettingsStore } from "@/stores/settings-store";
import { onSettingsChanged, onHotkey, onSetOpacity } from "@/lib/tauri";

export default function OverlayApp() {
  const overlayVisible = useSettingsStore((s) => s.overlayVisible);
  const toggleOverlay = useSettingsStore((s) => s.toggleOverlay);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useSensorData();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    let mounted = true;
    const unlisteners: Array<() => void> = [];

    const setup = async () => {
      const u1 = await onSettingsChanged((newSettings) => {
        useSettingsStore.setState({ settings: newSettings });
      });
      if (mounted) unlisteners.push(u1); else u1();

      const u2 = await onHotkey((action) => {
        if (action === "toggle-overlay") {
          toggleOverlay();
        }
      });
      if (mounted) unlisteners.push(u2); else u2();

      const u3 = await onSetOpacity((opacity) => {
        document.documentElement.style.opacity = String(opacity);
      });
      if (mounted) unlisteners.push(u3); else u3();
    };
    setup();

    return () => {
      mounted = false;
      unlisteners.forEach((u) => u());
    };
  }, [toggleOverlay]);

  if (!overlayVisible) return null;

  return (
    <div className="w-full h-full">
      <OverlayHud />
    </div>
  );
}
