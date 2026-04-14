/**
 * Card de Alertas de Assinaturas
 * Mostra renovações próximas de serviços recorrentes
 */

import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { SubscriptionAlert } from '@/lib/types/ai-modules';

interface SubscriptionAlertsCardProps {
  alerts: SubscriptionAlert[];
  onDismiss: (alertId: string) => void;
}

export function SubscriptionAlertsCard({ alerts, onDismiss }: SubscriptionAlertsCardProps) {
  const handleDismiss = (alertId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDismiss(alertId);
  };

  if (alerts.length === 0) return null;

  return (
    <View className="bg-warning/10 rounded-2xl border border-warning/30 p-4">
      <View className="flex-row items-center mb-3">
        <Text className="text-2xl mr-2">🔔</Text>
        <Text className="text-warning font-bold text-lg">
          Renovações Próximas
        </Text>
      </View>

      {alerts.map((alert) => (
        <View
          key={alert.id}
          className="bg-background rounded-xl p-4 mb-2 flex-row items-center justify-between"
        >
          <View className="flex-1 mr-3">
            <Text className="text-foreground font-semibold">
              {alert.message}
            </Text>
            <Text className="text-muted text-sm mt-1">
              {alert.daysUntilRenewal === 1
                ? 'Amanhã'
                : `Em ${alert.daysUntilRenewal} dias`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDismiss(alert.id)}
            className="p-2"
            accessibilityLabel="Dispensar alerta"
            accessibilityRole="button"
          >
            <Text className="text-muted text-xl">✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text className="text-warning/70 text-xs text-center mt-2">
        Alertas baseados em gastos recorrentes detectados
      </Text>
    </View>
  );
}
