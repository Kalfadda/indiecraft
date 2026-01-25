import { useState, useRef, useEffect } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useTheme } from '@/stores/themeStore';

interface AudioPlayerProps {
  filePath: string;
  fileName: string;
}

export function AudioPlayer({ filePath, fileName }: AudioPlayerProps) {
  const theme = useTheme();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioSrc = convertFileSrc(filePath);

  useEffect(() => {
    // Reset state when file changes
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setError(null);

    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [filePath]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleError = () => {
    setError('Failed to load audio file');
    setIsLoading(false);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div style={{
        padding: 16,
        backgroundColor: `${theme.colors.error}22`,
        border: `1px solid ${theme.colors.error}`,
        borderRadius: 8,
        color: theme.colors.error,
        textAlign: 'center',
      }}>
        <span style={{ fontSize: 24, marginBottom: 8, display: 'block' }}>🔇</span>
        <span style={{ fontSize: 14 }}>{error}</span>
      </div>
    );
  }

  return (
    <div style={{
      padding: 16,
      backgroundColor: theme.colors.card,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 8,
    }}>
      <audio
        ref={audioRef}
        src={audioSrc}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
      />

      {/* Waveform visualization placeholder */}
      <div style={{
        height: 64,
        backgroundColor: theme.colors.background,
        borderRadius: 4,
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {isLoading ? (
          <span style={{ color: theme.colors.textMuted, fontSize: 13 }}>Loading...</span>
        ) : (
          <>
            {/* Simple waveform bars */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              height: '100%',
              padding: '0 8px',
            }}>
              {Array.from({ length: 40 }).map((_, i) => {
                const height = 20 + Math.sin(i * 0.5) * 15 + Math.random() * 10;
                const isActive = duration > 0 && (i / 40) < (currentTime / duration);
                return (
                  <div
                    key={i}
                    style={{
                      width: 3,
                      height: `${height}%`,
                      backgroundColor: isActive ? theme.colors.primary : theme.colors.border,
                      borderRadius: 1,
                      transition: 'background-color 0.1s',
                    }}
                  />
                );
              })}
            </div>

            {/* Progress overlay */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              backgroundColor: `${theme.colors.primary}22`,
              pointerEvents: 'none',
            }} />
          </>
        )}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: theme.colors.primary,
            color: '#fff',
            fontSize: 18,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Time and seek bar */}
        <div style={{ flex: 1 }}>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={isLoading}
            style={{
              width: '100%',
              height: 4,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              accentColor: theme.colors.primary,
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: theme.colors.textMuted,
            marginTop: 4,
          }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
