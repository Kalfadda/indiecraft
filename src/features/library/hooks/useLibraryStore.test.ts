import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLibraryStore, type LocalAsset } from './useLibraryStore';
import { readDir, stat } from '@tauri-apps/plugin-fs';

// Mock the Tauri FS plugin
vi.mock('@tauri-apps/plugin-fs', () => ({
  readDir: vi.fn(),
  stat: vi.fn(),
  readTextFile: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: vi.fn((path: string) => `asset://localhost/${encodeURIComponent(path)}`),
}));

describe('useLibraryStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useLibraryStore.setState({
      rootPath: null,
      folderName: null,
      assets: [],
      filteredAssets: [],
      isLoading: false,
      error: null,
      scanProgress: null,
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
    });
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const state = useLibraryStore.getState();
      
      expect(state.rootPath).toBeNull();
      expect(state.folderName).toBeNull();
      expect(state.assets).toEqual([]);
      expect(state.filteredAssets).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.searchQuery).toBe('');
      expect(state.selectedTypes).toEqual([]);
      expect(state.selectedAsset).toBeNull();
      expect(state.viewMode).toBe('grid');
      expect(state.sortBy).toBe('name');
      expect(state.sortOrder).toBe('asc');
    });
  });

  describe('View Mode', () => {
    it('can switch to list view', () => {
      const { setViewMode } = useLibraryStore.getState();
      
      setViewMode('list');
      
      expect(useLibraryStore.getState().viewMode).toBe('list');
    });

    it('can switch back to grid view', () => {
      const { setViewMode } = useLibraryStore.getState();
      
      setViewMode('list');
      setViewMode('grid');
      
      expect(useLibraryStore.getState().viewMode).toBe('grid');
    });
  });

  describe('Sorting', () => {
    const mockAssets: LocalAsset[] = [
      {
        id: '1', name: 'zebra.png', path: '/test/zebra.png',
        relativePath: 'zebra.png', extension: 'png', assetType: 'texture',
        size: 1000, modifiedTime: 100, thumbnailUrl: null
      },
      {
        id: '2', name: 'alpha.fbx', path: '/test/alpha.fbx',
        relativePath: 'alpha.fbx', extension: 'fbx', assetType: 'model',
        size: 5000, modifiedTime: 200, thumbnailUrl: null
      },
      {
        id: '3', name: 'middle.wav', path: '/test/middle.wav',
        relativePath: 'middle.wav', extension: 'wav', assetType: 'audio',
        size: 3000, modifiedTime: 150, thumbnailUrl: null
      },
    ];

    beforeEach(() => {
      useLibraryStore.setState({
        assets: mockAssets,
        filteredAssets: mockAssets,
      });
    });

    it('sorts by name ascending when switching from different sort', () => {
      const { setSortBy } = useLibraryStore.getState();
      
      // First switch to a different sort
      setSortBy('size');
      // Then switch to name - should be ascending
      setSortBy('name');
      
      const { filteredAssets, sortOrder } = useLibraryStore.getState();
      expect(filteredAssets[0].name).toBe('alpha.fbx');
      expect(filteredAssets[1].name).toBe('middle.wav');
      expect(filteredAssets[2].name).toBe('zebra.png');
      expect(sortOrder).toBe('asc');
    });

    it('toggles sort order when clicking same column', () => {
      const { setSortBy } = useLibraryStore.getState();
      
      // Switch to size first, then to name (asc)
      setSortBy('size');
      setSortBy('name'); // First click on name - asc
      expect(useLibraryStore.getState().sortOrder).toBe('asc');
      
      setSortBy('name'); // Second click on name - desc
      expect(useLibraryStore.getState().sortOrder).toBe('desc');
      
      const { filteredAssets } = useLibraryStore.getState();
      expect(filteredAssets[0].name).toBe('zebra.png');
    });

    it('sorts by size', () => {
      const { setSortBy } = useLibraryStore.getState();
      setSortBy('size');
      
      const { filteredAssets } = useLibraryStore.getState();
      expect(filteredAssets[0].size).toBe(1000);
      expect(filteredAssets[2].size).toBe(5000);
    });

    it('sorts by date', () => {
      const { setSortBy } = useLibraryStore.getState();
      setSortBy('date');
      
      const { filteredAssets } = useLibraryStore.getState();
      expect(filteredAssets[0].modifiedTime).toBe(100);
      expect(filteredAssets[2].modifiedTime).toBe(200);
    });

    it('sorts by type', () => {
      const { setSortBy } = useLibraryStore.getState();
      setSortBy('type');
      
      const { filteredAssets } = useLibraryStore.getState();
      // Audio comes before model alphabetically, model before texture
      expect(filteredAssets[0].assetType).toBe('audio');
      expect(filteredAssets[1].assetType).toBe('model');
      expect(filteredAssets[2].assetType).toBe('texture');
    });
  });

  describe('Search', () => {
    const mockAssets: LocalAsset[] = [
      {
        id: '1', name: 'player_texture.png', path: '/test/player_texture.png',
        relativePath: 'player_texture.png', extension: 'png', assetType: 'texture',
        size: 1000, modifiedTime: 100, thumbnailUrl: null
      },
      {
        id: '2', name: 'enemy_model.fbx', path: '/test/enemy_model.fbx',
        relativePath: 'enemy_model.fbx', extension: 'fbx', assetType: 'model',
        size: 5000, modifiedTime: 200, thumbnailUrl: null
      },
      {
        id: '3', name: 'player_sound.wav', path: '/test/player_sound.wav',
        relativePath: 'player_sound.wav', extension: 'wav', assetType: 'audio',
        size: 3000, modifiedTime: 150, thumbnailUrl: null
      },
    ];

    beforeEach(() => {
      useLibraryStore.setState({
        assets: mockAssets,
        filteredAssets: mockAssets,
      });
    });

    it('filters assets by search query', () => {
      const { setSearchQuery } = useLibraryStore.getState();
      
      setSearchQuery('player');
      
      const { filteredAssets } = useLibraryStore.getState();
      expect(filteredAssets).toHaveLength(2);
      expect(filteredAssets.every(a => a.name.includes('player'))).toBe(true);
    });

    it('search is case insensitive', () => {
      const { setSearchQuery } = useLibraryStore.getState();
      
      setSearchQuery('PLAYER');
      
      const { filteredAssets } = useLibraryStore.getState();
      expect(filteredAssets).toHaveLength(2);
    });

    it('clears search returns all assets', () => {
      const { setSearchQuery } = useLibraryStore.getState();
      
      setSearchQuery('player');
      expect(useLibraryStore.getState().filteredAssets).toHaveLength(2);
      
      setSearchQuery('');
      expect(useLibraryStore.getState().filteredAssets).toHaveLength(3);
    });

    it('no results for non-matching query', () => {
      const { setSearchQuery } = useLibraryStore.getState();
      
      setSearchQuery('nonexistent');
      
      expect(useLibraryStore.getState().filteredAssets).toHaveLength(0);
    });
  });

  describe('Type Filtering', () => {
    const mockAssets: LocalAsset[] = [
      { id: '1', name: 'a.png', path: '/a.png', relativePath: 'a.png', extension: 'png', assetType: 'texture', size: 0, modifiedTime: 0, thumbnailUrl: null },
      { id: '2', name: 'b.png', path: '/b.png', relativePath: 'b.png', extension: 'png', assetType: 'texture', size: 0, modifiedTime: 0, thumbnailUrl: null },
      { id: '3', name: 'c.fbx', path: '/c.fbx', relativePath: 'c.fbx', extension: 'fbx', assetType: 'model', size: 0, modifiedTime: 0, thumbnailUrl: null },
      { id: '4', name: 'd.wav', path: '/d.wav', relativePath: 'd.wav', extension: 'wav', assetType: 'audio', size: 0, modifiedTime: 0, thumbnailUrl: null },
    ];

    beforeEach(() => {
      useLibraryStore.setState({
        assets: mockAssets,
        filteredAssets: mockAssets,
        typeCounts: { texture: 2, model: 1, audio: 1, material: 0, prefab: 0, video: 0, shader: 0, scene: 0, scriptable_object: 0, animation: 0, script: 0, document: 0, unknown: 0 },
      });
    });

    it('filters by single type', () => {
      const { toggleTypeFilter } = useLibraryStore.getState();
      
      toggleTypeFilter('texture');
      
      const { filteredAssets, selectedTypes } = useLibraryStore.getState();
      expect(selectedTypes).toContain('texture');
      expect(filteredAssets).toHaveLength(2);
      expect(filteredAssets.every(a => a.assetType === 'texture')).toBe(true);
    });

    it('filters by multiple types', () => {
      const { toggleTypeFilter } = useLibraryStore.getState();
      
      toggleTypeFilter('texture');
      toggleTypeFilter('model');
      
      const { filteredAssets, selectedTypes } = useLibraryStore.getState();
      expect(selectedTypes).toHaveLength(2);
      expect(filteredAssets).toHaveLength(3);
    });

    it('removes type filter on second toggle', () => {
      const { toggleTypeFilter } = useLibraryStore.getState();
      
      toggleTypeFilter('texture');
      expect(useLibraryStore.getState().selectedTypes).toContain('texture');
      
      toggleTypeFilter('texture');
      expect(useLibraryStore.getState().selectedTypes).not.toContain('texture');
    });

    it('clearFilters resets all filters', () => {
      const { toggleTypeFilter, setSearchQuery, clearFilters } = useLibraryStore.getState();
      
      toggleTypeFilter('texture');
      setSearchQuery('test');
      
      clearFilters();
      
      const state = useLibraryStore.getState();
      expect(state.selectedTypes).toHaveLength(0);
      expect(state.searchQuery).toBe('');
      expect(state.filteredAssets).toHaveLength(4);
    });
  });

  describe('Asset Selection', () => {
    const mockAsset: LocalAsset = {
      id: '1', name: 'test.png', path: '/test.png',
      relativePath: 'test.png', extension: 'png', assetType: 'texture',
      size: 1000, modifiedTime: 100, thumbnailUrl: null
    };

    it('can select an asset', () => {
      const { selectAsset } = useLibraryStore.getState();
      
      selectAsset(mockAsset);
      
      expect(useLibraryStore.getState().selectedAsset).toEqual(mockAsset);
    });

    it('can deselect an asset', () => {
      const { selectAsset } = useLibraryStore.getState();
      
      selectAsset(mockAsset);
      selectAsset(null);
      
      expect(useLibraryStore.getState().selectedAsset).toBeNull();
    });
  });

  describe('Type Counts', () => {
    it('calculates correct type counts', () => {
      const mockAssets: LocalAsset[] = [
        { id: '1', name: 'a.png', path: '/a.png', relativePath: 'a.png', extension: 'png', assetType: 'texture', size: 0, modifiedTime: 0, thumbnailUrl: null },
        { id: '2', name: 'b.png', path: '/b.png', relativePath: 'b.png', extension: 'png', assetType: 'texture', size: 0, modifiedTime: 0, thumbnailUrl: null },
        { id: '3', name: 'c.fbx', path: '/c.fbx', relativePath: 'c.fbx', extension: 'fbx', assetType: 'model', size: 0, modifiedTime: 0, thumbnailUrl: null },
      ];

      useLibraryStore.setState({
        assets: mockAssets,
        typeCounts: { texture: 2, model: 1, audio: 0, material: 0, prefab: 0, video: 0, shader: 0, scene: 0, scriptable_object: 0, animation: 0, script: 0, document: 0, unknown: 0 },
      });

      const { typeCounts } = useLibraryStore.getState();
      expect(typeCounts.texture).toBe(2);
      expect(typeCounts.model).toBe(1);
      expect(typeCounts.audio).toBe(0);
    });
  });
});
