export type AssetType =
  | 'texture'
  | 'model'
  | 'material'
  | 'prefab'
  | 'audio'
  | 'video'
  | 'shader'
  | 'scene'
  | 'scriptable_object'
  | 'animation'
  | 'script'
  | 'document'
  | 'unknown';

export const ASSET_TYPE_INFO: Record<AssetType, { label: string; icon: string; color: string }> = {
  texture: { label: 'Textures', icon: '🖼️', color: '#4CAF50' },
  model: { label: 'Models', icon: '📦', color: '#2196F3' },
  material: { label: 'Materials', icon: '🎨', color: '#9C27B0' },
  prefab: { label: 'Prefabs', icon: '🧩', color: '#FF9800' },
  audio: { label: 'Audio', icon: '🔊', color: '#E91E63' },
  video: { label: 'Video', icon: '🎬', color: '#673AB7' },
  shader: { label: 'Shaders', icon: '✨', color: '#00BCD4' },
  scene: { label: 'Scenes', icon: '🎭', color: '#FF5722' },
  scriptable_object: { label: 'Scriptable Objects', icon: '📋', color: '#795548' },
  animation: { label: 'Animations', icon: '🎞️', color: '#FFC107' },
  script: { label: 'Scripts', icon: '📜', color: '#607D8B' },
  document: { label: 'Documents', icon: '📄', color: '#9E9E9E' },
  unknown: { label: 'Other', icon: '❓', color: '#757575' },
};

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

// Model information from backend
export interface ModelInfo {
  vertex_count: number | null;
  triangle_count: number | null;
  submesh_count: number | null;
  has_normals: boolean;
  has_uvs: boolean;
  bounds: [number, number, number, number, number, number] | null;
}

// Material texture slot
export interface MaterialTexture {
  slot_name: string;
  texture_guid: string | null;
  texture_path: string | null;
}

// Material information from backend
export interface MaterialInfo {
  shader_name: string | null;
  textures: MaterialTexture[];
}

// Bundle asset info
export interface BundleAssetInfo {
  id: string;
  file_name: string;
  relative_path: string;
  asset_type: string;
  size_bytes: number;
}

// Bundle preview from backend
export interface BundlePreview {
  root_asset: BundleAssetInfo;
  dependencies: BundleAssetInfo[];
  total_size_bytes: number;
}

// Dependency relation
export interface Dependency {
  id: string;
  from_asset_id: string;
  to_asset_id: string | null;
  to_guid: string;
}
