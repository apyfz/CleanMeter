import { useEffect } from "react";
import { onHotkey } from "@/lib/tauri";
import { useSettingsStore } from "@/stores/settings-store";

export function useHotkey() {
  const toggleOverlay = useSettingsStore((s) => s.toggleOverlay);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    onHotkey((action) => {
      if (action === "toggle-overlay") {
        toggleOverlay();
      }
      // toggle-recording handled separately
    }).then((u) => {
      unlisten = u;
    });

    return () => {
      unlisten?.();
    };
  }, [toggleOverlay]);
}
