import { useEffect, useCallback } from 'react';
import { View, Text, Pressable, Platform, Alert, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '@/components/screen-container';
import { ExpenseItem } from '@/components/expense-item';
import { ExpenseChart } from '@/components/expense-chart';
import { useColors } from '@/hooks/use-colors';
import { useExpenses } from '@/lib/contexts/expense-context';
import type { Expense } from '@/lib/types/expense';
import { useRouter } from 'expo-router';
import { CURRENCY_SYMBOLS } from '@/lib/types/expense';

export default function ExpensesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { expenses, isLoading, error, summary, loadExpenses, deleteExpense, clearError } =
    useExpenses();

  // Load expenses on mount and when screen comes into focus
  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses])
  );

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handlePressExpense = (expense: Expense) => {
    router.push({
      pathname: '/expense-form' as any,
      params: { expenseId: expense.id },
    });
  };

  const handleDeleteExpense = (id: string) => {
    if (Platform.OS === 'web') {
      if (confirm('Tem certeza que deseja deletar este gasto?')) {
        performDelete(id);
      }
    } else {
      Alert.alert('Deletar Gasto', 'Tem certeza que deseja deletar este gasto?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: () => performDelete(id),
        },
      ]);
    }
  };

  const performDelete = async (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await deleteExpense(id);
  };

  const handleAddExpense = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/expense-form' as any);
  };

  const formattedTotal = `${CURRENCY_SYMBOLS[summary.currency]} ${summary.total.toFixed(2)}`;

  return (
    <ScreenContainer className="relative">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-3">
          <Text
            className="text-3xl font-bold text-foreground"
            accessibilityRole="header"
            accessibilityLabel="Gastos das Tarefas"
          >
            Gastos das Tarefas
          </Text>
          <Text className="text-sm text-muted mt-1">
            Controle seus gastos de forma simples e organizada
          </Text>
          {error && (
            <View className="mt-2 p-3 bg-error/10 rounded-lg">
              <Text className="text-error text-sm">{error}</Text>
            </View>
          )}
        </View>

        {/* Summary Card */}
        {summary.count > 0 && (
          <View className="px-6 pb-3">
            <View
              style={{
                backgroundColor: colors.primary,
                borderRadius: 20,
                padding: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
              accessibilityLabel={`Total de gastos: ${formattedTotal}`}
            >
              <Text style={{ color: '#ffffff', fontSize: 14, opacity: 0.9, marginBottom: 4 }}>
                Total Gasto
              </Text>
              <Text style={{ color: '#ffffff', fontSize: 32, fontWeight: '700', lineHeight: 40 }}>
                {formattedTotal}
              </Text>
              <Text style={{ color: '#ffffff', fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                {summary.count} {summary.count === 1 ? 'registro' : 'registros'}
              </Text>
            </View>
          </View>
        )}

        {/* Chart - Agora rola junto com o conteúdo */}
        {summary.count > 0 && (
          <View className="px-6 mb-4">
            <ExpenseChart summary={summary} />
          </View>
        )}

        {/* Expense List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-muted">Carregando...</Text>
          </View>
        ) : expenses.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 py-20">
            <Text
              className="text-6xl mb-4"
              accessibilityLabel="Ícone de carteira vazia"
              accessibilityRole="image"
            >
              💰
            </Text>
            <Text className="text-xl font-semibold text-foreground mb-2 text-center">
              Nenhum gasto registrado
            </Text>
            <Text className="text-muted text-center">
              Comece a registrar seus gastos para ter controle financeiro das suas tarefas
            </Text>
          </View>
        ) : (
          <View className="px-6">
            {/* Título da seção de gastos */}
            <Text className="text-lg font-semibold text-foreground mb-3">
              Seus Gastos
            </Text>
            {/* Lista de gastos usando map ao invés de FlatList */}
            {expenses.map((item) => (
              <ExpenseItem
                key={item.id}
                expense={item}
                onPress={handlePressExpense}
                onDelete={handleDeleteExpense}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <View
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
        }}
      >
        <Pressable
          onPress={handleAddExpense}
          accessibilityLabel="Adicionar novo gasto"
          accessibilityRole="button"
          accessibilityHint="Toque para registrar um novo gasto"
          style={({ pressed }) => ({
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Text style={{ color: '#ffffff', fontSize: 36, fontWeight: '300', lineHeight: 40 }}>
            +
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
