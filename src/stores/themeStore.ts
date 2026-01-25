import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId = "purple" | "ocean" | "forest" | "sunset" | "rose" | "slate";

export interface ThemePalette {
  id: ThemeId;
  name: string;
  description: string;
  isDark: boolean;
  colors: {
    // Primary accent colors
    primary: string;
    primaryHover: string;
    primaryLight: string;
    primaryLighter: string;
    accent: string;
    accentLight: string;

    // Backgrounds
    background: string;
    backgroundSecondary: string;
    card: string;
    cardHover: string;
    cardBorder: string;
    elevated: string;

    // Sidebar
    sidebar: string;
    sidebarBorder: string;
    sidebarText: string;
    sidebarTextMuted: string;
    sidebarActive: string;
    sidebarActiveText: string;

    // Text
    text: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;

    // UI Elements
    border: string;
    borderLight: string;
    inputBg: string;
    inputBorder: string;
    inputFocus: string;

    // Claimed badge
    claimed: string;
    claimedBg: string;
    claimedText: string;

    // Tabs and pills
    tabBg: string;
    tabActiveBg: string;
    tabActiveText: string;
    pillBg: string;
    pillText: string;

    // Status colors (contextual)
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    error: string;
    errorBg: string;
    info: string;
    infoBg: string;
  };
}

export const THEMES: Record<ThemeId, ThemePalette> = {
  purple: {
    id: "purple",
    name: "Violet",
    description: "Classic purple theme",
    isDark: false,
    colors: {
      primary: "#7c3aed",
      primaryHover: "#6d28d9",
      primaryLight: "rgba(124, 58, 237, 0.15)",
      primaryLighter: "rgba(124, 58, 237, 0.08)",
      accent: "#a78bfa",
      accentLight: "rgba(167, 139, 250, 0.2)",

      background: "#f4f4f7",
      backgroundSecondary: "#eeeef2",
      card: "#ffffff",
      cardHover: "#fafafa",
      cardBorder: "#e5e5eb",
      elevated: "#ffffff",

      sidebar: "#1e1e2e",
      sidebarBorder: "#2d2d3d",
      sidebarText: "#9ca3af",
      sidebarTextMuted: "#6b7280",
      sidebarActive: "rgba(124, 58, 237, 0.2)",
      sidebarActiveText: "#a78bfa",

      text: "#1e1e2e",
      textSecondary: "#4b5563",
      textMuted: "#6b7280",
      textInverse: "#ffffff",

      border: "#e5e5eb",
      borderLight: "#f0f0f5",
      inputBg: "#ffffff",
      inputBorder: "#e5e5eb",
      inputFocus: "#7c3aed",

      claimed: "#7c3aed",
      claimedBg: "rgba(124, 58, 237, 0.12)",
      claimedText: "#7c3aed",

      tabBg: "#e8e8ed",
      tabActiveBg: "#ffffff",
      tabActiveText: "#1e1e2e",
      pillBg: "#e8e8ed",
      pillText: "#6b7280",

      success: "#16a34a",
      successBg: "rgba(22, 163, 74, 0.12)",
      warning: "#f59e0b",
      warningBg: "rgba(245, 158, 11, 0.12)",
      error: "#dc2626",
      errorBg: "rgba(220, 38, 38, 0.12)",
      info: "#3b82f6",
      infoBg: "rgba(59, 130, 246, 0.12)",
    },
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    description: "Deep blue dark theme",
    isDark: true,
    colors: {
      primary: "#0ea5e9",
      primaryHover: "#0284c7",
      primaryLight: "rgba(14, 165, 233, 0.2)",
      primaryLighter: "rgba(14, 165, 233, 0.1)",
      accent: "#38bdf8",
      accentLight: "rgba(56, 189, 248, 0.2)",

      background: "#0c1222",
      backgroundSecondary: "#111827",
      card: "#1e293b",
      cardHover: "#263548",
      cardBorder: "#334155",
      elevated: "#1e293b",

      sidebar: "#0f172a",
      sidebarBorder: "#1e293b",
      sidebarText: "#94a3b8",
      sidebarTextMuted: "#64748b",
      sidebarActive: "rgba(14, 165, 233, 0.2)",
      sidebarActiveText: "#38bdf8",

      text: "#f1f5f9",
      textSecondary: "#cbd5e1",
      textMuted: "#94a3b8",
      textInverse: "#0f172a",

      border: "#334155",
      borderLight: "#1e293b",
      inputBg: "#1e293b",
      inputBorder: "#334155",
      inputFocus: "#0ea5e9",

      claimed: "#0ea5e9",
      claimedBg: "rgba(14, 165, 233, 0.15)",
      claimedText: "#38bdf8",

      tabBg: "#1e293b",
      tabActiveBg: "#334155",
      tabActiveText: "#f1f5f9",
      pillBg: "#334155",
      pillText: "#94a3b8",

      success: "#22c55e",
      successBg: "rgba(34, 197, 94, 0.15)",
      warning: "#fbbf24",
      warningBg: "rgba(251, 191, 36, 0.15)",
      error: "#f87171",
      errorBg: "rgba(248, 113, 113, 0.15)",
      info: "#60a5fa",
      infoBg: "rgba(96, 165, 250, 0.15)",
    },
  },
  forest: {
    id: "forest",
    name: "Forest",
    description: "Natural green dark theme",
    isDark: true,
    colors: {
      primary: "#10b981",
      primaryHover: "#059669",
      primaryLight: "rgba(16, 185, 129, 0.2)",
      primaryLighter: "rgba(16, 185, 129, 0.1)",
      accent: "#34d399",
      accentLight: "rgba(52, 211, 153, 0.2)",

      background: "#0d1512",
      backgroundSecondary: "#111a16",
      card: "#1a2721",
      cardHover: "#22332b",
      cardBorder: "#2d4038",
      elevated: "#1a2721",

      sidebar: "#14201a",
      sidebarBorder: "#1f3129",
      sidebarText: "#9ca3af",
      sidebarTextMuted: "#6b7280",
      sidebarActive: "rgba(16, 185, 129, 0.2)",
      sidebarActiveText: "#34d399",

      text: "#ecfdf5",
      textSecondary: "#a7f3d0",
      textMuted: "#6ee7b7",
      textInverse: "#14201a",

      border: "#2d4038",
      borderLight: "#1f3129",
      inputBg: "#1a2721",
      inputBorder: "#2d4038",
      inputFocus: "#10b981",

      claimed: "#10b981",
      claimedBg: "rgba(16, 185, 129, 0.15)",
      claimedText: "#34d399",

      tabBg: "#1a2721",
      tabActiveBg: "#2d4038",
      tabActiveText: "#ecfdf5",
      pillBg: "#2d4038",
      pillText: "#9ca3af",

      success: "#22c55e",
      successBg: "rgba(34, 197, 94, 0.15)",
      warning: "#fbbf24",
      warningBg: "rgba(251, 191, 36, 0.15)",
      error: "#f87171",
      errorBg: "rgba(248, 113, 113, 0.15)",
      info: "#60a5fa",
      infoBg: "rgba(96, 165, 250, 0.15)",
    },
  },
  sunset: {
    id: "sunset",
    name: "Sunset",
    description: "Warm orange light theme",
    isDark: false,
    colors: {
      primary: "#f97316",
      primaryHover: "#ea580c",
      primaryLight: "rgba(249, 115, 22, 0.15)",
      primaryLighter: "rgba(249, 115, 22, 0.08)",
      accent: "#fb923c",
      accentLight: "rgba(251, 146, 60, 0.2)",

      background: "#fefcfb",
      backgroundSecondary: "#fef7f4",
      card: "#ffffff",
      cardHover: "#fffbf9",
      cardBorder: "#fed7aa",
      elevated: "#ffffff",

      sidebar: "#1c1410",
      sidebarBorder: "#2d211a",
      sidebarText: "#a8a29e",
      sidebarTextMuted: "#78716c",
      sidebarActive: "rgba(249, 115, 22, 0.2)",
      sidebarActiveText: "#fb923c",

      text: "#1c1410",
      textSecondary: "#57534e",
      textMuted: "#78716c",
      textInverse: "#ffffff",

      border: "#fed7aa",
      borderLight: "#ffedd5",
      inputBg: "#ffffff",
      inputBorder: "#fed7aa",
      inputFocus: "#f97316",

      claimed: "#f97316",
      claimedBg: "rgba(249, 115, 22, 0.12)",
      claimedText: "#ea580c",

      tabBg: "#ffedd5",
      tabActiveBg: "#ffffff",
      tabActiveText: "#1c1410",
      pillBg: "#ffedd5",
      pillText: "#78716c",

      success: "#16a34a",
      successBg: "rgba(22, 163, 74, 0.12)",
      warning: "#d97706",
      warningBg: "rgba(217, 119, 6, 0.12)",
      error: "#dc2626",
      errorBg: "rgba(220, 38, 38, 0.12)",
      info: "#3b82f6",
      infoBg: "rgba(59, 130, 246, 0.12)",
    },
  },
  rose: {
    id: "rose",
    name: "Rose",
    description: "Soft pink dark theme",
    isDark: true,
    colors: {
      primary: "#e11d48",
      primaryHover: "#be123c",
      primaryLight: "rgba(225, 29, 72, 0.2)",
      primaryLighter: "rgba(225, 29, 72, 0.1)",
      accent: "#fb7185",
      accentLight: "rgba(251, 113, 133, 0.2)",

      background: "#18101a",
      backgroundSecondary: "#1f1520",
      card: "#2d1f2e",
      cardHover: "#3a2940",
      cardBorder: "#4a3550",
      elevated: "#2d1f2e",

      sidebar: "#1f1318",
      sidebarBorder: "#2d1f25",
      sidebarText: "#a8a29e",
      sidebarTextMuted: "#78716c",
      sidebarActive: "rgba(225, 29, 72, 0.2)",
      sidebarActiveText: "#fb7185",

      text: "#fdf2f4",
      textSecondary: "#fecdd3",
      textMuted: "#fda4af",
      textInverse: "#1f1318",

      border: "#4a3550",
      borderLight: "#2d1f25",
      inputBg: "#2d1f2e",
      inputBorder: "#4a3550",
      inputFocus: "#e11d48",

      claimed: "#e11d48",
      claimedBg: "rgba(225, 29, 72, 0.15)",
      claimedText: "#fb7185",

      tabBg: "#2d1f2e",
      tabActiveBg: "#4a3550",
      tabActiveText: "#fdf2f4",
      pillBg: "#4a3550",
      pillText: "#a8a29e",

      success: "#4ade80",
      successBg: "rgba(74, 222, 128, 0.15)",
      warning: "#fbbf24",
      warningBg: "rgba(251, 191, 36, 0.15)",
      error: "#fb7185",
      errorBg: "rgba(251, 113, 133, 0.15)",
      info: "#60a5fa",
      infoBg: "rgba(96, 165, 250, 0.15)",
    },
  },
  slate: {
    id: "slate",
    name: "Slate",
    description: "Minimal gray light theme",
    isDark: false,
    colors: {
      primary: "#475569",
      primaryHover: "#334155",
      primaryLight: "rgba(71, 85, 105, 0.15)",
      primaryLighter: "rgba(71, 85, 105, 0.08)",
      accent: "#94a3b8",
      accentLight: "rgba(148, 163, 184, 0.2)",

      background: "#f8fafc",
      backgroundSecondary: "#f1f5f9",
      card: "#ffffff",
      cardHover: "#f8fafc",
      cardBorder: "#e2e8f0",
      elevated: "#ffffff",

      sidebar: "#1e1e24",
      sidebarBorder: "#2d2d36",
      sidebarText: "#9ca3af",
      sidebarTextMuted: "#6b7280",
      sidebarActive: "rgba(71, 85, 105, 0.25)",
      sidebarActiveText: "#cbd5e1",

      text: "#0f172a",
      textSecondary: "#475569",
      textMuted: "#64748b",
      textInverse: "#ffffff",

      border: "#e2e8f0",
      borderLight: "#f1f5f9",
      inputBg: "#ffffff",
      inputBorder: "#e2e8f0",
      inputFocus: "#475569",

      claimed: "#475569",
      claimedBg: "rgba(71, 85, 105, 0.12)",
      claimedText: "#334155",

      tabBg: "#e2e8f0",
      tabActiveBg: "#ffffff",
      tabActiveText: "#0f172a",
      pillBg: "#e2e8f0",
      pillText: "#64748b",

      success: "#16a34a",
      successBg: "rgba(22, 163, 74, 0.12)",
      warning: "#d97706",
      warningBg: "rgba(217, 119, 6, 0.12)",
      error: "#dc2626",
      errorBg: "rgba(220, 38, 38, 0.12)",
      info: "#3b82f6",
      infoBg: "rgba(59, 130, 246, 0.12)",
    },
  },
};

interface ThemeState {
  currentTheme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  getTheme: () => ThemePalette;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: "purple",
      setTheme: (theme) => set({ currentTheme: theme }),
      getTheme: () => THEMES[get().currentTheme],
    }),
    {
      name: "indiecraft-theme",
    }
  )
);

// Helper hook to get current theme colors
export function useTheme() {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  return THEMES[currentTheme];
}
