import { useEffect, useState } from "react";
import { TopBar } from "@/components/settings/TopBar";
import { TabNav, type SettingsTab } from "@/components/settings/TabNav";
import { AdminConsent } from "@/components/settings/AdminConsent";
import { StatsTab } from "@/components/settings/stats/StatsTab";
import { StyleTab } from "@/components/settings/style/StyleTab";
import { AppSettingsTab } from "@/components/settings/AppSettingsTab";
import { HelpTab } from "@/components/settings/HelpTab";
import { useSensorData } from "@/hooks/useSensorData";
import { useHotkey } from "@/hooks/useHotkey";
import { useSettingsStore } from "@/stores/settings-store";

export default function App() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("stats");
  const settings = useSettingsStore((s) => s.settings);
  const preferences = useSettingsStore((s) => s.preferences);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loadPreferences = useSettingsStore((s) => s.loadPreferences);
  const loadAppVersion = useSettingsStore((s) => s.loadAppVersion);

  // Subscribe to sensor data events
  useSensorData();
  useHotkey();

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadPreferences();
    loadAppVersion();
  }, [loadSettings, loadPreferences, loadAppVersion]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      settings.isDarkTheme ? "dark" : "light"
    );
  }, [settings.isDarkTheme]);

  // Show admin consent if not yet granted
  if (!preferences.adminConsent) {
    return (
      <div
        className="h-screen w-screen bg-[var(--bg-surface)]"
        data-theme={settings.isDarkTheme ? "dark" : "light"}
      >
        <AdminConsent />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[var(--bg-surface)]">
      <TopBar />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 min-h-0">
        {activeTab === "stats" && <StatsTab />}
        {activeTab === "style" && <StyleTab />}
        {activeTab === "settings" && <AppSettingsTab />}
        {activeTab === "help" && <HelpTab />}
      </div>
    </div>
  );
}
