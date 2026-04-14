import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useAppAuth } from '@/lib/contexts/app-auth-context';
import * as Haptics from 'expo-haptics';

interface PremiumPaywallProps {
  visible: boolean;
  onClose: () => void;
}

export function PremiumPaywall({ visible, onClose }: PremiumPaywallProps) {
  const colors = useColors();
  const { subscribePremium, isPremium } = useAppAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');

    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const result = await subscribePremium(selectedPlan);

      if (result.success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        onClose();
      } else {
        setError(result.error || 'Erro ao processar assinatura');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar assinatura');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: '🎯', title: 'Valor Fixo Inteligente', desc: 'Controle seu orçamento mensal com média diária' },
    { icon: '💰', title: 'Guardar o Troco', desc: 'Arredonde gastos e economize automaticamente' },
    { icon: '📊', title: 'Meta de Economia', desc: 'Metas personalizadas baseadas na sua renda' },
    { icon: '🔔', title: 'Caçador de Assinaturas', desc: 'Alertas de renovação de serviços' },
    { icon: '🤖', title: 'Análise Preditiva', desc: 'IA que analisa seus padrões de gastos' },
    { icon: '📱', title: 'Suporte Prioritário', desc: 'Atendimento rápido e exclusivo' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Header */}
          <View className="items-center pt-8 pb-6 px-6">
            <View className="w-20 h-20 bg-warning/20 rounded-full items-center justify-center mb-4">
              <Text className="text-4xl">⭐</Text>
            </View>
            <Text className="text-3xl font-bold text-foreground text-center">
              Assistente Premium
            </Text>
            <Text className="text-base text-muted text-center mt-2">
              Desbloqueie todas as funcionalidades de IA para economizar mais
            </Text>
          </View>

          {/* Features */}
          <View className="px-6 mb-6">
            {features.map((feature, index) => (
              <View 
                key={index}
                className="flex-row items-center p-4 bg-surface rounded-xl mb-3"
              >
                <Text className="text-2xl mr-4">{feature.icon}</Text>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">
                    {feature.title}
                  </Text>
                  <Text className="text-sm text-muted">{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Plans */}
          <View className="px-6 mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Escolha seu plano
            </Text>

            {/* Yearly Plan */}
            <TouchableOpacity
              onPress={() => setSelectedPlan('yearly')}
              activeOpacity={0.8}
              style={{
                borderWidth: 2,
                borderColor: selectedPlan === 'yearly' ? colors.primary : colors.border,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                backgroundColor: selectedPlan === 'yearly' ? colors.primary + '10' : colors.surface,
              }}
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <View className="flex-row items-center">
                    <Text className="text-lg font-bold text-foreground">Anual</Text>
                    <View className="ml-2 px-2 py-1 bg-success rounded-full">
                      <Text className="text-xs text-white font-semibold">ECONOMIA 8%</Text>
                    </View>
                  </View>
                  <Text className="text-sm text-muted mt-1">R$ 9,17/mês</Text>
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold text-foreground">R$ 110</Text>
                  <Text className="text-sm text-muted">/ano</Text>
                </View>
              </View>
              {selectedPlan === 'yearly' && (
                <View 
                  className="absolute top-3 right-3 w-6 h-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-white text-sm">✓</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Monthly Plan */}
            <TouchableOpacity
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.8}
              style={{
                borderWidth: 2,
                borderColor: selectedPlan === 'monthly' ? colors.primary : colors.border,
                borderRadius: 16,
                padding: 16,
                backgroundColor: selectedPlan === 'monthly' ? colors.primary + '10' : colors.surface,
              }}
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-lg font-bold text-foreground">Mensal</Text>
                  <Text className="text-sm text-muted mt-1">Cancele quando quiser</Text>
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold text-foreground">R$ 9,99</Text>
                  <Text className="text-sm text-muted">/mês</Text>
                </View>
              </View>
              {selectedPlan === 'monthly' && (
                <View 
                  className="absolute top-3 right-3 w-6 h-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-white text-sm">✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {error ? (
            <Text className="text-error text-center px-6 mb-4">{error}</Text>
          ) : null}
        </ScrollView>

        {/* Bottom CTA */}
        <View 
          className="absolute bottom-0 left-0 right-0 p-6 bg-background"
          style={{ 
            borderTopWidth: 1, 
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === 'ios' ? 34 : 24,
          }}
        >
          <TouchableOpacity
            onPress={handleSubscribe}
            disabled={loading}
            activeOpacity={0.8}
            className="py-4 rounded-xl items-center"
            style={{ 
              backgroundColor: colors.primary,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">
                Assinar {selectedPlan === 'yearly' ? 'por R$ 110/ano' : 'por R$ 9,99/mês'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            className="py-3 items-center mt-2"
          >
            <Text className="text-muted">Talvez depois</Text>
          </TouchableOpacity>

          <Text className="text-xs text-muted text-center mt-2">
            Ao assinar, você concorda com os Termos de Uso e Política de Privacidade
          </Text>
        </View>
      </View>
    </Modal>
  );
}
