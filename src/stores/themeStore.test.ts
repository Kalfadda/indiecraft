import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useThemeStore, useTheme, THEMES, type ThemeId } from './themeStore';

describe('Theme Store', () => {
  beforeEach(() => {
    // Reset store to default state
    useThemeStore.setState({ currentTheme: 'purple' });
  });

  describe('THEMES', () => {
    it('has all expected themes', () => {
      const expectedThemes: ThemeId[] = ['purple', 'ocean', 'forest', 'sunset', 'rose', 'slate'];
      
      expectedThemes.forEach(themeId => {
        expect(THEMES[themeId]).toBeDefined();
      });
    });

    it('each theme has required properties', () => {
      Object.values(THEMES).forEach(theme => {
        expect(theme.id).toBeDefined();
        expect(theme.name).toBeDefined();
        expect(theme.description).toBeDefined();
        expect(typeof theme.isDark).toBe('boolean');
        expect(theme.colors).toBeDefined();
      });
    });

    it('each theme has all required color properties', () => {
      const requiredColors = [
        'primary', 'primaryHover', 'primaryLight',
        'background', 'card', 'text', 'textMuted',
        'border', 'success', 'warning', 'error', 'info'
      ];

      Object.values(THEMES).forEach(theme => {
        requiredColors.forEach(colorKey => {
          expect(theme.colors[colorKey as keyof typeof theme.colors]).toBeDefined();
        });
      });
    });

    it('dark themes have isDark = true', () => {
      expect(THEMES.ocean.isDark).toBe(true);
      expect(THEMES.forest.isDark).toBe(true);
      expect(THEMES.rose.isDark).toBe(true);
    });

    it('light themes have isDark = false', () => {
      expect(THEMES.purple.isDark).toBe(false);
      expect(THEMES.sunset.isDark).toBe(false);
      expect(THEMES.slate.isDark).toBe(false);
    });
  });

  describe('useThemeStore', () => {
    it('has default theme set to purple', () => {
      const { currentTheme } = useThemeStore.getState();
      expect(currentTheme).toBe('purple');
    });

    it('can change theme', () => {
      const { setTheme } = useThemeStore.getState();
      
      setTheme('ocean');
      
      expect(useThemeStore.getState().currentTheme).toBe('ocean');
    });

    it('getTheme returns correct theme object', () => {
      const { getTheme, setTheme } = useThemeStore.getState();
      
      setTheme('forest');
      
      const theme = getTheme();
      expect(theme.id).toBe('forest');
      expect(theme.name).toBe('Forest');
    });

    it('can cycle through all themes', () => {
      const { setTheme, getTheme } = useThemeStore.getState();
      const themeIds: ThemeId[] = ['purple', 'ocean', 'forest', 'sunset', 'rose', 'slate'];
      
      themeIds.forEach(id => {
        setTheme(id);
        const theme = getTheme();
        expect(theme.id).toBe(id);
      });
    });
  });

  describe('Theme Colors', () => {
    it('purple theme has correct primary color', () => {
      expect(THEMES.purple.colors.primary).toBe('#7c3aed');
    });

    it('ocean theme has correct primary color', () => {
      expect(THEMES.ocean.colors.primary).toBe('#0ea5e9');
    });

    it('forest theme has correct primary color', () => {
      expect(THEMES.forest.colors.primary).toBe('#10b981');
    });

    it('sunset theme has correct primary color', () => {
      expect(THEMES.sunset.colors.primary).toBe('#f97316');
    });

    it('rose theme has correct primary color', () => {
      expect(THEMES.rose.colors.primary).toBe('#e11d48');
    });

    it('slate theme has correct primary color', () => {
      expect(THEMES.slate.colors.primary).toBe('#475569');
    });
  });

  describe('Theme Contrast', () => {
    it('dark themes have light text colors', () => {
      const darkThemes = Object.values(THEMES).filter(t => t.isDark);
      
      darkThemes.forEach(theme => {
        // Light text should have high brightness (starts with #f or #e typically)
        const textFirstChar = theme.colors.text.charAt(1).toLowerCase();
        expect(['e', 'f']).toContain(textFirstChar);
      });
    });

    it('light themes have dark text colors', () => {
      const lightThemes = Object.values(THEMES).filter(t => !t.isDark);
      
      lightThemes.forEach(theme => {
        // Dark text should have low brightness (starts with #0, #1, #2)
        const textFirstChar = theme.colors.text.charAt(1).toLowerCase();
        expect(['0', '1', '2', '3', '4']).toContain(textFirstChar);
      });
    });
  });
});
