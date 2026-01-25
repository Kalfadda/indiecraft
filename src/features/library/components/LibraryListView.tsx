import { useRef, useEffect, useState, useCallback, memo } from 'react';
import { useLibraryStore, type LocalAsset } from '../hooks/useLibraryStore';
import { useTheme } from '@/stores/themeStore';
import { ASSET_TYPE_INFO, formatFileSize, formatDate } from '../types';

const ROW_HEIGHT = 40;

interface ListRowProps {
  asset: LocalAsset;
  isSelected: boolean;
  onClick: () => void;
}

const ListRow = memo(function ListRow({ asset, isSelected, onClick }: ListRowProps) {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const typeInfo = ASSET_TYPE_INFO[asset.assetType];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        height: ROW_HEIGHT,
        backgroundColor: isSelected ? `${theme.colors.primary}22` : isHovered ? theme.colors.card : 'transparent',
        borderBottom: `1px solid ${theme.colors.border}`,
        cursor: 'pointer',
        transition: 'background-color 0.1s',
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>
        {typeInfo.icon}
      </span>

      {/* Name */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: 13,
        color: theme.colors.text,
        fontWeight: isSelected ? 500 : 400,
      }}>
        {asset.name}
      </div>

      {/* Type */}
      <div style={{
        width: 100,
        fontSize: 12,
        color: theme.colors.textMuted,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {typeInfo.label}
      </div>

      {/* Size */}
      <div style={{
        width: 80,
        fontSize: 12,
        color: theme.colors.textMuted,
        textAlign: 'right',
      }}>
        {asset.size > 0 ? formatFileSize(asset.size) : '-'}
      </div>

      {/* Date */}
      <div style={{
        width: 140,
        fontSize: 12,
        color: theme.colors.textMuted,
        textAlign: 'right',
      }}>
        {formatDate(asset.modifiedTime)}
      </div>
    </div>
  );
});

export function LibraryListView() {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scrollTop, setScrollTop] = useState(0);

  const {
    filteredAssets,
    selectAsset,
    selectedAsset,
    isLoading,
    sortBy,
    setSortBy,
    sortOrder,
  } = useLibraryStore();

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = filteredAssets.length * ROW_HEIGHT;

  // Calculate visible range with buffer
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 5);
  const endIndex = Math.min(
    filteredAssets.length,
    Math.ceil((scrollTop + dimensions.height) / ROW_HEIGHT) + 5
  );

  // Get visible assets
  const visibleAssets = filteredAssets.slice(startIndex, endIndex);

  const handleHeaderClick = (field: 'name' | 'type' | 'size' | 'date') => {
    setSortBy(field);
  };

  if (filteredAssets.length === 0 && !isLoading) {
    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%', padding: 16 }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: theme.colors.textMuted,
        }}>
          <span style={{ fontSize: 48, marginBottom: 16 }}>📂</span>
          <span style={{ fontSize: 14 }}>No assets found</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        height: 32,
        backgroundColor: theme.colors.card,
        borderBottom: `1px solid ${theme.colors.border}`,
        fontSize: 11,
        fontWeight: 600,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        <span style={{ width: 24 }} />
        <button
          onClick={() => handleHeaderClick('name')}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            padding: 0,
            textAlign: 'left',
            cursor: 'pointer',
            color: sortBy === 'name' ? theme.colors.text : theme.colors.textMuted,
            fontSize: 'inherit',
            fontWeight: 'inherit',
            textTransform: 'inherit',
            letterSpacing: 'inherit',
          }}
        >
          Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleHeaderClick('type')}
          style={{
            width: 100,
            background: 'none',
            border: 'none',
            padding: 0,
            textAlign: 'left',
            cursor: 'pointer',
            color: sortBy === 'type' ? theme.colors.text : theme.colors.textMuted,
            fontSize: 'inherit',
            fontWeight: 'inherit',
            textTransform: 'inherit',
            letterSpacing: 'inherit',
          }}
        >
          Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleHeaderClick('size')}
          style={{
            width: 80,
            background: 'none',
            border: 'none',
            padding: 0,
            textAlign: 'right',
            cursor: 'pointer',
            color: sortBy === 'size' ? theme.colors.text : theme.colors.textMuted,
            fontSize: 'inherit',
            fontWeight: 'inherit',
            textTransform: 'inherit',
            letterSpacing: 'inherit',
          }}
        >
          Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleHeaderClick('date')}
          style={{
            width: 140,
            background: 'none',
            border: 'none',
            padding: 0,
            textAlign: 'right',
            cursor: 'pointer',
            color: sortBy === 'date' ? theme.colors.text : theme.colors.textMuted,
            fontSize: 'inherit',
            fontWeight: 'inherit',
            textTransform: 'inherit',
            letterSpacing: 'inherit',
          }}
        >
          Modified {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      {/* List */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflow: 'auto',
        }}
      >
        <div style={{
          position: 'relative',
          height: totalHeight,
        }}>
          {visibleAssets.map((asset, i) => (
            <div
              key={asset.id}
              style={{
                position: 'absolute',
                top: (startIndex + i) * ROW_HEIGHT,
                left: 0,
                right: 0,
                height: ROW_HEIGHT,
              }}
            >
              <ListRow
                asset={asset}
                isSelected={selectedAsset?.id === asset.id}
                onClick={() => selectAsset(asset)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
