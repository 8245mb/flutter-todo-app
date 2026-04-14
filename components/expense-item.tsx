import { View, Text, Pressable } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import type { Expense } from '@/lib/types/expense';
import { CURRENCY_SYMBOLS, CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/types/expense';

interface ExpenseItemProps {
  expense: Expense;
  onPress: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

/**
 * ExpenseItem Component
 * Displays a single expense in the list with accessible design
 */
export function ExpenseItem({ expense, onPress, onDelete }: ExpenseItemProps) {
  const colors = useColors();

  const formattedDate = new Date(expense.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedAmount = `${CURRENCY_SYMBOLS[expense.currency]} ${expense.amount.toFixed(2)}`;

  return (
    <Pressable
      onPress={() => onPress(expense)}
      onLongPress={() => onDelete(expense.id)}
      accessibilityLabel={`Gasto: ${expense.description}, ${formattedAmount}, categoria ${CATEGORY_LABELS[expense.category]}`}
      accessibilityHint="Toque para editar, pressione e segure para deletar"
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: CATEGORY_COLORS[expense.category],
        opacity: pressed ? 0.7 : 1,
        minHeight: 80, // Larger touch target for accessibility
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Left side: Description and category */}
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.foreground,
              marginBottom: 4,
              lineHeight: 22, // Better readability
            }}
            numberOfLines={2}
          >
            {expense.description}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <View
              style={{
                backgroundColor: CATEGORY_COLORS[expense.category],
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                {CATEGORY_LABELS[expense.category]}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: colors.muted,
                marginLeft: 8,
              }}
            >
              {formattedDate}
            </Text>
          </View>
        </View>

        {/* Right side: Amount */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.foreground,
              lineHeight: 26,
            }}
          >
            {formattedAmount}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
