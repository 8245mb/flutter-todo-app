import { View, Text, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import type { Task } from '@/lib/types/task';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  const colors = useColors();

  // Calculate due date status
  const getDueDateStatus = () => {
    if (!task.dueDate) return null;
    
    const now = Date.now();
    const dueDate = task.dueDate;
    const diffMs = dueDate - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffMs < 0) {
      return { status: 'overdue', label: 'Atrasada', color: colors.error };
    } else if (diffHours < 24) {
      return { status: 'today', label: 'Hoje', color: colors.warning };
    } else if (diffDays < 7) {
      return { status: 'soon', label: `${Math.ceil(diffDays)} dias`, color: colors.primary };
    }
    return { status: 'future', label: new Date(dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), color: colors.muted };
  };

  const dueDateStatus = getDueDateStatus();

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle(task.id);
  };

  const handleEdit = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onEdit(task);
  };

  const handleDelete = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onDelete(task.id);
  };

  return (
    <View className="mb-3">
      <View className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-3">
        {/* Checkbox */}
        <Pressable
          onPress={handleToggle}
          style={({ pressed }) => [
            {
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: task.completed ? colors.success : colors.border,
              backgroundColor: task.completed ? colors.success : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          {task.completed && (
            <View style={{ width: 14, height: 14 }}>
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
            </View>
          )}
        </Pressable>

        {/* Task Content */}
        <Pressable
          onPress={handleEdit}
          style={({ pressed }) => ({
            flex: 1,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View className="gap-1">
            <Text
              className={cn(
                'text-base font-medium',
                task.completed ? 'text-muted line-through' : 'text-foreground'
              )}
            >
              {task.title}
            </Text>
            
            {dueDateStatus && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 4,
                }}
              >
                <View
                  style={{
                    backgroundColor: dueDateStatus.color + '20',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: dueDateStatus.color }}>
                    {dueDateStatus.label}
                  </Text>
                </View>
              </View>
            )}
            
            {task.description && (
            <Text
              className={cn(
                'text-sm mt-1',
                task.completed ? 'text-muted line-through' : 'text-muted'
              )}
              numberOfLines={2}
            >
              {task.description}
              </Text>
            )}
          </View>
        </Pressable>

        {/* Delete Button */}
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => ({
            padding: 8,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <IconSymbol name="chevron.right" size={20} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );
}
