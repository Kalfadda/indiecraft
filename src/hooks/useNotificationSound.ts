import { useEffect, useRef, useCallback } from "react";
import { useNotificationStore } from "@/stores/notificationStore";

// Create a short "pop" sound using Web Audio API
function createPopSound(audioContext: AudioContext) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Pop sound characteristics
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
  oscillator.type = "sine";

  // Quick fade in and out
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.15);
}

export function useNotificationSound() {
  const notifications = useNotificationStore((state) => state.notifications);
  const soundEnabled = useNotificationStore((state) => state.soundEnabled);
  const prevCountRef = useRef(notifications.length);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext lazily (requires user interaction)
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  // Play sound when new notification arrives
  useEffect(() => {
    if (notifications.length > prevCountRef.current && soundEnabled) {
      try {
        const ctx = getAudioContext();
        // Resume context if it was suspended (due to autoplay policy)
        if (ctx.state === "suspended") {
          ctx.resume();
        }
        createPopSound(ctx);
      } catch {
        // Ignore errors (e.g., if AudioContext is not supported)
      }
    }
    prevCountRef.current = notifications.length;
  }, [notifications.length, soundEnabled, getAudioContext]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);
}
