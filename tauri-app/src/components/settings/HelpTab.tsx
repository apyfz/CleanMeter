import { Collapsible } from "@/components/ui/Collapsible";
import { Switch } from "@/components/ui/Switch";
import { useSettingsStore } from "@/stores/settings-store";

export function HelpTab() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {/* How to Setup */}
      <div className="rounded-xl bg-[var(--bg-raised)] p-4">
        <Collapsible title="How to Setup" defaultOpen={false}>
          <ol className="flex flex-col gap-2 text-sm text-[var(--text-paragraph)] list-decimal pl-5">
            <li>Launch CleanMeter — it will ask for administrator access on first run</li>
            <li>Configure which sensors to display in the Stats tab</li>
            <li>Customize the overlay appearance in the Style tab</li>
          </ol>
        </Collapsible>
      </div>

      {/* Current Limitations */}
      <div className="rounded-xl bg-[var(--bg-raised)] p-4">
        <Collapsible title="Current Limitations" defaultOpen={false}>
          <ul className="flex flex-col gap-2 text-sm text-[var(--text-paragraph)] list-disc pl-5">
            <li>Does not work with exclusive fullscreen games — use borderless windowed instead</li>
            <li>Requires .NET 8.0 runtime to be installed</li>
            <li>Windows only (for now)</li>
          </ul>
        </Collapsible>
      </div>

      {/* FAQ */}
      <div className="rounded-xl bg-[var(--bg-raised)] p-4">
        <Collapsible title="Frequently Asked Questions" defaultOpen={false}>
          <div className="flex flex-col gap-4">
            <FaqItem
              q="The overlay doesn't show up"
              a="Make sure you're running the game in borderless windowed mode, not exclusive fullscreen."
            />
            <FaqItem
              q="FPS counter shows 0"
              a="Select the correct application from the PresentMon app dropdown in the Stats > FPS section."
            />
            <FaqItem
              q="Sensors show wrong values"
              a="Try selecting a different sensor from the dropdown. Some systems have multiple temperature/load sensors."
            />
          </div>
        </Collapsible>
      </div>

      {/* Hotkeys */}
      <div className="rounded-xl bg-[var(--bg-raised)] p-4">
        <Collapsible title="Hotkeys" defaultOpen={false}>
          <div className="flex flex-col gap-3">
            <HotkeyRow label="Toggle overlay" keys={["Ctrl", "F10"]} />
            <HotkeyRow label="Toggle data recording" keys={["Alt", "F11"]} />
          </div>
        </Collapsible>
      </div>

      {/* Application Logs */}
      <div className="rounded-xl bg-[var(--bg-raised)] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-[var(--text-paragraph)] uppercase">
            Application Logs
          </span>
          <Switch
            checked={settings.isLoggingEnabled}
            onChange={(v) => updateSettings({ isLoggingEnabled: v })}
          />
        </div>
        {settings.isLoggingEnabled && (
          <div className="h-32 overflow-y-auto rounded border border-[var(--border)] bg-[var(--bg-surface)] p-2 font-mono text-[10px] text-[var(--text-paragraph)]">
            <span className="text-[var(--text-disabled)]">No logs yet...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-[var(--text-heading)]">{q}</p>
      <p className="text-sm text-[var(--text-paragraph)] mt-1">{a}</p>
    </div>
  );
}

function HotkeyRow({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-heading)]">{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <span key={i}>
            {i > 0 && <span className="text-[var(--text-disabled)] mx-0.5">+</span>}
            <kbd className="inline-flex items-center h-6 px-2 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[11px] font-medium text-[var(--text-heading)]">
              {key}
            </kbd>
          </span>
        ))}
      </div>
    </div>
  );
}
