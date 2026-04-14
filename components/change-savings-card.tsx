/**
 * Card de Guardar o Troco
 * Mostra economia acumulada pelo arredondamento
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { ChangeSavings } from '@/lib/types/ai-modules';

interface ChangeSavingsCardProps {
  savings: ChangeSavings;
}

export function ChangeSavingsCard({ savings }: ChangeSavingsCardProps) {
  const hasData = savings.transactionCount > 0;

  return (
    <View className="bg-surface rounded-2xl border border-border p-6">
      {hasData ? (
        <>
          {/* Total Economizado */}
          <View className="items-center mb-4">
            <Text className="text-4xl mb-2">🪙</Text>
            <Text className="text-3xl font-bold text-success">
              R$ {savings.totalSaved.toFixed(2)}
            </Text>
            <Text className="text-muted text-sm mt-1">
              Total economizado
            </Text>
          </View>

          {/* Estatísticas */}
          <View className="flex-row justify-around pt-4 border-t border-border">
            <View className="items-center">
              <Text className="text-foreground font-bold text-lg">
                {savings.transactionCount}
              </Text>
              <Text className="text-muted text-xs">
                Transações
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-foreground font-bold text-lg">
                R$ {savings.averageSaving.toFixed(2)}
              </Text>
              <Text className="text-muted text-xs">
                Média por transação
              </Text>
            </View>
          </View>

          {/* Dica */}
          <View className="bg-success/10 p-3 rounded-xl mt-4">
            <Text className="text-success text-sm text-center">
              💡 A cada gasto, arredondamos para cima e guardamos a diferença!
            </Text>
          </View>
        </>
      ) : (
        <View className="items-center">
          <Text className="text-4xl mb-3">🪙</Text>
          <Text className="text-foreground font-semibold text-center mb-2">
            Guardar o Troco
          </Text>
          <Text className="text-muted text-center text-sm">
            Quando você adicionar gastos, vamos arredondar para cima
            e guardar a diferença automaticamente.
          </Text>
          <View className="bg-primary/10 p-3 rounded-xl mt-4 w-full">
            <Text className="text-primary text-sm text-center">
              Exemplo: Gasto de R$ 23,40 → Arredonda para R$ 24,00 → Guarda R$ 0,60
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
