use crate::library::error::AppResult;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibrarySettings {
    #[serde(skip)]
    pub path: Option<std::path::PathBuf>,

    pub project_root: Option<String>,
    pub output_folder: Option<String>,
    pub ignore_patterns: Vec<String>,
    pub thumbnail_size: u32,
    pub scan_on_focus: bool,
}

impl Default for LibrarySettings {
    fn default() -> Self {
        Self {
            path: None,
            project_root: None,
            output_folder: None,
            ignore_patterns: vec![
                "Library/".to_string(),
                "Temp/".to_string(),
                "obj/".to_string(),
                "Logs/".to_string(),
                "UserSettings/".to_string(),
                ".git/".to_string(),
                ".vs/".to_string(),
                "Builds/".to_string(),
                "Build/".to_string(),
                "node_modules/".to_string(),
                "__pycache__/".to_string(),
                ".svn/".to_string(),
                ".hg/".to_string(),
                "packages/".to_string(),
                "ProjectSettings/".to_string(),
                ".idea/".to_string(),
                "bin/".to_string(),
            ],
            thumbnail_size: 128,
            scan_on_focus: true,
        }
    }
}

impl LibrarySettings {
    pub fn load(path: &Path) -> AppResult<Self> {
        if path.exists() {
            let content = std::fs::read_to_string(path)?;
            let mut settings: LibrarySettings = serde_json::from_str(&content)?;
            settings.path = Some(path.to_path_buf());
            Ok(settings)
        } else {
            let mut settings = LibrarySettings::default();
            settings.path = Some(path.to_path_buf());
            settings.save()?;
            Ok(settings)
        }
    }

    pub fn save(&self) -> AppResult<()> {
        if let Some(path) = &self.path {
            let content = serde_json::to_string_pretty(self)?;
            std::fs::write(path, content)?;
        }
        Ok(())
    }
}
