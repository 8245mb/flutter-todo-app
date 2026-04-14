/**
 * Card de Meta de Economia
 * Mostra progresso da meta e sugestão mensal
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { SavingsGoal } from '@/lib/types/ai-modules';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onEdit: () => void;
}

export function SavingsGoalCard({ goal, onEdit }: SavingsGoalCardProps) {
  const deadlineDate = new Date(goal.deadline);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));

  const isCompleted = goal.status === 'completed';
  const isOnTrack = goal.progress >= (100 - (daysRemaining / 365) * 100);

  return (
    <View className="bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <View className="p-4 flex-row justify-between items-center border-b border-border">
        <View>
          <Text className="text-foreground font-bold text-lg">
            R$ {goal.currentAmount.toFixed(2)}
          </Text>
          <Text className="text-muted text-sm">
            de R$ {goal.targetAmount.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onEdit}
          className="p-2"
          accessibilityLabel="Editar meta"
          accessibilityRole="button"
        >
          <Text className="text-primary">Editar</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de Progresso */}
      <View className="p-4">
        <View className="h-4 bg-border rounded-full overflow-hidden">
          <View
            className={`h-full ${isCompleted ? 'bg-success' : 'bg-primary'} rounded-full`}
            style={{ width: `${goal.progress}%` }}
          />
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className={`text-sm ${isCompleted ? 'text-success' : isOnTrack ? 'text-primary' : 'text-warning'}`}>
            {isCompleted ? '🎉 Meta alcançada!' : isOnTrack ? 'No caminho certo' : 'Precisa acelerar'}
          </Text>
          <Text className="text-muted text-sm">
            {Math.round(goal.progress)}%
          </Text>
        </View>
      </View>

      {/* Sugestão Mensal */}
      {!isCompleted && (
        <View className="p-4 bg-primary/10">
          <View className="flex-row items-center">
            <Text className="text-3xl mr-3">💡</Text>
            <View className="flex-1">
              <Text className="text-primary font-bold text-lg">
                R$ {goal.suggestedMonthlyContribution.toFixed(2)}/mês
              </Text>
              <Text className="text-muted text-sm">
                Sugestão para alcançar a meta em {monthsRemaining} {monthsRemaining === 1 ? 'mês' : 'meses'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Prazo */}
      <View className="p-4 border-t border-border">
        <View className="flex-row justify-between">
          <Text className="text-muted">Prazo</Text>
          <Text className="text-foreground">
            {deadlineDate.toLocaleDateString('pt-BR')} ({daysRemaining} dias)
          </Text>
        </View>
      </View>

      {/* Celebração */}
      {isCompleted && (
        <View className="p-4 bg-success/10">
          <Text className="text-success text-center font-semibold">
            🎊 Parabéns! Você alcançou sua meta de economia!
          </Text>
        </View>
      )}
    </View>
  );
}
