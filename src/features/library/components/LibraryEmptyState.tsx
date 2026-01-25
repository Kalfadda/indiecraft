import { useTheme } from '@/stores/themeStore';
import { open } from '@tauri-apps/plugin-dialog';
import { useLibraryStore } from '../hooks/useLibraryStore';

export function LibraryEmptyState() {
  const theme = useTheme();
  const { setRootPath, isLoading, testEvent, scanProgress } = useLibraryStore();

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
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      textAlign: 'center',
    }}>
      <div style={{
        width: 120,
        height: 120,
        borderRadius: 24,
        backgroundColor: theme.colors.card,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        border: `2px dashed ${theme.colors.border}`,
      }}>
        <span style={{ fontSize: 48 }}>📁</span>
      </div>

      <h2 style={{
        fontSize: 24,
        fontWeight: 600,
        color: theme.colors.text,
        marginBottom: 8,
      }}>
        Asset Library
      </h2>

      <p style={{
        fontSize: 14,
        color: theme.colors.textMuted,
        maxWidth: 400,
        marginBottom: 24,
        lineHeight: 1.6,
      }}>
        Browse and preview your project assets including textures, 3D models, audio files, and more.
        Select a folder to get started.
      </p>

      <button
        onClick={handleSelectFolder}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 28px',
          backgroundColor: theme.colors.primary,
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: 18 }}>📂</span>
        Select Folder
      </button>

      {/* Debug: Test event button */}
      <button
        onClick={testEvent}
        style={{
          marginTop: 12,
          padding: '8px 16px',
          backgroundColor: theme.colors.card,
          color: theme.colors.text,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 6,
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        Test Event (check console)
      </button>

      {/* Debug: Show scan progress state */}
      {scanProgress && (
        <div style={{
          marginTop: 12,
          padding: 8,
          backgroundColor: theme.colors.card,
          borderRadius: 6,
          fontSize: 11,
          color: theme.colors.textMuted,
        }}>
          Phase: {scanProgress.phase} | Scanned: {scanProgress.scanned} | Path: {scanProgress.currentPath}
        </div>
      )}

      <div style={{
        marginTop: 32,
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {[
          { icon: '🖼️', label: 'Textures', desc: 'PNG, JPG, TGA, PSD...' },
          { icon: '📦', label: 'Models', desc: 'FBX, OBJ, GLTF, GLB...' },
          { icon: '🔊', label: 'Audio', desc: 'WAV, MP3, OGG...' },
          { icon: '🎬', label: 'Video', desc: 'MP4, MOV, AVI...' },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: 12,
            minWidth: 100,
          }}>
            <span style={{ fontSize: 24 }}>{item.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: theme.colors.text }}>
              {item.label}
            </span>
            <span style={{ fontSize: 11, color: theme.colors.textMuted }}>
              {item.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
