use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::mpsc;

use crate::pipe_client::PipeCommand;
use crate::settings::SettingsManager;
use crate::types::{AppPreferences, MonitorInfo, OverlaySettings};

pub struct PipeCommandSender(pub mpsc::Sender<PipeCommand>);

// ─── Settings Commands ──────────────────────────────────────────

#[tauri::command]
pub fn get_settings(settings_mgr: State<'_, SettingsManager>) -> OverlaySettings {
    settings_mgr.get_settings()
}

#[tauri::command]
pub fn save_settings(
    settings: OverlaySettings,
    settings_mgr: State<'_, SettingsManager>,
    app: AppHandle,
) {
    settings_mgr.save_settings(settings.clone());
    // Notify overlay window of settings change
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.emit("settings-changed", &settings);
    }
}

#[tauri::command]
pub fn clear_settings(settings_mgr: State<'_, SettingsManager>, app: AppHandle) {
    settings_mgr.clear_settings();
    let defaults = settings_mgr.get_settings();
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.emit("settings-changed", &defaults);
    }
}

#[tauri::command]
pub fn get_preferences(settings_mgr: State<'_, SettingsManager>) -> AppPreferences {
    settings_mgr.get_preferences()
}

#[tauri::command]
pub fn save_preferences(prefs: AppPreferences, settings_mgr: State<'_, SettingsManager>) {
    settings_mgr.save_preferences(prefs);
}

// ─── Overlay Window Commands ────────────────────────────────────

#[tauri::command]
pub fn set_overlay_visible(visible: bool, app: AppHandle) {
    if let Some(overlay) = app.get_webview_window("overlay") {
        if visible {
            let _ = overlay.show();
        } else {
            let _ = overlay.hide();
        }
    }
}

#[tauri::command]
pub fn set_overlay_position(x: i32, y: i32, app: AppHandle) {
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(x, y)));
    }
}

#[tauri::command]
pub fn set_overlay_size(width: u32, height: u32, app: AppHandle) {
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.set_size(tauri::Size::Physical(tauri::PhysicalSize::new(width, height)));
    }
}

#[tauri::command]
pub fn set_overlay_click_through(enabled: bool, app: AppHandle) {
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.set_ignore_cursor_events(enabled);
    }
}

#[tauri::command]
pub fn set_overlay_opacity(opacity: f64, app: AppHandle) {
    if let Some(overlay) = app.get_webview_window("overlay") {
        // Tauri 2 doesn't have set_opacity directly on WebviewWindow,
        // so we'll send it to the frontend to apply via CSS
        let _ = overlay.emit("set-opacity", opacity);
    }
}

// ─── Pipe Commands ──────────────────────────────────────────────

#[tauri::command]
pub async fn select_present_mon_app(
    app_name: String,
    sender: State<'_, PipeCommandSender>,
) -> Result<(), String> {
    sender
        .0
        .send(PipeCommand::SelectPresentMonApp(app_name))
        .await
        .map_err(|e| format!("Failed to send command: {}", e))
}

#[tauri::command]
pub async fn refresh_present_mon_apps(
    sender: State<'_, PipeCommandSender>,
) -> Result<(), String> {
    sender
        .0
        .send(PipeCommand::RefreshPresentMonApps)
        .await
        .map_err(|e| format!("Failed to send command: {}", e))
}

#[tauri::command]
pub async fn set_polling_rate(
    interval_ms: u16,
    sender: State<'_, PipeCommandSender>,
) -> Result<(), String> {
    sender
        .0
        .send(PipeCommand::SelectPollingRate(interval_ms))
        .await
        .map_err(|e| format!("Failed to send command: {}", e))
}

// ─── System Commands ────────────────────────────────────────────

#[tauri::command]
pub fn check_dotnet_runtime() -> bool {
    match std::process::Command::new("dotnet")
        .arg("--list-runtimes")
        .output()
    {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            stdout.contains("Microsoft.NETCore.App 8.")
        }
        Err(_) => false,
    }
}

#[tauri::command]
pub fn get_monitors() -> Vec<MonitorInfo> {
    // Return a default monitor for now — Tauri 2 provides monitor info
    // through the window API which we'll use in the frontend
    vec![MonitorInfo {
        name: "Primary".to_string(),
        width: 1920,
        height: 1080,
        x: 0,
        y: 0,
        primary: true,
    }]
}

#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
pub fn grant_admin_consent(settings_mgr: State<'_, SettingsManager>) {
    let mut prefs = settings_mgr.get_preferences();
    prefs.admin_consent = true;
    settings_mgr.save_preferences(prefs);
}
