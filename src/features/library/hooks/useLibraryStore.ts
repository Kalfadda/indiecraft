import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { AssetType } from '../types';
import { getThumbnail } from '../services/thumbnailCache';
import { generateAllModelThumbnails } from '../services/modelThumbnailCache';

// Backend types
interface BackendAsset {
  id: string;
  project_id: string;
  absolute_path: string;
  relative_path: string;
  file_name: string;
  extension: string;
  asset_type: string;
  size_bytes: number;
  modified_time: number;
  thumbnail_path: string | null;
}

interface BackendProject {
  id: string;
  root_path: string;
  name: string;
  last_scan_time: number | null;
  file_count: number;
}

interface BackendScanProgress {
  scanned: number;
  total: number | null;
  current_path: string;
  phase: string;
  skipped: number | null;
  changed: number | null;
}

interface BackendTypeCount {
  asset_type: string;
  count: number;
}

// Frontend types (kept for compatibility)
export interface LocalAsset {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  extension: string;
  assetType: AssetType;
  size: number;
  modifiedTime: number;
  thumbnailUrl: string | null;
}

interface ScanProgress {
  scanned: number;
  currentPath: string;
  phase: 'scanning' | 'indexing' | 'dependencies' | 'counting' | 'complete' | 'error' | 'cancelled' | 'generating_models';
  total?: number;
  skipped?: number;
  changed?: number;
}

interface ModelAssetInfo {
  id: string;
  absolute_path: string;
  extension: string;
  modified_time: number;
}

interface LibraryState {
  // Project
  project: BackendProject | null;
  rootPath: string | null;
  folderName: string | null;

  // Assets
  assets: LocalAsset[];
  filteredAssets: LocalAsset[];
  isLoading: boolean;
  error: string | null;
  scanProgress: ScanProgress | null;

  // Pagination
  page: number;
  pageSize: number;
  totalAssets: number;

  // Type counts
  typeCounts: Record<AssetType, number>;

  // Filters
  searchQuery: string;
  selectedTypes: AssetType[];

  // Selection
  selectedAsset: LocalAsset | null;

  // View options
  viewMode: 'grid' | 'list';
  sortBy: 'name' | 'type' | 'size' | 'date';
  sortOrder: 'asc' | 'desc';

  // Lifecycle
  initialized: boolean;
  unlisteners: UnlistenFn[];

  // Actions
  initialize: () => Promise<void>;
  cleanup: () => void;
  testEvent: () => Promise<void>;
  setRootPath: (path: string) => Promise<void>;
  scanFolder: () => Promise<void>;
  cancelScan: () => void;
  loadAssets: () => Promise<void>;
  loadTypeCounts: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  toggleTypeFilter: (type: AssetType) => void;
  selectAsset: (asset: LocalAsset | null) => void;
  clearFilters: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSortBy: (sortBy: 'name' | 'type' | 'size' | 'date') => void;
  toggleSortOrder: () => void;
  setPage: (page: number) => void;
  rescan: () => Promise<void>;
}

// Helper to check if extension is an image type that can be displayed directly
function isDirectImageExtension(ext: string): boolean {
  return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(ext.toLowerCase());
}

// Convert backend asset to frontend LocalAsset
function convertAsset(asset: BackendAsset): LocalAsset {
  let thumbnailUrl: string | null = null;

  // For images, use convertFileSrc for direct display
  if (isDirectImageExtension(asset.extension)) {
    try {
      thumbnailUrl = convertFileSrc(asset.absolute_path);
    } catch {
      thumbnailUrl = null;
    }
  }
  // For backend-generated thumbnails, convert to asset URL
  else if (asset.thumbnail_path && !asset.thumbnail_path.startsWith('TOO_') && !asset.thumbnail_path.startsWith('UNSUPPORTED')) {
    try {
      thumbnailUrl = convertFileSrc(asset.thumbnail_path);
    } catch {
      thumbnailUrl = null;
    }
  }

  return {
    id: asset.id,
    name: asset.file_name,
    path: asset.absolute_path,
    relativePath: asset.relative_path,
    extension: asset.extension,
    assetType: asset.asset_type as AssetType,
    size: asset.size_bytes,
    modifiedTime: asset.modified_time,
    thumbnailUrl,
  };
}

// Convert backend type counts to frontend format
function convertTypeCounts(counts: BackendTypeCount[]): Record<AssetType, number> {
  const result: Record<AssetType, number> = {
    texture: 0, model: 0, material: 0, prefab: 0,
    audio: 0, shader: 0, scene: 0, scriptable_object: 0,
    video: 0, animation: 0, script: 0, document: 0, unknown: 0,
  };

  for (const { asset_type, count } of counts) {
    if (asset_type in result) {
      result[asset_type as AssetType] = count;
    }
  }

  return result;
}

// Client-side sorting and filtering for smoother UX
function applyClientFilters(
  assets: LocalAsset[],
  sortBy: 'name' | 'type' | 'size' | 'date',
  sortOrder: 'asc' | 'desc'
): LocalAsset[] {
  return [...assets].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'type':
        comparison = a.assetType.localeCompare(b.assetType) || a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'date':
        comparison = a.modifiedTime - b.modifiedTime;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  project: null,
  rootPath: null,
  folderName: null,
  assets: [],
  filteredAssets: [],
  isLoading: false,
  error: null,
  scanProgress: null,
  page: 0,
  pageSize: 500,
  totalAssets: 0,
  typeCounts: {
    texture: 0, model: 0, material: 0, prefab: 0,
    audio: 0, shader: 0, scene: 0, scriptable_object: 0,
    video: 0, animation: 0, script: 0, document: 0, unknown: 0,
  },
  searchQuery: '',
  selectedTypes: [],
  selectedAsset: null,
  viewMode: 'grid',
  sortBy: 'name',
  sortOrder: 'asc',
  initialized: false,
  unlisteners: [],

  initialize: async () => {
    if (get().initialized) return;

    console.log('[Library] Initializing event listeners...');

    // Set up event listeners
    const unlisteners: UnlistenFn[] = [];

    // Listen for scan progress
    const unlistenScan = await listen<BackendScanProgress>('library-scan-progress', (event) => {
      const progress = event.payload;
      console.log('[Library] Scan progress:', progress.phase, progress.scanned, progress.current_path);
      set({
        scanProgress: {
          scanned: progress.scanned,
          currentPath: progress.current_path,
          phase: progress.phase as ScanProgress['phase'],
          total: progress.total ?? undefined,
          skipped: progress.skipped ?? undefined,
          changed: progress.changed ?? undefined,
        },
        isLoading: progress.phase !== 'complete' && progress.phase !== 'cancelled' && progress.phase !== 'error',
      });

      if (progress.phase === 'complete') {
        // Load assets first
        get().loadAssets();
        get().loadTypeCounts();

        // Then generate model thumbnails
        const { project } = get();
        if (project) {
          console.log('[Library] Scan complete, generating model thumbnails...');
          set({
            scanProgress: { scanned: 0, currentPath: '', phase: 'generating_models', total: 0 },
            isLoading: true,
          });

          invoke<ModelAssetInfo[]>('library_get_model_assets_for_thumbnails', { projectId: project.id })
            .then((modelAssets) => {
              if (modelAssets.length === 0) {
                console.log('[Library] No model assets to generate thumbnails for');
                set({ scanProgress: null, isLoading: false });
                return;
              }

              console.log(`[Library] Generating thumbnails for ${modelAssets.length} models...`);
              generateAllModelThumbnails(modelAssets, (generated, total) => {
                set({
                  scanProgress: {
                    scanned: generated,
                    currentPath: '',
                    phase: 'generating_models',
                    total,
                  },
                });
              }).then(() => {
                console.log('[Library] Model thumbnail generation complete');
                set({ scanProgress: null, isLoading: false });
                get().loadAssets(); // Refresh to show new thumbnails
              });
            })
            .catch((e) => {
              console.error('[Library] Failed to get model assets:', e);
              set({ scanProgress: null, isLoading: false });
            });
        } else {
          set({ scanProgress: null, isLoading: false });
        }
      } else if (progress.phase === 'cancelled') {
        setTimeout(() => {
          get().loadAssets();
          get().loadTypeCounts();
          set({ scanProgress: null, isLoading: false });
        }, 500);
      }
    });
    unlisteners.push(unlistenScan);
    console.log('[Library] Scan progress listener registered');

    // Listen for asset updates (throttled refreshes during scan)
    const unlistenAssets = await listen<number>('library-assets-updated', () => {
      // Only reload during indexing phase
      const { scanProgress } = get();
      if (scanProgress?.phase === 'indexing') {
        get().loadAssets();
        get().loadTypeCounts();
      }
    });
    unlisteners.push(unlistenAssets);

    set({ unlisteners, initialized: true });

    // Load existing project if any
    try {
      const project = await invoke<BackendProject | null>('library_get_current_project');
      if (project) {
        set({
          project,
          rootPath: project.root_path,
          folderName: project.name,
        });
        await get().loadAssets();
        await get().loadTypeCounts();
      }
    } catch (e) {
      console.error('Failed to load project:', e);
    }
  },

  cleanup: () => {
    const { unlisteners } = get();
    unlisteners.forEach(unlisten => unlisten());
    set({ unlisteners: [], initialized: false });
  },

  testEvent: async () => {
    // Ensure event listeners are set up
    if (!get().initialized) {
      console.log('[Library] Initializing before test...');
      await get().initialize();
    }
    console.log('[Library] Calling library_test_event...');
    try {
      const result = await invoke<string>('library_test_event');
      console.log('[Library] Test event result:', result);
    } catch (e) {
      console.error('[Library] Test event error:', e);
    }
  },

  setRootPath: async (path: string) => {
    // Ensure event listeners are set up before starting scan
    if (!get().initialized) {
      console.log('[Library] Waiting for initialization before scan...');
      await get().initialize();
    }

    const folderName = path.split(/[\\/]/).pop() || path;
    console.log('[Library] Setting root path:', path);
    set({
      isLoading: true,
      error: null,
      selectedAsset: null,
      rootPath: path,
      folderName,
      assets: [],
      filteredAssets: [],
      scanProgress: { scanned: 0, currentPath: '', phase: 'counting' },
    });

    try {
      console.log('[Library] Calling library_set_project_root...');
      const project = await invoke<BackendProject>('library_set_project_root', { path });
      console.log('[Library] Project created:', project.id);
      set({ project });
      // Start the scan after setting the project
      console.log('[Library] Starting scan for project:', project.id);
      await invoke('library_start_scan', { projectId: project.id });
      console.log('[Library] Scan command returned, waiting for events...');
      // Progress updates will come via events
    } catch (e) {
      console.error('[Library] Error:', e);
      set({
        error: e instanceof Error ? e.message : String(e),
        isLoading: false,
        scanProgress: null,
      });
    }
  },

  scanFolder: async () => {
    const { project } = get();
    if (!project) return;

    set({
      isLoading: true,
      error: null,
      scanProgress: { scanned: 0, currentPath: '', phase: 'scanning' },
    });

    try {
      await invoke('library_start_scan', { projectId: project.id });
      // Progress updates will come via events
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : String(e),
        isLoading: false,
        scanProgress: null,
      });
    }
  },

  cancelScan: () => {
    invoke('library_cancel_operation').catch(console.error);
  },

  loadAssets: async () => {
    const { project, searchQuery, selectedTypes, page, pageSize, sortBy, sortOrder } = get();
    if (!project) return;

    try {
      const response = await invoke<{ assets: BackendAsset[]; total: number }>('library_get_assets', {
        projectId: project.id,
        searchQuery: searchQuery || null,
        assetTypes: selectedTypes.length > 0 ? selectedTypes : null,
        page,
        pageSize,
      });

      const assets = response.assets.map(convertAsset);
      const sorted = applyClientFilters(assets, sortBy, sortOrder);

      // Load thumbnails for textures from backend cache (async, non-blocking)
      for (const asset of assets) {
        if (asset.assetType === 'texture' && !asset.thumbnailUrl) {
          const backendAsset = response.assets.find(a => a.id === asset.id);
          if (backendAsset) {
            getThumbnail(asset.id, backendAsset.modified_time).then(thumb => {
              if (thumb && !thumb.startsWith('TOO_') && !thumb.startsWith('UNSUPPORTED')) {
                set(state => ({
                  assets: state.assets.map(a =>
                    a.id === asset.id ? { ...a, thumbnailUrl: thumb } : a
                  ),
                  filteredAssets: state.filteredAssets.map(a =>
                    a.id === asset.id ? { ...a, thumbnailUrl: thumb } : a
                  ),
                }));
              }
            });
          }
        }
      }

      set({
        assets: sorted,
        filteredAssets: sorted,
        totalAssets: response.total,
      });
    } catch (e) {
      console.error('Failed to load assets:', e);
    }
  },

  loadTypeCounts: async () => {
    const { project } = get();
    if (!project) return;

    try {
      const counts = await invoke<BackendTypeCount[]>('library_get_type_counts', { projectId: project.id });
      set({ typeCounts: convertTypeCounts(counts) });
    } catch (e) {
      console.error('Failed to load type counts:', e);
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query, page: 0 });
    get().loadAssets();
  },

  toggleTypeFilter: (type: AssetType) => {
    const { selectedTypes } = get();
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];

    set({ selectedTypes: newTypes, page: 0 });
    get().loadAssets();
  },

  selectAsset: (asset: LocalAsset | null) => {
    set({ selectedAsset: asset });
  },

  clearFilters: () => {
    set({ searchQuery: '', selectedTypes: [], page: 0 });
    get().loadAssets();
  },

  setViewMode: (mode: 'grid' | 'list') => {
    set({ viewMode: mode });
  },

  setSortBy: (newSortBy: 'name' | 'type' | 'size' | 'date') => {
    const { assets, sortBy, sortOrder } = get();
    const newOrder = newSortBy === sortBy ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc';
    const sorted = applyClientFilters(assets, newSortBy, newOrder);
    set({
      sortBy: newSortBy,
      sortOrder: newOrder,
      filteredAssets: sorted,
    });
  },

  toggleSortOrder: () => {
    const { assets, sortBy, sortOrder } = get();
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    const sorted = applyClientFilters(assets, sortBy, newOrder);
    set({ sortOrder: newOrder, filteredAssets: sorted });
  },

  setPage: (page: number) => {
    set({ page });
    get().loadAssets();
  },

  rescan: async () => {
    const { project } = get();
    if (project) {
      set({ assets: [], filteredAssets: [], selectedAsset: null });
      await get().scanFolder();
    }
  },
}));
