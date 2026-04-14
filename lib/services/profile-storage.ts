import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, UserPreferences, UpdateProfileInput, UpdatePreferencesInput } from '@/lib/types/user-profile';

const PROFILE_KEY = '@minhas_tarefas:profile';
const PREFERENCES_KEY = '@minhas_tarefas:preferences';

/**
 * Default user profile
 */
const DEFAULT_PROFILE: UserProfile = {
  id: 'user_1',
  name: 'Usuário',
  bio: 'Amante da produtividade e organização',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'auto',
  notifications: true,
  language: 'pt-BR',
  soundEnabled: true,
  hapticFeedback: true,
};

/**
 * Load user profile from storage
 */
export async function loadProfile(): Promise<UserProfile> {
  try {
    const data = await AsyncStorage.getItem(PROFILE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Return default profile if none exists
    await saveProfile(DEFAULT_PROFILE);
    return DEFAULT_PROFILE;
  } catch (error) {
    console.error('Error loading profile:', error);
    return DEFAULT_PROFILE;
  }
}

/**
 * Save user profile to storage
 */
export async function saveProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
  try {
    const currentProfile = await loadProfile();
    const updatedProfile: UserProfile = {
      ...currentProfile,
      ...input,
      updatedAt: Date.now(),
    };
    await saveProfile(updatedProfile);
    return updatedProfile;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

/**
 * Load user preferences from storage
 */
export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Return default preferences if none exist
    await savePreferences(DEFAULT_PREFERENCES);
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error loading preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save user preferences to storage
 */
export async function savePreferences(preferences: UserPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences:', error);
    throw error;
  }
}

/**
 * Update user preferences
 */
export async function updatePreferences(input: UpdatePreferencesInput): Promise<UserPreferences> {
  try {
    const currentPreferences = await loadPreferences();
    const updatedPreferences: UserPreferences = {
      ...currentPreferences,
      ...input,
    };
    await savePreferences(updatedPreferences);
    return updatedPreferences;
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
}
