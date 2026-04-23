import { useEffect, useRef, useState } from "react";
import { OverlayHud } from "@/components/overlay/OverlayHud";
import { useSensorData } from "@/hooks/useSensorData";
import { useSettingsStore } from "@/stores/settings-store";
import {
  onSettingsChanged,
  onHotkey,
  onSetOpacity,
  getMonitors,
  setOverlayPosition,
  setOverlaySize,
} from "@/lib/tauri";
import type { MonitorInfo } from "@/lib/types";

const EDGE_PADDING = 8;
const DRAG_END_DEBOUNCE_MS = 200;

// 0=TL, 1=TC, 2=TR, 3=BL, 4=BC, 5=BR — in physical pixels.
function computePresetPosition(
  idx: number,
  monitor: MonitorInfo,
  hudW: number,
  hudH: number,
): { x: number; y: number } {
  const pad = EDGE_PADDING;
  const isBottom = idx >= 3;
  const col = idx % 3;
  const y = isBottom
    ? monitor.y + monitor.height - hudH - pad
    : monitor.y + pad;
  let x: number;
  if (col === 0) x = monitor.x + pad;
  else if (col === 1) x = monitor.x + Math.floor((monitor.width - hudW) / 2);
  else x = monitor.x + monitor.width - hudW - pad;
  return { x, y };
}

export default function OverlayApp() {
  const toggleOverlay = useSettingsStore((s) => s.toggleOverlay);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const settings = useSettingsStore((s) => s.settings);

  useSensorData();

  const hudRef = useRef<HTMLDivElement>(null);
  const hudSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dragActive = useRef(false);
  const [monitors, setMonitors] = useState<MonitorInfo[]>([]);

  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    loadSettings();
    getMonitors().then((m) => m && setMonitors(m));
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
        if (action === "toggle-overlay") toggleOverlay();
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

  // Keep the OS window sized to the HUD and positioned per settings. The window
  // stays as small as the HUD, so `set_ignore_cursor_events(false)` only affects
  // HUD pixels — never freezes the rest of the desktop.
  useEffect(() => {
    const el = hudRef.current;
    if (!el || monitors.length === 0) return;
    const monitor = monitors[settings.selectedDisplayIndex] ?? monitors[0];

    const apply = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const scale = window.devicePixelRatio || 1;
      const hudW = Math.max(1, Math.ceil(rect.width * scale));
      const hudH = Math.max(1, Math.ceil(rect.height * scale));
      hudSizeRef.current = { w: hudW, h: hudH };
      setOverlaySize(hudW, hudH);

      // Skip position updates while the user is actively dragging — the OS
      // owns the window position during that handoff.
      if (dragActive.current) return;

      let x: number;
      let y: number;
      if (settings.useCustomPosition) {
        x = monitor.x + Math.round(settings.positionX);
        y = monitor.y + Math.round(settings.positionY);
      } else {
        const p = computePresetPosition(settings.positionIndex, monitor, hudW, hudH);
        x = p.x;
        y = p.y;
      }
      setOverlayPosition(x, y);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [settings, monitors]);

  const onMouseDown = async (e: React.MouseEvent) => {
    if (!settings.useCustomPosition || settings.isPositionLocked) return;
    if (e.button !== 0) return;
    e.preventDefault();
    dragActive.current = true;
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    try {
      await getCurrentWindow().startDragging();
    } catch {
      dragActive.current = false;
    }
  };

  // startDragging hands mouse control to the OS, so the webview never sees
  // mouseup. Use Tauri's onMoved + a debounce as the "drag settled" signal:
  // persist the new position once no move events have fired for a short window.
  useEffect(() => {
    if (monitors.length === 0) return;
    let unlisten: (() => void) | undefined;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    (async () => {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      unlisten = await win.onMoved(() => {
        if (!dragActive.current) return;
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(async () => {
          dragActive.current = false;
          try {
            const pos = await win.outerPosition();
            const { w: hudW, h: hudH } = hudSizeRef.current;
            const cx = pos.x + hudW / 2;
            const cy = pos.y + hudH / 2;
            let idx = settings.selectedDisplayIndex;
            for (let i = 0; i < monitors.length; i++) {
              const m = monitors[i];
              if (cx >= m.x && cx < m.x + m.width && cy >= m.y && cy < m.y + m.height) {
                idx = i;
                break;
              }
            }
            const m = monitors[idx] ?? monitors[0];
            updateSettings({
              selectedDisplayIndex: idx,
              positionX: Math.round(pos.x - m.x),
              positionY: Math.round(pos.y - m.y),
            });
          } catch {
            /* noop */
          }
        }, DRAG_END_DEBOUNCE_MS);
      });
    })();
    return () => {
      if (unlisten) unlisten();
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [monitors, updateSettings, settings.selectedDisplayIndex]);

  const draggable = settings.useCustomPosition && !settings.isPositionLocked;
  const rootStyle: React.CSSProperties = {
    cursor: draggable ? "grab" : "default",
    userSelect: "none",
    background: "transparent",
    display: "inline-block",
  };

  return (
    <div ref={hudRef} style={rootStyle} onMouseDown={onMouseDown}>
      <OverlayHud />
    </div>
  );
}
