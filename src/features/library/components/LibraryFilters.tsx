import { useLibraryStore } from '../hooks/useLibraryStore';
import { useTheme } from '@/stores/themeStore';
import { ASSET_TYPE_INFO, type AssetType } from '../types';

const FILTER_ORDER: AssetType[] = [
  'texture', 'model', 'audio', 'video', 'material',
  'prefab', 'shader', 'scene', 'animation', 'script',
  'scriptable_object', 'document',
];

export function LibraryFilters() {
  const theme = useTheme();
  const {
    typeCounts,
    selectedTypes,
    toggleTypeFilter,
    clearFilters,
    filteredAssets,
    assets,
  } = useLibraryStore();

  // Only show types that have assets
  const availableTypes = FILTER_ORDER.filter(type => typeCounts[type] > 0);

  return (
    <div style={{
      width: 200,
      borderRight: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.card,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Summary */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${theme.colors.border}`,
      }}>
        <div style={{
          fontSize: 24,
          fontWeight: 700,
          color: theme.colors.text,
        }}>
          {filteredAssets.length.toLocaleString()}
        </div>
        <div style={{
          fontSize: 12,
          color: theme.colors.textMuted,
        }}>
          {selectedTypes.length > 0 || filteredAssets.length !== assets.length
            ? `of ${assets.length.toLocaleString()} assets`
            : 'assets found'}
        </div>
      </div>

      {/* Clear filters */}
      {selectedTypes.length > 0 && (
        <button
          onClick={clearFilters}
          style={{
            margin: '8px 12px',
            padding: '8px 12px',
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 6,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          ✕ Clear filters ({selectedTypes.length})
        </button>
      )}

      {/* Type filters */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '8px 0',
      }}>
        <div style={{
          padding: '8px 16px 4px',
          fontSize: 11,
          fontWeight: 600,
          color: theme.colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Asset Types
        </div>

        {availableTypes.map(type => {
          const info = ASSET_TYPE_INFO[type];
          const count = typeCounts[type];
          const isSelected = selectedTypes.includes(type);

          return (
            <button
              key={type}
              onClick={() => toggleTypeFilter(type)}
              style={{
                width: '100%',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                backgroundColor: isSelected ? `${info.color}22` : 'transparent',
                border: 'none',
                borderLeft: `3px solid ${isSelected ? info.color : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 16 }}>{info.icon}</span>
              <span style={{
                flex: 1,
                textAlign: 'left',
                fontSize: 13,
                color: isSelected ? theme.colors.text : theme.colors.textMuted,
                fontWeight: isSelected ? 500 : 400,
              }}>
                {info.label}
              </span>
              <span style={{
                fontSize: 12,
                color: theme.colors.textMuted,
                backgroundColor: theme.colors.background,
                padding: '2px 8px',
                borderRadius: 10,
                minWidth: 28,
                textAlign: 'center',
              }}>
                {count}
              </span>
            </button>
          );
        })}

        {availableTypes.length === 0 && (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: theme.colors.textMuted,
            fontSize: 13,
          }}>
            No assets found
          </div>
        )}
      </div>
    </div>
  );
}
