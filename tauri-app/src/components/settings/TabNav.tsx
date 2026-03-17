import { cn } from "@/lib/utils";

export type SettingsTab = "stats" | "style" | "settings" | "help";

interface TabNavProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "stats",
    label: "Stats",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M4 12V7M8 12V4M12 12V9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "style",
    label: "Style",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect
          x="2"
          y="3"
          width="12"
          height="4"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <rect
          x="2"
          y="9"
          width="12"
          height="4"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M13 8C13 7.6 12.9 7.2 12.8 6.9L14 5.9L13 4.1L11.5 4.8C11 4.3 10.5 3.9 9.9 3.7L9.5 2H6.5L6.1 3.7C5.5 3.9 5 4.3 4.5 4.8L3 4.1L2 5.9L3.2 6.9C3.1 7.2 3 7.6 3 8C3 8.4 3.1 8.8 3.2 9.1L2 10.1L3 11.9L4.5 11.2C5 11.7 5.5 12.1 6.1 12.3L6.5 14H9.5L9.9 12.3C10.5 12.1 11 11.7 11.5 11.2L13 11.9L14 10.1L12.8 9.1C12.9 8.8 13 8.4 13 8Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "help",
    label: "Help",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M6 6.5C6 5.67 6.67 5 7.5 5H8.5C9.33 5 10 5.67 10 6.5C10 7.33 9.33 8 8.5 8H8V9.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
      </svg>
    ),
  },
];

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="flex gap-2 px-4 py-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex items-center gap-1.5 h-[44px] px-4 rounded-full border text-sm font-medium transition-colors",
            activeTab === tab.id
              ? "bg-[var(--brand)] text-[var(--text-inverse)] border-transparent"
              : "bg-[var(--bg-raised)] text-[var(--text-heading)] border-[var(--border)]"
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
