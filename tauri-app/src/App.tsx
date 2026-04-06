import { useEffect, useState } from "react";
import { tokens } from "@fluentui/react-components";
import { TopBar } from "@/components/settings/TopBar";
import { TabNav, type SettingsTab } from "@/components/settings/TabNav";
import { StatsTab } from "@/components/settings/stats/StatsTab";
import { StyleTab } from "@/components/settings/style/StyleTab";
import { AppSettingsTab } from "@/components/settings/AppSettingsTab";
import { HelpTab } from "@/components/settings/HelpTab";
import { useSensorData } from "@/hooks/useSensorData";
import { useHotkey } from "@/hooks/useHotkey";
import { useSettingsStore } from "@/stores/settings-store";
import { checkDotnetRuntime } from "@/lib/tauri";

function MonitoringBanner() {
  const sensorData = useSettingsStore((s) => s.sensorData);
  const pipeStatus = useSettingsStore((s) => s.pipeStatus);
  const [showBanner, setShowBanner] = useState(false);
  const [dotnetMissing, setDotnetMissing] = useState(false);

  useEffect(() => {
    // Wait 8 seconds after mount — if still no data, show the banner
    const timer = setTimeout(() => {
      if (!useSettingsStore.getState().sensorData) {
        setShowBanner(true);
        checkDotnetRuntime().then((ok) => {
          if (!ok) setDotnetMissing(true);
        }).catch(() => {});
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Hide banner once data starts flowing
  useEffect(() => {
    if (sensorData) setShowBanner(false);
  }, [sensorData]);

  if (!showBanner) return null;

  return (
    <div
      style={{
        background: "#fef3cd",
        color: "#856404",
        padding: "10px 16px",
        fontSize: 13,
        lineHeight: 1.5,
        borderBottom: "1px solid #ffc107",
      }}
    >
      <strong>Monitoring not connected.</strong>
      {dotnetMissing ? (
        <span>
          {" "}.NET 8 Desktop Runtime is required but not installed.{" "}
          <a
            href="https://dotnet.microsoft.com/en-us/download/dotnet/8.0"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#0d6efd", textDecoration: "underline" }}
          >
            Download it here
          </a>
          , install it, then restart CleanMeter.
        </span>
      ) : (
        <span>
          {" "}HardwareMonitor is not responding. Try restarting the app.
          {!pipeStatus.connected && " (Pipe not connected)"}
        </span>
      )}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("stats");
  const settings = useSettingsStore((s) => s.settings);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loadPreferences = useSettingsStore((s) => s.loadPreferences);
  const loadAppVersion = useSettingsStore((s) => s.loadAppVersion);

  useSensorData();
  useHotkey();

  useEffect(() => {
    loadSettings();
    loadPreferences();
    loadAppVersion();
  }, [loadSettings, loadPreferences, loadAppVersion]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      settings.isDarkTheme ? "dark" : "light"
    );
  }, [settings.isDarkTheme]);

  return (
    <div
      className="flex flex-col h-screen w-screen"
      style={{ background: tokens.colorNeutralBackground3 }}
    >
      <TopBar />
      <MonitoringBanner />
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
