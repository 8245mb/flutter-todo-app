/**
 * User Profile Types
 * Defines the structure for user profile data and preferences
 */

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserStats {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  completionRate: number;
  streak: number; // Days with completed tasks
  totalProjects: number;
  goalsAchieved: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  language: 'pt-BR' | 'en-US' | 'es-ES';
  soundEnabled: boolean;
  hapticFeedback: boolean;
}

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdatePreferencesInput {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
  language?: 'pt-BR' | 'en-US' | 'es-ES';
  soundEnabled?: boolean;
  hapticFeedback?: boolean;
}
