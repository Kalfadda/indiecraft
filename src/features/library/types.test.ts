import { describe, it, expect } from 'vitest';
import { formatFileSize, formatDate, ASSET_TYPE_INFO } from './types';

describe('Library Types and Utilities', () => {
  describe('formatFileSize', () => {
    it('returns "0 B" for zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('formats bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('formats kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10240)).toBe('10 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
      expect(formatFileSize(104857600)).toBe('100 MB');
    });

    it('formats gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(2147483648)).toBe('2 GB');
    });
  });

  describe('formatDate', () => {
    it('formats timestamp to readable date', () => {
      const timestamp = new Date('2026-01-24T14:30:00').getTime();
      const formatted = formatDate(timestamp);
      // Check that it contains expected parts (locale-independent)
      expect(formatted).toContain('2026');
      expect(formatted).toContain('24');
    });

    it('handles current timestamp', () => {
      const now = Date.now();
      const formatted = formatDate(now);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('ASSET_TYPE_INFO', () => {
    it('has info for all asset types', () => {
      const expectedTypes = [
        'texture', 'model', 'material', 'prefab', 'audio',
        'video', 'shader', 'scene', 'scriptable_object',
        'animation', 'script', 'document', 'unknown'
      ];

      expectedTypes.forEach(type => {
        expect(ASSET_TYPE_INFO[type as keyof typeof ASSET_TYPE_INFO]).toBeDefined();
      });
    });

    it('each type has required properties', () => {
      Object.values(ASSET_TYPE_INFO).forEach(info => {
        expect(info).toHaveProperty('label');
        expect(info).toHaveProperty('icon');
        expect(info).toHaveProperty('color');
        expect(typeof info.label).toBe('string');
        expect(typeof info.icon).toBe('string');
        expect(info.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('texture type has correct info', () => {
      expect(ASSET_TYPE_INFO.texture.label).toBe('Textures');
      expect(ASSET_TYPE_INFO.texture.icon).toBe('🖼️');
    });

    it('model type has correct info', () => {
      expect(ASSET_TYPE_INFO.model.label).toBe('Models');
      expect(ASSET_TYPE_INFO.model.icon).toBe('📦');
    });

    it('audio type has correct info', () => {
      expect(ASSET_TYPE_INFO.audio.label).toBe('Audio');
      expect(ASSET_TYPE_INFO.audio.icon).toBe('🔊');
    });
  });
});
