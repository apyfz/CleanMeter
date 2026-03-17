import { getCurrentWindow } from "@tauri-apps/api/window";

export function TopBar() {
  const appWindow = getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between h-[57px] px-4 border-b-2 border-[var(--border)]"
    >
      <div className="flex items-center gap-2" data-tauri-drag-region>
        {/* Logo */}
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
          <rect width="25" height="25" rx="6" fill="var(--brand)" />
          <text
            x="12.5"
            y="17"
            textAnchor="middle"
            fill="var(--text-inverse)"
            fontSize="14"
            fontWeight="600"
            fontFamily="Inter, sans-serif"
          >
            C
          </text>
        </svg>
        <span className="text-base font-medium text-[var(--text-heading)]">
          CleanMeter
        </span>
      </div>
      <div className="flex items-center gap-1">
        {/* Minimize */}
        <button
          onClick={() => appWindow.minimize()}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
          title="Minimize"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7H12"
              stroke="var(--icon-subtle)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {/* Close (minimize to tray) */}
        <button
          onClick={() => appWindow.hide()}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
          title="Closing will minimize to the Tray"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 2L12 12M12 2L2 12"
              stroke="var(--icon-subtle)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
