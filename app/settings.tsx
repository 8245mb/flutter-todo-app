import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useThemeContext } from '@/lib/theme-provider';
import { loadPreferences, updatePreferences } from '@/lib/services/profile-storage';
import { showToast } from '@/components/toast';
import type { UserPreferences } from '@/lib/types/user-profile';

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useThemeContext();
  
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    const prefs = await loadPreferences();
    setPreferences(prefs);
  };

  const handleToggle = async (key: keyof UserPreferences, value: boolean) => {
    if (!preferences) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const updated = await updatePreferences({ [key]: value });
      setPreferences(updated);
      showToast.success('Configuração atualizada', `${getSettingLabel(key)} ${value ? 'ativado' : 'desativado'}`);
    } catch (error) {
      console.error('Error updating preferences:', error);
      showToast.error('Erro', 'Não foi possível atualizar a configuração');
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark') => {
    if (!preferences) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      // Atualizar o tema no ThemeProvider (aplica imediatamente)
      setColorScheme(theme);
      
      // Salvar preferência no storage
      const updated = await updatePreferences({ theme });
      setPreferences(updated);
      showToast.success('Tema alterado', `Tema ${getThemeLabel(theme)} aplicado`);
    } catch (error) {
      console.error('Error updating theme:', error);
      showToast.error('Erro', 'Não foi possível alterar o tema');
    }
  };

  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      notifications: 'Notificações',
      soundEnabled: 'Sons',
      hapticFeedback: 'Feedback Háptico',
    };
    return labels[key] || key;
  };

  const getThemeLabel = (theme: string): string => {
    const labels: Record<string, string> = {
      light: 'claro',
      dark: 'escuro',
      auto: 'automático',
    };
    return labels[theme] || theme;
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  if (!preferences) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-muted">Carregando configurações...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6 flex-row items-center">
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              padding: 4,
              marginRight: 12,
            })}
          >
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
          </Pressable>
          
          <Text className="text-3xl font-bold text-foreground">
            Configurações
          </Text>
        </View>

        {/* Appearance Section */}
        <View className="px-6 mb-8">
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.foreground,
              marginBottom: 16,
            }}
          >
            Aparência
          </Text>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            {/* Theme Options - Light and Dark only */}
            {(['light', 'dark'] as const).map((theme, index) => (
              <Pressable
                key={theme}
                onPress={() => handleThemeChange(theme)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  backgroundColor: pressed ? colors.border : 'transparent',
                  borderTopWidth: index > 0 ? 1 : 0,
                  borderTopColor: colors.border,
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 24 }}>
                    {theme === 'light' ? '☀️' : '🌙'}
                  </Text>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground }}>
                      {theme === 'light' ? 'Tema Claro' : 'Tema Escuro'}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                      {theme === 'light' ? 'Fundo branco, texto escuro' : 'Fundo escuro, texto claro'}
                    </Text>
                  </View>
                </View>
                {colorScheme === theme && (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Notifications Section */}
        <View className="px-6 mb-8">
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.foreground,
              marginBottom: 16,
            }}
          >
            Notificações
          </Text>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <Text style={{ fontSize: 24 }}>🔔</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground }}>
                    Notificações Push
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                    Receber lembretes de tarefas
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.notifications}
                onValueChange={(value) => handleToggle('notifications', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Sound & Haptics Section */}
        <View className="px-6 mb-8">
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.foreground,
              marginBottom: 16,
            }}
          >
            Som e Vibração
          </Text>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* Sound */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <Text style={{ fontSize: 24 }}>🔊</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground }}>
                    Sons
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                    Efeitos sonoros do app
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.soundEnabled}
                onValueChange={(value) => handleToggle('soundEnabled', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />

            {/* Haptic Feedback */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <Text style={{ fontSize: 24 }}>📳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground }}>
                    Feedback Háptico
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                    Vibração ao tocar em botões
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.hapticFeedback}
                onValueChange={(value) => handleToggle('hapticFeedback', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* About Section */}
        <View className="px-6">
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.foreground,
              marginBottom: 16,
            }}
          >
            Sobre
          </Text>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>
              Minhas Tarefas
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 20 }}>
              Versão 1.0.0{'\n'}
              Aplicativo de gerenciamento de tarefas desenvolvido com React Native e Expo.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
