# CleanMeter Tauri Rewrite — Design Document

**Date:** 2026-02-25
**Updated:** 2026-03-18
**Status:** Complete — ready for implementation

---

## Decisions

| Decision | Choice |
|----------|--------|
| Purpose | Gaming performance overlay (same as original) |
| Frontend | Tauri 2 + React + TypeScript + Tailwind + shadcn/ui |
| Backend | Keep C# HardwareMonitor as Tauri sidecar (as-is) |
| Feature scope | 1:1 parity with current Kotlin/Compose app |

---

## Architecture Overview

Two processes:
1. **Tauri app** (Rust + React) — UI, window management, system tray, hotkeys, IPC
2. **C# sidecar** (HardwareMonitor.exe) — hardware polling, PresentMon, named pipe server

Communication: The existing named pipe (`\\.\pipe\HardwareMonitor_31337`) stays unchanged. The Rust backend connects to it instead of Kotlin, parses the binary protocol, and pushes data to the React frontend via Tauri events.

Two windows:
1. **Settings window** — standard Tauri window, React app with 4 tabs (Stats, Style, Settings, Help)
2. **Overlay window** — transparent, always-on-top, click-through Tauri window rendering the HUD

```
┌─────────────────────────────────────────────┐
│  C# Sidecar (HardwareMonitor.exe)           │
│  ├─ LibreHardwareMonitor (sensors)          │
│  ├─ PresentMon (FPS/frametime)              │
│  └─ Named Pipe Server                      │
└──────────────┬──────────────────────────────┘
               │ Binary protocol over named pipe
┌──────────────▼──────────────────────────────┐
│  Tauri Rust Backend                         │
│  ├─ Pipe client (binary parser)             │
│  ├─ Settings persistence (JSON file)        │
│  ├─ Global hotkeys (Ctrl+F10 / Alt+F11)    │
│  ├─ System tray                             │
│  ├─ Auto-updater                            │
│  ├─ Single instance guard                   │
│  └─ Window management (overlay + settings)  │
└──────────────┬──────────────────────────────┘
               │ Tauri events + commands
┌──────────────▼──────────────────────────────┐
│  React Frontend                             │
│  ├─ Settings Window (4 tabs)                │
│  └─ Overlay Window (HUD)                    │
└─────────────────────────────────────────────┘
```

---

## 1. Rust Backend Layer

### 1.1 Named Pipe Client

**Connection:** `\\.\pipe\HardwareMonitor_31337` (Windows named pipe)
**Fallback:** TCP socket to `127.0.0.1:31337` (for development)
**Byte order:** Little-endian throughout

The pipe client runs on a dedicated Tokio task. It reads packets in a loop and emits Tauri events to the frontend.

**Packet framing:**
```
[2 bytes: Command (u16 LE)]
[4 bytes: Payload size (u32 LE)]
[N bytes: Payload]
```

**Outgoing commands (client → C# sidecar):**

```rust
// RefreshPresentMonApps — no payload
fn send_refresh_apps(pipe: &mut NamedPipe) {
    write_u16(pipe, 1); // Command::RefreshPresentMonApps
}

// SelectPresentMonApp
fn send_select_app(pipe: &mut NamedPipe, app_name: &str) {
    write_u16(pipe, 2); // Command::SelectPresentMonApp
    let bytes = app_name.as_bytes();
    write_u16(pipe, bytes.len() as u16);
    pipe.write_all(bytes);
}

// SelectPollingRate
fn send_polling_rate(pipe: &mut NamedPipe, interval_ms: u16) {
    write_u16(pipe, 4); // Command::SelectPollingRate
    write_u16(pipe, interval_ms);
}
```

**Incoming data parsing (C# sidecar → client):**

```rust
// Command 0: Data packet
fn parse_data_packet(buf: &[u8]) -> HardwareMonitorData {
    let hw_count = read_u32(&buf[0..4]);
    let sensor_count = read_u32(&buf[4..8]);
    let mut offset = 8;

    let mut hardwares = Vec::with_capacity(hw_count);
    for _ in 0..hw_count {
        let name_len = read_u16(&buf[offset..]) as usize;
        let id_len = read_u16(&buf[offset+2..]) as usize;
        offset += 4;
        let name = String::from_utf8_lossy(&buf[offset..offset+name_len]);
        offset += name_len;
        let id = String::from_utf8_lossy(&buf[offset..offset+id_len]);
        offset += id_len;
        let hw_type = HardwareType::from(read_u32(&buf[offset..]));
        offset += 4;
        hardwares.push(Hardware { name, id, hw_type });
    }

    let mut sensors = Vec::with_capacity(sensor_count);
    for _ in 0..sensor_count {
        let name_len = read_u16(&buf[offset..]) as usize;
        let id_len = read_u16(&buf[offset+2..]) as usize;
        let hw_id_len = read_u16(&buf[offset+4..]) as usize;
        offset += 6;
        let name = String::from_utf8_lossy(&buf[offset..offset+name_len]);
        offset += name_len;
        let id = String::from_utf8_lossy(&buf[offset..offset+id_len]);
        offset += id_len;
        let hw_id = String::from_utf8_lossy(&buf[offset..offset+hw_id_len]);
        offset += hw_id_len;
        let sensor_type = SensorType::from(read_u32(&buf[offset..]));
        offset += 4;
        let value = read_f32(&buf[offset..]);
        offset += 4;
        sensors.push(Sensor { name, id, hw_id, sensor_type, value });
    }

    HardwareMonitorData { hardwares, sensors, last_poll: now_ms() }
}

// Command 3: PresentMonApps packet
fn parse_present_mon_apps(buf: &[u8]) -> Vec<String> {
    let count = read_u16(&buf[0..2]) as usize;
    let mut apps = Vec::with_capacity(count);
    for i in 0..count {
        let start = 2 + (i * 128);
        let raw = &buf[start..start+128];
        let name = String::from_utf8_lossy(raw).trim_end_matches('\0').to_string();
        apps.push(name);
    }
    apps
}
```

**Reconnection:** If the pipe disconnects, retry every 2 seconds with exponential backoff (max 10s). Emit a `pipe-status` event so the frontend can show connection state.

### 1.2 Tauri Event System

Events flow from Rust → React via `app_handle.emit()`:

| Event Name | Payload | Frequency |
|---|---|---|
| `sensor-data` | `{ hardwares: Hardware[], sensors: Sensor[], lastPoll: number }` | Every polling interval (33–500ms) |
| `present-mon-apps` | `string[]` | On refresh response |
| `pipe-status` | `{ connected: boolean, error?: string }` | On connect/disconnect |
| `update-status` | `UpdateState` (see §1.8) | On check/download/complete |
| `hotkey` | `"toggle-overlay"` or `"toggle-recording"` | On keypress |
| `log` | `{ level: string, message: string, timestamp: number }` | On sidecar stdout/stderr |

### 1.3 Tauri Commands

Commands flow from React → Rust via `invoke()`:

```typescript
// Settings
invoke('get_settings'): Promise<OverlaySettings>
invoke('save_settings', { settings: OverlaySettings }): Promise<void>
invoke('clear_settings'): Promise<void>

// Overlay control
invoke('set_overlay_visible', { visible: boolean }): Promise<void>
invoke('set_overlay_position', { x: number, y: number }): Promise<void>
invoke('set_overlay_click_through', { enabled: boolean }): Promise<void>
invoke('set_overlay_opacity', { opacity: number }): Promise<void>

// Sidecar
invoke('start_sidecar'): Promise<void>
invoke('stop_sidecar'): Promise<void>
invoke('check_dotnet_runtime'): Promise<boolean>

// Pipe commands
invoke('select_present_mon_app', { appName: string }): Promise<void>
invoke('refresh_present_mon_apps'): Promise<void>
invoke('set_polling_rate', { intervalMs: number }): Promise<void>

// Recording
invoke('start_recording'): Promise<void>
invoke('stop_recording'): Promise<{ filePath: string }>

// Updater
invoke('check_for_update'): Promise<UpdateState>
invoke('download_update'): Promise<void>
invoke('install_update'): Promise<void>

// System
invoke('get_monitors'): Promise<Monitor[]>
invoke('get_app_version'): Promise<string>
invoke('open_logs_directory'): Promise<void>
invoke('grant_admin_consent'): Promise<void>
```

### 1.4 Sidecar Lifecycle Management

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  App Start   │────▶│ Check .NET   │────▶│ Launch       │
│              │     │ Runtime      │     │ Sidecar      │
└─────────────┘     └──────┬───────┘     └──────┬───────┘
                           │ Missing             │ Running
                    ┌──────▼───────┐     ┌──────▼───────┐
                    │ Emit toast   │     │ Connect pipe │
                    │ ".NET needed"│     │ Start polling│
                    └──────────────┘     └──────────────┘
```

**.NET detection:** Run `dotnet --list-runtimes` and check for `Microsoft.NETCore.App 8.x`.

**Sidecar paths:**
- Dev: `HardwareMonitor/HardwareMonitor/bin/Release/net8.0/win-x64/native/HardwareMonitor.exe`
- Release: `resources/HardwareMonitor.exe` (bundled via Tauri sidecar config)

**Process management:**
- Use Tauri's `Command::new_sidecar("HardwareMonitor")` for managed lifecycle
- Capture stdout/stderr streams → emit as `log` events
- On app exit: Tauri automatically kills sidecar children (no manual cleanup needed)

**Health check:** If no data arrives for 5 seconds, attempt pipe reconnect. If 3 reconnects fail, restart the sidecar process.

### 1.5 Global Hotkeys

Use `tauri-plugin-global-shortcut`:

| Shortcut | Action |
|---|---|
| `Ctrl+F10` | Toggle overlay visibility |
| `Alt+F11` | Toggle data recording |

```rust
app.global_shortcut().on_shortcut("Ctrl+F10", |app, _| {
    app.emit("hotkey", "toggle-overlay").unwrap();
});
app.global_shortcut().on_shortcut("Alt+F11", |app, _| {
    app.emit("hotkey", "toggle-recording").unwrap();
});
```

### 1.6 System Tray

Use `tauri-plugin-tray-icon`:

```
┌─────────────────┐
│ CleanMeter       │
├─────────────────┤
│ Show Settings    │
│ Toggle Overlay   │
│ ─────────────── │
│ Quit             │
└─────────────────┘
```

- **Show Settings:** Focus/show the settings window
- **Toggle Overlay:** Same as Ctrl+F10
- **Quit:** Stop sidecar, close all windows, exit

Left-click on tray icon opens settings window. Right-click shows the menu.

### 1.7 Single Instance Enforcement

Use `tauri-plugin-single-instance`:

```rust
// tauri.conf.json
{
  "plugins": {
    "single-instance": { "enabled": true }
  }
}
```

When a second instance launches, the first instance's settings window is focused instead. Replaces the current ServerSocket hack on port 42069.

### 1.8 Auto-Updater

Use `tauri-plugin-updater` with GitHub releases as the update source.

**Update check flow:**
1. Fetch latest release from `https://github.com/Danil0v3s/CleanMeter/releases/latest`
2. Compare release tag against current app version (semver)
3. If newer, emit `update-status: Available { version }`
4. On user confirmation, download the update bundle
5. Emit progress events during download
6. On complete, prompt to restart

**Update states:**
```typescript
type UpdateState =
  | { status: 'not-available' }
  | { status: 'available', version: string }
  | { status: 'downloading', version: string, progress: number }  // 0.0–1.0
  | { status: 'ready', version: string }
  | { status: 'error', message: string }
```

**Tauri updater config (tauri.conf.json):**
```json
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://github.com/Danil0v3s/CleanMeter/releases/latest/download/latest.json"
      ],
      "dialog": false,
      "pubkey": "<signing key>"
    }
  }
}
```

### 1.9 Settings Persistence

**Format:** JSON file in Tauri's app data directory
**Path:** `{APPDATA}/com.cleanmeter.app/settings.json`

**Schema** (matches current Kotlin model 1:1):

```json
{
  "isDarkTheme": false,
  "isHorizontal": true,
  "positionIndex": 0,
  "selectedDisplayIndex": 0,
  "netGraph": false,
  "progressType": "circular",
  "positionX": 0,
  "positionY": 0,
  "isPositionLocked": true,
  "opacity": 1.0,
  "pollingRate": 500,
  "isLoggingEnabled": false,
  "sensors": {
    "framerate": { "isEnabled": true, "customReadingId": "" },
    "frametime": { "isEnabled": true, "customReadingId": "" },
    "cpuTemp": { "isEnabled": true, "customReadingId": "", "boundaries": { "low": 60, "medium": 80, "high": 90 } },
    "cpuUsage": { "isEnabled": true, "customReadingId": "", "boundaries": { "low": 60, "medium": 80, "high": 90 } },
    "cpuConsumption": { "isEnabled": true, "customReadingId": "" },
    "gpuTemp": { "isEnabled": true, "customReadingId": "", "boundaries": { "low": 60, "medium": 80, "high": 90 } },
    "gpuUsage": { "isEnabled": true, "customReadingId": "", "boundaries": { "low": 60, "medium": 80, "high": 90 } },
    "vramUsage": { "isEnabled": true, "customReadingId": "", "boundaries": { "low": 60, "medium": 80, "high": 90 } },
    "gpuConsumption": { "isEnabled": true, "customReadingId": "" },
    "totalVramUsed": { "isEnabled": true, "customReadingId": "" },
    "ramUsage": { "isEnabled": true, "customReadingId": "", "boundaries": { "low": 60, "medium": 80, "high": 90 } },
    "upRate": { "isEnabled": true, "customReadingId": "" },
    "downRate": { "isEnabled": true, "customReadingId": "" }
  }
}
```

**Additional preferences** (separate keys in same file or a `preferences.json`):
- `adminConsent: boolean` — whether the user has granted permission
- `startMinimized: boolean` — auto-minimize on launch

**Migration:** On first launch, attempt to read Java Preferences from Windows Registry (`HKCU\Software\JavaSoft\Prefs\...`) and migrate to JSON. If no registry data exists, use defaults.

### 1.10 Window Management

**Settings window (`tauri.conf.json`):**
```json
{
  "label": "settings",
  "title": "CleanMeter",
  "width": 420,
  "height": 700,
  "resizable": false,
  "decorations": false,
  "center": true,
  "visible": true
}
```

**Overlay window (`tauri.conf.json`):**
```json
{
  "label": "overlay",
  "title": "",
  "width": 1280,
  "height": 80,
  "resizable": false,
  "decorations": false,
  "transparent": true,
  "alwaysOnTop": true,
  "skipTaskbar": true,
  "visible": false,
  "focusable": false
}
```

**Overlay sizing:**
- Horizontal: 1280×80
- Vertical: 350×1280
- Resize dynamically via `window.set_size()` when orientation changes

**Overlay positioning (6 presets + custom):**

| Index | Position | Alignment |
|---|---|---|
| 0 | Top Left | `(0, 0)` |
| 1 | Top Center | `(screen_w/2 - overlay_w/2, 0)` |
| 2 | Top Right | `(screen_w - overlay_w, 0)` |
| 3 | Bottom Left | `(0, screen_h - overlay_h)` |
| 4 | Bottom Center | `(screen_w/2 - overlay_w/2, screen_h - overlay_h)` |
| 5 | Bottom Right | `(screen_w - overlay_w, screen_h - overlay_h)` |
| 6 | Custom | `(positionX, positionY)` — user-draggable |

**Click-through toggle:**
- Locked (default): `window.set_ignore_cursor_events(true)` — clicks pass through to the game
- Unlocked: `window.set_ignore_cursor_events(false)` — overlay is draggable

### 1.11 Admin Elevation / UAC

**Approach:** Set `requireAdministrator` in the Windows installer manifest. The installed exe will always request elevation via UAC at launch.

For development, use `runas` shell command if not already elevated:
```rust
fn ensure_elevated() -> bool {
    if is_elevated() { return true; }
    // Re-launch self with ShellExecuteW("runas", ...)
    Command::new("cmd")
        .args(["/c", "start", "", "/wait", &current_exe()])
        .spawn();
    std::process::exit(0);
}
```

**Elevation check:** Attempt to create a temp file in `C:\` — if access denied, not elevated.

---

## 2. React Frontend Layer

### 2.1 Project Structure

```
src/
├── main.tsx                    # Settings window entry
├── overlay.tsx                 # Overlay window entry
├── App.tsx                     # Settings window root
├── OverlayApp.tsx              # Overlay window root
├── lib/
│   ├── tauri.ts                # Typed invoke() and listen() wrappers
│   ├── types.ts                # Shared TypeScript types
│   └── utils.ts                # Formatters, unit converters
├── hooks/
│   ├── useSensorData.ts        # Subscribe to sensor-data events
│   ├── useSettings.ts          # Settings CRUD via Tauri commands
│   ├── useHotkey.ts            # Listen for hotkey events
│   └── useUpdateStatus.ts      # Listen for update events
├── stores/
│   └── settings-store.ts       # Zustand store for overlay settings
├── components/
│   ├── ui/                     # shadcn/ui primitives (Button, Switch, Slider, etc.)
│   ├── settings/
│   │   ├── TopBar.tsx
│   │   ├── TabNav.tsx
│   │   ├── AdminConsent.tsx
│   │   ├── stats/
│   │   │   ├── StatsTab.tsx
│   │   │   ├── FpsSection.tsx
│   │   │   ├── GpuSection.tsx
│   │   │   ├── CpuSection.tsx
│   │   │   ├── RamSection.tsx
│   │   │   ├── NetworkSection.tsx
│   │   │   ├── SensorDropdown.tsx
│   │   │   └── BoundaryInput.tsx
│   │   ├── style/
│   │   │   ├── StyleTab.tsx
│   │   │   ├── PositionGrid.tsx
│   │   │   ├── OrientationPicker.tsx
│   │   │   ├── OpacitySlider.tsx
│   │   │   ├── GraphTypePicker.tsx
│   │   │   └── MonitorSelect.tsx
│   │   ├── AppSettingsTab.tsx
│   │   ├── HelpTab.tsx
│   │   └── Footer.tsx
│   └── overlay/
│       ├── OverlayHud.tsx
│       ├── Pill.tsx
│       ├── FpsSection.tsx
│       ├── GpuSection.tsx
│       ├── CpuSection.tsx
│       ├── RamSection.tsx
│       ├── NetSection.tsx
│       ├── ProgressRing.tsx
│       ├── ProgressBar.tsx
│       ├── FrametimeGraph.tsx
│       └── NetGraph.tsx
```

### 2.2 Window Entry Points

Two separate HTML entry points in `tauri.conf.json`:
- Settings: `src/main.tsx` → renders `<App />` with full settings UI
- Overlay: `src/overlay.tsx` → renders `<OverlayApp />` with HUD only

Both share the same `stores/`, `hooks/`, `lib/`, and `types.ts`.

### 2.3 State Management

**Zustand** for settings state (persistent, shared across components):

```typescript
interface SettingsStore {
  settings: OverlaySettings;
  sensorData: HardwareMonitorData | null;
  presentMonApps: string[];
  pipeConnected: boolean;

  // Actions
  updateSettings: (patch: Partial<OverlaySettings>) => void;
  updateSensor: (key: SensorKey, patch: Partial<SensorConfig>) => void;
  updateBoundary: (key: SensorKey, boundaries: Boundaries) => void;
}
```

**Tauri events** for real-time data (no store — direct subscription):
- `sensor-data` → consumed by overlay components via `useSensorData()` hook
- `hotkey` → consumed by overlay window to toggle visibility
- `update-status` → consumed by settings footer for update toast

### 2.4 Settings Window

#### Top Bar
- Logo (25px) + "CleanMeter" title
- Custom window controls (minimize, close)
- Close minimizes to tray with tooltip: "Closing will minimize to the Tray"

#### Tab Navigation
4 pill-shaped tabs in a horizontal row:

| Tab | Icon | Content |
|---|---|---|
| Stats | data_usage | Sensor toggles, dropdowns, boundary inputs |
| Style | layers | Position, orientation, opacity, graph type, monitor |
| Settings | settings | General prefs, theme, polling rate |
| Help | help | Setup guide, FAQ, hotkeys, logs |

**Tab styling:**
- Selected: dark bg, white text/icon (brand color)
- Unselected: light bg, dark text/icon, 1px border
- Shape: fully rounded pill (border-radius: 9999px)
- Height: 44px

#### Admin Consent Screen
Shown before settings access on first launch:
- Centered modal (400px wide)
- Heading: "CleanMeter needs administrator access"
- Two buttons: "Close app" (outlined) / "Allow" (filled)
- On "Allow": invoke `grant_admin_consent` → persist consent → show settings

### 2.5 Stats Tab

```
┌─────────────────────────────────────┐
│ ⌨ Keyboard shortcut info label      │
├─────────────────────────────────────┤
│ FPS                          [toggle]│
│   ☑ Framerate                        │
│   ☑ Frametime                        │
│   📋 Monitored app: [dropdown]       │
├─────────────────────────────────────┤
│ GPU                          [toggle]│
│   ☑ GPU Usage    [sensor ▾] [bounds] │
│   ☑ GPU Temp     [sensor ▾] [bounds] │
│   ☑ VRAM Usage   [sensor ▾] [bounds] │
│   ☑ Total VRAM Used                  │
│   ☑ GPU Power                        │
├─────────────────────────────────────┤
│ CPU                          [toggle]│
│   ☑ CPU Usage    [sensor ▾] [bounds] │
│   ☑ CPU Temp     [sensor ▾] [bounds] │
│   ☑ CPU Power                        │
├─────────────────────────────────────┤
│ RAM                          [toggle]│
│   ☑ RAM Usage                        │
├─────────────────────────────────────┤
│ NETWORK                      [toggle]│
│   ☑ Download     [sensor ▾]         │
│   ☑ Upload       [sensor ▾]         │
│   ☑ Net Graph                        │
└─────────────────────────────────────┘
```

**Sensor dropdown:** Shows `{hardware name} > {sensor name} ({value} {unit})` for each available sensor of the matching type. Auto-refreshes with live data.

**Boundary input component:**
Three columns (Low / Medium / High) with colored dot indicators:
- Green dot: Low threshold (default 60)
- Yellow dot: Medium threshold (default 80)
- Red dot: High threshold (default 90)
- Disclaimer below: "Colors are visible only when the graph is enabled in the style settings"

### 2.6 Style Tab

```
┌─────────────────────────────────────┐
│ POSITION                     [▾/▴]  │
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ T-L │ │ T-C │ │ T-R │          │
│  └─────┘ └─────┘ └─────┘          │
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ B-L │ │ B-C │ │ B-R │          │
│  └─────┘ └─────┘ └─────┘          │
│  ☐ Lock position  X:[___] Y:[___]  │
├─────────────────────────────────────┤
│ ORIENTATION                  [▾/▴]  │
│  ┌──────────┐ ┌──────────┐         │
│  │Horizontal│ │ Vertical │         │
│  └──────────┘ └──────────┘         │
├─────────────────────────────────────┤
│ OPACITY                      [▾/▴]  │
│  ○━━━━━━━━━━━━━━━━━━━━━━━━━━━○     │
│  🔅          steps=10          🔆   │
├─────────────────────────────────────┤
│ GRAPH                       [toggle]│
│  ┌──────────┐ ┌──────────┐         │
│  │   Ring   │ │   Bar    │         │
│  └──────────┘ └──────────┘         │
├─────────────────────────────────────┤
│ MONITOR                             │
│  [Display 1               ▾]       │
└─────────────────────────────────────┘
```

**StyleCard component** (reused for position, orientation, graph type):
- 16:9 aspect ratio preview area with sunken background
- Selected: 2px brand-colored border
- Unselected: 1px subtle border
- Label below the preview
- Rounded 8px corners

**Opacity slider:**
- Range: 0.0–1.0, 10 steps
- Custom track with tick marks at each step
- Brand-colored active track, gray inactive
- 20px circular thumb with border

### 2.7 App Settings Tab

```
┌─────────────────────────────────────┐
│ GENERAL                             │
│   ☐ Start with Windows (disabled)   │
│   ☑ Start Minimized                 │
│   [Clear app preferences]           │
├─────────────────────────────────────┤
│ APPEARANCE                          │
│  ┌──────────┐ ┌──────────┐         │
│  │  Light   │ │   Dark   │         │
│  └──────────┘ └──────────┘         │
├─────────────────────────────────────┤
│ RECORDING                           │
│  Polling Rate: [500ms          ▾]   │
│  Options: 33, 50, 100, 250, 300,   │
│           350, 400, 500 ms          │
│  ⚠ "Can impact performance!"       │
├─────────────────────────────────────┤
│ [GitHub] [Discord] [Ko-fi]          │
│ v1.2.0 · Danil0v3s · Mars          │
└─────────────────────────────────────┘
```

### 2.8 Help Tab

All sections are collapsible (chevron toggle):

1. **HOW TO SETUP** — 3 numbered steps
2. **CURRENT LIMITATIONS** — bullet list
3. **FREQUENTLY ASKED QUESTIONS** — Q&A pairs with links
4. **HOTKEYS** — `Ctrl + F10` (overlay), `Alt + F11` (recording) shown as keyboard key symbols
5. **APPLICATION LOGS** — toggle + log text area + "Save to file" button

### 2.9 Theme System

Two themes (light / dark), toggled from App Settings tab.

**CSS variables approach** (Tailwind + CSS custom properties):

```css
:root {
  /* Light theme (default) */
  --bg-surface: #f0f1f1;
  --bg-raised: #ffffff;
  --bg-sunken: #cecfd2;
  --brand: #0c111d;
  --text-heading: #0c111d;
  --text-paragraph: #61646c;
  --text-disabled: #9b9da5;
  --success: #067647;
  --warning: #b54708;
  --danger: #b42318;
}

[data-theme="dark"] {
  --bg-surface: #0c111d;
  --bg-raised: #1f242f;
  --bg-sunken: #61646c;
  --brand: #fafafa;
  --text-heading: #fafafa;
  --text-paragraph: #9b9da5;
  --text-disabled: #61646c;
  --success: #dcfae6;
  --warning: #fdb022;
  --danger: #d92d20;
}
```

**Color primitives** (full gray + status palettes):
- Gray: 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950
- Status: Red, Yellow, Green, Emerald, Purple

**Typography** (Inter font family):

| Token | Size | Weight |
|---|---|---|
| `title-xxl` | 32px | 400 (Normal) |
| `title-m` | 16px | 400 (Normal) |
| `title-m-medium` | 16px | 500 (Medium) |
| `label-l` | 14px | 400 |
| `label-l-medium` | 14px | 500 |
| `label-l-semibold` | 14px | 600 |
| `label-m` | 13px | 400 |
| `label-m-semibold` | 13px | 600 |
| `label-s` | 12px | 400 |
| `label-s-medium` | 12px | 500 |
| `label-s-semibold` | 12px | 600 |
| `body-m` | 10px | 400, 1px letter-spacing |

### 2.10 Component Inventory — Kotlin → React Mapping

| Kotlin Component | React Component | shadcn/ui Base |
|---|---|---|
| `Toggle` (Material3 Switch) | `<Switch />` | `shadcn/switch` |
| `CheckboxWithLabel` | `<Checkbox />` + `<Label />` | `shadcn/checkbox` |
| `FilledButton` | `<Button />` | `shadcn/button` |
| `ClearButton` | `<Button variant="ghost" />` | `shadcn/button` |
| `DropdownMenu` | `<Select />` | `shadcn/select` |
| `SensorReadingDropdownMenu` | `<SensorSelect />` (custom) | `shadcn/select` |
| `Slider` (Material3) | `<Slider />` | `shadcn/slider` (custom track) |
| `StyleCard` | `<StyleCard />` (custom) | — |
| `CollapsibleSection` | `<Collapsible />` | `shadcn/collapsible` |
| `CheckboxSection` | `<SensorSection />` (custom) | — |
| `ToggleSection` | `<ToggleSection />` (custom) | — |
| `SectionTitle` | `<SectionTitle />` (custom) | — |
| `SensorBoundaryInput` | `<BoundaryInput />` (custom) | `shadcn/input` |
| `SettingsTab` | `<TabTrigger />` (styled) | `shadcn/tabs` |
| `TopBar` | `<TopBar />` (custom) | — |
| `Pill` | `<Pill />` (custom) | — |
| `Progress` (Circular) | `<ProgressRing />` (SVG) | — |
| `Progress` (Bar) | `<ProgressBar />` (div stack) | — |
| `FrametimeGraph` | `<FrametimeGraph />` (Canvas) | — |
| `NetGraph` | `<NetGraph />` (Canvas) | — |
| `HotKeySymbol` | `<KbdShortcut />` (custom) | — |

---

## 3. Data Flow Detail

### 3.1 Binary Protocol Spec

Byte-level packet format (all multi-byte values are **little-endian**):

```
┌─ PACKET ────────────────────────────────────────────┐
│ [2B] Command (u16)                                  │
│ [4B] Payload size (u32)                             │
│ [NB] Payload (varies by command)                    │
└─────────────────────────────────────────────────────┘
```

**Command 0 — Data (Server → Client):**
```
PAYLOAD:
  [4B] hardware_count (u32)
  [4B] sensor_count (u32)

  REPEAT hardware_count times:
    [2B] name_len (u16)
    [2B] id_len (u16)
    [name_len B] name (UTF-8)
    [id_len B] identifier (UTF-8)
    [4B] hardware_type (u32, see HardwareType enum)

  REPEAT sensor_count times:
    [2B] name_len (u16)
    [2B] id_len (u16)
    [2B] hw_id_len (u16)
    [name_len B] name (UTF-8)
    [id_len B] identifier (UTF-8)
    [hw_id_len B] hardware_identifier (UTF-8)
    [4B] sensor_type (u32, see SensorType enum)
    [4B] value (f32, IEEE 754)
```

**Command 3 — PresentMonApps (Server → Client):**
```
PAYLOAD:
  [2B] app_count (u16)
  REPEAT app_count times:
    [128B] app_name (UTF-8, null-padded to 128 bytes)
```

**Command 1 — RefreshPresentMonApps (Client → Server):**
```
PAYLOAD: (none — just the 2-byte command)
```

**Command 2 — SelectPresentMonApp (Client → Server):**
```
PAYLOAD:
  [2B] name_len (u16)
  [name_len B] app_name (UTF-8)
```

**Command 4 — SelectPollingRate (Client → Server):**
```
PAYLOAD:
  [2B] interval_ms (u16)
```

### 3.2 Rust Deserialization Structs

```rust
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareMonitorData {
    pub hardwares: Vec<Hardware>,
    pub sensors: Vec<Sensor>,
    pub present_mon_apps: Vec<String>,
    pub last_poll_time: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Hardware {
    pub name: String,
    pub identifier: String,
    pub hardware_type: HardwareType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sensor {
    pub name: String,
    pub identifier: String,
    pub hardware_identifier: String,
    pub sensor_type: SensorType,
    pub value: f32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[repr(u32)]
pub enum HardwareType {
    Motherboard = 0,
    SuperIO = 1,
    Cpu = 2,
    Memory = 3,
    GpuNvidia = 4,
    GpuAmd = 5,
    GpuIntel = 6,
    Storage = 7,
    Network = 8,
    Cooler = 9,
    EmbeddedController = 10,
    Psu = 11,
    Battery = 12,
    Unknown = 13,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[repr(u32)]
pub enum SensorType {
    Voltage = 0,
    Current = 1,
    Power = 2,
    Clock = 3,
    Temperature = 4,
    Load = 5,
    Frequency = 6,
    Fan = 7,
    Flow = 8,
    Control = 9,
    Level = 10,
    Factor = 11,
    Data = 12,
    SmallData = 13,
    Throughput = 14,
    TimeSpan = 15,
    Energy = 16,
    Noise = 17,
    Unknown = 18,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverlaySettings {
    pub is_dark_theme: bool,
    pub is_horizontal: bool,
    pub position_index: u8,
    pub selected_display_index: u8,
    pub net_graph: bool,
    pub progress_type: ProgressType,
    pub position_x: i32,
    pub position_y: i32,
    pub is_position_locked: bool,
    pub opacity: f32,
    pub polling_rate: u64,
    pub is_logging_enabled: bool,
    pub sensors: SensorsConfig,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum ProgressType {
    Circular,
    Bar,
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SensorConfig {
    pub is_enabled: bool,
    pub custom_reading_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphSensorConfig {
    pub is_enabled: bool,
    pub custom_reading_id: String,
    pub boundaries: Boundaries,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Boundaries {
    pub low: u32,
    pub medium: u32,
    pub high: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SensorsConfig {
    pub framerate: SensorConfig,
    pub frametime: SensorConfig,
    pub cpu_temp: GraphSensorConfig,
    pub cpu_usage: GraphSensorConfig,
    pub cpu_consumption: SensorConfig,
    pub gpu_temp: GraphSensorConfig,
    pub gpu_usage: GraphSensorConfig,
    pub vram_usage: GraphSensorConfig,
    pub gpu_consumption: SensorConfig,
    pub total_vram_used: SensorConfig,
    pub ram_usage: GraphSensorConfig,
    pub up_rate: SensorConfig,
    pub down_rate: SensorConfig,
}
```

### 3.3 TypeScript Types (Frontend)

```typescript
// Mirrors Rust structs — received via Tauri events

interface HardwareMonitorData {
  hardwares: Hardware[];
  sensors: Sensor[];
  presentMonApps: string[];
  lastPollTime: number;
}

interface Hardware {
  name: string;
  identifier: string;
  hardwareType: HardwareType;
}

interface Sensor {
  name: string;
  identifier: string;
  hardwareIdentifier: string;
  sensorType: SensorType;
  value: number;
}

enum HardwareType {
  Motherboard = 0, SuperIO = 1, Cpu = 2, Memory = 3,
  GpuNvidia = 4, GpuAmd = 5, GpuIntel = 6, Storage = 7,
  Network = 8, Cooler = 9, EmbeddedController = 10, Psu = 11,
  Battery = 12, Unknown = 13,
}

enum SensorType {
  Voltage = 0, Current = 1, Power = 2, Clock = 3,
  Temperature = 4, Load = 5, Frequency = 6, Fan = 7,
  Flow = 8, Control = 9, Level = 10, Factor = 11,
  Data = 12, SmallData = 13, Throughput = 14, TimeSpan = 15,
  Energy = 16, Noise = 17, Unknown = 18,
}

type ProgressType = 'circular' | 'bar' | 'none';

interface Boundaries {
  low: number;
  medium: number;
  high: number;
}

interface SensorConfig {
  isEnabled: boolean;
  customReadingId: string;
}

interface GraphSensorConfig extends SensorConfig {
  boundaries: Boundaries;
}

interface SensorsConfig {
  framerate: SensorConfig;
  frametime: SensorConfig;
  cpuTemp: GraphSensorConfig;
  cpuUsage: GraphSensorConfig;
  cpuConsumption: SensorConfig;
  gpuTemp: GraphSensorConfig;
  gpuUsage: GraphSensorConfig;
  vramUsage: GraphSensorConfig;
  gpuConsumption: SensorConfig;
  totalVramUsed: SensorConfig;
  ramUsage: GraphSensorConfig;
  upRate: SensorConfig;
  downRate: SensorConfig;
}

interface OverlaySettings {
  isDarkTheme: boolean;
  isHorizontal: boolean;
  positionIndex: number;
  selectedDisplayIndex: number;
  netGraph: boolean;
  progressType: ProgressType;
  positionX: number;
  positionY: number;
  isPositionLocked: boolean;
  opacity: number;
  pollingRate: number;
  isLoggingEnabled: boolean;
  sensors: SensorsConfig;
}
```

### 3.4 Event Flow Diagram

```
C# Sidecar                    Rust Backend                    React Frontend
─────────────                  ────────────                    ──────────────

[Sensor poll]
    │
    ├── Binary packet ──────▶  parse_data_packet()
    │   (Command 0)                │
    │                              ├── Serialize to JSON
    │                              └── app.emit("sensor-data", payload)
    │                                          │
    │                                          └──────────────▶ useSensorData()
    │                                                           updates overlay UI
    │
[PresentMon apps]
    │
    ├── Binary packet ──────▶  parse_present_mon_apps()
    │   (Command 3)                │
    │                              └── app.emit("present-mon-apps", apps)
    │                                          │
    │                                          └──────────────▶ FPS dropdown updates

                                                               [User selects app]
                                                                    │
                               invoke("select_present_mon_app") ◀──┘
                                    │
                                    ├── Build binary packet (Command 2)
                                    └── Write to pipe ──────▶  C# processes selection

                                                               [User changes polling]
                                                                    │
                               invoke("set_polling_rate") ◀────────┘
                                    │
                                    ├── Build binary packet (Command 4)
                                    ├── Write to pipe ──────▶  C# adjusts interval
                                    └── Save to settings.json
```

---

## 4. Feature Parity Checklist

### 4.1 Overlay

| # | Feature | Kotlin Source | React Component | Rust Support |
|---|---|---|---|---|
| 1 | FPS counter | `FpsSection.kt` | `FpsSection.tsx` | Sensor data event |
| 2 | Frametime graph | `FpsSection.kt` (Canvas) | `FrametimeGraph.tsx` (Canvas API) | 30-point history buffer |
| 3 | GPU temp/usage/VRAM/power | `GpuSection.kt` | `GpuSection.tsx` | Sensor data event |
| 4 | CPU temp/usage/power | `CpuSection.kt` | `CpuSection.tsx` | Sensor data event |
| 5 | RAM usage | `RamSection.kt` | `RamSection.tsx` | Sensor data event |
| 6 | Network up/down + graph | `NetSection.kt` | `NetSection.tsx` + `NetGraph.tsx` | Sensor data event |
| 7 | Circular progress indicator | `Progress.kt` | `ProgressRing.tsx` (SVG) | — |
| 8 | Bar progress indicator | `Progress.kt` | `ProgressBar.tsx` (10 stacked divs) | — |
| 9 | Boundary color coding | `Progress.kt` | `ProgressRing/Bar.tsx` | — |
| 10 | Horizontal layout | `OverlayUi.kt` | `OverlayHud.tsx` (flex-row) | Window resize command |
| 11 | Vertical layout | `OverlayUi.kt` | `OverlayHud.tsx` (flex-col) | Window resize command |
| 12 | 6 preset positions | `OverlayWindow.kt` | — | `set_overlay_position` command |
| 13 | Custom drag-to-position | `OverlayWindow.kt` | Mouse drag handler | Position save command |
| 14 | Position lock (click-through) | JNA `WS_EX_TRANSPARENT` | — | `set_ignore_cursor_events` |
| 15 | Opacity control | `OverlayWindow.kt` | CSS `opacity` | `set_overlay_opacity` command |
| 16 | Multi-monitor support | `selectedDisplayIndex` | — | `get_monitors` + position calc |
| 17 | Pill container (section wrapper) | `Pill.kt` | `Pill.tsx` | — |

### 4.2 Settings

| # | Feature | Kotlin Source | React Component |
|---|---|---|---|
| 18 | Per-sensor enable/disable | `StatsUi.kt` tabs | `StatsTab.tsx` checkboxes |
| 19 | Custom sensor mapping | `SensorReadingDropdownMenu.kt` | `SensorDropdown.tsx` |
| 20 | Boundary thresholds (low/med/high) | `SensorBoundaryInput.kt` | `BoundaryInput.tsx` |
| 21 | PresentMon app selector | `FpsStats.kt` dropdown | `FpsSection.tsx` select |
| 22 | Position grid (6 presets) | `Position.kt` | `PositionGrid.tsx` |
| 23 | Orientation picker | `Orientation.kt` | `OrientationPicker.tsx` |
| 24 | Opacity slider | `Opacity.kt` | `OpacitySlider.tsx` |
| 25 | Graph type picker | `GraphType.kt` | `GraphTypePicker.tsx` |
| 26 | Monitor selector | `StyleUi.kt` dropdown | `MonitorSelect.tsx` |
| 27 | Light/dark theme | `AppSettingsUi.kt` | `AppSettingsTab.tsx` |
| 28 | Start minimized toggle | `AppSettingsUi.kt` | `AppSettingsTab.tsx` |
| 29 | Clear preferences button | `AppSettingsUi.kt` | `AppSettingsTab.tsx` |
| 30 | Polling rate dropdown | `AppSettingsUi.kt` | `AppSettingsTab.tsx` |
| 31 | Setup guide | `HelpSettingsUi.kt` | `HelpTab.tsx` |
| 32 | FAQ section | `HelpSettingsUi.kt` | `HelpTab.tsx` |
| 33 | Hotkey reference | `HelpSettingsUi.kt` | `HelpTab.tsx` |
| 34 | Application log viewer | `HelpSettingsUi.kt` | `HelpTab.tsx` |
| 35 | Admin consent dialog | `AdminConsentUi.kt` | `AdminConsent.tsx` |
| 36 | Footer (GitHub, Discord, Ko-fi, credits) | `FooterUi.kt` | `Footer.tsx` |

### 4.3 System

| # | Feature | Kotlin Source | Tauri Plugin |
|---|---|---|---|
| 37 | System tray + quit | Compose Desktop tray | `tauri-plugin-tray-icon` |
| 38 | Global hotkey Ctrl+F10 | jnativehook | `tauri-plugin-global-shortcut` |
| 39 | Global hotkey Alt+F11 | jnativehook | `tauri-plugin-global-shortcut` |
| 40 | Data recording to JSON | Manual file write | Rust file I/O + `tauri-plugin-fs` |
| 41 | Auto-updater | Custom GitHub check + Ktor | `tauri-plugin-updater` |
| 42 | .NET runtime detection | `dotnet --list-runtimes` | Rust `Command::new("dotnet")` |
| 43 | Single instance | ServerSocket port 42069 | `tauri-plugin-single-instance` |
| 44 | Admin elevation / UAC | Shell32 via JNA | Windows manifest + `runas` |
| 45 | Start with Windows | Registry (disabled) | Registry or Startup folder |
| 46 | Settings persistence | Java Preferences (Registry) | JSON file in app data dir |

---

## 5. Migration Path

```
Phase 1 — Scaffold                              [Week 1]
├── Initialize Tauri 2 + React + Vite project
├── Configure tauri.conf.json (two windows)
├── Install plugins (tray, shortcuts, updater, single-instance, fs)
├── Set up Tailwind + shadcn/ui
├── Set up Inter font + design tokens (CSS vars)
└── Create TypeScript types from §3.3

Phase 2 — Rust Pipe Client                      [Week 2]
├── Implement named pipe connection (tokio)
├── Binary protocol parser (§3.1)
├── Rust structs + serde serialization (§3.2)
├── Tauri event emitters (sensor-data, present-mon-apps, pipe-status)
├── Outgoing command writers (select app, polling rate, refresh)
├── Sidecar launcher + .NET detection
└── Reconnection logic with backoff

Phase 3 — Settings UI                           [Week 3-4]
├── TopBar with custom window controls
├── Tab navigation (4 pill tabs)
├── Stats tab (all sensor sections + dropdowns + boundaries)
├── Style tab (position grid + orientation + opacity + graph + monitor)
├── App Settings tab (general + appearance + recording + footer)
├── Help tab (collapsible sections + hotkey display + log viewer)
├── Admin consent screen
├── Zustand store + settings persistence commands
└── Theme toggle (light/dark CSS vars)

Phase 4 — Overlay UI                            [Week 5]
├── Overlay window entry point
├── OverlayHud layout (horizontal + vertical)
├── Pill container component
├── FPS section + FrametimeGraph (Canvas API)
├── GPU section + ProgressRing/Bar
├── CPU section
├── RAM section
├── NET section + NetGraph (Canvas API)
├── Boundary color coding logic
└── useSensorData() hook for real-time updates

Phase 5 — System Features                       [Week 6]
├── System tray (show settings, toggle overlay, quit)
├── Global hotkeys (Ctrl+F10, Alt+F11)
├── Single instance guard
├── Auto-updater (GitHub releases)
├── Data recording (JSON export)
├── Window positioning (6 presets + custom drag)
├── Click-through toggle
├── Opacity control
├── Multi-monitor support
└── Start minimized

Phase 6 — Integration & Polish                  [Week 7]
├── End-to-end test with live C# sidecar
├── Settings migration from Java Preferences (Registry)
├── Windows installer (NSIS via Tauri)
├── Admin elevation in installer manifest
├── Icon and branding assets
├── Performance profiling (overlay must be <5% CPU)
└── Edge cases: sidecar crash recovery, pipe reconnect, .NET missing

Phase 7 — Release                               [Week 8]
├── GitHub Actions CI (build + sign + publish)
├── Update endpoint (latest.json for Tauri updater)
├── Release notes
├── Update README
└── Tag v2.0.0
```

---

## Current App Feature Map (Reference)

### Overlay Sections
| Section | Metrics | Graph Support | Units |
|---------|---------|---------------|-------|
| FPS | Frame count, frametime graph | Line graph | fps, ms |
| GPU | Temp, usage, VRAM, power | Circular/Bar | °C, %, GB, W |
| CPU | Temp, usage, power | Circular/Bar | °C, %, W |
| RAM | Usage | Circular/Bar | GB |
| Network | Upload, download, graph | Line graph | MB/s, KB/s |

### Settings Tabs
1. **Stats** — Toggle and configure each sensor, custom sensor mapping, boundary thresholds
2. **Style** — Position (6 presets + custom), orientation, opacity, graph type, monitor selection
3. **Settings** — Start with Windows, start minimized, theme, polling rate, clear prefs
4. **Help** — Setup guide, limitations, FAQ, hotkey reference, log viewer

### System Features
| Feature | Current Implementation | Tauri Equivalent |
|---------|----------------------|------------------|
| System tray | Compose Desktop tray | Tauri `tray-icon` plugin |
| Global hotkeys | jnativehook library | Tauri `global-shortcut` plugin |
| Auto-updater | Custom GitHub release check + Ktor download | Tauri `updater` plugin |
| Single instance | ServerSocket on port 42069 | Tauri `single-instance` plugin |
| Settings storage | Windows Registry via Preferences API | JSON file via Tauri `fs` plugin |
| Admin elevation | Windows Shell32 UAC | Tauri manifest `requireAdministrator` |
| Click-through overlay | Windows API via JNA | Tauri window `set_ignore_cursor_events` |
| Window transparency | Compose transparent window | Tauri `transparent: true` window config |

---

## Context Recovery

### Key File Paths (Current Kotlin App)
- **Entry point:** `target/desktop/src/main/kotlin/app/cleanmeter/target/desktop/DesktopMain.kt`
- **Settings UI:** `target/desktop/src/main/kotlin/app/cleanmeter/target/desktop/ui/settings/`
- **Overlay UI:** `target/desktop/src/main/kotlin/app/cleanmeter/target/desktop/ui/overlay/`
- **Data models:** `core/common/src/main/kotlin/app/cleanmeter/core/common/hardwaremonitor/`
- **Pipe client:** `core/native/src/main/kotlin/app/cleanmeter/core/os/hardwaremonitor/PipeClient.kt`
- **Socket client:** `core/native/src/main/kotlin/app/cleanmeter/core/os/hardwaremonitor/SocketClient.kt`
- **HW reader:** `core/native/src/main/kotlin/app/cleanmeter/core/os/hardwaremonitor/HardwareMonitorReader.kt`
- **Process manager:** `core/native/src/main/kotlin/app/cleanmeter/core/os/hardwaremonitor/HardwareMonitorProcessManager.kt`
- **Settings model:** `target/desktop/src/main/kotlin/app/cleanmeter/target/desktop/model/OverlaySettings.kt`
- **Design system:** `core/design-system/src/main/kotlin/app/cleanmeter/core/designsystem/`

### Key File Paths (C# Backend)
- **Service entry:** `HardwareMonitor/HardwareMonitor/Program.cs`
- **Poller:** `HardwareMonitor/HardwareMonitor/Monitor/MonitorPoller.cs`
- **Pipe server:** `HardwareMonitor/HardwareMonitor/Sockets/PipeHost.cs`
- **PresentMon:** `HardwareMonitor/HardwareMonitor/PresentMon/PresentMonPoller.cs`
- **Data models:** `HardwareMonitor/HardwareMonitor/SharedMemory/SharedMemory.cs`
- **Updater:** `HardwareMonitor/Updater/Program.cs`

### Key File Paths (Tauri Rewrite — Target)
- **Rust backend:** `src-tauri/src/`
- **React frontend:** `src/`
- **Tauri config:** `src-tauri/tauri.conf.json`
- **Settings types:** `src/lib/types.ts`
- **Settings store:** `src/stores/settings-store.ts`
- **Overlay components:** `src/components/overlay/`
- **Settings components:** `src/components/settings/`

### Commands to Re-fetch Context
```bash
# Full project structure
ls -la /Users/alim/Desktop/Development/CleanMeter/

# Kotlin UI files
find /Users/alim/Desktop/Development/CleanMeter/target/desktop/src -name "*.kt" | sort

# C# backend files
find /Users/alim/Desktop/Development/CleanMeter/HardwareMonitor -name "*.cs" | sort

# Current dependencies
cat /Users/alim/Desktop/Development/CleanMeter/gradle/libs.versions.toml

# This design document
cat /Users/alim/Desktop/Development/CleanMeter/docs/plans/2026-02-25-tauri-rewrite-design.md
```
