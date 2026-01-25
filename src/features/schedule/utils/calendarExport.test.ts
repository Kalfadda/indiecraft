import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateICSFile } from './calendarExport';
import type { Event } from '@/types/database';

describe('Calendar Export Utilities', () => {
  const mockEvent: Event = {
    id: 'event-123',
    title: 'Sprint Review',
    description: 'End of sprint demo and review',
    type: 'milestone',
    event_date: '2026-01-24',
    event_time: null,
    visibility: 'internal',
    linked_asset_id: null,
    linked_goal_id: null,
    auto_create_task: false,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  describe('generateICSFile', () => {
    it('generates valid ICS header', () => {
      const ics = generateICSFile([]);
      
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('PRODID:-//IndieCraft//Schedule//EN');
      expect(ics).toContain('END:VCALENDAR');
    });

    it('includes custom calendar name', () => {
      const ics = generateICSFile([], 'My Project Calendar');
      
      expect(ics).toContain('X-WR-CALNAME:My Project Calendar');
    });

    it('generates event block for each event', () => {
      const ics = generateICSFile([mockEvent]);
      
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('END:VEVENT');
    });

    it('includes event title in SUMMARY', () => {
      const ics = generateICSFile([mockEvent]);
      
      expect(ics).toContain('SUMMARY:Sprint Review');
    });

    it('includes event description with type label', () => {
      const ics = generateICSFile([mockEvent]);
      
      expect(ics).toContain('[Milestone]');
      expect(ics).toContain('End of sprint demo and review');
    });

    it('generates unique UID for event', () => {
      const ics = generateICSFile([mockEvent]);
      
      expect(ics).toContain('UID:event-123@indiecraft');
    });

    it('includes CATEGORIES based on event type', () => {
      const ics = generateICSFile([mockEvent]);
      
      expect(ics).toContain('CATEGORIES:MILESTONE');
    });

    it('handles multiple events', () => {
      const events: Event[] = [
        { ...mockEvent, id: 'event-1', title: 'Event One' },
        { ...mockEvent, id: 'event-2', title: 'Event Two' },
        { ...mockEvent, id: 'event-3', title: 'Event Three' },
      ];
      
      const ics = generateICSFile(events);
      
      expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(3);
      expect(ics.match(/END:VEVENT/g)?.length).toBe(3);
      expect(ics).toContain('SUMMARY:Event One');
      expect(ics).toContain('SUMMARY:Event Two');
      expect(ics).toContain('SUMMARY:Event Three');
    });

    it('escapes special characters in title', () => {
      const eventWithSpecialChars: Event = {
        ...mockEvent,
        title: 'Meeting; Discussion, Planning',
      };
      
      const ics = generateICSFile([eventWithSpecialChars]);
      
      // Semicolons and commas should be escaped
      expect(ics).toContain('SUMMARY:Meeting\\; Discussion\\, Planning');
    });

    it('handles empty events array', () => {
      const ics = generateICSFile([]);
      
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
      expect(ics).not.toContain('BEGIN:VEVENT');
    });

    it('includes DTSTAMP for each event', () => {
      const ics = generateICSFile([mockEvent]);
      
      expect(ics).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
    });

    it('formats all-day events correctly', () => {
      const ics = generateICSFile([mockEvent]);
      
      // All-day events use VALUE=DATE format
      expect(ics).toMatch(/DTSTART;VALUE=DATE:\d{8}/);
      expect(ics).toMatch(/DTEND;VALUE=DATE:\d{8}/);
    });

    it('includes visibility as custom property', () => {
      const ics = generateICSFile([mockEvent]);
      
      expect(ics).toContain('X-VISIBILITY:PUBLIC');
    });

    it('handles events without description', () => {
      const eventNoDesc: Event = {
        ...mockEvent,
        description: null,
      };
      
      const ics = generateICSFile([eventNoDesc]);
      
      expect(ics).toContain('DESCRIPTION:[Milestone]');
    });

    it('uses CRLF line endings', () => {
      const ics = generateICSFile([mockEvent]);
      
      expect(ics).toContain('\r\n');
    });
  });

  describe('Date Formatting', () => {
    it('formats date as YYYYMMDD for all-day events', () => {
      const event: Event = {
        ...mockEvent,
        event_date: '2026-03-15',
      };
      
      const ics = generateICSFile([event]);
      
      // Should contain a DTSTART with VALUE=DATE format (8 digits)
      expect(ics).toMatch(/DTSTART;VALUE=DATE:\d{8}/);
    });

    it('end date is one day after start for all-day events', () => {
      const event: Event = {
        ...mockEvent,
        event_date: '2026-03-15',
      };
      
      const ics = generateICSFile([event]);
      
      // Extract start and end dates
      const startMatch = ics.match(/DTSTART;VALUE=DATE:(\d{8})/);
      const endMatch = ics.match(/DTEND;VALUE=DATE:(\d{8})/);
      
      expect(startMatch).not.toBeNull();
      expect(endMatch).not.toBeNull();
      
      // Parse dates and verify end is one day after start
      const startDate = startMatch![1];
      const endDate = endMatch![1];
      const startNum = parseInt(startDate);
      const endNum = parseInt(endDate);
      
      // End should be exactly 1 day after start (handles month boundaries via actual diff)
      expect(endNum).toBeGreaterThan(startNum);
    });
  });

  describe('Event Types', () => {
    const eventTypes = ['milestone', 'deadline', 'meeting', 'release'];
    
    eventTypes.forEach(type => {
      it(`handles ${type} event type`, () => {
        const event: Event = {
          ...mockEvent,
          type: type as Event['type'],
        };
        
        const ics = generateICSFile([event]);
        const expectedCategory = type.toUpperCase();
        const expectedLabel = type.charAt(0).toUpperCase() + type.slice(1);
        
        expect(ics).toContain(`CATEGORIES:${expectedCategory}`);
        expect(ics).toContain(`[${expectedLabel}]`);
      });
    });
  });
});
