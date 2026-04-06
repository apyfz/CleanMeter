import { Button, Caption1, Link, tokens } from "@fluentui/react-components";
import { useSettingsStore } from "@/stores/settings-store";
import { isBrowser } from "@/lib/tauri";

function openUrl(url: string) {
  if (isBrowser) {
    window.open(url, "_blank");
  } else {
    import("@tauri-apps/plugin-shell").then((m) => m.open(url));
  }
}

export function Footer() {
  const appVersion = useSettingsStore((s) => s.appVersion);

  return (
    <div className="flex flex-col gap-2" style={{ marginTop: 4 }}>
      <Button
        appearance="outline"
        onClick={() => openUrl("https://github.com/apyfz/CleanMeter")}
        style={{ width: "100%" }}
      >
        GitHub
      </Button>

      <div
        className="flex items-center justify-between"
        style={{ padding: "6px 0", color: tokens.colorNeutralForeground4 }}
      >
        <Caption1>v{appVersion}</Caption1>
        <Link onClick={() => openUrl("https://instagram.com/apyfz")} style={{ fontSize: 11 }}>
          @apyfz
        </Link>
      </div>
    </div>
  );
}
