import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpc } from '@/lib/trpc';

export interface AppUser {
  id: number;
  email: string;
  name: string;
  profilePhotoUrl: string | null;
  isPremium: boolean;
  premiumType: 'monthly' | 'yearly' | null;
  premiumExpiresAt: Date | null;
}

interface AppAuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPremium: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; profilePhotoUrl?: string }) => Promise<void>;
  subscribePremium: (type: 'monthly' | 'yearly') => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AppAuthContext = createContext<AppAuthContextType | undefined>(undefined);

const STORAGE_KEY = '@minhas_tarefas_user';

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = trpc.appAuth.login.useMutation();
  const registerMutation = trpc.appAuth.register.useMutation();
  const updateProfileMutation = trpc.appAuth.updateProfile.useMutation();
  const subscribePremiumMutation = trpc.appAuth.subscribePremium.useMutation();

  // Carregar usuário do storage ao iniciar
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const userData = JSON.parse(stored);
        setUser(userData);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (userData: AppUser) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await loginMutation.mutateAsync({ email, password });
      if (result.success && result.user) {
        const userData: AppUser = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          profilePhotoUrl: result.user.profilePhotoUrl,
          isPremium: result.user.isPremium,
          premiumType: result.user.premiumType,
          premiumExpiresAt: result.user.premiumExpiresAt ? new Date(result.user.premiumExpiresAt) : null,
        };
        await saveUser(userData);
        return { success: true };
      }
      return { success: false, error: 'Erro ao fazer login' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao fazer login' };
    }
  }, [loginMutation]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      const result = await registerMutation.mutateAsync({ email, password, name });
      if (result.success && result.user) {
        const userData: AppUser = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          profilePhotoUrl: result.user.profilePhotoUrl,
          isPremium: result.user.isPremium,
          premiumType: result.user.premiumType,
          premiumExpiresAt: result.user.premiumExpiresAt ? new Date(result.user.premiumExpiresAt) : null,
        };
        await saveUser(userData);
        return { success: true };
      }
      return { success: false, error: 'Erro ao criar conta' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao criar conta' };
    }
  }, [registerMutation]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; profilePhotoUrl?: string }) => {
    if (!user) return;
    try {
      await updateProfileMutation.mutateAsync({ userId: user.id, ...data });
      const updatedUser = { ...user, ...data };
      await saveUser(updatedUser);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  }, [user, updateProfileMutation]);

  const subscribePremium = useCallback(async (type: 'monthly' | 'yearly') => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };
    try {
      await subscribePremiumMutation.mutateAsync({ userId: user.id, type });
      const expiresAt = new Date();
      if (type === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }
      const updatedUser = { 
        ...user, 
        isPremium: true, 
        premiumType: type,
        premiumExpiresAt: expiresAt,
      };
      await saveUser(updatedUser);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao assinar premium' };
    }
  }, [user, subscribePremiumMutation]);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, []);

  return (
    <AppAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isPremium: user?.isPremium ?? false,
        login,
        register,
        logout,
        updateProfile,
        subscribePremium,
        refreshUser,
      }}
    >
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AppAuthContext);
  if (context === undefined) {
    throw new Error('useAppAuth must be used within an AppAuthProvider');
  }
  return context;
}
