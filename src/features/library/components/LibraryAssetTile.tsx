import { memo, useState, useEffect } from 'react';
import { useTheme } from '@/stores/themeStore';
import type { LocalAsset } from '../hooks/useLibraryStore';
import { ASSET_TYPE_INFO } from '../types';
import { getModelThumbnail } from '../services/modelThumbnailCache';

interface LibraryAssetTileProps {
  asset: LocalAsset;
  isSelected: boolean;
  onClick: () => void;
}

export const LibraryAssetTile = memo(function LibraryAssetTile({
  asset,
  isSelected,
  onClick,
}: LibraryAssetTileProps) {
  const theme = useTheme();
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [modelThumbnail, setModelThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const typeInfo = ASSET_TYPE_INFO[asset.assetType];

  // Load model thumbnails
  useEffect(() => {
    let cancelled = false;

    if (asset.assetType === 'model') {
      setLoading(true);
      getModelThumbnail(asset.id, asset.path, asset.extension, asset.modifiedTime)
        .then((data) => {
          if (!cancelled) {
            setModelThumbnail(data);
            setLoading(false);
          }
        });
    } else {
      setModelThumbnail(null);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [asset.id, asset.assetType, asset.path, asset.extension, asset.modifiedTime]);

  // Determine what image to show
  const imgSrc = asset.assetType === 'model' ? modelThumbnail : asset.thumbnailUrl;
  const hasImage = imgSrc && !imageError;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        backgroundColor: isSelected ? `${theme.colors.primary}22` : isHovered ? theme.colors.card : 'transparent',
        border: `2px solid ${isSelected ? theme.colors.primary : isHovered ? theme.colors.border : 'transparent'}`,
        borderRadius: 8,
        overflow: 'hidden',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{
            width: 24,
            height: 24,
            border: `2px solid ${theme.colors.border}`,
            borderTopColor: theme.colors.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
        ) : hasImage ? (
          <img
            src={imgSrc!}
            alt={asset.name}
            loading="lazy"
            onError={() => setImageError(true)}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{ fontSize: 32 }}>{typeInfo.icon}</span>
            <span style={{
              fontSize: 10,
              color: theme.colors.textMuted,
              textTransform: 'uppercase',
              opacity: 0.7,
            }}>
              .{asset.extension}
            </span>
          </div>
        )}

        {/* Type badge */}
        <div style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${typeInfo.color}dd`,
          borderRadius: 4,
          fontSize: 10,
        }}>
          {typeInfo.icon}
        </div>
      </div>

      {/* Label */}
      <div style={{
        padding: '6px 8px',
        backgroundColor: isSelected ? `${theme.colors.primary}33` : theme.colors.card,
        borderTop: `1px solid ${theme.colors.border}`,
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 500,
          color: theme.colors.text,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {asset.name}
        </div>
      </div>
    </div>
  );
});
