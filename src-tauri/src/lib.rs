use std::process::Command;
use std::path::Path;
use tauri::Manager;

// Library module for asset database
mod library;
use library::LibraryState;

// Plastic SCM types
#[derive(Debug, serde::Serialize)]
pub struct PlasticRepo {
    pub name: String,
    pub server: String,
}

#[derive(Debug, serde::Serialize, Clone)]
pub struct Changeset {
    pub id: i32,
    pub author: String,
    pub date: String,
    pub comment: String,
    pub branch: String,
    pub repository: String,
}

/// Get the cm command - either custom path or default "cm"
fn get_cm_command(cm_path: &Option<String>) -> Command {
    match cm_path {
        Some(path) if !path.is_empty() => Command::new(path),
        _ => Command::new("cm"),
    }
}

/// Check if Plastic SCM CLI (cm) is installed and accessible
#[tauri::command]
async fn check_plastic_installed(cm_path: Option<String>) -> Result<bool, String> {
    let mut cmd = get_cm_command(&cm_path);
    let output = cmd.arg("version").output();

    match output {
        Ok(result) => Ok(result.status.success()),
        Err(_) => Ok(false),
    }
}

/// Validate a cm path by checking if it exists and works
/// Returns the resolved path if valid, or an error message
#[tauri::command]
async fn validate_cm_path(cm_path: String) -> Result<String, String> {
    let path = Path::new(&cm_path);

    // If it's a directory, try appending cm.exe
    let resolved_path = if path.is_dir() {
        path.join("cm.exe")
    } else {
        path.to_path_buf()
    };

    // Check if file exists
    if !resolved_path.exists() {
        return Err(format!("File not found: {}", resolved_path.display()));
    }

    // Try running it
    let output = Command::new(&resolved_path)
        .arg("version")
        .output();

    match output {
        Ok(result) if result.status.success() => {
            Ok(resolved_path.to_string_lossy().to_string())
        }
        Ok(_) => Err("cm.exe found but failed to execute 'cm version'".to_string()),
        Err(e) => Err(format!("Failed to execute cm.exe: {}", e)),
    }
}

/// Detect the Plastic Cloud server from configured repos
#[tauri::command]
async fn detect_plastic_server(cm_path: Option<String>) -> Result<String, String> {
    // Try cm lrep first to see configured repos
    let mut cmd = get_cm_command(&cm_path);
    let output = cmd
        .args(["lrep"])
        .output()
        .map_err(|e| format!("Failed to run cm lrep: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        // Parse output like "repo@server@cloud" to extract server
        for line in stdout.lines() {
            let line = line.trim();
            if line.contains("@") && line.contains("cloud") {
                // Extract server part (e.g., "orgname@cloud" from "repo@orgname@cloud")
                let parts: Vec<&str> = line.split('@').collect();
                if parts.len() >= 2 {
                    // Return "orgname@cloud" format
                    let server = if parts.len() >= 3 {
                        format!("{}@{}", parts[parts.len() - 2], parts[parts.len() - 1])
                    } else {
                        parts.last().unwrap_or(&"").to_string()
                    };
                    if !server.is_empty() {
                        return Ok(server);
                    }
                }
            }
        }
    }

    // Fallback: try cm listservers
    let mut cmd = get_cm_command(&cm_path);
    let output = cmd
        .args(["listservers"])
        .output()
        .map_err(|e| format!("Failed to run cm listservers: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            let line = line.trim();
            if line.contains("cloud") {
                return Ok(line.to_string());
            }
        }
    }

    Err("Could not detect Plastic Cloud server. Please ensure you're logged in.".to_string())
}

/// Get list of repositories from a Plastic server
#[tauri::command]
async fn get_plastic_repos(server: String, cm_path: Option<String>) -> Result<Vec<PlasticRepo>, String> {
    let mut cmd = get_cm_command(&cm_path);
    let output = cmd
        .args(["find", "repos", "on", "repserver", &format!("'{}'", server)])
        .output()
        .map_err(|e| format!("Failed to run cm find repos: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("cm find repos failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut repos = Vec::new();

    for line in stdout.lines() {
        let line = line.trim();
        if !line.is_empty() && !line.starts_with("Repository") {
            repos.push(PlasticRepo {
                name: line.to_string(),
                server: server.clone(),
            });
        }
    }

    Ok(repos)
}

/// Get changesets from all repositories on the server
#[tauri::command]
async fn get_all_changesets(server: String, limit: Option<u32>, cm_path: Option<String>) -> Result<Vec<Changeset>, String> {
    let limit = limit.unwrap_or(100);
    let per_repo_limit = 20; // Get 20 from each repo, then sort and trim

    // First, get list of repos using "cm lr" (list repos) command
    // Format: cm find repos on repserver <server>
    let mut cmd = get_cm_command(&cm_path);
    let repos_output = cmd
        .args(["find", "repos", "on", "repserver", &server])
        .output()
        .map_err(|e| format!("Failed to run cm find repos: {}", e))?;

    if !repos_output.status.success() {
        let stderr = String::from_utf8_lossy(&repos_output.stderr);
        let stdout = String::from_utf8_lossy(&repos_output.stdout);
        return Err(format!("Failed to list repos (stderr: {}, stdout: {})", stderr.trim(), stdout.trim()));
    }

    let repos_stdout = String::from_utf8_lossy(&repos_output.stdout);
    let repo_names: Vec<&str> = repos_stdout
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty() && !l.starts_with("Repository") && !l.starts_with("Name"))
        .collect();

    if repo_names.is_empty() {
        return Err(format!("No repositories found on server '{}'. Raw output: {}", server, repos_stdout.trim()));
    }

    let mut all_changesets: Vec<Changeset> = Vec::new();

    // For each repo, get recent changesets
    for repo_name in repo_names {
        let repo_full = format!("{}@{}", repo_name, server);

        // Use cm find changesets with custom format
        // Format: changesetid|owner|date|comment|branch
        let mut cmd = get_cm_command(&cm_path);
        let output = cmd
            .args([
                "find", "changesets",
                "on", "repository", &repo_full,
                "--format={changesetid}|{owner}|{date}|{comment}|{branch}",
                "--nototal",
                "-n", &per_repo_limit.to_string(),
            ])
            .output();

        if let Ok(result) = output {
            if result.status.success() {
                let stdout = String::from_utf8_lossy(&result.stdout);
                for line in stdout.lines() {
                    let line = line.trim();
                    if line.is_empty() {
                        continue;
                    }

                    let parts: Vec<&str> = line.splitn(5, '|').collect();
                    if parts.len() >= 5 {
                        if let Ok(id) = parts[0].parse::<i32>() {
                            all_changesets.push(Changeset {
                                id,
                                author: parts[1].to_string(),
                                date: parts[2].to_string(),
                                comment: parts[3].to_string(),
                                branch: parts[4].to_string(),
                                repository: repo_name.to_string(),
                            });
                        }
                    }
                }
            }
        }
    }

    // Sort by date (newest first) - dates are typically in ISO format
    all_changesets.sort_by(|a, b| b.date.cmp(&a.date));

    // Trim to requested limit
    all_changesets.truncate(limit as usize);

    Ok(all_changesets)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            // Plastic SCM commands
            check_plastic_installed,
            validate_cm_path,
            detect_plastic_server,
            get_plastic_repos,
            get_all_changesets,
            // Library commands
            library::commands::library_test_event,
            library::commands::library_set_project_root,
            library::commands::library_set_output_folder,
            library::commands::library_get_settings,
            library::commands::library_get_current_project,
            library::commands::library_start_scan,
            library::commands::library_cancel_operation,
            library::commands::library_get_assets,
            library::commands::library_get_asset,
            library::commands::library_get_dependencies,
            library::commands::library_get_dependents,
            library::commands::library_get_type_counts,
            library::commands::library_export_file,
            library::commands::library_export_bundle,
            library::commands::library_reveal_in_explorer,
            library::commands::library_get_material_info,
            library::commands::library_get_model_info,
            library::commands::library_get_bundle_preview,
            library::commands::library_get_thumbnail_base64,
            library::commands::library_regenerate_thumbnails,
            library::commands::library_get_model_assets_for_thumbnails,
        ])
        .setup(|app| {
            // Initialize library state
            let library_state = LibraryState::new(app.handle().clone())
                .expect("Failed to initialize library state");
            app.manage(library_state);

            // Open devtools only in debug builds
            #[cfg(debug_assertions)]
            if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
