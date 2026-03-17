import { Collapsible } from "@/components/ui/Collapsible";
import { StyleCard } from "@/components/ui/StyleCard";
import { Checkbox } from "@/components/ui/Checkbox";
import { useSettingsStore } from "@/stores/settings-store";

const positions = [
  { index: 0, label: "Top Left", align: "items-start justify-start" },
  { index: 1, label: "Top Center", align: "items-start justify-center" },
  { index: 2, label: "Top Right", align: "items-start justify-end" },
  { index: 3, label: "Bottom Left", align: "items-end justify-start" },
  { index: 4, label: "Bottom Center", align: "items-end justify-center" },
  { index: 5, label: "Bottom Right", align: "items-end justify-end" },
];

export function PositionGrid() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  return (
    <div className="rounded-xl bg-[var(--bg-raised)] p-4">
      <Collapsible title="Position">
        <div className="grid grid-cols-3 gap-3 mb-3">
          {positions.map((pos) => (
            <StyleCard
              key={pos.index}
              selected={settings.positionIndex === pos.index}
              onClick={() => updateSettings({ positionIndex: pos.index })}
              label={pos.label}
            >
              <div className={`w-full h-full flex p-2 ${pos.align}`}>
                <div className="w-6 h-1.5 rounded-full bg-[var(--brand)] opacity-60" />
              </div>
            </StyleCard>
          ))}
        </div>

        {/* Custom position */}
        <div className="flex flex-col gap-2 mt-3">
          <Checkbox
            label="Lock position"
            checked={settings.isPositionLocked}
            onChange={(v) => updateSettings({ isPositionLocked: v })}
          />
          {!settings.isPositionLocked && (
            <div className="flex gap-3 ml-7">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs text-[var(--text-paragraph)]">X</label>
                <input
                  type="number"
                  value={settings.positionX}
                  onChange={(e) =>
                    updateSettings({ positionX: parseInt(e.target.value) || 0, positionIndex: 6 })
                  }
                  className="w-full h-8 px-2 text-sm rounded border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-heading)] outline-none"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs text-[var(--text-paragraph)]">Y</label>
                <input
                  type="number"
                  value={settings.positionY}
                  onChange={(e) =>
                    updateSettings({ positionY: parseInt(e.target.value) || 0, positionIndex: 6 })
                  }
                  className="w-full h-8 px-2 text-sm rounded border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-heading)] outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </Collapsible>
    </div>
  );
}
