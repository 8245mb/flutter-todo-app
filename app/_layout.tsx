import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { TaskProvider } from "@/lib/contexts/task-context";
import { ExpenseProvider } from "@/lib/contexts/expense-context";
import { AssistantProvider } from "@/lib/contexts/assistant-context";
import { AppAuthProvider, useAppAuth } from "@/lib/contexts/app-auth-context";
import { ToastProvider } from "@/components/toast";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

// Componente para gerenciar redirecionamento de autenticação
function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAppAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirecionar para login se não autenticado
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirecionar para tabs se já autenticado
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AppAuthProvider>
            <AuthRedirect>
              {/* Default to hiding native headers so raw route segments don't appear (e.g. "(tabs)", "products/[id]"). */}
              {/* If a screen needs the native header, explicitly enable it and set a human title via Stack.Screen options. */}
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="login" />
                <Stack.Screen name="register" />
                <Stack.Screen name="premium" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="oauth/callback" />
              </Stack>
              <StatusBar style="auto" />
              <ToastProvider />
            </AuthRedirect>
          </AppAuthProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <TaskProvider>
            <ExpenseProvider>
              <AssistantProvider>
                <SafeAreaProvider initialMetrics={providerInitialMetrics}>
                  <SafeAreaFrameContext.Provider value={frame}>
                    <SafeAreaInsetsContext.Provider value={insets}>
                      {content}
                    </SafeAreaInsetsContext.Provider>
                  </SafeAreaFrameContext.Provider>
                </SafeAreaProvider>
              </AssistantProvider>
            </ExpenseProvider>
          </TaskProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TaskProvider>
          <ExpenseProvider>
            <AssistantProvider>
              <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
            </AssistantProvider>
          </ExpenseProvider>
        </TaskProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
