import { describe, it, expect } from 'vitest';
import type { GoalWithCreator } from './useGoals';

// Extract the sorting logic for testing
function sortGoals(goals: GoalWithCreator[]): GoalWithCreator[] {
  return [...goals].sort((a, b) => {
    const aTotal = a.task_count || 0;
    const bTotal = b.task_count || 0;
    const aCompleted = a.completed_task_count || 0;
    const bCompleted = b.completed_task_count || 0;

    // Empty goals go to the bottom
    if (aTotal === 0 && bTotal > 0) return 1;
    if (bTotal === 0 && aTotal > 0) return -1;
    if (aTotal === 0 && bTotal === 0) {
      // Both empty: sort by created_at descending
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }

    const aPercent = aTotal > 0 ? aCompleted / aTotal : 0;
    const bPercent = bTotal > 0 ? bCompleted / bTotal : 0;

    // Goals at 100% (ready to be marked complete) float to top
    if (aPercent === 1 && bPercent < 1) return -1;
    if (bPercent === 1 && aPercent < 1) return 1;

    // Goals close to completion (80%+) get priority boost
    const aCloseToFinish = aPercent >= 0.8;
    const bCloseToFinish = bPercent >= 0.8;
    if (aCloseToFinish && !bCloseToFinish) return -1;
    if (bCloseToFinish && !aCloseToFinish) return 1;

    // Within same tier, sort by percentage descending
    if (aPercent !== bPercent) return bPercent - aPercent;

    // Same percentage: sort by total tasks (larger goals first)
    return bTotal - aTotal;
  });
}

// Helper to create mock goals
function createGoal(
  id: string,
  taskCount: number,
  completedCount: number,
  createdAt: string = '2026-01-01T00:00:00Z'
): GoalWithCreator {
  return {
    id,
    name: `Goal ${id}`,
    description: null,
    status: 'active',
    priority: null,
    target_date: null,
    created_by: 'user-1',
    created_at: createdAt,
    updated_at: createdAt,
    completed_at: null,
    creator: { display_name: 'Test User', email: 'test@test.com' },
    task_count: taskCount,
    completed_task_count: completedCount,
  };
}

describe('Goal Sorting Logic', () => {
  describe('100% Complete Goals', () => {
    it('puts 100% complete goals at the top', () => {
      const goals = [
        createGoal('half', 10, 5),      // 50%
        createGoal('complete', 5, 5),    // 100%
        createGoal('quarter', 8, 2),     // 25%
      ];

      const sorted = sortGoals(goals);

      expect(sorted[0].id).toBe('complete');
    });

    it('multiple 100% goals sorted by task count (larger first)', () => {
      const goals = [
        createGoal('small-complete', 3, 3),
        createGoal('large-complete', 10, 10),
        createGoal('medium-complete', 5, 5),
      ];

      const sorted = sortGoals(goals);

      expect(sorted[0].id).toBe('large-complete');
      expect(sorted[1].id).toBe('medium-complete');
      expect(sorted[2].id).toBe('small-complete');
    });
  });

  describe('Near Completion (80%+)', () => {
    it('80%+ goals get priority over lower percentages', () => {
      const goals = [
        createGoal('half', 10, 5),       // 50%
        createGoal('ninety', 10, 9),     // 90%
        createGoal('seventy', 10, 7),    // 70%
        createGoal('eighty', 10, 8),     // 80%
      ];

      const sorted = sortGoals(goals);

      // 90% and 80% should come first
      expect(['ninety', 'eighty']).toContain(sorted[0].id);
      expect(['ninety', 'eighty']).toContain(sorted[1].id);
    });

    it('within 80%+ tier, higher percentage comes first', () => {
      const goals = [
        createGoal('eighty', 10, 8),     // 80%
        createGoal('ninety-five', 20, 19), // 95%
        createGoal('eighty-five', 20, 17), // 85%
      ];

      const sorted = sortGoals(goals);

      expect(sorted[0].id).toBe('ninety-five');
      expect(sorted[1].id).toBe('eighty-five');
      expect(sorted[2].id).toBe('eighty');
    });
  });

  describe('Empty Goals', () => {
    it('empty goals go to the bottom', () => {
      const goals = [
        createGoal('empty', 0, 0),
        createGoal('has-tasks', 5, 2),
        createGoal('also-empty', 0, 0, '2026-01-02T00:00:00Z'),
      ];

      const sorted = sortGoals(goals);

      expect(sorted[0].id).toBe('has-tasks');
      // Empty goals should be at the end
      expect(['empty', 'also-empty']).toContain(sorted[1].id);
      expect(['empty', 'also-empty']).toContain(sorted[2].id);
    });

    it('multiple empty goals sorted by created_at descending (newest first)', () => {
      const goals = [
        createGoal('old-empty', 0, 0, '2026-01-01T00:00:00Z'),
        createGoal('new-empty', 0, 0, '2026-01-10T00:00:00Z'),
        createGoal('mid-empty', 0, 0, '2026-01-05T00:00:00Z'),
      ];

      const sorted = sortGoals(goals);

      expect(sorted[0].id).toBe('new-empty');
      expect(sorted[1].id).toBe('mid-empty');
      expect(sorted[2].id).toBe('old-empty');
    });
  });

  describe('Same Percentage Tiebreaker', () => {
    it('same percentage: larger goals come first', () => {
      const goals = [
        createGoal('small', 4, 2),   // 50%
        createGoal('large', 20, 10), // 50%
        createGoal('medium', 10, 5), // 50%
      ];

      const sorted = sortGoals(goals);

      expect(sorted[0].id).toBe('large');
      expect(sorted[1].id).toBe('medium');
      expect(sorted[2].id).toBe('small');
    });
  });

  describe('General Sorting', () => {
    it('goals sorted by percentage when below 80%', () => {
      const goals = [
        createGoal('twenty', 10, 2),   // 20%
        createGoal('fifty', 10, 5),    // 50%
        createGoal('ten', 10, 1),      // 10%
        createGoal('seventy', 10, 7),  // 70%
      ];

      const sorted = sortGoals(goals);

      expect(sorted[0].id).toBe('seventy');
      expect(sorted[1].id).toBe('fifty');
      expect(sorted[2].id).toBe('twenty');
      expect(sorted[3].id).toBe('ten');
    });
  });

  describe('Complex Scenarios', () => {
    it('full realistic sorting scenario', () => {
      const goals = [
        createGoal('empty-new', 0, 0, '2026-01-20T00:00:00Z'),
        createGoal('complete-small', 3, 3),       // 100%
        createGoal('almost-done', 10, 9),         // 90%
        createGoal('half-done', 20, 10),          // 50%
        createGoal('empty-old', 0, 0, '2026-01-01T00:00:00Z'),
        createGoal('complete-large', 15, 15),     // 100%
        createGoal('just-started', 10, 1),        // 10%
      ];

      const sorted = sortGoals(goals);

      // 100% complete goals first, larger ones higher
      expect(sorted[0].id).toBe('complete-large');
      expect(sorted[1].id).toBe('complete-small');

      // 80%+ next
      expect(sorted[2].id).toBe('almost-done');

      // Then by percentage
      expect(sorted[3].id).toBe('half-done');
      expect(sorted[4].id).toBe('just-started');

      // Empty goals last, newer first
      expect(sorted[5].id).toBe('empty-new');
      expect(sorted[6].id).toBe('empty-old');
    });
  });
});
