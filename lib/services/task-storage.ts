import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/lib/types/task';

const STORAGE_KEY = '@todo_tasks';

/**
 * Generate a unique ID for a task
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load all tasks from AsyncStorage
 */
export async function loadTasks(): Promise<Task[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as Task[];
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
}

/**
 * Save tasks to AsyncStorage
 */
async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks:', error);
    throw error;
  }
}

/**
 * Create a new task
 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const tasks = await loadTasks();
  const now = Date.now();
  
  const newTask: Task = {
    id: generateId(),
    title: input.title,
    description: input.description,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
  
  tasks.push(newTask);
  await saveTasks(tasks);
  
  return newTask;
}

/**
 * Update an existing task
 */
export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
  const tasks = await loadTasks();
  const index = tasks.findIndex(task => task.id === id);
  
  if (index === -1) return null;
  
  const updatedTask: Task = {
    ...tasks[index],
    ...input,
    updatedAt: Date.now(),
  };
  
  tasks[index] = updatedTask;
  await saveTasks(tasks);
  
  return updatedTask;
}

/**
 * Delete a task by ID
 */
export async function deleteTask(id: string): Promise<boolean> {
  const tasks = await loadTasks();
  const filteredTasks = tasks.filter(task => task.id !== id);
  
  if (filteredTasks.length === tasks.length) return false;
  
  await saveTasks(filteredTasks);
  return true;
}

/**
 * Toggle task completion status
 */
export async function toggleTaskCompletion(id: string): Promise<Task | null> {
  const tasks = await loadTasks();
  const task = tasks.find(t => t.id === id);
  
  if (!task) return null;
  
  return updateTask(id, { completed: !task.completed });
}

/**
 * Clear all tasks (for testing purposes)
 */
export async function clearAllTasks(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing tasks:', error);
    throw error;
  }
}
