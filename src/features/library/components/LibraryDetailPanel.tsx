import { useLibraryStore, type LocalAsset } from '../hooks/useLibraryStore';
import { useTheme } from '@/stores/themeStore';
import {
  ASSET_TYPE_INFO,
  formatFileSize,
  formatDate,
  formatNumber,
  type ModelInfo,
  type MaterialInfo,
  type BundlePreview,
  type Dependency,
} from '../types';
import { open as openPath } from '@tauri-apps/plugin-shell';
import { invoke } from '@tauri-apps/api/core';
import { ModelPreview } from './ModelPreview';
import { AudioPlayer } from './AudioPlayer';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useState, useEffect, useCallback, useRef } from 'react';

const MIN_PANEL_WIDTH = 280;
const MAX_PANEL_WIDTH = 600;
const DEFAULT_PANEL_WIDTH = 380;

export function LibraryDetailPanel() {
  const theme = useTheme();
  const { selectedAsset, selectAsset, filteredAssets } = useLibraryStore();
  const [copied, setCopied] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  // Extended info states
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [materialInfo, setMaterialInfo] = useState<MaterialInfo | null>(null);
  const [bundlePreview, setBundlePreview] = useState<BundlePreview | null>(null);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [dependents, setDependents] = useState<Dependency[]>([]);
  const [showBundleDetails, setShowBundleDetails] = useState(false);

  const resizeRef = useRef<HTMLDivElement>(null);

  // Load extended info when asset changes
  useEffect(() => {
    if (!selectedAsset) {
      setModelInfo(null);
      setMaterialInfo(null);
      setBundlePreview(null);
      setDependencies([]);
      setDependents([]);
      return;
    }

    // Load model info
    if (selectedAsset.assetType === 'model') {
      invoke<ModelInfo | null>('library_get_model_info', { assetId: selectedAsset.id })
        .then(setModelInfo)
        .catch(() => setModelInfo(null));
    } else {
      setModelInfo(null);
    }

    // Load material info
    if (selectedAsset.assetType === 'material') {
      invoke<MaterialInfo | null>('library_get_material_info', { assetId: selectedAsset.id })
        .then(setMaterialInfo)
        .catch(() => setMaterialInfo(null));
    } else {
      setMaterialInfo(null);
    }

    // Load bundle preview
    invoke<BundlePreview>('library_get_bundle_preview', { assetId: selectedAsset.id })
      .then(setBundlePreview)
      .catch(() => setBundlePreview(null));

    // Load dependencies
    invoke<Dependency[]>('library_get_dependencies', { assetId: selectedAsset.id })
      .then(setDependencies)
      .catch(() => setDependencies([]));

    // Load dependents
    invoke<Dependency[]>('library_get_dependents', { assetId: selectedAsset.id })
      .then(setDependents)
      .catch(() => setDependents([]));

  }, [selectedAsset?.id]);

  // Resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      setPanelWidth(Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (!selectedAsset) return null;

  const typeInfo = ASSET_TYPE_INFO[selectedAsset.assetType];

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(selectedAsset.path);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenFolder = async () => {
    try {
      const folderPath = selectedAsset.path.replace(/[\\/][^\\/]+$/, '');
      await openPath(folderPath);
    } catch (err) {
      console.error('Failed to open folder:', err);
    }
  };

  const handleOpenFile = async () => {
    try {
      await openPath(selectedAsset.path);
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  };

  const navigateToAsset = (assetId: string | null) => {
    if (!assetId) return;
    const asset = filteredAssets.find(a => a.id === assetId);
    if (asset) {
      selectAsset(asset);
    }
  };

  const getAssetName = (assetId: string | null): string => {
    if (!assetId) return 'Unresolved';
    const asset = filteredAssets.find(a => a.id === assetId);
    return asset?.name ?? 'Unknown';
  };

  const isModel = ['fbx', 'obj', 'gltf', 'glb', 'stl', 'dae', 'blend'].includes(selectedAsset.extension.toLowerCase());
  const isAudio = selectedAsset.assetType === 'audio';
  const isImage = selectedAsset.thumbnailUrl !== null;
  const isVideo = selectedAsset.assetType === 'video';

  return (
    <div style={{
      width: panelWidth,
      minWidth: MIN_PANEL_WIDTH,
      maxWidth: MAX_PANEL_WIDTH,
      borderLeft: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.card,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Resize Handle */}
      <div
        ref={resizeRef}
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          cursor: 'ew-resize',
          backgroundColor: isResizing ? theme.colors.primary : 'transparent',
          transition: 'background-color 0.15s',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          if (!isResizing) {
            (e.target as HTMLDivElement).style.backgroundColor = theme.colors.border;
          }
        }}
        onMouseLeave={(e) => {
          if (!isResizing) {
            (e.target as HTMLDivElement).style.backgroundColor = 'transparent';
          }
        }}
      />

      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 14,
          fontWeight: 600,
          color: theme.colors.text,
        }}>
          Details
        </span>
        <button
          onClick={() => selectAsset(null)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            color: theme.colors.textMuted,
            padding: 4,
          }}
        >
          X
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        {/* Preview */}
        <div style={{
          backgroundColor: theme.colors.background,
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          {isModel ? (
            <div style={{ height: Math.min(panelWidth - 32, 320) }}>
              <ModelPreview
                filePath={selectedAsset.path}
                extension={selectedAsset.extension}
              />
            </div>
          ) : isAudio ? (
            <AudioPlayer
              filePath={selectedAsset.path}
              fileName={selectedAsset.name}
            />
          ) : isImage ? (
            <div style={{
              height: Math.min(panelWidth - 32, 240),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.background,
            }}>
              <img
                src={selectedAsset.thumbnailUrl!}
                alt={selectedAsset.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : isVideo ? (
            <div style={{
              height: Math.min(panelWidth - 32, 240),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000',
            }}>
              <video
                src={convertFileSrc(selectedAsset.path)}
                controls
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
              />
            </div>
          ) : (
            <div style={{
              height: 120,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 48 }}>{typeInfo.icon}</span>
              <span style={{
                fontSize: 12,
                color: theme.colors.textMuted,
                textTransform: 'uppercase',
              }}>
                .{selectedAsset.extension}
              </span>
            </div>
          )}
        </div>

        {/* File name */}
        <div>
          <div style={{
            fontSize: 16,
            fontWeight: 600,
            color: theme.colors.text,
            wordBreak: 'break-word',
          }}>
            {selectedAsset.name}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 4,
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              backgroundColor: `${typeInfo.color}22`,
              color: typeInfo.color,
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 500,
            }}>
              {typeInfo.icon} {typeInfo.label}
            </span>
          </div>
        </div>

        {/* File info */}
        <DetailSection title="File Info" theme={theme}>
          <DetailRow label="Size" value={selectedAsset.size > 0 ? formatFileSize(selectedAsset.size) : 'Unknown'} theme={theme} />
          <DetailRow label="Modified" value={formatDate(selectedAsset.modifiedTime)} theme={theme} />
          <DetailRow label="Extension" value={`.${selectedAsset.extension}`} theme={theme} />
          {/* Model Stats integrated into File Info */}
          {modelInfo && (
            <>
              <div style={{ height: 8 }} />
              {modelInfo.vertex_count !== null && (
                <DetailRow label="Vertices" value={formatNumber(modelInfo.vertex_count)} theme={theme} />
              )}
              {modelInfo.triangle_count !== null && (
                <DetailRow label="Triangles" value={formatNumber(modelInfo.triangle_count)} theme={theme} />
              )}
              {modelInfo.submesh_count !== null && (
                <DetailRow label="Submeshes" value={String(modelInfo.submesh_count)} theme={theme} />
              )}
              <DetailRow label="Normals" value={modelInfo.has_normals ? 'Yes' : 'No'} theme={theme} />
              <DetailRow label="UVs" value={modelInfo.has_uvs ? 'Yes' : 'No'} theme={theme} />
            </>
          )}
        </DetailSection>

        {/* Material Info */}
        {materialInfo && (
          <DetailSection title="Material Textures" theme={theme}>
            {materialInfo.shader_name && (
              <DetailRow label="Shader" value={materialInfo.shader_name} theme={theme} />
            )}
            {materialInfo.textures.length > 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                marginTop: 8,
              }}>
                {materialInfo.textures.map((tex, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 8px',
                    backgroundColor: theme.colors.background,
                    borderRadius: 4,
                  }}>
                    <span style={{
                      fontSize: 11,
                      color: theme.colors.textMuted,
                      textTransform: 'capitalize',
                    }}>
                      {tex.slot_name.replace(/_/g, ' ')}
                    </span>
                    {tex.texture_guid ? (
                      <span
                        onClick={() => {
                          const texAsset = filteredAssets.find(a =>
                            a.id.includes(tex.texture_guid!) ||
                            a.path.includes(tex.texture_guid!)
                          );
                          if (texAsset) selectAsset(texAsset);
                        }}
                        style={{
                          fontSize: 11,
                          color: theme.colors.primary,
                          cursor: 'pointer',
                          fontFamily: 'monospace',
                        }}
                      >
                        {tex.texture_guid.substring(0, 8)}...
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: theme.colors.textMuted, opacity: 0.5 }}>None</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: theme.colors.textMuted }}>No textures found</div>
            )}
          </DetailSection>
        )}

        {/* Bundle Preview */}
        {bundlePreview && bundlePreview.dependencies.length > 0 && (
          <DetailSection
            title={`Bundle Contents (${bundlePreview.dependencies.length + 1} files)`}
            theme={theme}
            collapsible
            collapsed={!showBundleDetails}
            onToggle={() => setShowBundleDetails(!showBundleDetails)}
          >
            <DetailRow
              label="Total Size"
              value={formatFileSize(bundlePreview.total_size_bytes)}
              theme={theme}
            />
            {showBundleDetails && (
              <div style={{
                marginTop: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}>
                {/* Root asset */}
                <BundleItem
                  name={bundlePreview.root_asset.file_name}
                  type={bundlePreview.root_asset.asset_type}
                  size={bundlePreview.root_asset.size_bytes}
                  isRoot
                  theme={theme}
                />
                {/* Dependencies */}
                {bundlePreview.dependencies.map((dep) => (
                  <BundleItem
                    key={dep.id}
                    name={dep.file_name}
                    type={dep.asset_type}
                    size={dep.size_bytes}
                    onClick={() => navigateToAsset(dep.id)}
                    theme={theme}
                  />
                ))}
              </div>
            )}
          </DetailSection>
        )}

        {/* Dependencies */}
        {dependencies.length > 0 && (
          <DetailSection title={`Dependencies (${dependencies.length})`} theme={theme}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {dependencies.map((dep) => (
                <div
                  key={dep.id}
                  onClick={() => navigateToAsset(dep.to_asset_id)}
                  style={{
                    padding: '6px 8px',
                    backgroundColor: theme.colors.background,
                    borderRadius: 4,
                    fontSize: 12,
                    color: dep.to_asset_id ? theme.colors.primary : theme.colors.textMuted,
                    cursor: dep.to_asset_id ? 'pointer' : 'default',
                    opacity: dep.to_asset_id ? 1 : 0.6,
                  }}
                >
                  {getAssetName(dep.to_asset_id)}
                  {!dep.to_asset_id && (
                    <span style={{ fontSize: 10, marginLeft: 4, fontFamily: 'monospace' }}>
                      ({dep.to_guid.substring(0, 8)}...)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Used By */}
        {dependents.length > 0 && (
          <DetailSection title={`Used By (${dependents.length})`} theme={theme}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {dependents.map((dep) => (
                <div
                  key={dep.id}
                  onClick={() => navigateToAsset(dep.from_asset_id)}
                  style={{
                    padding: '6px 8px',
                    backgroundColor: theme.colors.background,
                    borderRadius: 4,
                    fontSize: 12,
                    color: theme.colors.primary,
                    cursor: 'pointer',
                  }}
                >
                  {getAssetName(dep.from_asset_id)}
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Path */}
        <div>
          <div style={{
            fontSize: 12,
            color: theme.colors.textMuted,
            marginBottom: 6,
          }}>
            Full Path
          </div>
          <div style={{
            padding: 12,
            backgroundColor: theme.colors.background,
            borderRadius: 8,
            fontSize: 11,
            color: theme.colors.text,
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            lineHeight: 1.5,
          }}>
            {selectedAsset.path}
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <button
            onClick={handleCopyPath}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              backgroundColor: copied ? theme.colors.success : theme.colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {copied ? 'Copied!' : 'Copy Path'}
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleOpenFolder}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 16px',
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 6,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Open Folder
            </button>

            <button
              onClick={handleOpenFile}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 16px',
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 6,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Open File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
  theme: { colors: Record<string, string> };
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}

function DetailSection({ title, children, theme, collapsible, collapsed, onToggle }: DetailSectionProps) {
  return (
    <div style={{
      padding: 12,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
    }}>
      <div
        onClick={collapsible ? onToggle : undefined}
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: theme.colors.text,
          marginBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: collapsible ? 'pointer' : 'default',
        }}
      >
        <span>{title}</span>
        {collapsible && (
          <span style={{ fontSize: 10, color: theme.colors.textMuted }}>
            {collapsed ? '>' : 'v'}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  theme: { colors: Record<string, string> };
}

function DetailRow({ label, value, theme }: DetailRowProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 13,
      marginBottom: 4,
    }}>
      <span style={{ color: theme.colors.textMuted }}>{label}</span>
      <span style={{ color: theme.colors.text }}>{value}</span>
    </div>
  );
}

interface BundleItemProps {
  name: string;
  type: string;
  size: number;
  isRoot?: boolean;
  onClick?: () => void;
  theme: { colors: Record<string, string> };
}

function BundleItem({ name, type, size, isRoot, onClick, theme }: BundleItemProps) {
  const typeInfo = ASSET_TYPE_INFO[type as keyof typeof ASSET_TYPE_INFO] || ASSET_TYPE_INFO.unknown;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        backgroundColor: isRoot ? `${theme.colors.primary}15` : theme.colors.card,
        borderRadius: 4,
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: isRoot ? `3px solid ${theme.colors.primary}` : 'none',
      }}
    >
      <span style={{ fontSize: 14 }}>{typeInfo.icon}</span>
      <span style={{
        flex: 1,
        fontSize: 11,
        color: theme.colors.text,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {name}
      </span>
      <span style={{
        fontSize: 10,
        color: theme.colors.textMuted,
      }}>
        {formatFileSize(size)}
      </span>
    </div>
  );
}
