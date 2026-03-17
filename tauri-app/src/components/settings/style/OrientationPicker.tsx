import { Collapsible } from "@/components/ui/Collapsible";
import { StyleCard } from "@/components/ui/StyleCard";
import { useSettingsStore } from "@/stores/settings-store";

export function OrientationPicker() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  return (
    <div className="rounded-xl bg-[var(--bg-raised)] p-4">
      <Collapsible title="Orientation">
        <div className="flex gap-3">
          <StyleCard
            selected={settings.isHorizontal}
            onClick={() => updateSettings({ isHorizontal: true })}
            label="Horizontal"
          >
            <div className="flex items-center justify-center w-full h-full">
              <div className="w-3/4 h-2 rounded-full bg-[var(--brand)] opacity-60" />
            </div>
          </StyleCard>
          <StyleCard
            selected={!settings.isHorizontal}
            onClick={() => updateSettings({ isHorizontal: false })}
            label="Vertical"
          >
            <div className="flex items-center justify-center w-full h-full">
              <div className="w-2 h-3/4 rounded-full bg-[var(--brand)] opacity-60" />
            </div>
          </StyleCard>
        </div>
      </Collapsible>
    </div>
  );
}
