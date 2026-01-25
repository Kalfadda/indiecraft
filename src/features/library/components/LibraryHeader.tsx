import { useState, useEffect, useRef } from 'react';
import { useLibraryStore } from '../hooks/useLibraryStore';
import { useTheme } from '@/stores/themeStore';
import { open } from '@tauri-apps/plugin-dialog';

export function LibraryHeader() {
  const theme = useTheme();
  const {
    folderName,
    rootPath,
    searchQuery,
    setSearchQuery,
    setRootPath,
    isLoading,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    sortOrder,
    rescan,
    cancelScan,
    scanProgress,
  } = useLibraryStore();

  const [localSearch, setLocalSearch] = useState<string>(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localSearch, setSearchQuery]);

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Asset Folder',
      });

      if (selected && typeof selected === 'string') {
        setRootPath(selected);
      }
    } catch (err) {
      console.error('Failed to open folder dialog:', err);
    }
  };

  return (
    <div style={{
      backgroundColor: theme.colors.card,
      borderBottom: `1px solid ${theme.colors.border}`,
    }}>
      {/* Main header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
      }}>
        {/* Folder selector */}
        <button
          onClick={handleSelectFolder}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            backgroundColor: theme.colors.primary,
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          📁 {folderName || 'Select Folder'}
        </button>

        {/* Search */}
        <div style={{
          flex: 1,
          position: 'relative',
        }}>
          <input
            type="text"
            placeholder="Search assets..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 6,
              fontSize: 13,
              outline: 'none',
            }}
          />
          <span style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 14,
            color: theme.colors.textMuted,
          }}>
            🔍
          </span>
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                fontSize: 14,
                color: theme.colors.textMuted,
                cursor: 'pointer',
                padding: 4,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{
            padding: '8px 12px',
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="name">Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}</option>
          <option value="type">Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}</option>
          <option value="size">Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}</option>
          <option value="date">Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}</option>
        </select>

        {/* View mode toggle */}
        <div style={{
          display: 'flex',
          backgroundColor: theme.colors.background,
          borderRadius: 6,
          border: `1px solid ${theme.colors.border}`,
          overflow: 'hidden',
        }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '8px 12px',
              backgroundColor: viewMode === 'grid' ? theme.colors.primary : 'transparent',
              color: viewMode === 'grid' ? '#fff' : theme.colors.textMuted,
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
            }}
            title="Grid view"
          >
            ⊞
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 12px',
              backgroundColor: viewMode === 'list' ? theme.colors.primary : 'transparent',
              color: viewMode === 'list' ? '#fff' : theme.colors.textMuted,
              border: 'none',
              borderLeft: `1px solid ${theme.colors.border}`,
              cursor: 'pointer',
              fontSize: 14,
            }}
            title="List view"
          >
            ☰
          </button>
        </div>

        {/* Rescan button */}
        {rootPath && (
          <button
            onClick={isLoading ? cancelScan : rescan}
            style={{
              padding: '8px 12px',
              backgroundColor: theme.colors.background,
              color: isLoading ? theme.colors.error : theme.colors.text,
              border: `1px solid ${isLoading ? theme.colors.error : theme.colors.border}`,
              borderRadius: 6,
              fontSize: 14,
              cursor: 'pointer',
            }}
            title={isLoading ? 'Cancel scan' : 'Rescan folder'}
          >
            {isLoading ? '⏹' : '🔄'}
          </button>
        )}
      </div>

      {/* Scan progress */}
      {scanProgress && scanProgress.phase !== 'complete' && scanProgress.phase !== 'cancelled' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          backgroundColor: theme.colors.background,
          borderTop: `1px solid ${theme.colors.border}`,
          fontSize: 12,
        }}>
          <div style={{
            width: 14,
            height: 14,
            border: `2px solid ${theme.colors.primary}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <span style={{ color: theme.colors.textMuted }}>
            {scanProgress.phase === 'counting' && 'Counting files...'}
            {scanProgress.phase === 'indexing' && `Indexing... ${scanProgress.scanned.toLocaleString()}${scanProgress.total ? ` / ${scanProgress.total.toLocaleString()}` : ''} files`}
            {scanProgress.phase === 'dependencies' && `Resolving dependencies... ${scanProgress.scanned.toLocaleString()}${scanProgress.total ? ` / ${scanProgress.total.toLocaleString()}` : ''}`}
            {scanProgress.phase === 'scanning' && `Scanning... ${scanProgress.scanned.toLocaleString()} files found`}
            {scanProgress.phase === 'generating_models' && `Generating model previews... ${scanProgress.scanned.toLocaleString()}${scanProgress.total ? ` / ${scanProgress.total.toLocaleString()}` : ''}`}
          </span>
          {scanProgress.skipped !== undefined && scanProgress.skipped > 0 && (
            <span style={{ color: theme.colors.success, fontSize: 11 }}>
              ({scanProgress.skipped.toLocaleString()} unchanged)
            </span>
          )}
          <span style={{
            color: theme.colors.textMuted,
            opacity: 0.7,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {scanProgress.currentPath}
          </span>
        </div>
      )}
    </div>
  );
}
