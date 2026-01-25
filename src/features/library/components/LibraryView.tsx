import { useEffect } from 'react';
import { useLibraryStore } from '../hooks/useLibraryStore';
import { useTheme } from '@/stores/themeStore';
import { LibraryHeader } from './LibraryHeader';
import { LibraryFilters } from './LibraryFilters';
import { LibraryGrid } from './LibraryGrid';
import { LibraryListView } from './LibraryListView';
import { LibraryDetailPanel } from './LibraryDetailPanel';
import { LibraryEmptyState } from './LibraryEmptyState';

export function LibraryView() {
  const theme = useTheme();
  const {
    rootPath,
    error,
    selectedAsset,
    viewMode,
    initialize,
    cleanup,
  } = useLibraryStore();

  // Initialize backend connection on mount
  useEffect(() => {
    initialize();
    return () => cleanup();
  }, [initialize, cleanup]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
    }}>
      <LibraryHeader />

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: `${theme.colors.error}22`,
          borderBottom: `1px solid ${theme.colors.error}`,
          fontSize: 13,
          color: theme.colors.error,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
      }}>
        {rootPath ? (
          <>
            <LibraryFilters />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {viewMode === 'grid' ? <LibraryGrid /> : <LibraryListView />}
            </div>
            {selectedAsset && <LibraryDetailPanel />}
          </>
        ) : (
          <LibraryEmptyState />
        )}
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
