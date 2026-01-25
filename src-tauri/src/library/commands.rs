use crate::library::db::{Asset, Dependency, Project, TypeCount};
use crate::library::deps::DependencyResolver;
use crate::library::error::AppError;
use crate::library::export::{ExportResult, Exporter};
use crate::library::indexer::Indexer;
use crate::library::previews::{parse_material_file, parse_model_info, MaterialInfo, ModelInfo, PreviewGenerator};
use crate::library::scanner::{count_scannable_files, scan_files_batch, ScanStats};
use crate::library::state::LibraryState;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Arc;
use tauri::{Emitter, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgress {
    pub scanned: usize,
    pub total: Option<usize>,
    pub current_path: String,
    pub phase: String,
    pub skipped: Option<usize>,
    pub changed: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AssetsResponse {
    pub assets: Vec<Asset>,
    pub total: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LibrarySettingsResponse {
    pub project_root: Option<String>,
    pub output_folder: Option<String>,
}

// Simple test command to verify events work
#[tauri::command]
pub async fn library_test_event(app_handle: tauri::AppHandle) -> Result<String, AppError> {
    tracing::info!("library_test_event called");

    // Emit a test event
    match app_handle.emit(
        "library-scan-progress",
        ScanProgress {
            scanned: 42,
            total: Some(100),
            current_path: "test/path/file.txt".to_string(),
            phase: "indexing".to_string(),
            skipped: None,
            changed: None,
        },
    ) {
        Ok(_) => {
            tracing::info!("Test event emitted successfully");
            Ok("Event emitted successfully".to_string())
        }
        Err(e) => {
            tracing::error!("Failed to emit test event: {}", e);
            Err(AppError::Custom(format!("Failed to emit event: {}", e)))
        }
    }
}

#[tauri::command]
pub async fn library_set_project_root(
    path: String,
    state: State<'_, LibraryState>,
) -> Result<Project, AppError> {
    tracing::info!("library_set_project_root called with path: {}", path);
    let root = Path::new(&path);

    if !root.is_dir() {
        tracing::error!("Path is not a valid directory: {}", path);
        return Err(AppError::InvalidProject("Not a valid folder.".to_string()));
    }

    let name = root
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unknown Folder".to_string());

    tracing::info!("Creating/getting project: {} at {}", name, path);
    let project = state.db.get_or_create_project(&path, &name)?;
    tracing::info!("Project created/retrieved with id: {}", project.id);

    {
        let mut settings = state.settings.write();
        settings.project_root = Some(path.clone());
        settings.save()?;
        tracing::info!("Settings saved with project_root: {}", path);
    }

    Ok(project)
}

#[tauri::command]
pub async fn library_set_output_folder(
    path: String,
    state: State<'_, LibraryState>,
) -> Result<(), AppError> {
    let mut settings = state.settings.write();
    settings.output_folder = Some(path);
    settings.save()?;
    Ok(())
}

#[tauri::command]
pub async fn library_get_settings(state: State<'_, LibraryState>) -> Result<LibrarySettingsResponse, AppError> {
    let settings = state.settings.read();
    Ok(LibrarySettingsResponse {
        project_root: settings.project_root.clone(),
        output_folder: settings.output_folder.clone(),
    })
}

#[tauri::command]
pub async fn library_get_current_project(state: State<'_, LibraryState>) -> Result<Option<Project>, AppError> {
    let settings = state.settings.read();

    if let Some(root) = &settings.project_root {
        return state.db.get_project_by_path(root);
    }

    Ok(None)
}

#[tauri::command]
pub async fn library_start_scan(
    project_id: String,
    app_handle: tauri::AppHandle,
    state: State<'_, LibraryState>,
) -> Result<(), AppError> {
    tracing::info!("library_start_scan called for project: {}", project_id);

    // Cancel any existing scan
    if state.is_scan_running() {
        tracing::info!("Cancelling existing scan...");
        state.request_cancel();
        let scan_running = Arc::clone(&state.scan_running);
        tokio::task::spawn_blocking(move || {
            let start = std::time::Instant::now();
            while scan_running.load(std::sync::atomic::Ordering::SeqCst) {
                std::thread::sleep(std::time::Duration::from_millis(50));
                if start.elapsed().as_secs() > 5 {
                    tracing::warn!("Timeout waiting for previous scan to cancel");
                    break;
                }
            }
        })
        .await
        .ok();
    }

    let db = Arc::clone(&state.db);
    let settings = state.settings.read().clone();
    let cancel_flag = Arc::clone(&state.cancel_flag);
    let scan_running = Arc::clone(&state.scan_running);

    state.reset_cancel();
    state.set_scan_running(true);

    tracing::info!("Looking for project with root: {:?}", settings.project_root);
    let project = state
        .db
        .get_project_by_path(settings.project_root.as_deref().unwrap_or(""))?
        .ok_or_else(|| AppError::Custom("Project not found".to_string()))?;

    let root_path = project.root_path.clone();
    let project_id_clone = project_id.clone();
    let ignore_patterns = settings.ignore_patterns.clone();

    // Emit initial event BEFORE spawn_blocking to ensure events work
    tracing::info!("Emitting initial scan event before spawn...");
    if let Err(e) = app_handle.emit(
        "library-scan-progress",
        ScanProgress {
            scanned: 0,
            total: None,
            current_path: "Starting scan...".to_string(),
            phase: "counting".to_string(),
            skipped: None,
            changed: None,
        },
    ) {
        tracing::error!("Failed to emit initial event: {}", e);
    } else {
        tracing::info!("Initial event emitted successfully");
    }

    tracing::info!("Spawning scan task for path: {}", root_path);
    let scan_running_for_cleanup = Arc::clone(&scan_running);
    let app_handle_for_cleanup = app_handle.clone();

    tokio::task::spawn_blocking(move || {
        // Use a panic guard to ensure cleanup happens
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            tracing::info!("Scan task started for: {}", root_path);
            let db_clone = Arc::clone(&db);
            let indexer = Indexer::new(Arc::clone(&db));
            let mut last_refresh = std::time::Instant::now();

            let existing_assets = match db.get_existing_asset_info(&project_id_clone) {
                Ok(map) => {
                    if map.is_empty() {
                        tracing::info!("No existing assets found");
                        None
                    } else {
                        tracing::info!("Found {} existing assets for change detection", map.len());
                        Some(map)
                    }
                }
                Err(e) => {
                    tracing::warn!("Failed to fetch existing assets: {}", e);
                    None
                }
            };

            // Phase 0: Count files
            tracing::info!("Emitting counting phase event...");
            match app_handle.emit(
                "library-scan-progress",
                ScanProgress {
                    scanned: 0,
                    total: None,
                    current_path: "".to_string(),
                    phase: "counting".to_string(),
                    skipped: None,
                    changed: None,
                },
            ) {
                Ok(_) => tracing::info!("Counting event emitted successfully"),
                Err(e) => tracing::error!("Failed to emit counting event: {}", e),
            }

        let cancel_flag_count = Arc::clone(&cancel_flag);
        let total_files = match count_scannable_files(
            Path::new(&root_path),
            &ignore_patterns,
            cancel_flag_count,
            |count| {
                let _ = app_handle.emit(
                    "library-scan-progress",
                    ScanProgress {
                        scanned: count,
                        total: None,
                        current_path: "".to_string(),
                        phase: "counting".to_string(),
                        skipped: None,
                        changed: None,
                    },
                );
            },
        ) {
            Ok(count) => count,
            Err(e) => {
                tracing::error!("Failed to count files: {}", e);
                0
            }
        };

        if cancel_flag.load(std::sync::atomic::Ordering::SeqCst) {
            let _ = app_handle.emit(
                "library-scan-progress",
                ScanProgress {
                    scanned: 0,
                    total: None,
                    current_path: "".to_string(),
                    phase: "cancelled".to_string(),
                    skipped: None,
                    changed: None,
                },
            );
            scan_running.store(false, std::sync::atomic::Ordering::SeqCst);
            return;
        }

        // Phase 1: Index files
        let _ = app_handle.emit(
            "library-scan-progress",
            ScanProgress {
                scanned: 0,
                total: Some(total_files),
                current_path: "".to_string(),
                phase: "indexing".to_string(),
                skipped: None,
                changed: None,
            },
        );

        let cancel_flag_scan = Arc::clone(&cancel_flag);
        let mut final_stats = ScanStats::default();
        let total = scan_files_batch(
            Path::new(&root_path),
            &project_id_clone,
            &ignore_patterns,
            25,
            cancel_flag_scan,
            existing_assets.as_ref(),
            |batch, count, current_path| {
                if let Err(e) = indexer.upsert_batch(&batch) {
                    tracing::error!("Failed to index batch: {}", e);
                }

                let _ = app_handle.emit(
                    "library-scan-progress",
                    ScanProgress {
                        scanned: count,
                        total: Some(total_files),
                        current_path: current_path.to_string(),
                        phase: "indexing".to_string(),
                        skipped: None,
                        changed: None,
                    },
                );

                if last_refresh.elapsed().as_millis() > 200 {
                    let _ = app_handle.emit("library-assets-updated", count);
                    last_refresh = std::time::Instant::now();
                }

                !cancel_flag.load(std::sync::atomic::Ordering::SeqCst)
            },
        );

        if let Ok((_, stats)) = &total {
            final_stats = *stats;
            tracing::info!(
                "Scan complete: {} total files, {} unchanged (skipped), {} new/changed",
                stats.total_files,
                stats.unchanged_skipped,
                stats.new_or_changed
            );
        }

        if cancel_flag.load(std::sync::atomic::Ordering::SeqCst) {
            let _ = app_handle.emit(
                "library-scan-progress",
                ScanProgress {
                    scanned: 0,
                    total: None,
                    current_path: "".to_string(),
                    phase: "cancelled".to_string(),
                    skipped: None,
                    changed: None,
                },
            );
            scan_running.store(false, std::sync::atomic::Ordering::SeqCst);
            return;
        }

        let file_count = total.map(|(count, _)| count).unwrap_or(0) as i64;

        let _ = app_handle.emit("library-assets-updated", file_count);

        // Phase 2: Resolve dependencies
        let _ = app_handle.emit(
            "library-scan-progress",
            ScanProgress {
                scanned: 0,
                total: None,
                current_path: "".to_string(),
                phase: "dependencies".to_string(),
                skipped: Some(final_stats.unchanged_skipped),
                changed: Some(final_stats.new_or_changed),
            },
        );

        let dep_resolver = DependencyResolver::new(Arc::clone(&db_clone));
        let cancel_flag_deps = Arc::clone(&cancel_flag);
        let app_handle_deps = app_handle.clone();
        let stats_for_deps = final_stats;
        if let Err(e) = dep_resolver.resolve_all_for_project_with_progress(
            &project_id_clone,
            cancel_flag_deps,
            |processed, total| {
                let _ = app_handle_deps.emit(
                    "library-scan-progress",
                    ScanProgress {
                        scanned: processed,
                        total: Some(total),
                        current_path: "".to_string(),
                        phase: "dependencies".to_string(),
                        skipped: Some(stats_for_deps.unchanged_skipped),
                        changed: Some(stats_for_deps.new_or_changed),
                    },
                );
            },
        ) {
            tracing::error!("Failed to resolve dependencies: {}", e);
        }

        if cancel_flag.load(std::sync::atomic::Ordering::SeqCst) {
            let _ = app_handle.emit(
                "library-scan-progress",
                ScanProgress {
                    scanned: 0,
                    total: None,
                    current_path: "".to_string(),
                    phase: "cancelled".to_string(),
                    skipped: Some(final_stats.unchanged_skipped),
                    changed: Some(final_stats.new_or_changed),
                },
            );
            scan_running.store(false, std::sync::atomic::Ordering::SeqCst);
            return;
        }

        if let Err(e) = db_clone.update_project_scan_time(&project_id_clone, file_count) {
            tracing::error!("Failed to update project scan time: {}", e);
        }

            let _ = app_handle.emit(
                "library-scan-progress",
                ScanProgress {
                    scanned: file_count as usize,
                    total: Some(final_stats.total_files),
                    current_path: "".to_string(),
                    phase: "complete".to_string(),
                    skipped: Some(final_stats.unchanged_skipped),
                    changed: Some(final_stats.new_or_changed),
                },
            );

            scan_running.store(false, std::sync::atomic::Ordering::SeqCst);
        })); // End of catch_unwind

        // Cleanup on panic
        if result.is_err() {
            tracing::error!("Scan task panicked!");
            scan_running_for_cleanup.store(false, std::sync::atomic::Ordering::SeqCst);
            let _ = app_handle_for_cleanup.emit(
                "library-scan-progress",
                ScanProgress {
                    scanned: 0,
                    total: None,
                    current_path: "".to_string(),
                    phase: "error".to_string(),
                    skipped: None,
                    changed: None,
                },
            );
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn library_cancel_operation(state: State<'_, LibraryState>) -> Result<(), AppError> {
    tracing::info!("Cancel operation requested, scan_running: {}", state.is_scan_running());
    state.request_cancel();
    tracing::info!("Cancel flag set to: {}", state.cancel_flag.load(std::sync::atomic::Ordering::SeqCst));
    Ok(())
}

#[tauri::command]
pub async fn library_get_assets(
    project_id: String,
    search_query: Option<String>,
    asset_types: Option<Vec<String>>,
    page: i64,
    page_size: i64,
    state: State<'_, LibraryState>,
) -> Result<AssetsResponse, AppError> {
    let (assets, total) = state.db.get_assets(
        &project_id,
        search_query.as_deref(),
        asset_types.as_deref(),
        page,
        page_size,
    )?;

    Ok(AssetsResponse { assets, total })
}

#[tauri::command]
pub async fn library_get_asset(id: String, state: State<'_, LibraryState>) -> Result<Asset, AppError> {
    state
        .db
        .get_asset(&id)?
        .ok_or_else(|| AppError::AssetNotFound(id))
}

#[tauri::command]
pub async fn library_get_dependencies(
    asset_id: String,
    state: State<'_, LibraryState>,
) -> Result<Vec<Dependency>, AppError> {
    state.db.get_dependencies(&asset_id)
}

#[tauri::command]
pub async fn library_get_dependents(
    asset_id: String,
    state: State<'_, LibraryState>,
) -> Result<Vec<Dependency>, AppError> {
    state.db.get_dependents(&asset_id)
}

#[tauri::command]
pub async fn library_get_type_counts(
    project_id: String,
    state: State<'_, LibraryState>,
) -> Result<Vec<TypeCount>, AppError> {
    state.db.get_type_counts(&project_id)
}

#[tauri::command]
pub async fn library_export_file(
    asset_id: String,
    dest_folder: String,
    state: State<'_, LibraryState>,
) -> Result<ExportResult, AppError> {
    let asset = state
        .db
        .get_asset(&asset_id)?
        .ok_or_else(|| AppError::AssetNotFound(asset_id))?;

    let exporter = Exporter::new(Arc::clone(&state.db));
    exporter.export_file(&asset, Path::new(&dest_folder))
}

#[tauri::command]
pub async fn library_export_bundle(
    asset_id: String,
    dest_folder: String,
    state: State<'_, LibraryState>,
) -> Result<ExportResult, AppError> {
    let asset = state
        .db
        .get_asset(&asset_id)?
        .ok_or_else(|| AppError::AssetNotFound(asset_id))?;

    let exporter = Exporter::new(Arc::clone(&state.db));
    exporter.export_bundle(&asset, Path::new(&dest_folder), 5)
}

#[tauri::command]
pub async fn library_reveal_in_explorer(path: String) -> Result<(), AppError> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| AppError::Io(e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| AppError::Io(e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(Path::new(&path).parent().unwrap_or(Path::new(&path)))
            .spawn()
            .map_err(|e| AppError::Io(e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn library_get_material_info(
    asset_id: String,
    state: State<'_, LibraryState>,
) -> Result<Option<MaterialInfo>, AppError> {
    let asset = state
        .db
        .get_asset(&asset_id)?
        .ok_or_else(|| AppError::AssetNotFound(asset_id))?;

    if asset.asset_type != "material" {
        return Ok(None);
    }

    Ok(parse_material_file(Path::new(&asset.absolute_path)))
}

#[tauri::command]
pub async fn library_get_model_info(
    asset_id: String,
    state: State<'_, LibraryState>,
) -> Result<Option<ModelInfo>, AppError> {
    let asset = state
        .db
        .get_asset(&asset_id)?
        .ok_or_else(|| AppError::AssetNotFound(asset_id))?;

    if asset.asset_type != "model" {
        return Ok(None);
    }

    Ok(parse_model_info(Path::new(&asset.absolute_path)))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BundlePreview {
    pub root_asset: BundleAssetInfo,
    pub dependencies: Vec<BundleAssetInfo>,
    pub total_size_bytes: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BundleAssetInfo {
    pub id: String,
    pub file_name: String,
    pub relative_path: String,
    pub asset_type: String,
    pub size_bytes: i64,
}

#[tauri::command]
pub async fn library_get_bundle_preview(
    asset_id: String,
    state: State<'_, LibraryState>,
) -> Result<BundlePreview, AppError> {
    let asset = state
        .db
        .get_asset(&asset_id)?
        .ok_or_else(|| AppError::AssetNotFound(asset_id.clone()))?;

    let dep_resolver = DependencyResolver::new(Arc::clone(&state.db));
    let dep_ids = dep_resolver.get_dependency_tree(&asset_id, 5)?;

    let mut dependencies = Vec::new();
    let mut total_size = asset.size_bytes;

    for dep_id in dep_ids {
        if let Some(dep_asset) = state.db.get_asset(&dep_id)? {
            total_size += dep_asset.size_bytes;
            dependencies.push(BundleAssetInfo {
                id: dep_asset.id,
                file_name: dep_asset.file_name,
                relative_path: dep_asset.relative_path,
                asset_type: dep_asset.asset_type,
                size_bytes: dep_asset.size_bytes,
            });
        }
    }

    Ok(BundlePreview {
        root_asset: BundleAssetInfo {
            id: asset.id,
            file_name: asset.file_name,
            relative_path: asset.relative_path,
            asset_type: asset.asset_type,
            size_bytes: asset.size_bytes,
        },
        dependencies,
        total_size_bytes: total_size,
    })
}

#[tauri::command]
pub async fn library_get_thumbnail_base64(
    asset_id: String,
    state: State<'_, LibraryState>,
) -> Result<Option<String>, AppError> {
    let asset = state
        .db
        .get_asset(&asset_id)?
        .ok_or_else(|| AppError::AssetNotFound(asset_id))?;

    // First try thumbnail path
    if let Some(thumb_path) = &asset.thumbnail_path {
        if thumb_path == "TOO_LARGE" {
            return Ok(Some("TOO_LARGE".to_string()));
        }
        if thumb_path == "UNSUPPORTED" {
            return Ok(Some("UNSUPPORTED".to_string()));
        }

        if let Ok(data) = std::fs::read(thumb_path) {
            let base64 = base64_encode(&data);
            let ext = Path::new(thumb_path)
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("png");
            let mime = match ext {
                "jpg" | "jpeg" => "image/jpeg",
                "png" => "image/png",
                "gif" => "image/gif",
                _ => "image/png",
            };
            return Ok(Some(format!("data:{};base64,{}", mime, base64)));
        }
    }

    // For textures, try to load and resize the original
    if asset.asset_type == "texture" {
        let source_path = Path::new(&asset.absolute_path);
        let ext = source_path
            .extension()
            .and_then(|e| e.to_str())
            .map(|s| s.to_lowercase())
            .unwrap_or_default();

        match ext.as_str() {
            "png" | "jpg" | "jpeg" | "tga" | "bmp" | "gif" => {
                if let Ok(img) = image::open(source_path) {
                    let thumb = img.thumbnail(128, 128);
                    let mut buf = std::io::Cursor::new(Vec::new());
                    if thumb.write_to(&mut buf, image::ImageFormat::Png).is_ok() {
                        let base64 = base64_encode(buf.get_ref());
                        return Ok(Some(format!("data:image/png;base64,{}", base64)));
                    }
                }
            }
            "psd" => {
                if let Ok(psd_data) = std::fs::read(source_path) {
                    use std::panic::AssertUnwindSafe;
                    let psd_data_ref = &psd_data;
                    let result = std::panic::catch_unwind(AssertUnwindSafe(|| {
                        psd::Psd::from_bytes(psd_data_ref).ok().and_then(|psd| {
                            let rgba = psd.rgba();
                            let width = psd.width();
                            let height = psd.height();
                            image::RgbaImage::from_raw(width, height, rgba)
                        })
                    }));

                    if let Ok(Some(img)) = result {
                        let dyn_img = image::DynamicImage::ImageRgba8(img);
                        let thumb = dyn_img.thumbnail(128, 128);
                        let mut buf = std::io::Cursor::new(Vec::new());
                        if thumb.write_to(&mut buf, image::ImageFormat::Png).is_ok() {
                            let base64 = base64_encode(buf.get_ref());
                            return Ok(Some(format!("data:image/png;base64,{}", base64)));
                        }
                    }
                }
            }
            _ => {}
        }
    }

    Ok(None)
}

fn base64_encode(data: &[u8]) -> String {
    use base64::Engine;
    base64::engine::general_purpose::STANDARD.encode(data)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThumbnailProgress {
    pub generated: usize,
    pub total: usize,
    pub phase: String,
}

#[tauri::command]
pub async fn library_regenerate_thumbnails(
    project_id: String,
    app_handle: tauri::AppHandle,
    state: State<'_, LibraryState>,
) -> Result<(), AppError> {
    let db = Arc::clone(&state.db);
    let thumb_dir = state.thumbnail_dir()?;
    let cancel_flag = Arc::clone(&state.cancel_flag);

    tokio::task::spawn_blocking(move || {
        let _ = app_handle.emit(
            "library-thumbnail-progress",
            ThumbnailProgress {
                generated: 0,
                total: 0,
                phase: "counting".to_string(),
            },
        );

        if cancel_flag.load(std::sync::atomic::Ordering::SeqCst) {
            let _ = app_handle.emit(
                "library-thumbnail-progress",
                ThumbnailProgress {
                    generated: 0,
                    total: 0,
                    phase: "cancelled".to_string(),
                },
            );
            return;
        }

        if let Err(e) = db.clear_thumbnail_paths(&project_id) {
            tracing::error!("Failed to clear thumbnail paths: {}", e);
        }

        let total = match db.count_thumbnail_assets(&project_id) {
            Ok(count) => count,
            Err(e) => {
                tracing::error!("Failed to count assets: {}", e);
                return;
            }
        };

        if total == 0 {
            let _ = app_handle.emit(
                "library-thumbnail-progress",
                ThumbnailProgress {
                    generated: 0,
                    total: 0,
                    phase: "complete".to_string(),
                },
            );
            return;
        }

        let preview_gen = PreviewGenerator::new(Arc::clone(&db), thumb_dir, 128);
        let mut generated = 0usize;
        let batch_size = 25;

        loop {
            if cancel_flag.load(std::sync::atomic::Ordering::SeqCst) {
                let _ = app_handle.emit(
                    "library-thumbnail-progress",
                    ThumbnailProgress {
                        generated,
                        total,
                        phase: "cancelled".to_string(),
                    },
                );
                return;
            }

            let _ = app_handle.emit(
                "library-thumbnail-progress",
                ThumbnailProgress {
                    generated,
                    total,
                    phase: "generating".to_string(),
                },
            );

            match preview_gen.generate_thumbnails_for_project(&project_id, batch_size) {
                Ok(0) => break,
                Ok(count) => {
                    generated += count;
                    let _ = app_handle.emit("library-assets-updated", 0);
                }
                Err(e) => {
                    tracing::error!("Thumbnail generation error: {}", e);
                    break;
                }
            }
        }

        let _ = app_handle.emit(
            "library-thumbnail-progress",
            ThumbnailProgress {
                generated,
                total,
                phase: "complete".to_string(),
            },
        );
    });

    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelAssetInfo {
    pub id: String,
    pub absolute_path: String,
    pub extension: String,
    pub modified_time: i64,
}

#[tauri::command]
pub async fn library_get_model_assets_for_thumbnails(
    project_id: String,
    state: State<'_, LibraryState>,
) -> Result<Vec<ModelAssetInfo>, AppError> {
    let assets = state.db.get_model_assets(&project_id)?;

    Ok(assets
        .into_iter()
        .map(|a| ModelAssetInfo {
            id: a.id,
            absolute_path: a.absolute_path,
            extension: a.extension,
            modified_time: a.modified_time,
        })
        .collect())
}
