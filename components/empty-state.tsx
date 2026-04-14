import { View, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';

export function EmptyState() {
  const colors = useColors();

  return (
    <View className="flex-1 items-center justify-center p-8">
      <View className="items-center gap-4">
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 48, color: colors.muted }}>📋</Text>
        </View>
        
        <View className="items-center gap-2">
          <Text className="text-xl font-bold text-foreground">
            Nenhuma tarefa ainda
          </Text>
          <Text className="text-base text-muted text-center">
            Toque no botão + para adicionar sua primeira tarefa
          </Text>
        </View>
      </View>
    </View>
  );
}
