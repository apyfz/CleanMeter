import { Button } from "@/components/ui/Button";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { grantAdminConsent } from "@/lib/tauri";
import { useSettingsStore } from "@/stores/settings-store";

export function AdminConsent() {
  const updatePreferences = useSettingsStore((s) => s.updatePreferences);

  const handleAllow = async () => {
    await grantAdminConsent();
    updatePreferences({ adminConsent: true });
  };

  const handleClose = () => {
    getCurrentWindow().close();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <div className="w-full max-w-[400px] flex flex-col items-center text-center gap-6">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path
              d="M20 4L4 12V20C4 29.6 11.2 38.4 20 40C28.8 38.4 36 29.6 36 20V12L20 4Z"
              stroke="var(--brand)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M14 20L18 24L26 16"
              stroke="var(--brand)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-normal text-[var(--text-heading)] mb-3">
            Administrator Access
          </h1>
          <p className="text-sm text-[var(--text-paragraph)] leading-5">
            CleanMeter needs administrator access to read hardware sensors from
            your system. This is required for monitoring CPU, GPU, RAM, and
            network statistics.
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <Button variant="outlined" onClick={handleClose} className="flex-1">
            Close app
          </Button>
          <Button variant="filled" onClick={handleAllow} className="flex-1">
            Allow
          </Button>
        </div>
      </div>
    </div>
  );
}
