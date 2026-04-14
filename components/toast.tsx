import Toast, { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { useColors } from '@/hooks/use-colors';

/**
 * Custom Toast Configuration
 * Provides styled toast notifications for success, error, and info messages
 */
export function useToastConfig(): ToastConfig {
  const colors = useColors();

  return {
    success: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: colors.success,
          backgroundColor: colors.surface,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 15,
          fontWeight: '600',
          color: colors.foreground,
        }}
        text2Style={{
          fontSize: 13,
          color: colors.muted,
        }}
      />
    ),
    error: (props) => (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: colors.error,
          backgroundColor: colors.surface,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 15,
          fontWeight: '600',
          color: colors.foreground,
        }}
        text2Style={{
          fontSize: 13,
          color: colors.muted,
        }}
      />
    ),
    info: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: colors.primary,
          backgroundColor: colors.surface,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 15,
          fontWeight: '600',
          color: colors.foreground,
        }}
        text2Style={{
          fontSize: 13,
          color: colors.muted,
        }}
      />
    ),
  };
}

/**
 * Toast Component
 * Must be placed at the root of the app to display notifications
 */
export function ToastProvider() {
  const toastConfig = useToastConfig();
  
  return <Toast config={toastConfig} />;
}

/**
 * Helper functions to show toasts
 */
export const showToast = {
  success: (text1: string, text2?: string) => {
    Toast.show({
      type: 'success',
      text1,
      text2,
      visibilityTime: 3000,
    });
  },
  error: (text1: string, text2?: string) => {
    Toast.show({
      type: 'error',
      text1,
      text2,
      visibilityTime: 4000,
    });
  },
  info: (text1: string, text2?: string) => {
    Toast.show({
      type: 'info',
      text1,
      text2,
      visibilityTime: 3000,
    });
  },
};
