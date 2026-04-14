import { View, Text } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import type { ExpenseSummary } from '@/lib/types/expense';
import { CATEGORY_LABELS, CATEGORY_COLORS, CURRENCY_SYMBOLS } from '@/lib/types/expense';
import Svg, { Circle, G } from 'react-native-svg';

interface ExpenseChartProps {
  summary: ExpenseSummary;
}

/**
 * ExpenseChart Component
 * Displays a pie chart showing expense distribution by category
 */
export function ExpenseChart({ summary }: ExpenseChartProps) {
  const colors = useColors();

  if (summary.total === 0) {
    return null;
  }

  const { byCategory, total, currency } = summary;

  // Calculate percentages
  const data = [
    {
      category: 'personal' as const,
      amount: byCategory.personal,
      percentage: (byCategory.personal / total) * 100,
    },
    {
      category: 'collective' as const,
      amount: byCategory.collective,
      percentage: (byCategory.collective / total) * 100,
    },
    {
      category: 'institutional' as const,
      amount: byCategory.institutional,
      percentage: (byCategory.institutional / total) * 100,
    },
  ].filter(item => item.amount > 0);

  // SVG pie chart parameters
  const size = 200;
  const strokeWidth = 40;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate stroke dash arrays for pie slices
  let currentOffset = 0;
  const slices = data.map(item => {
    const dashLength = (item.percentage / 100) * circumference;
    const slice = {
      ...item,
      dashArray: `${dashLength} ${circumference}`,
      dashOffset: -currentOffset,
      rotation: (currentOffset / circumference) * 360 - 90,
    };
    currentOffset += dashLength;
    return slice;
  });

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
      }}
      accessibilityLabel="Gráfico de distribuição de gastos por categoria"
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: colors.foreground,
          marginBottom: 16,
        }}
      >
        Distribuição por Categoria
      </Text>

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${center}, ${center}`}>
            {slices.map((slice, index) => (
              <Circle
                key={slice.category}
                cx={center}
                cy={center}
                r={radius}
                stroke={CATEGORY_COLORS[slice.category]}
                strokeWidth={strokeWidth}
                strokeDasharray={slice.dashArray}
                strokeDashoffset={slice.dashOffset}
                fill="none"
                strokeLinecap="round"
              />
            ))}
          </G>
        </Svg>
      </View>

      {/* Legend */}
      <View style={{ gap: 12 }}>
        {data.map(item => (
          <View
            key={item.category}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            accessibilityLabel={`${CATEGORY_LABELS[item.category]}: ${CURRENCY_SYMBOLS[currency]} ${item.amount.toFixed(2)}, ${item.percentage.toFixed(1)}% do total`}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: CATEGORY_COLORS[item.category],
                  marginRight: 10,
                }}
              />
              <Text
                style={{
                  fontSize: 15,
                  color: colors.foreground,
                  fontWeight: '500',
                }}
              >
                {CATEGORY_LABELS[item.category]}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.foreground,
                }}
              >
                {CURRENCY_SYMBOLS[currency]} {item.amount.toFixed(2)}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.muted,
                }}
              >
                {item.percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
