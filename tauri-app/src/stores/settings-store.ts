import { create } from "zustand";
import type {
  OverlaySettings,
  HardwareMonitorData,
  PipeStatus,
  SensorKey,
  SensorConfig,
  GraphSensorConfig,
  Boundaries,
  AppPreferences,
} from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import * as tauri from "@/lib/tauri";

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedSave(settings: OverlaySettings) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => tauri.saveSettings(settings), 300);
}

interface SettingsStore {
  // State
  settings: OverlaySettings;
  preferences: AppPreferences;
  sensorData: HardwareMonitorData | null;
  presentMonApps: string[];
  pipeStatus: PipeStatus;
  overlayVisible: boolean;
  appVersion: string;

  // Settings actions
  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<OverlaySettings>) => void;
  updateSensor: (key: SensorKey, patch: Partial<SensorConfig>) => void;
  updateGraphSensor: (
    key: SensorKey,
    patch: Partial<GraphSensorConfig>
  ) => void;
  updateBoundary: (key: SensorKey, boundaries: Boundaries) => void;
  clearSettings: () => Promise<void>;

  // Preferences
  loadPreferences: () => Promise<void>;
  updatePreferences: (patch: Partial<AppPreferences>) => void;

  // Sensor data
  setSensorData: (data: HardwareMonitorData) => void;
  setPresentMonApps: (apps: string[]) => void;
  setPipeStatus: (status: PipeStatus) => void;

  // Overlay
  toggleOverlay: () => void;
  setOverlayVisible: (visible: boolean) => void;

  // System
  loadAppVersion: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  preferences: { adminConsent: false, startMinimized: false },
  sensorData: null,
  presentMonApps: [],
  pipeStatus: { connected: false },
  overlayVisible: false,
  appVersion: "2.0.0",

  loadSettings: async () => {
    try {
      const settings = await tauri.getSettings();
      set({ settings });
    } catch {
      // Use defaults
    }
  },

  updateSettings: (patch) => {
    const newSettings = { ...get().settings, ...patch };
    set({ settings: newSettings });
    debouncedSave(newSettings);

    // Handle side effects
    if (patch.isHorizontal !== undefined) {
      const width = patch.isHorizontal ? 1280 : 350;
      const height = patch.isHorizontal ? 80 : 1280;
      tauri.setOverlaySize(width, height);
    }
    if (patch.isPositionLocked !== undefined) {
      tauri.setOverlayClickThrough(patch.isPositionLocked);
    }
    if (patch.opacity !== undefined) {
      tauri.setOverlayOpacity(patch.opacity);
    }
    if (patch.pollingRate !== undefined) {
      tauri.setPollingRate(patch.pollingRate);
    }
  },

  updateSensor: (key, patch) => {
    const settings = get().settings;
    const current = settings.sensors[key];
    const updated = { ...current, ...patch };
    const newSensors = { ...settings.sensors, [key]: updated };
    const newSettings = { ...settings, sensors: newSensors };
    set({ settings: newSettings });
    debouncedSave(newSettings);
  },

  updateGraphSensor: (key, patch) => {
    const settings = get().settings;
    const current = settings.sensors[key] as GraphSensorConfig;
    const updated = { ...current, ...patch };
    const newSensors = { ...settings.sensors, [key]: updated };
    const newSettings = { ...settings, sensors: newSensors };
    set({ settings: newSettings });
    debouncedSave(newSettings);
  },

  updateBoundary: (key, boundaries) => {
    const settings = get().settings;
    const current = settings.sensors[key] as GraphSensorConfig;
    const updated = { ...current, boundaries };
    const newSensors = { ...settings.sensors, [key]: updated };
    const newSettings = { ...settings, sensors: newSensors };
    set({ settings: newSettings });
    debouncedSave(newSettings);
  },

  clearSettings: async () => {
    await tauri.clearSettings();
    set({ settings: DEFAULT_SETTINGS });
  },

  loadPreferences: async () => {
    try {
      const preferences = await tauri.getPreferences();
      set({ preferences });
    } catch {
      // Use defaults
    }
  },

  updatePreferences: (patch) => {
    const newPrefs = { ...get().preferences, ...patch };
    set({ preferences: newPrefs });
    tauri.savePreferences(newPrefs);
  },

  setSensorData: (data) => set({ sensorData: data }),
  setPresentMonApps: (apps) => set({ presentMonApps: apps }),
  setPipeStatus: (status) => set({ pipeStatus: status }),

  toggleOverlay: () => {
    const visible = !get().overlayVisible;
    set({ overlayVisible: visible });
    tauri.setOverlayVisible(visible);
  },

  setOverlayVisible: (visible) => {
    set({ overlayVisible: visible });
    tauri.setOverlayVisible(visible);
  },

  loadAppVersion: async () => {
    try {
      const version = await tauri.getAppVersion();
      set({ appVersion: version });
    } catch {
      // Keep default
    }
  },
}));
