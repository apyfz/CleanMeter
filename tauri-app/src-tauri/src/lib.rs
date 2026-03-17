mod commands;
mod pipe_client;
mod settings;
mod tray;
mod types;

use commands::PipeCommandSender;
use log::info;
use settings::SettingsManager;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tauri::{Emitter, Manager};
use tokio::sync::mpsc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Focus the existing settings window when a second instance launches
            if let Some(window) = app.get_webview_window("settings") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            info!("CleanMeter starting up...");

            // Initialize settings manager
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            let settings_mgr = SettingsManager::new(app_data_dir);
            app.manage(settings_mgr);

            // Set up pipe client communication channel
            let (cmd_tx, cmd_rx) = mpsc::channel::<pipe_client::PipeCommand>(32);
            app.manage(PipeCommandSender(cmd_tx));

            // Start the pipe client in a background task
            let app_handle = app.handle().clone();
            let running = Arc::new(AtomicBool::new(true));
            let running_clone = running.clone();

            tauri::async_runtime::spawn(async move {
                pipe_client::run_pipe_client(app_handle, cmd_rx, running_clone).await;
            });

            // Store running flag for cleanup
            app.manage(running);

            // Set up system tray
            tray::setup_tray(app.handle())?;

            // Register global shortcuts
            use tauri_plugin_global_shortcut::GlobalShortcutExt;
            let app_handle = app.handle().clone();

            app.global_shortcut().on_shortcut("Ctrl+F10", move |_app, _shortcut, _event| {
                let _ = app_handle.emit("hotkey", "toggle-overlay");
            })?;

            let app_handle2 = app.handle().clone();
            app.global_shortcut().on_shortcut("Alt+F11", move |_app, _shortcut, _event| {
                let _ = app_handle2.emit("hotkey", "toggle-recording");
            })?;

            // Handle settings window close → minimize to tray
            let app_handle3 = app.handle().clone();
            if let Some(settings_window) = app.get_webview_window("settings") {
                settings_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        if let Some(window) = app_handle3.get_webview_window("settings") {
                            let _ = window.hide();
                        }
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::save_settings,
            commands::clear_settings,
            commands::get_preferences,
            commands::save_preferences,
            commands::set_overlay_visible,
            commands::set_overlay_position,
            commands::set_overlay_size,
            commands::set_overlay_click_through,
            commands::set_overlay_opacity,
            commands::select_present_mon_app,
            commands::refresh_present_mon_apps,
            commands::set_polling_rate,
            commands::check_dotnet_runtime,
            commands::get_monitors,
            commands::get_app_version,
            commands::grant_admin_consent,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
