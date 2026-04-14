/**
 * Hook para sair do app com toque duplo no botão voltar (Android)
 * Mostra um toast "Pressione voltar novamente para sair" no primeiro toque
 * Se o usuário pressionar voltar novamente dentro de 2 segundos, o app fecha
 */

import { useEffect, useRef, useCallback } from 'react';
import { BackHandler, ToastAndroid, Platform } from 'react-native';

export function useDoubleBackExit() {
  const lastBackPress = useRef<number>(0);
  const EXIT_TIMEOUT = 2000; // 2 segundos

  const handleBackPress = useCallback(() => {
    const now = Date.now();

    if (now - lastBackPress.current < EXIT_TIMEOUT) {
      // Segundo toque dentro do timeout - sair do app
      BackHandler.exitApp();
      return true;
    }

    // Primeiro toque - mostrar aviso
    lastBackPress.current = now;

    if (Platform.OS === 'android') {
      ToastAndroid.show(
        'Pressione voltar novamente para sair',
        ToastAndroid.SHORT
      );
    }

    return true; // Prevenir comportamento padrão
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => subscription.remove();
  }, [handleBackPress]);
}
