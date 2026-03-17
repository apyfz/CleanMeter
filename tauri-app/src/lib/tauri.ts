import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  OverlaySettings,
  HardwareMonitorData,
  PipeStatus,
  MonitorInfo,
  AppPreferences,
} from "./types";

// ─── Settings Commands ──────────────────────────────────────────

export const getSettings = () => invoke<OverlaySettings>("get_settings");
export const saveSettings = (settings: OverlaySettings) =>
  invoke("save_settings", { settings });
export const clearSettings = () => invoke("clear_settings");
export const getPreferences = () => invoke<AppPreferences>("get_preferences");
export const savePreferences = (prefs: AppPreferences) =>
  invoke("save_preferences", { prefs });

// ─── Overlay Commands ───────────────────────────────────────────

export const setOverlayVisible = (visible: boolean) =>
  invoke("set_overlay_visible", { visible });
export const setOverlayPosition = (x: number, y: number) =>
  invoke("set_overlay_position", { x, y });
export const setOverlaySize = (width: number, height: number) =>
  invoke("set_overlay_size", { width, height });
export const setOverlayClickThrough = (enabled: boolean) =>
  invoke("set_overlay_click_through", { enabled });
export const setOverlayOpacity = (opacity: number) =>
  invoke("set_overlay_opacity", { opacity });

// ─── Pipe Commands ──────────────────────────────────────────────

export const selectPresentMonApp = (appName: string) =>
  invoke("select_present_mon_app", { appName });
export const refreshPresentMonApps = () =>
  invoke("refresh_present_mon_apps");
export const setPollingRate = (intervalMs: number) =>
  invoke("set_polling_rate", { intervalMs });

// ─── System Commands ────────────────────────────────────────────

export const checkDotnetRuntime = () => invoke<boolean>("check_dotnet_runtime");
export const getMonitors = () => invoke<MonitorInfo[]>("get_monitors");
export const getAppVersion = () => invoke<string>("get_app_version");
export const grantAdminConsent = () => invoke("grant_admin_consent");

// ─── Event Listeners ────────────────────────────────────────────

export const onSensorData = (
  callback: (data: HardwareMonitorData) => void
): Promise<UnlistenFn> =>
  listen<HardwareMonitorData>("sensor-data", (event) =>
    callback(event.payload)
  );

export const onPresentMonApps = (
  callback: (apps: string[]) => void
): Promise<UnlistenFn> =>
  listen<string[]>("present-mon-apps", (event) => callback(event.payload));

export const onPipeStatus = (
  callback: (status: PipeStatus) => void
): Promise<UnlistenFn> =>
  listen<PipeStatus>("pipe-status", (event) => callback(event.payload));

export const onSettingsChanged = (
  callback: (settings: OverlaySettings) => void
): Promise<UnlistenFn> =>
  listen<OverlaySettings>("settings-changed", (event) =>
    callback(event.payload)
  );

export const onHotkey = (
  callback: (action: string) => void
): Promise<UnlistenFn> =>
  listen<string>("hotkey", (event) => callback(event.payload));

export const onSetOpacity = (
  callback: (opacity: number) => void
): Promise<UnlistenFn> =>
  listen<number>("set-opacity", (event) => callback(event.payload));
