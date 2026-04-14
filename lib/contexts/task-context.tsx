import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/lib/types/task';
import * as TaskStorage from '@/lib/services/task-storage';
import { showToast } from '@/components/toast';
import { scheduleTaskNotification, cancelAllTaskNotifications } from '@/lib/services/notification-service';

interface TaskContextValue {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  loadTasks: () => Promise<void>;
  addTask: (input: CreateTaskInput) => Promise<Task | null>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  toggleTask: (id: string) => Promise<Task | null>;
  clearError: () => void;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

/**
 * Task Context Provider
 * Manages global state for tasks with centralized error handling
 */
export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all tasks from storage
   */
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedTasks = await TaskStorage.loadTasks();
      const sortedTasks = loadedTasks.sort((a, b) => b.createdAt - a.createdAt);
      setTasks(sortedTasks);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar tarefas';
      setError(message);
      console.error('Error loading tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add a new task
   */
  const addTask = useCallback(async (input: CreateTaskInput): Promise<Task | null> => {
    setError(null);
    try {
      const newTask = await TaskStorage.createTask(input);
      setTasks(prev => [newTask, ...prev]);
      
      // Schedule notification if task has due date
      if (newTask.dueDate) {
        const notificationId = await scheduleTaskNotification(
          newTask.id,
          newTask.title,
          newTask.dueDate
        );
        if (notificationId) {
          // Update task with notification ID
          await TaskStorage.updateTask(newTask.id, { notificationId });
          newTask.notificationId = notificationId;
        }
      }
      
      showToast.success('Tarefa criada!', 'Sua tarefa foi adicionada com sucesso');
      return newTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar tarefa';
      setError(message);
      console.error('Error creating task:', err);
      return null;
    }
  }, []);

  /**
   * Update an existing task
   */
  const updateTask = useCallback(async (id: string, input: UpdateTaskInput): Promise<Task | null> => {
    setError(null);
    try {
      const updatedTask = await TaskStorage.updateTask(id, input);
      if (updatedTask) {
        // Cancel old notification
        if (updatedTask.notificationId) {
          await cancelAllTaskNotifications(id);
        }
        
        // Schedule new notification if task has due date and is not completed
        if (updatedTask.dueDate && !updatedTask.completed) {
          const notificationId = await scheduleTaskNotification(
            updatedTask.id,
            updatedTask.title,
            updatedTask.dueDate
          );
          if (notificationId) {
            await TaskStorage.updateTask(id, { notificationId });
            updatedTask.notificationId = notificationId;
          }
        }
        
        setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
        showToast.success('Tarefa atualizada!', 'As alterações foram salvas');
      }
      return updatedTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
      setError(message);
      console.error('Error updating task:', err);
      return null;
    }
  }, []);

  /**
   * Delete a task
   */
  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      // Cancel notification before deleting
      await cancelAllTaskNotifications(id);
      
      const success = await TaskStorage.deleteTask(id);
      if (success) {
        setTasks(prev => prev.filter(task => task.id !== id));
        showToast.success('Tarefa deletada', 'A tarefa foi removida com sucesso');
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar tarefa';
      setError(message);
      console.error('Error deleting task:', err);
      return false;
    }
  }, []);

  /**
   * Toggle task completion status
   */
  const toggleTask = useCallback(async (id: string): Promise<Task | null> => {
    setError(null);
    try {
      const updatedTask = await TaskStorage.toggleTaskCompletion(id);
      if (updatedTask) {
        // Cancel notification when task is completed
        if (updatedTask.completed) {
          await cancelAllTaskNotifications(id);
        } else if (updatedTask.dueDate) {
          // Reschedule notification when task is uncompleted
          const notificationId = await scheduleTaskNotification(
            updatedTask.id,
            updatedTask.title,
            updatedTask.dueDate
          );
          if (notificationId) {
            await TaskStorage.updateTask(id, { notificationId });
            updatedTask.notificationId = notificationId;
          }
        }
        
        setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
      }
      return updatedTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
      setError(message);
      console.error('Error toggling task:', err);
      return null;
    }
  }, []);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: TaskContextValue = {
    tasks,
    isLoading,
    error,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    clearError,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

/**
 * Hook to access task context
 * @throws Error if used outside TaskProvider
 */
export function useTasks(): TaskContextValue {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
