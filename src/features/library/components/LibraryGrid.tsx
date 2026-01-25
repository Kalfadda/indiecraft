import { useRef, useEffect, useState, useCallback } from 'react';
import { useLibraryStore, type LocalAsset } from '../hooks/useLibraryStore';
import { useTheme } from '@/stores/themeStore';
import { LibraryAssetTile } from './LibraryAssetTile';
import { preloadModelThumbnails } from '../services/modelThumbnailCache';

const TILE_SIZE = 128;
const TILE_GAP = 8;
const ROW_HEIGHT = TILE_SIZE + TILE_GAP + 24;

export function LibraryGrid() {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scrollTop, setScrollTop] = useState(0);

  const {
    filteredAssets,
    selectAsset,
    selectedAsset,
    isLoading,
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

  // Preload model thumbnails for visible and upcoming assets
  useEffect(() => {
    if (filteredAssets.length === 0) return;

    const modelAssets = filteredAssets
      .filter(a => a.assetType === 'model')
      .map(a => ({
        id: a.id,
        absolute_path: a.path,
        extension: a.extension,
        modified_time: a.modifiedTime
      }));

    if (modelAssets.length > 0) {
      preloadModelThumbnails(modelAssets);
    }
  }, [filteredAssets]);

  const columnCount = Math.max(1, Math.floor((dimensions.width - 24) / (TILE_SIZE + TILE_GAP)));
  const rowCount = Math.ceil(filteredAssets.length / columnCount);
  const totalHeight = rowCount * ROW_HEIGHT;

  // Calculate visible range with buffer
  const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2);
  const endRow = Math.min(rowCount, Math.ceil((scrollTop + dimensions.height) / ROW_HEIGHT) + 2);

  // Get visible assets
  const visibleAssets: { asset: LocalAsset; row: number; col: number }[] = [];
  for (let row = startRow; row < endRow; row++) {
    for (let col = 0; col < columnCount; col++) {
      const index = row * columnCount + col;
      if (index < filteredAssets.length) {
        visibleAssets.push({
          asset: filteredAssets[index],
          row,
          col,
        });
      }
    }
  }

  if (dimensions.width === 0 || dimensions.height === 0) {
    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%', padding: 16 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: theme.colors.textMuted,
        }}>
          Loading...
        </div>
      </div>
    );
  }

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
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        padding: 12,
      }}
    >
      <div style={{
        position: 'relative',
        height: totalHeight,
        width: '100%',
      }}>
        {visibleAssets.map(({ asset, row, col }) => (
          <div
            key={asset.id}
            style={{
              position: 'absolute',
              top: row * ROW_HEIGHT,
              left: col * (TILE_SIZE + TILE_GAP),
              width: TILE_SIZE,
              height: ROW_HEIGHT,
              padding: TILE_GAP / 2,
            }}
          >
            <LibraryAssetTile
              asset={asset}
              isSelected={selectedAsset?.id === asset.id}
              onClick={() => selectAsset(asset)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
