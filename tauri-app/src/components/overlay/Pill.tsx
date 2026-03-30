import { useSettingsStore } from "@/stores/settings-store";

interface PillProps {
  title: string;
  isHorizontal: boolean;
  children: React.ReactNode;
}

export function Pill({ title, isHorizontal, children }: PillProps) {
  const pillOpacity = useSettingsStore((s) => s.settings.pillOpacity ?? 0.3);
  const labelSize = useSettingsStore((s) => s.settings.fontSizeLabel ?? 12);

  if (isHorizontal) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: `rgba(0,0,0,${pillOpacity})`,
          borderRadius: 9999,
          padding: "4px 12px",
          minHeight: 32,
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: labelSize, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>
          {title}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>{children}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        background: `rgba(0,0,0,${pillOpacity})`,
        borderRadius: 8,
        padding: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: labelSize, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>
          {title}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
