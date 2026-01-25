import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { AssetType } from '../types';

// Backend types (matching Rust structs)
export interface Project {
  id: string;
  root_path: string;
  name: string;
  last_scan_time: number | null;
  file_count: number;
  created_at: number;
  updated_at: number;
}

export interface BackendAsset {
  id: string;
  project_id: string;
  absolute_path: string;
  relative_path: string;
  file_name: string;
  extension: string;
  asset_type: string;
  size_bytes: number;
  modified_time: number;
  content_hash: string | null;
  unity_guid: string | null;
  import_type: string | null;
  thumbnail_path: string | null;
  created_at: number;
  updated_at: number;
}

export interface TypeCount {
  asset_type: string;
  count: number;
}

export interface ScanProgress {
  scanned: number;
  total: number | null;
  current_path: string;
  phase: string;
  skipped: number | null;
  changed: number | null;
}

export interface ThumbnailProgress {
  generated: number;
  total: number;
  phase: string;
}

interface LibraryBackendState {
  // Project
  project: Project | null;
  isLoading: boolean;
  error: string | null;

  // Assets
  assets: BackendAsset[];
  totalAssets: number;
  page: number;
  pageSize: number;

  // Scanning
  scanProgress: ScanProgress | null;
  thumbnailProgress: ThumbnailProgress | null;

  // Type counts
  typeCounts: TypeCount[];

  // Filters
  searchQuery: string;
  selectedTypes: AssetType[];

  // Selection
  selectedAsset: BackendAsset | null;

  // View options
  viewMode: 'grid' | 'list';
  sortBy: 'name' | 'type' | 'size' | 'date';
  sortOrder: 'asc' | 'desc';

  // Actions
  setProjectRoot: (path: string) => Promise<void>;
  loadProject: () => Promise<void>;
  startScan: () => Promise<void>;
  cancelScan: () => Promise<void>;
  regenerateThumbnails: () => Promise<void>;
  loadAssets: () => Promise<void>;
  loadTypeCounts: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  toggleTypeFilter: (type: AssetType) => void;
  selectAsset: (asset: BackendAsset | null) => void;
  clearFilters: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSortBy: (sortBy: 'name' | 'type' | 'size' | 'date') => void;
  toggleSortOrder: () => void;
  setPage: (page: number) => void;
  setupListeners: () => Promise<() => void>;
}

export const useLibraryBackend = create<LibraryBackendState>((set, get) => ({
  project: null,
  isLoading: false,
  error: null,
  assets: [],
  totalAssets: 0,
  page: 0,
  pageSize: 100,
  scanProgress: null,
  thumbnailProgress: null,
  typeCounts: [],
  searchQuery: '',
  selectedTypes: [],
  selectedAsset: null,
  viewMode: 'grid',
  sortBy: 'name',
  sortOrder: 'asc',

  setProjectRoot: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await invoke<Project>('library_set_project_root', { path });
      set({ project, isLoading: false });
      // Start scanning immediately
      await get().startScan();
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  loadProject: async () => {
    set({ isLoading: true, error: null });
    try {
      const project = await invoke<Project | null>('library_get_current_project');
      set({ project, isLoading: false });
      if (project) {
        await get().loadAssets();
        await get().loadTypeCounts();
      }
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  startScan: async () => {
    const { project } = get();
    if (!project) return;

    set({ scanProgress: { scanned: 0, total: null, current_path: '', phase: 'starting', skipped: null, changed: null } });
    try {
      await invoke('library_start_scan', { projectId: project.id });
    } catch (e) {
      set({ error: String(e), scanProgress: null });
    }
  },

  cancelScan: async () => {
    try {
      await invoke('library_cancel_operation');
    } catch (e) {
      console.error('Failed to cancel scan:', e);
    }
  },

  regenerateThumbnails: async () => {
    const { project } = get();
    if (!project) return;

    set({ thumbnailProgress: { generated: 0, total: 0, phase: 'starting' } });
    try {
      await invoke('library_regenerate_thumbnails', { projectId: project.id });
    } catch (e) {
      set({ error: String(e), thumbnailProgress: null });
    }
  },

  loadAssets: async () => {
    const { project, searchQuery, selectedTypes, page, pageSize } = get();
    if (!project) return;

    set({ isLoading: true });
    try {
      const response = await invoke<{ assets: BackendAsset[]; total: number }>('library_get_assets', {
        projectId: project.id,
        searchQuery: searchQuery || null,
        assetTypes: selectedTypes.length > 0 ? selectedTypes : null,
        page,
        pageSize,
      });
      set({ assets: response.assets, totalAssets: response.total, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  loadTypeCounts: async () => {
    const { project } = get();
    if (!project) return;

    try {
      const counts = await invoke<TypeCount[]>('library_get_type_counts', { projectId: project.id });
      set({ typeCounts: counts });
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

  selectAsset: (asset: BackendAsset | null) => {
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
    const { sortBy, sortOrder } = get();
    const newOrder = newSortBy === sortBy ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc';
    set({ sortBy: newSortBy, sortOrder: newOrder });
  },

  toggleSortOrder: () => {
    const { sortOrder } = get();
    set({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
  },

  setPage: (page: number) => {
    set({ page });
    get().loadAssets();
  },

  setupListeners: async () => {
    const unlistenScan = await listen<ScanProgress>('library-scan-progress', (event) => {
      set({ scanProgress: event.payload });
      if (event.payload.phase === 'complete' || event.payload.phase === 'cancelled') {
        // Reload assets when scan completes
        setTimeout(() => {
          get().loadAssets();
          get().loadTypeCounts();
          set({ scanProgress: null });
        }, 500);
      }
    });

    const unlistenThumbnails = await listen<ThumbnailProgress>('library-thumbnail-progress', (event) => {
      set({ thumbnailProgress: event.payload });
      if (event.payload.phase === 'complete' || event.payload.phase === 'cancelled') {
        setTimeout(() => {
          get().loadAssets();
          set({ thumbnailProgress: null });
        }, 500);
      }
    });

    const unlistenAssetsUpdated = await listen<number>('library-assets-updated', () => {
      // Debounced reload
      get().loadAssets();
      get().loadTypeCounts();
    });

    return () => {
      unlistenScan();
      unlistenThumbnails();
      unlistenAssetsUpdated();
    };
  },
}));
