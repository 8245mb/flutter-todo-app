/**
 * Card de Valor Fixo Inteligente
 * Mostra progresso do orçamento e recomendações
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { FixedBudget } from '@/lib/types/ai-modules';
import { FixedBudgetService } from '@/lib/services/fixed-budget-service';

interface FixedBudgetCardProps {
  budget: FixedBudget;
  onEdit: () => void;
}

export function FixedBudgetCard({ budget, onEdit }: FixedBudgetCardProps) {
  const progress = FixedBudgetService.calculateProgress(budget);

  const statusColors = {
    good: { bg: 'bg-success/10', text: 'text-success', bar: 'bg-success' },
    warning: { bg: 'bg-warning/10', text: 'text-warning', bar: 'bg-warning' },
    danger: { bg: 'bg-error/10', text: 'text-error', bar: 'bg-error' },
  };

  const colors = statusColors[progress.status];
  const activeRecommendations = budget.recommendations.filter((r) => !r.dismissed);

  return (
    <View className="bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <View className="p-4 flex-row justify-between items-center border-b border-border">
        <View>
          <Text className="text-foreground font-bold text-lg">
            R$ {budget.currentSpent.toFixed(2)}
          </Text>
          <Text className="text-muted text-sm">
            de R$ {budget.monthlyLimit.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onEdit}
          className="p-2"
          accessibilityLabel="Editar orçamento"
          accessibilityRole="button"
        >
          <Text className="text-primary">Editar</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de Progresso */}
      <View className="p-4">
        <View className="h-4 bg-border rounded-full overflow-hidden">
          <View
            className={`h-full ${colors.bar} rounded-full`}
            style={{ width: `${progress.percentUsed}%` }}
          />
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className={`text-sm ${colors.text}`}>
            {progress.statusMessage}
          </Text>
          <Text className="text-muted text-sm">
            {Math.round(progress.percentUsed)}%
          </Text>
        </View>
      </View>

      {/* Média Diária */}
      <View className={`p-4 ${colors.bg}`}>
        <View className="flex-row items-center">
          <Text className="text-3xl mr-3">📊</Text>
          <View className="flex-1">
            <Text className={`font-bold text-lg ${colors.text}`}>
              R$ {budget.dailyAverage.toFixed(2)}/dia
            </Text>
            <Text className="text-muted text-sm">
              Média segura para os próximos {budget.daysRemaining} dias
            </Text>
          </View>
        </View>
      </View>

      {/* Recomendações */}
      {activeRecommendations.length > 0 && (
        <View className="p-4 border-t border-border">
          {activeRecommendations.slice(0, 2).map((rec) => (
            <View
              key={rec.id}
              className={`p-3 rounded-xl mb-2 ${
                rec.type === 'warning' ? 'bg-warning/10' :
                rec.type === 'success' ? 'bg-success/10' : 'bg-primary/10'
              }`}
            >
              <Text className={`text-sm ${
                rec.type === 'warning' ? 'text-warning' :
                rec.type === 'success' ? 'text-success' : 'text-primary'
              }`}>
                {rec.type === 'warning' ? '⚠️' : rec.type === 'success' ? '✅' : '💡'} {rec.message}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
