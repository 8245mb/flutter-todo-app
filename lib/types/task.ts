/**
 * Task model representing a to-do item
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
  dueDate?: number; // timestamp in milliseconds, optional
  notificationId?: string; // ID of scheduled notification, optional
}

/**
 * Input type for creating a new task
 */
export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completed'>;

/**
 * Input type for updating an existing task
 */
export type UpdateTaskInput = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>;
