import { describe, it, expect } from 'vitest';
import type { Task } from '@/lib/types/task';

/**
 * Helper function to filter tasks by date criteria
 * This mirrors the logic in app/(tabs)/index.tsx
 */
function filterTasks(
  tasks: Task[],
  filter: 'all' | 'today' | 'overdue' | 'upcoming' | 'no-date'
): Task[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;

  let filtered = tasks;

  switch (filter) {
    case 'today':
      filtered = tasks.filter(t => {
        if (!t.dueDate) return false;
        return t.dueDate >= todayStart && t.dueDate < todayEnd;
      });
      break;
    case 'overdue':
      filtered = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        return t.dueDate < now.getTime();
      });
      break;
    case 'upcoming':
      filtered = tasks.filter(t => {
        if (!t.dueDate) return false;
        return t.dueDate >= todayEnd;
      });
      break;
    case 'no-date':
      filtered = tasks.filter(t => !t.dueDate);
      break;
    default:
      filtered = tasks;
  }

  // Sort by due date (tasks with due date first, then by date)
  return filtered.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate - b.dueDate;
  });
}

describe('Task Filters', () => {
  const now = Date.now();
  const todayStart = new Date(new Date(now).setHours(0, 0, 0, 0)).getTime();
  const todayMiddle = todayStart + 12 * 60 * 60 * 1000; // Noon today
  const yesterday = todayStart - 24 * 60 * 60 * 1000; // Yesterday at midnight
  const tomorrow = todayStart + 24 * 60 * 60 * 1000; // Tomorrow at midnight
  const nextWeek = todayStart + 7 * 24 * 60 * 60 * 1000; // Next week at midnight

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Overdue task',
      completed: false,
      createdAt: yesterday,
      updatedAt: yesterday,
      dueDate: yesterday,
    },
    {
      id: '2',
      title: 'Task due today',
      completed: false,
      createdAt: now,
      updatedAt: now,
      dueDate: todayMiddle,
    },
    {
      id: '3',
      title: 'Task due tomorrow',
      completed: false,
      createdAt: now,
      updatedAt: now,
      dueDate: tomorrow,
    },
    {
      id: '4',
      title: 'Task due next week',
      completed: false,
      createdAt: now,
      updatedAt: now,
      dueDate: nextWeek,
    },
    {
      id: '5',
      title: 'Task without due date',
      completed: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '6',
      title: 'Completed overdue task',
      completed: true,
      createdAt: yesterday,
      updatedAt: now,
      dueDate: yesterday,
    },
  ];

  describe('Filter: all', () => {
    it('should return all tasks', () => {
      const result = filterTasks(mockTasks, 'all');
      expect(result).toHaveLength(6);
    });

    it('should sort tasks with due dates first', () => {
      const result = filterTasks(mockTasks, 'all');
      // First task should have a due date
      expect(result[0].dueDate).toBeDefined();
      // Last task should be without due date
      expect(result[result.length - 1].dueDate).toBeUndefined();
    });
  });

  describe('Filter: today', () => {
    it('should return only tasks due today', () => {
      const result = filterTasks(mockTasks, 'today');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
      expect(result[0].title).toBe('Task due today');
    });

    it('should not include tasks without due date', () => {
      const result = filterTasks(mockTasks, 'today');
      expect(result.every(t => t.dueDate !== undefined)).toBe(true);
    });
  });

  describe('Filter: overdue', () => {
    it('should return only incomplete overdue tasks', () => {
      const result = filterTasks(mockTasks, 'overdue');
      // Both task 1 (yesterday) and task 2 (today at noon) may be overdue depending on current time
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some(t => t.id === '1')).toBe(true);
    });

    it('should not include completed overdue tasks', () => {
      const result = filterTasks(mockTasks, 'overdue');
      expect(result.every(t => !t.completed)).toBe(true);
    });

    it('should not include tasks without due date', () => {
      const result = filterTasks(mockTasks, 'overdue');
      expect(result.every(t => t.dueDate !== undefined)).toBe(true);
    });
  });

  describe('Filter: upcoming', () => {
    it('should return tasks due after today', () => {
      const result = filterTasks(mockTasks, 'upcoming');
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.map(t => t.id)).toContain('3'); // tomorrow
      expect(result.map(t => t.id)).toContain('4'); // next week
    });

    it('should not include tasks due today', () => {
      const result = filterTasks(mockTasks, 'upcoming');
      expect(result.every(t => t.id !== '2')).toBe(true);
    });

    it('should sort by due date ascending', () => {
      const result = filterTasks(mockTasks, 'upcoming');
      for (let i = 1; i < result.length; i++) {
        expect(result[i].dueDate!).toBeGreaterThanOrEqual(result[i - 1].dueDate!);
      }
    });
  });

  describe('Filter: no-date', () => {
    it('should return only tasks without due date', () => {
      const result = filterTasks(mockTasks, 'no-date');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('5');
      expect(result[0].title).toBe('Task without due date');
    });

    it('should not include tasks with due date', () => {
      const result = filterTasks(mockTasks, 'no-date');
      expect(result.every(t => t.dueDate === undefined)).toBe(true);
    });
  });

  describe('Overdue count', () => {
    it('should calculate correct overdue count', () => {
      const overdueCount = mockTasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        return t.dueDate < now;
      }).length;

      // At least task 1 (yesterday) should be overdue
      expect(overdueCount).toBeGreaterThanOrEqual(1);
    });

    it('should not count completed tasks as overdue', () => {
      const overdueCount = mockTasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        return t.dueDate < now;
      }).length;

      // Task 6 is completed and overdue, should not be counted
      expect(overdueCount).toBeGreaterThanOrEqual(1);
      // Verify task 6 is not in the count
      const allOverdue = mockTasks.filter(t => t.dueDate && t.dueDate < now);
      const completedOverdue = allOverdue.filter(t => t.completed);
      expect(completedOverdue.length).toBeGreaterThan(0); // Task 6 exists
      expect(overdueCount).toBe(allOverdue.length - completedOverdue.length);
    });
  });

  describe('Sorting', () => {
    it('should sort tasks by due date ascending', () => {
      const result = filterTasks(mockTasks, 'all');
      const tasksWithDueDate = result.filter(t => t.dueDate);

      for (let i = 1; i < tasksWithDueDate.length; i++) {
        expect(tasksWithDueDate[i].dueDate!).toBeGreaterThanOrEqual(
          tasksWithDueDate[i - 1].dueDate!
        );
      }
    });

    it('should place tasks without due date at the end', () => {
      const result = filterTasks(mockTasks, 'all');
      const lastTask = result[result.length - 1];
      expect(lastTask.dueDate).toBeUndefined();
    });
  });
});
