/**
 * Card de Análise Preditiva
 * Mostra padrões detectados e sugestões
 */

import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { PredictiveSuggestion } from '@/lib/types/ai-modules';

interface PredictiveAnalysisCardProps {
  suggestions: PredictiveSuggestion[];
  onAccept: (suggestionId: string) => void;
  onReject: (suggestionId: string) => void;
  onIgnore: (suggestionId: string) => void;
}

export function PredictiveAnalysisCard({
  suggestions,
  onAccept,
  onReject,
  onIgnore,
}: PredictiveAnalysisCardProps) {
  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');

  const handleAction = (
    action: 'accept' | 'reject' | 'ignore',
    suggestionId: string
  ) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (action === 'accept') onAccept(suggestionId);
    else if (action === 'reject') onReject(suggestionId);
    else onIgnore(suggestionId);
  };

  const getTypeConfig = (type: PredictiveSuggestion['type']) => {
    switch (type) {
      case 'warning':
        return { icon: '⚠️', bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning' };
      case 'opportunity':
        return { icon: '💡', bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary' };
      case 'insight':
        return { icon: '📊', bg: 'bg-success/10', border: 'border-success/30', text: 'text-success' };
      default:
        return { icon: '📌', bg: 'bg-muted/10', border: 'border-muted/30', text: 'text-muted' };
    }
  };

  const getImpactLabel = (impact: PredictiveSuggestion['impact']) => {
    switch (impact) {
      case 'high':
        return 'Alto impacto';
      case 'medium':
        return 'Impacto médio';
      case 'low':
        return 'Baixo impacto';
      default:
        return '';
    }
  };

  if (pendingSuggestions.length === 0) {
    return (
      <View className="bg-surface rounded-2xl border border-border p-6">
        <View className="items-center">
          <Text className="text-4xl mb-3">📊</Text>
          <Text className="text-foreground font-semibold text-center mb-2">
            Análise Preditiva
          </Text>
          <Text className="text-muted text-center text-sm">
            Continue registrando seus gastos para receber análises e sugestões personalizadas.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <View className="p-4 border-b border-border flex-row items-center">
        <Text className="text-2xl mr-2">🧠</Text>
        <View>
          <Text className="text-foreground font-bold text-lg">
            Análise Preditiva
          </Text>
          <Text className="text-muted text-sm">
            {pendingSuggestions.length} sugestão(ões) para você
          </Text>
        </View>
      </View>

      {/* Sugestões */}
      {pendingSuggestions.map((suggestion) => {
        const config = getTypeConfig(suggestion.type);

        return (
          <View
            key={suggestion.id}
            className={`p-4 border-b border-border ${config.bg}`}
          >
            {/* Título */}
            <View className="flex-row items-center mb-2">
              <Text className="text-xl mr-2">{config.icon}</Text>
              <Text className={`font-semibold flex-1 ${config.text}`}>
                {suggestion.title}
              </Text>
              <View className="bg-background px-2 py-1 rounded-full">
                <Text className="text-xs text-muted">
                  {getImpactLabel(suggestion.impact)}
                </Text>
              </View>
            </View>

            {/* Descrição */}
            <Text className="text-foreground text-sm mb-3">
              {suggestion.description}
            </Text>

            {/* Ações sugeridas */}
            {suggestion.actionable && suggestion.actions && suggestion.actions.length > 0 && (
              <View className="flex-row flex-wrap mb-3">
                {suggestion.actions.map((action, index) => (
                  <View key={index} className="bg-background px-3 py-1 rounded-full mr-2 mb-1">
                    <Text className="text-xs text-muted">{action}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Botões de ação */}
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => handleAction('ignore', suggestion.id)}
                className="px-3 py-2 mr-2"
                accessibilityLabel="Ignorar sugestão"
                accessibilityRole="button"
              >
                <Text className="text-muted text-sm">Ignorar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAction('reject', suggestion.id)}
                className="px-3 py-2 mr-2"
                accessibilityLabel="Rejeitar sugestão"
                accessibilityRole="button"
              >
                <Text className="text-error text-sm">Rejeitar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAction('accept', suggestion.id)}
                className="bg-primary px-4 py-2 rounded-full"
                accessibilityLabel="Aceitar sugestão"
                accessibilityRole="button"
              >
                <Text className="text-background text-sm font-semibold">Aceitar</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* Nota de controle do usuário */}
      <View className="p-3 bg-muted/5">
        <Text className="text-muted text-xs text-center">
          Você tem controle total: aceite, rejeite ou ignore cada sugestão
        </Text>
      </View>
    </View>
  );
}
