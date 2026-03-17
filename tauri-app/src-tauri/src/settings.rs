use log::{error, info};
use std::path::PathBuf;
use std::sync::Mutex;

use crate::types::{AppPreferences, OverlaySettings};

pub struct SettingsManager {
    settings: Mutex<OverlaySettings>,
    preferences: Mutex<AppPreferences>,
    settings_path: PathBuf,
    preferences_path: PathBuf,
}

impl SettingsManager {
    pub fn new(app_data_dir: PathBuf) -> Self {
        std::fs::create_dir_all(&app_data_dir).ok();

        let settings_path = app_data_dir.join("settings.json");
        let preferences_path = app_data_dir.join("preferences.json");

        let settings = Self::load_from_file::<OverlaySettings>(&settings_path)
            .unwrap_or_default();
        let preferences = Self::load_from_file::<AppPreferences>(&preferences_path)
            .unwrap_or_default();

        info!("Settings loaded from {:?}", settings_path);

        SettingsManager {
            settings: Mutex::new(settings),
            preferences: Mutex::new(preferences),
            settings_path,
            preferences_path,
        }
    }

    pub fn get_settings(&self) -> OverlaySettings {
        self.settings.lock().unwrap().clone()
    }

    pub fn save_settings(&self, new_settings: OverlaySettings) {
        *self.settings.lock().unwrap() = new_settings.clone();
        Self::save_to_file(&self.settings_path, &new_settings);
    }

    pub fn clear_settings(&self) {
        let defaults = OverlaySettings::default();
        *self.settings.lock().unwrap() = defaults.clone();
        Self::save_to_file(&self.settings_path, &defaults);
    }

    pub fn get_preferences(&self) -> AppPreferences {
        self.preferences.lock().unwrap().clone()
    }

    pub fn save_preferences(&self, new_prefs: AppPreferences) {
        *self.preferences.lock().unwrap() = new_prefs.clone();
        Self::save_to_file(&self.preferences_path, &new_prefs);
    }

    fn load_from_file<T: serde::de::DeserializeOwned>(path: &PathBuf) -> Option<T> {
        match std::fs::read_to_string(path) {
            Ok(content) => match serde_json::from_str(&content) {
                Ok(parsed) => Some(parsed),
                Err(e) => {
                    error!("Failed to parse {:?}: {}", path, e);
                    None
                }
            },
            Err(_) => None,
        }
    }

    fn save_to_file<T: serde::Serialize>(path: &PathBuf, data: &T) {
        match serde_json::to_string_pretty(data) {
            Ok(json) => {
                if let Err(e) = std::fs::write(path, json) {
                    error!("Failed to write {:?}: {}", path, e);
                }
            }
            Err(e) => {
                error!("Failed to serialize settings: {}", e);
            }
        }
    }
}
