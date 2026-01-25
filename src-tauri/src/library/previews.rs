use crate::library::db::{Asset, Database};
use crate::library::error::AppResult;
use image::{DynamicImage, GenericImageView, RgbaImage, Rgba};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::mpsc;
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialInfo {
    pub shader_name: Option<String>,
    pub textures: Vec<MaterialTexture>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialTexture {
    pub slot_name: String,
    pub texture_guid: Option<String>,
    pub texture_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub vertex_count: Option<u64>,
    pub triangle_count: Option<u64>,
    pub submesh_count: Option<u32>,
    pub has_normals: bool,
    pub has_uvs: bool,
    pub bounds: Option<[f32; 6]>,
}

pub struct PreviewGenerator {
    db: Arc<Database>,
    thumbnail_dir: PathBuf,
    thumbnail_size: u32,
}

impl PreviewGenerator {
    pub fn new(db: Arc<Database>, thumbnail_dir: PathBuf, thumbnail_size: u32) -> Self {
        Self {
            db,
            thumbnail_dir,
            thumbnail_size,
        }
    }

    pub fn generate_thumbnail(&self, asset: &Asset) -> AppResult<Option<String>> {
        match asset.asset_type.as_str() {
            "texture" => self.generate_texture_thumbnail(asset),
            "material" => self.generate_material_thumbnail(asset),
            _ => Ok(None),
        }
    }

    fn generate_texture_thumbnail(&self, asset: &Asset) -> AppResult<Option<String>> {
        let source_path = Path::new(&asset.absolute_path);
        let start_time = std::time::Instant::now();

        // Check file size first - skip very large files (50MB+)
        const MAX_FILE_SIZE: u64 = 50 * 1024 * 1024;
        if let Ok(metadata) = fs::metadata(source_path) {
            if metadata.len() > MAX_FILE_SIZE {
                self.db.update_asset_thumbnail(&asset.id, "TOO_LARGE")?;
                return Ok(Some("TOO_LARGE".to_string()));
            }
        }

        // Check if we support this format
        let extension = source_path
            .extension()
            .map(|e| e.to_string_lossy().to_lowercase())
            .unwrap_or_default();

        let is_psd = extension == "psd";
        if !is_psd {
            match extension.as_str() {
                "png" | "jpg" | "jpeg" | "tga" | "bmp" | "gif" => {}
                _ => return Ok(None),
            }
        }

        // Generate a unique filename
        let thumb_name = format!(
            "{:x}_{}.png",
            md5_hash(&asset.absolute_path),
            asset.modified_time
        );
        let thumb_path = self.thumbnail_dir.join(&thumb_name);

        // Check if thumbnail already exists
        if thumb_path.exists() {
            let thumb_path_str = thumb_path.to_string_lossy().to_string();
            self.db.update_asset_thumbnail(&asset.id, &thumb_path_str)?;
            return Ok(Some(thumb_path_str));
        }

        // Load image with timeout protection (3 seconds max)
        const LOAD_TIMEOUT_SECS: u64 = 3;

        let img = if is_psd {
            match load_psd_with_timeout(source_path, LOAD_TIMEOUT_SECS) {
                Ok(img) => img,
                Err(e) => {
                    tracing::warn!("PSD load failed for {}: {}", asset.absolute_path, e);
                    self.db.update_asset_thumbnail(&asset.id, "UNSUPPORTED")?;
                    return Ok(Some("UNSUPPORTED".to_string()));
                }
            }
        } else {
            match load_image_with_timeout(source_path, LOAD_TIMEOUT_SECS) {
                Ok(img) => img,
                Err(e) => {
                    tracing::warn!("Image load failed for {}: {}", asset.absolute_path, e);
                    self.db.update_asset_thumbnail(&asset.id, "UNSUPPORTED")?;
                    return Ok(Some("UNSUPPORTED".to_string()));
                }
            }
        };

        let (width, height) = img.dimensions();
        let load_time = start_time.elapsed();

        if load_time.as_secs() >= 1 {
            tracing::info!(
                "Slow image load: {}x{} in {:?} - {}",
                width, height, load_time, asset.absolute_path
            );
        }

        if width == 0 || height == 0 {
            self.db.update_asset_thumbnail(&asset.id, "UNSUPPORTED")?;
            return Ok(Some("UNSUPPORTED".to_string()));
        }

        // Skip large images (over 2K resolution)
        const MAX_DIMENSION: u32 = 2048;
        const MAX_PIXELS: u64 = 4_194_304;
        let total_pixels = width as u64 * height as u64;
        if width > MAX_DIMENSION || height > MAX_DIMENSION || total_pixels > MAX_PIXELS {
            tracing::warn!(
                "Image too large to process: {}x{} ({})",
                width, height, asset.absolute_path
            );
            self.db.update_asset_thumbnail(&asset.id, "TOO_LARGE")?;
            return Ok(Some("TOO_LARGE".to_string()));
        }

        let resized = img.thumbnail(self.thumbnail_size, self.thumbnail_size);

        if let Err(e) = resized.save(&thumb_path) {
            tracing::warn!("Failed to save thumbnail {}: {}", thumb_path.display(), e);
            self.db.update_asset_thumbnail(&asset.id, "UNSUPPORTED")?;
            return Ok(Some("UNSUPPORTED".to_string()));
        }

        let thumb_path_str = thumb_path.to_string_lossy().to_string();
        self.db.update_asset_thumbnail(&asset.id, &thumb_path_str)?;

        Ok(Some(thumb_path_str))
    }

    fn generate_material_thumbnail(&self, asset: &Asset) -> AppResult<Option<String>> {
        let mat_info = match parse_material_file(Path::new(&asset.absolute_path)) {
            Some(info) => info,
            None => return Ok(None),
        };

        if mat_info.textures.is_empty() {
            return Ok(None);
        }

        let thumb_name = format!(
            "mat_{:x}_{}.png",
            md5_hash(&asset.absolute_path),
            asset.modified_time
        );
        let thumb_path = self.thumbnail_dir.join(&thumb_name);

        if thumb_path.exists() {
            let thumb_path_str = thumb_path.to_string_lossy().to_string();
            self.db.update_asset_thumbnail(&asset.id, &thumb_path_str)?;
            return Ok(Some(thumb_path_str));
        }

        // Try to find and load the main texture
        let main_texture = mat_info.textures.iter().find(|t| {
            let slot = t.slot_name.to_lowercase();
            slot.contains("albedo") || slot.contains("diffuse") || slot.contains("maintex") || slot.contains("base")
        }).or_else(|| mat_info.textures.first());

        if let Some(tex) = main_texture {
            if let Some(guid) = &tex.texture_guid {
                if let Ok(Some(tex_asset)) = self.db.get_asset_by_guid(&asset.project_id, guid) {
                    if let Ok(Some(thumb)) = self.generate_texture_thumbnail(&tex_asset) {
                        if let Err(e) = fs::copy(&thumb, &thumb_path) {
                            tracing::warn!("Failed to copy material thumbnail: {}", e);
                        } else {
                            let thumb_path_str = thumb_path.to_string_lossy().to_string();
                            self.db.update_asset_thumbnail(&asset.id, &thumb_path_str)?;
                            return Ok(Some(thumb_path_str));
                        }
                    }
                }
            }
        }

        // Create a colored placeholder
        let placeholder = create_material_placeholder(&mat_info, self.thumbnail_size);
        if let Err(e) = placeholder.save(&thumb_path) {
            tracing::warn!("Failed to save material placeholder: {}", e);
            return Ok(None);
        }

        let thumb_path_str = thumb_path.to_string_lossy().to_string();
        self.db.update_asset_thumbnail(&asset.id, &thumb_path_str)?;
        Ok(Some(thumb_path_str))
    }

    pub fn generate_thumbnails_for_project(&self, project_id: &str, limit: i64) -> AppResult<usize> {
        let assets = self.db.get_assets_needing_thumbnails(project_id, limit)?;
        let mut generated = 0;

        for asset in assets {
            match self.generate_thumbnail(&asset) {
                Ok(Some(_)) => generated += 1,
                Ok(None) => {}
                Err(e) => {
                    tracing::warn!("Failed to generate thumbnail for {}: {}", asset.relative_path, e);
                }
            }
        }

        Ok(generated)
    }
}

/// Parse a Unity .mat file to extract texture references
pub fn parse_material_file(path: &Path) -> Option<MaterialInfo> {
    let content = fs::read_to_string(path).ok()?;

    let mut info = MaterialInfo {
        shader_name: None,
        textures: Vec::new(),
    };

    let shader_re = Regex::new(r"m_Shader:\s*\{[^}]*\}").ok()?;
    if let Some(_) = shader_re.find(&content) {
        let name_re = Regex::new(r#"m_Name:\s*([^\n\r]+)"#).ok()?;
        if let Some(cap) = name_re.captures(&content) {
            info.shader_name = Some(cap.get(1)?.as_str().trim().to_string());
        }
    }

    let tex_section_re = Regex::new(r"- (\w+):\s*\n\s*m_Texture:\s*\{[^}]*guid:\s*([a-f0-9]{32})").ok()?;

    for cap in tex_section_re.captures_iter(&content) {
        let slot_name = cap.get(1)?.as_str().to_string();
        let guid = cap.get(2)?.as_str().to_string();

        info.textures.push(MaterialTexture {
            slot_name,
            texture_guid: Some(guid),
            texture_path: None,
        });
    }

    let tex_name_re = Regex::new(r"- (\w+):\s*\n\s*m_Texture:").ok()?;
    for cap in tex_name_re.captures_iter(&content) {
        let slot_name = cap.get(1)?.as_str().to_string();
        if !info.textures.iter().any(|t| t.slot_name == slot_name) {
            info.textures.push(MaterialTexture {
                slot_name,
                texture_guid: None,
                texture_path: None,
            });
        }
    }

    Some(info)
}

/// Parse basic model info from supported formats
pub fn parse_model_info(path: &Path) -> Option<ModelInfo> {
    let extension = path.extension()?.to_str()?.to_lowercase();

    match extension.as_str() {
        "obj" => parse_obj_info(path),
        "gltf" | "glb" => parse_gltf_info(path),
        "fbx" => parse_fbx_info(path),
        "dae" => parse_dae_info(path),
        "blend" => Some(ModelInfo {
            vertex_count: None,
            triangle_count: None,
            submesh_count: None,
            has_normals: true,
            has_uvs: true,
            bounds: None,
        }),
        _ => None,
    }
}

fn parse_fbx_info(path: &Path) -> Option<ModelInfo> {
    let data = fs::read(path).ok()?;
    let is_binary = data.len() > 20 && &data[0..18] == b"Kaydara FBX Binary";

    if is_binary {
        let mut vertex_count = None;
        let mut polygon_count = None;
        let data_str = String::from_utf8_lossy(&data);

        if data_str.contains("Vertices") {
            let estimated_verts = (data.len() / 50) as u64;
            vertex_count = Some(estimated_verts.min(1_000_000));
        }

        if data_str.contains("PolygonVertexIndex") {
            let estimated_polys = (data.len() / 150) as u64;
            polygon_count = Some(estimated_polys.min(500_000));
        }

        Some(ModelInfo {
            vertex_count,
            triangle_count: polygon_count,
            submesh_count: None,
            has_normals: data_str.contains("Normals"),
            has_uvs: data_str.contains("UV"),
            bounds: None,
        })
    } else {
        let content = String::from_utf8_lossy(&data);
        let mut vertex_count = 0u64;
        let mut has_normals = false;
        let mut has_uvs = false;

        for line in content.lines() {
            let line = line.trim();
            if line.starts_with("Vertices:") {
                if let Some(rest) = line.strip_prefix("Vertices: *") {
                    if let Some(count_str) = rest.split_whitespace().next() {
                        if let Ok(count) = count_str.parse::<u64>() {
                            vertex_count = count / 3;
                        }
                    }
                }
            }
            if line.contains("Normals:") || line.contains("LayerElementNormal") {
                has_normals = true;
            }
            if line.contains("UV:") || line.contains("LayerElementUV") {
                has_uvs = true;
            }
        }

        Some(ModelInfo {
            vertex_count: if vertex_count > 0 { Some(vertex_count) } else { None },
            triangle_count: None,
            submesh_count: None,
            has_normals,
            has_uvs,
            bounds: None,
        })
    }
}

fn parse_dae_info(path: &Path) -> Option<ModelInfo> {
    let content = fs::read_to_string(path).ok()?;

    let mut vertex_count = 0u64;
    let mut triangle_count = 0u64;
    let has_normals = content.contains("<source") && content.contains("NORMAL");
    let has_uvs = content.contains("TEXCOORD");

    let pos_re = regex::Regex::new(r#"positions-array"?\s+count="(\d+)""#).ok()?;
    if let Some(cap) = pos_re.captures(&content) {
        if let Ok(count) = cap.get(1)?.as_str().parse::<u64>() {
            vertex_count = count / 3;
        }
    }

    let tri_re = regex::Regex::new(r#"<triangles[^>]*count="(\d+)""#).ok()?;
    for cap in tri_re.captures_iter(&content) {
        if let Ok(count) = cap.get(1).map(|m| m.as_str()).unwrap_or("0").parse::<u64>() {
            triangle_count += count;
        }
    }

    Some(ModelInfo {
        vertex_count: if vertex_count > 0 { Some(vertex_count) } else { None },
        triangle_count: if triangle_count > 0 { Some(triangle_count) } else { None },
        submesh_count: None,
        has_normals,
        has_uvs,
        bounds: None,
    })
}

fn parse_obj_info(path: &Path) -> Option<ModelInfo> {
    let content = fs::read_to_string(path).ok()?;

    let mut vertex_count = 0u64;
    let mut face_count = 0u64;
    let mut has_normals = false;
    let mut has_uvs = false;

    for line in content.lines() {
        let line = line.trim();
        if line.starts_with("v ") {
            vertex_count += 1;
        } else if line.starts_with("f ") {
            let parts: Vec<&str> = line.split_whitespace().skip(1).collect();
            if parts.len() >= 3 {
                face_count += (parts.len() - 2) as u64;
            }
        } else if line.starts_with("vn ") {
            has_normals = true;
        } else if line.starts_with("vt ") {
            has_uvs = true;
        }
    }

    Some(ModelInfo {
        vertex_count: Some(vertex_count),
        triangle_count: Some(face_count),
        submesh_count: Some(1),
        has_normals,
        has_uvs,
        bounds: None,
    })
}

fn parse_gltf_info(path: &Path) -> Option<ModelInfo> {
    let extension = path.extension()?.to_str()?;

    if extension == "glb" {
        let metadata = fs::metadata(path).ok()?;
        if metadata.len() > 0 {
            return Some(ModelInfo {
                vertex_count: None,
                triangle_count: None,
                submesh_count: None,
                has_normals: true,
                has_uvs: true,
                bounds: None,
            });
        }
    } else {
        let content = fs::read_to_string(path).ok()?;
        if content.contains("\"meshes\"") {
            return Some(ModelInfo {
                vertex_count: None,
                triangle_count: None,
                submesh_count: None,
                has_normals: true,
                has_uvs: true,
                bounds: None,
            });
        }
    }

    None
}

fn create_material_placeholder(info: &MaterialInfo, size: u32) -> RgbaImage {
    let mut img = RgbaImage::new(size, size);

    let has_normal = info.textures.iter().any(|t| {
        let s = t.slot_name.to_lowercase();
        s.contains("normal") || s.contains("bump")
    });
    let has_metallic = info.textures.iter().any(|t| {
        let s = t.slot_name.to_lowercase();
        s.contains("metallic") || s.contains("specular")
    });
    let has_emission = info.textures.iter().any(|t| t.slot_name.to_lowercase().contains("emission"));

    for y in 0..size {
        for x in 0..size {
            let fx = x as f32 / size as f32;
            let fy = y as f32 / size as f32;

            let cx = fx - 0.5;
            let cy = fy - 0.5;
            let dist = (cx * cx + cy * cy).sqrt();

            if dist < 0.45 {
                let shade = 1.0 - (dist / 0.45);
                let highlight = if cx + cy < -0.2 { 0.3 } else { 0.0 };

                let r = if has_emission { 200 } else { 100 };
                let g = if has_metallic { 120 } else { 100 };
                let b = if has_normal { 140 } else { 120 };

                let r = ((r as f32 * shade + highlight * 255.0).min(255.0)) as u8;
                let g = ((g as f32 * shade + highlight * 255.0).min(255.0)) as u8;
                let b = ((b as f32 * shade + highlight * 255.0).min(255.0)) as u8;

                img.put_pixel(x, y, Rgba([r, g, b, 255]));
            } else {
                img.put_pixel(x, y, Rgba([30, 30, 35, 255]));
            }
        }
    }

    img
}

fn md5_hash(input: &str) -> u64 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    input.hash(&mut hasher);
    hasher.finish()
}

fn load_image_with_timeout(path: &Path, timeout_secs: u64) -> Result<DynamicImage, String> {
    let path_owned = path.to_path_buf();
    let (tx, rx) = mpsc::channel();

    std::thread::spawn(move || {
        let result = image::open(&path_owned);
        let _ = tx.send(result);
    });

    match rx.recv_timeout(Duration::from_secs(timeout_secs)) {
        Ok(Ok(img)) => Ok(img),
        Ok(Err(e)) => Err(format!("Image load error: {}", e)),
        Err(_) => Err("Image load timed out".to_string()),
    }
}

fn load_psd_with_timeout(path: &Path, timeout_secs: u64) -> Result<DynamicImage, String> {
    let path_owned = path.to_path_buf();
    let (tx, rx) = mpsc::channel();

    std::thread::spawn(move || {
        use std::panic::AssertUnwindSafe;

        let result = match std::fs::read(&path_owned) {
            Ok(data) => {
                let data_ref = &data;
                let psd_result = std::panic::catch_unwind(AssertUnwindSafe(|| {
                    psd::Psd::from_bytes(data_ref).ok().and_then(|psd| {
                        let rgba = psd.rgba();
                        let width = psd.width();
                        let height = psd.height();
                        image::RgbaImage::from_raw(width, height, rgba)
                    })
                }));

                match psd_result {
                    Ok(Some(img)) => Ok(DynamicImage::ImageRgba8(img)),
                    Ok(None) => Err("Failed to parse PSD".to_string()),
                    Err(_) => Err("PSD parsing panicked".to_string()),
                }
            }
            Err(e) => Err(format!("Failed to read file: {}", e)),
        };
        let _ = tx.send(result);
    });

    match rx.recv_timeout(Duration::from_secs(timeout_secs)) {
        Ok(result) => result,
        Err(_) => Err("PSD load timed out".to_string()),
    }
}
