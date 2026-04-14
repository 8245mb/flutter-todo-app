import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/use-colors';

interface PaywallProps {
  feature: string;
  description?: string;
}

export function Paywall({ feature, description }: PaywallProps) {
  const colors = useColors();
  const router = useRouter();

  const handleUpgrade = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/premium' as any);
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: colors.background,
      }}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 24,
          padding: 32,
          alignItems: 'center',
          maxWidth: 320,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
        
        <Text
          style={{
            fontSize: 22,
            fontWeight: 'bold',
            color: colors.foreground,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Recurso Premium
        </Text>
        
        <Text
          style={{
            fontSize: 15,
            color: colors.muted,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          {feature}
        </Text>
        
        {description && (
          <Text
            style={{
              fontSize: 13,
              color: colors.muted,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            {description}
          </Text>
        )}
        
        <Pressable
          onPress={handleUpgrade}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 32,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
            Seja Premium
          </Text>
        </Pressable>
        
        <Text
          style={{
            fontSize: 12,
            color: colors.muted,
            marginTop: 12,
          }}
        >
          A partir de R$ 9,90/mês
        </Text>
      </View>
    </View>
  );
}

// Hook para verificar se o usuário é premium
export function usePremiumCheck() {
  const router = useRouter();
  
  const requirePremium = (isPremium: boolean, callback: () => void) => {
    if (isPremium) {
      callback();
    } else {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      router.push('/premium' as any);
    }
  };
  
  return { requirePremium };
}
